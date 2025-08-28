'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, doc, getDoc } from 'firebase/firestore';
import type { Order, Contribution } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

// Helper function to convert Firestore contribution doc to a plain object
const convertDocToContribution = (doc: any): Contribution => {
  const data = doc.data();
  // The `createdAt` field might already be a number if it comes from `createFinalOrder`,
  // or a Timestamp if it's being read directly from the contributions subcollection.
  // We need to handle both cases.
  const createdAtMillis = data.createdAt instanceof Timestamp 
    ? data.createdAt.toMillis() 
    : typeof data.createdAt === 'number' 
    ? data.createdAt 
    : Date.now();
    
  return {
    userId: doc.id,
    userName: data.userName,
    amount: data.amount,
    location: data.location,
    createdAt: createdAtMillis,
  };
}

// Helper function to convert Firestore data to a plain object
const convertDocToOrder = async (doc: any): Promise<Order> => {
  const data = doc.data();

  // Fetch contributions subcollection for this order
  const contributionsCol = collection(db, 'orders', doc.id, 'contributions');
  const contributionsSnapshot = await getDocs(contributionsCol);
  const contributions = contributionsSnapshot.docs.map(convertDocToContribution);

  const order: Order = {
    id: doc.id,
    groupId: data.groupId,
    groupName: data.groupName,
    items: data.items,
    totalAmount: data.totalAmount,
    status: data.status,
    contributions, // Add contributions here
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
    const orderList = await Promise.all(orderSnapshot.docs.map(convertDocToOrder));
    return orderList;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw new Error("Failed to fetch orders.");
  }
}
