'use server';

import { db } from '@/lib/firebase';
import { doc, deleteDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';


async function deleteSubcollection(orderId: string, subcollectionName: string) {
    const subcollectionRef = collection(db, 'orders', orderId, subcollectionName);
    const snapshot = await getDocs(subcollectionRef);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
}


export async function deleteOrder(orderId: string) {
    try {
        // First, delete the contributions subcollection
        await deleteSubcollection(orderId, 'contributions');
        
        // Then, delete the main order document
        const orderRef = doc(db, 'orders', orderId);
        await deleteDoc(orderRef);
        
        revalidatePath('/admin/orders');
        return { success: true };
    } catch (error) {
        console.error("Error deleting order:", error);
        return { success: false, message: 'Failed to delete order.' };
    }
}
