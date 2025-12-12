
'use client';

import { useState, useEffect } from 'react';
import { getUsers } from '../actions';
import type { User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { UserActions } from './user-actions';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function getErrorMessage(error: any): string {
    if (error && typeof error.message === 'string') {
        return error.message;
    }
    return "Ocorreu um erro desconhecido ao buscar os utilizadores.";
}

const roleColors: Record<string, string> = {
    admin: 'bg-red-500/20 text-red-700',
    lojista: 'bg-blue-500/20 text-blue-700',
    client: 'bg-gray-500/20 text-gray-700',
    courier: 'bg-indigo-500/20 text-indigo-700',
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const userList = await getUsers();
                setUsers(userList);
            } catch (e) {
                setError(getErrorMessage(e));
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (error) {
        return (
             <div className="container mx-auto px-4 py-8">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao Carregar Utilizadores</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="space-y-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Gestão de Utilizadores</h1>
                <p className="text-muted-foreground">Monitorize e gira os utilizadores da plataforma.</p>
            </div>
             <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Telefone</TableHead>
                                <TableHead>Função</TableHead>
                                <TableHead>Data de Registo</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.length > 0 ? (
                                users.map(user => (
                                    <TableRow key={user.uid}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.phone}</TableCell>
                                        <TableCell>
                                             <Badge variant="outline" className={cn("capitalize", roleColors[user.role])}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{user.createdAt ? format(new Date(user.createdAt), "d MMM, yyyy", { locale: pt }) : 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <UserActions user={user} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">Nenhum utilizador encontrado.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
