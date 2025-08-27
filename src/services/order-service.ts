'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Order } from '@/lib/types';

// This function will be called from a client component, so it must be a server action.
export async function createOrder(
  data: Omit<Order, 'id' | 'createdAt' | 'status'>
): Promise<{ success: boolean; id?: string; message?: string }> {
  try {
    const ordersCol = collection(db, 'orders');

    const orderData = {
      ...data,
      status: 'Pendente', // Initial status
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(ordersCol, orderData);

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating order:", error);
    const message = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido ao criar o pedido.';
    return { success: false, message };
  }
}
