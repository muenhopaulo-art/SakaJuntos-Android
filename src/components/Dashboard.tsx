
'use client';
import type { User } from '@/services/user-service';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface DashboardProps {
    user: User;
    onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the unified seller/client dashboard
        router.replace('/lojista');
    }, [router]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Bem-vindo, {user.name}!</CardTitle>
                <CardDescription>A redirecionar para o seu painel...</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p>O seu painel de utilizador e vendedor está a carregar.</p>
                <Button onClick={onLogout} variant="destructive">Terminar Sessão</Button>
            </CardContent>
        </Card>
    );
}
