'use client';

import { useCart } from '@/contexts/cart-context';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription, SheetClose } from './ui/sheet';
import { Separator } from './ui/separator';
import { Minus, Plus, Trash2, Package } from 'lucide-react';
import Link from 'next/link';

interface CartSheetContentProps {
    side?: 'top' | 'bottom' | 'left' | 'right' | null | undefined;
    className?: string;
    children?: React.ReactNode;
    isSheet?: boolean;
}

export function CartSheetContent({ side = 'right', className, children, isSheet = false }: CartSheetContentProps) {
  const { items, removeItem, updateItemQuantity, totalPrice, isInitialized } = useCart();

  if(children && isSheet) {
    return (
        <SheetContent side={side} className={className}>
            {children}
        </SheetContent>
    )
  }

  return (
    <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
      <SheetHeader className="px-6">
        <SheetTitle>Carrinho</SheetTitle>
        <SheetDescription>
            Revise seus itens e finalize sua compra.
        </SheetDescription>
      </SheetHeader>
      <Separator />
      {isInitialized && items.length > 0 ? (
        <>
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-4 px-6 py-4">
              {items.map(item => (
                <div key={item.product.id} className="flex items-center justify-between space-x-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded bg-muted flex items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">{item.product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(item.product.price)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                     <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateItemQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span>{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateItemQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.product.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <SheetFooter className="px-6 py-4 bg-card border-t">
            <div className="w-full space-y-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Subtotal</span>
                <span>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(totalPrice)}</span>
              </div>
              <SheetClose asChild>
                <Button asChild size="lg" className="w-full">
                  <Link href="/cart">Ver Carrinho</Link>
                </Button>
              </SheetClose>
            </div>
          </SheetFooter>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center space-y-4">
          <p className="text-lg text-muted-foreground">O seu carrinho está vazio.</p>
          <SheetClose asChild>
            <Button asChild>
                <Link href="/minishopping">Começar as compras</Link>
            </Button>
          </SheetClose>
        </div>
      )}
    </SheetContent>
  );
}
