
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/services/user-service';
import { Loader2 } from 'lucide-react';


interface AdminDashboardProps {
    user: User;
    onLogout: () => void;
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
    const router = useRouter();

    useEffect(() => {
        // Redirect to the new admin layout
        router.push('/admin');
    }, [router]);
    
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">A redirecionar para o painel do administrador...</p>
        </div>
    );
}
