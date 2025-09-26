/**
 * 模拟链操作类 - 简单可控的测试工具
 *
 * 使用方法：
 * 1. 打开Chrome开发者工具 → 自动启用Mock模式
 * 2. 修改下面的变量来控制测试行为
 *
 * 测试场景示例：
 *   - 测试失败: shouldSucceed = false
 *   - 测试用户拒绝: shouldUserReject = true
 *   - 测试新用户: hasAccess = false, manorWbtcBalance = 0
 *   - 测试可取款: unlockTime = Math.floor(Date.now()/1000) - 3600
 *   - 测试锁定资金: unlockTime = Math.floor(Date.now()/1000) + 7200
 */
import { ChainBase, type ManorInfo, type UserToken, type TransactionResult } from "./chainBase";
import i18n from "../../i18n";

class ChainMock extends ChainBase {
    // === 测试控制开关 - 修改这些值来控制测试行为 ===

    // 操作结果控制（修改这些来测试不同情况）
    private shouldSucceed = true;           // true=成功, false=失败
    private shouldUserReject = false;       // true=用户拒绝交易
    private delayMs = 100;                 // 延迟时间（毫秒）
    private errorMessage = i18n.t("errors.networkFailure"); // 失败时的错误信息

    // 用户数据（修改这些来测试不同状态）
    private userAddress = "0x1234567890123456789012345678901234567890";
    private wldBalance = 100.5;
    private wbtcBalance = 1000.12345678;

    // 庄园数据（修改这些来测试不同庄园状态）
    private hasAccess = true;
    private manorWbtcBalance = 0.05000000;
    private unlockTime = Math.floor(Date.now() / 1000) + 3600; // 1小时后到期
    private lastActiveTime = Math.floor(Date.now() / 1000) - 86400; // 1天前活跃
    private inheritors = [
        "0x1111111111111111111111111111111111111111",
        "0x2222222222222222222222222222222222222222"
    ];
    private manorName = i18n.t("manorDetail.samples.manorName"); // 模拟庄园名称

    constructor() {
        super();
        console.log("🎭 ChainMock 已启用");
    }

    // 模拟操作（简单可控）
    private async simulateOperation(operationName: string): Promise<void> {
        console.log(`开始模拟: ${operationName}`);

        // 等待延迟
        await new Promise(resolve => setTimeout(resolve, this.delayMs));

        // 检查用户拒绝
        if (this.shouldUserReject) {
            console.warn(`用户拒绝: ${operationName}`);
            throw new Error("user_rejected: User rejected the transaction");
        }

        // 检查操作结果
        if (!this.shouldSucceed) {
            console.error(`操作失败: ${operationName}`, this.errorMessage);
            throw new Error(this.errorMessage);
        }

        console.log(`操作成功: ${operationName}`);
    }

    // 模拟交易操作，返回模拟的交易结果
    private async simulateTransaction(operationName: string): Promise<TransactionResult> {
        await this.simulateOperation(operationName);

        // 返回模拟的交易ID
        return {
            transaction_id: `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            mini_app_id: "mock_app_id"
        };
    }

    isValid(): boolean {
        return true;
    }

    async login(): Promise<string> {
        await this.simulateOperation("钱包登录");
        return this.userAddress;
    }

    async getUserInfo(): Promise<{ userTokens: UserToken[] }> {
        await this.simulateOperation("获取用户信息");
        return {
            userTokens: [
                { token: this.wldTokenAddress, amount: this.wldBalance },
                { token: this.wbtcTokenAddress, amount: this.wbtcBalance }
            ]
        };
    }

    async getManorInfo(userAddress: string): Promise<ManorInfo> {
        console.log("返回庄园信息:", userAddress);
        await this.simulateOperation("获取庄园信息");
        return {
            hasAccess: this.hasAccess,
            wbtcBalance: this.manorWbtcBalance,
            unlockTime: this.unlockTime,
            lastActiveTime: this.lastActiveTime,
            inheritors: [...this.inheritors],
            isActive: true,
            withdrawer: this.userAddress,
            name: this.manorName
        };
    }

    async getManorAccessPrice(): Promise<number> {
        await this.simulateOperation("获取庄园访问价格");
        return 50.0;
    }

    async getForceChangeFee(): Promise<number> {
        await this.simulateOperation("获取强制更改费用");
        return 5.0;
    }

    async purchaseManorAccess(): Promise<TransactionResult> {
        const result = await this.simulateTransaction("购买庄园访问权限");
        this.hasAccess = true;
        this.wldBalance -= 50;
        return result;
    }

    async depositWBTC(wbtcAmount: number, lockPeriod: number): Promise<TransactionResult> {
        const result = await this.simulateTransaction(`存入${wbtcAmount}WBTC`);
        this.wbtcBalance -= wbtcAmount;
        this.manorWbtcBalance += wbtcAmount;
        this.unlockTime = Math.floor(Date.now() / 1000) + lockPeriod;
        this.lastActiveTime = Math.floor(Date.now() / 1000);
        return result;
    }

    async withdrawWBTC(): Promise<TransactionResult> {
        const result = await this.simulateTransaction("提取WBTC");
        this.wbtcBalance += this.manorWbtcBalance;
        this.manorWbtcBalance = 0;
        this.unlockTime = 0;
        return result;
    }

    async inheritWBTC(manorOwnerAddress: string): Promise<TransactionResult> {
        const result = await this.simulateTransaction("继承WBTC");
        this.wbtcBalance += 0.01; // 继承0.01 WBTC
        console.log("继承自:", manorOwnerAddress);
        return result;
    }

    async setInheritors(inheritors: string[], forceChange?: boolean, manorOwnerAddress?: string): Promise<TransactionResult> {
        const result = await this.simulateTransaction("设置继承人");
        this.inheritors = [...inheritors];
        if (forceChange) {
            this.wldBalance -= 5;
        }
        console.log("设置继承人:", inheritors, "强制更改:", forceChange, "庄园地址:", manorOwnerAddress);
        return result;
    }

    async refreshActivity(): Promise<TransactionResult> {
        const result = await this.simulateTransaction("刷新活跃度");
        this.lastActiveTime = Math.floor(Date.now() / 1000);
        return result;
    }

    async tipDeveloper(wldAmount: number, message: string): Promise<TransactionResult> {
        const result = await this.simulateTransaction(`打赏${wldAmount}WLD`);
        this.wldBalance -= wldAmount;
        console.log("打赏留言:", message);
        return result;
    }

    async checkTransactionConfirmation(transaction_id: string, mini_app_id?: string): Promise<boolean>{
        console.log("检查交易确认:", transaction_id, mini_app_id);
        await new Promise(resolve => setTimeout(resolve, 100)); // 模拟网络延迟
        return true;
    }

    async waitForTransactionConfirmation(
        transaction_id: string,
        mini_app_id: string,
        maxRetries: number = 10,
        retryInterval: number = 1000
    ): Promise<void> {
        console.log(`等待交易确认: ${transaction_id}, 最大重试次数: ${maxRetries}`, mini_app_id, retryInterval);
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("交易已确认:", transaction_id);
    }

}

export const gChainMock = new ChainMock();
