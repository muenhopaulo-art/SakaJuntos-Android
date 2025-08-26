'use server';

import { orderSummarizer, type OrderSummarizerInput } from '@/ai/flows/order-summarizer';
import type { CartItem } from '@/lib/types';

export async function getOrderSummary({items, totalAmount}: {items: CartItem[], totalAmount: number}): Promise<{ summary: string }> {
  try {
    const summarizerInput: OrderSummarizerInput = {
      items: items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      })),
      totalAmount: totalAmount,
    };

    const result = await orderSummarizer(summarizerInput);
    return { summary: result.summary };
  } catch (error) {
    console.error('Error generating order summary:', error);
    throw new Error('Failed to generate summary.');
  }
}
