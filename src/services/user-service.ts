'use server';

import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

export type UserRole = 'client' | 'lojista' | 'admin';
export type StoreStatus = 'pending' | 'approved' | 'rejected';

export interface User {
    uid: string;
    name: string;
    phone: string;
    email: string;
    role: UserRole;
    createdAt: number;
    wantsToBeLojista?: boolean;
    storeStatus?: StoreStatus;
}


interface UserProfileData {
    name: string;
    phone: string;
}

export async function createUser(uid: string, data: UserProfileData) {
    try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, {
            ...data,
            role: 'client', // Default role
            email: `+244${data.phone}@sakajuntos.com`,
            createdAt: serverTimestamp(),
            wantsToBeLojista: false,
            storeStatus: 'pending',
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


export async function getUser(uid: string): Promise<User> {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        throw new Error("User not found in Firestore.");
    }

    const data = userSnap.data();

    return {
        uid: userSnap.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        role: data.role || 'client',
        createdAt: (data.createdAt as Timestamp)?.toMillis() || Date.now(),
        wantsToBeLojista: data.wantsToBeLojista || false,
        storeStatus: data.storeStatus || 'pending',
    };
}
