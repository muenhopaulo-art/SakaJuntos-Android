'use client';
import type { User } from '@/services/user-service';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface LojistaDashboardProps {
    user: User;
    onLogout: () => void;
}

export function LojistaDashboard({ user, onLogout }: LojistaDashboardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Painel do Lojista</CardTitle>
                <CardDescription>Bem-vindo, {user.name}! A sua loja está aprovada.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p>Aqui você pode gerir os seus produtos, ver as suas vendas e muito mais.</p>
                <Button onClick={onLogout} variant="destructive">Terminar Sessão</Button>
            </CardContent>
        </Card>
    );
}
