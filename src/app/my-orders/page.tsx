

'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import type { Order, OrderStatus, ServiceRequest, ServiceRequestStatus } from '@/lib/types';
import { collection, query, where, onSnapshot, getDocs, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Package, Truck, ListOrdered, User as UserIcon, Users, Calendar, Hand, Check, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { confirmOrderReception } from './actions';
import Link from 'next/link';


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

const serviceStatusColors: Record<ServiceRequestStatus, string> = {
    'pendente': 'bg-yellow-500/20 text-yellow-800',
    'confirmado': 'bg-blue-500/20 text-blue-800',
    'concluído': 'bg-green-500/20 text-green-800',
    'cancelado': 'bg-red-500/20 text-red-800',
};

function OrderConfirmationAction({ order, className }: { order: Order; className?: string }) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const [user] = useAuthState(auth);

    const handleConfirm = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent accordion from toggling
        if (!user) return;
        setLoading(true);
        const result = await confirmOrderReception(order.id, user.uid);
        setLoading(false);
        if (result.success) {
            toast({ title: 'Pedido Confirmado!', description: 'O seu pedido foi marcado como entregue. Obrigado!' });
        } else {
            toast({ variant: 'destructive', title: 'Erro', description: result.message });
        }
    };

    if (order.status !== 'aguardando confirmação') {
        return null;
    }
    
    return (
        <Button onClick={handleConfirm} disabled={loading} size="sm" className={cn("bg-cyan-600 hover:bg-cyan-700", className)}>
            {loading ? <Loader2 className="mr-2 animate-spin"/> : <Check className="mr-2"/>}
            Confirmar Receção
        </Button>
    );
}

function AwaitingConfirmationCard({ order }: { order: Order }) {
    if (order.status !== 'aguardando confirmação') return null;
    
    return (
        <Card className="bg-cyan-500/10 border-cyan-500/30">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Hand className="h-8 w-8 text-cyan-700"/>
                    <div>
                        <CardTitle>Confirme a Receção</CardTitle>
                        <CardDescription>O seu pedido #{order.id.substring(0, 6)} foi marcado como entregue.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p>O entregador <span className="font-semibold">{order.courierName}</span> indicou que a sua encomenda foi entregue. Por favor, confirme que a recebeu.</p>
            </CardContent>
            <CardFooter>
                <OrderConfirmationAction order={order} className="w-full sm:w-auto" />
            </CardFooter>
        </Card>
    );
}

interface GroupedOrders {
    [key: string]: Order[];
}


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

        const activeOrderStatuses: OrderStatus[] = ['pendente', 'a aguardar lojista', 'pronto para recolha', 'a caminho', 'aguardando confirmação'];
        const ordersQuery = query(collection(db, 'orders'), where('clientId', '==', user.uid), where('status', 'in', activeOrderStatuses));
        
        const unsubscribeOrders = onSnapshot(ordersQuery, async (snapshot) => {
            const fetchedOrders: Order[] = await Promise.all(snapshot.docs.map(async (doc) => {
                const data = doc.data();
                const contributionsCol = collection(db, 'orders', doc.id, 'contributions');
                const contributionsSnapshot = await getDocs(contributionsCol);
                const contributions = contributionsSnapshot.docs.map(c => c.data()) as any;

                return {
                    id: doc.id,
                    clientId: data.clientId,
                    clientName: data.clientName,
                    items: data.items,
                    totalAmount: data.totalAmount,
                    status: data.status,
                    orderType: data.orderType || 'group',
                    createdAt: data.createdAt?.toMillis(),
                    contributions,
                    courierId: data.courierId,
                    courierName: data.courierName,
                    deliveryLocation: data.deliveryLocation,
                    address: data.address, // Make sure address is fetched
                };
            }));
            
            fetchedOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            setOrders(fetchedOrders);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching orders:", err);
            setLoading(false);
        });

        const activeServiceStatuses: ServiceRequestStatus[] = ['pendente', 'confirmado'];
        const servicesQuery = query(collection(db, 'serviceRequests'), where('clientId', '==', user.uid), where('status', 'in', activeServiceStatuses));
        
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
            setLoading(false); 
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
    
    const ordersToConfirm = orders.filter(o => o.status === 'aguardando confirmação');
    
    const groupedByGroup = orders.reduce<GroupedOrders>((acc, order) => {
        const key = order.groupId || order.id; // Group by groupId, or use order.id for individual orders
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(order);
        return acc;
    }, {});


    return (
        <div className="container mx-auto px-4 py-8">
            <div className="space-y-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Meus Pedidos</h1>
                <p className="text-muted-foreground">Acompanhe o histórico das suas compras e agendamentos.</p>
            </div>
            
            {ordersToConfirm.length > 0 && (
                <div className="space-y-4 mb-8">
                    {ordersToConfirm.map(order => (
                        <AwaitingConfirmationCard key={order.id} order={order} />
                    ))}
                </div>
            )}

            <Tabs defaultValue="compras" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="compras">
                        <Package className="mr-2 h-4 w-4" /> Compras Ativas ({Object.keys(groupedByGroup).length})
                    </TabsTrigger>
                    <TabsTrigger value="agendamentos">
                        <Calendar className="mr-2 h-4 w-4" /> Agendamentos Ativos ({serviceRequests.length})
                    </TabsTrigger>
                </TabsList>

                {/* Tab for Orders/Compras */}
                <TabsContent value="compras">
                     {Object.keys(groupedByGroup).length === 0 ? (
                         <div className="text-center py-16 border-2 border-dashed rounded-lg mt-4">
                            <Truck className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                            <p className="text-lg font-semibold text-muted-foreground">Nenhuma compra ativa encontrada.</p>
                            <p className="text-muted-foreground mt-2">Assim que fizer uma compra, ela aparecerá aqui.</p>
                        </div>
                    ) : (
                        <Card className="mt-4">
                            <CardContent>
                                <Accordion type="single" collapsible className="w-full">
                                    {Object.entries(groupedByGroup).map(([groupId, ordersInGroup]) => {
                                        const firstOrder = ordersInGroup[0];
                                        const isGroupOrder = firstOrder.orderType === 'group';
                                        const title = isGroupOrder ? firstOrder.groupName : 'Compra Individual';
                                        const totalAmount = ordersInGroup.reduce((sum, o) => sum + o.totalAmount, 0);

                                        return (
                                            <AccordionItem value={groupId} key={groupId}>
                                                <AccordionTrigger className="hover:no-underline">
                                                    <div className="flex justify-between items-center w-full">
                                                        <div className="flex-1 text-left">
                                                            <p className="font-mono text-xs text-muted-foreground">{isGroupOrder ? 'Grupo' : 'Individual'}</p>
                                                            <p className="font-semibold">{title}</p>
                                                        </div>
                                                        <div className="flex-1 text-left hidden md:block">
                                                            <p className="text-sm text-muted-foreground">Data</p>
                                                            <p>{firstOrder.createdAt ? format(new Date(firstOrder.createdAt), "d MMM, yyyy", { locale: pt }) : 'N/A'}</p>
                                                        </div>
                                                        <div className="flex-1 text-left">
                                                            <p className="text-sm text-muted-foreground">Total</p>
                                                            <p>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(totalAmount)}</p>
                                                        </div>
                                                        <div className="flex-1 text-right pr-4">
                                                            <Badge className={cn("capitalize")} variant="secondary">
                                                                {ordersInGroup.length} {ordersInGroup.length > 1 ? 'entregas' : 'entrega'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent>
                                                    <div className="p-4 bg-muted/50 space-y-4">
                                                        <h4 className="font-semibold mb-2 flex items-center gap-2"><ListOrdered/> Detalhes da Compra</h4>
                                                        {ordersInGroup.map(order => (
                                                             <div key={order.id} className="p-3 border rounded-md bg-background">
                                                                <div className="flex justify-between items-center mb-2">
                                                                     <p className="font-mono text-xs">#{order.id.substring(0, 6)}</p>
                                                                     <Badge className={cn("capitalize", statusColors[order.status])}>{order.status}</Badge>
                                                                </div>
                                                                <ul className="space-y-1 text-sm text-muted-foreground">
                                                                    {order.items.map((item, index) => (
                                                                        <li key={index} className="flex justify-between">
                                                                            <span>{item.quantity} x {item.name}</span>
                                                                            <span>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(item.price * item.quantity)}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                                 {order.courierName && (
                                                                    <div className="mt-2 pt-2 border-t">
                                                                        <div className="flex justify-between text-sm items-center">
                                                                            <div>
                                                                                <span className="text-muted-foreground">Entregador:</span>
                                                                                <span> {order.courierName}</span>
                                                                            </div>
                                                                            {order.deliveryLocation && (
                                                                                <Button variant="outline" size="sm" asChild>
                                                                                    <Link href={`https://www.google.com/maps/search/?api=1&query=${order.deliveryLocation.latitude},${order.deliveryLocation.longitude}`} target="_blank">
                                                                                        <MapPin className="mr-2 h-4 w-4" />
                                                                                        Ver no Mapa
                                                                                    </Link>
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                 {order.address && !order.deliveryLocation && (
                                                                    <div className="mt-2 pt-2 border-t text-sm">
                                                                        <span className="text-muted-foreground">Endereço de Entrega: </span>
                                                                        <span>{order.address}</span>
                                                                    </div>
                                                                 )}
                                                                {order.status === 'aguardando confirmação' && (
                                                                    <div className="mt-2 pt-2 border-t">
                                                                        <OrderConfirmationAction order={order} className="w-full sm:w-auto" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        );
                                    })}
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
                            <p className="text-lg font-semibold text-muted-foreground">Nenhum agendamento ativo encontrado.</p>
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
