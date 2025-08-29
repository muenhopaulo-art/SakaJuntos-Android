
import { getProducts } from '@/services/product-service';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Package } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

function getErrorMessage(error: any): string {
    if (error && typeof error.message === 'string') {
        return error.message;
    }
    return "Ocorreu um erro desconhecido ao buscar os produtos.";
}

export default async function LojistaProductsPage() {
    let products: Product[] = [];
    let error: string | null = null;

    try {
        products = await getProducts();
    } catch (e) {
        console.error(e);
        error = getErrorMessage(e);
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight font-headline">Gestão de Produtos</h1>
                    <p className="text-muted-foreground">Adicione, edite e gira os seus produtos.</p>
                </div>
                <Button>Adicionar Produto</Button>
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
                                                <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center">
                                                    <Package className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price)}</TableCell>
                                            <TableCell>{product.createdAt ? format(new Date(product.createdAt), "d MMM, yyyy", { locale: pt }) : 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm">Editar</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24">Nenhum produto encontrado.</TableCell>
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
