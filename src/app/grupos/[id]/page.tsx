'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getGroupPromotions, approveJoinRequest, removeMember, getProducts } from '@/services/product-service';
import type { GroupPromotion, Product, CartItem } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessagesSquare, ListChecks, MapPin, UserCheck, UserPlus, UserMinus, Loader2, ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getUser } from '@/services/user-service';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/product-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';


async function getGroupDetails(id: string): Promise<GroupPromotion | undefined> {
  const allPromotions = await getGroupPromotions();
  return allPromotions.find(p => p.id === id);
}

export default function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  const [group, setGroup] = useState<GroupPromotion | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [creatorName, setCreatorName] = useState<string>('Desconhecido');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [user, authLoading] = useAuthState(auth);
  const { toast } = useToast();
  
  const [groupCart, setGroupCart] = useState<CartItem[]>([]);

  const fetchGroupData = useCallback(async () => {
    if (!params.id) return;
    try {
      const [groupData, productData] = await Promise.all([
        getGroupDetails(params.id),
        getProducts()
      ]);
      
      if (groupData) {
        setGroup(groupData);
        const creator = await getUser(groupData.creatorId);
        setCreatorName(creator.name);
      }
      setProducts(productData);

    } catch (error) {
      console.error("Failed to fetch group data:", error);
      toast({ variant: 'destructive', title: 'Erro ao carregar os dados.' });
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

  const handleAddToGroupCart = (product: Product) => {
    setGroupCart(prevCart => {
        const existingItem = prevCart.find(item => item.product.id === product.id);
        if (existingItem) {
            return prevCart.map(item =>
                item.product.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            );
        }
        return [...prevCart, { product, quantity: 1 }];
    });
    toast({
      title: "Adicionado ao Grupo!",
      description: `${product.name} foi adicionado ao carrinho do grupo.`,
    });
  };

  const handleRemoveFromGroupCart = (productId: string) => {
    setGroupCart(prevCart => prevCart.filter(item => item.product.id !== productId));
     toast({
      title: "Removido do Grupo!",
      description: `O produto foi removido do carrinho do grupo.`,
      variant: 'destructive'
    });
  }

  const handleUpdateGroupCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
        handleRemoveFromGroupCart(productId);
        return;
    }
    setGroupCart(prevCart => prevCart.map(item =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
    ));
  }


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
  const totalMembers = members.length > 0 ? members.length : 1;
  const groupCartTotal = groupCart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const contributionPerMember = groupCartTotal > 0 ? groupCartTotal / totalMembers : 0;

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
           {/* Products Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ListChecks/> Produtos</CardTitle>
              <CardDescription>Adicione produtos ao carrinho do grupo. A contribuição será dividida por todos os membros.</CardDescription>
            </CardHeader>
            <CardContent>
                {products.length > 0 ? (
                    <ScrollArea className="h-96 w-full pr-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {products.map(product => (
                                <ProductCard key={product.id} product={product} onAddToCart={handleAddToGroupCart} />
                            ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="h-40 bg-muted rounded-md flex items-center justify-center">
                        <p className="text-muted-foreground">Nenhum produto disponível para contribuição.</p>
                    </div>
                )}
            </CardContent>
          </Card>
          
          {/* Chat Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessagesSquare/> Chat do Grupo</CardTitle>
              <CardDescription>Comunicação em tempo real com os membros do grupo.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-40 bg-muted rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">(Funcionalidade de chat de texto e áudio a ser implementada)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
            {/* Group Cart & Contributions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShoppingCart/> Carrinho do Grupo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {groupCart.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">O carrinho do grupo está vazio.</p>
                    ) : (
                        <ScrollArea className="h-48 pr-3">
                            <div className="space-y-4">
                                {groupCart.map(item => (
                                    <div key={item.product.id} className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <Image src={item.product.image || "https://picsum.photos/48/48"} alt={item.product.name} width={48} height={48} className="rounded-md object-cover" data-ai-hint={item.product.aiHint}/>
                                            <div>
                                                <p className="font-semibold text-sm leading-tight">{item.product.name}</p>
                                                <p className="text-xs text-muted-foreground">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(item.product.price)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleUpdateGroupCartQuantity(item.product.id, item.quantity - 1)}><Minus className="h-3 w-3"/></Button>
                                            <span className="text-sm w-4 text-center">{item.quantity}</span>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleUpdateGroupCartQuantity(item.product.id, item.quantity + 1)}><Plus className="h-3 w-3"/></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveFromGroupCart(item.product.id)}><Trash2 className="h-3 w-3"/></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                    
                    <Separator/>

                    <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(groupCartTotal)}</span>
                    </div>
                     <Separator/>
                    <div className="space-y-2">
                        <h4 className="font-semibold">Divisão da Contribuição</h4>
                        <div className="flex justify-between text-muted-foreground">
                            <span>Membros no grupo:</span>
                            <span>{totalMembers}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-primary">
                            <span>Valor por membro:</span>
                            <span>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(contributionPerMember)}</span>
                        </div>
                    </div>
                    <Button className="w-full" disabled={groupCartTotal === 0}>Contribuir</Button>
                </CardContent>
            </Card>


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
