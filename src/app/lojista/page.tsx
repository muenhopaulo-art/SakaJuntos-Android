
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Package, CreditCard, Activity } from 'lucide-react';


export default async function LojistaPage() {

    const analyticsCards = [
        {
            title: "Receita Total",
            value: 0,
            icon: DollarSign,
            description: "Total de vendas dos seus produtos."
        },
        {
            title: "Vendas",
            value: 0,
            icon: CreditCard,
            isCurrency: false,
            description: "Número total de vendas concluidas."
        },
        {
            title: "Produtos Ativos",
            value: 0,
            icon: Package,
            isCurrency: false,
            description: "Número total de produtos na sua loja."
        },
        {
            title: "Pedidos Pendentes",
            value: 0,
            icon: Activity,
            isCurrency: false,
            description: "Pedidos que aguardam a sua preparação."
        }
    ];

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
                        <div className="h-80 flex items-center justify-center text-muted-foreground">
                            (Lista de pedidos recentes em breve)
                        </div>
                    </CardContent>
                </Card>
          </div>
        </div>
    );
}
