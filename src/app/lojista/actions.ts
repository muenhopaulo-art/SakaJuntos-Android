
'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, getCountFromServer, orderBy, limit, Timestamp } from 'firebase/firestore';
import type { Order, Product } from '@/lib/types';


const convertDocToOrder = (doc: any): Order => {
  const data = doc.data();
  return {
    id: doc.id,
    creatorId: data.creatorId,
    creatorName: data.creatorName,
    items: data.items,
    totalAmount: data.totalAmount,
    status: data.status,
    orderType: data.orderType,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
    lojistaId: data.lojistaId,
  };
};

export async function getLojistaDashboardAnalytics(lojistaId: string) {
    try {
        const ordersQuery = query(collection(db, 'orders'), where('lojistaId', '==', lojistaId));
        const productsQuery = query(collection(db, 'products'), where('lojistaId', '==', lojistaId));
        
        const [ordersSnapshot, productsSnapshot] = await Promise.all([
            getDocs(ordersQuery),
            getCountFromServer(productsQuery)
        ]);

        const orders = ordersSnapshot.docs.map(convertDocToOrder);
        const activeProducts = productsSnapshot.data().count;

        const totalRevenue = orders
            .filter(order => order.status === 'Entregue')
            .reduce((sum, order) => sum + order.totalAmount, 0);

        const totalSales = orders.filter(order => order.status === 'Entregue').length;

        const pendingOrders = orders.filter(order => order.status === 'A aguardar lojista').length;

        // Get 5 most recent orders
        const recentOrdersQuery = query(ordersQuery, orderBy('createdAt', 'desc'), limit(5));
        const recentOrdersSnapshot = await getDocs(recentOrdersQuery);
        const recentOrders = recentOrdersSnapshot.docs.map(convertDocToOrder);


        return {
            analytics: {
                totalRevenue,
                totalSales,
                activeProducts,
                pendingOrders
            },
            recentOrders
        };

    } catch (error) {
        console.error("Error fetching lojista dashboard analytics:", error);
        throw new Error("Failed to fetch lojista dashboard analytics.");
    }
}
