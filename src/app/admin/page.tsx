
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Package, Users, Hourglass } from 'lucide-react';

export default function AdminPage() {
    
    const analyticsCards = [
        {
            title: "Receita Total",
            value: "0,00 AOA",
            icon: DollarSign,
            description: "Total de vendas de encomendas entregues."
        },
        {
            title: "Vendas Pendentes",
            value: "0,00 AOA",
            icon: Hourglass,
            description: "Valor total de encomendas pendentes."
        },
        {
            title: "Total de Pedidos",
            value: "0",
            icon: Package,
            description: "Número total de encomendas recebidas."
        },
        {
            title: "Total de Utilizadores",
            value: "0",
            icon: Users,
            description: "Número total de utilizadores registados."
        }
    ];

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
                            <div className="text-2xl font-bold">{card.value}</div>
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
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                            (Lista de entregadores em breve)
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
