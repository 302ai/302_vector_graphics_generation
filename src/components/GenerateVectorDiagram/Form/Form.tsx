import { toast } from "sonner";
import { useAtom } from "jotai";
import { upload } from "@/api/upload";
import { Loader2 } from "lucide-react";
import { Button } from "../../ui/button";
import { useTranslations } from "next-intl";
import { ImMagicWand } from "react-icons/im";
import { Textarea } from "../../ui/textarea";
import { FaAngleDown } from "react-icons/fa6";
import { AiOutlineCheck } from "react-icons/ai";
import { TiDeleteOutline } from "react-icons/ti";
import { UploadFile } from "@/components/Upload/page";
import { ErrorToast } from "@/components/ui/errorToast";
import { appConfigAtom, Color, userAtom } from "@/stores";
import { CustomColorsDialog } from "./CustomColorsDialog";
import { presetsColors, siezList } from "@/constants/image";
import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { deleteColorsData, getColorsLsit } from "@/api/indexDB/ColorsDB";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { addFinishedProductData, deleteFinishedProductData, getFinishedProductLsit, IFinishedProduct, updateFinishedProductData } from "@/api/indexDB/FinishedProductDB";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { ITextGenerationVectorGraphics, onImageGenerationVectorGraphics, onTextGenerationVectorGraphics } from "../service";
import { optimizePromptWords } from "@/services";

export const FormMenu = (props: { onRequest: (paras: { id: number, abortController: AbortController }) => void }) => {
    const t = useTranslations();
    const [{ apiKey, modelName: model }] = useAtom(appConfigAtom);
    const [{ vectorGraphic, customColors }, setConfig] = useAtom(userAtom);

    const [tab, setTab] = useState('txt')
    const [open, setOpen] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState({ text: false, image: false, optimize: false });

    const abortControllersRef = useRef<{ txt: AbortController | null, image: AbortController | null }>({ txt: null, image: null })

    const styleList = [
        { value: 'vector_illustration', label: t('Illustration') },
        { value: 'vector_illustration/engraving', label: t('carving') },
        { value: 'vector_illustration/line_art', label: t('Brief_strokes') },
        { value: 'vector_illustration/linocut', label: t('Artistic_lines') },
        { value: 'vector_illustration/line_circuit', label: t('Abstract_lines') },
    ]

    const onAddFinishedProductData = async (params: IFinishedProduct) => {
        const result = await addFinishedProductData({ ...params });
        const newData = await getFinishedProductLsit();
        setConfig((v) => ({ ...v, vectorGraphData: newData }));
        return result;
    }

    const onUpdateFinishedProductData = async (params: IFinishedProduct) => {
        if (params?.id) {
            await updateFinishedProductData(params.id, { ...params });
            const newData = await getFinishedProductLsit();
            setConfig((v) => ({ ...v, vectorGraphData: newData }));
        }
    }

    const onDelete = useCallback(async (id?: number) => {
        if (!id) return;
        await deleteFinishedProductData(id);
        const newData = await getFinishedProductLsit();
        setConfig((v) => ({ ...v, vectorGraphData: newData }));
    }, [setConfig]);

    const onGenerate = async () => {
        if (!apiKey) {
            toast.info(t('apikey_does_not_exist'));
            return;
        }
        const image_size = vectorGraphic.image_size.split('x')
        const abortController = new AbortController();
        abortControllersRef.current.txt = abortController;
        const params: ITextGenerationVectorGraphics = {
            apiKey,
            signal: abortController.signal,
            body: {
                prompt: vectorGraphic.prompt,
                style: vectorGraphic.style,
                image_size: {
                    width: +image_size[0],
                    height: +image_size[1],
                }
            },
        }
        if (!vectorGraphic.colorAuto) {
            params.body.colors = vectorGraphic.colors
        }
        const newData = await onAddFinishedProductData({ newImageUrl: '', status: 'submitted', type: 'text' })
        if (newData?.id) {
            props.onRequest({ id: newData.id, abortController })
        }
        const result = await onTextGenerationVectorGraphics(params);
        if (result?.error) {
            onDelete(newData.id)
            if (result?.error?.name !== 'AbortError') {
                if (result.error?.err_code) {
                    toast.error(() => (ErrorToast(result.error?.err_code)));
                } else {
                    toast.info(t('generate_error'));
                }
            }
        } else {
            if (result?.images?.length) {
                const url = result.images[0].url;
                await onUpdateFinishedProductData({ ...newData, newImageUrl: url, status: 'succeed' })
                toast.info(t('generate_success'));
            } else {
                onDelete(newData.id)
                toast.info(t('generate_error'));
            }
        }
    }

    const onVectorizeImage = async (file: File) => {
        if (!apiKey) {
            toast.info(t('apikey_does_not_exist'));
            return;
        }
        const abortController = new AbortController();
        abortControllersRef.current.image = abortController;
        const newData = await onAddFinishedProductData({ newImageUrl: '', status: 'submitted', type: 'image' })
        if (newData?.id) {
            props.onRequest({ id: newData.id, abortController })
        }
        const result = await onImageGenerationVectorGraphics({ file, apiKey, signal: abortController.signal });
        if (result?.error) {
            onDelete(newData.id)
            if (result?.error?.name !== 'AbortError') {
                if (result.error?.err_code) {
                    toast.error(() => (ErrorToast(result.error?.err_code)));
                } else if (result?.error?.code === 'bad_response_status_code') {
                    toast.info(`${t('generate_error')} :${result.error?.message}`);
                } else {
                    toast.info(t('generate_error'));
                }
            }
        } else {
            if (result?.image?.url) {
                const oldImageUrl = await upload(file)
                const url = result?.image?.url;
                await onUpdateFinishedProductData({ ...newData, oldImageUrl, newImageUrl: url, status: 'succeed' })
                toast.info(t('generate_success'));
            } else {
                onDelete(newData.id)
                toast.info(t('generate_error'));
            }
        }
    }

    const onSetBg = (rgb: Color): CSSProperties => {
        return { backgroundColor: `rgb(${rgb.r} ${rgb.g} ${rgb.b} / ${rgb.a})` }
    }

    const onDeleteColor = async (id?: number, uid?: string) => {
        if (id) {
            await deleteColorsData(id);
            const newColors = await getColorsLsit();
            setConfig((v) => ({
                ...v,
                customColors: newColors,
                vectorGraphic: { ...v.vectorGraphic, colorAuto: v.vectorGraphic.colorAuto || vectorGraphic?.colorsId === uid }
            }));
        }
    }

    const onSetData = (name: string, value: string | boolean | Color[], colorsId?: number | string) => {
        let colorAuto = vectorGraphic.colorAuto;
        if (name === 'colors') {
            colorAuto = false
        } else if (name === 'colorAuto') {
            colorAuto = value as boolean
        }
        setConfig((v) => ({ ...v, vectorGraphic: { ...v.vectorGraphic, [name]: value, colorsId: colorsId || vectorGraphic.colorsId, colorAuto } }));
        setOpen(false)
    }

    const onOptimizePromptWords = async () => {
        if (!vectorGraphic?.prompt.trim()) return;
        if (!apiKey) {
            toast.info(t('apikey_does_not_exist'));
            return;
        }
        try {
            setIsLoading((v) => ({ ...v, optimize: true }))
            const result = await optimizePromptWords({ apiKey, model, text: vectorGraphic.prompt });
            if (result?.error) {
                toast.error(() => (ErrorToast(result.error?.err_code)));
            } else {
                onSetData('prompt', result)
            }
        } catch (error) {
            toast.info(t('optimize_error'));
        }
        setIsLoading((v) => ({ ...v, optimize: false }))
    }

    useEffect(() => {
        getColorsLsit().then(data => {
            setConfig((v) => ({ ...v, customColors: data, }));
        })
    }, [])

    return (
        <div className="md:w-[320px] md:min-w-[320px] w-full md:h-[calc(100vh-220px)] md:sticky md:top-5 md:border-r-2 flex gap-5 flex-col md:pr-5 ">
            <div className="grid grid-cols-2 text-base border rounded-sm text-center p-1">
                <div className={`p-1 cursor-pointer rounded-sm ${tab === 'txt' && 'bg-[#8e47f0] text-white'}`} onClick={() => setTab('txt')}>{t('textGenerationVectorGraphics')}</div>
                <div className={`p-1 cursor-pointer rounded-sm ${tab === 'image' && 'bg-[#8e47f0] text-white'}`} onClick={() => setTab('image')}>{t('imgGenerationVectorGraphics')}</div>
            </div>

            <div className={`gap-5 grid-cols-1 hidden ${tab === 'txt' && '!grid'}`}>
                <div className="flex flex-col items-end border rounded-[8px] overflow-hidden px-3 py-2">
                    <Textarea
                        value={vectorGraphic?.prompt}
                        className="resize-none h-[200px] !border-none shadow-none focus-visible:ring-white p-0"
                        placeholder={t('TextareaPlaceholder')}
                        onChange={(e) => onSetData('prompt', e.target.value)}
                    />
                    {
                        isLoading.optimize ?
                            <div className="flex items-center text-sm text-[#8e47f0]">
                                {t('qptimize_prompt_words_tips')}<Loader2 className="h-4 w-4 animate-spin" />
                            </div> :
                            <TooltipProvider>
                                <Tooltip delayDuration={200}>
                                    <TooltipTrigger>
                                        <ImMagicWand className="text-base cursor-pointer text-[#8e47f0]" onClick={onOptimizePromptWords} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{t('qptimize_prompt_words')}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                    }
                </div>
                <Select value={vectorGraphic?.style} onValueChange={(value: string) => onSetData('style', value)}>
                    <SelectTrigger className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {styleList.map(item => (<SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <Select value={vectorGraphic?.image_size} onValueChange={(value: string) => onSetData('image_size', value)}>
                    <SelectTrigger className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            {siezList.map(item => (<SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild className="w-full">
                        <div className="border rounded-sm flex items-center justify-between overflow-hidden pl-3 cursor-pointer h-9">
                            {
                                vectorGraphic.colorAuto ? <div style={{ fontSize: 16 }}>{t('auto')}</div> :
                                    <div className="flex gap-2 py-2">
                                        {vectorGraphic.colors.map((rgb, index) => (
                                            <div key={`rgb(${rgb.r} ${rgb.g} ${rgb.b} ${rgb.a} ${index})`} className="w-4 h-4 border" style={onSetBg(rgb)} />
                                        ))}
                                    </div>
                            }
                            <div className="border-l rounded-sm h-full flex justify-center items-center px-[10px]">
                                <FaAngleDown className="text-sm" />
                            </div>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="md:w-[320px] w-[calc(100vw-32px)] md:max-h-[calc(100vh-560px)] max-h-[50vh] overflow-y-auto">
                        <div className="flex flex-col gap-3 text-sm">
                            <div className="flex items-center justify-between cursor-pointer" onClick={() => onSetData('colorAuto', true)}>
                                {t('auto')} {vectorGraphic.colorAuto && <AiOutlineCheck className="text-lg  font-bold" />}
                            </div>
                            {
                                Object.keys(presetsColors).map((key: string) => (
                                    <div
                                        key={key}
                                        onClick={() => onSetData('colors', presetsColors[key], key)}
                                        className={`flex gap-2 py-2 border rounded-sm px-2 cursor-pointer ${key === vectorGraphic.colorsId && 'border-[#8e47f0]'}`}
                                    >
                                        {
                                            presetsColors[key].map((rgb, index) => (
                                                <div className="w-4 h-4 border" key={`rgb(${rgb.r} ${rgb.g} ${rgb.b} ${rgb.a} ${index})`} style={onSetBg(rgb)} />
                                            ))
                                        }
                                    </div>
                                ))
                            }
                            {
                                customColors?.length ?
                                    customColors.map(item => (
                                        <div
                                            key={item.uid}
                                            onClick={() => onSetData('colors', item.colors, item.uid)}
                                            className={`flex border rounded-sm gap-2 px-2 cursor-pointer items-center justify-between 
                                    ${(item.uid === vectorGraphic.colorsId && !vectorGraphic.colorAuto) && 'border-[#8e47f0]'}`
                                            }
                                        >
                                            <div className={`flex gap-2 py-2`}>
                                                {
                                                    item.colors.map((rgb, index) => (
                                                        <div
                                                            className="w-4 h-4 border"
                                                            style={onSetBg(rgb)}
                                                            key={`rgb(${rgb.r} ${rgb.g} ${rgb.b} ${rgb.a} ${index})`}
                                                        />
                                                    ))
                                                }
                                            </div>
                                            <TiDeleteOutline className="text-[20px] text-red-600" onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                onDeleteColor(item.id, item.uid)
                                            }} />
                                        </div>
                                    ))
                                    : <></>
                            }
                            <CustomColorsDialog />
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            <div className={`${tab === 'image' && '!block'} hidden`}>
                <UploadFile isSvg={false} onChangeFile={(file) => setSelectedFile(file)} />
            </div>
            <div className="flex gap-3">
                <Button
                    disabled={(tab === 'image' && !selectedFile) || (tab === 'txt' && !vectorGraphic?.prompt?.trim().length)}
                    onClick={() => {
                        if (tab === 'txt') {
                            onGenerate()
                        } else {
                            if (selectedFile) {
                                onVectorizeImage(selectedFile)
                            }
                        }
                    }}
                    className="w-full"
                >
                    {t('generateButton')}
                </Button>
            </div>
        </div>
    )
}