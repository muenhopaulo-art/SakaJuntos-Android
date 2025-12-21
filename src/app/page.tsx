

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getProducts, getGroupPromotions } from '@/services/product-service';
import { AlertTriangle, ShoppingBag, Search } from 'lucide-react';
import type { Product, GroupPromotion, User } from '@/lib/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { HomePageClient } from '@/components/home-page-client';
import { ProductsCarousel } from '@/components/products-carousel';
import { Separator } from '@/components/ui/separator';
import { ProductList } from '@/app/minishopping/product-list';
import { buttonVariants } from '@/components/ui/button';
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
    return "Ocorreu um erro desconhecido ao buscar os dados.";
}

export default async function HomePage() {
  let allProducts: Product[] = [];
  let lojistasMap: Map<string, User> = new Map();
  let groupPromotions: GroupPromotion[] = [];
  let error: string | null = null;

  try {
    const [{ products, lojistas }, promotions] = await Promise.all([
        getProducts(),
        getGroupPromotions()
    ]);
    allProducts = products;
    lojistasMap = lojistas;
    groupPromotions = promotions;
  } catch (e: any) {
    console.error(e);
    error = getErrorMessage(e);
  }

  const hasData = allProducts.length > 0 || groupPromotions.length > 0;
  const promotedProducts = allProducts.filter(p => p.isPromoted === 'active');
  

  return (
    <div className="container mx-auto px-4 py-8">
       <div className="space-y-4 mb-8 text-center md:hidden">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Bem-vindo à SakaJuntos</h1>
        <p className="text-lg text-muted-foreground">
          A sua plataforma para compras individuais e em grupo. Mais perto de si.
        </p>
      </div>

       {error ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro ao Carregar Dados</AlertTitle>
          <AlertDescription>
            {error}
            <p className="mt-2">Por favor, tente novamente ou verifique a sua conexão. Se o problema persistir, certifique-se que a base de dados existe e que a API do Firestore está habilitada na sua conta Google Cloud.</p>
          </AlertDescription>
        </Alert>
       ) : !hasData ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <p className="text-lg font-semibold text-muted-foreground">A sua loja está vazia.</p>
          <p className="text-muted-foreground mt-2">Para começar, adicione alguns produtos e promoções à sua base de dados.</p>
          <Link href="/seed" className={cn(buttonVariants({ variant: 'default', size: 'lg'}), "mt-6")}>
            Popular a Base de Dados
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
            {promotedProducts.length > 0 && (
                 <section>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2 font-headline"><ShoppingBag/> Produtos em Destaque</h2>
                        <Link href="/minishopping" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                            Ver Tudo
                        </Link>
                    </div>
                    <ProductsCarousel products={promotedProducts} lojistasMap={lojistasMap} />
                </section>
            )}

            {promotedProducts.length > 0 && groupPromotions.length > 0 && <Separator/>}

            {groupPromotions.length > 0 && (
                <HomePageClient allPromotions={groupPromotions} error={error} />
            )}

            <Separator/>
            
            <section>
                 <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold tracking-tight font-headline">Explore Mais</h2>
                    <p className="text-xl text-muted-foreground">
                        Encontre tudo o que precisa, à distância de um clique.
                    </p>
                </div>
                <ProductList allProducts={allProducts} lojistasMap={lojistasMap} />
            </section>
        </div>
      )}
    </div>
  );
}
