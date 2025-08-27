'use client';

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { PromotionCard } from '@/components/promotion-card';
import type { GroupPromotion } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CirclePlus, Users, Globe, Info } from 'lucide-react';
import { CreateGroupForm } from '@/components/create-group-form';
import { Skeleton } from '@/components/ui/skeleton';

interface HomePageClientProps {
    allPromotions: GroupPromotion[];
    error: string | null;
}

export function HomePageClient({ allPromotions, error }: HomePageClientProps) {
  const [myGroups, setMyGroups] = useState<GroupPromotion[]>([]);
  const [exploreGroups, setExploreGroups] = useState<GroupPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [user] = useAuthState(auth);

  useEffect(() => {
    if (user) {
      const userGroups = allPromotions.filter(p => p.creatorId === user.uid);
      const otherGroups = allPromotions.filter(p => p.creatorId !== user.uid);
      setMyGroups(userGroups);
      setExploreGroups(otherGroups);
    } else {
      setMyGroups([]);
      setExploreGroups(allPromotions);
    }
    setLoading(false);
  }, [user, allPromotions]);

  return (
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
            ) : error ? (
                <div className="text-center py-10 text-destructive">{error}</div>
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
  );
}
