'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export async function updateUserStatus(userId: string, action: 'approve' | 'reject') {
    try {
        const userRef = doc(db, 'users', userId);
        
        if (action === 'approve') {
            await updateDoc(userRef, {
                role: 'lojista',
                storeStatus: 'approved'
            });
        } else { // reject
            await updateDoc(userRef, {
                storeStatus: 'rejected'
            });
        }
        
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error("Error updating user status:", error);
        return { success: false, message: 'Failed to update user status.' };
    }
}
