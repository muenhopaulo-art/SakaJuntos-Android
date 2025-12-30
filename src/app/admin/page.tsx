
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Package, Users, UserPlus, AlertTriangle } from 'lucide-react';
import { getDashboardAnalytics } from './actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

function getErrorMessage(error: any): string {
    if (error && typeof error.message === 'string') {
        return error.message;
    }
    return "Ocorreu um erro desconhecido ao buscar os dados.";
}

export default function AdminPage() {
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      const fetchAnalytics = async () => {
        try {
          const data = await getDashboardAnalytics();
          setAnalyticsData(data);
        } catch (e) {
          setError(getErrorMessage(e));
        } finally {
          setLoading(false);
        }
      };

      fetchAnalytics();
    }, []);
    
    const analyticsCards = [
        {
            title: "Receita (Plataforma)",
            value: analyticsData?.platformRevenue,
            isCurrency: true,
            icon: DollarSign,
            description: "Total de ganhos da plataforma."
        },
        {
            title: "Volume Total de Vendas",
            value: analyticsData?.totalRevenue,
            isCurrency: true,
            icon: DollarSign,
            description: "Valor total pago pelos clientes."
        },
        {
            title: "Total de Pedidos",
            value: analyticsData?.totalOrders,
            isCurrency: false,
            icon: Package,
            description: "Número total de encomendas recebidas."
        },
        {
            title: "Total de Utilizadores",
            value: analyticsData?.usersCount,
            isCurrency: false,
            icon: Users,
            description: "Número total de utilizadores registados."
        }
    ];

    if (loading) {
        return (
             <div className="space-y-8">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-6 w-1/2" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
                </div>
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Skeleton className="col-span-4 h-96" />
                    <Skeleton className="col-span-3 h-96" />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao Carregar Dados do Dashboard</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
                <p className="text-muted-foreground">Uma visão geral do desempenho da sua aplicação.</p>
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
                                {card.isCurrency 
                                    ? new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(card.value ?? 0)
                                    : card.value ?? 0
                                }
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
                        <CardDescription>Receita total de encomendas entregues por mês.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-80 flex items-center justify-center text-muted-foreground">
                            (Gráfico de vendas em breve)
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Adesão de Utilizadores</CardTitle>
                        <CardDescription>
                            Novos utilizadores que aderiram à plataforma.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center">
                            <UserPlus className="h-6 w-6 mr-4 text-muted-foreground"/>
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground">Novos em 24h</p>
                                <p className="text-2xl font-bold">{analyticsData?.newUsers24h ?? 0}</p>
                            </div>
                        </div>
                         <div className="flex items-center">
                            <UserPlus className="h-6 w-6 mr-4 text-muted-foreground"/>
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground">Esta Semana</p>
                                <p className="text-2xl font-bold">{analyticsData?.newUsers7d ?? 0}</p>
                            </div>
                        </div>
                         <div className="flex items-center">
                            <UserPlus className="h-6 w-6 mr-4 text-muted-foreground"/>
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground">Este Mês</p>
                                <p className="text-2xl font-bold">{analyticsData?.newUsers30d ?? 0}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
