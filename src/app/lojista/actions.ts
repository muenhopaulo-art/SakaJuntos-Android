
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
            
        const processedOrders = orders.filter(order => order.status === 'Pronto para recolha' || order.status === 'A caminho' || order.status === 'Entregue').length;

        const newOrders = orders.filter(order => order.status === 'A aguardar lojista').length;

        // Sort orders by date client-side
        const recentOrders = orders
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, 5);


        return {
            analytics: {
                totalRevenue,
                processedOrders,
                activeProducts,
                newOrders
            },
            recentOrders
        };

    } catch (error) {
        console.error("Error fetching lojista dashboard analytics:", error);
        throw new Error("Failed to fetch lojista dashboard analytics.");
    }
}
