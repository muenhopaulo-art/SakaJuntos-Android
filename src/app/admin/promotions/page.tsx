
'use client';

import { useState, useEffect, useMemo } from 'react';
import { approvePromotion, rejectPromotion } from './actions';
import type { PromotionPayment } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2, Check, X, Copy, Search } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, getDocs, where } from 'firebase/firestore';

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
        // No need to set loading to null, component will be unmounted or re-rendered
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

function PromotionsTable({ requests }: { requests: PromotionPayment[] }) {
    const { toast } = useToast();
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copiado!", description: "O código de referência foi copiado." });
    };

     if (requests.length === 0) {
        return <div className="text-center h-48 flex items-center justify-center text-muted-foreground">Nenhum pedido encontrado.</div>
    }

    return (
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
                {requests.map(req => (
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
                ))}
            </TableBody>
        </Table>
    )
}

export default function AdminPromotionsPage() {
    const [requests, setRequests] = useState<PromotionPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const paymentsQuery = query(collection(db, 'promotionPayments'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(paymentsQuery, async (snapshot) => {
            try {
                const requestList = await Promise.all(snapshot.docs.map(async (doc) => {
                    const data = doc.data();
                    const lojista = await getDocs(query(collection(db, 'users'), where('uid', '==', data.lojistaId)));
                    const lojistaData = lojista.docs[0]?.data();
                    
                    return {
                        id: doc.id,
                        lojistaId: data.lojistaId,
                        lojistaName: lojistaData?.name || 'Desconhecido',
                        productId: data.productId,
                        productName: data.productName,
                        tier: data.tier,
                        amount: data.amount,
                        referenceCode: data.referenceCode,
                        status: data.status,
                        createdAt: data.createdAt?.toMillis() || Date.now(),
                    } as PromotionPayment;
                }));
                setRequests(requestList);
            } catch (e) {
                 setError(getErrorMessage(e));
            } finally {
                setLoading(false);
            }
        }, (err) => {
            console.error("Error listening to promotion payments:", err);
            setError(getErrorMessage(err));
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredRequests = useMemo(() => {
        if (!searchTerm) return requests;
        return requests.filter(req => req.referenceCode.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [requests, searchTerm]);

    const pendingRequests = useMemo(() => filteredRequests.filter(r => r.status === 'pendente'), [filteredRequests]);
    const historicalRequests = useMemo(() => filteredRequests.filter(r => r.status !== 'pendente'), [filteredRequests]);

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
                <CardHeader>
                   <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Procurar por código de referência..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                   </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Tabs defaultValue="pendentes">
                        <TabsList className="px-6 border-b w-full justify-start rounded-none">
                            <TabsTrigger value="pendentes">Pendentes ({pendingRequests.length})</TabsTrigger>
                            <TabsTrigger value="historico">Histórico ({historicalRequests.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="pendentes" className="mt-0">
                           <PromotionsTable requests={pendingRequests} />
                        </TabsContent>
                        <TabsContent value="historico" className="mt-0">
                            <PromotionsTable requests={historicalRequests} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
