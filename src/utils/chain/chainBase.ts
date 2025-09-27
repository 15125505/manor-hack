/**
 * 链基类
 */
import { worldchain } from "viem/chains";

// 庄园信息接口
export interface ManorInfo {
    hasAccess: boolean;
    wbtcBalance: number;
    unlockTime: number;
    lastActiveTime: number;
    inheritors: string[];
    isActive: boolean; // 当前用户是否活跃
    withdrawer: string; // 当前有权提取资金的地址
    name: string; // 庄园名称
}

// 用户Token信息接口
export interface UserToken {
    token: string;
    amount: number;
}

// 交易结果接口
export interface TransactionResult {
    transaction_id: string;
    mini_app_id: string;
}

export abstract class ChainBase {
    readonly chain = worldchain;
    readonly contractAddress = "0x6EA33738ef28C274F8E08F0b5fD213C79e0E569C"; // World Chain 主链ScallionManor合约地址
    readonly wldTokenAddress = "0x2cfc85d8e48f8eab294be644d9e25c3030863003";
    readonly wbtcTokenAddress = "0x03C7054BCB39f7b2e5B2c7AcB37583e32D70Cfa3";
    readonly permit2Address = "0x000000000022D473030F116dDEE9F6B43aC78BA3";

    // 当前模块是否可以用
    abstract isValid(): boolean;

    // 登录
    async login(): Promise<string> {
        return "";
    }

    // 获取用户基础信息（钱包余额等）
    abstract getUserInfo(): Promise<{
        userTokens: UserToken[];
    }>;

    // 获取庄园信息
    abstract getManorInfo(userAddress: string): Promise<ManorInfo>;

    // 获取庄园访问权限价格（WLD）
    abstract getManorAccessPrice(): Promise<number>;

    // 获取强制更改继承人手续费（WLD）
    abstract getForceChangeFee(): Promise<number>;

    // 购买庄园访问权限
    abstract purchaseManorAccess(): Promise<TransactionResult>;

    // 存入WBTC
    abstract depositWBTC(wbtcAmount: number, lockPeriod: number): Promise<TransactionResult>;

    // 提取WBTC
    abstract withdrawWBTC(): Promise<TransactionResult>;

    // 继承WBTC（遗产功能）
    abstract inheritWBTC(manorOwnerAddress: string): Promise<TransactionResult>;

    // 设置/维护继承人（自动判断调用setInheritors还是maintainInheritors）
    abstract setInheritors(
        inheritors: string[],
        forceChange?: boolean,
        manorOwnerAddress?: string // 如果提供则是维护他人庄园，否则是设置自己的
    ): Promise<TransactionResult>;

    // 刷新活跃度
    abstract refreshActivity(): Promise<TransactionResult>;

    // 给开发者打赏
    abstract tipDeveloper(wldAmount: number, message: string): Promise<TransactionResult>;

    // 检查交易是否已确认
    abstract checkTransactionConfirmation(transaction_id: string, mini_app_id: string): Promise<boolean>;

    // 等待交易确认
    abstract waitForTransactionConfirmation(
        transaction_id: string, 
        mini_app_id: string, 
        maxRetries?: number,
        retryInterval?: number
    ): Promise<void>;

}
