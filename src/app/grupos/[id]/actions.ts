'use server';

import { db } from '@/lib/firebase';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';

export async function approveJoinRequest(groupId: string, userId: string) {
    try {
        await runTransaction(db, async (transaction) => {
            const groupRef = doc(db, 'groupPromotions', groupId);
            const requestRef = doc(db, 'groupPromotions', groupId, 'joinRequests', userId);
            const memberRef = doc(db, 'groupPromotions', groupId, 'members', userId);
            
            const requestSnap = await transaction.get(requestRef);
            if (!requestSnap.exists()) {
                // This might happen if the request was cancelled or handled in another session.
                // We don't need to throw an error, we can just log it and return.
                console.warn(`Join request for user ${userId} in group ${groupId} not found. It might have been handled already.`);
                return;
            }

            const groupSnap = await transaction.get(groupRef);
            if (!groupSnap.exists()) throw new Error("Group does not exist.");

            transaction.set(memberRef, { name: requestSnap.data().name, joinedAt: serverTimestamp() });
            transaction.delete(requestRef);

            const newParticipantCount = (groupSnap.data().participants || 0) + 1;
            transaction.update(groupRef, { participants: newParticipantCount });
        });
        return { success: true };
    } catch (error) {
        console.error("Error approving join request:", error);
        return { success: false, message: (error as Error).message };
    }
}
