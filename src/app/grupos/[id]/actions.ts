
'use server';

import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, writeBatch, updateDoc } from 'firebase/firestore';
import { createOrder, cleanupGroup } from '@/services/order-service';
import type { OrderItem, Contribution, GroupMember, User, CartItem } from '@/lib/types';
import { getUser } from '@/services/user-service';

const SHIPPING_COST_PER_MEMBER = 1000;

async function getSubCollectionData<T>(groupId: string, subCollectionName: string): Promise<T[]> {
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
        
        const members = await getSubCollectionData<GroupMember>(groupId, 'members');
        const contributions = await getSubCollectionData<Contribution>(groupId, 'contributions');

        if (contributions.length < members.length) {
            throw new Error("Ainda faltam contribuições. Não é possível finalizar o pedido.");
        }

        const cartItems = await getSubCollectionData<CartItem>(groupId, 'groupCart');
        if (cartItems.length === 0) {
            throw new Error("O carrinho está vazio. Adicione produtos antes de finalizar.");
        }
        
        const creator: User | null = await getUser(creatorId);
        if (!creator) {
            throw new Error("Criador do grupo não encontrado.");
        }

        // Group cart items by lojistaId
        const ordersByLojista = cartItems.reduce<Record<string, CartItem[]>>((acc, item) => {
            const lojistaId = item.product.lojistaId || 'sem-lojista';
            if (!acc[lojistaId]) {
                acc[lojistaId] = [];
            }
            acc[lojistaId].push(item);
            return acc;
        }, {});
        
        let createdOrderIds: string[] = [];

        for (const lojistaId in ordersByLojista) {
            const lojistaCartItems = ordersByLojista[lojistaId];
            
            const orderItems: OrderItem[] = lojistaCartItems.map(cartItem => ({
                id: cartItem.product.id,
                name: cartItem.product.name,
                price: cartItem.product.price,
                quantity: cartItem.quantity,
                lojistaId: cartItem.product.lojistaId
            }));

            const totalAmount = lojistaCartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
            
            // For group orders, shipping can be complex. We'll simplify and associate
            // the full shipping logic with the first split order, or handle it separately.
            // For now, let's just log the totals per lojista.
            
            const orderResult = await createOrder({
                orderType: 'group',
                groupId: groupId,
                groupName: groupData.name,
                clientId: creatorId,
                clientName: creator.name,
                clientPhone: creator.phone,
                items: orderItems,
                totalAmount: totalAmount, // This is just the sub-total for this lojista
            }, contributions);

            if (!orderResult.success || !orderResult.id) {
                throw new Error(orderResult.message || `Falha ao criar o pedido para o vendedor ${lojistaId}.`);
            }
            createdOrderIds.push(orderResult.id);
        }

        // Clean up the group's cart and contributions for the next purchase
        await cleanupGroup(groupId);

        // Update the group's status to 'finalized'
        await updateDoc(groupRef, { status: 'finalized' });

        return { success: true, orderIds: createdOrderIds };

    } catch (error) {
        console.error("Error finalizing group order:", error);
        return { success: false, message: error instanceof Error ? error.message : "Ocorreu um erro desconhecido." };
    }
}
