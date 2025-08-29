
'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/cart-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Minus, Plus, ShoppingCart, Sparkles, Trash2, Package, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getOrderSummary, createIndividualOrder } from './actions';
import { useToast } from '@/hooks/use-toast';

const SHIPPING_COST = 1000;

export function CartView() {
  const { items, removeItem, updateItemQuantity, totalPrice, totalItems, clearCart, isInitialized } = useCart();
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [user] = useAuthState(auth);
  const router = useRouter();
  const { toast } = useToast();

  const handleSummarize = async () => {
    setIsSummaryLoading(true);
    setSummary(null);
    try {
      const result = await getOrderSummary({ items, totalAmount: totalPrice + SHIPPING_COST });
      setSummary(result.summary);
    } catch (error) {
      setSummary("Desculpe, não foi possível gerar o resumo do seu pedido.");
      console.error(error);
    }
    setIsAlertOpen(true);
    setIsSummaryLoading(false);
  };
  
  const handleCheckout = async () => {
      if (!user) {
        toast({ variant: 'destructive', title: 'Erro!', description: 'Precisa de estar autenticado para finalizar a compra.' });
        router.push('/login');
        return;
      }
      setIsCheckoutLoading(true);
      const result = await createIndividualOrder(user.uid, items, totalPrice + SHIPPING_COST);
      setIsCheckoutLoading(false);
      
      if (result.success && result.orderId) {
          toast({ title: 'Compra Finalizada!', description: 'A sua encomenda foi criada com sucesso.' });
          clearCart();
          router.push('/my-orders');
      } else {
          toast({ variant: 'destructive', title: 'Erro ao Finalizar', description: result.message });
      }
  }

  if (isInitialized && totalItems === 0) {
    return (
      <div className="text-center space-y-4">
        <ShoppingCart className="mx-auto h-24 w-24 text-muted-foreground" />
        <h1 className="text-3xl font-bold font-headline">O seu carrinho está vazio</h1>
        <p className="text-muted-foreground">Parece que ainda não adicionou nada. Que tal explorar os nossos produtos?</p>
        <Button asChild size="lg">
          <Link href="/minishopping">Começar a comprar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <h1 className="text-3xl font-bold mb-6 font-headline">Seu Carrinho ({totalItems} {totalItems === 1 ? 'item' : 'itens'})</h1>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Produto</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(item => (
                    <TableRow key={item.product.id}>
                      <TableCell>
                        <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{item.product.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateItemQuantity(item.product.id, item.quantity - 1)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-6 text-center">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateItemQuantity(item.product.id, item.quantity + 1)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(item.product.price * item.quantity)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => removeItem(item.product.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(totalPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span>Entrega</span>
              <span>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(SHIPPING_COST)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(totalPrice + SHIPPING_COST)}</span>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                  <Button size="lg" className="w-full" disabled={isCheckoutLoading}>
                    {isCheckoutLoading ? <Loader2 className="animate-spin mr-2"/> : null}
                    Finalizar Compra
                  </Button>
              </AlertDialogTrigger>
               <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Compra?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isto irá criar uma encomenda com os itens do seu carrinho. O seu pedido será enviado a um lojista para preparação. Deseja continuar?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCheckout}>Confirmar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Button size="lg" variant="outline" className="w-full" onClick={handleSummarize} disabled={isSummaryLoading}>
              {isSummaryLoading ? 'A gerar...' : <><Sparkles className="mr-2 h-4 w-4" /> Resumir com IA</>}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><Sparkles className="text-accent-foreground h-5 w-5"/>Resumo do Pedido Gerado por IA</AlertDialogTitle>
            <AlertDialogDescription className="text-left whitespace-pre-wrap pt-4">
              {summary || 'A carregar...'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Fechar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
