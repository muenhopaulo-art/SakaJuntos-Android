"use client";

// Importe o seu CartProvider original
import { CartProvider } from "./cart-context"; 

// Este é um componente "wrapper" (invólucro) que força o "use client"
export default function CartProviderClient({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
    </CartProvider>
  );
}
