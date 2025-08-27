'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getUser } from './user-service';

// Message can be text or an audio data URI
type MessagePayload = {
    text?: string;
    audioSrc?: string;
};

export async function sendMessage(groupId: string, senderId: string, payload: MessagePayload) {
    try {
        const user = await getUser(senderId);
        if (!user || !user.name) {
            throw new Error("User profile not found or name is missing.");
        }

        const messagesCol = collection(db, 'groupPromotions', groupId, 'messages');
        await addDoc(messagesCol, {
            ...payload,
            senderId,
            senderName: user.name,
            createdAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error("Error sending message:", error);
        return { success: false, message: (error as Error).message };
    }
}
