import { getGroupPromotions, getProducts } from '@/services/product-service';
import { ProductCard } from '@/components/product-card';
import type { GroupPromotion, Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { CartSheet } from '@/components/cart-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { HomePageClient } from '@/components/home-page-client';
import Autoplay from "embla-carousel-autoplay"


export default async function HomePage() {
  let products: Product[] = [];
  let groupPromotions: GroupPromotion[] = [];
  let error: string | null = null;

  try {
    [products, groupPromotions] = await Promise.all([
      getProducts(),
      getGroupPromotions(),
    ]);
  } catch (e: any) {
    console.error("Failed to fetch data:", e);
    error = "Não foi possível carregar os dados. Tente novamente mais tarde.";
  }

  return (
    <div className="bg-muted/40">
      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Mini-Shopping Section */}
        <section>
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start mb-6">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-3xl font-bold font-headline">Mini-Shopping</h2>
                  <p className="text-muted-foreground">Compre produtos individualmente, sem precisar de um grupo.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" asChild>
                    <Link href="/minishopping">
                      <Search className="mr-2 h-4 w-4" />
                      Ver Todos
                    </Link>
                  </Button>
                  <CartSheet />
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-4">Produtos Disponíveis</h3>

              {error ? (
                <div className="text-center py-10 text-destructive">{error}</div>
              ) : products.length > 0 ? (
                 <Carousel
                    opts={{ align: "start", loop: true, watchDrag: false }}
                    plugins={[
                        Autoplay({
                          delay: 4000,
                          stopOnInteraction: false,
                          stopOnMouseEnter: true,
                        }),
                    ]}
                    className="w-full"
                    >
                    <CarouselContent className="-ml-4">
                        {products.map(product => (
                        <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/4 pl-4">
                            <div className="p-1 h-full">
                            <ProductCard product={product} />
                            </div>
                        </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden md:flex" />
                    <CarouselNext className="hidden md:flex" />
                </Carousel>
              ): (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <p className="text-lg font-semibold text-muted-foreground">Nenhum produto encontrado.</p>
                    <p className="text-muted-foreground mt-2">Parece que a base de dados está vazia.</p>
                    <Button asChild className="mt-4">
                    <a href="/seed">Popular a Base de Dados</a>
                    </Button>
              </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Grupos de Compras Section */}
        <HomePageClient allPromotions={groupPromotions} error={error} />
      </div>
    </div>
  );
}
