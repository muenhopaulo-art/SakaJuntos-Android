'use server';

/**
 * @fileOverview Provides a flow to summarize order details for customers.
 *
 * - orderSummarizer - A function that generates a summary of the order.
 * - OrderSummarizerInput - The input type for the orderSummarizer function.
 * - OrderSummarizerOutput - The return type for the orderSummarizer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OrderItemSchema = z.object({
  name: z.string().describe('Name of the product'),
  quantity: z.number().describe('Quantity of the product'),
  price: z.number().describe('Price of the product'),
});

const OrderSummarizerInputSchema = z.object({
  items: z.array(OrderItemSchema).describe('List of items in the order'),
  totalAmount: z.number().describe('Total amount of the order'),
});
export type OrderSummarizerInput = z.infer<typeof OrderSummarizerInputSchema>;

const OrderSummarizerOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the order details.'),
});
export type OrderSummarizerOutput = z.infer<typeof OrderSummarizerOutputSchema>;

export async function orderSummarizer(input: OrderSummarizerInput): Promise<OrderSummarizerOutput> {
  return orderSummarizerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'orderSummarizerPrompt',
  input: {schema: OrderSummarizerInputSchema},
  output: {schema: OrderSummarizerOutputSchema},
  prompt: `You are an AI assistant helping customers confirm their order details.

  Please provide a summarized version of the order, including the items, quantities, and total amount.

  Order Items:
  {{#each items}}
  - {{quantity}} x {{name}} at 
  {{price}}
  {{/each}}

  Total Amount: {{totalAmount}}

  Summary:`,
});

const orderSummarizerFlow = ai.defineFlow(
  {
    name: 'orderSummarizerFlow',
    inputSchema: OrderSummarizerInputSchema,
    outputSchema: OrderSummarizerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
