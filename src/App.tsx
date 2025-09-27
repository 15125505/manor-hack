import { useState } from "react";
import "./App.css";
import { getChain } from "./utils/tool";
import { useTranslation } from "react-i18next";
import { Typography } from "@worldcoin/mini-apps-ui-kit-react";
import LoginPage from "./pages/LoginPage";
import StoryGuidePage from "./pages/StoryGuidePage";
import ManorHomePage from "./pages/ManorHomePage";

export default function App() {
    const { t } = useTranslation();

    // 用 isLogin 控制登录状态
    const [isLogin, setIsLogin] = useState(false);
    // 用 hasSeenStoryGuide 控制是否已看过故事引导
    const [hasSeenStoryGuide, setHasSeenStoryGuide] = useState(false);

    // 如果没有安装钱包，则显示安装钱包
    const chain = getChain();
    if (!chain) {
        return (
            <Typography variant="display" level={1} className="pl-16">
                {t("pleaseInstallWallet")}
            </Typography>
        );
    }

    // 登录成功回调，设置 isLogin 状态
    const handleLoginSuccess = () => {
        setIsLogin(true);
    };

    // 故事引导完成回调，设置 hasSeenStoryGuide 状态
    const handleStoryGuideComplete = () => {
        setHasSeenStoryGuide(true);
    };

    // 用 isLogin 控制显示
    if (!isLogin) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }

    // 如果已登录但还没看过故事引导，显示故事引导页面
    if (!hasSeenStoryGuide) {
        return <StoryGuidePage onComplete={handleStoryGuideComplete} />;
    }

    // 显示庄园首页
    return <ManorHomePage />;
}
