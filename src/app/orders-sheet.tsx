
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Package, Truck, Loader2, Check } from 'lucide-react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import type { Order, OrderStatus } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { confirmOrderReception } from './my-orders/actions';
import { useToast } from '@/hooks/use-toast';


const statusColors: Record<OrderStatus, string> = {
    'pendente': 'bg-gray-500/20 text-gray-800',
    'a aguardar lojista': 'bg-yellow-500/20 text-yellow-800',
    'pronto para recolha': 'bg-blue-500/20 text-blue-800',
    'a caminho': 'bg-indigo-500/20 text-indigo-800',
    'aguardando confirmação': 'bg-cyan-500/20 text-cyan-800',
    'entregue pelo vendedor': 'bg-purple-500/20 text-purple-800',
    'entregue': 'bg-green-500/20 text-green-800',
    'cancelado': 'bg-red-500/20 text-red-800',
};

function OrderItem({ order }: { order: Order }) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleConfirm = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setLoading(true);
        const result = await confirmOrderReception(order.id);
        setLoading(false);
        if (result.success) {
            toast({ title: 'Pedido Confirmado!', description: 'O seu pedido foi marcado como entregue.' });
            // The sheet will auto-update due to the onSnapshot listener
        } else {
            toast({ variant: 'destructive', title: 'Erro', description: result.message });
        }
    };
    
    return (
        <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-semibold">{order.groupName || `Encomenda ${order.orderType}`}</h3>
                    <p className="text-xs text-muted-foreground font-mono">ID: #{order.id.substring(0, 6)}</p>
                </div>
                {order.status !== 'aguardando confirmação' && (
                    <div className={cn("text-xs font-semibold px-2 py-1 rounded-full capitalize", statusColors[order.status])}>
                        {order.status}
                    </div>
                )}
            </div>
            <Separator className="my-3" />
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Data</span>
                    <span>{order.createdAt ? format(new Date(order.createdAt), "d MMM, yyyy 'às' HH:mm", { locale: pt }) : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-medium">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.totalAmount)}</span>
                </div>
                {order.courierName && (
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Entregador</span>
                        <span className="font-medium">{order.courierName}</span>
                    </div>
                )}
            </div>
            {order.status === 'aguardando confirmação' && (
                <div className="mt-4">
                    <p className="text-sm text-cyan-800 mb-2">O entregador marcou como entregue. Por favor, confirme.</p>
                     <Button onClick={handleConfirm} disabled={loading} size="sm" className="w-full bg-cyan-600 hover:bg-cyan-700">
                        {loading ? <Loader2 className="mr-2 animate-spin"/> : <Check className="mr-2"/>}
                        Confirmar Receção
                    </Button>
                </div>
            )}
        </div>
    )
}

export function OrdersSheet() {
  const [user] = useAuthState(auth);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setOrders([]);
        setLoading(false);
        return;
    }

    setLoading(true);
    const ordersQuery = query(collection(db, 'orders'), where('clientId', '==', user.uid));
    
    const unsubscribe = onSnapshot(ordersQuery, async (snapshot) => {
        const fetchedOrders: Order[] = [];
        for (const doc of snapshot.docs) {
            const data = doc.data();
            const contributionsCol = collection(db, 'orders', doc.id, 'contributions');
            const contributionsSnapshot = await getDocs(contributionsCol);
            const contributions = contributionsSnapshot.docs.map(c => c.data()) as any;

            fetchedOrders.push({
                id: doc.id,
                clientId: data.clientId,
                groupId: data.groupId,
                groupName: data.groupName,
                clientName: data.clientName,
                items: data.items,
                totalAmount: data.totalAmount,
                status: data.status,
                orderType: data.orderType || 'group',
                createdAt: data.createdAt?.toMillis(),
                contributions,
                courierId: data.courierId,
                courierName: data.courierName,
            });
        }
        
         // Filter for active orders client-side
        const activeOrderStatuses: OrderStatus[] = ['pendente', 'a aguardar lojista', 'pronto para recolha', 'a caminho', 'aguardando confirmação'];
        const activeOrders = fetchedOrders.filter(order => activeOrderStatuses.includes(order.status));

        // Sort by date descending
        activeOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        setOrders(activeOrders);
        setLoading(false);
    }, (err) => {
        console.error("Error fetching orders in real-time:", err);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);
  

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative ml-2 rounded-full h-14 w-14 shadow-lg">
          <Truck className="h-6 w-6" />
          {orders.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
              {orders.length}
            </span>
          )}
          <span className="sr-only">Acompanhar Encomendas</span>
        </Button>
      </SheetTrigger>
       <SheetContent className="flex w-full flex-col pr-0 sm:max-w-md">
        <SheetHeader className="px-6">
            <SheetTitle>Minhas Encomendas Ativas</SheetTitle>
            <SheetDescription>
                Acompanhe o estado das suas encomendas em andamento.
            </SheetDescription>
        </SheetHeader>
        <Separator />
        <ScrollArea className="flex-1">
            <div className="flex flex-col gap-4 px-6 py-4">
                {loading ? (
                    <div className="flex items-center justify-center h-full pt-20">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : orders.length > 0 ? (
                    orders.map(order => <OrderItem key={order.id} order={order} />)
                ) : (
                    <div className="text-center pt-20 text-muted-foreground space-y-4">
                        <Truck className="h-12 w-12 mx-auto" />
                        <p className="font-semibold">Nenhuma encomenda ativa.</p>
                        <p className="text-sm">Quando fizer uma compra, ela aparecerá aqui.</p>
                    </div>
                )}
            </div>
        </ScrollArea>
       </SheetContent>
    </Sheet>
  );
}
