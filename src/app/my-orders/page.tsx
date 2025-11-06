
'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import type { Order, OrderStatus, ServiceRequest, ServiceRequestStatus } from '@/lib/types';
import { collection, query, where, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Package, Truck, ListOrdered, User as UserIcon, Users, Calendar, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const statusColors: Record<OrderStatus, string> = {
    'pendente': 'bg-gray-500/20 text-gray-800',
    'a aguardar lojista': 'bg-yellow-500/20 text-yellow-800',
    'pronto para recolha': 'bg-blue-500/20 text-blue-800',
    'a caminho': 'bg-indigo-500/20 text-indigo-800',
    'entregue': 'bg-green-500/20 text-green-800',
    'cancelado': 'bg-red-500/20 text-red-800',
};

const serviceStatusColors: Record<ServiceRequestStatus, string> = {
    'pendente': 'bg-yellow-500/20 text-yellow-800',
    'confirmado': 'bg-blue-500/20 text-blue-800',
    'concluído': 'bg-green-500/20 text-green-800',
    'cancelado': 'bg-red-500/20 text-red-800',
};


export default function MyOrdersPage() {
    const [user] = useAuthState(auth);
    const [orders, setOrders] = useState<Order[]>([]);
    const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        setLoading(true);

        // Listener for Orders
        const ordersQuery = query(collection(db, 'orders'), where('clientId', '==', user.uid));
        const unsubscribeOrders = onSnapshot(ordersQuery, async (snapshot) => {
            const fetchedOrders: Order[] = await Promise.all(snapshot.docs.map(async (doc) => {
                const data = doc.data();
                const contributionsCol = collection(db, 'orders', doc.id, 'contributions');
                const contributionsSnapshot = await getDocs(contributionsCol);
                const contributions = contributionsSnapshot.docs.map(c => c.data()) as any;

                return {
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
                };
            }));
            fetchedOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            setOrders(fetchedOrders);
            // We set loading to false only after both listeners have fired once
        }, (err) => {
            console.error("Error fetching orders:", err);
            setLoading(false);
        });

        // Listener for Service Requests
        const servicesQuery = query(collection(db, 'serviceRequests'), where('clientId', '==', user.uid));
        const unsubscribeServices = onSnapshot(servicesQuery, (snapshot) => {
            const fetchedServices: ServiceRequest[] = snapshot.docs.map(doc => {
                 const data = doc.data();
                 return {
                     id: doc.id,
                     serviceId: data.serviceId,
                     serviceName: data.serviceName,
                     clientId: data.clientId,
                     clientName: data.clientName,
                     clientPhone: data.clientPhone,
                     lojistaId: data.lojistaId,
                     requestedDate: (data.requestedDate as Timestamp)?.toMillis(),
                     requestedPeriod: data.requestedPeriod,
                     address: data.address,
                     notes: data.notes,
                     status: data.status,
                     createdAt: (data.createdAt as Timestamp)?.toMillis(),
                 }
            });
            fetchedServices.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            setServiceRequests(fetchedServices);
            setLoading(false); // Set loading to false here
        }, (err) => {
            console.error("Error fetching service requests:", err);
            setLoading(false);
        });

        return () => {
            unsubscribeOrders();
            unsubscribeServices();
        };
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
                <h1 className="text-3xl font-bold tracking-tight font-headline">Meus Pedidos</h1>
                <p className="text-muted-foreground">Acompanhe o histórico das suas compras e agendamentos.</p>
            </div>

            <Tabs defaultValue="compras" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="compras">
                        <Package className="mr-2 h-4 w-4" /> Compras ({orders.length})
                    </TabsTrigger>
                    <TabsTrigger value="agendamentos">
                        <Calendar className="mr-2 h-4 w-4" /> Agendamentos ({serviceRequests.length})
                    </TabsTrigger>
                </TabsList>

                {/* Tab for Orders/Compras */}
                <TabsContent value="compras">
                     {orders.length === 0 ? (
                         <div className="text-center py-16 border-2 border-dashed rounded-lg mt-4">
                            <Truck className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                            <p className="text-lg font-semibold text-muted-foreground">Nenhuma compra encontrada.</p>
                            <p className="text-muted-foreground mt-2">Assim que fizer uma compra, ela aparecerá aqui.</p>
                        </div>
                    ) : (
                        <Card className="mt-4">
                            <CardContent>
                                <Accordion type="single" collapsible className="w-full">
                                    {orders.map(order => (
                                        <AccordionItem value={order.id} key={order.id}>
                                            <AccordionTrigger>
                                                <div className="flex justify-between items-center w-full">
                                                    <div className="flex-1 text-left">
                                                        <p className="font-mono text-xs">#{order.id.substring(0, 6)}</p>
                                                        <p className="font-semibold">{order.groupName || 'Compra Individual'}</p>
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
                                                        <Badge className={cn("capitalize", statusColors[order.status])}>
                                                            {order.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="p-4 bg-muted/50">
                                                    <h4 className="font-semibold mb-2 flex items-center gap-2"><ListOrdered/> Detalhes da Compra</h4>
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
                </TabsContent>

                {/* Tab for Service Requests/Agendamentos */}
                <TabsContent value="agendamentos">
                    {serviceRequests.length === 0 ? (
                         <div className="text-center py-16 border-2 border-dashed rounded-lg mt-4">
                            <Calendar className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                            <p className="text-lg font-semibold text-muted-foreground">Nenhum agendamento encontrado.</p>
                            <p className="text-muted-foreground mt-2">Os seus serviços agendados aparecerão aqui.</p>
                        </div>
                    ) : (
                         <Card className="mt-4">
                            <CardContent>
                               <Accordion type="single" collapsible className="w-full">
                                    {serviceRequests.map(req => (
                                        <AccordionItem value={req.id} key={req.id}>
                                            <AccordionTrigger>
                                                <div className="flex justify-between items-center w-full">
                                                     <div className="flex-1 text-left">
                                                        <p className="font-mono text-xs">#{req.id.substring(0, 6)}</p>
                                                        <p className="font-semibold">{req.serviceName}</p>
                                                    </div>
                                                     <div className="flex-1 text-left hidden md:block">
                                                         <p className="text-sm text-muted-foreground">Data Solicitada</p>
                                                         <p>{req.requestedDate ? format(new Date(req.requestedDate), "d MMM, yyyy", { locale: pt }) : 'N/A'}</p>
                                                     </div>
                                                    <div className="flex-1 text-left">
                                                         <p className="text-sm text-muted-foreground">Período</p>
                                                         <p className="capitalize">{req.requestedPeriod}</p>
                                                    </div>
                                                    <div className="flex-1 text-right pr-4">
                                                        <Badge className={cn("capitalize", serviceStatusColors[req.status])}>
                                                            {req.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="p-4 bg-muted/50 space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Endereço:</span>
                                                        <span>{req.address}</span>
                                                    </div>
                                                     {req.notes && (
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Notas:</span>
                                                            <span className="text-right">{req.notes}</span>
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
                </TabsContent>
            </Tabs>
        </div>
    );
}
