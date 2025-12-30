
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, doc, getDoc, Timestamp,getCountFromServer, where, updateDoc } from 'firebase/firestore';
import type { Order, Contribution, User, GroupPromotion } from '@/lib/types';
import { createNotification } from '@/services/notification-service';


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
    id: doc.id,
    userName: data.userName,
    amount: data.amount,
    address: data.address,
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
    clientId: data.clientId,
    groupId: data.groupId,
    groupName: data.groupName,
    clientName: data.clientName || 'N/A', // Use clientName
    items: data.items,
    totalAmount: data.totalAmount,
    status: data.status,
    orderType: data.orderType || 'group',
    contributions, // Add contributions here
    courierId: data.courierId,
    courierName: data.courierName,
    courierPhone: data.courierPhone,
    lojistaId: data.lojistaId,
    address: data.address,
    deliveryLocation: data.deliveryLocation,
  };

  if (data.createdAt && data.createdAt instanceof Timestamp) {
    order.createdAt = data.createdAt.toMillis();
  }

  return order;
}

export async function getOrders(userId?: string): Promise<Order[]> {
  try {
    const ordersCol = collection(db, 'orders');
    let q;
    if (userId) {
      // Query for orders where the user is the creator
      q = query(ordersCol, where('clientId', '==', userId), orderBy('createdAt', 'desc'));
    } else {
      // Admin gets all orders
      q = query(ordersCol, orderBy('createdAt', 'desc'));
    }
    const orderSnapshot = await getDocs(q);
    const orderList = await Promise.all(orderSnapshot.docs.map(convertDocToOrder));
    return orderList;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw new Error("Failed to fetch orders.");
  }
}

export async function assignDriverToOrder(orderId: string, driver: User): Promise<{success: boolean, message?: string}> {
    try {
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);
        if (!orderSnap.exists()) {
          throw new Error("Pedido não encontrado.");
        }
        const orderData = orderSnap.data();
        
        await updateDoc(orderRef, { 
            status: 'a caminho', // lowercase status
            courierId: driver.uid,
            courierName: driver.name,
            courierPhone: driver.phone
        });

        await createNotification({
            userId: orderData.clientId,
            title: "Pedido a Caminho!",
            message: `O seu pedido #${orderId.substring(0, 6)} está a caminho.`,
            link: '/my-orders'
        });

        return { success: true };
    } catch (error) {
        console.error("Error assigning driver to order:", error);
        return { success: false, message: 'Não foi possível atribuir o entregador.' };
    }
}


export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<{success: boolean, message?: string}> {
  try {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) {
          throw new Error("Pedido não encontrado.");
      }
      const orderData = orderSnap.data();

      if (status === 'a caminho' && !orderData.courierId) {
          throw new Error("Não é possível alterar para 'a caminho' sem atribuir um entregador.");
      }

      await updateDoc(orderRef, { status });

      await createNotification({
          userId: orderData.clientId,
          title: "Estado do Pedido Atualizado",
          message: `O seu pedido #${orderId.substring(0, 6)} foi atualizado para: ${status}.`,
          link: '/my-orders'
      });

      // When order is delivered or cancelled, reset the group status to 'active' for future purchases
      if ((status === 'entregue' || status === 'cancelado') && orderData.groupId) {
          const groupRef = doc(db, 'groupPromotions', orderData.groupId);
          const groupSnap = await getDoc(groupRef);
          if (groupSnap.exists()) {
              await updateDoc(groupRef, { status: 'active' });
          }
      }

      return { success: true };
  } catch (error) {
      console.error("Error updating order status:", error);
      const message = error instanceof Error ? error.message : 'Não foi possível atualizar o estado do pedido.';
      return { success: false, message };
  }
}


export async function getDashboardAnalytics() {
    try {
        const ordersCol = collection(db, 'orders');
        const usersCol = collection(db, 'users');

        // Timestamps for date ranges
        const now = Date.now();
        const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

        const [
            ordersSnapshot, 
            usersCountSnapshot,
            newUsers24hSnapshot,
            newUsers7dSnapshot,
            newUsers30dSnapshot
        ] = await Promise.all([
            getDocs(query(ordersCol)),
            getCountFromServer(usersCol),
            getCountFromServer(query(usersCol, where('createdAt', '>', Timestamp.fromDate(oneDayAgo)))),
            getCountFromServer(query(usersCol, where('createdAt', '>', Timestamp.fromDate(sevenDaysAgo)))),
            getCountFromServer(query(usersCol, where('createdAt', '>', Timestamp.fromDate(thirtyDaysAgo))))
        ]);
        
        const orders = ordersSnapshot.docs.map(doc => doc.data() as Order);
        const usersCount = usersCountSnapshot.data().count;
        
        const totalRevenue = orders
            .filter(order => order.status === 'entregue')
            .reduce((sum, order) => sum + order.totalAmount, 0);

        const platformRevenue = totalRevenue * 0.05; // Example: 5% platform fee

        const totalOrders = orders.length;

        return {
            platformRevenue,
            totalRevenue,
            totalOrders,
            usersCount,
            newUsers24h: newUsers24hSnapshot.data().count,
            newUsers7d: newUsers7dSnapshot.data().count,
            newUsers30d: newUsers30dSnapshot.data().count,
        };

    } catch (error) {
        console.error("Error fetching dashboard analytics:", error);
        throw new Error("Failed to fetch dashboard analytics.");
    }
}

export async function getUsersCount(): Promise<number> {
    const usersCol = collection(db, 'users');
    const snapshot = await getCountFromServer(usersCol);
    return snapshot.data().count;
}

export async function getUsers(): Promise<User[]> {
    try {
        const usersCol = collection(db, 'users');
        const q = query(usersCol, orderBy('createdAt', 'desc'));
        const userSnapshot = await getDocs(q);
        return userSnapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt;
            return {
                uid: doc.id,
                name: data.name,
                phone: data.phone,
                email: data.email,
                role: data.role,
                createdAt: createdAt instanceof Timestamp ? createdAt.toMillis() : (createdAt || Date.now()),
                online: data.online || false
            }
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        throw new Error("Failed to fetch users.");
    }
}

export async function getOnlineDeliveryDrivers(): Promise<User[]> {
    try {
        const usersCol = collection(db, 'users');
        // We only care about online status and courier role
        const q = query(usersCol, where('online', '==', true), where('role', '==', 'courier'));
        const driverSnapshot = await getDocs(q);
        return driverSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                uid: doc.id,
                name: data.name,
                phone: data.phone,
                email: data.email,
                role: data.role,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
                online: data.online
            }
        });
    } catch (error) {
        console.error("Error fetching online drivers:", error);
        return [];
    }
}
