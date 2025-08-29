

import { getOrders, getUsers } from '../actions';
import type { Order, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, MapPin, Users, ShoppingBag, Bike, Building } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { OrderStatusDropdown } from './order-status-dropdown';
import { OrderActions } from './order-actions';
import { AssignDriverDialog } from './assign-driver-dialog';


function getErrorMessage(error: any): string {
    if (error && typeof error.message === 'string') {
        return error.message;
    }
    return "Ocorreu um erro desconhecido ao buscar os pedidos.";
}


export default async function AdminOrdersPage() {
    let orders: Order[] = [];
    let error: string | null = null;
    let users: User[] = [];

    try {
        [orders, users] = await Promise.all([
            getOrders(),
            getUsers()
        ]);
    } catch (e) {
        console.error(e);
        error = getErrorMessage(e);
    }
    
    const lojistaMap = new Map(users.filter(u => u.role === 'lojista').map(u => [u.uid, u.name]));


    return (
        <div className="container mx-auto px-4 py-8">
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
                <Card>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Pedido ID</TableHead>
                                    <TableHead>Grupo</TableHead>
                                    <TableHead>Criador</TableHead>
                                    <TableHead>Lojista</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Entregador</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.length > 0 ? (
                                    orders.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono text-xs">#{order.id.substring(0, 6)}</TableCell>
                                            <TableCell>{order.groupName}</TableCell>
                                            <TableCell>{order.creatorName}</TableCell>
                                            <TableCell>
                                                {order.lojistaId ? (
                                                     <div className="flex items-center gap-2">
                                                        <Building className="h-4 w-4 text-muted-foreground" />
                                                        <span>{lojistaMap.get(order.lojistaId) || 'Desconhecido'}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{order.createdAt ? format(new Date(order.createdAt), "d MMM, yyyy", { locale: pt }) : 'N/A'}</TableCell>
                                            <TableCell>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.totalAmount)}</TableCell>
                                            <TableCell>
                                                <OrderStatusDropdown order={order} />
                                            </TableCell>
                                            <TableCell>
                                                {order.driverName ? (
                                                    <div className="flex items-center gap-2">
                                                        <Bike className="h-4 w-4 text-muted-foreground" />
                                                        <span>{order.driverName}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right flex items-center justify-end gap-2">
                                                <AssignDriverDialog order={order} />
                                                <OrderActions orderId={order.id} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center h-24">Nenhum pedido encontrado.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
             )}
        </div>
    );
}
