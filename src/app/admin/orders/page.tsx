

import { getOrders } from '../actions';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, MapPin, Users, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { OrderStatusDropdown } from './order-status-dropdown';


function getErrorMessage(error: any): string {
    if (error && typeof error.message === 'string') {
        return error.message;
    }
    return "Ocorreu um erro desconhecido ao buscar os pedidos.";
}


export default async function AdminOrdersPage() {
    let orders: Order[] = [];
    let error: string | null = null;

    try {
        orders = await getOrders();
    } catch (e) {
        console.error(e);
        error = getErrorMessage(e);
    }

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
                                    <TableHead>Data</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Contribuições</TableHead>
                                    <TableHead>Itens</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.length > 0 ? (
                                    orders.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono text-xs">#{order.id.substring(0, 6)}</TableCell>
                                            <TableCell>{order.groupName}</TableCell>
                                            <TableCell>{order.createdAt ? format(new Date(order.createdAt), "d MMM, yyyy", { locale: pt }) : 'N/A'}</TableCell>
                                            <TableCell>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.totalAmount)}</TableCell>
                                            <TableCell>
                                                <OrderStatusDropdown order={order} />
                                            </TableCell>
                                            <TableCell className="text-center">{order.contributions?.length || 0}</TableCell>
                                            <TableCell className="text-center">{order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}</TableCell>
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
        </div>
    );
}