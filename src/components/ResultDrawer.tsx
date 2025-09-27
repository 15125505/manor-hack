import React from "react";
import {
    Drawer,
    DrawerContent,
    Button,
    Typography,
} from "@worldcoin/mini-apps-ui-kit-react";
import { CheckCircleSolid, XmarkCircleSolid } from "iconoir-react";
import { useTranslation } from "react-i18next";

interface ResultDrawerProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    type?: "success" | "error";
    buttonText?: string;
    onButtonClick?: () => void;
    // icon?: React.ReactNode; // 移除未使用的icon属性
}

const ResultDrawer: React.FC<ResultDrawerProps> = ({
    open,
    onClose,
    title,
    description,
    type = "success",
    buttonText,
    onButtonClick,
    // icon, // 移除未使用的icon属性
}) => {
    const { t } = useTranslation();

    return (
        <Drawer open={open} direction="right" onClose={onClose}>
            <DrawerContent className="flex flex-col h-full justify-center items-center p-0">
                <div className="flex flex-col justify-between items-center w-full h-full px-8 py-0">
                    {/* 上半部分 */}
                    <div className="flex flex-col items-center justify-center w-full flex-grow">
                        {/* 图标部分 */}
                        {type === "success" ? (
                            <CheckCircleSolid className="text-green-500 bg-white w-24 h-24" />
                        ) : (
                            <XmarkCircleSolid className="text-red-500 bg-white w-24 h-24" />
                        )}
                        {/* 主标题 */}
                        <div className="mt-4 mb-2 w-full text-center">
                            <Typography variant="heading" level={1}>
                                {title}
                            </Typography>
                        </div>
                        {/* 描述 */}
                        {description && (
                            <div className="mt-2 mb-4 w-full text-center">
                                <Typography variant="subtitle" level={1} className="text-gray-500">
                                    {description}
                                </Typography>
                            </div>
                        )}
                    </div>
                    {/* 下半部分（按钮） */}
                    <div className="w-full pb-8">
                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth={true}
                            onClick={onButtonClick || onClose}
                        >
                            {buttonText || t("back")}
                        </Button>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
};

export default ResultDrawer;
