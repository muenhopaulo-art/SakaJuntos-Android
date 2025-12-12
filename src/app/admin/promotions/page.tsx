
'use client';

import { useState, useEffect } from 'react';
import { getPromotionRequests, approvePromotion, rejectPromotion } from './actions';
import type { PromotionPayment } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2, Check, X, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

function getErrorMessage(error: any): string {
    if (error && typeof error.message === 'string') {
        return error.message;
    }
    return "Ocorreu um erro desconhecido ao buscar os pedidos de promoção.";
}

function PromotionActions({ request }: { request: PromotionPayment }) {
    const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
    const { toast } = useToast();

    const handleAction = async (action: 'approve' | 'reject') => {
        setLoading(action);
        const result = action === 'approve' 
            ? await approvePromotion(request.id, request.productId, request.lojistaId)
            : await rejectPromotion(request.id, request.lojistaId, request.productName);
        
        if (result.success) {
            toast({ title: 'Sucesso!', description: `O pedido de promoção foi ${action === 'approve' ? 'aprovado' : 'rejeitado'}.` });
        } else {
            toast({ variant: 'destructive', title: 'Erro!', description: result.message });
        }
        setLoading(null);
    }
    
    if (request.status !== 'pendente') {
        return <Badge variant={request.status === 'aprovado' ? 'default' : 'destructive'} className="capitalize">{request.status}</Badge>
    }

    return (
        <div className="flex gap-2">
            <Button size="icon" variant="outline" className="text-green-600" onClick={() => handleAction('approve')} disabled={!!loading}>
                {loading === 'approve' ? <Loader2 className="animate-spin" /> : <Check />}
            </Button>
            <Button size="icon" variant="destructive" onClick={() => handleAction('reject')} disabled={!!loading}>
                 {loading === 'reject' ? <Loader2 className="animate-spin" /> : <X />}
            </Button>
        </div>
    )
}

export default function AdminPromotionsPage() {
    const [requests, setRequests] = useState<PromotionPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const requestList = await getPromotionRequests();
                setRequests(requestList);
            } catch (e) {
                setError(getErrorMessage(e));
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copiado!", description: "O código de referência foi copiado." });
    };

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
                    <AlertTitle>Erro ao Carregar Pedidos de Promoção</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="space-y-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Gestão de Promoções</h1>
                <p className="text-muted-foreground">Aprove ou rejeite os pedidos de promoção de produtos.</p>
            </div>
             <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Lojista</TableHead>
                                <TableHead>Produto</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Código Ref.</TableHead>
                                <TableHead>Data</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.length > 0 ? (
                                requests.map(req => (
                                    <TableRow key={req.id}>
                                        <TableCell className="font-medium">{req.lojistaName}</TableCell>
                                        <TableCell>{req.productName}</TableCell>
                                        <TableCell>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(req.amount)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 font-mono text-xs">
                                                <span>{req.referenceCode}</span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(req.referenceCode)}>
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell>{req.createdAt ? format(new Date(req.createdAt), "d MMM, yyyy", { locale: pt }) : 'N/A'}</TableCell>
                                        <TableCell className="capitalize">
                                            <Badge variant={req.status === 'aprovado' ? 'default' : req.status === 'rejeitado' ? 'destructive' : 'secondary'}>
                                                {req.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <PromotionActions request={req} />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24">Nenhum pedido de promoção encontrado.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
