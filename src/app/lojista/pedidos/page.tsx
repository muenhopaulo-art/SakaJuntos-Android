
'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2, User as UserIcon, Users } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { LojistaOrderStatusButton } from './lojista-order-status-button';
import { Badge } from '@/components/ui/badge';


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
    creatorId: data.creatorId,
    creatorName: data.creatorName,
    items: data.items,
    totalAmount: data.totalAmount,
    status: data.status,
    orderType: data.orderType,
    createdAt: data.createdAt?.toMillis(),
    lojistaId: data.lojistaId,
    groupName: data.groupName,
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
            updatedOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            setOrders(updatedOrders);
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
                <Card>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Pedido ID</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Itens</TableHead>
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
                                            <TableCell>{order.creatorName}</TableCell>
                                            <TableCell>{order.createdAt ? format(new Date(order.createdAt), "d MMM, yyyy", { locale: pt }) : 'N/A'}</TableCell>
                                            <TableCell>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.totalAmount)}</TableCell>
                                            <TableCell className="text-center">{order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}</TableCell>
                                            <TableCell className="text-right">
                                                <LojistaOrderStatusButton order={order} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24">Nenhum pedido encontrado.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
             )}
        </>
    );
}
