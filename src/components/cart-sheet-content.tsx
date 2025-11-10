
'use client';

import { useCart } from '@/contexts/cart-context';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose, SheetFooter } from './ui/sheet';
import { Separator } from './ui/separator';
import { Minus, Plus, Trash2, Package } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { CheckoutDialog } from '@/app/cart/cart-view';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface CartSheetContentProps {
    side?: 'top' | 'bottom' | 'left' | 'right' | null | undefined;
    className?: string;
    children?: React.ReactNode;
    isSheet?: boolean;
}

export function CartSheetContent({ side = 'right', className, children, isSheet = false }: CartSheetContentProps) {
  const { items, removeItem, updateItemQuantity, totalPrice, isInitialized } = useCart();
  const router = useRouter();

  if(children && isSheet) {
    return (
        <SheetContent side={side} className={className}>
             <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
            {children}
        </SheetContent>
    )
  }

  const onOrderConfirmed = () => {
    // This assumes the sheet will be closed by the Dialog closing.
    // Then we navigate.
    router.push('/my-orders');
  }

  return (
    <SheetContent className="flex w-full flex-col pr-0 sm:max-w-md">
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
                <div key={item.product.id} className="flex items-start space-x-4">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-muted flex items-center justify-center">
                      {item.product.imageUrls && item.product.imageUrls.length > 0 ? (
                         <Image src={item.product.imageUrls[0]} alt={item.product.name} width={64} height={64} className="object-cover h-full w-full" />
                      ) : (
                         <Package className="h-8 w-8 text-muted-foreground" />
                      )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h3 className="font-medium text-sm pr-2">{item.product.name}</h3>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => removeItem(item.product.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                         <p className="text-sm font-semibold text-muted-foreground">
                            {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(item.product.price)}
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateItemQuantity(item.product.id, item.quantity - 1)}
                            >
                            <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
                            <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateItemQuantity(item.product.id, item.quantity + 1)}
                            >
                            <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
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
              <CheckoutDialog onOrderConfirmed={onOrderConfirmed}>
                 <Button size="lg" className="w-full">
                    Finalizar Compra
                 </Button>
              </CheckoutDialog>
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
