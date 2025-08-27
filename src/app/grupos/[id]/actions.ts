'use server';

import { convertTextToSpeech } from "@/ai/flows/text-to-speech";

export async function getAudioForText(text: string) {
    try {
        const result = await convertTextToSpeech(text);
        return { success: true, audio: result.audio };
    } catch (error) {
        console.error("Error converting text to speech:", error);
        return { success: false, message: (error as Error).message };
    }
}
