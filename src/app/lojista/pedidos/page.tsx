

'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2, User as UserIcon, Users, DollarSign, Calendar, List, MoreVertical, MapPin, Package, XCircle, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { LojistaOrderStatusButton } from './lojista-order-status-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { updateLojistaOrderStatus } from './actions';
import { useToast } from '@/hooks/use-toast';

function getErrorMessage(error: any): string {
    if (error && typeof error.message === 'string') {
        return error.message;
    }
    return "Ocorreu um erro desconhecido ao buscar os seus pedidos.";
}

const convertDocToOrder = (doc: any): Order => {
  const data = doc.data();
  return {
    id: doc.id,
    clientId: data.clientId,
    clientName: data.clientName,
    clientPhone: data.clientPhone,
    items: data.items,
    totalAmount: data.totalAmount,
    status: data.status,
    orderType: data.orderType,
    createdAt: data.createdAt?.toMillis(),
    lojistaId: data.lojistaId,
    groupName: data.groupName,
    courierId: data.courierId,
    courierName: data.courierName,
    deliveryLocation: data.deliveryLocation,
    address: data.address
  };
};

function CancelOrderButton({ order, lojistaId }: { order: Order; lojistaId: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleCancel = async () => {
        setIsLoading(true);
        const result = await updateLojistaOrderStatus(order.id, 'cancelado', lojistaId);
        setIsLoading(false);

        if (result.success) {
            toast({ title: 'Pedido Cancelado', description: 'O pedido foi cancelado com sucesso.' });
        } else {
            toast({ variant: 'destructive', title: 'Erro!', description: result.message });
        }
    };

    if (order.status !== 'a aguardar lojista' && order.status !== 'pendente') {
        return null;
    }

    return (
        <Button variant="destructive" size="sm" onClick={handleCancel} disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : <XCircle className="mr-2" />}
            Cancelar Pedido
        </Button>
    );
}

export default function LojistaOrdersPage() {
    const [user, authLoading] = useAuthState(auth);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading || !user) {
            if (!authLoading) setLoading(false);
            return;
        }

        setLoading(true);
        const ordersQuery = query(collection(db, 'orders'), where('lojistaId', '==', user.uid));

        const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
            const updatedOrders = snapshot.docs.map(convertDocToOrder);
            
            const actionableOrders = updatedOrders.filter(order => 
                order.status !== 'entregue' && order.status !== 'cancelado'
            );

            actionableOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            
            setOrders(actionableOrders);
            setLoading(false);
        }, (err) => {
            console.error(err);
            setError(getErrorMessage(err));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, authLoading]);
    
    const canShowMap = (order: Order) => {
        const showOnStatus: Order['status'][] = ['pronto para recolha', 'a caminho', 'aguardando confirmação'];
        return order.deliveryLocation && showOnStatus.includes(order.status);
    }

    if (loading || authLoading) {
        return (
             <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <>
             <div className="space-y-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Gestão de Pedidos</h1>
                <p className="text-muted-foreground">Prepare os pedidos que aguardam a sua atenção.</p>
            </div>

             {error ? (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao Carregar Pedidos</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
             ) : (
                <>
                {orders.length > 0 ? (
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {orders.map(order => (
                            <AccordionItem value={order.id} key={order.id} className="border-b-0">
                                <Card>
                                    <div className="flex items-center p-4">
                                        <AccordionTrigger className="hover:no-underline flex-grow p-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full text-left gap-4 sm:gap-0">
                                                <div className="flex-1">
                                                    <p className="font-mono text-xs text-muted-foreground">#{order.id.substring(0, 6)}</p>
                                                    <p className="font-semibold">{order.clientName}</p>
                                                </div>
                                                <div className="flex-1 flex items-center">
                                                    <Badge variant={order.orderType === 'group' ? 'default' : 'secondary'} className="capitalize">
                                                        {order.orderType === 'group' ? <Users className="mr-1 h-3 w-3"/> : <UserIcon className="mr-1 h-3 w-3"/>}
                                                        {order.groupName || 'Individual'}
                                                    </Badge>
                                                </div>
                                                <div className="flex-1 hidden md:block">
                                                    <p className="text-sm text-muted-foreground">Data</p>
                                                    <p>{order.createdAt ? format(new Date(order.createdAt), "d MMM, yyyy", { locale: pt }) : 'N/A'}</p>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-muted-foreground">Total</p>
                                                    <p className="font-semibold">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.totalAmount)}</p>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <div className="flex-shrink-0 pl-4">
                                            <LojistaOrderStatusButton order={order} />
                                        </div>
                                    </div>
                                    <AccordionContent>
                                        <div className="p-4 pt-0 bg-muted/30">
                                            <h4 className="font-semibold mb-2">Itens do Pedido</h4>
                                            <ul className="space-y-2 text-sm">
                                                {order.items.map(item => (
                                                    <li key={item.id} className="flex justify-between items-center bg-background p-2 rounded-md">
                                                        <div>
                                                            <span className="font-medium">{item.name}</span>
                                                            <span className="text-muted-foreground"> (x{item.quantity})</span>
                                                        </div>
                                                        <span>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(item.price * item.quantity)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <Separator className="my-4" />
                                            <div className="space-y-2 text-sm">
                                                <h4 className="font-semibold">Informações de Entrega</h4>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground flex items-center gap-1.5"><UserIcon /> Cliente:</span>
                                                    <span>{order.clientName}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground flex items-center gap-1.5"><Phone /> Telefone:</span>
                                                    {order.clientPhone ? (
                                                        <Button variant="link" size="sm" asChild className="p-0 h-auto">
                                                            <a href={`tel:${order.clientPhone}`}>{order.clientPhone}</a>
                                                        </Button>
                                                    ) : (
                                                        <span>N/A</span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between items-start">
                                                    <span className="text-muted-foreground flex items-center gap-1.5"><MapPin /> Endereço:</span>
                                                    <span className="text-right max-w-[60%]">{order.address}</span>
                                                </div>
                                            </div>
                                            <Separator className="my-4" />
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    {user && <CancelOrderButton order={order} lojistaId={user.uid} />}
                                                </div>
                                                {canShowMap(order) && (
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`https://www.google.com/maps/search/?api=1&query=${order.deliveryLocation?.latitude},${order.deliveryLocation?.longitude}`} target="_blank">
                                                            <MapPin className="mr-2 h-4 w-4"/>
                                                            Ver no Mapa
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </Card>
                            </AccordionItem>
                        ))}
                    </Accordion>
                    ) : (
                        <Card className="text-center h-48 flex items-center justify-center">
                            <CardContent className="pt-6">
                                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2"/>
                                <p className="font-semibold">Nenhum pedido ativo encontrado.</p>
                                <p className="text-sm text-muted-foreground">Novos pedidos aparecerão aqui.</p>
                            </CardContent>
                        </Card>
                    )}
                </>
             )}
        </>
    );
}
