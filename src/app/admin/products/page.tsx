

import { getProducts } from '@/services/product-service';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Package } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { AddProductDialog } from './add-product-dialog';
import { ProductActions } from './product-actions';
import Image from 'next/image';

function getErrorMessage(error: any): string {
    if (error && typeof error.message === 'string') {
        return error.message;
    }
    return "Ocorreu um erro desconhecido ao buscar os produtos.";
}

export default async function AdminProductsPage() {
    let products: Product[] = [];
    let error: string | null = null;

    try {
        products = await getProducts();
    } catch (e) {
        console.error(e);
        error = getErrorMessage(e);
    }
    
    // Sort products by creation date, most recent first
    products.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Gestão de Produtos</h1>
                    <p className="text-muted-foreground">Adicione, edite e remova produtos da plataforma.</p>
                </div>
                <AddProductDialog />
            </div>

             {error ? (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao Carregar Produtos</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
             ) : (
                <Card>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16">Imagem</TableHead>
                                    <TableHead>Nome do Produto</TableHead>
                                    <TableHead>Descrição</TableHead>
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
                                                    {product.imageUrls && product.imageUrls[0] ? (
                                                        <Image src={product.imageUrls[0]} alt={product.name} width={48} height={48} className="object-cover h-full w-full" />
                                                    ) : (
                                                        <Package className="h-6 w-6 text-muted-foreground" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{product.description}</TableCell>
                                            <TableCell>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price)}</TableCell>
                                            <TableCell>{product.createdAt ? format(new Date(product.createdAt), "d MMM, yyyy", { locale: pt }) : 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <ProductActions productId={product.id} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">Nenhum produto encontrado.</TableCell>
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
