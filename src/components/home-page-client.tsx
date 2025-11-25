
'use client';

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { PromotionCard } from '@/components/promotion-card';
import type { GroupPromotion } from '@/lib/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CirclePlus, Users, Globe, Info, Loader2, Check } from 'lucide-react';
import { CreateGroupForm } from '@/components/create-group-form';
import { Skeleton } from '@/components/ui/skeleton';
import { requestToJoinGroup } from '@/services/product-service';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';


const MAX_GROUPS_HOME = 6;

interface HomePageClientProps {
    allPromotions: GroupPromotion[];
    error: string | null;
}

function JoinByIdDialog() {
    const [open, setOpen] = useState(false);
    const [groupId, setGroupId] = useState('');
    const router = useRouter();

    const handleJoin = () => {
        if(groupId.trim()) {
            router.push(`/grupos/${groupId.trim()}`);
            setOpen(false);
        }
    }

    return (
         <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                    <Users className="mr-2 h-4 w-4" />
                    Aderir com ID
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Aderir a um Grupo com ID</DialogTitle>
                    <DialogDescription>
                        Insira o ID do grupo para aceder diretamente à sua página.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Input 
                        placeholder="Insira o ID do grupo"
                        value={groupId}
                        onChange={(e) => setGroupId(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button type="button" onClick={handleJoin} disabled={!groupId.trim()}>Aderir</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function HomePageClient({ allPromotions, error }: HomePageClientProps) {
  const [myGroups, setMyGroups] = useState<GroupPromotion[]>([]);
  const [exploreGroups, setExploreGroups] = useState<GroupPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);
  const [user] = useAuthState(auth);
  const { toast } = useToast();
  
  // State to track which groups the user has requested to join in the current session
  const [requestedGroupIds, setRequestedGroupIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      const userGroups = allPromotions.filter(p => p.members && p.members.some(m => m.id === user.uid));
      const otherGroups = allPromotions.filter(p => !p.members || !p.members.some(m => m.id === user.uid));

      setMyGroups(userGroups);
      setExploreGroups(otherGroups);

      // Initialize requested groups based on existing join requests in the data
      const initialRequested = new Set<string>();
      otherGroups.forEach(group => {
          if (group.joinRequests?.some(req => req.id === user.uid)) {
              initialRequested.add(group.id);
          }
      });
      setRequestedGroupIds(initialRequested);

    } else {
      setMyGroups([]);
      setExploreGroups(allPromotions);
      setRequestedGroupIds(new Set());
    }
    setLoading(false);
  }, [user, allPromotions]);

  const handleJoinRequest = async (groupId: string) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Utilizador não autenticado.'});
        return;
    }
    setJoiningGroupId(groupId);
    const result = await requestToJoinGroup(groupId, user.uid);
    if (result.success) {
        toast({ title: 'Pedido enviado!', description: 'O seu pedido para aderir ao grupo foi enviado.' });
        // Add the group ID to the set of requested groups for instant UI feedback
        setRequestedGroupIds(prev => new Set(prev).add(groupId));
    } else {
        toast({ variant: 'destructive', title: 'Erro ao enviar pedido.', description: result.message });
    }
    setJoiningGroupId(null);
  }
  
  const displayedExploreGroups = exploreGroups.slice(0, MAX_GROUPS_HOME);

  return (
    <section>
        <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
        <div className='flex-grow'>
            <h2 className="text-3xl font-bold font-headline">Grupos de Compras</h2>
            <p className="text-muted-foreground">Junte-se a outros para poupar em compras em grupo.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <CreateGroupForm>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto">
                <CirclePlus className="mr-2 h-4 w-4" />
                Criar Novo Grupo
                </Button>
            </CreateGroupForm>
            <JoinByIdDialog />
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
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayedExploreGroups.map(promo => {
                            const isRequested = requestedGroupIds.has(promo.id);
                            const isJoining = joiningGroupId === promo.id;
                            const isMember = user ? promo.members?.some(m => m.id === user.uid) : false;

                            return (
                                <PromotionCard 
                                    key={promo.id} 
                                    promotion={promo}
                                    showJoinButton={!isMember}
                                    onJoin={handleJoinRequest}
                                    isJoining={isJoining}
                                    isRequested={isRequested}
                                />
                            );
                        })}
                    </div>
                    {exploreGroups.length > MAX_GROUPS_HOME && (
                         <div className="text-center">
                            <Link href="/grupos" className={cn(buttonVariants({ variant: 'default', size: 'lg' }))}>
                                Ver Mais Grupos
                            </Link>
                        </div>
                    )}
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
