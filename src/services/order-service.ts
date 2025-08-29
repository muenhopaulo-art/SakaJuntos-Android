
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, writeBatch, doc, getDocs } from 'firebase/firestore';
import type { Order, Contribution } from '@/lib/types';

/**
 * Creates a final order in the 'orders' collection. This can be called either automatically
 * when all contributions are made, or manually by a group creator.
 * @param orderData The basic order data.
 * @param contributions An array of contribution objects.
 * @returns An object indicating success or failure.
 */
export async function createFinalOrder(
  orderData: Omit<Order, 'id' | 'createdAt' | 'status' | 'contributions'>,
  contributions: Contribution[]
): Promise<{ success: boolean; id?: string; message?: string }> {
  try {
    const batch = writeBatch(db);
    
    // 1. Create the main order document
    const orderRef = doc(collection(db, 'orders'));

    // Determine the lojistaId from the first item in the cart.
    // This assumes all items in a group order come from the same lojista.
    const lojistaId = orderData.items[0]?.product.lojistaId || null;
    if (!lojistaId) {
        console.warn("Order being created without a lojistaId. Items:", orderData.items);
    }

    const finalOrderData = {
      ...orderData,
      lojistaId: lojistaId,
      status: 'A aguardar lojista', // Initial status for lojista to see
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

/**
 * Cleans up a group's cart and contributions subcollections, typically after an order has been finalized.
 * @param groupId The ID of the group to clean up.
 */
export async function cleanupGroup(groupId: string): Promise<{ success: true }> {
    const batch = writeBatch(db);

    const cartCol = collection(db, 'groupPromotions', groupId, 'groupCart');
    const cartDocs = await getDocs(cartCol);
    cartDocs.forEach(doc => batch.delete(doc.ref));

    const contribCol = collection(db, 'groupPromotions', groupId, 'contributions');
    const contribDocs = await getDocs(contribCol);
    contribDocs.forEach(doc => batch.delete(doc.ref));
    
    await batch.commit();
    return { success: true };
}
