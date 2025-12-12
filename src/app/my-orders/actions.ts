
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { createNotification } from '@/services/notification-service';

export async function confirmOrderReception(orderId: string, clientId: string) {
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { status: 'entregue' });

        // Optional: Notify the lojista that the order is complete
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
            const orderData = orderSnap.data();
            if (orderData.lojistaId) {
                await createNotification({
                    userId: orderData.lojistaId,
                    title: "Pedido Entregue!",
                    message: `O cliente confirmou a entrega do pedido #${orderId.substring(0,6)}.`,
                    link: `/lojista/pedidos`,
                });
            }
        }
        
        revalidatePath('/my-orders');
        revalidatePath('/admin/orders');
        revalidatePath('/lojista/pedidos');
        
        return { success: true };
    } catch (error) {
        console.error("Error confirming order reception:", error);
        return { success: false, message: 'Não foi possível confirmar a receção.' };
    }
}
