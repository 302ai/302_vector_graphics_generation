import ky from "ky";
import { env } from "@/env";
import { Color } from "@/stores";

export interface ITextGenerationVectorGraphics {
    apiKey: string;
    body: {
        prompt: string;
        image_size: {
            width: number;
            height: number;
        };
        style: string;
        colors?: Color[]
    },
    signal: AbortSignal
}

export const onTextGenerationVectorGraphics = async (params: ITextGenerationVectorGraphics) => {
    const { apiKey, body, signal } = params;
    try {
        const result = await ky(`${env.NEXT_PUBLIC_API_URL}/302/submit/recraft-v3`, {
            signal,
            method: 'post',
            timeout: false,
            body: JSON.stringify(body),
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            }
        }).then(res => res.json())
        return result;
    } catch (error: any) {
        if (error.response) {
            // 尝试从响应中解析错误信息
            try {
                const errorData = await error.response.json();
                return errorData;
            } catch (parseError) {
                return { error: parseError }
            }
        } else {
            return { error }
        }
    }
}

export const onImageGenerationVectorGraphics = async (params: { file: File, apiKey: string, signal: AbortSignal }) => {
    const { apiKey, file, signal } = params;
    const formData = new FormData();
    formData.append('file', file)
    formData.append('response_format', 'url')
    try {
        const result = await ky(`${env.NEXT_PUBLIC_API_URL}/recraft/v1/images/vectorize`, {
            signal,
            method: 'post',
            timeout: false,
            body: formData,
            headers: { "Authorization": `Bearer ${apiKey}`, }
        }).then(res => res.json())
        return result;
    } catch (error: any) {
        if (error.response) {
            // 尝试从响应中解析错误信息
            try {
                const errorData = await error.response.json();
                return errorData;
            } catch (parseError) {
                return { error: parseError }
            }
        } else {
            return { error }
        }
    }
}