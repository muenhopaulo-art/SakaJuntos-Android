
'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

interface UpdateProfileData {
    name: string;
    phone: string;
    province: string;
}

export async function updateUserProfile(userId: string, data: UpdateProfileData) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, data);
        
        revalidatePath('/lojista/perfil');
        return { success: true };
    } catch (error) {
        console.error("Error updating user profile:", error);
        const message = error instanceof Error ? error.message : 'Não foi possível atualizar o perfil.';
        return { success: false, message: message };
    }
}
