
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface NotificationData {
    userId: string;
    title: string;
    message: string;
    link: string;
}

export async function createNotification(data: NotificationData) {
    try {
        const notificationCol = collection(db, 'users', data.userId, 'notifications');
        await addDoc(notificationCol, {
            ...data,
            isRead: false,
            createdAt: serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        console.error("Error creating notification:", error);
        // We don't return a message to the client as this is a background task
        return { success: false };
    }
}

