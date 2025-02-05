import { useAtom } from "jotai";
import { v4 as uuidV4 } from 'uuid';
import { userAtom } from "@/stores";
import { Button } from "../ui/button";
import { FormMenu } from './Form/Form';
import { imageToBase } from '@/lib/utils';
import Masonry from 'react-layout-masonry';
import { useTranslations } from "next-intl";
import { AiOutlineDelete } from "react-icons/ai";
import { RiFullscreenFill } from "react-icons/ri";
import { IoDownloadOutline } from "react-icons/io5";
import ReactCompareImage from 'react-compare-image';
import { MdOutlineVideoCameraBack } from "react-icons/md";
import { useMonitorMessage } from "@/hooks/global/use-monitor-message";
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { deleteFinishedProductData, getFinishedProductLsit, IFinishedProduct } from "@/api/indexDB/FinishedProductDB";
import { ImageView } from "../ImageView/page";
import { BiLoaderCircle } from "react-icons/bi";
import { MdOutlineCancel } from "react-icons/md";

// 定义 Base64ImageProps 接口
interface Base64ImageProps {
    src: string;
    alt?: string;
    className?: string;
}

// 定义 MasonryItem 组件的 props 类型
interface MasonryItemProps {
    item: IFinishedProduct;
    onDelete: (id?: number) => void;
    handleDownload: (url: string, filename?: string) => void;
}

// Base64Image 组件优化
export const Base64Image: React.FC<Base64ImageProps> = React.memo(({ src, alt = '', className = '' }) => {
    const [base64, setBase64] = useState<string | null>(null);
    useEffect(() => {
        let isMounted = true;
        imageToBase(src).then(res => {
            if (isMounted) setBase64(res);
        });
        return () => { isMounted = false; };
    }, [src]);
    return base64 ? <img src={base64} alt={alt} className={className} /> : null;
});

Base64Image.displayName = 'Base64Image';

export const GenerateVectorDiagram = () => {
    const t = useTranslations();
    const { handleDownload } = useMonitorMessage();
    const [{ vectorGraphData }, setConfig] = useAtom(userAtom);

    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [currentImage, setCurrentImage] = useState('');

    const abortControllersRef = useRef<Map<number, AbortController>>(new Map());

    const onDelete = useCallback(async (id?: number) => {
        if (!id) return;
        await deleteFinishedProductData(id);
        const newData = await getFinishedProductLsit();
        setConfig((v) => ({ ...v, vectorGraphData: newData }));
    }, [setConfig]);

    const openImageViewer = useCallback((item: IFinishedProduct) => {
        setCurrentImage(item.newImageUrl || '');
        setIsViewerOpen(true);
    }, []);

    const onCancelRequest = async (item: IFinishedProduct) => {
        if (item?.id) {
            const controller = abortControllersRef.current.get(item.id);
            if (controller) {
                controller.abort();
                abortControllersRef.current.delete(item.id);
            };
            await onDelete(item?.id)
        }
    }

    const filteredData = useMemo(() =>
        vectorGraphData?.filter((f) => f.type !== 'video') || [],
        [vectorGraphData]
    );

    // MasonryItem 组件优化
    const MasonryItem: React.FC<MasonryItemProps & { index: number }> = React.memo(({ item, index, onDelete, handleDownload }) => {
        const t = useTranslations();
        const [_, setConfig] = useAtom(userAtom);

        const memoizedImage = useMemo(() => (
            <Base64Image src={item.newImageUrl || ''} />
        ), [item.type, item.newImageUrl, item.oldImageUrl]);

        const handleDeleteClick = useCallback(() => onDelete(item?.id), [onDelete, item?.id]);
        const handleDownloadClick = useCallback(() => handleDownload(item?.newImageUrl || '', `${uuidV4()}.svg`), [handleDownload, item?.newImageUrl]);
        return (
            <>
                {
                    item?.status !== 'submitted' ?
                        <div className="border rounded-sm overflow-hidden relative transition-all duration-300 ease-in-out group">
                            <div
                                onClick={() => openImageViewer(item)}
                                className="absolute w-[60%] h-[60%] top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] cursor-pointer"
                            />
                            {memoizedImage}
                            <div className="w-full hidden justify-between absolute right-0 bottom-0 p-1 group-hover:flex">
                                <Button variant="icon" size="sm" onClick={handleDeleteClick}>
                                    <AiOutlineDelete className="text-sm text-red-600" />
                                </Button>
                                <div className="flex gap-3 items-center">
                                    <TooltipProvider>
                                        <Tooltip delayDuration={200}>
                                            <TooltipTrigger asChild>
                                                <Button variant="icon" size="sm" onClick={() => setConfig((v) => ({ ...v, svgUrl: item.newImageUrl, menuTab: 2 }))}>
                                                    <MdOutlineVideoCameraBack className="text-lg text-[#8e47f0]" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{t('generateVideo')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <Button variant="icon" size="sm" onClick={handleDownloadClick}>
                                        <IoDownloadOutline className="text-lg text-[#8e47f0]" />
                                    </Button>
                                </div>
                            </div>
                        </div> :
                        <div className="h-[250px] border rounded-sm flex flex-col items-center justify-center gap-5 relative" key={item.id}>
                            <MdOutlineCancel className="text-red-500 absolute right-1 top-1 cursor-pointer" onClick={() => onCancelRequest(item)} />
                            <BiLoaderCircle className="animate-spin text-[70px]" />
                            <div className="text-lg">{t('vector_graph_generation_in_progress')}</div>
                        </div>
                }
            </>
        );
    });

    MasonryItem.displayName = 'MasonryItem';

    const masonryContent = useMemo(() => (
        filteredData.length ? (
            <Masonry
                columns={{ 640: 1, 768: 2, 1240: 3 }}
                gap={12}
                className="w-full"
            >
                {
                    filteredData.map((item, index) => (
                        <MasonryItem
                            item={item}
                            key={item.id}
                            index={index}
                            onDelete={onDelete}
                            handleDownload={handleDownload}
                        />
                    ))}
            </Masonry>
        ) : (
            <div className="flex items-center justify-center flex-col w-full h-full gap-5 text-slate-500">
                <img className="object-contain" src="/images/global/empty.png" alt="Empty" />
                <p className="text-2xl">{t('empty_image')}</p>
            </div>
        )
    ), [filteredData, onDelete, handleDownload, t]);

    return (
        <div className="flex gap-5 h-full w-full md:flex-row flex-col">
            <FormMenu
                onRequest={(params) => {
                    if (abortControllersRef.current.get(params.id)) {
                        abortControllersRef.current.delete(params.id);
                    }
                    abortControllersRef.current.set(params.id, params.abortController);
                }}
            />
            {masonryContent}
            {isViewerOpen && (
                <ImageView
                    vectorGraphData={filteredData.filter(f => f?.status !== 'submitted')}
                    initialImageUrl={currentImage}
                    onClose={() => setIsViewerOpen(false)}
                    onDownload={handleDownload}
                />
            )}
        </div>
    );
};