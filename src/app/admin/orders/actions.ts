'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function updateOrderStatus(orderId: string, status: Order['status']) {
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { status });
        revalidatePath('/admin/orders'); // Revalidate to show the change immediately
        return { success: true };
    } catch (error) {
        console.error("Error updating order status:", error);
        return { success: false, message: 'Failed to update order status.' };
    }
}
