
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, doc, Timestamp, updateDoc } from 'firebase/firestore';
import type { PromotionPayment } from '@/lib/types';
import { getUser } from '@/services/user-service';
import { revalidatePath } from 'next/cache';
import { createNotification } from '@/services/notification-service';

export async function getPromotionRequests(): Promise<PromotionPayment[]> {
  try {
    const paymentsCol = collection(db, 'promotionPayments');
    const q = query(paymentsCol, orderBy('createdAt', 'desc'));
    const paymentSnapshot = await getDocs(q);
    
    const paymentList = await Promise.all(paymentSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const lojista = await getUser(data.lojistaId);
        return {
            id: doc.id,
            lojistaId: data.lojistaId,
            lojistaName: lojista?.name || 'Desconhecido',
            productId: data.productId,
            productName: data.productName,
            tier: data.tier,
            amount: data.amount,
            referenceCode: data.referenceCode,
            status: data.status,
            createdAt: (data.createdAt as Timestamp)?.toMillis() || Date.now(),
        } as PromotionPayment;
    }));
    return paymentList;
  } catch (error) {
    console.error("Error fetching promotion requests:", error);
    throw new Error("Failed to fetch promotion requests.");
  }
}


export async function approvePromotion(paymentId: string, productId: string, lojistaId: string): Promise<{success: boolean, message?: string}> {
    try {
        const paymentRef = doc(db, 'promotionPayments', paymentId);
        const productRef = doc(db, 'products', productId);

        await updateDoc(paymentRef, { status: 'aprovado' });
        await updateDoc(productRef, { isPromoted: 'active' });

        await createNotification({
            userId: lojistaId,
            title: "Promoção Aprovada!",
            message: `O seu pedido para promover um produto foi aprovado.`,
            link: '/lojista/produtos'
        });

        revalidatePath('/admin/promotions');
        revalidatePath('/lojista/produtos');
        revalidatePath('/'); // Revalidate home page for promoted products
        revalidatePath('/minishopping');

        return { success: true };
    } catch (error) {
        console.error("Error approving promotion:", error);
        return { success: false, message: 'Não foi possível aprovar a promoção.' };
    }
}


export async function rejectPromotion(paymentId: string, lojistaId: string, productName: string): Promise<{success: boolean, message?: string}> {
    try {
        const paymentRef = doc(db, 'promotionPayments', paymentId);
        await updateDoc(paymentRef, { status: 'rejeitado' });

        await createNotification({
            userId: lojistaId,
            title: "Promoção Rejeitada",
            message: `O seu pedido para promover "${productName}" foi rejeitado.`,
            link: '/lojista/produtos'
        });
        
        revalidatePath('/admin/promotions');

        return { success: true };
    } catch (error) {
        console.error("Error rejecting promotion:", error);
        return { success: false, message: 'Não foi possível rejeitar a promoção.' };
    }
}
