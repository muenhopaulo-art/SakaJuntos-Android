import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getProducts } from '@/services/product-service';
import type { Product } from '@/lib/types';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';


export default async function Home() {
  let products: Product[] = [];
  let error: string | null = null;

  try {
    products = await getProducts();
  } catch (e: any) {
    console.error(e);
    error = e.message || "Ocorreu um erro ao buscar os produtos.";
  }

  return (
    <div className="flex flex-col items-center">
      <section className="w-full py-12 md:py-24 lg:py-32 text-center">
        <div className="container px-4 md:px-6">
          {error ? (
            <Alert variant="destructive" className="text-left">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro ao Carregar Produtos</AlertTitle>
              <AlertDescription>
                {error}
                <p className="mt-2">Por favor, tente novamente ou verifique a sua conexão. Se o problema persistir, certifique-se que a API do Firestore está habilitada na sua conta Google Cloud.</p>
              </AlertDescription>
            </Alert>
          ) : products.length === 0 ? (
             <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-lg font-semibold text-muted-foreground">Nenhum produto encontrado.</p>
                <p className="text-muted-foreground mt-2">Parece que a base de dados está vazia. Que tal adicionar alguns produtos?</p>
                 <a href="/seed" className="inline-block mt-4 px-6 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90">
                  Popular a Base de Dados
                </a>
              </div>
          ) : (
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full max-w-6xl mx-auto"
            >
              <CarouselContent>
                {products.map((product) => (
                  <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1 h-full">
                      <ProductCard product={product} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex" />
              <CarouselNext className="hidden sm:flex" />
            </Carousel>
          )}

        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32 bg-card rounded-lg shadow-md">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
            <Link href="/minishopping" className="group">
              <Card className="h-full transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:-translate-y-2">
                <CardHeader className="flex flex-row items-center gap-4">
                  <ShoppingBag className="w-10 h-10 text-primary" />
                  <div>
                    <CardTitle className="font-headline text-2xl">MiniShopping</CardTitle>
                    <CardDescription>
                      Explore uma variedade de produtos e compre individualmente com toda a conveniência.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <Image
                    src="https://picsum.photos/550/310"
                    data-ai-hint="market stall"
                    alt="MiniShopping"
                    width={550}
                    height={310}
                    className="rounded-lg object-cover w-full aspect-video"
                  />
                </CardContent>
              </Card>
            </Link>
            <Link href="/grupos" className="group">
              <Card className="h-full transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:-translate-y-2">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Users className="w-10 h-10 text-accent-foreground" />
                  <div>
                    <CardTitle className="font-headline text-2xl">Grupos</CardTitle>
                    <CardDescription>
                      Junte-se a outros e aproveite promoções exclusivas em compras coletivas.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <Image
                    src="https://picsum.photos/550/311"
                    data-ai-hint="community people"
                    alt="Grupos"
                    width={550}
                    height={311}
                    className="rounded-lg object-cover w-full aspect-video"
                  />
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
