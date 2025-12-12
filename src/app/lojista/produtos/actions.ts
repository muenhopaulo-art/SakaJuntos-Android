

'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Product, PromotionPayment } from '@/lib/types';
import { getUser } from '@/services/user-service';

const promotionTiers: { [key: string]: number } = {
    tier1: 1000,
    tier2: 1500,
    tier3: 2500,
};

function generateReferenceCode(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function addProduct(
    productData: Omit<Product, 'id' | 'createdAt'>, 
    promotionTier?: string
): Promise<{ success: boolean; message?: string; paymentData?: Omit<PromotionPayment, 'userName'> }> {
    try {
        const name_lowercase = productData.name.toLowerCase();
        
        // Add the product first
        const productRef = await addDoc(collection(db, 'products'), {
            ...productData,
            name_lowercase,
            productType: productData.productType, // Ensure productType is included
            createdAt: serverTimestamp()
        });

        // If a promotion tier is selected, create a payment request
        if (promotionTier && productData.lojistaId) {
            const amount = promotionTiers[promotionTier];
            if (!amount) throw new Error("Plano de promoção inválido.");

            const referenceCode = generateReferenceCode(8);
            
            const paymentRef = await addDoc(collection(db, 'promotionPayments'), {
                lojistaId: productData.lojistaId,
                productId: productRef.id,
                productName: productData.name,
                tier: promotionTier,
                amount: amount,
                referenceCode: referenceCode,
                status: 'pendente',
                createdAt: serverTimestamp()
            });

            // Revalidate paths for admin to see the new request
            revalidatePath('/admin/promotions');
            
            return { 
                success: true, 
                paymentData: {
                    id: paymentRef.id,
                    amount: amount,
                    referenceCode: referenceCode,
                    paymentPhoneNumber: "939282065" // Hardcoded as per image
                }
            };
        }
        
        // Revalidate public paths if no promotion was added
        revalidatePath('/lojista/produtos');
        revalidatePath('/minishopping');
        revalidatePath('/');
        
        return { success: true };

    } catch (error) {
        console.error("Error adding product:", error);
        return { success: false, message: 'Failed to add product.' };
    }
}

export async function deleteProduct(productId: string) {
    try {
        const productRef = doc(db, 'products', productId);
        await deleteDoc(productRef);
        revalidatePath('/lojista/produtos');
        revalidatePath('/minishopping');
        revalidatePath('/');
        revalidatePath(`/produto/${productId}`); // Revalidate detail page
        return { success: true };
    } catch (error) {
        console.error("Error deleting product:", error);
        return { success: false, message: 'Failed to delete product.' };
    }
}

