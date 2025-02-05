import { toast } from "sonner"
import { useAtom } from "jotai"
import { v4 as uuidV4 } from 'uuid'
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Loader2 } from "lucide-react"
import { urlToFile } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { generationVideo } from "./service"
import { UploadFile } from "../Upload/page"
import VideoPlayer from "../VideoPlayer/page"
import { ErrorToast } from "../ui/errorToast"
import { BiLoaderCircle } from "react-icons/bi"
import { MdOutlineCancel } from "react-icons/md"
import { appConfigAtom, userAtom } from "@/stores"
import { useCallback, useMemo, useRef, useState } from "react"
import { addFinishedProductData, deleteFinishedProductData, getFinishedProductLsit, IFinishedProduct, updateFinishedProductData } from "@/api/indexDB/FinishedProductDB"

export const GenerateVideo = () => {
    const t = useTranslations();
    const abortControllersRef = useRef<Map<number, AbortController>>(new Map());

    const [{ apiKey }] = useAtom(appConfigAtom);
    const [{ vectorGraphData, duration, svgUrl }, setConfig] = useAtom(userAtom);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const filteredDataVideo = useMemo(() =>
        vectorGraphData?.filter((f) => f.type === 'video') || [],
        [vectorGraphData]
    );

    const onDelete = useCallback(async (id?: number) => {
        if (!id) return;
        await deleteFinishedProductData(id);
        const newData = await getFinishedProductLsit();
        setConfig((v) => ({ ...v, vectorGraphData: newData }));
    }, [setConfig]);

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

    const onGenerationVideo = async () => {
        if (!selectedFile && !svgUrl) {
            return toast.info(t('upload_files'));
        }
        if (!apiKey) {
            return toast.info(t('apikey_does_not_exist'));
        }
        const abortController = new AbortController();

        let svg_content = selectedFile;
        if (svgUrl) {
            svg_content = await urlToFile(svgUrl, `${uuidV4()}.svg`)
        }
        if (svg_content) {
            const newData = await onAddFinishedProductData({ newImageUrl: '', status: 'submitted', type: 'video' })
            if (newData?.id) {
                abortControllersRef.current.set(newData.id, abortController);
            }
            const result = await generationVideo({ svg_content, duration }, apiKey, abortController.signal,)
            if (result?.error) {
                if (result?.error?.name !== 'AbortError') {
                    if (result.error?.err_code) {
                        toast.error(() => (ErrorToast(result.error?.err_code)));
                    } else {
                        onDelete(newData.id)
                        toast.info(t('generate_error'));
                    }
                }
            } else {
                if (result?.url) {
                    await onUpdateFinishedProductData({ ...newData, videoUrl: result?.url, status: 'succeed' })
                    toast.info(t('generate_video_success'));
                } else {
                    onDelete(newData.id)
                    toast.info(t('generate_error'));
                }
            }
        }
    }

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

    return (
        <div className="flex gap-5 justify-center h-full w-full md:flex-row flex-col">
            <div className="md:w-[320px] w-full md:border-r-2 flex gap-5 flex-col md:pr-5 md:h-[calc(100vh-220px)] md:sticky md:top-5">
                <UploadFile isSvg={true} onChangeFile={(file) => setSelectedFile(file)} />
                <div className="flex items-center justify-between text-sm">
                    <div>{t('video_duration')}</div>
                    <Input
                        max={15}
                        className="w-[80px]"
                        value={duration}
                        onChange={(e) => {
                            let value = +e.target.value
                            if (!isNaN(value)) {
                                if (value > 15) {
                                    value = 15;
                                    toast.info(t('video_duration_max'));
                                }
                                setConfig((v) => ({ ...v, duration: value }));
                            }
                        }}
                        onBlur={() => {
                            if (duration < 1) {
                                setConfig((v) => ({ ...v, duration: 1 }));
                                toast.info(t('video_duration_min'));
                            }
                        }}
                    />
                </div>

                <div className="flex gap-3">
                    <Button onClick={onGenerationVideo} disabled={!selectedFile && !svgUrl} className="w-full">
                        {t('generateButton')}
                    </Button>
                </div>
            </div>
            <div className={`flex-1 w-full md:gap-5 gap-3 ${filteredDataVideo.length && 'grid h-fit lg:grid-cols-2 grid-cols-1'}`}>
                {
                    filteredDataVideo.length ?
                        filteredDataVideo.map(item => (
                            <div key={item?.id} className="border lg:h-[300px] h-full rounded-sm overflow-hidden relative">
                                {
                                    item?.status !== 'submitted' ? <VideoPlayer id={item?.id} videoUrl={item.videoUrl} />
                                        :
                                        <div className="rounded-sm flex flex-col items-center justify-center gap-5 relative h-full">
                                            <MdOutlineCancel className="text-red-500 absolute right-1 top-1 cursor-pointer" onClick={() => onCancelRequest(item)} />
                                            <BiLoaderCircle className="animate-spin text-[70px]" />
                                            <div className="text-lg">{t('generation_video')}</div>
                                        </div>
                                }
                            </div>
                        )) :
                        <div className="flex items-center justify-center flex-col w-full h-full gap-5 text-slate-500">
                            <img className="object-contain" src="/images/global/empty.png" alt="Empty" />
                            <p className="text-2xl">{t('empty_video')}</p>
                        </div>
                }
            </div>
        </div>
    )
}