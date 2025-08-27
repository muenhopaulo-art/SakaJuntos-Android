'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import type { Order, Contribution } from '@/lib/types';

// This function will be called from a server-side function (`contributeToGroup`), so it's not a server action itself.
export async function createFinalOrder(
  orderData: Omit<Order, 'id' | 'createdAt' | 'status'>,
  contributions: Contribution[]
): Promise<{ success: boolean; id?: string; message?: string }> {
  try {
    const batch = writeBatch(db);
    
    // 1. Create the main order document
    const orderRef = doc(collection(db, 'orders'));
    const finalOrderData = {
      ...orderData,
      status: 'Pendente', // Initial status
      createdAt: serverTimestamp(),
    };
    batch.set(orderRef, finalOrderData);

    // 2. Add all contributions to a subcollection within that order
    const contributionsColRef = collection(orderRef, 'contributions');
    contributions.forEach(contribution => {
        const contributionRef = doc(contributionsColRef, contribution.userId);
        batch.set(contributionRef, contribution);
    });

    // 3. Commit the batch
    await batch.commit();

    return { success: true, id: orderRef.id };
  } catch (error) {
    console.error("Error creating final order:", error);
    const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido ao criar o pedido.';
    return { success: false, message };
  }
}
