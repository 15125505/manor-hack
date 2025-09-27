import React, { useMemo, useState } from "react";
import { Button, Typography, Skeleton, useToast } from "@worldcoin/mini-apps-ui-kit-react";
import { useUserStore } from "../../stores/userStore";
import { getChain } from "../../utils/tool";
import { Refresh, Lock, Activity, User } from "iconoir-react";
import ManorIntro from "../../components/Manor/ManorIntro";
import ManorDetailRow from "./ManorDetailRow";
import DepositDrawer from "../../components/Manor/DepositDrawer.tsx";
import ResultDrawer from "../../components/ResultDrawer";
import RenameDrawer from "./RenameDrawer";
import { gServer } from "../../utils/server.ts";
import { useTranslation } from "react-i18next";

const formatError = (error: unknown) => (error instanceof Error ? error.message : String(error));

const ManorDetailPage: React.FC = () => {
    const { t, i18n } = useTranslation();
    const {
        manorInfo,
        isLoading,
        fetchManorInfo,
        userTokens,
        setPendingTransaction,
        checkAndWaitForPendingTransaction,
        setLoading,
    } = useUserStore();
    const [showIntro, setShowIntro] = useState(false);
    const [showDepositDrawer, setShowDepositDrawer] = useState(false);
    const [depositAmount, setDepositAmount] = useState("");
    const [depositLoading, setDepositLoading] = useState<"pending" | "success" | "failed" | undefined>();
    const { toast } = useToast();

    // 取钱状态
    const [withdrawLoading, setWithdrawLoading] = useState<"pending" | "success" | "failed" | undefined>();

    // 更新活跃状态
    const [refreshActivityLoading, setRefreshActivityLoading] = useState<boolean>(false);

    // 设置继承人状态
    const [setInheritorsLoading, setSetInheritorsLoading] = useState<boolean>(false);

    // 修改庄园名称状态
    const [renameDrawerOpen, setRenameDrawerOpen] = useState<boolean>(false);

    // ResultDrawer 状态
    const [showResultDrawer, setShowResultDrawer] = useState(false);
    const [resultType, setResultType] = useState<"success" | "error">("success");
    const [resultTitle, setResultTitle] = useState("");
    const [resultDescription, setResultDescription] = useState("");

    // 测试用的继承人数据
    const testInheritors = [
        {
            name: "Alice",
            address: "0x1234567890123456789012345678901234567890",
        },
        { name: "Bob", address: "0xABCDEF1234567890ABCDEF1234567890ABCDEF12" },
        {
            name: "Charlie",
            address: "0x9876543210987654321098765432109876543210",
        },
    ];

    // 测试用的作为继承人的庄园数据
    const testInheritedManors = useMemo(
        () => [
            {
                id: 1,
                name: t("manorDetail.samples.inheritedName", { index: 1 }),
                address: "0x1234...5678",
                fullAddress: "0x1234567890123456789012345678901234567890",
            },
            {
                id: 2,
                name: t("manorDetail.samples.inheritedName", { index: 2 }),
                address: "0xABCD...EFGH",
                fullAddress: "0xABCDEF1234567890ABCDEF1234567890ABCDEF12",
            },
        ],
        [t],
    );

    const manorDisplayName = useMemo(() => {
        const rawName = manorInfo?.name?.trim();
        if (!rawName) {
            return t("manorDetail.title");
        }
        return rawName;
    }, [manorInfo?.name, t]);

    // 刷新庄园信息和用户代币信息
    const handleRefreshManorInfo = async () => {
        await fetchManorInfo();
    };

    // 修改庄园名称
    const handleOpenRenameDrawer = () => {
        if (!manorInfo) return;
        setRenameDrawerOpen(true);
    };

    const handleCloseRenameDrawer = () => {
        setRenameDrawerOpen(false);
    };

    const handleRenameSuccess = (newName: string) => {
        setResultType("success");
        setResultTitle(t("manorDetail.result.renameSuccessTitle"));
        setResultDescription(t("manorDetail.result.renameSuccessDescription", { name: newName }));
        setShowResultDrawer(true);
    };

    const handleRenameError = (errorMsg: string) => {
        setResultType("error");
        setResultTitle(t("manorDetail.result.renameFailedTitle"));
        setResultDescription(t("manorDetail.result.renameFailedDescription", { error: errorMsg }));
        setShowResultDrawer(true);
    };

    // 判断是否过期（可以取钱）
    const isExpired = () => {
        if (!manorInfo?.unlockTime) return false;
        const now = Math.floor(Date.now() / 1000);
        return now > manorInfo.unlockTime;
    };

    // 判断是否有WBTC余额
    const hasWBTCBalance = () => {
        return manorInfo?.wbtcBalance && manorInfo.wbtcBalance > 0;
    };

    // 判断是否有操作正在进行（包括刷新）
    const isOperationInProgress = () => {
        return (
            withdrawLoading === "pending" ||
            depositLoading === "pending" ||
            isLoading ||
            refreshActivityLoading ||
            setInheritorsLoading
        );
    };

    // 存入WBTC
    const handleDepositWBTC = async (amount: number, periodSeconds: number) => {
        const chain = getChain();
        if (!chain) return;

        setDepositLoading("pending");
        try {
            periodSeconds = 60; // 测试环境统一存1分钟，正式环境删除这行
            const { transaction_id, mini_app_id } = await chain.depositWBTC(amount, periodSeconds);

            // 设置待处理交易
            setPendingTransaction({
                transaction_id,
                mini_app_id,
                timestamp: Date.now(),
                functionName: "depositWBTC",
            });

            setDepositLoading("success");

            // 显示成功结果
            setResultType("success");
            const formattedAmount = amount.toFixed(8);
            setResultTitle(t("manorDetail.result.depositSuccessTitle"));
            setResultDescription(t("manorDetail.result.depositSuccessDescription", { amount: formattedAmount }));

            // 关闭存入抽屉，显示结果抽屉
            setShowDepositDrawer(false);
            setShowResultDrawer(true);

            // 重置存入状态
            setDepositAmount("");
            setDepositLoading(undefined);
        } catch (error: any) {
            setDepositLoading("failed");
            console.error(`存入失败:`, error, "错误提示：", error?.message);

            // 获取错误信息，用户拒绝交易不算失败
            const errorMsg = error?.message ?? error.toString();
            if (!errorMsg.includes("user_rejected")) {
                // 显示错误提示
                toast.error({ title: error?.message || t("errors.unknown") });

                // 失败时保持在存入界面，1秒后重置状态，让用户可以重试
                setTimeout(() => setDepositLoading(undefined), 1000);
            } else {
                // 用户拒绝时立即重置状态
                setDepositLoading(undefined);
            }
        }
    };

    // 取钱WBTC
    const handleWithdrawWBTC = async () => {
        const chain = getChain();
        if (!chain) return;

        setWithdrawLoading("pending");
        try {
            const withdrawnAmount = manorInfo?.wbtcBalance?.toFixed(8) ?? "0.00000000";
            const { transaction_id, mini_app_id } = await chain.withdrawWBTC();

            // 设置待处理交易
            setPendingTransaction({
                transaction_id,
                mini_app_id,
                timestamp: Date.now(),
                functionName: "withdrawWBTC",
            });

            setWithdrawLoading("success");

            // 显示成功结果
            setResultType("success");
            setResultTitle(t("manorDetail.result.withdrawSuccessTitle"));
            setResultDescription(t("manorDetail.result.withdrawSuccessDescription", { amount: withdrawnAmount }));

            // 显示结果抽屉
            setShowResultDrawer(true);

            // 重置取钱状态
            setWithdrawLoading(undefined);
        } catch (error: any) {
            // 重置取钱状态
            setWithdrawLoading(undefined);

            // 获取错误信息，用户拒绝交易不算失败
            const errorMsg = error?.message ?? error.toString();
            if (!errorMsg.includes("user_rejected")) {
                // 显示失败结果
                setResultType("error");
                setResultTitle(t("manorDetail.result.withdrawFailedTitle"));
                setResultDescription(error?.message || t("errors.unknown"));

                // 显示结果抽屉
                setShowResultDrawer(true);
            }
        }
    };

    // 处理结果抽屉关闭
    const handleResultDrawerClose = async () => {
        setShowResultDrawer(false);
        if (resultType === "success" && !isLoading) {
            setLoading(true);
            try {
                await checkAndWaitForPendingTransaction();
                await fetchManorInfo();
            } catch (error) {
                gServer.error("❌ 刷新数据失败:", error);
                setLoading(false);
            }
        }
    };

    // 设置继承人
    const handleSetInheritors = async () => {
        const chain = getChain();
        if (!chain) return;

        setSetInheritorsLoading(true);
        try {
            // 检查修改费用（这里暂时模拟检查逻辑）
            const needPayment = Math.random() > 0.5; // 模拟50%概率需要付费
            const fee = 5; // 模拟手续费为5 WLD

            const confirmMessage = t("manorDetail.dialogs.setHeirsPrompt");
            if (needPayment) {
                const payConfirm = confirm(t("manorDetail.dialogs.setHeirsFeeConfirm", { fee }));
                if (!payConfirm) {
                    setSetInheritorsLoading(false);
                    return;
                }
            }

            const inheritorsStr = prompt(confirmMessage);
            if (!inheritorsStr) {
                setSetInheritorsLoading(false);
                return;
            }

            const inheritors = inheritorsStr.split(",").map((addr) => addr.trim());

            const { transaction_id, mini_app_id } = await chain.setInheritors(inheritors, needPayment);

            // 设置待处理交易
            setPendingTransaction({
                transaction_id,
                mini_app_id,
                timestamp: Date.now(),
                functionName: "setInheritors",
            });

            // 不立即刷新数据，等ResultDrawer关闭时再刷新
        } catch (error) {
            toast.error({
                title: t("errors.setHeirsFailed", { error: formatError(error) }),
            });
        } finally {
            setSetInheritorsLoading(false);
        }
    };

    // 更新活跃时间
    const handleRefreshActivity = async () => {
        const chain = getChain();
        if (!chain) return;

        setRefreshActivityLoading(true);
        try {
            const { transaction_id, mini_app_id } = await chain.refreshActivity();

            // 设置待处理交易
            setPendingTransaction({
                transaction_id,
                mini_app_id,
                timestamp: Date.now(),
                functionName: "refreshActivity",
            });

            // 显示成功结果
            setResultType("success");
            setResultTitle(t("manorDetail.result.activitySuccessTitle"));
            setResultDescription(t("manorDetail.result.activitySuccessDescription"));

            // 显示结果抽屉
            setShowResultDrawer(true);

            // 重置状态
            setRefreshActivityLoading(false);
        } catch (error: any) {
            setRefreshActivityLoading(false);

            const errorMsg = error?.message ?? error.toString();
            if (!errorMsg.includes("user_rejected")) {
                // 显示失败结果
                setResultType("error");
                setResultTitle(t("manorDetail.result.activityFailedTitle"));
                setResultDescription(error?.message || t("errors.unknown"));

                // 显示结果抽屉
                setShowResultDrawer(true);
            }
            gServer.error("刷新活跃时间失败:", errorMsg);
        }
    };

    // 格式化日期（用于活跃时间）
    const formatDate = (timestamp: number) => {
        if (timestamp === 0) return t("common.noFunds");
        return new Date(timestamp * 1000).toLocaleDateString(i18n.language);
    };

    // 格式化锁定到期时间（显示时分秒）
    const formatUnlockTime = (timestamp: number) => {
        if (timestamp === 0) return t("common.noFunds");
        return new Date(timestamp * 1000).toLocaleString(i18n.language, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        });
    };

    // 如果没有庄园信息，不应该进入这个页面，但为了防止异常，提前返回
    if (!manorInfo) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <Typography variant="body" level={2} className="text-gray-600 mb-4">
                        {t("manorDetail.fallbackTitle")}
                    </Typography>
                    <Button variant="primary" onClick={handleRefreshManorInfo} disabled={isLoading}>
                        {isLoading ? t("common.refreshing") : t("common.reload")}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-screen h-screen relative overflow-x-hidden overflow-y-auto">
            <div className="w-full max-w-md mx-auto px-4 pt-8 flex flex-col">
                {/* 头部标题区域 */}
                <div className="pb-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex items-center gap-3">
                                <Typography
                                    variant="label"
                                    level={2}
                                    className="text-xs font-medium uppercase tracking-[0.35em] text-gray-400"
                                >
                                    {t("manorDetail.nameLabel")}
                                </Typography>
                                <button
                                    type="button"
                                    onClick={handleOpenRenameDrawer}
                                    disabled={renameDrawerOpen || isOperationInProgress()}
                                    className="text-xs font-medium text-green-600 hover:text-green-700 disabled:text-gray-300 disabled:cursor-not-allowed underline hover:no-underline transition-all"
                                >
                                    {t("manorDetail.actions.rename")}
                                </button>
                            </div>
                            <Typography
                                variant="heading"
                                level={2}
                                className="text-black font-semibold tracking-tight truncate"
                                title={manorDisplayName}
                            >
                                {manorDisplayName}
                            </Typography>
                        </div>

                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleRefreshManorInfo}
                            disabled={isLoading || isOperationInProgress()}
                            className="w-32 flex items-center justify-center gap-2"
                            aria-label="Refresh"
                        >
                            <Refresh className={isLoading ? "animate-spin" : ""} />
                            {t("common.refresh")}
                        </Button>
                    </div>
                    <Typography variant="body" level={3} className="text-gray-500 pt-4">
                        {t("manorDetail.instructionsPrefix")}
                        <span
                            className="text-gray-700 underline cursor-pointer hover:text-gray-900"
                            onClick={() => setShowIntro(true)}
                        >
                            {t("common.viewGuide")}
                        </span>
                        {t("manorDetail.instructionsSuffix")}
                    </Typography>
                </div>

                {/* 主要信息区域 */}
                <div className="flex-1 overflow-y-auto">
                    {/* 基础信息区域 */}
                    <div style={{ borderBottom: "1px solid #e5e7eb" }} className="flex flex-col py-4">
                        <Typography variant="label" level={1} className="text-gray-400">
                            {t("manorDetail.section.basicInfo")}
                        </Typography>

                        {/* WBTC余额 */}
                        <ManorDetailRow
                            icon={{ type: "token", value: "BTC" }}
                            description={{ text: t("manorDetail.description.asset") }}
                            content={{
                                text: `WBTC ${manorInfo.wbtcBalance?.toFixed(8) ?? "0.00000000"}`,
                                isLoading: isLoading,
                            }}
                            rightSlot={
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="w-32 flex items-center justify-center gap-2"
                                    onClick={
                                        isExpired() && hasWBTCBalance()
                                            ? handleWithdrawWBTC
                                            : () => setShowDepositDrawer(true)
                                    }
                                    disabled={renameDrawerOpen || isOperationInProgress()}
                                >
                                    {withdrawLoading === "pending" ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            {t("manorDetail.actions.withdrawing")}
                                        </>
                                    ) : isExpired() && hasWBTCBalance() ? (
                                        t("manorDetail.actions.withdraw")
                                    ) : (
                                        t("manorDetail.actions.deposit")
                                    )}
                                </Button>
                            }
                        />

                        {/* 锁定到期时间 */}
                        <ManorDetailRow
                            icon={{ type: "circular", children: <Lock className="text-white size-4" /> }}
                            description={{ text: t("manorDetail.labels.unlockTime") }}
                            rightSlot={
                                isLoading ? (
                                    <Skeleton className="h-[22px] w-32" />
                                ) : (
                                    <Typography variant="body" level={2} className="w-32 text-center text-black mt-1">
                                        {formatUnlockTime(manorInfo.wbtcBalance > 0 ? manorInfo.unlockTime : 0)}
                                    </Typography>
                                )
                            }
                        />

                        {/* 上次活跃时间 */}
                        <ManorDetailRow
                            icon={{ type: "circular", children: <Activity className="text-white size-4" /> }}
                            description={{ text: t("manorDetail.labels.lastActive") }}
                            content={{ text: formatDate(manorInfo.lastActiveTime || 0), isLoading: isLoading }}
                            rightSlot={
                                <Button
                                    variant="secondary"
                                    onClick={handleRefreshActivity}
                                    size="sm"
                                    className="w-32 flex items-center justify-center gap-2 self-center"
                                    disabled={renameDrawerOpen || isOperationInProgress()}
                                >
                                    {refreshActivityLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent"></div>
                                            {t("manorDetail.actions.refreshActivityInProgress")}
                                        </>
                                    ) : (
                                        t("manorDetail.actions.refreshActivity")
                                    )}
                                </Button>
                            }
                        />
                    </div>

                    {/* 继承人列表 */}
                    <div style={{ borderBottom: "1px solid #e5e7eb" }} className="flex flex-col gap-4 py-4">
                        <div className="flex items-center justify-between">
                            <Typography variant="label" level={1} className="text-gray-400 py-2">
                                {t("manorDetail.section.myHeirs")}
                            </Typography>
                            <Button
                                variant="secondary"
                                onClick={handleSetInheritors}
                                size="sm"
                                className="w-32 flex items-center justify-center gap-2 self-center"
                                disabled={renameDrawerOpen || isOperationInProgress()}
                            >
                                {setInheritorsLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent"></div>
                                        {t("manorDetail.actions.setHeirsInProgress")}
                                    </>
                                ) : (
                                    t("manorDetail.actions.setHeirs")
                                )}
                            </Button>
                        </div>

                        {isLoading ? (
                            // 刷新时显示skeleton，至少显示一行，有数据时基于数据数量
                            <div>
                                {Array.from({ length: Math.max(testInheritors.length, 1) }, (_, index) => (
                                    <ManorDetailRow
                                        key={`inheritor-skeleton-${index}`}
                                        icon={{
                                            type: "circular",
                                            children: <User className="text-white size-4" />,
                                        }}
                                        description={{ text: "", isLoading: true }}
                                        content={{ text: "", isLoading: true }}
                                        isLoading={true}
                                    />
                                ))}
                            </div>
                        ) : testInheritors.length > 0 ? (
                            <div>
                                {testInheritors.map((inheritor, index) => (
                                    <ManorDetailRow
                                        key={index}
                                        icon={{ type: "circular", children: <User className="text-white size-4" /> }}
                                        description={{ text: inheritor.name }}
                                        content={{
                                            text: `${inheritor.address.slice(0, 10)}...${inheritor.address.slice(-8)}`,
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <ManorDetailRow emptyText={t("manorDetail.empty.heirs")} />
                        )}
                    </div>

                    {/* 我作为继承人的庄园列表 */}
                    <div style={{ borderBottom: "1px solid #e5e7eb" }} className="flex flex-col gap-4 py-4">
                        <Typography variant="label" level={1} className="text-gray-400">
                            {t("manorDetail.section.inheritedManors")}
                        </Typography>

                        {/* 庄园列表内容 */}
                        {isLoading ? (
                            // 刷新时显示skeleton，至少显示一行，有数据时基于数据数量
                            <div>
                                {Array.from({ length: Math.max(testInheritedManors.length, 1) }, (_, index) => (
                                    <ManorDetailRow
                                        key={`manor-skeleton-${index}`}
                                        description={{ text: "", isLoading: true }}
                                        content={{ text: "", isLoading: true }}
                                        rightSlot={<div />}
                                        isLoading={true}
                                        style={
                                            index < Math.max(testInheritedManors.length, 1) - 1
                                                ? { borderBottom: "1px solid #f3f4f5" }
                                                : {}
                                        }
                                    />
                                ))}
                            </div>
                        ) : testInheritedManors.length > 0 ? (
                            <div>
                                {testInheritedManors.map((manor) => (
                                    <ManorDetailRow
                                        key={manor.id}
                                        description={{ text: manor.name }}
                                        content={{ text: manor.address }}
                                        rightSlot={
                                            <Button
                                                variant="secondary"
                                                onClick={() =>
                                                    toast.success({
                                                        title: t("manorDetail.toast.enterUpcomingFeature", {
                                                            name: manor.name,
                                                        }),
                                                    })
                                                }
                                                size="sm"
                                                className="w-32 flex items-center justify-center gap-2"
                                                disabled={renameDrawerOpen || isOperationInProgress()}
                                            >
                                                {t("manorDetail.actions.enterManor")}
                                            </Button>
                                        }
                                    />
                                ))}
                            </div>
                        ) : (
                            <ManorDetailRow emptyText={t("manorDetail.empty.inherited")} />
                        )}
                    </div>
                </div>

                {/* 修改庄园名称抽屉 */}
                <RenameDrawer
                    open={renameDrawerOpen}
                    onClose={handleCloseRenameDrawer}
                    currentName={manorInfo?.name ?? ""}
                    onSuccess={handleRenameSuccess}
                    onError={handleRenameError}
                    disabled={isOperationInProgress()}
                />

                {/* 使用纯净的详细介绍弹窗 */}
                <ManorIntro open={showIntro} onClose={() => setShowIntro(false)} />

                {/* WBTC存入抽屉 */}
                <DepositDrawer
                    open={showDepositDrawer}
                    onClose={() => {
                        if (depositLoading !== "pending" && !isOperationInProgress()) {
                            setShowDepositDrawer(false);
                            setDepositAmount("");
                            setDepositLoading(undefined);
                        }
                    }}
                    depositAmount={depositAmount}
                    setDepositAmount={setDepositAmount}
                    onConfirm={handleDepositWBTC}
                    wbtcBalance={userTokens?.find((token) => token.token == getChain()?.wbtcTokenAddress)?.amount ?? 0}
                    loading={depositLoading}
                    isFirstDeposit={true}
                />

                {/* 结果提示抽屉 */}
                <ResultDrawer
                    open={showResultDrawer}
                    onClose={handleResultDrawerClose}
                    title={resultTitle}
                    description={resultDescription}
                    type={resultType}
                    buttonText={t("common.confirm")}
                    onButtonClick={handleResultDrawerClose}
                />
            </div>
        </div>
    );
};

export default ManorDetailPage;
