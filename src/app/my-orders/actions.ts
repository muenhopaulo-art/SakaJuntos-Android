
'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

export async function confirmOrderReception(orderId: string) {
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { status: 'entregue' });
        
        // Revalidate all relevant paths
        revalidatePath('/my-orders');
        revalidatePath('/admin/orders');
        revalidatePath('/lojista/pedidos');
        
        return { success: true };
    } catch (error) {
        console.error("Error confirming order reception:", error);
        return { success: false, message: 'Não foi possível confirmar a receção.' };
    }
}
