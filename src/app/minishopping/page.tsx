import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ProductCard } from '@/components/product-card';
import { getProducts } from '@/services/product-service';
import { AlertTriangle } from 'lucide-react';
import type { Product } from '@/lib/types';

export default async function MiniShoppingPage() {
  let products: Product[] = [];
  let error: string | null = null;

  try {
    products = await getProducts();
  } catch (e: any) {
    console.error(e);
    error = e.message || "Ocorreu um erro ao buscar os produtos. Verifique se a API do Firestore está habilitada no seu projeto Google Cloud.";
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-4 mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight font-headline">MiniShopping</h1>
        <p className="text-xl text-muted-foreground">
          Encontre tudo o que precisa, à distância de um clique.
        </p>
      </div>
       {error ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao Carregar Produtos</AlertTitle>
          <AlertDescription>
            {error}
            <p className="mt-2">Por favor, tente <a href="/seed" className="underline">popular a base de dados</a> ou verifique a sua conexão. Se o problema persistir, certifique-se que a API do Firestore está habilitada na sua conta Google Cloud.</p>
          </AlertDescription>
        </Alert>
      ) : products.length === 0 ? (
        <div className="text-center">
          <p className="text-muted-foreground">Nenhum produto encontrado. Tente <a href="/seed" className="underline font-semibold">popular a base de dados</a>.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
