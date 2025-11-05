
import { getGroupPromotions, getProducts } from '@/services/product-service';
import type { GroupPromotion, Product } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ShoppingBag } from 'lucide-react';
import { HomePageClient } from '@/components/home-page-client';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProductsCarousel } from '@/components/products-carousel';
import { ProductList } from './minishopping/product-list';

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
  let products: Product[] = [];
  let groupPromotions: GroupPromotion[] = [];
  let error: string | null = null;

  try {
    [products, groupPromotions] = await Promise.all([
        getProducts(),
        getGroupPromotions()
    ]);
  } catch (e: any) {
    console.error(e);
    error = getErrorMessage(e);
  }

  const hasData = products.length > 0 || groupPromotions.length > 0;
  // Embaralha a lista de produtos para que o carrossel e a lista de exploração sejam dinâmicos
  const shuffledProducts = products.sort(() => 0.5 - Math.random());

  return (
    <div className="container mx-auto px-4 py-8">
       <div className="space-y-4 mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight font-headline">Bem-vindo à SakaJuntos</h1>
        <p className="text-xl text-muted-foreground">
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
            {/* Secção 1: MiniShopping como Carrossel */}
            {products.length > 0 && (
                 <section>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold flex items-center gap-2 font-headline"><ShoppingBag/> MiniShopping</h2>
                        <Link href="/minishopping" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                            Ver Tudo
                        </Link>
                    </div>
                    <ProductsCarousel products={shuffledProducts} />
                </section>
            )}

            {/* Separador */}
            {products.length > 0 && groupPromotions.length > 0 && <Separator/>}

            {/* Secção 2: Grupos de Compras */}
            {groupPromotions.length > 0 && (
                <HomePageClient allPromotions={groupPromotions} error={error} />
            )}

            {/* Separador */}
            <Separator/>
            
            {/* Secção 3: Explore Mais com Pesquisa e Scroll Infinito */}
            <section>
                 <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold tracking-tight font-headline">Explore Mais</h2>
                    <p className="text-xl text-muted-foreground">
                        Encontre tudo o que precisa, à distância de um clique.
                    </p>
                </div>
                {/* O ProductList já contém a barra de pesquisa e a lógica de scroll infinito */}
                <ProductList initialProducts={shuffledProducts} />
            </section>
        </div>
      )}
    </div>
  );
}
