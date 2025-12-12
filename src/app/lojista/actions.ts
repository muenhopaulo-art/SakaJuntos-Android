
'use server';

import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, getCountFromServer, orderBy, limit, Timestamp } from 'firebase/firestore';
import type { Order, Product } from '@/lib/types';


const convertDocToOrder = (doc: any): Order => {
  const data = doc.data();
  return {
    id: doc.id,
    clientId: data.clientId,
    clientName: data.clientName,
    items: data.items,
    totalAmount: data.totalAmount,
    status: data.status,
    orderType: data.orderType,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
    lojistaId: data.lojistaId,
  };
};

const convertDocToProduct = (doc: any): Product => {
    const data = doc.data();
    return {
        id: doc.id,
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        category: data.category,
        stock: data.stock,
        isPromoted: data.isPromoted,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
    };
};

export async function getLojistaDashboardAnalytics(lojistaId: string) {
    try {
        const ordersQuery = query(collection(db, 'orders'), where('lojistaId', '==', lojistaId));
        const productsQuery = query(collection(db, 'products'), where('lojistaId', '==', lojistaId));
        const recentProductsQuery = query(productsQuery, orderBy('createdAt', 'desc'), limit(5));
        
        const [ordersSnapshot, productsCountSnapshot, recentProductsSnapshot] = await Promise.all([
            getDocs(ordersQuery),
            getCountFromServer(productsQuery),
            getDocs(recentProductsQuery),
        ]);

        const orders = ordersSnapshot.docs.map(convertDocToOrder);
        const activeProducts = productsCountSnapshot.data().count;

        const totalRevenue = orders
            .filter(order => order.status === 'entregue')
            .reduce((sum, order) => sum + order.totalAmount, 0);
            
        const processedOrders = orders.filter(order => order.status === 'pronto para recolha' || order.status === 'a caminho' || order.status === 'entregue').length;
        
        // Corrected: `newOrders` now includes both 'pendente' and 'a aguardar lojista'
        const newOrders = orders.filter(order => order.status === 'a aguardar lojista' || order.status === 'pendente').length;

        // The list of recent orders should match the logic for `newOrders`
        const recentOrders = orders
            .filter(o => o.status === 'a aguardar lojista' || o.status === 'pendente')
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, 5);
            
        const recentProducts = recentProductsSnapshot.docs.map(convertDocToProduct);


        return {
            analytics: {
                totalRevenue,
                processedOrders,
                activeProducts,
                newOrders
            },
            recentOrders,
            recentProducts,
        };

    } catch (error) {
        console.error("Error fetching lojista dashboard analytics:", error);
        throw new Error("Failed to fetch lojista dashboard analytics.");
    }
}
