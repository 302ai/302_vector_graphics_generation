import ky from "ky";

export interface IParams {
    svg_content: File;
    duration: number;
}

export const generationVideo = async (params: IParams, apiKey: string, signal: AbortSignal) => {
    const formData = new FormData();
    formData.append('svg_content', params.svg_content)
    formData.append('duration', `${params.duration}`)
    formData.append('video_format', 'mp4')
    formData.append('fps_speed', '1')

    try {
        const result = await ky(`https://api-videolingo.tools302.com/api/v1/svg/generate_video`, {
            signal,
            method: 'post',
            timeout: false,
            body: formData,
            headers: { "Authorization": `Bearer ${apiKey}` }
        }).then(res => res.json())
        return result;
    } catch (error: any) {
        if (error.response) {
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