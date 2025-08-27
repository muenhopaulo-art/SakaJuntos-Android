'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getGroupPromotions, approveJoinRequest, removeMember, getProducts, requestToJoinGroup } from '@/services/product-service';
import { sendMessage } from '@/services/chat-service';
import type { GroupPromotion, Product, CartItem, ChatMessage } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, MessagesSquare, ListChecks, MapPin, UserCheck, UserPlus, UserMinus, Loader2, ShoppingCart, Trash2, Plus, Minus, Send, Mic, Square, Play, Pause, X, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { getUser } from '@/services/user-service';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/product-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';


async function getGroupDetails(id: string): Promise<GroupPromotion | undefined> {
  const allPromotions = await getGroupPromotions();
  return allPromotions.find(p => p.id === id);
}

// Moved from chat-service to be a client-side function
function listenToMessages(groupId: string, callback: (messages: ChatMessage[]) => void) {
    const messagesCol = collection(db, 'groupPromotions', groupId, 'messages');
    const q = query(messagesCol, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages: ChatMessage[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            messages.push({
                id: doc.id,
                text: data.text,
                senderId: data.senderId,
                senderName: data.senderName,
                createdAt: (data.createdAt as Timestamp)?.toMillis() || Date.now(),
                audioSrc: data.audioSrc,
            });
        });
        callback(messages);
    }, (error) => {
        console.error("Error listening to messages:", error);
        callback([]);
    });

    return unsubscribe;
}

const formatTime = (seconds: number) => {
  if (isNaN(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};


const AudioPlayer = ({ src, isSender }: { src: string, isSender: boolean }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        // Create an audio element in memory to get duration, but don't attach to DOM
        const audio = new Audio(src);
        audio.addEventListener('loadedmetadata', () => {
            setDuration(audio.duration);
        });
        // assign to ref
        audioRef.current = audio;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0); // Reset on end
        }

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [src]);

    const togglePlayPause = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="flex items-center gap-3 w-full max-w-[250px] sm:max-w-[300px]">
            <Button
                size="icon"
                variant="ghost"
                onClick={togglePlayPause}
                className={cn(
                    "rounded-full h-10 w-10 flex-shrink-0",
                    isSender ? "text-primary-foreground bg-white/30 hover:bg-white/40" : "text-primary bg-primary/20 hover:bg-primary/30"
                )}
            >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
            </Button>
            <div className="w-full space-y-1.5">
                <Progress value={progress} className={cn("h-1.5", isSender ? "bg-white/30" : "bg-muted-foreground/30")} indicatorClassName={isSender ? "bg-primary-foreground" : "bg-primary"}/>
                <div className="text-xs opacity-80 text-right w-full">
                    <span>{isPlaying ? formatTime(currentTime) : formatTime(duration)}</span>
                </div>
            </div>
        </div>
    );
};


export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;
  const router = useRouter();
  const [group, setGroup] = useState<GroupPromotion | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [creatorName, setCreatorName] = useState<string>('Desconhecido');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [user, authLoading] = useAuthState(auth);
  const { toast } = useToast();
  
  const [groupCart, setGroupCart] = useState<CartItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [isChatOpen, setIsChatOpen] = useState(false);


  // Effect to load cart from localStorage
  useEffect(() => {
    if (!groupId) return;
    try {
      const storedCart = localStorage.getItem(`groupCart_${groupId}`);
      if (storedCart) {
        setGroupCart(JSON.parse(storedCart));
      }
    } catch (error) {
        console.error("Failed to load group cart from localStorage", error);
    }
  }, [groupId]);

  // Effect to save cart to localStorage
  useEffect(() => {
    if (!groupId) return;
    try {
        localStorage.setItem(`groupCart_${groupId}`, JSON.stringify(groupCart));
    } catch (error) {
        console.error("Failed to save group cart to localStorage", error);
    }
  }, [groupCart, groupId]);

   // Effect to listen for messages
  useEffect(() => {
    if (!groupId) return;

    const unsubscribe = listenToMessages(groupId, (newMessages) => {
        setMessages(newMessages);
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, [groupId]);


  const fetchGroupData = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const [groupData, productData] = await Promise.all([
        getGroupDetails(groupId),
        getProducts()
      ]);
      
      if (groupData) {
        setGroup(groupData);
        if (groupData.creatorId) {
            const creator = await getUser(groupData.creatorId);
            setCreatorName(creator.name);
        }
      }
      setProducts(productData);

    } catch (error) {
      console.error("Failed to fetch group data:", error);
      toast({ variant: 'destructive', title: 'Erro ao carregar os dados.' });
    } finally {
      setLoading(false);
    }
  }, [groupId, toast]);

  useEffect(() => {
    fetchGroupData();
  }, [fetchGroupData]);

  useEffect(() => {
    // Scroll to the bottom of the chat area when new messages arrive
    if (chatAreaRef.current) {
        chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !group) return;

    setSendingMessage(true);
    const result = await sendMessage(group.id, user.uid, { text: newMessage });

    if (result.success) {
        setNewMessage('');
    } else {
        toast({ variant: 'destructive', title: 'Erro ao enviar mensagem.', description: result.message });
    }
    setSendingMessage(false);
  }

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = event => {
            audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = reader.result as string;
                if(user && group) {
                    setSendingMessage(true);
                    await sendMessage(group.id, user.uid, { audioSrc: base64Audio });
                    setSendingMessage(false);
                }
            };
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        toast({ title: "Gravação iniciada", description: "Clique no botão parar para enviar." });
    } catch (error) {
        console.error("Error accessing microphone:", error);
        toast({ variant: 'destructive', title: "Erro de Microfone", description: "Não foi possível aceder ao microfone. Verifique as permissões." });
    }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          // Stop all media tracks to turn off the recording indicator
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
          toast({ title: "Gravação terminada", description: "A enviar a sua mensagem de voz..." });
      }
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
        <div className='mb-4'>
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
            </Button>
        </div>
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
  
  const ChatContent = () => (
    <div className="flex flex-col h-full">
        <SheetHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6 sm:pb-2">
            <SheetTitle className="flex items-center gap-2"><MessagesSquare/> Chat do Grupo</SheetTitle>
            <SheetDescription>Comunicação em tempo real com os membros do grupo.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto px-4 sm:px-6 py-4">
            <ScrollArea className="flex-1 -mx-4 sm:-mx-6" ref={chatAreaRef}>
                <div className="space-y-4 px-4 sm:px-6">
                    {messages.length > 0 ? messages.map(msg => {
                        const isSender = msg.senderId === user?.uid;
                        return (
                        <div key={msg.id} className={cn("flex items-end gap-2.5", isSender ? "justify-end" : "justify-start")}>
                            {!isSender && (
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                                   {msg.senderName.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                            <div className={cn(
                                "rounded-lg px-3 py-2 max-w-xs sm:max-w-sm md:max-w-md flex flex-col",
                                isSender ? "bg-primary text-primary-foreground" : "bg-muted",
                                { 'items-end': isSender, 'items-start': !isSender }
                                )}>
                                {!isSender && <p className="text-xs font-bold mb-1">{msg.senderName}</p>}
                                
                                {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                                
                                {msg.audioSrc && (
                                    <AudioPlayer src={msg.audioSrc} isSender={isSender} />
                                )}

                                <p className="text-xs opacity-70 mt-1.5 text-right">
                                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: pt })}
                                </p>
                            </div>
                        </div>
                        )
                    }) : (
                        <div className="text-center text-muted-foreground pt-10">
                            <p>Nenhuma mensagem ainda. Seja o primeiro a dizer olá!</p>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
        <div className="px-4 sm:px-6 py-4 border-t bg-background">
             <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex items-center gap-2">
                <Input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escreva uma mensagem..." 
                    disabled={!user || sendingMessage || isRecording}
                    className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim() || sendingMessage || isRecording}>
                    <Send className="h-4 w-4"/>
                </Button>
                 <Button type="button" size="icon" variant={isRecording ? "destructive" : "outline"} onClick={isRecording ? stopRecording : startRecording} disabled={sendingMessage}>
                    {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4"/>}
                </Button>
            </form>
        </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
       <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
        <Button variant="outline" size="icon" onClick={() => router.back()} className="flex-shrink-0">
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Voltar</span>
        </Button>
        <div className="flex-grow">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-headline">{group.name}</h1>
          <p className="text-lg text-muted-foreground">{group.description}</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-muted-foreground mt-2 text-sm">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{group.participants} / {group.target} membros</span>
            </div>
            <div className="flex items-center gap-1">
              <UserCheck className="w-4 h-4" />
              <span>Criado por: {creatorName}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           {/* Products Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ListChecks/> Produtos</CardTitle>
              <CardDescription>Adicione produtos ao carrinho do grupo. A contribuição será dividida por todos os membros.</CardDescription>
            </CardHeader>
            <CardContent>
                {products.length > 0 ? (
                    <ScrollArea className="h-96 w-full pr-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
        </div>

        <div className="lg:col-span-1 space-y-6">
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
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <Image src={item.product.image || "https://picsum.photos/48/48"} alt={item.product.name} width={48} height={48} className="rounded-md object-cover flex-shrink-0" data-ai-hint={item.product.aiHint}/>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm leading-tight truncate">{item.product.name}</p>
                                                <p className="text-xs text-muted-foreground">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(item.product.price)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
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
                            <span className="truncate">{req.name}</span>
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
                            <span className='truncate'>{mem.name} {mem.uid === group.creatorId && '(Criador)'}</span>
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
      
        {/* Chat FAB and Sheet */}
        <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
            <SheetTrigger asChild>
                <Button 
                    size="icon" 
                    className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-accent hover:bg-accent/90 text-accent-foreground"
                    aria-label="Abrir chat"
                >
                    <MessageCircle className="h-7 w-7" />
                </Button>
            </SheetTrigger>
            <SheetContent 
                side="bottom" 
                className="h-[85vh] w-full max-w-3xl mx-auto p-0 rounded-t-2xl border-t-4 border-primary flex flex-col"
            >
                <ChatContent />
            </SheetContent>
        </Sheet>
    </div>
  );
}
