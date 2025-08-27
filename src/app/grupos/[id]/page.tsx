import { getGroupPromotions } from '@/services/product-service'; // We'll need a way to get a single group
import type { GroupPromotion } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessagesSquare, ListChecks, MapPin, UserCheck, UserPlus, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

async function getGroupDetails(id: string): Promise<GroupPromotion | undefined> {
  // In the future, this should fetch a single document from Firestore for efficiency.
  // For now, we'll fetch all and find the one we need.
  const allPromotions = await getGroupPromotions();
  return allPromotions.find(p => p.id === id);
}

export default async function GroupDetailPage({ params }: { params: { id: string } }) {
  const group = await getGroupDetails(params.id);

  if (!group) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Grupo não encontrado</h1>
        <p>O grupo que está a tentar aceder não existe ou foi removido.</p>
      </div>
    );
  }

  // Placeholder data - this will come from the database later
  const isCreator = true; // Assume the current user is the creator for now
  const members = ['Utilizador 1 (Criador)', 'Utilizador 2', 'Utilizador 3'];
  const joinRequests = ['Utilizador 4', 'Utilizador 5'];


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
            <span>Criado por: Admin Local (futuro nome do criador)</span>
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
                  <div>
                    <h4 className="font-semibold mb-2">Pedidos de Adesão ({joinRequests.length})</h4>
                    <div className="space-y-2">
                      {joinRequests.map(req => (
                        <div key={req} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                          <span>{req}</span>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600"><UserPlus/></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><UserMinus/></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator/>

                   {/* Current Members */}
                  <div>
                    <h4 className="font-semibold mb-2">Membros Atuais ({members.length})</h4>
                     <div className="space-y-2">
                      {members.map(mem => (
                        <div key={mem} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                          <span>{mem}</span>
                           <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><UserMinus/></Button>
                        </div>
                      ))}
                    </div>
                  </div>
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
