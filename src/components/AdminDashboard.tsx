'use client';
import type { User } from '@/services/user-service';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface AdminDashboardProps {
    user: User;
    onLogout: () => void;
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Painel de Administrador</CardTitle>
                <CardDescription>Bem-vindo, {user.name}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p>Aqui você pode gerir utilizadores, produtos e promoções.</p>
                <Button onClick={onLogout} variant="destructive">Terminar Sessão</Button>
            </CardContent>
        </Card>
    );
}
