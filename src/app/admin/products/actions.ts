

'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { Product } from '@/lib/types';


export async function addProduct(productData: Omit<Product, 'id' | 'createdAt'>) {
    try {
        await addDoc(collection(db, 'products'), {
            ...productData,
            createdAt: serverTimestamp()
        });
        revalidatePath('/admin/products');
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
        revalidatePath('/admin/products');
        return { success: true };
    } catch (error) {
        console.error("Error deleting product:", error);
        return { success: false, message: 'Failed to delete product.' };
    }
}
