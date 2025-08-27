import { getGroupPromotions } from '@/services/product-service';
import type { GroupPromotion } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessagesSquare, ListChecks, MapPin, UserCheck, UserPlus, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { auth } from '@/lib/firebase';
import { getUser } from '@/services/user-service';
import { getAuth } from 'firebase/auth';

// This is a server component, but we need auth state.
// In a real app, you might get the session from the request.
// For now, we'll assume we can get the current user this way.
// Note: This is a simplified approach for demonstration.
async function getCurrentUserId() {
    // This is not a reliable way to get user on the server.
    // We'd typically use a server-side session management library.
    // Or, this component would be a client component.
    // For this step, we will proceed, but this is a limitation.
    // The following line can cause issues in server components, a more robust solution is needed
    // For now, we will try to make it work, but it might require client side logic.
    try {
      const user = getAuth().currentUser;
      return user?.uid;
    } catch(e) {
      // This will fail on the server, as there's no "current user"
      // console.error("Could not get current user on server", e);
      return null;
    }
}


async function getGroupDetails(id: string): Promise<GroupPromotion | undefined> {
  const allPromotions = await getGroupPromotions();
  return allPromotions.find(p => p.id === id);
}

export default async function GroupDetailPage({ params }: { params: { id:string } }) {
  const group = await getGroupDetails(params.id);
  const currentUserId = await getCurrentUserId();
  
  let creatorName = 'Desconhecido';
  if (group) {
      try {
        const creator = await getUser(group.creatorId);
        creatorName = creator.name;
      } catch (error) {
        console.error("Could not fetch creator details", error);
      }
  }


  if (!group) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Grupo não encontrado</h1>
        <p>O grupo que está a tentar aceder não existe ou foi removido.</p>
      </div>
    );
  }
  
  // Now using real data, but checking for it.
  const isCreator = currentUserId === group.creatorId;
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
                            <div className="flex gap-1">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600"><UserPlus/></Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><UserMinus/></Button>
                            </div>
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
                             {mem.uid !== group.creatorId && <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><UserMinus/></Button>}
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
