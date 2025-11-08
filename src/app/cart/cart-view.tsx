
'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/cart-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Minus, Plus, ShoppingCart, Trash2, Package, Loader2, Home, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { createIndividualOrder } from './actions';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Geolocation } from '@/lib/types';
import { cn } from '@/lib/utils';


const SHIPPING_COST = 1000;

export function CheckoutDialog({ onOrderConfirmed, children }: { onOrderConfirmed: () => void, children: React.ReactNode }) {
  const { items, totalPrice, clearCart } = useCart();
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [user] = useAuthState(auth);
  const router = useRouter();
  const { toast } = useToast();
  
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<Geolocation | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const handleGetLocation = () => {
    setIsFetchingLocation(true);
    setLocation(null);
    setAddress('');
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            const newLocation = { latitude, longitude };
            setLocation(newLocation);
            setAddress(`Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`);
            toast({ title: 'Localização Obtida!', description: 'O seu endereço foi preenchido com as suas coordenadas.' });
            setIsFetchingLocation(false);
        },
        (error) => {
            console.error("Geolocation error:", error);
            toast({ variant: 'destructive', title: 'Erro de Localização', description: 'Não foi possível obter a sua localização. Verifique as permissões do navegador.' });
            setIsFetchingLocation(false);
        },
        { enableHighAccuracy: true }
    );
  };

  const handleConfirmOrder = async () => {
      if (!user) {
        toast({ variant: 'destructive', title: 'Erro!', description: 'Precisa de estar autenticado para finalizar a compra.' });
        router.push('/login');
        return;
      }
      if (!address.trim()) {
        toast({ variant: 'destructive', title: 'Endereço Inválido', description: 'Por favor, insira um endereço de entrega válido.' });
        return;
      }

      setIsCheckoutLoading(true);
      const result = await createIndividualOrder(user.uid, items, totalPrice + SHIPPING_COST, address, location);
      setIsCheckoutLoading(false);
      
      if (result.success && result.orderId) {
          toast({ title: 'Compra Finalizada!', description: 'A sua encomenda foi criada com sucesso.' });
          clearCart();
          setIsAddressDialogOpen(false);
          setAddress('');
          setLocation(null);
          onOrderConfirmed();
      } else {
          toast({ variant: 'destructive', title: 'Erro ao Finalizar', description: result.message });
      }
  }

  return (
    <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
      <DialogTrigger asChild>
          {children}
      </DialogTrigger>
      <DialogContent>
          <DialogHeader>
              <DialogTitle>Endereço de Entrega</DialogTitle>
              <DialogDescription>
                  Insira um endereço ou use a sua localização exata para a entrega.
              </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
              <div className="relative">
                  <Label htmlFor="address" className="sr-only">
                      Endereço
                  </Label>
                    <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                      id="address" 
                      value={address} 
                      onChange={(e) => {
                          setAddress(e.target.value);
                          setLocation(null); // Clear location if user types manually
                      }} 
                      className="pl-10"
                      placeholder="Ex: Rua da Liberdade, Bairro Azul"
                      disabled={isFetchingLocation}
                  />
              </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                      Ou
                      </span>
                  </div>
              </div>
                <Button variant="outline" onClick={handleGetLocation} disabled={isFetchingLocation}>
                  {isFetchingLocation ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                      <MapPin className="mr-2 h-4 w-4" />
                  )}
                  Usar minha localização exata
              </Button>
          </div>
          <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddressDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleConfirmOrder} disabled={isCheckoutLoading || !address.trim()}>
                  {isCheckoutLoading && <Loader2 className="animate-spin mr-2" />}
                  Confirmar Encomenda
              </Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CartView() {
  const { items, removeItem, updateItemQuantity, totalPrice, totalItems, isInitialized } = useCart();
  const router = useRouter();
  
  const onOrderConfirmed = () => {
    router.push('/my-orders');
  }

  if (isInitialized && totalItems === 0) {
    return (
      <div className="text-center space-y-4">
        <ShoppingCart className="mx-auto h-24 w-24 text-muted-foreground" />
        <h1 className="text-3xl font-bold font-headline">O seu carrinho está vazio</h1>
        <p className="text-muted-foreground">Parece que ainda não adicionou nada. Que tal explorar os nossos produtos?</p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/minishopping">Começar a comprar</Link>
          </Button>
           <Button asChild size="lg" variant="outline">
              <Link href="/">Voltar à Página Inicial</Link>
            </Button>
        </div>
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
                         <div className="h-16 w-16 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                            {item.product.imageUrls && item.product.imageUrls.length > 0 ? (
                                <Image src={item.product.imageUrls[0]} alt={item.product.name} width={64} height={64} className="object-cover h-full w-full" />
                            ) : (
                                <Package className="h-8 w-8 text-muted-foreground" />
                            )}
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
            <CheckoutDialog onOrderConfirmed={onOrderConfirmed}>
                <Button size="lg" className="w-full">
                    Finalizar Compra
                </Button>
            </CheckoutDialog>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
