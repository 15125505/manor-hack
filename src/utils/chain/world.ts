import { MiniKit } from "@worldcoin/minikit-js";
import { gServer } from "../server";
import { ChainBase, type ManorInfo, type UserToken, type TransactionResult } from "./chainBase";
import ScallionManorAbi from "../../abi/ScallionManor.json";
import { gData } from "../data";
import { createPublicClient, http, formatUnits, parseUnits } from "viem";
import i18n from "../../i18n";
import { worldchain } from "viem/chains";
import { readContract } from "viem/actions";

const publicClient = createPublicClient({
    chain: worldchain,
    transport: http(),
});

// Permit2转账参数类型
type Permit2TransferArgs = [string, string]; // [token, amount]
type PermitTransferForm = [Permit2TransferArgs, string, string]; // [[token, amount], nonce, deadline]

// 交易参数的联合类型
type TransactionArg =
    | string
    | number
    | boolean
    | string[]
    | PermitTransferForm
    | "PERMIT_TRANSFER_PLACEHOLDER"
    | "PERMIT2_SIGNATURE_PLACEHOLDER";

// MiniKit交易对象类型
interface MiniKitTransaction {
    address: string;
    abi: any;
    functionName: string;
    args: (TransactionArg | string)[];
}

// Permit2对象类型
interface Permit2Config {
    permitted: {
        token: string;
        amount: string;
    };
    nonce: string;
    deadline: string;
    spender: string;
}

// 精简版ERC20 ABI
const ERC20_ABI = [
    {
        constant: true,
        inputs: [{ name: "owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ name: "", type: "uint256" }],
        type: "function",
    },
    {
        constant: true,
        inputs: [],
        name: "decimals",
        outputs: [{ name: "", type: "uint8" }],
        type: "function",
    },
];

class ZWorld extends ChainBase {
    isValid(): boolean {
        return MiniKit.isInstalled();
    }

    async getUserInfo(): Promise<{
        userTokens: UserToken[];
    }> {
        gServer.log("获取用户资产信息...");
        const userAddress = this.getCurrentAccount();
        const [wldBal, wbtcBal] = await Promise.all([
            readContract(publicClient, {
                address: this.wldTokenAddress,
                abi: ERC20_ABI,
                functionName: "balanceOf",
                args: [userAddress],
            }),
            readContract(publicClient, {
                address: this.wbtcTokenAddress,
                abi: ERC20_ABI,
                functionName: "balanceOf",
                args: [userAddress],
            }),
        ]);
        const wldBalance = Number(formatUnits(wldBal as bigint, 18));
        const wbtcBalance = Number(formatUnits(wbtcBal as bigint, 8));
        gServer.info("用户资产信息", { WLD: wldBalance, WBTC: wbtcBalance });
        return {
            userTokens: [
                {
                    token: this.wldTokenAddress,
                    amount: wldBalance,
                },
                {
                    token: this.wbtcTokenAddress,
                    amount: wbtcBalance,
                },
            ],
        };
    }

    async getManorInfo(userAddress: string): Promise<ManorInfo> {
        // 并行执行所有合约调用以提升性能
        const [result, withdrawer, isActive] = await Promise.all([
            readContract(publicClient, {
                address: this.contractAddress,
                abi: ScallionManorAbi.abi,
                functionName: "getManorInfo",
                args: [userAddress],
            }) as Promise<[boolean, bigint, bigint, bigint, string[], string]>,

            readContract(publicClient, {
                address: this.contractAddress,
                abi: ScallionManorAbi.abi,
                functionName: "getWithdrawer",
                args: [userAddress],
            }) as Promise<string>,

            readContract(publicClient, {
                address: this.contractAddress,
                abi: ScallionManorAbi.abi,
                functionName: "isUserActive",
                args: [userAddress],
            }) as Promise<boolean>
        ]);

        const [hasAccess, wbtcBalance, unlockTime, lastActiveTime, inheritors, name] = result;

        return {
            hasAccess,
            wbtcBalance: Number(formatUnits(wbtcBalance, 8)),
            unlockTime: Number(unlockTime),
            lastActiveTime: Number(lastActiveTime),
            inheritors,
            isActive,
            withdrawer,
            name,
        };
    }

    async getManorAccessPrice(): Promise<number> {
        const price = (await readContract(publicClient, {
            address: this.contractAddress,
            abi: ScallionManorAbi.abi,
            functionName: "manorAccessPrice",
        })) as bigint;
        return Number(formatUnits(price, 18));
    }

    async getForceChangeFee(): Promise<number> {
        const fee = (await readContract(publicClient, {
            address: this.contractAddress,
            abi: ScallionManorAbi.abi,
            functionName: "forceChangeFee",
        })) as bigint;
        return Number(formatUnits(fee, 18));
    }

    async purchaseManorAccess(): Promise<TransactionResult> {
        gServer.log("开始购买庄园权限...");
        const price = await this.getManorAccessPrice();
        const amountStr = parseUnits(price.toString(), 18).toString();
        gServer.log(`购买庄园权限，价格:${price}WLD`);

        return await this.sendMiniKitTransaction({
            functionName: "purchaseManorAccess",
            args: [],
            permit2Token: this.wldTokenAddress,
            permit2Amount: amountStr,
            appendPermit2Args: true,
        });
    }

    async depositWBTC(wbtcAmount: number, lockPeriod: number): Promise<TransactionResult> {
        const amountStr = parseUnits(wbtcAmount.toString(), 8).toString();

        lockPeriod = 60; // todo: 未来需要删除的测试代码，强制锁定60秒

        return await this.sendMiniKitTransaction({
            functionName: "depositWBTC",
            args: [lockPeriod.toString()],
            permit2Token: this.wbtcTokenAddress,
            permit2Amount: amountStr,
            appendPermit2Args: true,
        });
    }

    async withdrawWBTC(): Promise<TransactionResult> {
        return await this.sendMiniKitTransaction({
            functionName: "withdrawWBTC",
            args: [],
            appendPermit2Args: true,
        });
    }

    async inheritWBTC(manorOwnerAddress: string): Promise<TransactionResult> {
        return await this.sendMiniKitTransaction({
            functionName: "inheritWBTC",
            args: [manorOwnerAddress],
            appendPermit2Args: true,
        });
    }

    async setInheritors(inheritors: string[], forceChange?: boolean, manorOwnerAddress?: string): Promise<TransactionResult> {
        const method = manorOwnerAddress ? "maintainInheritors" : "setInheritors";
        const args = manorOwnerAddress
            ? [manorOwnerAddress, inheritors, forceChange || false]
            : [inheritors, forceChange || false];

        const params: any = {
            functionName: method,
            args,
        };

        // 如果需要强制更改，添加手续费
        if (forceChange) {
            const fee = await this.getForceChangeFee();
            const amountStr = parseUnits(fee.toString(), 18).toString();
            params.permit2Token = this.wldTokenAddress;
            params.permit2Amount = amountStr;
        }

        // 为setInheritors添加appendPermit2Args参数
        params.appendPermit2Args = true;
        return await this.sendMiniKitTransaction(params);
    }

    async renameManor(newName: string): Promise<TransactionResult> {
        return await this.sendMiniKitTransaction({
            functionName: "setManorName",
            args: [newName],
            appendPermit2Args: true,
        });
    }

    async refreshActivity(): Promise<TransactionResult> {
        return await this.sendMiniKitTransaction({
            functionName: "refreshActivity",
            args: [],
            appendPermit2Args: true,
        });
    }

    async tipDeveloper(wldAmount: number, message: string): Promise<TransactionResult> {
        const amountStr = parseUnits(wldAmount.toString(), 18).toString();

        return await this.sendMiniKitTransaction({
            functionName: "tipDeveloper",
            args: ["PERMIT_TRANSFER_PLACEHOLDER", "PERMIT2_SIGNATURE_PLACEHOLDER", message],
            permit2Token: this.wldTokenAddress,
            permit2Amount: amountStr,
            appendPermit2Args: false,
        });
    }

    /**
     * 钱包授权登录，获取用户钱包地址
     */
    async login(): Promise<string> {
        // 获取nonce（此处简单生成，实际可从后端获取）
        const nonce = Math.random().toString(36).slice(2, 12);
        const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
            nonce,
            statement: "Login to use ScallionManor",
            expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            notBefore: new Date(Date.now() - 24 * 60 * 60 * 1000),
        });
        if (finalPayload.status === "error") {
            throw new Error("User not authorized to login");
        }

        // 钱包地址
        return finalPayload.address;
    }

    /**
     * 获取当前钱包地址
     */
    getCurrentAccount(): string {
        return gData.userAddress;
    }

    // 私有方法：发送MiniKit交易
    private async sendMiniKitTransaction(params: {
        functionName: string; // 合约方法名
        args: TransactionArg[]; // 方法参数
        permit2Token?: string; // 需要授权的Token地址
        permit2Amount?: string; // 需要授权的Token数量（字符串格式）
        appendPermit2Args: boolean; // 是否自动追加permit2参数，必须明确指定
    }): Promise<TransactionResult> {
        // 构建交易对象
        const transaction: MiniKitTransaction = {
            address: this.contractAddress,
            abi: ScallionManorAbi.abi,
            functionName: params.functionName,
            args: params.args,
        };

        // 构建MiniKit交易参数
        const miniKitParams: {
            transaction: MiniKitTransaction[];
            permit2?: Permit2Config[];
        } = {
            transaction: [transaction],
        };

        // 如果需要Permit2授权
        if (params.permit2Token && params.permit2Amount) {
            const deadline = Math.floor((Date.now() + 30 * 60 * 1000) / 1000).toString(); // 30分钟后过期
            const nonce = Date.now().toString();
            const permit2: Permit2Config[] = [
                {
                    permitted: {
                        token: params.permit2Token,
                        amount: params.permit2Amount,
                    },
                    nonce,
                    deadline,
                    spender: this.contractAddress,
                },
            ];

            // 构建permit transfer参数
            const permitTransferArgsForm: PermitTransferForm = [
                [params.permit2Token, params.permit2Amount],
                nonce,
                deadline,
            ];

            // 根据appendPermit2Args参数决定是否自动追加permit2参数
            if (params.appendPermit2Args) {
                transaction.args = transaction.args.concat([permitTransferArgsForm, "PERMIT2_SIGNATURE_PLACEHOLDER_0"]);
            } else {
                // 如果不自动追加，则替换占位符
                transaction.args = transaction.args.map((arg: TransactionArg) => {
                    if (arg === "PERMIT_TRANSFER_PLACEHOLDER") {
                        return permitTransferArgsForm;
                    }
                    if (arg === "PERMIT2_SIGNATURE_PLACEHOLDER") {
                        return "PERMIT2_SIGNATURE_PLACEHOLDER_0";
                    }
                    return arg;
                });
            }

            miniKitParams.permit2 = permit2;
        }

        gServer.warn("发送交易", miniKitParams);
        const res = await MiniKit.commandsAsync.sendTransaction(miniKitParams);
        if (res?.finalPayload?.status !== "success") {
            gServer.error("交易发送失败", res);
            throw new Error(`${res?.finalPayload?.status} - ${res?.finalPayload?.error_code}`);
        }
        gServer.warn("交易发送成功", res);

        // 获取transaction_id
        const { transaction_id, mini_app_id } = res.finalPayload;
        if (!transaction_id || !mini_app_id) {
            gServer.error("交易ID获取失败", res);
            throw new Error(i18n.t("errors.transactionIdMissing"));
        }

        // 直接返回交易ID，不等待区块确认
        return { transaction_id, mini_app_id };
    }

    /**
     * 检查交易是否已在区块链上确认
     * @param transaction_id 交易ID
     * @param mini_app_id MiniApp ID
     * @returns Promise<boolean> 交易是否已确认
     */
    async checkTransactionConfirmation(transaction_id: string, mini_app_id: string): Promise<boolean> {
        try {
            const res = await fetch(
                `https://developer.worldcoin.org/api/v2/minikit/transaction/${transaction_id}?app_id=${mini_app_id}&type=transaction`,
            );
            const data = await res.json();

            if (data.transactionStatus === "mined") {
                gServer.info("交易已在区块链上确认成功", { transaction_id, status: data.transactionStatus });
                return true;
            } else if (data.transactionStatus === "pending") {
                gServer.log("交易仍在等待区块确认", { transaction_id, status: data.transactionStatus });
                return false;
            } else {
                gServer.error("交易确认失败", { transaction_id, status: data.transactionStatus, data });
                throw new Error(`交易确认失败: ${data.transactionStatus}`);
            }
        } catch (error) {
            gServer.error("检查交易状态时出错", { transaction_id, error });
            throw error;
        }
    }

    /**
     * 等待交易确认（带重试机制）
     * @param transaction_id 交易ID
     * @param mini_app_id MiniApp ID
     * @param maxRetries 最大重试次数，默认10次
     * @param retryInterval 重试间隔，默认1000ms
     * @returns Promise<void> 确认完成后返回
     */
    async waitForTransactionConfirmation(
        transaction_id: string,
        mini_app_id: string,
        maxRetries: number = 10,
        retryInterval: number = 1000
    ): Promise<void> {
        for (let i = 0; i < maxRetries; i++) {
            const isConfirmed = await this.checkTransactionConfirmation(transaction_id, mini_app_id);
            if (isConfirmed) {
                return;
            }

            if (i < maxRetries - 1) {
                await new Promise((resolve) => setTimeout(resolve, retryInterval));
            }
        }

        throw new Error(`交易在 ${maxRetries} 次重试后仍未确认`);
    }
}

export const gWorld = new ZWorld();
