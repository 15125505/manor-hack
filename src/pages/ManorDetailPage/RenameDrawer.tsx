import React, { useState, useEffect } from "react";
import { Button, Typography, Drawer, DrawerContent, DrawerHeader, DrawerTitle, Input } from "@worldcoin/mini-apps-ui-kit-react";
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

    // 当抽屉打开时，初始化输入值
    useEffect(() => {
        if (open) {
            setRenameValue(currentName?.trim() ?? "");
            setRenameError(null);
        }
    }, [open, currentName]);

    const handleClose = () => {
        if (renameLoading) return;
        onClose();
        setRenameError(null);
    };

    const validateRename = (value: string) => {
        const trimmed = value.trim();
        if (trimmed.length === 0 || trimmed.length > 50) {
            return t("manorDetail.errors.invalidName");
        }
        if (/^manor\d+$/i.test(trimmed)) {
            return t("manorDetail.errors.invalidName");
        }
        return null;
    };

    const handleSubmitRename = async () => {
        const chain = getChain();
        if (!chain) return;

        const trimmed = renameValue.trim();
        const validationError = validateRename(trimmed);
        if (validationError) {
            setRenameError(validationError);
            return;
        }

        if (trimmed === (currentName?.trim() ?? "")) {
            handleClose();
            return;
        }

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
            <DrawerContent className="p-6 pb-8 flex flex-col h-[85vh] max-h-[600px] gap-6">
                <DrawerHeader>
                    <DrawerTitle className="text-2xl font-bold">
                        {t("manorDetail.renameDrawer.title")}
                    </DrawerTitle>
                </DrawerHeader>
                <div className="flex-1 flex flex-col gap-4 overflow-y-auto px-0">
                    <Typography variant="body" level={2} className="text-gray-500">
                        {t("manorDetail.renameDrawer.description")}
                    </Typography>
                    <Input
                        autoFocus
                        maxLength={50}
                        label={t("manorDetail.renameDrawer.inputLabel")}
                        value={renameValue}
                        onChange={(e) => {
                            setRenameValue(e.target.value);
                            setRenameError(null);
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
                <div className="flex flex-col gap-3 pt-2">
                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth={true}
                        onClick={handleSubmitRename}
                        disabled={renameLoading || disabled}
                    >
                        {renameLoading ? t("manorDetail.actions.renaming") : t("manorDetail.renameDrawer.confirm")}
                    </Button>
                    <Button
                        variant="secondary"
                        size="lg"
                        fullWidth={true}
                        onClick={handleClose}
                        disabled={renameLoading || disabled}
                    >
                        {t("manorDetail.renameDrawer.cancel")}
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
};

export default RenameDrawer;