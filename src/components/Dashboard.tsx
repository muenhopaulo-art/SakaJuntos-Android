'use client';
import type { User } from '@/services/user-service';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface DashboardProps {
    user: User;
    onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Bem-vindo, {user.name}!</CardTitle>
                <CardDescription>Este é o seu painel de cliente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p>Aqui você poderá ver o histórico de compras, gerir os seus dados e muito mais.</p>
                <p>Navegue para <a href="/minishopping" className="text-primary underline">MiniShopping</a> ou <a href="/grupos" className="text-primary underline">Grupos</a> para começar.</p>
                <Button onClick={onLogout} variant="destructive">Terminar Sessão</Button>
            </CardContent>
        </Card>
    );
}
