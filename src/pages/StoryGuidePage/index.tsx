import React, { useState, useEffect } from "react";
import { Button, Typography } from "@worldcoin/mini-apps-ui-kit-react";
import { ArrowLeft, ArrowRight } from "iconoir-react";

interface StoryGuidePageProps {
    onComplete: () => void;
}

interface Story {
    content: string;
    image: string;
}

const stories: Story[] = [
    {
        content: "从前，有个卖牛肉的人。",
        image: "/sell_beef.jpg",
    },
    {
        content: "有一天，他发现了比特币这个金矿。",
        image: "/found_btc.jpg",
    },
    {
        content: "随后，他创建了中国内蒙最大的比特币矿场。",
        image: "/mine_btc.jpg",
    },
    {
        content: "不幸的是，中国政府一纸禁令，矿场被迫关闭。",
        image: "/ban_mining.jpg",
    },
    {
        content: "他开着车在全中国宣传比特币，俗称“比特币中国行”。",
        image: "/btc_china_trip.jpg",
    },
    {
        content: "他曾经对大家说：“以前60、70后把3000一平米的房子，以3万价格卖给我们。以后我要把现在3000一个的比特币，以10万美金的价格卖给你们！”",
        image: "/say.jpg",
    },
    {
        content: "随后，比特币价格一路飙升。",
        image: "/btc_rise.jpg",
    },
    {
        content: "他又对大家说：“比特币以后一定会100万美金一个，否则我吃屎给你们看！”",
        image: "/say.jpg",
    },
    {
        content: "他说：“你们一定要给自己的孩子买一个比特币。”",
        image: "/family.jpg",
    }
];

const StoryGuidePage: React.FC<StoryGuidePageProps> = ({ onComplete }) => {
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});
    const currentStory = stories[currentStoryIndex];
    const isLastStory = currentStoryIndex === stories.length - 1;
    const currentImageLoaded = imageLoaded[currentStoryIndex];

    useEffect(() => {
        const preloadImages = async () => {
            const imagePromises = stories.map((story, index) => {
                return new Promise<void>((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        setImageLoaded(prev => ({ ...prev, [index]: true }));
                        resolve();
                    };
                    img.onerror = () => {
                        setImageLoaded(prev => ({ ...prev, [index]: false }));
                        resolve();
                    };
                    img.src = story.image;
                });
            });
            await Promise.all(imagePromises);
        };
        preloadImages().catch(console.error);
    }, []);

    const handleNext = () => {
        if (isLastStory) {
            onComplete();
        } else {
            setCurrentStoryIndex((prev) => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex((prev) => prev - 1);
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    return (
        <div className={`w-screen h-screen flex flex-col`}>
            {/* 头部：进度条和跳过按钮 */}
            <div className="flex items-center justify-between p-6 pb-4">
                <div className="flex-1">
                    <div className="flex gap-1">
                        {stories.map((_, index) => (
                            <div
                                key={index}
                                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                                    index <= currentStoryIndex ? "bg-gray-900" : "bg-gray-300"
                                }`}
                            />
                        ))}
                    </div>
                </div>
                <Button variant="secondary" size="sm" onClick={handleSkip} className="ml-4 text-gray-600">
                    跳过
                </Button>
            </div>

            {/* 中间：故事内容 */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-6">
                {/* 门的图片区域 */}
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <div
                            key={`image-${currentStoryIndex}`}
                            className={`${
                                currentImageLoaded ? "animate__animated animate__fadeIn" : "opacity-0"
                            }`}
                            style={{ width: "calc(90vw)", aspectRatio: "3/2" }}
                        >
                            <img
                                src={currentStory.image}
                                alt="韭菜庄园"
                                className="w-full h-full object-cover rounded-lg"
                            />
                        </div>
                        {!currentImageLoaded && (
                            <div
                                className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center animate__animated animate__pulse animate__infinite"
                                style={{ width: "calc(90vw)", aspectRatio: "3/2" }}
                            >
                                <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate__animated animate__rotateIn animate__infinite"></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 主要问候语 */}
                <div className="text-center mb-16">
                    <div
                        key={`content-${currentStoryIndex}`}
                        className={`${
                            currentImageLoaded ? "animate__animated animate__fadeInUp" : "opacity-50"
                        }`}
                    >
                        <Typography variant="heading" level={2}>
                            {currentStory.content}
                        </Typography>
                    </div>
                </div>
            </div>

            {/* 底部：导航按钮 */}
            <div className="flex items-center justify-between p-6 pt-0 mb-4">
                <Button
                    variant="primary"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentStoryIndex === 0}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    上一个
                </Button>

                <div className="flex items-center gap-2 text-gray-500">
                    <Typography variant="heading" level={1}>
                        {currentStoryIndex + 1} / {stories.length}
                    </Typography>
                </div>

                <Button variant="primary" size="sm" onClick={handleNext} className="flex items-center gap-2">
                    {isLastStory ? "步入新的开始" : "下一个"}
                    {!isLastStory && <ArrowRight className="w-4 h-4" />}
                </Button>
            </div>
        </div>
    );
};

export default StoryGuidePage;
