import type { WalletClient } from "viem";
import {
    createWalletClient,
    custom,
    formatUnits,
    createPublicClient,
    http,
    encodeFunctionData,
    parseUnits,
} from "viem";
import { worldchain } from "viem/chains";
import { readContract } from "viem/actions";
import { ChainBase, type ManorInfo, type UserToken, type TransactionResult } from "./chainBase";
import { SignatureTransfer } from "@uniswap/permit2-sdk";
import ScallionManorAbi from "../../abi/ScallionManor.json";

const publicClient = createPublicClient({
    chain: worldchain,
    transport: http(),
});

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

class ZMetaMask extends ChainBase {

    private _client: WalletClient | null = null;

    isValid(): boolean {
        return (window as any).ethereum !== undefined;
    }

    async getUserInfo(): Promise<{
        userTokens: UserToken[];
    }> {
        const acc = await this.getAccount();

        // 获取WLD余额
        const wldBal = await readContract(publicClient, {
            address: this.wldTokenAddress,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [acc],
        });
        const wldBalance = Number(formatUnits(wldBal as bigint, 18));

        // 获取WBTC余额
        const wbtcBal = await readContract(publicClient, {
            address: this.wbtcTokenAddress,
            abi: ERC20_ABI,
            functionName: "balanceOf",
            args: [acc],
        });
        const wbtcBalance = Number(formatUnits(wbtcBal as bigint, 8));
        console.log('--用户WLD余额:', wldBalance);
        console.log('--用户WBTC余额:', wbtcBalance);

        return {
            userTokens: [
                {
                    token: this.wldTokenAddress,
                    amount: wldBalance,
                },
                {
                    token: this.wbtcTokenAddress,
                    amount: wbtcBalance,
                }
            ]
        };
    }

    async getManorInfo(userAddress: string): Promise<ManorInfo> {

        console.log("--查看庄园信息:", userAddress);

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

        console.log('--庄园信息:', result);
        console.log('--当前有权提取资金的地址:', withdrawer);
        console.log('--用户是否活跃:', isActive);

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
        const price = await readContract(publicClient, {
            address: this.contractAddress,
            abi: ScallionManorAbi.abi,
            functionName: "manorAccessPrice",
        }) as bigint;
        return Number(formatUnits(price, 18));
    }

    async getForceChangeFee(): Promise<number> {
        const fee = await readContract(publicClient, {
            address: this.contractAddress,
            abi: ScallionManorAbi.abi,
            functionName: "forceChangeFee",
        }) as bigint;
        return Number(formatUnits(fee, 18));
    }

    async purchaseManorAccess(): Promise<TransactionResult> {
        const acc = await this.getAccount();
        const price = await this.getManorAccessPrice();
        const amount = parseUnits(price.toString(), 18);

        const permit = await this.createPermit2Signature(
            this.wldTokenAddress,
            amount,
            acc
        );

        const data = encodeFunctionData({
            abi: ScallionManorAbi.abi,
            functionName: "purchaseManorAccess",
            args: [permit.permitData, permit.signature],
        });

        const txHash = await this.client.sendTransaction({
            chain: this.chain,
            account: acc,
            to: this.contractAddress,
            data,
            gas: 500000n,
        });
        console.log('--购买庄园访问权限交易哈希:', txHash);

        return {
            transaction_id: txHash,
            mini_app_id: "metamask_app_id"
        };
    }

    async depositWBTC(wbtcAmount: number, lockPeriod: number): Promise<TransactionResult> {
        const acc = await this.getAccount();
        const amount = parseUnits(wbtcAmount.toString(), 8);

        const permit = await this.createPermit2Signature(
            this.wbtcTokenAddress,
            amount,
            acc
        );

        const data = encodeFunctionData({
            abi: ScallionManorAbi.abi,
            functionName: "depositWBTC",
            args: [lockPeriod, permit.permitData, permit.signature],
        });

        const txHash = await this.client.sendTransaction({
            chain: this.chain,
            account: acc,
            to: this.contractAddress,
            data,
            gas: 500000n,
        });
        console.log('--存入WBTC交易哈希:', txHash);

        return {
            transaction_id: txHash,
            mini_app_id: "metamask_app_id"
        };
    }

    async withdrawWBTC(): Promise<TransactionResult> {
        const acc = await this.getAccount();

        const data = encodeFunctionData({
            abi: ScallionManorAbi.abi,
            functionName: "withdrawWBTC",
            args: [],
        });

        const txHash = await this.client.sendTransaction({
            chain: this.chain,
            account: acc,
            to: this.contractAddress,
            data,
        });
        console.log('--提取WBTC交易哈希:', txHash);

        return {
            transaction_id: txHash,
            mini_app_id: "metamask_app_id"
        };
    }

    async inheritWBTC(manorOwnerAddress: string): Promise<TransactionResult> {
        const acc = await this.getAccount();

        const data = encodeFunctionData({
            abi: ScallionManorAbi.abi,
            functionName: "inheritWBTC",
            args: [manorOwnerAddress],
        });

        const txHash = await this.client.sendTransaction({
            chain: this.chain,
            account: acc,
            to: this.contractAddress,
            data,
        });
        console.log('--继承WBTC交易哈希:', txHash);

        return {
            transaction_id: txHash,
            mini_app_id: "metamask_app_id"
        };
    }

    async setInheritors(
        inheritors: string[],
        forceChange?: boolean,
        manorOwnerAddress?: string
    ): Promise<TransactionResult> {
        const acc = await this.getAccount();
        let data: `0x${string}`;

        if (manorOwnerAddress) {
            // 维护他人庄园的继承人
            if (forceChange) {
                const fee = await this.getForceChangeFee();
                const amount = parseUnits(fee.toString(), 18);
                const permit = await this.createPermit2Signature(
                    this.wldTokenAddress,
                    amount,
                    acc
                );

                data = encodeFunctionData({
                    abi: ScallionManorAbi.abi,
                    functionName: "maintainInheritors",
                    args: [manorOwnerAddress, inheritors, forceChange, permit.permitData, permit.signature],
                });
            } else {
                data = encodeFunctionData({
                    abi: ScallionManorAbi.abi,
                    functionName: "maintainInheritors",
                    args: [manorOwnerAddress, inheritors, false, { permitted: { token: this.wldTokenAddress, amount: 0n }, nonce: 0n, deadline: 0n }, "0x"],
                });
            }
        } else {
            // 设置自己的继承人
            if (forceChange) {
                const fee = await this.getForceChangeFee();
                const amount = parseUnits(fee.toString(), 18);
                const permit = await this.createPermit2Signature(
                    this.wldTokenAddress,
                    amount,
                    acc
                );

                data = encodeFunctionData({
                    abi: ScallionManorAbi.abi,
                    functionName: "setInheritors",
                    args: [inheritors, forceChange, permit.permitData, permit.signature],
                });
            } else {
                data = encodeFunctionData({
                    abi: ScallionManorAbi.abi,
                    functionName: "setInheritors",
                    args: [inheritors, false, { permitted: { token: this.wldTokenAddress, amount: 0n }, nonce: 0n, deadline: 0n }, "0x"],
                });
            }
        }

        const txHash = await this.client.sendTransaction({
            chain: this.chain,
            account: acc,
            to: this.contractAddress,
            data,
            gas: 500000n,
        });
        console.log('--设置继承人交易哈希:', txHash);

        return {
            transaction_id: txHash,
            mini_app_id: "metamask_app_id"
        };
    }

    async refreshActivity(): Promise<TransactionResult> {
        const acc = await this.getAccount();

        const data = encodeFunctionData({
            abi: ScallionManorAbi.abi,
            functionName: "refreshActivity",
            args: [],
        });

        const txHash = await this.client.sendTransaction({
            chain: this.chain,
            account: acc,
            to: this.contractAddress,
            data,
        });
        console.log('--刷新活跃状态交易哈希:', txHash);

        return {
            transaction_id: txHash,
            mini_app_id: "metamask_app_id"
        };
    }

    async tipDeveloper(wldAmount: number, message: string): Promise<TransactionResult> {
        const acc = await this.getAccount();
        const amount = parseUnits(wldAmount.toString(), 18);

        const permit = await this.createPermit2Signature(
            this.wldTokenAddress,
            amount,
            acc
        );

        const data = encodeFunctionData({
            abi: ScallionManorAbi.abi,
            functionName: "tipDeveloper",
            args: [permit.permitData, permit.signature, message],
        });

        const txHash = await this.client.sendTransaction({
            chain: this.chain,
            account: acc,
            to: this.contractAddress,
            data,
            gas: 500000n,
        });
        console.log('--打赏开发者交易哈希:', txHash);

        return {
            transaction_id: txHash,
            mini_app_id: "metamask_app_id"
        };
    }

    /**
     * MetaMask钱包登录，获取用户钱包地址
     */
    async login(): Promise<string> {
        try {
            // 请求连接钱包并获取账户
            const account = await this.getAccount();
            console.log("MetaMask登录成功，获得地址:", account);

            // 模拟延迟1秒
            await new Promise((resolve) => setTimeout(resolve, 100));

            return account;
        } catch (error) {
            console.error("MetaMask登录失败:", error);
            throw new Error(`MetaMask登录失败: ${error}`);
        }
    }

    // 私有方法：获取以太坊对象
    private get ethereum() {
        return (window as any).ethereum;
    }

    // 私有方法：获取钱包客户端
    private get client() {
        if (!this.ethereum) {
            throw new Error("请先安装MetaMask等以太坊钱包插件");
        }
        if (!this._client) {
            this._client = createWalletClient({
                chain: this.chain,
                transport: custom((window as any).ethereum),
            });
        }
        return this._client;
    }

    // 私有方法：获取钱包地址
    private async getAccount(): Promise<`0x${string}`> {
        const [acc] = await this.client.requestAddresses();
        return acc;
    }

    // 私有方法：创建Permit2签名
    private async createPermit2Signature(
        tokenAddress: string,
        amount: bigint,
        account: `0x${string}`
    ) {
        const nonce = BigInt(Date.now());
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 30 * 60); // 30分钟后过期

        const { domain, types, values } = SignatureTransfer.getPermitData(
            {
                permitted: {
                    token: tokenAddress,
                    amount,
                },
                nonce,
                deadline,
                spender: this.contractAddress,
            },
            this.permit2Address,
            Number(this.chain.id),
        );

        const signature = await this.client.signTypedData({
            account,
            domain: domain as any,
            types,
            primaryType: "PermitTransferFrom",
            message: values as any,
        });

        return {
            permitData: {
                permitted: {
                    token: tokenAddress,
                    amount,
                },
                nonce,
                deadline,
            },
            signature,
        };
    }

    async checkTransactionConfirmation(transaction_id: string, _mini_app_id?: string): Promise<boolean> { // eslint-disable-line @typescript-eslint/no-unused-vars
        try {
            console.log(`检查MetaMask交易确认状态: ${transaction_id}`);

            // 使用viem获取交易收据
            const receipt = await publicClient.getTransactionReceipt({
                hash: transaction_id as `0x${string}`
            });

            if (receipt) {
                console.log(`MetaMask交易 ${transaction_id} 已确认`);
                return receipt.status === 'success';
            }

            console.log(`MetaMask交易 ${transaction_id} 仍在等待确认`);
            return false;
        } catch (error: any) {
            // 如果是交易未找到的错误，说明还在pending
            if (error.message?.includes('not found') || error.message?.includes('pending')) {
                console.log(`MetaMask交易 ${transaction_id} 仍在等待确认`);
                return false;
            }

            console.error(`检查MetaMask交易状态时出错: ${transaction_id}`, error);
            throw error;
        }
    }

    async waitForTransactionConfirmation(
        transaction_id: string,
        mini_app_id: string,
        maxRetries: number = 10,
        retryInterval: number = 1000
    ): Promise<void> {
        console.log(`等待MetaMask交易确认: ${transaction_id}, 最大重试次数: ${maxRetries}`);

        for (let i = 0; i < maxRetries; i++) {
            const isConfirmed = await this.checkTransactionConfirmation(transaction_id, mini_app_id);
            if (isConfirmed) {
                console.log(`MetaMask交易 ${transaction_id} 确认完成`);
                return;
            }

            if (i < maxRetries - 1) {
                console.log(`MetaMask交易 ${transaction_id} 等待确认中... (${i + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, retryInterval));
            }
        }

        throw new Error(`MetaMask交易 ${transaction_id} 在 ${maxRetries} 次重试后仍未确认`);
    }
}

export const gMetaMask = new ZMetaMask();
