import { v4 as uuidV4 } from 'uuid';
import { ImageCompareViewer } from './ImageCompareViewer';
import { Base64Image } from '../GenerateVectorDiagram/page';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMonitorMessage } from '@/hooks/global/use-monitor-message';
import { IoCloseOutline, IoArrowBackOutline, IoArrowForwardOutline, IoDownloadOutline } from 'react-icons/io5';
import { MdOutlineVideoCameraBack } from 'react-icons/md';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useTranslations } from 'next-intl';
import { userAtom } from '@/stores';
import { useAtom } from 'jotai';

interface IFinishedProduct {
    id?: number;
    videoUrl?: string;
    oldImageUrl?: string;
    newImageUrl?: string;
    type: "text" | "image" | "video";
}

interface ImageViewProps {
    vectorGraphData: IFinishedProduct[];
    initialImageUrl: string; // 使用图片链接替代索引
    onClose: () => void;
    onDownload: (url: string) => void;
}

export const ImageView: React.FC<ImageViewProps> = ({ vectorGraphData, initialImageUrl, onClose, onDownload }) => {
    const t = useTranslations();
    const [_, setConfig] = useAtom(userAtom);
    const { handleDownload } = useMonitorMessage();
    const [currentIndex, setCurrentIndex] = useState(0);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const selectedImageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    useEffect(() => {
        const initialIndex = vectorGraphData.findIndex(item => item.newImageUrl === initialImageUrl);
        setCurrentIndex(initialIndex !== -1 ? initialIndex : 0);
    }, [vectorGraphData, initialImageUrl]);

    const handlePrev = useCallback(() => {
        setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : vectorGraphData.length - 1));
    }, [vectorGraphData.length]);

    const handleNext = useCallback(() => {
        setCurrentIndex((prevIndex) => (prevIndex < vectorGraphData.length - 1 ? prevIndex + 1 : 0));
    }, [vectorGraphData.length]);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key === 'ArrowLeft') handlePrev();
        if (event.key === 'ArrowRight') handleNext();
        if (event.key === 'Escape') onClose();
    }, [handlePrev, handleNext, onClose]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    useEffect(() => {
        if (selectedImageRef.current && scrollContainerRef.current) {
            selectedImageRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }, [currentIndex]);

    const renderImage = (item: IFinishedProduct) => {
        if (item.type === 'text') {
            return <Base64Image src={item.newImageUrl || ''} className='h-full' />;
        } else {
            return (
                <ImageCompareViewer
                    beforeImage={item.oldImageUrl}
                    afterImage={item.newImageUrl}
                    options={{ animateIn: false }}
                />
            );
        }
    };

    const handleBackgroundClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        if (event.currentTarget === event.target) {
            onClose();
        }
    }, [onClose]);

    const currentItem = vectorGraphData[currentIndex];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-md">
            <div className='absolute right-2 top-2 flex flex-col items-center justify-center gap-4 text-white z-[10] '>
                <IoCloseOutline onClick={onClose} className='cursor-pointer text-3xl' />
                <TooltipProvider >
                    <Tooltip delayDuration={200}>
                        <TooltipTrigger>
                            <MdOutlineVideoCameraBack
                                className="text-2xl cursor-pointer"
                                onClick={() => {
                                    setConfig((v) => ({ ...v, svgUrl: currentItem.newImageUrl, menuTab: 2 }));
                                    onClose()
                                }}
                            />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t('generateVideo')}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <IoDownloadOutline onClick={() => handleDownload(currentItem?.newImageUrl || '', `${uuidV4()}.svg`)} className='text-2xl cursor-pointer' />
            </div>
            <div className="relative w-full h-full flex flex-col">
                <div className='w-full h-[calc(100vh-108px)] absolute left-0 top-0' onClick={onClose}></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-auto max-h-[calc(100vh-108px)] h-full flex justify-center">
                    {renderImage(currentItem)}
                </div>

                <button
                    onClick={handlePrev}
                    className="absolute left-4 top-[calc(50%-54px)] transform -translate-y-[50%-54px] text-white text-4xl hover:text-gray-300"
                >
                    <IoArrowBackOutline />
                </button>
                <button
                    onClick={handleNext}
                    className="absolute right-4 top-[calc(50%-54px)] transform -translate-y-[50%-54px] text-white text-4xl hover:text-gray-300"
                >
                    <IoArrowForwardOutline />
                </button>
                <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center p-4 bg-black bg-opacity-50">
                    <div className="flex gap-2 overflow-x-auto max-w-[80vw] custom-scrollbar" ref={scrollContainerRef}>
                        {vectorGraphData.map((item, index) => (
                            <div
                                key={item.id}
                                onClick={() => setCurrentIndex(index)}
                                className={`h-16 cursor-pointer flex-shrink-0 flex items-center justify-center`}
                                ref={item?.newImageUrl === currentItem?.newImageUrl ? selectedImageRef : null}
                            >
                                <div className={`w-16 h-16 flex items-center justify-center ${index === currentIndex ? 'border-2 border-white' : 'opacity-50 hover:opacity-75'
                                    }`}>
                                    <Base64Image
                                        src={item.newImageUrl || ''}
                                        className="object-contain max-w-full max-h-full"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};