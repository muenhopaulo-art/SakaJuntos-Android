

'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, writeBatch, doc, getDocs } from 'firebase/firestore';
import type { Order, Contribution } from '@/lib/types';

/**
 * Creates a final order in the 'orders' collection. This can be for individual or group purchases.
 * @param orderData The basic order data.
 * @param contributions An optional array of contribution objects for group orders.
 * @returns An object indicating success or failure.
 */
export async function createOrder(
  orderData: Omit<Order, 'id' | 'createdAt' | 'status' | 'contributions'>,
  contributions?: Contribution[]
): Promise<{ success: boolean; id?: string; message?: string }> {
  try {
    const batch = writeBatch(db);
    
    // 1. Create the main order document
    const orderRef = doc(collection(db, 'orders'));

    // Determine the lojistaId from the first item in the cart.
    // This assumes all items in an order come from the same lojista.
    const lojistaId = orderData.items[0]?.product.lojistaId || null;
    if (!lojistaId) {
        console.warn("Order being created without a lojistaId. Items:", orderData.items);
    }
    
    // Ensure product data is plain and doesn't contain undefined fields
    const cleanItems = orderData.items.map(item => ({
        ...item,
        product: {
            id: item.product.id,
            name: item.product.name,
            description: item.product.description,
            price: item.product.price,
            imageUrl: item.product.imageUrl || null,
            aiHint: item.product.aiHint || null,
            lojistaId: item.product.lojistaId || null,
            productType: item.product.productType || 'product',
            contactPhone: item.product.contactPhone || null, // Add contactPhone here
        }
    }));


    const finalOrderData: Omit<Order, 'id' | 'contributions'> = {
      ...orderData,
      items: cleanItems as any, // Use the cleaned items
      lojistaId: lojistaId,
      status: 'A aguardar lojista', // Initial status for lojista to see
      createdAt: serverTimestamp() as any,
    };
    batch.set(orderRef, finalOrderData);

    // 2. If it's a group order, add contributions to a subcollection
    if (contributions && contributions.length > 0) {
        const contributionsColRef = collection(orderRef, 'contributions');
        contributions.forEach(contribution => {
            const contributionRef = doc(contributionsColRef, contribution.userId);
            batch.set(contributionRef, contribution);
        });
    }

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
