
'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import type { Order, OrderStatus, User } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { getUser } from '@/services/user-service';


// Helper function to convert Firestore data to a plain object
const convertDocToOrder = async (doc: any): Promise<Order> => {
  const data = doc.data();

  const order: Order = {
    id: doc.id,
    clientId: data.clientId,
    groupId: data.groupId,
    groupName: data.groupName,
    clientName: data.clientName || 'N/A',
    items: data.items,
    totalAmount: data.totalAmount,
    status: data.status,
    orderType: data.orderType || 'group',
    lojistaId: data.lojistaId,
    courierId: data.courierId,
    courierName: data.courierName,
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

      const updates: { status: OrderStatus; courierId?: string; courierName?: string } = { status };
      
      // If lojista is delivering, set them as the courier
      if (status === 'a caminho') {
          const lojista = await getUser(lojistaId);
          updates.courierId = lojistaId;
          updates.courierName = lojista?.name || 'Vendedor';
      }

      await updateDoc(orderRef, updates);
      
      revalidatePath('/lojista/pedidos');
      revalidatePath('/admin/orders');
      revalidatePath('/my-orders');

      return { success: true };
  } catch (error) {
      console.error("Error updating order status:", error);
      const message = error instanceof Error ? error.message : 'Não foi possível atualizar o estado do pedido.';
      return { success: false, message };
  }
}

export async function confirmLojistaDelivery(orderId: string, lojistaId: string): Promise<{success: boolean; message?: string}> {
     try {
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists() || (orderSnap.data().courierId !== lojistaId && orderSnap.data().lojistaId !== lojistaId)) {
            throw new Error("Pedido não encontrado ou não tem permissão para esta ação.");
        }

        await updateDoc(orderRef, { status: 'aguardando confirmação' });
        
        revalidatePath('/lojista/pedidos');
        revalidatePath('/admin/orders');
        revalidatePath('/my-orders');

        return { success: true };
     } catch (error) {
        console.error("Error confirming lojista delivery:", error);
        return { success: false, message: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.' };
     }
}
