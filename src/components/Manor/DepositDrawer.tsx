import {
    Button,
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    NumberPad,
    Typography,
    LiveFeedback,
    Input,
    Token
} from "@worldcoin/mini-apps-ui-kit-react";
import React, { useState } from "react";
import { ReactFitty } from "react-fitty";
// import { useTranslation } from "react-i18next";

interface DepositDrawerProps {
    open: boolean;
    onClose: () => void;
    depositAmount: string;
    setDepositAmount: (val: string) => void;
    onConfirm: (amount: number, periodSeconds: number) => Promise<void>;
    wbtcBalance: number;
    loading?: "pending" | "success" | "failed" | undefined;
    isFirstDeposit?: boolean;
}

// 千分位格式化函数
function formatNumberWithCommas(x: string | number) {
    const parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

function getSecondsByAddingYears(years: number) {
    const now = new Date();
    const future = new Date(now.getTime());
    future.setFullYear(now.getFullYear() + years);
    return Math.floor((future.getTime() - now.getTime()) / 1000);
}

function getDepositPeriodSeconds(
    period: string,
    customNum: string,
    customUnit: "d" | "y",
): number {
    const now = new Date();
    const periodMap: Record<string, number> = {
        "1d": 86400,
        "1m": (() => {
            const nextMonth = new Date(now);
            nextMonth.setMonth(now.getMonth() + 1);
            return Math.floor((nextMonth.getTime() - now.getTime()) / 1000);
        })(),
        "1y": getSecondsByAddingYears(1),
        "5y": getSecondsByAddingYears(5),
        "10y": getSecondsByAddingYears(10),
    };

    if (period in periodMap) {
        return periodMap[period];
    }
    if (period === "custom") {
        const n = Number(customNum);
        if (!n || n <= 0) return 0;
        return customUnit === "d" ? n * 86400 : getSecondsByAddingYears(n);
    }
    return 60; // fallback
}

const DepositDrawer: React.FC<DepositDrawerProps> = ({
    open,
    onClose,
    depositAmount,
    setDepositAmount,
    onConfirm,
    wbtcBalance,
    loading,
    isFirstDeposit = true,
}) => {
    // const { t } = useTranslation();
    // 新增：首次存款相关状态
    const [period, setPeriod] = useState<string>("1d"); // 1d, 1m, 1y, 5y, 10y, custom
    const [customNum, setCustomNum] = useState<string>("");
    const [customUnit, setCustomUnit] = useState<"d" | "y">("d");
    const [customNumError, setCustomNumError] = useState<boolean>(false);
    return (
        <Drawer open={open} direction="right" onClose={onClose}>
            <DrawerContent className="p-6 flex flex-col h-[100vh]">
                <DrawerHeader>
                    <DrawerTitle className="text-2xl font-bold">
                        存入WBTC到庄园
                    </DrawerTitle>
                </DrawerHeader>
                {/* 金额显示区 */}
                <div
                    className={`w-full flex justify-center items-center px-4 h-[80px] ${isFirstDeposit ? "mb-2" : "mt-20 mb-8"} flex-shrink-0`}
                >
                    <div className="flex items-center min-w-0">
                        <div className="w-[40px] flex-shrink-0 flex items-center justify-center">
                            <Token value="BTC" size={40} />
                        </div>
                        <ReactFitty
                            mode="single"
                            minSize={10}
                            maxSize={60}
                            className="ml-2 flex-1 text-6xl max-w-[60vw] text-black"
                        >
                            {depositAmount !== ""
                                ? formatNumberWithCommas(depositAmount)
                                : "0"}
                        </ReactFitty>
                    </div>
                </div>
                {/* 输入区（可滚动） */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col items-center mb-4">
                    <div className="mb-2 text-center">
                        <Typography
                            className={`${depositAmount && wbtcBalance !== null && Number(depositAmount) > Number(wbtcBalance) ? "text-red-500" : ""}`}
                        >
                            {depositAmount &&
                            wbtcBalance !== null &&
                            Number(depositAmount) > wbtcBalance
                                ? "余额不足"
                                : "输入存入WBTC数量"}
                        </Typography>
                        <Typography variant="body" level={3} className="text-gray-500 mt-1">
                            当前拥有：{wbtcBalance?.toFixed(8) ?? "0.00000000"} WBTC
                        </Typography>
                    </div>
                    <NumberPad
                        value={depositAmount}
                        onChange={setDepositAmount}
                    />
                    {/* 首次存款模式下增加存款时间选择 */}
                    {isFirstDeposit && (
                        <div className="w-full border border-gray-200 rounded-xl p-4 mt-0 shadow">
                            {/* 提示文字 */}
                            <Typography className="text-gray-500 text-sm max-w-full text-left">
                                首次存入需要设置锁定时间
                            </Typography>
                            {/* 存款时间选项，两行三列 */}
                            <div className="w-full flex flex-col gap-2 mt-4">
                                <div className="flex w-full justify-around gap-x-2">
                                    <Button
                                        size="sm"
                                        fullWidth={true}
                                        variant={
                                            period === "1d"
                                                ? "primary"
                                                : "secondary"
                                        }
                                        onClick={() => setPeriod("1d")}
                                    >
                                        1天
                                    </Button>
                                    <Button
                                        size="sm"
                                        fullWidth={true}
                                        variant={
                                            period === "1m"
                                                ? "primary"
                                                : "secondary"
                                        }
                                        onClick={() => setPeriod("1m")}
                                    >
                                        1月
                                    </Button>
                                    <Button
                                        size="sm"
                                        fullWidth={true}
                                        variant={
                                            period === "1y"
                                                ? "primary"
                                                : "secondary"
                                        }
                                        onClick={() => setPeriod("1y")}
                                    >
                                        1年
                                    </Button>
                                </div>
                                <div className="flex w-full justify-around mt-2 gap-x-2">
                                    <Button
                                        size="sm"
                                        fullWidth={true}
                                        variant={
                                            period === "5y"
                                                ? "primary"
                                                : "secondary"
                                        }
                                        onClick={() => setPeriod("5y")}
                                    >
                                        5年
                                    </Button>
                                    <Button
                                        size="sm"
                                        fullWidth={true}
                                        variant={
                                            period === "10y"
                                                ? "primary"
                                                : "secondary"
                                        }
                                        onClick={() => setPeriod("10y")}
                                    >
                                        10年
                                    </Button>
                                    <Button
                                        size="sm"
                                        fullWidth={true}
                                        variant={
                                            period === "custom"
                                                ? "primary"
                                                : "secondary"
                                        }
                                        onClick={() => setPeriod("custom")}
                                    >
                                        自定义
                                    </Button>
                                </div>
                            </div>
                            {/* 自定义区域，平滑出现，始终渲染div，动画生效 */}
                            <div
                                className={`relative w-full flex items-center gap-2 mt-3 transition-all duration-300 rounded-xl border shadow bg-white
                                    ${period === "custom" ? "opacity-100 max-h-40 py-4 px-4 overflow-visible" : "opacity-0 max-h-0 overflow-hidden p-0"}
                                `}
                            >
                                {/* 外层三角形（边框色） */}
                                <div
                                    className="absolute top-[-9px] left-[83.3%] -translate-x-1/2 w-0 h-0"
                                    style={{
                                        borderLeft: "9px solid transparent",
                                        borderRight: "9px solid transparent",
                                        borderBottom: "9px solid #e5e7eb", // 边框色
                                        zIndex: 2,
                                    }}
                                />
                                {/* 内层三角形（气泡色，略小，覆盖外层） */}
                                <div
                                    className="absolute top-[-8px] left-[83.3%] -translate-x-1/2 w-0 h-0"
                                    style={{
                                        borderLeft: "9px solid transparent",
                                        borderRight: "8px solid transparent",
                                        borderBottom: "8px solid white", // 气泡色
                                        zIndex: 3,
                                    }}
                                />
                                {/* 输入框和按钮 */}
                                <Input
                                    type="tel"
                                    min={1}
                                    className="border rounded px-2 py-1 w-1/2 text-center"
                                    value={customNum}
                                    onChange={(e) => {
                                        setCustomNum(
                                            e.target.value.replace(
                                                /[^\d]/g,
                                                "",
                                            ),
                                        );
                                        setCustomNumError(false);
                                    }}
                                    label="输入时间"
                                    error={customNumError}
                                />
                                <div className="flex flex-1 gap-1">
                                    <Button
                                        size="sm"
                                        fullWidth={true}
                                        variant={
                                            customUnit === "d"
                                                ? "primary"
                                                : "secondary"
                                        }
                                        onClick={() => setCustomUnit("d")}
                                    >
                                        天
                                    </Button>
                                    <Button
                                        size="sm"
                                        fullWidth={true}
                                        variant={
                                            customUnit === "y"
                                                ? "primary"
                                                : "secondary"
                                        }
                                        onClick={() => setCustomUnit("y")}
                                    >
                                        年
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {/* 确认存入按钮 */}
                <LiveFeedback
                    className="w-full flex-shrink-0"
                    state={loading}
                    label={{
                        pending: "存入中...",
                        success: "存入成功！",
                        failed: "存入失败",
                    }}
                >
                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full mt-8"
                        onClick={async () => {
                            let periodSeconds = 60;
                            if (isFirstDeposit) {
                                if (
                                    period === "custom" &&
                                    (!customNum || Number(customNum) <= 0)
                                ) {
                                    setCustomNumError(true);
                                    return;
                                }
                                periodSeconds = getDepositPeriodSeconds(
                                    period,
                                    customNum,
                                    customUnit,
                                );
                            }
                            await onConfirm(Number(depositAmount), periodSeconds);
                        }}
                        disabled={
                            !depositAmount ||
                            Number(depositAmount) <= 0 ||
                            loading === "pending" ||
                            (wbtcBalance !== null &&
                                Number(depositAmount) > Number(wbtcBalance))
                        }
                    >
                        确认存入
                    </Button>
                </LiveFeedback>
            </DrawerContent>
        </Drawer>
    );
};

export default DepositDrawer;
