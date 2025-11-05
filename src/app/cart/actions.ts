
'use server';

import type { CartItem, User } from '@/lib/types';
import { createOrder } from '@/services/order-service';
import { getUser } from '@/services/user-service';

export async function createIndividualOrder(
    userId: string, 
    items: CartItem[], 
    totalAmount: number
): Promise<{ success: boolean; orderId?: string, message?: string }> {
    try {
        if (items.length === 0) {
            throw new Error("O carrinho está vazio.");
        }
        
        const user: User = await getUser(userId);

        const orderResult = await createOrder({
            clientId: userId,
            clientName: user.name,
            items: items,
            totalAmount: totalAmount,
            orderType: 'individual'
        });

        if (!orderResult.success || !orderResult.id) {
            throw new Error(orderResult.message || "Falha ao criar o pedido.");
        }

        return { success: true, orderId: orderResult.id };

    } catch (error) {
        console.error("Error creating individual order:", error);
        return { success: false, message: error instanceof Error ? error.message : "Ocorreu um erro desconhecido." };
    }
}
