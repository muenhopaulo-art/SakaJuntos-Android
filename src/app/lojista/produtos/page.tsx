

'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Package, Loader2, DollarSign, Calendar, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { AddProductDialog } from './add-product-dialog';
import { ProductActions } from './product-actions';
import Image from 'next/image';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
    lojistaId: data.lojistaId,
    category: data.category,
    productType: data.productType || 'product',
    stock: data.stock,
    isPromoted: data.isPromoted,
    promotionPaymentId: data.promotionPaymentId,
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
        // Remove orderby from query to avoid composite index requirement
        const productsQuery = query(collection(db, 'products'), where('lojistaId', '==', user.uid));
        
        const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
            let updatedProducts = snapshot.docs.map(convertDocToProduct);
            // Sort products on the client-side
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
        <>
            <div className="flex justify-between items-center mb-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Gestão de Produtos</h1>
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
              <>
                 {/* Mobile View - List of Cards */}
                 <div className="md:hidden space-y-4">
                        {products.length > 0 ? (
                            products.map(product => (
                                <Card key={product.id}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-4">
                                                <div className="relative h-16 w-16 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                                                    {product.imageUrl ? (
                                                        <Image src={product.imageUrl} alt={product.name} width={64} height={64} className="object-cover h-full w-full" />
                                                    ) : (
                                                        <Package className="h-8 w-8 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base line-clamp-2">{product.name}</CardTitle>
                                                    <CardDescription className="capitalize">{product.category}</CardDescription>
                                                </div>
                                            </div>
                                             <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                       <div className="text-destructive w-full">
                                                         <ProductActions productId={product.id} />
                                                       </div>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                         <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> Preço</span>
                                            <span className="font-semibold">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Criado em</span>
                                            <span>{product.createdAt ? format(new Date(product.createdAt), "d MMM, yyyy", { locale: pt }) : 'N/A'}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                             <Card className="text-center h-48 flex items-center justify-center">
                                <CardContent>
                                    <p>Nenhum produto ou serviço encontrado.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>


                {/* Desktop View - Table */}
                <Card className="hidden md:block">
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">Imagem</TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead>Preço</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Promovido</TableHead>
                                    <TableHead className="hidden lg:table-cell">Data de Criação</TableHead>
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
                                            <TableCell>
                                                <Badge variant={product.productType === 'service' ? 'secondary' : 'outline'} className="capitalize">{product.productType}</Badge>
                                            </TableCell>
                                            <TableCell className="capitalize">{product.category}</TableCell>
                                            <TableCell>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price)}</TableCell>
                                            <TableCell>{product.productType === 'service' ? 'N/A' : product.stock}</TableCell>
                                            <TableCell>
                                                <Badge variant={product.isPromoted === 'active' ? 'default' : 'outline'}>
                                                    {product.isPromoted === 'active' ? 'Sim' : 'Não'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">{product.createdAt ? format(new Date(product.createdAt), "d MMM, yyyy", { locale: pt }) : 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <ProductActions productId={product.id} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center h-24">Nenhum produto encontrado.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
              </>
            )}
        </>
    );
}
