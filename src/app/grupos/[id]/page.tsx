'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getGroupPromotions, approveJoinRequest, removeMember } from '@/services/product-service';
import type { GroupPromotion } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessagesSquare, ListChecks, MapPin, UserCheck, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getUser } from '@/services/user-service';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

async function getGroupDetails(id: string): Promise<GroupPromotion | undefined> {
  const allPromotions = await getGroupPromotions();
  return allPromotions.find(p => p.id === id);
}

export default function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  const [group, setGroup] = useState<GroupPromotion | null>(null);
  const [creatorName, setCreatorName] = useState<string>('Desconhecido');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [user, authLoading] = useAuthState(auth);
  const { toast } = useToast();

  const fetchGroupData = useCallback(async () => {
    try {
      const groupData = await getGroupDetails(params.id);
      if (groupData) {
        setGroup(groupData);
        const creator = await getUser(groupData.creatorId);
        setCreatorName(creator.name);
      }
    } catch (error) {
      console.error("Failed to fetch group data:", error);
      toast({ variant: 'destructive', title: 'Erro ao carregar o grupo.' });
    } finally {
      setLoading(false);
    }
  }, [params.id, toast]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  const handleAction = async (userId: string, action: 'approve' | 'remove') => {
    if (!group) return;

    setActionLoading(prev => ({ ...prev, [userId]: true }));

    let result;
    if (action === 'approve') {
      result = await approveJoinRequest(group.id, userId);
    } else {
      const isCreator = userId === group.creatorId;
      result = await removeMember(group.id, userId, isCreator);
    }

    if (result.success) {
      toast({ title: 'Sucesso!', description: `Ação executada com sucesso.` });
      await fetchGroupData(); // Re-fetch data to update the UI
    } else {
      toast({ variant: 'destructive', title: 'Erro!', description: result.message });
    }

    setActionLoading(prev => ({ ...prev, [userId]: false }));
  };


  if (loading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
         <div className="space-y-4 mb-8">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
        </div>
        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
            <div className="md:col-span-1 space-y-6">
                <Skeleton className="h-80 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Grupo não encontrado</h1>
        <p>O grupo que está a tentar aceder não existe ou foi removido.</p>
      </div>
    );
  }

  const isCreator = user?.uid === group.creatorId;
  const members = group.members || [];
  const joinRequests = group.joinRequests || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-4 mb-8">
        <h1 className="text-4xl font-bold tracking-tight font-headline">{group.name}</h1>
        <p className="text-xl text-muted-foreground">{group.description}</p>
        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="w-5 h-5" />
            <span>{group.participants} / {group.target} membros</span>
          </div>
          <div className="flex items-center gap-1">
            <UserCheck className="w-5 h-5" />
            <span>Criado por: {creatorName}</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Chat Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessagesSquare/> Chat do Grupo</CardTitle>
              <CardDescription>Comunicação em tempo real com os membros do grupo.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">(Funcionalidade de chat de texto e áudio a ser implementada)</p>
              </div>
            </CardContent>
          </Card>

          {/* Contributions Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ListChecks/> Contribuições e Produtos</CardTitle>
              <CardDescription>Veja os produtos e as contribuições de cada membro.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="h-40 bg-muted rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">(Divisão automática de contribuições a ser implementada)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
          {/* Members Management Section */}
          {isCreator && (
             <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users/> Gestão de Membros</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Join Requests */}
                  {joinRequests.length > 0 && (
                     <div>
                        <h4 className="font-semibold mb-2">Pedidos de Adesão ({joinRequests.length})</h4>
                        <div className="space-y-2">
                        {joinRequests.map(req => (
                            <div key={req.uid} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                            <span>{req.name}</span>
                             {actionLoading[req.uid] ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                <div className="flex gap-1">
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleAction(req.uid, 'approve')}><UserPlus/></Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleAction(req.uid, 'remove')}><UserMinus/></Button>
                                </div>
                             )}
                            </div>
                        ))}
                        </div>
                    </div>
                  )}
                 
                  {joinRequests.length > 0 && members.length > 0 && <Separator/>}

                   {/* Current Members */}
                  {members.length > 0 && (
                     <div>
                        <h4 className="font-semibold mb-2">Membros Atuais ({members.length})</h4>
                        <div className="space-y-2">
                        {members.map(mem => (
                            <div key={mem.uid} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                            <span>{mem.name} {mem.uid === group.creatorId && '(Criador)'}</span>
                             {actionLoading[mem.uid] ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                <>
                                {mem.uid !== group.creatorId && <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleAction(mem.uid, 'remove')}><UserMinus/></Button>}
                                </>
                             )}
                            </div>
                        ))}
                        </div>
                    </div>
                  )}

                  {members.length === 0 && joinRequests.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center">Nenhum membro ou pedido de adesão.</p>
                  )}
                </CardContent>
            </Card>
          )}

           {/* Location Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MapPin/> Localização</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">Após a contribuição, a sua localização será solicitada para a entrega.</p>
              <Button variant="outline" className="w-full" disabled>Definir Localização</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
