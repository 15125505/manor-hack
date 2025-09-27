import React from "react";
import { Token, Typography, CircularIcon, Skeleton } from "@worldcoin/mini-apps-ui-kit-react";

export interface ManorDetailRowProps {
    // 图标相关
    icon?: {
        type: 'token' | 'circular';
        value?: "WLD" | "ETH" | "BTC" | "DAI" | "USDC" | "USDT" | "SOL" | "SUI" | "DOGE" | "XRP" | "LINK"; // Token 值
        children?: React.ReactNode; // CircularIcon 的子元素
    };
    
    // 描述信息
    description?: {
        text: string;
        isLoading?: boolean;
    };
    
    // 内容信息
    content?: {
        text: string;
        isLoading?: boolean;
    };
    
    // 右侧区域
    rightSlot?: React.ReactNode;
    
    // 如果所有信息都为空时显示的中央文本
    emptyText?: string;
    
    // 骨架屏相关 - 简化为布尔值控制
    isLoading?: boolean;
    
    // 整体样式 - 保留但建议少用
    className?: string;
    style?: React.CSSProperties;
}

const ManorDetailRow: React.FC<ManorDetailRowProps> = ({
    icon,
    description,
    content,
    rightSlot,
    emptyText,
    isLoading = false,
    className = "",
    style
}) => {
    // 如果所有内容都为空且有 emptyText，显示居中文本
    const hasContent = icon || description || content || rightSlot;
    if (!hasContent && emptyText) {
        return (
            <div 
                className={`py-8 text-center ${className}`}
                style={style}
            >
                <Typography variant="body" level={3} className="text-gray-500 text-sm">
                    {emptyText}
                </Typography>
            </div>
        );
    }
    
    // 如果没有内容且没有 emptyText，不渲染
    if (!hasContent) {
        return null;
    }
    
    return (
        <div 
            className={`flex items-center justify-between py-4 ${className}`}
            style={style}
        >
            {/* 左侧内容区域 */}
            <div className="flex items-center gap-3">
                {/* 图标区域 */}
                {icon && (
                    <div>
                        {isLoading ? (
                            <Skeleton className="size-10 rounded-full" />
                        ) : (
                            <>
                                {icon.type === 'token' && icon.value && (
                                    <Token value={icon.value} />
                                )}
                                {icon.type === 'circular' && (
                                    <CircularIcon className="size-10 bg-gray-900">
                                        {icon.children}
                                    </CircularIcon>
                                )}
                            </>
                        )}
                    </div>
                )}
                
                {/* 文本内容区域 */}
                {(description || content) && (
                    <div className="flex flex-col justify-center min-h-[52px]">
                        {/* 描述信息 */}
                        {description && (
                            <>
                                {isLoading || description.isLoading ? (
                                    <Skeleton className="h-[18px] w-16 mb-1" />
                                ) : (
                                    <Typography 
                                        variant="body" 
                                        level={3} 
                                        className="text-gray-500 text-sm"
                                    >
                                        {description.text}
                                    </Typography>
                                )}
                            </>
                        )}
                        
                        {/* 内容信息 */}
                        {content && (
                            <>
                                {isLoading || content.isLoading ? (
                                    <Skeleton className="h-[22px] w-44 mt-1" />
                                ) : (
                                    <Typography 
                                        variant="body" 
                                        level={2} 
                                        className="text-black mt-1 font-mono"
                                    >
                                        {content.text}
                                    </Typography>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
            
            {/* 右侧区域 */}
            {rightSlot && (
                <div>
                    {isLoading ? (
                        <Skeleton className="h-[32px] w-[128px]" />
                    ) : (
                        rightSlot
                    )}
                </div>
            )}
        </div>
    );
};

export default ManorDetailRow;
