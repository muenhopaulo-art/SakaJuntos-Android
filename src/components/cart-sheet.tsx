'use client';

import { Button } from './ui/button';
import { Sheet, SheetTrigger } from './ui/sheet';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { CartSheetContent } from './cart-sheet-content';

export function CartSheet() {
  const { totalItems } = useCart();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs">
              {totalItems}
            </span>
          )}
          <span className="sr-only">Abrir carrinho</span>
        </Button>
      </SheetTrigger>
      <CartSheetContent />
    </Sheet>
  );
}
