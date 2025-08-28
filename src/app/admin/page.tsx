import { getOrders } from './actions';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, PackageCheck, MapPin, Users, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';


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
                <div className="space-y-6">
                    {orders.length > 0 ? (
                        orders.map(order => (
                            <Collapsible key={order.id} className="space-y-2">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle>{order.groupName}</CardTitle>
                                            <CardDescription>
                                                Pedido a {format(new Date(order.createdAt!), "d MMM, HH:mm", { locale: pt })} • Total: {new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.totalAmount)}
                                            </CardDescription>
                                        </div>
                                         <CollapsibleTrigger asChild>
                                            <Button variant="ghost" size="sm">Ver Detalhes</Button>
                                        </CollapsibleTrigger>
                                    </CardHeader>
                                     <CardContent>
                                        <div className="flex justify-between items-center">
                                            <Badge variant={order.status === 'Entregue' ? 'default' : 'secondary'}>
                                                <PackageCheck className="mr-1 h-3 w-3" />
                                                {order.status}
                                            </Badge>
                                             <div className="flex items-center text-sm text-muted-foreground">
                                                <Users className="mr-2 h-4 w-4" />
                                                <span>{order.contributions?.length || 0} Membros Contribuiram</span>
                                            </div>
                                        </div>
                                    </CardContent>

                                    <CollapsibleContent>
                                        <Separator className="my-4"/>
                                        <div className="p-6 pt-0 grid gap-6 md:grid-cols-2">
                                            <div>
                                                <h4 className="font-semibold mb-2 flex items-center gap-2"><ShoppingBag/> Itens do Pedido</h4>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Produto</TableHead>
                                                            <TableHead>Qtd.</TableHead>
                                                            <TableHead className="text-right">Subtotal</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {order.items.map(item => (
                                                            <TableRow key={item.product.id}>
                                                                <TableCell>{item.product.name}</TableCell>
                                                                <TableCell>{item.quantity}</TableCell>
                                                                <TableCell className="text-right">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(item.product.price * item.quantity)}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                             <div>
                                                <h4 className="font-semibold mb-2 flex items-center gap-2"><Users/> Contribuições e Localizações</h4>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Utilizador</TableHead>
                                                            <TableHead>Valor</TableHead>
                                                            <TableHead>Localização</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {order.contributions?.map(c => (
                                                            <TableRow key={c.userId}>
                                                                <TableCell>{c.userName}</TableCell>
                                                                <TableCell>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(c.amount)}</TableCell>
                                                                <TableCell>
                                                                    <a 
                                                                        href={`https://www.google.com/maps?q=${c.location.latitude},${c.location.longitude}`} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer" 
                                                                        className="flex items-center gap-1 text-primary hover:underline"
                                                                    >
                                                                        <MapPin className="h-4 w-4"/>
                                                                        Ver Mapa
                                                                    </a>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    </CollapsibleContent>
                                </Card>
                            </Collapsible>
                        ))
                    ) : (
                         <Card>
                            <CardContent className="p-6 text-center text-muted-foreground">
                                <p>Ainda não há nenhum pedido registado.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
