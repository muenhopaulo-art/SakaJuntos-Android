
'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { getLojistaDashboardAnalytics } from './actions';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Package, CreditCard, Activity, Bell, ListOrdered, BarChart, ChevronDown, ShoppingBag } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import Link from 'next/link';
import { buttonVariants, Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

function getErrorMessage(error: any): string {
    if (error && typeof error.message === 'string') {
        return error.message;
    }
    return "Ocorreu um erro desconhecido ao buscar os dados.";
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
  };
};

export default function LojistaPage() {
    const [user, authLoading] = useAuthState(auth);
    const [analytics, setAnalytics] = useState<any>(null);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch one-time analytics data
    useEffect(() => {
        if (authLoading || !user) return;
        
        const fetchAnalytics = async () => {
            setLoading(true);
            try {
                const data = await getLojistaDashboardAnalytics(user.uid);
                setAnalytics(data.analytics);
            } catch (e) {
                setError(getErrorMessage(e));
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [user, authLoading]);

    // Listen for real-time updates on recent orders
     useEffect(() => {
        if (!user) {
            setRecentOrders([]);
            return;
        }

        const ordersQuery = query(
            collection(db, 'orders'),
            where('lojistaId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(5)
        );

        const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
            const updatedOrders = snapshot.docs.map(convertDocToOrder);
            setRecentOrders(updatedOrders);
        }, (err) => {
            console.error(err);
            setError("Não foi possível carregar os pedidos recentes em tempo real.");
        });

        // Cleanup subscription on component unmount
        return () => unsubscribe();
    }, [user]);


    const analyticsCards = [
        {
            title: "Receita Total",
            value: analytics?.totalRevenue,
            icon: DollarSign,
            description: "Total de ganhos dos pedidos processados."
        },
        {
            title: "Pedidos Processados",
            value: analytics?.processedOrders,
            icon: Activity,
            isCurrency: false,
            description: "Nº de pedidos em separação ou já entregues."
        },
        {
            title: "Produtos Ativos",
            value: analytics?.activeProducts,
            icon: ShoppingBag,
            isCurrency: false,
            description: "Total de produtos na sua loja."
        },
        {
            title: "Novos Pedidos",
            value: analytics?.newOrders,
            icon: Bell,
            isCurrency: false,
            description: "Pedidos que aguardam a sua preparação."
        }
    ];
    
    if (loading || authLoading) {
        return (
            <>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-5 w-80" />
                    </div>
                    <Skeleton className="h-10 w-48" />
                </div>
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {Array.from({length: 4}).map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                               <Skeleton className="h-5 w-2/3" />
                               <Skeleton className="h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-1/2 mb-2" />
                                <Skeleton className="h-4 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                 </div>
                 <div className="space-y-4">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                 </div>
            </>
        )
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
               <Link href="/lojista/produtos" className={cn(buttonVariants({ variant: 'default' }))}>
                  Adicionar Produto/Serviço
              </Link>
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

            <Accordion type="multiple" defaultValue={['recent-orders']} className="w-full space-y-4">
                <AccordionItem value="recent-orders" className="bg-card rounded-lg border shadow-sm">
                    <AccordionTrigger className="p-4">
                        <div className="flex items-center gap-2 font-semibold">
                            <ListOrdered className="h-5 w-5" />
                            <span>Pedidos Ativos Recentes</span>
                            {analytics?.newOrders > 0 && 
                              <Badge className="ml-2">{analytics.newOrders}</Badge>
                            }
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 pt-0">
                         {recentOrders.length > 0 ? (
                            <div className="space-y-2">
                                {recentOrders.map(order => (
                                    <div key={order.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none font-mono">
                                                Pedido #{order.id.substring(0, 6)}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {order.creatorName} - {order.createdAt ? format(new Date(order.createdAt), "d MMM", { locale: pt }) : ''}
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.totalAmount)}</div>
                                    </div>
                                ))}
                                <div className="text-center pt-2">
                                    <Link href="/lojista/pedidos" className={cn(buttonVariants({variant: 'link', size: 'sm'}))}>
                                        Ver Todos os Pedidos
                                    </Link>
                                </div>
                            </div>
                        ) : (
                             <div className="h-24 flex flex-col items-center justify-center text-muted-foreground text-center space-y-2">
                                <Package className="h-8 w-8" />
                                <p className="font-medium">Nenhum pedido recente.</p>
                            </div>
                        )}
                    </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="recent-products" className="bg-card rounded-lg border shadow-sm">
                    <AccordionTrigger className="p-4">
                        <div className="flex items-center gap-2 font-semibold">
                            <ShoppingBag className="h-5 w-5" />
                            <span>Produtos Recentes</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 pt-0">
                        <div className="h-24 flex items-center justify-center text-muted-foreground">
                            (Listagem de produtos recentes em breve)
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
