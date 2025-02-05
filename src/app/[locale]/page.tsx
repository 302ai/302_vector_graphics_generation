"use client";

import { useAtom } from "jotai";
import { useTranslations } from "next-intl";
import { appConfigAtom, userAtom } from "@/stores";
import { GenerateVideo } from "@/components/GenerateVideo/page";
import { GenerateVectorDiagram } from "@/components/GenerateVectorDiagram/page";
import { useEffect } from "react";
import { deleteSubmittedAndEmptyProductsAndGetRemaining } from "@/api/indexDB/FinishedProductDB";

export default function Home() {
  const t = useTranslations();
  const [{ hideBrand }] = useAtom(appConfigAtom);
  const [{ menuTab }, setConfig] = useAtom(userAtom);

  const tabLsit: { value: 1 | 2, label: string }[] = [
    { value: 1, label: t('Generate_vector_diagram') },
    { value: 2, label: t('Generate_videos_from_vector_graphics') },
  ]

  useEffect(() => {
    deleteSubmittedAndEmptyProductsAndGetRemaining().then(res => {
      setConfig((v) => ({ ...v, vectorGraphData: res }));
    });
  }, [])

  return (
    <div className="flex flex-col flex-1 text-2xl gap-5 md:max-w-[1350px] w-full mx-auto px-4 mb-5">
      <div className='w-full flex items-center justify-center gap-5 pt-5'>
        {!hideBrand && <img src="/images/global/logo-mini.png" className='md:h-14 h-12' />}
        <h2 className='md:text-[26px] text-[20px] font-bold'>{t('home.title')}</h2>
      </div>
      <div className="flex justify-center items-center gap-10 text-lg flex-wrap text-center">
        {
          tabLsit.map(item => (
            <div
              key={item.value}
              onClick={() => setConfig((v) => ({ ...v, menuTab: item.value }))}
              className={`cursor-pointer border-b-2 px-3 text-slate-600 ${menuTab === item.value && '!text-[#8e47f0] border-[#8e47f0]'}`}
            >
              {item.label}
            </div>
          ))
        }
      </div>
      <div className={`hidden h-full w-full ${menuTab === 1 && '!block'}`}>
        <GenerateVectorDiagram />
      </div>
      <div className={`hidden h-full w-full ${menuTab === 2 && '!block'}`}>
        <GenerateVideo />
      </div>
    </div>
  );
}
