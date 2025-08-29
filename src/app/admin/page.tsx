
import { getDashboardAnalytics } from './actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, DollarSign, Package, Users, Hourglass, Bike } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


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
    let analytics;
    let error: string | null = null;

    try {
        analytics = await getDashboardAnalytics();
    } catch (e) {
        console.error(e);
        error = getErrorMessage(e);
    }

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

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="space-y-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
                <p className="text-muted-foreground">Uma visão geral do desempenho da sua aplicação.</p>
            </div>

             {error ? (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao Carregar Dados</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
             ) : analytics ? (
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
            ) : (
                <p className="text-center text-muted-foreground">A carregar dados do dashboard...</p>
            )}

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
                        <CardTitle className="flex items-center gap-2">
                            <Bike />
                            Entregadores Online
                        </CardTitle>
                        <CardDescription>
                            Entregadores disponíveis para receber pedidos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analytics && analytics.onlineDrivers.length > 0 ? (
                            <div className="space-y-4">
                                {analytics.onlineDrivers.map(driver => (
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
        </div>
    );
}
