import { toast } from "sonner";
import { useRef, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { useTranslations } from "next-intl";
import { MdOutlineDriveFolderUpload } from "react-icons/md"
import { userAtom } from "@/stores";
import { useAtom } from "jotai";
import { Base64Image } from "../GenerateVectorDiagram/page";

interface IProps {
    isSvg: boolean;
    onChangeFile: (file: File | null) => void;
}

export const UploadFile = (props: IProps) => {
    const { isSvg, onChangeFile } = props;

    const t = useTranslations();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [{ svgUrl }, setConfig] = useAtom(userAtom);

    const handleFileSelection = (file: File) => {
        if (isSvg) {
            if (file.type !== 'image/svg+xml') {
                toast.error(t('invalid_svg_file_format'));
                return;
            }
        } else {
            const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!validImageTypes.includes(file.type)) {
                toast.error(t('invalid_file_format'));
                return;
            }
        }
        onChangeFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            handleFileSelection(files[0]);
        }
    };

    const handleDeleteImage = (event: React.MouseEvent) => {
        event.stopPropagation(); // 防止触发父元素的点击事件
        onChangeFile(null);
        setPreviewUrl('');
        setConfig(v => ({ ...v, svgUrl: '' }))
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div
            className={`border min-h-[266px] cursor-pointer flex flex-col items-center justify-center text-center gap-4 rounded-[8px] px-3 py-8 relative ${isDragging ? 'bg-gray-100' : ''}`}
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept={isSvg ? ".svg" : "image/png,image/jpeg,image/jpg"}
            />
            {((isSvg && (previewUrl || svgUrl)) || previewUrl) ? (
                <div className="relative w-full h-full flex justify-center">
                    <Base64Image src={isSvg ? svgUrl || previewUrl : previewUrl} className="max-w-full max-h-[200px]" />
                    <button
                        className="absolute -top-[25px] right-0 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        onClick={handleDeleteImage}
                    >
                        <IoMdClose className="text-lg" />
                    </button>
                </div>
            ) : (
                <>
                    <MdOutlineDriveFolderUpload className="text-4xl" />
                    <div className="flex flex-col items-center justify-center text-sm">
                        <p>{isSvg ? t('upload_text') : t('drop_here')}</p>
                        <p>{t('or')}</p>
                        <p>{isSvg ? t('upload_text2') : t('upload_local_images')}</p>
                    </div>

                    <div className="text-slate-600 text-xs">
                        {isSvg ? t('upload_support_format_svg') : t('upload_tips')}
                    </div>
                </>
            )}
        </div>
    )
}