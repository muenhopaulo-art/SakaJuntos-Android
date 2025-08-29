
'use client';

import { useState, useEffect } from 'react';
import { getDashboardAnalytics } from './actions';
import type { User } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, DollarSign, Package, Users, Hourglass, Bike, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';


function getErrorMessage(error: any): string {
    if (error && typeof error.message === 'string') {
        return error.message;
    }
    return "Ocorreu um erro desconhecido ao buscar os dados.";
}

const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.substring(0, 2).toUpperCase();
}


export default function AdminPage() {
    const [analytics, setAnalytics] = useState<any>(null);
    const [onlineDrivers, setOnlineDrivers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

     useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const data = await getDashboardAnalytics();
                setAnalytics(data);
            } catch (e) {
                console.error(e);
                setError(getErrorMessage(e));
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();

        // Setup real-time listener for online drivers
        const driversQuery = query(collection(db, 'users'), where('role', '==', 'courier'), where('online', '==', true));
        
        const unsubscribe = onSnapshot(driversQuery, (snapshot) => {
            const drivers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
            setOnlineDrivers(drivers);
        }, (err) => {
            console.error("Error fetching online drivers:", err);
            setError("Não foi possível carregar os entregadores online em tempo real.");
        });

        // Cleanup listener on component unmount
        return () => unsubscribe();
    }, []);

    const analyticsCards = [
        {
            title: "Receita Total",
            value: analytics?.totalRevenue,
            icon: DollarSign,
            description: "Total de vendas de encomendas entregues."
        },
        {
            title: "Vendas Pendentes",
            value: analytics?.pendingSales,
            icon: Hourglass,
            description: "Valor total de encomendas pendentes."
        },
        {
            title: "Total de Pedidos",
            value: analytics?.totalOrders,
            icon: Package,
            isCurrency: false,
            description: "Número total de encomendas recebidas."
        },
        {
            title: "Total de Utilizadores",
            value: analytics?.usersCount,
            icon: Users,
            isCurrency: false,
            description: "Número total de utilizadores registados."
        }
    ];

    if (loading) {
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
                <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
                <p className="text-muted-foreground">Uma visão geral do desempenho da sua aplicação.</p>
            </div>

             {error && !analytics ? ( // Only show full-page error if analytics fail completely
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao Carregar Dados</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
             ) : (
                <>
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
                    <Card className="col-span-4 md:col-span-3">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bike />
                                Entregadores Online
                            </CardTitle>
                            <CardDescription>
                                Entregadores disponíveis para receber pedidos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {onlineDrivers.length > 0 ? (
                                <div className="space-y-4">
                                    {onlineDrivers.map(driver => (
                                        <div key={driver.uid} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarFallback>{getInitials(driver.name)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{driver.name}</p>
                                                    <p className="text-sm text-muted-foreground">{driver.phone}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-green-500">
                                                <span className="relative flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                                </span>
                                                <span className="text-sm font-medium">Online</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground">
                                    <p>Nenhum entregador online no momento.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
              </>
            )}
        </div>
    );
}
