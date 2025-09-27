import React, { useState, useEffect } from "react";
import {
    Button,
    Typography,
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    Input,
} from "@worldcoin/mini-apps-ui-kit-react";
import { useTranslation } from "react-i18next";
import { getChain } from "../../utils/tool";
import { useUserStore } from "../../stores/userStore";

interface RenameDrawerProps {
    open: boolean;
    onClose: () => void;
    currentName: string;
    onSuccess: (newName: string) => void;
    onError: (error: string) => void;
    disabled?: boolean;
}

const formatError = (error: unknown) => (error instanceof Error ? error.message : String(error));

const RenameDrawer: React.FC<RenameDrawerProps> = ({
    open,
    onClose,
    currentName,
    onSuccess,
    onError,
    disabled = false
}) => {
    const { t } = useTranslation();
    const { setPendingTransaction } = useUserStore();

    const [renameValue, setRenameValue] = useState("");
    const [renameError, setRenameError] = useState<string | null>(null);
    const [renameLoading, setRenameLoading] = useState<boolean>(false);
    const [keyboardInset, setKeyboardInset] = useState(0);

    // 当抽屉打开时，初始化输入值
    useEffect(() => {
        if (open) {
            setRenameValue(currentName?.trim() ?? "");
            setRenameError(null);
        }
    }, [open, currentName]);

    // 实时验证输入值
    useEffect(() => {
        if (renameValue.trim()) {
            const error = validateRename(renameValue);
            setRenameError(error);
        } else {
            setRenameError(null);
        }
    }, [renameValue]);

    useEffect(() => {
        if (!open) {
            setKeyboardInset(0);
            return;
        }

        if (typeof window === "undefined") {
            return;
        }

        const viewport = window.visualViewport;
        if (!viewport) {
            return;
        }

        const handleViewportChange = () => {
            const keyboardHeight = Math.max(
                0,
                window.innerHeight - viewport.height - viewport.offsetTop
            );
            setKeyboardInset(keyboardHeight);
        };

        handleViewportChange();

        viewport.addEventListener("resize", handleViewportChange);
        viewport.addEventListener("scroll", handleViewportChange);

        return () => {
            viewport.removeEventListener("resize", handleViewportChange);
            viewport.removeEventListener("scroll", handleViewportChange);
        };
    }, [open]);

    const handleClose = () => {
        if (renameLoading) return;
        setRenameError(null);
        onClose();
    };

    const validateRename = (value: string) => {
        const trimmed = value.trim();
        if (trimmed.length < 3 || trimmed.length > 25) {
            return t("manorDetail.errors.invalidNameLength");
        }
        if (/^manor\d+$/i.test(trimmed)) {
            return t("manorDetail.errors.reservedNaming");
        }
        return null;
    };

    const handleSubmitRename = async () => {
        const trimmed = renameValue.trim();
        const validationError = validateRename(trimmed);
        if (validationError) {
            setRenameError(validationError);
            return;
        }

        // 如果名称没有变化，直接关闭抽屉，不调用API
        if (trimmed === (currentName?.trim() ?? "")) {
            handleClose();
            return;
        }

        const chain = getChain();
        if (!chain) return;

        setRenameLoading(true);
        try {
            const { transaction_id, mini_app_id } = await chain.renameManor(trimmed);

            setPendingTransaction({
                transaction_id,
                mini_app_id,
                timestamp: Date.now(),
                functionName: "renameManor"
            });

            onSuccess(trimmed);
            setRenameError(null);
            handleClose();
        } catch (error) {
            const errorMsg = formatError(error);
            if (errorMsg.includes("user_rejected")) {
                return;
            }

            onError(errorMsg);
            setRenameError(errorMsg);
        } finally {
            setRenameLoading(false);
        }
    };

    return (
        <Drawer open={open} direction="bottom" onClose={handleClose}>
            <DrawerContent className="flex flex-col p-6" style={{ minHeight: "100dvh" }}>
                {/* 顶部内容区域 - 自然增长 */}
                <div className="flex-1 overflow-y-auto">
                    <DrawerHeader>
                        <DrawerTitle className="text-2xl font-bold">
                            {t("manorDetail.renameDrawer.title")}
                        </DrawerTitle>
                    </DrawerHeader>

                    <div className="flex flex-col gap-4 mt-4">
                        <Typography variant="body" level={2} className="text-gray-500">
                            {t("manorDetail.renameDrawer.description")}
                        </Typography>

                        <Input
                            maxLength={25}
                            label={t("manorDetail.renameDrawer.inputLabel")}
                            value={renameValue}
                            onChange={(e) => {
                                setRenameValue(e.target.value);
                            }}
                            error={Boolean(renameError)}
                        />

                        <Typography variant="body" level={3} className="text-xs text-gray-400">
                            {t("manorDetail.renameDrawer.helper")}
                        </Typography>

                        {renameError && (
                            <Typography variant="body" level={3} className="text-xs text-red-500">
                                {renameError}
                            </Typography>
                        )}
                    </div>
                </div>

                {/* 底部按钮区域 - 在正常文档流中 */}
                <div
                    className="pt-6"
                    style={{ paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${keyboardInset}px)` }}
                >
                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth={true}
                        onClick={handleSubmitRename}
                        disabled={
                            renameLoading ||
                            disabled ||
                            Boolean(renameError) ||
                            renameValue.trim() === (currentName?.trim() ?? "")
                        }
                    >
                        {renameLoading ? t("manorDetail.actions.renaming") : t("manorDetail.renameDrawer.confirm")}
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
};

export default RenameDrawer;
