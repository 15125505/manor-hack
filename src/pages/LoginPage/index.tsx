import React, { useEffect } from 'react';
import { Button, Typography, useToast, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { useUserStore } from '../../stores/userStore';

interface LoginPageProps {
    onLoginSuccess: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const { toast } = useToast();
    const {
        isLoading,
        error,
        login,
        clearError,
        isLoggedIn
    } = useUserStore();

    // 转换loading状态为LiveFeedback需要的格式
    const loadingState = isLoading ? 'pending' : (isLoggedIn ? 'success' : undefined);

    // 监听登录状态变化
    useEffect(() => {
        if (isLoggedIn) {
            onLoginSuccess();
        }
    }, [isLoggedIn, onLoginSuccess]);

    // 监听错误状态
    useEffect(() => {
        if (error) {
            toast.error({
                title: error
            });
            clearError();
        }
    }, [error, toast, clearError]);

    const handleLogin = async () => {
        try {
            await login();
        } catch (error) {
            toast.error({
                title: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center px-6 py-6">
            {/* 门的图片区域 */}
            <div className="mb-8 flex justify-center">
                <div className="relative">
                    <img
                        src="/door.jpg"
                        alt="韭菜庄园"
                        style={{ width: 'calc(90vw)', aspectRatio: '3/2' }}
                    />
                    <div
                        className="absolute text-center text-gray-700 font-bold text-shadow pointer-events-none"
                        style={{
                            left: '50.5%',
                            top: '36.25%',
                            width: '19.33%',
                            height: '9%',
                            fontSize: 'clamp(0.75rem, 2vw, 1rem)',
                            lineHeight: '1.2',
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        欢迎来到<br/>韭菜庄园
                    </div>
                </div>
            </div>

            {/* 主要问候语 */}
            <div className="text-center mb-16">
                <Typography variant="heading" level={1} >
                    韭菜你又来了！
                </Typography>
            </div>

            {/* 登录按钮 */}
            <div className="w-full max-w-sm">
                <LiveFeedback
                    className="w-full"
                    state={loadingState}
                    label={{
                        pending: "稍等，正在为你准备庄园...",
                        success: "欢迎回家！",
                        failed: "登录出错了",
                    }}
                >
                    <Button
                        size="lg"
                        fullWidth={true}
                        onClick={handleLogin}
                        className="py-4 text-lg font-semibold"
                    >
                        既然来了，别怕再被割一次
                    </Button>
                </LiveFeedback>
            </div>
        </div>
    );
};

export default LoginPage;
