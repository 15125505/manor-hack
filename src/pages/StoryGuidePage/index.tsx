import React, { useState, useEffect, useMemo } from "react";
import { Button, Typography } from "@worldcoin/mini-apps-ui-kit-react";
import { ArrowLeft, ArrowRight } from "iconoir-react";
import { useTranslation } from "react-i18next";

interface StoryGuidePageProps {
    onComplete: () => void;
}

const STORY_IMAGES = [
    "/sell_beef.jpg",
    "/found_btc.jpg",
    "/mine_btc.jpg",
    "/ban_mining.jpg",
    "/btc_china_trip.jpg",
    "/say.jpg",
    "/btc_rise.jpg",
    "/say.jpg",
    "/family.jpg",
];

interface Story {
    content: string;
    image: string;
}

const StoryGuidePage: React.FC<StoryGuidePageProps> = ({ onComplete }) => {
    const { t } = useTranslation();
    const storyTexts = useMemo(
        () => t("storyGuide.stories", { returnObjects: true }) as string[],
        [t],
    );
    const stories = useMemo<Story[]>(
        () => STORY_IMAGES.map((image, index) => ({ content: storyTexts[index] ?? "", image })),
        [storyTexts],
    );
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
    }, [stories]);

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
                    {t("storyGuide.skip")}
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
                                alt={t("storyGuide.alt")}
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
                    {t("storyGuide.previous")}
                </Button>

                <div className="flex items-center gap-2 text-gray-500">
                    <Typography variant="heading" level={1}>
                        {currentStoryIndex + 1} / {stories.length}
                    </Typography>
                </div>

                <Button variant="primary" size="sm" onClick={handleNext} className="flex items-center gap-2">
                    {isLastStory ? t("storyGuide.finish") : t("storyGuide.next")}
                    {!isLastStory && <ArrowRight className="w-4 h-4" />}
                </Button>
            </div>
        </div>
    );
};

export default StoryGuidePage;
