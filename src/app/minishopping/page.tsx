

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getProducts } from '@/services/product-service';
import { AlertTriangle, Search } from 'lucide-react';
import type { Product } from '@/lib/types';
import { ProductList } from './product-list';
import { Input } from '@/components/ui/input';

function getErrorMessage(error: any): string {
    if (error && typeof error.message === 'string') {
        if (error.message.includes('not-found')) {
            return "O banco de dados Firestore não foi encontrado. Por favor, crie um no seu projeto Firebase.";
        }
        if (error.message.includes('permission-denied')) {
            return "A API do Firestore não está habilitada. Por favor, habilite-a no seu projeto Google Cloud.";
        }
        return error.message;
    }
    return "Ocorreu um erro desconhecido ao buscar os produtos.";
}

export default async function MiniShoppingPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const searchTerm = typeof searchParams?.q === 'string' ? searchParams.q : undefined;
  
  let allProducts: Product[] = [];
  let error: string | null = null;

  try {
    allProducts = await getProducts();
  } catch (e) {
    console.error(e);
    error = getErrorMessage(e);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8 hidden md:block">
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
            <p className="mt-2">Por favor, tente novamente ou verifique a sua conexão. Se o problema persistir, certifique-se que a base de dados existe e que a API do Firestore está habilitada na sua conta Google Cloud.</p>
          </AlertDescription>
        </Alert>
      ) : (
        <ProductList allProducts={allProducts} initialSearchTerm={searchTerm} />
      )}
    </div>
  );
}
