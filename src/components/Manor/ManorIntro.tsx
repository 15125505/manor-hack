import React, { useState } from "react";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    Tabs,
    TabItem,
} from "@worldcoin/mini-apps-ui-kit-react";
import { InfoCircle, IceCream } from "iconoir-react";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import { getManorContent } from "../../content/manor-content";

interface ManorIntroProps {
    open: boolean;
    onClose: () => void;
}

const ManorIntro: React.FC<ManorIntroProps> = ({
    open,
    onClose,
}) => {
    const { t } = useTranslation();
    const { usageContent, contractContent } = getManorContent(t);
    const [activeTab, setActiveTab] = useState("usage");

    const handleTabChange = (value: string) => {
        console.log('Tab change attempted:', { value, activeTab, shouldChange: value && value !== activeTab });
        // 确保只在值真正改变时才更新状态
        if (value && value !== activeTab && (value === "usage" || value === "contract")) {
            setActiveTab(value);
        }
    };

    return (
        <Drawer open={open} direction="bottom" onClose={onClose}>
            <DrawerContent className="p-6 flex flex-col h-[100vh]">
                <DrawerHeader>
                    <DrawerTitle className="text-2xl font-bold text-green-800">
                        {t("manorIntro.title")}
                    </DrawerTitle>
                </DrawerHeader>

                {/* 内容区域 - 可滚动 */}
                <div className="flex-1 relative">
                    <div
                        className={`absolute inset-0 overflow-y-auto px-6 pb-20 ${activeTab === "usage" ? "block" : "hidden"}`}
                    >
                        <div className="markdown-body">
                            <ReactMarkdown>{usageContent}</ReactMarkdown>
                        </div>
                    </div>

                    <div
                        className={`absolute inset-0 overflow-y-auto px-6 pb-20 ${activeTab === "contract" ? "block" : "hidden"}`}
                    >
                        <div className="markdown-body">
                            <ReactMarkdown>{contractContent}</ReactMarkdown>
                        </div>
                    </div>
                </div>

                {/* 固定在底部的 TabBar */}
                <div className="fixed bottom-0 left-0 right-0 border-t bg-white py-2 mb-4 z-50">
                    <Tabs
                        value={activeTab}
                        onValueChange={handleTabChange}
                        className="w-full"
                    >
                        <TabItem
                            value="usage"
                            icon={<InfoCircle />}
                            label={t("manorIntro.tabs.usage")}
                        />
                        <TabItem
                            value="contract"
                            icon={<IceCream />}
                            label={t("manorIntro.tabs.contract")}
                        />
                    </Tabs>
                </div>
            </DrawerContent>
        </Drawer>
    );
};

export default ManorIntro;
