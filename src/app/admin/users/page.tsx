
import { getUsers } from '../actions';
import type { User, VerificationStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { UserActions } from './user-actions';

function getErrorMessage(error: any): string {
    if (error && typeof error.message === 'string') {
        return error.message;
    }
    return "Ocorreu um erro desconhecido ao buscar os utilizadores.";
}

const roleTranslations: Record<User['role'], string> = {
    admin: 'Admin',
    lojista: 'Lojista',
    client: 'Cliente',
    entregador: 'Entregador'
}

const statusVariant: Record<VerificationStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    approved: 'default',
    pending: 'secondary',
    rejected: 'destructive',
    none: 'outline'
}

const statusTranslations: Record<VerificationStatus, string> = {
    approved: 'Aprovado',
    pending: 'Pendente',
    rejected: 'Rejeitado',
    none: 'N/A'
}

export default async function AdminUsersPage() {
    let users: User[] = [];
    let error: string | null = null;

    try {
        users = await getUsers();
    } catch (e) {
        console.error(e);
        error = getErrorMessage(e);
    }

    const usersWithPendingRequests = users.filter(u => u.verificationStatus === 'pending');
    const otherUsers = users.filter(u => u.verificationStatus !== 'pending');


    return (
        <div className="container mx-auto px-4 py-8">
            <div className="space-y-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Gestão de Utilizadores</h1>
                <p className="text-muted-foreground">Monitorize e gira os utilizadores e os seus pedidos de verificação.</p>
            </div>

             {error ? (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao Carregar Utilizadores</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
             ) : (
                <div className="space-y-8">
                    {usersWithPendingRequests.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Pedidos de Verificação Pendentes</CardTitle>
                                <CardDescription>Estes utilizadores solicitaram tornar-se lojistas e aguardam aprovação.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <UsersTable users={usersWithPendingRequests} />
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                         <CardHeader>
                            <CardTitle>Todos os Utilizadores</CardTitle>
                            <CardDescription>Lista completa de todos os utilizadores registados na plataforma.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UsersTable users={otherUsers} />
                        </CardContent>
                    </Card>
                </div>
             )}
        </div>
    );
}


function UsersTable({ users }: { users: User[] }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telemóvel</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Estado da Verificação</TableHead>
                    <TableHead>Data de Registo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.length > 0 ? (
                    users.map(user => (
                        <TableRow key={user.uid}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.phone}</TableCell>
                            <TableCell>
                                <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>{roleTranslations[user.role]}</Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant={statusVariant[user.verificationStatus ?? 'none']}>
                                    {statusTranslations[user.verificationStatus ?? 'none']}
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
    )
}
