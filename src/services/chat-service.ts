'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getUser } from './user-service';

export async function sendMessage(groupId: string, senderId: string, text: string) {
    try {
        const user = await getUser(senderId);
        if (!user || !user.name) {
            throw new Error("User profile not found or name is missing.");
        }

        const messagesCol = collection(db, 'groupPromotions', groupId, 'messages');
        await addDoc(messagesCol, {
            text,
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
