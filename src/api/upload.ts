import { replaceDomain } from "@/lib/utils";

export const upload = async (file: File) => {
    const formData = new FormData();
    formData.append('data', file);
    try {
        const response = await fetch(`https://upload.302ai.cn/gpt/api/upload/gpt/image`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`) }
        const imageResult = await response.json();
        if (imageResult?.data?.url) {
            const url = replaceDomain(imageResult.data.url)
            return url;
        }
        return imageResult?.data?.url;
    } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        return null;
    }
} 
