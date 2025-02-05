'use server'
import { env } from "@/env";
import { OpenAI } from 'openai'
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';


const system = `Optimize and enhance the prompts provided for image generation to ensure that the model can generate excellent views.
Provide a detailed and accurate description of the prompt view. If the provided prompt is too simple, add some sections. If necessary, use some famous IP names.
Introduce the topic with higher weights. Avoid introductory phrases like 'This image shows' or 'In the scene'. Don't use words describing cultural values or spirits, such as "creating xxx atmosphere" or "implying xxx". Avoid ambiguous words. Describe the scene directly. Don't overly describe difficult-to-depict elements.
Always return results in plain text format, matching the language of the user's input. Do not add any other content.`

export const optimizePromptWords = async (params: { text: string, apiKey: string, model?: string }) => {
    const { apiKey, model = "gpt-4o-mini", text } = params;
    const fetchUrl = env.NEXT_PUBLIC_API_URL + '/v1'
    const openai = new OpenAI({ apiKey, baseURL: fetchUrl });
    const messages: Array<ChatCompletionMessageParam> = [
        { role: 'system', content: system },
        { role: "user", content: text }
    ]
    try {
        const response = await openai.chat.completions.create({
            model,
            stream: false,
            messages
        });
        if (response?.choices[0]?.message?.content) {
            const prompt = response?.choices[0]?.message?.content;
            return prompt;
        }
        return { error: 'Generation failed' }
    } catch (error: any) {
        return { ...error }
    }
}
