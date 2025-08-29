
'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { getLojistaDashboardAnalytics } from './actions';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import type { Order } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Package, CreditCard, Activity, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';


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
            limit(5)
        );

        const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
            const updatedOrders = snapshot.docs.map(convertDocToOrder);
            // Sort client-side
            updatedOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
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
            description: "Total de vendas dos seus produtos."
        },
        {
            title: "Vendas",
            value: analytics?.totalSales,
            icon: CreditCard,
            isCurrency: false,
            description: "Número total de vendas concluidas."
        },
        {
            title: "Produtos Ativos",
            value: analytics?.activeProducts,
            icon: Package,
            isCurrency: false,
            description: "Número total de produtos na sua loja."
        },
        {
            title: "Pedidos Pendentes",
            value: analytics?.pendingOrders,
            icon: Activity,
            isCurrency: false,
            description: "Pedidos que aguardam a sua preparação."
        }
    ];
    
    if (loading || authLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                 <div className="space-y-2 mb-8">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-6 w-1/2" />
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
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="space-y-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard do Lojista</h1>
                <p className="text-muted-foreground">Uma visão geral do desempenho da sua loja.</p>
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-8">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Visão Geral das Vendas</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                         <div className="h-80 flex items-center justify-center text-muted-foreground">
                            (Gráfico de vendas em breve)
                         </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Pedidos Recentes</CardTitle>
                        <CardDescription>
                            Os seus 5 pedidos mais recentes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentOrders.length > 0 ? (
                            <div className="space-y-4">
                                {recentOrders.map(order => (
                                    <div key={order.id} className="flex items-center">
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                Pedido #{order.id.substring(0, 6)}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {order.creatorName} - {order.createdAt ? format(new Date(order.createdAt), "d MMM", { locale: pt }) : ''}
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(order.totalAmount)}</div>
                                    </div>
                                ))}
                                <Link href="/lojista/pedidos" className={cn(buttonVariants({variant: 'outline', size: 'sm'}), "w-full mt-4")}>
                                    Ver Todos os Pedidos
                                </Link>
                            </div>
                        ) : (
                             <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center space-y-2">
                                <Package className="h-10 w-10" />
                                <p className="font-medium">Nenhum pedido recente.</p>
                                <p className="text-sm">Os seus novos pedidos aparecerão aqui.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
          </div>
        </div>
    );
}
