
'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getLojistaDashboardAnalytics } from '@/app/lojista/actions';
import type { Order, Product } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Package, Activity, Bell, ListOrdered, ShoppingBag, BarChart } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import Link from 'next/link';
import { buttonVariants, Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Image from 'next/image';
import { AddProductDialog } from '@/app/lojista/produtos/add-product-dialog';
import { Badge } from '@/components/ui/badge';

function getErrorMessage(error: any): string {
    if (error && typeof error.message === 'string') {
        return error.message;
    }
    return "Ocorreu um erro desconhecido ao buscar os dados.";
}

export function LojistaDashboardContent() {
    const [user, authLoading] = useAuthState(auth);
    const [data, setData] = useState<{
        analytics: any;
        recentOrders: Order[];
        recentProducts: Product[];
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch analytics data
    useEffect(() => {
        if (authLoading || !user) return;
        
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const result = await getLojistaDashboardAnalytics(user.uid);
                setData(result);
            } catch (e) {
                setError(getErrorMessage(e));
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [user, authLoading]);


    const analyticsCards = [
        {
            title: "Receita Total",
            value: data?.analytics?.totalRevenue,
            icon: DollarSign,
            description: "Total de ganhos dos pedidos processados."
        },
        {
            title: "Pedidos Processados",
            value: data?.analytics?.processedOrders,
            icon: Activity,
            isCurrency: false,
            description: "Nº de pedidos em separação ou já entregues."
        },
        {
            title: "Produtos Ativos",
            value: data?.analytics?.activeProducts,
            icon: ShoppingBag,
            isCurrency: false,
            description: "Total de produtos na sua loja."
        },
        {
            title: "Novos Pedidos",
            value: data?.analytics?.newOrders,
            icon: Bell,
            isCurrency: false,
            description: "Pedidos que aguardam a sua preparação."
        }
    ];
    
    if (loading || authLoading) {
        // The loading state is now handled by the dynamic import's loading component
        return null;
    }

    return (
        <>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold">Dashboard do Lojista</h1>
                <p className="text-sm text-muted-foreground">
                  Uma visão geral do desempenho da sua loja.
                </p>
              </div>
               {user && <AddProductDialog lojistaId={user.uid} />}
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {analyticsCards.map(card => (
                    <Card key={card.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                            <card.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {card.isCurrency === false ? card.value : new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(card.value ?? 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">{card.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Accordion type="multiple" defaultValue={['recent-orders', 'recent-products']} className="w-full space-y-4">
                <AccordionItem value="recent-orders" className="bg-card rounded-lg border shadow-sm">
                    <AccordionTrigger className="p-4">
                        <div className="flex items-center gap-2 font-semibold">
                            <ListOrdered className="h-5 w-5" />
                            <span>Pedidos Ativos Recentes</span>
                            {data?.analytics?.newOrders > 0 && 
                              <Badge className="ml-2">{data.analytics.newOrders}</Badge>
                            }
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0">
                         {data?.recentOrders && data.recentOrders.length > 0 ? (
                            <div className="space-y-2 p-4 pt-0">
                                {data.recentOrders.map(order => (
                                    <div key={order.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none font-mono">
                                                Pedido #{order.id.substring(0, 6)}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {order.clientName} - {order.createdAt ? format(new Date(order.createdAt), "d MMM", { locale: pt }) : ''}
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.totalAmount)}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <div className="h-24 flex flex-col items-center justify-center text-muted-foreground text-center space-y-2 p-4">
                                <Package className="h-8 w-8" />
                                <p className="font-medium">Nenhum pedido ativo recente.</p>
                            </div>
                        )}
                        <div className="text-center p-2 border-t">
                            <Link href="/lojista/pedidos" className={cn(buttonVariants({variant: 'link', size: 'sm'}))}>
                                Ver Todos os Pedidos
                            </Link>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="recent-products" className="bg-card rounded-lg border shadow-sm">
                    <AccordionTrigger className="p-4">
                        <div className="flex items-center gap-2 font-semibold">
                            <ShoppingBag className="h-5 w-5" />
                            <span>Produtos Recentes</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0">
                        {data?.recentProducts && data.recentProducts.length > 0 ? (
                           <div className="space-y-2 p-4 pt-0">
                                {data.recentProducts.map(product => (
                                    <div key={product.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="relative h-10 w-10 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                                                {product.imageUrls && product.imageUrls.length > 0 ? (
                                                    <Image src={product.imageUrls[0]} alt={product.name} width={40} height={40} className="object-cover h-full w-full" />
                                                ) : (
                                                    <Package className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none">{product.name}</p>
                                                <p className="text-sm text-muted-foreground capitalize">{product.category}</p>
                                            </div>
                                        </div>
                                        <div className="ml-auto font-medium">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price)}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-24 flex items-center justify-center text-muted-foreground p-4">
                                <p>Nenhum produto adicionado recentemente.</p>
                            </div>
                        )}
                         <div className="text-center p-2 border-t">
                            <Link href="/lojista/produtos" className={cn(buttonVariants({variant: 'link', size: 'sm'}))}>
                                Ver Todos os Produtos
                            </Link>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sales-overview" className="bg-card rounded-lg border shadow-sm">
                    <AccordionTrigger className="p-4">
                        <div className="flex items-center gap-2 font-semibold">
                            <BarChart className="h-5 w-5" />
                            <span>Visão Geral das Vendas</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 pt-0">
                        <div className="h-40 flex items-center justify-center text-muted-foreground">
                            (Gráfico de vendas em breve)
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </>
    );
}
