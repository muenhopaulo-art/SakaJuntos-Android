
'use server';

import type { CartItem, User, OrderItem, Geolocation } from '@/lib/types';
import { createOrder } from '@/services/order-service';
import { getUser } from '@/services/user-service';

export async function createIndividualOrder(
    userId: string, 
    items: CartItem[], 
    totalAmount: number,
    address: string,
    location?: Geolocation | null
): Promise<{ success: boolean; orderId?: string, message?: string }> {
    try {
        if (items.length === 0) {
            throw new Error("O carrinho está vazio.");
        }
        
        const user: User | null = await getUser(userId);
        if (!user) {
            throw new Error("Perfil de utilizador não encontrado.");
        }

        // Convert CartItem[] to OrderItem[]
        const orderItems: OrderItem[] = items.map(cartItem => ({
            id: cartItem.product.id,
            name: cartItem.product.name,
            price: cartItem.product.price,
            quantity: cartItem.quantity,
            lojistaId: cartItem.product.lojistaId
        }));

        const orderResult = await createOrder({
            clientId: userId,
            clientName: user.name,
            clientPhone: user.phone,
            items: orderItems,
            totalAmount: totalAmount,
            orderType: 'individual',
            address: address,
            deliveryLocation: location || undefined
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
