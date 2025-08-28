'use client';
import type { User } from '@/services/user-service';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

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
                 <div className="flex flex-col sm:flex-row gap-2">
                    <Button asChild>
                        <Link href="/admin">
                            Ir para o Painel <ArrowRight className="ml-2"/>
                        </Link>
                    </Button>
                    <Button onClick={onLogout} variant="outline">Terminar Sessão</Button>
                </div>
            </CardContent>
        </Card>
    );
}
