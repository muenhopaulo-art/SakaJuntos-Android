import { getOrders } from './actions';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, PackageCheck, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

function getErrorMessage(error: any): string {
    if (error && typeof error.message === 'string') {
        return error.message;
    }
    return "Ocorreu um erro desconhecido ao buscar os pedidos.";
}


export default async function AdminPage() {
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
                <h1 className="text-3xl font-bold tracking-tight font-headline">Painel do Administrador</h1>
                <p className="text-muted-foreground">Monitorize e gira as contribuições e entregas dos grupos.</p>
            </div>

             {error ? (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao Carregar Pedidos</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
             ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Últimas Contribuições</CardTitle>
                        <CardDescription>
                            {orders.length > 0 
                                ? `A visualizar ${orders.length} contribuições.` 
                                : "Ainda não há nenhuma contribuição registada."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Utilizador</TableHead>
                                    <TableHead>Grupo</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead>Localização</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.length > 0 ? (
                                    orders.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell className="whitespace-nowrap">
                                                {format(new Date(order.createdAt!), "d MMM, HH:mm", { locale: pt })}
                                            </TableCell>
                                            <TableCell>{order.userName}</TableCell>
                                            <TableCell>{order.groupName}</TableCell>
                                            <TableCell className="font-medium whitespace-nowrap">
                                                {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.totalAmount)}
                                            </TableCell>
                                             <TableCell>
                                                <a 
                                                    href={`https://www.google.com/maps?q=${order.location.latitude},${order.location.longitude}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="flex items-center gap-1 text-primary hover:underline"
                                                >
                                                    <MapPin className="h-4 w-4"/>
                                                    Ver Mapa
                                                </a>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={order.status === 'Entregue' ? 'default' : 'secondary'}>
                                                    <PackageCheck className="mr-1 h-3 w-3" />
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            Nenhum pedido encontrado.
                                        </TableCell>
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
