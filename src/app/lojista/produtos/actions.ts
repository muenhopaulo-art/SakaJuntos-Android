'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import type { Product, PromotionPayment } from '@/lib/types';
import { PROMOTION_COST } from '@/lib/config';
import { getUser } from '@/services/user-service';

export async function addProduct(
  productData: Omit<Product, 'id' | 'createdAt'> & { promote?: boolean }, 
  userId: string
): Promise<{ success: boolean; message?: string; payment?: PromotionPayment }> {
  try {
    const { promote, ...productDataWithoutPromote } = productData;
    
    const docRef = await addDoc(collection(db, 'products'), {
      ...productDataWithoutPromote,
      name_lowercase: productData.name.toLowerCase(),
      createdAt: serverTimestamp(),
      isPromoted: promote ? 'pending' : 'inactive',
    });

    let paymentDetails: PromotionPayment | undefined;

    if (promote) {
      const user = await getUser(userId);
      if (!user) throw new Error("Utilizador não encontrado");
      
      const paymentRef = await addDoc(collection(db, 'promotionPayments'), {
        lojistaId: userId,
        productId: docRef.id,
        productName: productData.name,
        tier: 'tier1',
        amount: PROMOTION_COST,
        referenceCode: nanoid(8).toUpperCase(),
        paymentPhoneNumber: "939282065",
        status: 'pendente',
        createdAt: serverTimestamp()
      });

      await updateDoc(docRef, {
        promotionPaymentId: paymentRef.id,
      });
      
      const paymentSnap = await getDoc(paymentRef);
      const paymentData = paymentSnap.data();

      if (paymentData) {
        paymentDetails = {
            id: paymentRef.id,
            lojistaId: userId,
            lojistaName: user.name,
            productId: docRef.id,
            productName: productData.name,
            tier: paymentData.tier,
            amount: paymentData.amount,
            referenceCode: paymentData.referenceCode,
            status: paymentData.status,
            createdAt: paymentData.createdAt?.toMillis() || Date.now(),
            paymentPhoneNumber: paymentData.paymentPhoneNumber,
            userName: user.name,
        };
      }
    }

    revalidatePath('/lojista/produtos');
    revalidatePath('/minishopping');
    revalidatePath('/');
    
    return { 
      success: true, 
      payment: paymentDetails 
    };

  } catch (error) {
    console.error("Erro ao adicionar produto:", error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Falha ao adicionar produto.' 
    };
  }
}

export async function deleteProduct(productId: string) {
    try {
        const productRef = doc(db, 'products', productId);
        await deleteDoc(productRef);
        revalidatePath('/lojista/produtos');
        revalidatePath('/minishopping');
        revalidatePath('/');
        revalidatePath(`/produto/${productId}`);
        return { success: true };
    } catch (error) {
        console.error("Error deleting product:", error);
        return { success: false, message: 'Failed to delete product.' };
    }
}
