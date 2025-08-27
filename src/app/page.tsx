'use client';

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getGroupPromotions, getProducts } from '@/services/product-service';
import { ProductCard } from '@/components/product-card';
import { PromotionCard } from '@/components/promotion-card';
import type { GroupPromotion, Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { CirclePlus, Search, Users, Globe, Info } from 'lucide-react';
import Link from 'next/link';
import { CartSheet } from '@/components/cart-sheet';
import { CreateGroupForm } from '@/components/create-group-form';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [groupPromotions, setGroupPromotions] = useState<GroupPromotion[]>([]);
  const [myGroups, setMyGroups] = useState<GroupPromotion[]>([]);
  const [exploreGroups, setExploreGroups] = useState<GroupPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [user] = useAuthState(auth);
  const router = useRouter();


  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [productsData, promotionsData] = await Promise.all([
          getProducts(),
          getGroupPromotions(),
        ]);
        setProducts(productsData);
        setGroupPromotions(promotionsData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (user && groupPromotions.length > 0) {
      const userGroups = groupPromotions.filter(p => p.creatorId === user.uid);
      const otherGroups = groupPromotions.filter(p => p.creatorId !== user.uid);
      setMyGroups(userGroups);
      setExploreGroups(otherGroups);
    } else {
      setMyGroups([]);
      setExploreGroups(groupPromotions);
    }
  }, [user, groupPromotions]);

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

              {loading ? (
                 <Carousel className="w-full">
                    <CarouselContent className="-ml-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/4 pl-4">
                                <div className="p-1 h-full">
                                    <Skeleton className="h-full aspect-square w-full" />
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                 </Carousel>
              ) : products.length > 0 ? (
                 <Carousel
                    opts={{ align: "start", loop: true, watchDrag: false }}
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
        <section>
          <div className="flex flex-col md:flex-row justify-between items-start mb-6">
            <div className='mb-4 md:mb-0'>
              <h2 className="text-3xl font-bold font-headline">Grupos de Compras</h2>
              <p className="text-muted-foreground">Junte-se a outros para poupar em compras em grupo.</p>
            </div>
            <div className="flex items-center gap-2">
                <CreateGroupForm>
                  <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <CirclePlus className="mr-2 h-4 w-4" />
                    Criar Novo Grupo
                  </Button>
                </CreateGroupForm>
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Aderir com ID
              </Button>
            </div>
          </div>

          <Tabs defaultValue="explorar">
            <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex">
              <TabsTrigger value="meus-grupos"><Users className="mr-2"/>Meus Grupos ({myGroups.length})</TabsTrigger>
              <TabsTrigger value="explorar"><Globe className="mr-2"/>Explorar Grupos ({exploreGroups.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="meus-grupos">
              {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-96 w-full" />)}
                  </div>
              ) : myGroups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myGroups.map(promo => (
                        <PromotionCard key={promo.id} promotion={promo} />
                    ))}
                </div>
              ) : (
                 <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                       <Info className="mx-auto h-12 w-12 mb-4" />
                       <h3 className="text-lg font-semibold">Ainda não criou ou aderiu a nenhum grupo.</h3>
                       <p>Explore os grupos disponíveis ou crie o seu para começar a poupar!</p>
                    </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="explorar">
               {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-96 w-full" />)}
                  </div>
              ) : exploreGroups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exploreGroups.map(promo => (
                    <PromotionCard key={promo.id} promotion={promo} />
                  ))}
                </div>
              ) : (
                <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                       <Info className="mx-auto h-12 w-12 mb-4" />
                       <h3 className="text-lg font-semibold">Nenhuma promoção de grupo disponível.</h3>
                       <p>Volte mais tarde ou crie o seu próprio grupo!</p>
                    </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  );
}
