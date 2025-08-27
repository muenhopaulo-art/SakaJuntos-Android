'use server';

import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface UserProfile {
    name: string;
    phone: string;
}

export async function createUser(uid: string, data: UserProfile) {
    try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, {
            ...data,
            createdAt: serverTimestamp(),
        });
        return { success: true, uid };
    } catch (error) {
        console.error("Error creating user profile:", error);
        if (error instanceof Error) {
            return { success: false, message: `Ocorreu um erro: ${error.message}` };
        }
        return { success: false, message: 'Ocorreu um erro desconhecido ao criar o perfil.' };
    }
}
