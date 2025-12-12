
'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2, Bike, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

function getErrorMessage(error: any): string {
    if (error && typeof error.message === 'string') {
        return error.message;
    }
    return "Ocorreu um erro desconhecido ao buscar os entregadores.";
}

const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.substring(0, 2).toUpperCase();
}


export default function LojistaEntregadoresPage() {
    const [user, authLoading] = useAuthState(auth);
    const [couriers, setCouriers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading || !user) {
            if (!authLoading) setLoading(false);
            return;
        }

        setLoading(true);
        const couriersQuery = query(collection(db, 'users'), where('role', '==', 'courier'), where('ownerLojistaId', '==', user.uid));

        const unsubscribe = onSnapshot(couriersQuery, (snapshot) => {
            const updatedCouriers = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    uid: doc.id,
                    name: data.name,
                    phone: data.phone,
                    email: data.email,
                    role: data.role,
                    createdAt: data.createdAt?.toMillis() || Date.now(),
                    online: data.online || false,
                }
            });
            updatedCouriers.sort((a, b) => (b.online ? 1 : -1) - (a.online ? 1 : -1) || a.name.localeCompare(b.name));
            setCouriers(updatedCouriers);
            setLoading(false);
        }, (err) => {
            console.error(err);
            setError(getErrorMessage(err));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, authLoading]);
    
    if (loading || authLoading) {
        return (
             <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <>
             <div className="flex justify-between items-center">
                <div className="space-y-2 mb-8">
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Meus Entregadores</h1>
                    <p className="text-muted-foreground">Gira a sua equipa de entregas.</p>
                </div>
                <Button disabled>
                    <UserPlus className="mr-2"/>
                    Adicionar Entregador
                </Button>
            </div>

             {error ? (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao Carregar Entregadores</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
             ) : (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Telefone</TableHead>
                                    <TableHead>Estado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {couriers.length > 0 ? (
                                    couriers.map(courier => (
                                        <TableRow key={courier.uid}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarFallback>{getInitials(courier.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="font-medium">{courier.name}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{courier.phone}</TableCell>
                                            <TableCell>
                                                <Badge variant={courier.online ? 'default' : 'outline'} className={cn(courier.online && 'bg-green-500/20 text-green-700')}>
                                                    {courier.online ? 'Online' : 'Offline'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-48">
                                            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                                <Bike className="h-10 w-10" />
                                                <p className="font-semibold">Nenhum entregador encontrado.</p>
                                                <p className="text-sm">Adicione um entregador para começar a gerir a sua equipa.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
             )}
        </>
    );
}
