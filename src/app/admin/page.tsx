

import { getDashboardAnalytics } from './actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, DollarSign, Package, Users, Hourglass } from 'lucide-react';


function getErrorMessage(error: any): string {
    if (error && typeof error.message === 'string') {
        return error.message;
    }
    return "Ocorreu um erro desconhecido ao buscar os dados.";
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

            {/* Placeholder for future charts */}
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
                        <CardTitle>Vendas Recentes</CardTitle>
                        <CardDescription>
                            As 5 vendas mais recentes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-80 flex items-center justify-center text-muted-foreground">
                            (Lista de vendas recentes em breve)
                        </div>
                    </CardContent>
                </Card>
          </div>
        </div>
    );
}
