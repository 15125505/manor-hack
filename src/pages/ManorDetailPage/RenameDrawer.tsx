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
    disabled = false,
}) => {
    const { t } = useTranslation();
    const { setPendingTransaction } = useUserStore();

    const [renameValue, setRenameValue] = useState("");
    const [renameError, setRenameError] = useState<string | null>(null);
    const [renameLoading, setRenameLoading] = useState<boolean>(false);

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

    const handleClose = () => {
        if (renameLoading) return;
        // 先清理状态，再关闭抽屉，确保动画流畅
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
                functionName: "renameManor",
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
            <DrawerContent className="p-6 flex flex-col h-[100vh]">
                {/* 顶部固定区域 - 标题和表单 */}
                <div className="flex-shrink-0 pb-4">
                    <DrawerHeader>
                        <DrawerTitle className="text-2xl font-bold">{t("manorDetail.renameDrawer.title")}</DrawerTitle>
                    </DrawerHeader>
                    <div className="flex flex-col gap-4 pt-4">
                        <Typography variant="body" level={2} className="text-gray-500">
                            {t("manorDetail.renameDrawer.description")}
                        </Typography>
                        <Input
                            autoFocus
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

                {/* 中间可扩展区域 */}
                <div className="flex-1"></div>

                {/* 底部固定按钮区域 - 会被键盘向上推 */}
                <div className="flex-shrink-0 py-8 bg-white border-gray-100">
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
                        className="transition-all duration-200"
                    >
                        {renameLoading ? t("manorDetail.actions.renaming") : t("manorDetail.renameDrawer.confirm")}
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
};

export default RenameDrawer;
