import React, { useEffect, useState } from "react";
import {
    Button,
    Typography,
    useToast,
    BulletList,
    BulletListItem,
    CircularIcon,
} from "@worldcoin/mini-apps-ui-kit-react";
import { Lock, SparkSolid } from "iconoir-react";
import { useUserStore } from "../../stores/userStore";
import { useManorStore } from "../../stores/manorStore";
import ManorIntro from "../../components/Manor/ManorIntro";
import ManorDetailPage from "../ManorDetailPage";

const ManorHomePage: React.FC = () => {
    const { toast } = useToast();
    const [isAnimating, setIsAnimating] = useState(false);
    const [showDetailPage, setShowDetailPage] = useState(false);
    const [showDetailDrawer, setShowDetailDrawer] = useState(false);

    const { manorInfo, isLoading, error, fetchManorInfo, clearError } =
        useUserStore();

    console.log("当前用户状态：", manorInfo);

    const {
        isPurchasing,
        purchaseError,
        purchaseManorAccess,
        clearPurchaseError,
    } = useManorStore();

    // 监听错误状态
    useEffect(() => {
        if (error) {
            toast.error({
                title: error,
            });
            clearError();
        }
    }, [error, toast, clearError]);

    // 监听购买错误状态
    useEffect(() => {
        if (purchaseError) {
            toast.error({
                title: purchaseError,
            });
            clearPurchaseError();
        }
    }, [purchaseError, toast, clearPurchaseError]);

    // 刷新庄园信息
    const handleRefreshManorInfo = async () => {
        await fetchManorInfo();
    };

    // 购买庄园权限
    const handlePurchaseManor = async () => {
        const success = await purchaseManorAccess();
        if (success) {
            toast.success({
                title: "购买成功！正在刷新庄园信息...",
            });
            // 购买成功后刷新庄园信息
            await fetchManorInfo();
        }
    };

    // 进入庄园动画
    const handleEnterManor = () => {
        if (!manorInfo?.hasAccess) return;

        setIsAnimating(true);
        setShowDetailPage(true);
    };

    // 显示庄园详情页
    if (showDetailPage) {
        return <ManorDetailPage />;
    }

    return (
        <div className="w-screen h-screen relative overflow-x-hidden overflow-y-auto flex flex-col justify-around">
            {/* 庄园图片 */}
            <div className={`w-full max-w-md mx-auto px-4 pt-8`}>
                <div className="relative">
                    <div
                        className="w-full aspect-[3/2] rounded-lg shadow-lg bg-cover bg-center"
                        style={{ backgroundImage: "url(/manor.jpg)" }}
                    />
                    {/* 未购买庄园的蒙层 */}
                    {manorInfo && !manorInfo.hasAccess && (
                        <>
                            {/* 半透明蒙层 */}
                            <div className="absolute inset-0 bg-black/40 rounded-lg flex flex-col items-center justify-center">
                                {/* 锁图标 */}
                                <Lock className="text-white w-16 h-16 mb-4" />
                                {/* 提示文字 */}
                                <Typography
                                    variant="subtitle"
                                    level={2}
                                    className="text-center text-white"
                                >
                                    仅需 1 WLD永久获得专属于您的韭菜庄园
                                </Typography>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* 主要操作按钮 */}
            <div className={`w-full max-w-sm mx-auto px-4 my-8`}>
                {manorInfo && !manorInfo.hasAccess ? (
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handlePurchaseManor}
                        disabled={isPurchasing}
                        fullWidth
                    >
                        {isPurchasing ? "购买中..." : "购买韭菜庄园 (1 WLD)"}
                    </Button>
                ) : manorInfo && manorInfo.hasAccess ? (
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleEnterManor}
                        disabled={isAnimating}
                        fullWidth
                    >
                        进入庄园
                    </Button>
                ) : (
                    <Button
                        variant="secondary"
                        size="lg"
                        onClick={handleRefreshManorInfo}
                        disabled={isLoading}
                        fullWidth
                    >
                        {isLoading ? "加载中..." : "刷新状态"}
                    </Button>
                )}
            </div>

            {/* 庄园简介 */}
            <div className="pb-8">
                <div className="w-full max-w-md mx-auto px-4 mt-6">
                    <div className="bg-white rounded-lg shadow-md p-4">
                        <BulletList className="w-full max-w-md px-4 mb-[20px]">
                            <BulletListItem
                                bulletPoint={
                                    <CircularIcon className="size-9 bg-gray-900">
                                        <SparkSolid className="text-gray-0" />
                                    </CircularIcon>
                                }
                            >
                                <span
                                    dangerouslySetInnerHTML={{
                                        __html: "韭菜庄园是一个基于区块链的数字资产管理平台，为您提供安全、可靠的资产存储和继承服务。",
                                    }}
                                />
                            </BulletListItem>

                            <BulletListItem
                                bulletPoint={
                                    <CircularIcon className="size-9 bg-gray-900">
                                        <SparkSolid className="text-gray-0" />
                                    </CircularIcon>
                                }
                            >
                                <span
                                    dangerouslySetInnerHTML={{
                                        __html: "通过智能合约技术，实现资产的安全传承和长期储蓄，让您的数字财富得到最好的保护。",
                                    }}
                                />
                            </BulletListItem>
                        </BulletList>

                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowDetailDrawer(true)}
                            className="w-full border-green-200 text-green-700 hover:bg-green-50"
                        >
                            查看详细介绍
                        </Button>
                    </div>
                </div>

                {/* 使用说明弹窗组件 */}
                <ManorIntro
                    open={showDetailDrawer}
                    onClose={() => setShowDetailDrawer(false)}
                />

            </div>
        </div>
    );
};

export default ManorHomePage;
