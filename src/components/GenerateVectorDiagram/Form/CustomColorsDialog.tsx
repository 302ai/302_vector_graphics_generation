import { toast } from "sonner";
import { useAtom } from "jotai";
import { useState } from "react";
import { v4 as uuidV4 } from 'uuid';
import { userAtom } from "@/stores";
import { Button } from "../../ui/button";
import { useTranslations } from "next-intl";
import { TiDeleteOutline } from "react-icons/ti";
import { RgbaColorPicker } from "react-colorful";
import { IoAddCircleOutline } from "react-icons/io5";
import { addColorsData, getColorsLsit } from "@/api/indexDB/ColorsDB";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";

const defaultColor = { r: 255, g: 255, b: 255, a: 1 };
export const CustomColorsDialog = () => {
    const t = useTranslations();
    const [_, setConfig] = useAtom(userAtom);

    const [open, setOpen] = useState(false);
    const [colorIndex, setColorsIndex] = useState(0);
    const [colors, setColors] = useState([{ ...defaultColor }]);

    const onAddColor = () => {
        if (colors.length === 10) {
            toast.info(t('upper_limit'));
            return;
        }
        setColors((v) => ([...v, { ...defaultColor }]))
        setColorsIndex((colors.length))
    }

    const onDeleteColor = (index: number) => {
        const newColor = colors.filter((color, colorIndex) => colorIndex !== index);
        setColors(newColor);
    }

    const onSaveColors = async () => {
        try {
            const data = { uid: uuidV4(), colors };
            await addColorsData(data)
            const newColors = await getColorsLsit();
            setConfig((v) => ({ ...v, customColors: newColors, vectorGraphic: { ...v.vectorGraphic, colorsId: data.uid, colors, colorAuto: false } }))
            setOpen(false);
            setColors([{ ...defaultColor }]);
            setColorsIndex(0)
        } catch (error) {
            toast.info(t('addColorError'));
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="text-[#8e47f0] py-3 cursor-pointer">
                    {t('Add_Custom_Colors')} +
                </div>
            </DialogTrigger>
            <DialogContent className="md:w-[650px] w-full">
                <DialogHeader>
                    <DialogTitle>{t('Custom_Colors')}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-5">
                    <div className="flex gap-3 flex-wrap items-center">
                        {
                            colors.map((rgb, index) => (
                                <div
                                    onClick={() => setColorsIndex(index)}
                                    key={`rgb(${rgb.r} ${rgb.g} ${rgb.b} ${rgb.a} ${index})`}
                                    style={{ backgroundColor: `rgb(${rgb.r} ${rgb.g} ${rgb.b} / ${rgb.a})` }}
                                    className={`border-2 rounded-sm w-10 h-10 relative group cursor-pointer ${index === colorIndex && 'border-[#8e47f0]'}`}
                                >
                                    {
                                        index > 0 &&
                                        <TiDeleteOutline
                                            onClick={() => onDeleteColor(index)}
                                            className="text-[20px] bg-white rounded-full text-red-600 absolute -right-[10px] -top-[10px] hidden group-hover:block"
                                        />
                                    }
                                </div>
                            ))
                        }
                        <div className="border-2 rounded-sm w-10 h-10 flex justify-center items-center cursor-pointer" onClick={onAddColor}>
                            <IoAddCircleOutline className="text-3xl text-[#8e47f0]" />
                        </div>
                    </div>
                    <div>
                        <section className="custom-layout border rounded-sm">
                            <RgbaColorPicker
                                color={colors[colorIndex]}
                                className="!w-full !h-[250px]"
                                onChange={(newColor) => {
                                    console.log('==============newColor', newColor);
                                    setColors(prevColors => prevColors.map((color, index) => index === colorIndex ? { ...newColor } : color));
                                }}
                            />
                        </section>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={onSaveColors}>{t('Save')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}