
import { getOrders } from '../actions';
import type { Order } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Package, User, Users, Calendar, DollarSign, List, MoreVertical, Home } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { OrderStatusDropdown } from './order-status-dropdown';
import { OrderActions } from './order-actions';
import { AssignDriverDialog } from './assign-driver-dialog';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {Button} from "@/components/ui/button";


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
                                             <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <AssignDriverDialog order={order} />
                                                    </DropdownMenuItem>
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
                                                {order.orderType === 'group' ? <Users className="mr-1 h-3 w-3"/> : <User className="mr-1 h-3 w-3"/>}
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
                                        <div>
                                            <OrderStatusDropdown order={order} />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                             <Card className="text-center h-48 flex items-center justify-center">
                                <CardContent>
                                    <p>Nenhum pedido encontrado.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                
                    {/* Desktop View - Table */}
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
                                    {orders.length > 0 ? (
                                        orders.map(order => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-mono text-xs">#{order.id.substring(0, 6)}</TableCell>
                                                <TableCell>
                                                    <Badge variant={order.orderType === 'group' ? 'default' : 'secondary'} className="capitalize">
                                                        {order.orderType === 'group' ? <Users className="mr-1 h-3 w-3"/> : <User className="mr-1 h-3 w-3"/>}
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
                                                        <AssignDriverDialog order={order} />
                                                        <OrderActions orderId={order.id} />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center h-24">Nenhum pedido encontrado.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </>
             )}
        </div>
    )
}
