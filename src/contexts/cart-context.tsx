
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { CartItem, Product, GroupPromotion } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product | GroupPromotion, quantity?: number, userId?: string) => void;
  removeItem: (productId: string) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isInitialized: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedItems = localStorage.getItem('saka_juntos_cart');
      if (storedItems) {
        setItems(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error("Failed to parse cart items from localStorage", error);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('saka_juntos_cart', JSON.stringify(items));
    }
  }, [items, isInitialized]);

  const addItem = useCallback((product: Product | GroupPromotion, quantity: number = 1, userId?: string) => {
    if (product.productType === 'service') {
        toast({
            title: "Não é possível adicionar",
            description: "Serviços devem ser agendados, não podem ser adicionados ao carrinho.",
            variant: "destructive"
        });
        return;
    }

    if (product.lojistaId && userId && product.lojistaId === userId) {
        toast({
            title: "Ação não permitida",
            description: "Você não pode comprar seus próprios produtos.",
            variant: "destructive"
        });
        return;
    }

    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prevItems, { product, quantity }];
    });
    toast({
      title: "Item adicionado",
      description: `${product.name} foi adicionado ao seu carrinho.`,
    });
  }, [toast]);

  const removeItem = useCallback((productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.product.id !== productId));
    toast({
        title: "Item removido",
        description: `O item foi removido do seu carrinho.`,
        variant: "destructive"
      });
  }, [toast]);

  const updateItemQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
    } else {
      setItems(prevItems =>
        prevItems.map(item =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce((total, item) => total + item.product.price * item.quantity, 0);

  const value = {
    items,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
    totalItems,
    totalPrice,
    isInitialized
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
