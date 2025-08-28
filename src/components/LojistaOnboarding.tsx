'use client';
import type { User } from '@/services/user-service';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface LojistaOnboardingProps {
    user: User;
    onLogout: () => void;
}

export function LojistaOnboarding({ user, onLogout }: LojistaOnboardingProps) {
    const getStatusMessage = () => {
        switch (user.verificationStatus) {
            case 'pending':
                return 'O seu pedido para se tornar um lojista está a ser revisto. Entraremos em contacto em breve.';
            case 'rejected':
                return 'Infelizmente, o seu pedido para se tornar um lojista foi rejeitado. Contacte o suporte para mais informações.';
            default:
                return 'Complete o seu registo para começar a vender.';
        }
    }
    return (
        <Card>
            <CardHeader>
                <CardTitle>Pedido de Verificação</CardTitle>
                <CardDescription>Olá, {user.name}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p>{getStatusMessage()}</p>
                <Button onClick={onLogout} variant="destructive">Terminar Sessão</Button>
            </CardContent>
        </Card>
    );
}
