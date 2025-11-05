

'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import type { Product } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Package, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { AddProductDialog } from './add-product-dialog';
import { ProductActions } from './product-actions';
import Image from 'next/image';
import { collection, query, where, onSnapshot } from 'firebase/firestore';


function getErrorMessage(error: any): string {
    if (error && typeof error.message === 'string') {
        return error.message;
    }
    return "Ocorreu um erro desconhecido ao buscar os produtos.";
}

const convertDocToProduct = (doc: any): Product => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    description: data.description,
    price: data.price,
    imageUrl: data.imageUrl,
    aiHint: data.aiHint,
    lojistaId: data.lojistaId,
    productType: data.productType || 'product',
    contactPhone: data.contactPhone,
    createdAt: data.createdAt?.toMillis(),
  };
};

export default function LojistaProductsPage() {
    const [user, authLoading] = useAuthState(auth);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading || !user) {
             if (!authLoading) setLoading(false);
            return;
        }
        
        setLoading(true);
        const productsQuery = query(collection(db, 'products'), where('lojistaId', '==', user.uid));
        
        const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
            const updatedProducts = snapshot.docs.map(convertDocToProduct);
            updatedProducts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            setProducts(updatedProducts);
            setLoading(false);
        }, (err) => {
            console.error(err);
            setError(getErrorMessage(err));
            setLoading(false);
        });

        // Cleanup subscription on component unmount
        return () => unsubscribe();
    }, [user, authLoading]);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Gestão de Produtos e Serviços</h1>
                    <p className="text-muted-foreground">Adicione, edite e gira as suas publicações.</p>
                </div>
                {user && <AddProductDialog lojistaId={user.uid} />}
            </div>

            {error ? (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao Carregar Produtos</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : loading || authLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            ) : (
                <Card>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">Imagem</TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Preço</TableHead>
                                    <TableHead>Data de Criação</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.length > 0 ? (
                                    products.map(product => (
                                        <TableRow key={product.id}>
                                            <TableCell>
                                                <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                                                    {product.imageUrl ? (
                                                        <Image src={product.imageUrl} alt={product.name} width={48} height={48} className="object-cover h-full w-full" />
                                                    ) : (
                                                        <Package className="h-6 w-6 text-muted-foreground" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell className="capitalize">{product.productType === 'product' ? 'Produto' : 'Serviço'}</TableCell>
                                            <TableCell>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price)}</TableCell>
                                            <TableCell>{product.createdAt ? format(new Date(product.createdAt), "d MMM, yyyy", { locale: pt }) : 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <ProductActions productId={product.id} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">Nenhum produto ou serviço encontrado.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
