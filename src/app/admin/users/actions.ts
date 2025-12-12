
'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export async function updateUserVerificationStatus(userId: string, action: 'approve' | 'reject') {
    try {
        const userRef = doc(db, 'users', userId);
        
        if (action === 'approve') {
            await updateDoc(userRef, {
                role: 'lojista',
            });
        } else { // reject
            await updateDoc(userRef, {
                role: 'client', // Revert to client on rejection
            });
        }
        
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error("Error updating user verification status:", error);
        return { success: false, message: 'Failed to update user verification status.' };
    }
}
