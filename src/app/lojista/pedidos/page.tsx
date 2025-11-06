
'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2, User as UserIcon, Users, DollarSign, Calendar, List, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { LojistaOrderStatusButton } from './lojista-order-status-button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

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
    items: data.items,
    totalAmount: data.totalAmount,
    status: data.status,
    orderType: data.orderType,
    createdAt: data.createdAt?.toMillis(),
    lojistaId: data.lojistaId,
    groupName: data.groupName,
    courierId: data.courierId,
    courierName: data.courierName
  };
};

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
            
            // Show all non-delivered/cancelled orders to the lojista
            const actionableOrders = updatedOrders.filter(order => 
                order.status !== 'entregue' && order.status !== 'cancelado'
            );

            // Sort client-side
            actionableOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            
            setOrders(actionableOrders);
            setLoading(false);
        }, (err) => {
            console.error(err);
            setError(getErrorMessage(err));
            setLoading(false);
        });

        // Cleanup subscription on component unmount
        return () => unsubscribe();
    }, [user, authLoading]);
    
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
                    {/* Mobile View - List of Cards */}
                    <div className="md:hidden space-y-4">
                        {orders.length > 0 ? (
                            orders.map(order => (
                                <Card key={order.id}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-base">Pedido #{order.id.substring(0, 6)}</CardTitle>
                                                <CardDescription>{order.clientName}</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                         <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground flex items-center gap-1.5"><List className="h-4 w-4" /> Tipo</span>
                                            <Badge variant={order.orderType === 'group' ? 'default' : 'secondary'} className="capitalize">
                                                {order.orderType === 'group' ? <Users className="mr-1 h-3 w-3"/> : <UserIcon className="mr-1 h-3 w-3"/>}
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
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground flex items-center gap-1.5"><List className="h-4 w-4" /> Itens</span>
                                            <span>{order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}</span>
                                        </div>
                                        <div>
                                            <LojistaOrderStatusButton order={order} />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                             <Card className="text-center h-48 flex items-center justify-center">
                                <CardContent>
                                    <p>Nenhum pedido ativo encontrado.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Desktop View - Table */}
                    <Card className="hidden md:block">
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pedido ID</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Entregador</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.length > 0 ? (
                                        orders.map(order => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-mono text-xs">#{order.id.substring(0, 6)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={order.orderType === 'group' ? 'default' : 'secondary'} className="capitalize">
                                                        {order.orderType === 'group' ? <Users className="mr-1 h-3 w-3"/> : <UserIcon className="mr-1 h-3 w-3"/>}
                                                        {order.groupName || 'Individual'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{order.clientName}</TableCell>
                                                <TableCell>{order.createdAt ? format(new Date(order.createdAt), "d MMM, yyyy", { locale: pt }) : 'N/A'}</TableCell>
                                                <TableCell>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.totalAmount)}</TableCell>
                                                <TableCell>{order.courierName || 'N/A'}</TableCell>
                                                <TableCell className="text-right">
                                                    <LojistaOrderStatusButton order={order} />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center h-24">Nenhum pedido ativo encontrado.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
             )}
        </>
    );
}
