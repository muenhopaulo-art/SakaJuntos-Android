
'use client';

import { useState, useMemo } from 'react';
import { getOrders } from '../actions';
import type { Order, OrderStatus } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Package, User, Users, Calendar, DollarSign, List, MoreVertical, Home, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { OrderStatusDropdown } from './order-status-dropdown';
import { OrderActions } from './order-actions';
import { AssignDriverDialog } from './assign-driver-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

function getErrorMessage(error: any): string {
    if (error && typeof error.message === 'string') {
        return error.message;
    }
    return "Ocorreu um erro desconhecido ao buscar os pedidos.";
}

function OrdersDisplay({ orders, isHistory = false }: { orders: Order[], isHistory?: boolean }) {
    const canShowMap = (order: Order) => {
        const showOnStatus: OrderStatus[] = ['pronto para recolha', 'a caminho', 'aguardando confirmação'];
        return order.deliveryLocation && (isHistory ? order.status === 'entregue' : showOnStatus.includes(order.status));
    }

    if (orders.length === 0) {
        return (
            <Card className="text-center h-48 flex items-center justify-center col-span-full">
                <CardContent className="pt-6">
                    <p>Nenhum pedido {isHistory ? 'no histórico' : 'ativo'} encontrado.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <>
            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                {orders.map(order => (
                    <Card key={order.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-base">Pedido #{order.id.substring(0, 6)}</CardTitle>
                                    <CardDescription>{order.clientName}</CardDescription>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {!isHistory && (
                                            <DropdownMenuItem asChild>
                                                <AssignDriverDialog order={order} />
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem asChild>
                                            <div className="text-destructive w-full">
                                                <OrderActions orderId={order.id} />
                                            </div>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1.5"><List className="h-4 w-4" /> Tipo</span>
                                <Badge variant={order.orderType === 'group' ? 'default' : 'secondary'} className="capitalize">
                                    {order.orderType === 'group' ? <Users className="mr-1 h-3 w-3" /> : <User className="mr-1 h-3 w-3" />}
                                    {order.groupName || 'Individual'}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Data</span>
                                <span>{order.createdAt ? format(new Date(order.createdAt), "d MMM, yyyy", { locale: pt }) : 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> Total</span>
                                <span className="font-semibold">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.totalAmount)}</span>
                            </div>
                            {order.address && (
                                <div className="flex items-start justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-1.5 pt-0.5"><Home className="h-4 w-4" /> Endereço</span>
                                    <span className="text-right max-w-[70%]">{order.address}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <OrderStatusDropdown order={order} />
                                {canShowMap(order) && (
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`https://www.google.com/maps/search/?api=1&query=${order.deliveryLocation?.latitude},${order.deliveryLocation?.longitude}`} target="_blank">
                                            <MapPin className="mr-2 h-4 w-4" />
                                            Mapa
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Desktop View */}
            <Card className="hidden md:block">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Pedido ID</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Endereço</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-mono text-xs">#{order.id.substring(0, 6)}</TableCell>
                                    <TableCell>
                                        <Badge variant={order.orderType === 'group' ? 'default' : 'secondary'} className="capitalize">
                                            {order.orderType === 'group' ? <Users className="mr-1 h-3 w-3" /> : <User className="mr-1 h-3 w-3" />}
                                            {order.groupName || 'Individual'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{order.clientName}</TableCell>
                                    <TableCell className="text-xs">{order.address}</TableCell>
                                    <TableCell>{order.createdAt ? format(new Date(order.createdAt), "d MMM, yyyy", { locale: pt }) : 'N/A'}</TableCell>
                                    <TableCell>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.totalAmount)}</TableCell>
                                    <TableCell>
                                        <OrderStatusDropdown order={order} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            {canShowMap(order) && (
                                                <Button variant="outline" size="icon" asChild>
                                                    <Link href={`https://www.google.com/maps/search/?api=1&query=${order.deliveryLocation?.latitude},${order.deliveryLocation?.longitude}`} target="_blank">
                                                        <MapPin className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            )}
                                            {!isHistory && <AssignDriverDialog order={order} />}
                                            <OrderActions orderId={order.id} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
}

const LoadingSkeleton = () => (
    <div className="space-y-4">
        <div className="hidden md:block">
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            {[...Array(8)].map((_, i) => <TableHead key={i}><Skeleton className="h-5 w-full" /></TableHead>)}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...Array(3)].map((_, i) => (
                            <TableRow key={i}>
                                {[...Array(8)].map((_, j) => <TableCell key={j}><Skeleton className="h-8 w-full" /></TableCell>)}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
        <div className="md:hidden space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
    </div>
);

export default function AdminOrdersPage() {
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useState(() => {
        getOrders()
            .then(data => setAllOrders(data))
            .catch(e => setError(getErrorMessage(e)))
            .finally(() => setLoading(false));
    });

    const { activeOrders, historicalOrders } = useMemo(() => {
        const active: Order[] = [];
        const history: Order[] = [];
        const historyStatus: OrderStatus[] = ['entregue', 'cancelado'];

        allOrders.forEach(order => {
            if (historyStatus.includes(order.status)) {
                history.push(order);
            } else {
                active.push(order);
            }
        });

        return { activeOrders: active, historicalOrders: history };
    }, [allOrders]);
    
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Gestão de Pedidos</h1>
                <p className="text-muted-foreground">Monitorize e atualize o estado de todos os pedidos.</p>
            </div>
            {error ? (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao Carregar Pedidos</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : (
                <Tabs defaultValue="ativos">
                    <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
                        <TabsTrigger value="ativos">Pedidos Ativos ({loading ? '...' : activeOrders.length})</TabsTrigger>
                        <TabsTrigger value="historico">Histórico ({loading ? '...' : historicalOrders.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="ativos" className="mt-4">
                        {loading ? <LoadingSkeleton /> : <OrdersDisplay orders={activeOrders} />}
                    </TabsContent>
                    <TabsContent value="historico" className="mt-4">
                         {loading ? <LoadingSkeleton /> : <OrdersDisplay orders={historicalOrders} isHistory={true} />}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    )
}
