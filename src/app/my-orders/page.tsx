
'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import type { Order, OrderStatus } from '@/lib/types';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Package, Truck, ListOrdered, User as UserIcon, Users } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {Button} from "@/components/ui/button";

const statusColors: Record<OrderStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'pendente': 'secondary',
    'a aguardar lojista': 'outline',
    'pronto para recolha': 'default',
    'a caminho': 'default',
    'entregue': 'default',
    'cancelado': 'destructive',
};

const statusBgColors: Record<OrderStatus, string> = {
    'pendente': 'bg-gray-500/20 text-gray-800',
    'a aguardar lojista': 'bg-yellow-500/20 text-yellow-800',
    'pronto para recolha': 'bg-blue-500/20 text-blue-800',
    'a caminho': 'bg-indigo-500/20 text-indigo-800',
    'entregue': 'bg-green-500/20 text-green-800',
    'cancelado': 'bg-red-500/20 text-red-800',
};


export default function MyOrdersPage() {
    const [user] = useAuthState(auth);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setOrders([]);
            setLoading(false);
            return;
        }

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
            
            fetchedOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            setOrders(fetchedOrders);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching orders:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center items-center h-96">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="space-y-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Minhas Encomendas</h1>
                <p className="text-muted-foreground">Acompanhe o histórico e o estado das suas compras.</p>
            </div>

            {orders.length === 0 ? (
                 <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <Truck className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg font-semibold text-muted-foreground">Nenhuma encomenda encontrada.</p>
                    <p className="text-muted-foreground mt-2">Assim que fizer uma compra, ela aparecerá aqui.</p>
                </div>
            ) : (
                <Card>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {orders.map(order => (
                                <AccordionItem value={order.id} key={order.id}>
                                    <AccordionTrigger>
                                        <div className="flex justify-between items-center w-full">
                                            <div className="flex-1 text-left">
                                                <p className="font-mono text-xs">#{order.id.substring(0, 6)}</p>
                                                <p className="font-semibold">{order.groupName || 'Encomenda Individual'}</p>
                                            </div>
                                             <div className="flex-1 text-left hidden md:block">
                                                 <p className="text-sm text-muted-foreground">Data</p>
                                                 <p>{order.createdAt ? format(new Date(order.createdAt), "d MMM, yyyy", { locale: pt }) : 'N/A'}</p>
                                             </div>
                                            <div className="flex-1 text-left">
                                                 <p className="text-sm text-muted-foreground">Total</p>
                                                 <p>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.totalAmount)}</p>
                                            </div>
                                            <div className="flex-1 text-right pr-4">
                                                <Badge variant={statusColors[order.status]} className={cn("text-xs font-semibold px-2 py-1 rounded-full capitalize", statusBgColors[order.status])}>
                                                    {order.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="p-4 bg-muted/50">
                                            <h4 className="font-semibold mb-2 flex items-center gap-2"><ListOrdered/> Detalhes da Encomenda</h4>
                                            <ul className="space-y-1 text-sm text-muted-foreground">
                                                {order.items.map((item, index) => (
                                                    <li key={index} className="flex justify-between">
                                                        <span>{item.quantity} x {item.name}</span>
                                                        <span>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(item.price * item.quantity)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                             {order.courierName && (
                                                <div className="mt-4 pt-4 border-t">
                                                    <h5 className="font-semibold mb-2">Detalhes da Entrega</h5>
                                                    <div className="flex justify-between text-sm">
                                                        <span>Entregador:</span>
                                                        <span>{order.courierName}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
