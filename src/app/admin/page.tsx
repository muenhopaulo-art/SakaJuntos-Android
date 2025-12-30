
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Package, Users, Hourglass, UserPlus, AlertTriangle } from 'lucide-react';
import { getDashboardAnalytics } from './actions';
import type { User } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';


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
    
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [recentUsers, setRecentUsers] = useState<User[]>([]);
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

      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(5));
      const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
        const users: User[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                uid: doc.id,
                name: data.name,
                phone: data.phone,
                email: data.email,
                role: data.role,
                createdAt: data.createdAt?.toMillis() || Date.now(),
                online: data.online,
            }
        });
        setRecentUsers(users);
      }, (err) => {
        console.error("Error listening for recent users:", err);
        setError("Não foi possível carregar os utilizadores em tempo real.");
      });

      return () => unsubscribe();
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
                        <CardTitle>Status de Utilizador</CardTitle>
                        <CardDescription>
                            Acompanhe os novos utilizadores a aderir à plataforma em tempo real.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentUsers.length > 0 ? (
                             <div className="space-y-4">
                                {recentUsers.map(user => (
                                    <div key={user.uid} className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{user.name}</p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                         <Badge variant="secondary" className="bg-blue-500/10 text-blue-700">
                                            {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true, locale: pt })}
                                         </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center space-y-2">
                                <UserPlus className="h-10 w-10" />
                                <p className="font-medium">Nenhum utilizador recente.</p>
                                <p className="text-sm">Novos utilizadores aparecerão aqui.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
