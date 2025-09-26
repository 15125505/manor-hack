import { create } from "zustand";
import { getChain } from "../utils/tool";
import { gData } from "../utils/data";
import type { ManorInfo, UserToken } from "../utils/chain/chainBase";
import { gServer } from "../utils/server.ts";
import i18n from "../i18n";

const formatError = (error: unknown) => (error instanceof Error ? error.message : String(error));

interface PendingTransaction {
    transaction_id: string;
    mini_app_id: string;
    timestamp: number;
    functionName: string;
}

interface UserState {
    // 用户状态
    isLoggedIn: boolean;
    userAddress: string | null;
    manorInfo: ManorInfo | null;
    userTokens: UserToken[];

    // 加载状态
    isLoading: boolean;
    error: string | null;

    // 交易状态管理 - 只支持单个待处理交易
    pendingTransaction: PendingTransaction | null;

    // 操作方法
    login: () => Promise<void>;
    logout: () => void;
    fetchManorInfo: () => Promise<void>;
    clearError: () => void;

    // 交易状态管理方法
    setPendingTransaction: (transaction: PendingTransaction | null) => void;
    checkAndWaitForPendingTransaction: () => Promise<void>;

    // 手动设置loading状态
    setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
    // 初始状态
    isLoggedIn: false,
    userAddress: null,
    manorInfo: null,
    userTokens: [],
    isLoading: false,
    error: null,
    pendingTransaction: null,

    // 登录操作
    login: async () => {
        const chain = getChain();
        if (!chain) {
            set({ error: i18n.t("errors.walletUnavailable") });
            return;
        }

        set({ isLoading: true, error: null });

        try {
            const address = await chain.login();
            gServer.log("👤用户登录成功，地址:", address);

            // 同时设置到userStore和全局gData中
            gData.userAddress = address;

            // 先设置用户地址，但不设置登录状态，避免提前跳转页面
            set({ userAddress: address });

            // 登录成功后立即获取庄园信息和用户代币信息
            try {
                await get().fetchManorInfo();
                gServer.info("👤用户登录并获取所有信息成功", {
                    manorInfo: get().manorInfo,
                    userTokens: get().userTokens,
                });
            } catch (error) {
                console.error("👤获取用户信息失败，但登录仍然成功:", error);
                // 即使获取信息失败，也要允许用户进入，用户可以手动刷新
            }

            // 所有信息获取完成后，才设置登录状态，触发页面跳转
            set({
                isLoggedIn: true,
                isLoading: false,
            });
        } catch (error) {
            console.error("👤登录失败:", error);
            set({
                error: i18n.t("errors.loginFailed", { error: formatError(error) }),
                isLoading: false,
            });
        }
    },

    // 退出登录
    logout: () => {
        // 清除全局gData中的用户地址和庄园名称
        gData.userAddress = "";
        gData.manorName = "";

        set({
            isLoggedIn: false,
            userAddress: null,
            manorInfo: null,
            userTokens: [],
            error: null,
        });

        console.log("👤用户已退出登录，gData.userAddress 和 gData.manorName 已清空");
    },

    // 获取庄园信息和用户代币信息
    fetchManorInfo: async () => {
        const { userAddress } = get();

        if (!userAddress) {
            console.log("👤userAddress为空，跳过获取用户数据");
            return;
        }

        const chain = getChain();
        if (!chain) {
            set({ error: i18n.t("errors.walletUnavailable") });
            return;
        }

        set({ isLoading: true, error: null });

        try {
            // 并行获取庄园信息和用户代币信息
            const [manorInfo, userInfo] = await Promise.all([
                chain.getManorInfo(userAddress),
                chain.getUserInfo()
            ]);
            // 更新庄园名称到全局数据
            gData.manorName = manorInfo.name;

            set({
                manorInfo,
                userTokens: userInfo.userTokens,
                isLoading: false,
            });
            gServer.log("👤用户数据获取成功:", { manorInfo, userTokens: userInfo.userTokens });
        } catch (error) {
            gServer.error("👤获取用户数据失败:", error);
            set({
                error: i18n.t("errors.fetchUserFailed", { error: formatError(error) }),
                isLoading: false,
            });
        }
    },

    // 清除错误
    clearError: () => {
        set({ error: null });
    },

    // 设置待处理交易
    setPendingTransaction: (transaction: PendingTransaction | null) => {
        set({ pendingTransaction: transaction });
        if (transaction) {
            gServer.log("👤设置待处理交易:", transaction);
        } else {
            gServer.log("👤清除待处理交易");
        }
    },

    // 检查并等待待处理交易完成
    checkAndWaitForPendingTransaction: async () => {
        const { pendingTransaction } = get();

        if (!pendingTransaction) {
            gServer.log("👤没有待处理的交易");
            return;
        }

        gServer.log(`👤检查待处理交易: ${pendingTransaction.functionName} (${pendingTransaction.transaction_id})`);

        const chain = getChain();
        if (!chain) {
            gServer.error("👤钱包环境不可用，无法检查交易状态");
            return;
        }

        try {
            gServer.log(`👤等待交易确认: ${pendingTransaction.functionName} (${pendingTransaction.transaction_id})`);
            await chain.waitForTransactionConfirmation(
                pendingTransaction.transaction_id,
                pendingTransaction.mini_app_id,
            );
            get().setPendingTransaction(null);
            gServer.info(`👤交易确认完成: ${pendingTransaction.functionName} (${pendingTransaction.transaction_id})`);
        } catch (error) {
            gServer.error(
                `👤交易确认失败: ${pendingTransaction.functionName} (${pendingTransaction.transaction_id})`,
                error,
            );
            // 即使确认失败，也要清除交易，避免无限重试
            get().setPendingTransaction(null);
            throw error;
        }
    },

    // 手动设置loading状态
    setLoading: (loading: boolean) => {
        set({ isLoading: loading });
    },
}));
