
'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import type { Order, OrderStatus } from '@/lib/types';
import { revalidatePath } from 'next/cache';


// Helper function to convert Firestore data to a plain object
const convertDocToOrder = async (doc: any): Promise<Order> => {
  const data = doc.data();

  // For lojista, we might not need to fetch contributions unless displaying them.
  // Kept it simple for now.
  const order: Order = {
    id: doc.id,
    creatorId: data.creatorId,
    groupId: data.groupId,
    groupName: data.groupName,
    creatorName: data.creatorName || 'N/A',
    items: data.items,
    totalAmount: data.totalAmount,
    status: data.status,
    orderType: data.orderType || 'group',
    lojistaId: data.lojistaId,
    driverId: data.driverId,
    driverName: data.driverName,
    contributions: [], // Not loading contributions for lojista view by default
  };

  if (data.createdAt && data.createdAt instanceof Timestamp) {
    order.createdAt = data.createdAt.toMillis();
  }

  return order;
}


export async function getLojistaOrders(lojistaId: string): Promise<Order[]> {
  try {
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, where('lojistaId', '==', lojistaId));
    const orderSnapshot = await getDocs(q);
    const orderList = await Promise.all(orderSnapshot.docs.map(convertDocToOrder));
    return orderList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (error) {
    console.error("Error fetching lojista orders:", error);
    throw new Error("Failed to fetch orders.");
  }
}

export async function updateLojistaOrderStatus(orderId: string, status: OrderStatus, lojistaId: string): Promise<{success: boolean, message?: string}> {
  try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists() || orderSnap.data().lojistaId !== lojistaId) {
          throw new Error("Pedido não encontrado ou não tem permissão para o atualizar.");
      }

      // Lojista can only move the order to "Pronto para recolha"
      if (status !== 'Pronto para recolha') {
        throw new Error("Ação não permitida. Apenas pode marcar o pedido como 'Pronto para recolha'.");
      }

      await updateDoc(orderRef, { status });
      // Revalidation is less critical now with real-time listeners, but good for backup
      revalidatePath('/lojista/pedidos');
      revalidatePath('/admin/orders');

      return { success: true };
  } catch (error) {
      console.error("Error updating order status:", error);
      const message = error instanceof Error ? error.message : 'Não foi possível atualizar o estado do pedido.';
      return { success: false, message };
  }
}
