
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/services/user-service';
import { Loader2 } from 'lucide-react';

interface LojistaDashboardProps {
    user: User;
    onLogout: () => void;
}

export function LojistaDashboard({ user, onLogout }: LojistaDashboardProps) {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the new lojista layout
        router.replace('/lojista');
    }, [router]);
    
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">A redirecionar para o painel do lojista...</p>
        </div>
    );
}
