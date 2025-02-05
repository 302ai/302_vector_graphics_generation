export type SEOData = {
  supportLanguages: string[];
  fallbackLanguage: string;
  languages: Record<
    string,
    { title: string; description: string; image: string }
  >;
};

export const SEO_DATA: SEOData = {
  // TODO: Change to your own support languages
  supportLanguages: ["zh", "en", "ja"],
  fallbackLanguage: "en",
  // TODO: Change to your own SEO data
  languages: {
    zh: {
      title: "AI 矢量图生成",
      description: "使用AI生成矢量图或根据矢量图生成视频",
      image: "/images/global/vector_cn_tool_logo.png",
    },
    en: {
      title: "AI Vector Graphics Generation",
      description: "Use AI to generate vector graphics or generate videos based on vector graphics",
      image: "/images/global/vector_en_tool_logo.png",
    },
    ja: {
      title: "AI ベクター画像生成",
      description: "AI を使用してベクトルグラフィックを生成する、またはベクトルグラフィックに基づいてビデオを生成する",
      image: "/images/global/vector_zh_tool_logo.png",
    },
  },
};
