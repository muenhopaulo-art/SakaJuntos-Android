
'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import type { ServiceRequest, ServiceRequestStatus } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2, Calendar as CalendarIcon, Clock, Phone, User, Home, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

function getErrorMessage(error: any): string {
    if (error && typeof error.message === 'string') {
        return error.message;
    }
    return "Ocorreu um erro desconhecido ao buscar os agendamentos.";
}

const statusColors: Record<ServiceRequestStatus, string> = {
    'pendente': 'bg-yellow-500/20 text-yellow-800',
    'confirmado': 'bg-blue-500/20 text-blue-800',
    'concluído': 'bg-green-500/20 text-green-800',
    'cancelado': 'bg-red-500/20 text-red-800',
};

const convertDocToServiceRequest = (doc: any): ServiceRequest => {
  const data = doc.data();
  return {
    id: doc.id,
    serviceId: data.serviceId,
    serviceName: data.serviceName,
    clientId: data.clientId,
    clientName: data.clientName,
    clientPhone: data.clientPhone,
    lojistaId: data.lojistaId,
    requestedDate: (data.requestedDate as Timestamp)?.toMillis(),
    requestedPeriod: data.requestedPeriod,
    address: data.address,
    notes: data.notes,
    status: data.status,
    createdAt: (data.createdAt as Timestamp)?.toMillis(),
  };
};

function StatusUpdater({ request }: { request: ServiceRequest }) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleUpdate = async (newStatus: ServiceRequestStatus) => {
        setLoading(true);
        try {
            const requestRef = doc(db, 'serviceRequests', request.id);
            await updateDoc(requestRef, { status: newStatus });
            toast({ title: 'Status Atualizado', description: `O agendamento foi marcado como ${newStatus}.` });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro!', description: 'Não foi possível atualizar o status.' });
        } finally {
            setLoading(false);
        }
    };

    if (request.status === 'concluído' || request.status === 'cancelado') {
        return <Badge variant="outline" className={cn("capitalize", statusColors[request.status])}>{request.status}</Badge>;
    }
    
    if (request.status === 'pendente') {
        return (
            <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleUpdate('confirmado')} disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                 <Button size="sm" variant="destructive" onClick={() => handleUpdate('cancelado')} disabled={loading}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )
    }

    if (request.status === 'confirmado') {
         return (
            <Button size="sm" onClick={() => handleUpdate('concluído')} disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                Marcar como Concluído
            </Button>
        )
    }

    return null;
}

export default function LojistaAgendamentosPage() {
    const [user, authLoading] = useAuthState(auth);
    const [requests, setRequests] = useState<ServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading || !user) {
            if (!authLoading) setLoading(false);
            return;
        }

        setLoading(true);
        const requestsQuery = query(collection(db, 'serviceRequests'), where('lojistaId', '==', user.uid), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
            const updatedRequests = snapshot.docs.map(convertDocToServiceRequest);
            setRequests(updatedRequests);
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
             <div className="space-y-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Gestão de Agendamentos</h1>
                <p className="text-muted-foreground">Confirme e gira os seus pedidos de serviço.</p>
            </div>

             {error ? (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao Carregar Agendamentos</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
             ) : (
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Serviço</TableHead>
                                    <TableHead>Data Solicitada</TableHead>
                                    <TableHead>Endereço</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.length > 0 ? (
                                    requests.map(request => (
                                        <TableRow key={request.id}>
                                            <TableCell>
                                                <div className="font-medium">{request.clientName}</div>
                                                <div className="text-sm text-muted-foreground">{request.clientPhone}</div>
                                            </TableCell>
                                            <TableCell>{request.serviceName}</TableCell>
                                            <TableCell>
                                                <div>{format(new Date(request.requestedDate), "d MMM, yyyy", { locale: pt })}</div>
                                                <div className="text-sm text-muted-foreground capitalize">{request.requestedPeriod}</div>
                                            </TableCell>
                                            <TableCell>{request.address}</TableCell>
                                            <TableCell>
                                                 <Badge variant="outline" className={cn("capitalize", statusColors[request.status])}>
                                                    {request.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <StatusUpdater request={request} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">
                                            Nenhum agendamento encontrado.
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
