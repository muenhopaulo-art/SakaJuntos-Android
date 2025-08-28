
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { createFinalOrder, cleanupGroup } from '@/services/order-service';
import type { CartItem, Contribution, GroupMember } from '@/lib/types';


async function getSubCollection<T>(groupId: string, subCollectionName: string): Promise<T[]> {
    const subCollectionRef = collection(db, 'groupPromotions', groupId, subCollectionName);
    const snapshot = await getDocs(subCollectionRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
}

export async function finalizeGroupOrder(groupId: string, creatorId: string) {
    try {
        const groupRef = doc(db, 'groupPromotions', groupId);
        const groupSnap = await getDoc(groupRef);

        if (!groupSnap.exists()) {
            throw new Error("O grupo não foi encontrado.");
        }

        const groupData = groupSnap.data();

        if (groupData.creatorId !== creatorId) {
            throw new Error("Apenas o criador do grupo pode finalizar o pedido.");
        }
        
        const members = await getSubCollection<GroupMember>(groupId, 'members');
        const contributions = await getSubCollection<Contribution>(groupId, 'contributions');

        if (contributions.length < members.length) {
            throw new Error("Ainda faltam contribuições. Não é possível finalizar o pedido.");
        }

        const cart = await getSubCollection<CartItem>(groupId, 'groupCart');
        if (cart.length === 0) {
            throw new Error("O carrinho está vazio. Adicione produtos antes de finalizar.");
        }
        
        const totalAmount = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
        
        // Create the final order with the existing contributions
        const orderResult = await createFinalOrder({
            groupId: groupId,
            groupName: groupData.name,
            items: cart,
            totalAmount: totalAmount,
        }, contributions);

        if (!orderResult.success) {
            throw new Error(orderResult.message || "Falha ao criar o pedido final.");
        }

        // Clean up the group's cart and contributions for the next purchase
        await cleanupGroup(groupId);

        return { success: true, orderId: orderResult.id };

    } catch (error) {
        console.error("Error finalizing group order:", error);
        return { success: false, message: error instanceof Error ? error.message : "Ocorreu um erro desconhecido." };
    }
}
