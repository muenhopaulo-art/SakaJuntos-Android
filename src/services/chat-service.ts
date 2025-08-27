'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import type { ChatMessage } from '@/lib/types';
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


export function listenToMessages(groupId: string, callback: (messages: ChatMessage[]) => void) {
    const messagesCol = collection(db, 'groupPromotions', groupId, 'messages');
    const q = query(messagesCol, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages: ChatMessage[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            messages.push({
                id: doc.id,
                text: data.text,
                senderId: data.senderId,
                senderName: data.senderName,
                createdAt: (data.createdAt as Timestamp)?.toMillis() || Date.now(),
            });
        });
        callback(messages);
    }, (error) => {
        console.error("Error listening to messages:", error);
        // You might want to handle errors here, e.g., by calling the callback with an empty array or an error state
        callback([]);
    });

    return unsubscribe;
}
