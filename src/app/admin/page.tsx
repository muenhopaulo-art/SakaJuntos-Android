
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Package, Users, Hourglass, Bike } from 'lucide-react';
import { getDashboardAnalytics, getOnlineDeliveryDrivers } from './actions';
import type { User } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';


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


export default async function AdminPage() {
    
    let analyticsData;
    let onlineDrivers: User[] = [];
    let error: string | null = null;

    try {
        [analyticsData, onlineDrivers] = await Promise.all([
            getDashboardAnalytics(),
            getOnlineDeliveryDrivers()
        ]);
    } catch (e) {
        error = getErrorMessage(e);
    }
    
    const analyticsCards = [
        {
            title: "Receita Total",
            value: analyticsData?.totalRevenue,
            isCurrency: true,
            icon: DollarSign,
            description: "Total de vendas de encomendas entregues."
        },
        {
            title: "Vendas Pendentes",
            value: analyticsData?.pendingSales,
            isCurrency: true,
            icon: Hourglass,
            description: "Valor total de encomendas pendentes."
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
        <div className="container mx-auto px-4 py-8">
            <div className="space-y-2 mb-8">
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
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-80 flex items-center justify-center text-muted-foreground">
                            (Gráfico de vendas em breve)
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Entregadores Online</CardTitle>
                        <CardDescription>
                            Acompanhe os entregadores disponíveis em tempo real.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {onlineDrivers.length > 0 ? (
                             <div className="space-y-4">
                                {onlineDrivers.map(driver => (
                                    <div key={driver.uid} className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarFallback>{getInitials(driver.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{driver.name}</p>
                                            <p className="text-xs text-muted-foreground">{driver.phone}</p>
                                        </div>
                                         <Badge variant="secondary" className="bg-green-500/20 text-green-700">Online</Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center space-y-2">
                                <Bike className="h-10 w-10" />
                                <p className="font-medium">Nenhum entregador online.</p>
                                <p className="text-sm">Os entregadores online aparecerão aqui.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
