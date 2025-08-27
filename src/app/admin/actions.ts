'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

// Helper function to convert Firestore data to a plain object
const convertDocToOrder = (doc: any): Order => {
  const data = doc.data();
  const order: Order = {
    id: doc.id,
    userId: data.userId,
    userName: data.userName,
    groupId: data.groupId,
    groupName: data.groupName,
    items: data.items,
    totalAmount: data.totalAmount,
    location: data.location,
    status: data.status,
  };

  if (data.createdAt && data.createdAt instanceof Timestamp) {
    order.createdAt = data.createdAt.toMillis();
  }

  return order;
}

export async function getOrders(): Promise<Order[]> {
  try {
    const ordersCol = collection(db, 'orders');
    // Order by creation date, descending
    const q = query(ordersCol, orderBy('createdAt', 'desc'));
    const orderSnapshot = await getDocs(q);
    const orderList = orderSnapshot.docs.map(convertDocToOrder);
    return orderList;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw new Error("Failed to fetch orders.");
  }
}
