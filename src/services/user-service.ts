
'use server';

import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp, collection, query, where, getDocs, limit, updateDoc } from 'firebase/firestore';
import type { User, UserRole } from '@/lib/types';


interface UserProfileData {
    name: string;
    phone: string;
    province: string;
}

export async function createUser(uid: string, data: UserProfileData) {
    try {
        const userRef = doc(db, 'users', uid);
        
        await setDoc(userRef, {
            name: data.name,
            phone: data.phone,
            province: data.province,
            role: 'lojista', // All new users are sellers by default
            email: `+244${data.phone}@sakajuntos.com`,
            createdAt: serverTimestamp(),
            verificationStatus: 'approved', // All users are pre-approved to sell
            online: false,
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


export async function getUser(uid: string): Promise<User | null> {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        console.error(`User not found in Firestore for UID: ${uid}`);
        return null;
    }

    const data = userSnap.data();

    return {
        uid: userSnap.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
        province: data.province,
        role: data.role || 'lojista', // Default to lojista
        createdAt: (data.createdAt as Timestamp)?.toMillis() || Date.now(),
        verificationStatus: data.verificationStatus || 'none',
        wantsToBecomeLojista: data.wantsToBecomeLojista,
        ownerLojistaId: data.ownerLojistaId,
        online: data.online || false,
    };
}

export async function queryUserByPhone(phone: string): Promise<{user?: User, error?: string}> {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("phone", "==", phone), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { error: "Nenhum utilizador encontrado com este número de telefone." };
        }

        const userDoc = querySnapshot.docs[0];
        const userData = await getUser(userDoc.id);
        
        if (!userData) {
            return { error: "Não foi possível carregar os dados do utilizador." };
        }

        return { user: userData };

    } catch(error) {
        console.error("Error querying user by phone:", error);
        return { error: "Ocorreu um erro ao procurar o utilizador." };
    }
}

export async function setUserOnlineStatus(userId: string, online: boolean) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { online });
        return { success: true };
    } catch (error) {
        console.error(`Error setting user ${userId} online status to ${online}:`, error);
        return { success: false, message: 'Failed to update online status.' };
    }
}
