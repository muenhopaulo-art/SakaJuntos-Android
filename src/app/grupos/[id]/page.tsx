
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { removeMember, requestToJoinGroup, deleteGroup, updateGroupCart, contributeToGroup, getProducts } from '@/services/product-service';
import { approveJoinRequest } from './actions';
import { sendMessage } from '@/services/chat-service';
import type { GroupPromotion, Product, CartItem, ChatMessage, Geolocation, Contribution } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Users, MessagesSquare, ListChecks, MapPin, UserCheck, UserPlus, UserMinus, Loader2, ShoppingCart, Trash2, Plus, Minus, Send, Mic, Square, Play, Pause, X, MessageCircle, ShieldAlert, Trash, CheckCircle, XCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { getUser } from '@/services/user-service';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/product-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { collection, query, orderBy, onSnapshot, Timestamp, doc, getDocs, getDoc, DocumentData } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose, SheetDescription } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Helper function to convert Firestore data to a plain object
const convertDocToProduct = (doc: DocumentData): Product => {
  const data = doc.data();
  const product: Product = {
    id: doc.id,
    name: data.name,
    description: data.description,
    price: data.price,
    aiHint: data.aiHint,
  };

  if (data.createdAt && data.createdAt instanceof Timestamp) {
    product.createdAt = data.createdAt.toMillis();
  }

  return product;
}

async function getSubCollection<T extends {uid?: string, id?: string}>(groupId: string, subCollectionName: string): Promise<T[]> {
    const subCollectionRef = collection(db, 'groupPromotions', groupId, subCollectionName);
    const snapshot = await getDocs(subCollectionRef);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        // Create a plain object
        const plainData: any = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const value = data[key];
                if (value instanceof Timestamp) {
                    plainData[key] = value.toMillis();
                } else {
                    plainData[key] = value;
                }
            }
        }
        plainData.id = doc.id;
        plainData.uid = doc.id;
        return plainData as T;
    });
}


async function convertDocToGroupPromotion(id: string, data: DocumentData): Promise<GroupPromotion> {
    if (!data) {
        throw new Error("Document data not found for ID: " + id);
    }

    const [members, joinRequests, groupCart, contributions] = await Promise.all([
        getSubCollection<GroupMember>(id, 'members'),
        getSubCollection<JoinRequest>(id, 'joinRequests'),
        getSubCollection<CartItem>(id, 'groupCart'),
        getSubCollection<Contribution>(id, 'contributions')
    ]);

    const promotion: GroupPromotion = {
        id: id,
        name: data.name,
        description: data.description,
        price: data.price,
        aiHint: data.aiHint,
        participants: data.participants,
        target: data.target,
        creatorId: data.creatorId,
        members,
        joinRequests,
        groupCart,
        contributions
    };

    if (data.createdAt && data.createdAt instanceof Timestamp) {
        promotion.createdAt = data.createdAt.toMillis();
    }

    return promotion;
}


// Real-time listeners
function listenToGroup(groupId: string, callback: (group: GroupPromotion) => void) {
    const groupRef = doc(db, 'groupPromotions', groupId);
    return onSnapshot(groupRef, async (docSnap) => {
        if (docSnap.exists()) {
            const groupData = await convertDocToGroupPromotion(docSnap.id, docSnap.data());
            callback(groupData);
        }
    });
}

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
        const audio = new Audio(src);
        audio.addEventListener('loadedmetadata', () => {
            if (isFinite(audio.duration)) {
              setDuration(audio.duration);
            }
        });
        audioRef.current = audio;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        }

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.pause();
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [src]);

    const togglePlayPause = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(err => console.error("Error playing audio:", err));
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
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Use a single, unified effect for all real-time listeners
  useEffect(() => {
    if (!groupId) return;

    setLoading(true);
    let initialCreatorFetched = false;

    const groupUnsub = listenToGroup(groupId, async (newGroupData) => {
        setGroup(newGroupData);
        if (newGroupData.creatorId && !initialCreatorFetched) {
            initialCreatorFetched = true;
            try {
                const creator = await getUser(newGroupData.creatorId);
                setCreatorName(creator.name);
            } catch (error) {
                console.error("Error fetching creator name:", error);
                setCreatorName("Desconhecido");
            }
        }
        setLoading(false);
    });

    const messagesUnsub = listenToMessages(groupId, setMessages);

    // Fetch static products data
    getProducts().then(setProducts);

    return () => {
      groupUnsub();
      messagesUnsub();
    };
  }, [groupId]);

  useEffect(() => {
    if (chatAreaRef.current) {
        chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, isChatOpen]);

  const handleAction = async (userId: string, action: 'approve' | 'remove') => {
    if (!group || !user || user.uid !== group.creatorId) {
        toast({ variant: 'destructive', title: 'Ação não permitida.' });
        return;
    }
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
    } else {
      toast({ variant: 'destructive', title: 'Erro!', description: result.message });
    }
    setActionLoading(prev => ({ ...prev, [userId]: false }));
  };

  const handleDeleteGroup = async () => {
    if (!group || !user || user.uid !== group.creatorId) return;
    setActionLoading(prev => ({...prev, delete: true}));
    const result = await deleteGroup(group.id);
     if (result.success) {
      toast({ title: 'Grupo Eliminado', description: 'O grupo foi eliminado com sucesso.' });
      router.push('/grupos');
    } else {
      toast({ variant: 'destructive', title: 'Erro!', description: result.message });
    }
     setActionLoading(prev => ({...prev, delete: false}));
  };

  const handleUpdateGroupCart = async (product: Product, change: 'add' | 'remove' | 'update', newQuantity?: number) => {
    if (!group || !user || user.uid !== group.creatorId) {
        toast({variant: "destructive", title: "Apenas o criador do grupo pode modificar o carrinho."});
        return;
    }
    // We create a plain product object to avoid passing complex objects (like Timestamps) to server actions
    const plainProduct: Product = {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        aiHint: product.aiHint,
    };
    await updateGroupCart(group.id, plainProduct, change, newQuantity);
    if(change === 'add') {
         toast({
          title: "Adicionado ao Grupo!",
          description: `${product.name} foi adicionado ao carrinho do grupo.`,
        });
    }
  };

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
        mediaRecorderRef.current.ondataavailable = event => audioChunksRef.current.push(event.data);
        mediaRecorderRef.current.onstop = async () => {
            if (audioChunksRef.current.length === 0) return;
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
        setRecordingTime(0);
        recordingIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        toast({ title: "Gravação iniciada", description: "Clique no botão parar para enviar." });
    } catch (error) {
        console.error("Error accessing microphone:", error);
        toast({ variant: 'destructive', title: "Erro de Microfone", description: "Não foi possível aceder ao microfone. Verifique as permissões." });
    }
  };

  const stopRecording = (send: boolean) => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          if (!send) audioChunksRef.current = [];
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
          if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
          setRecordingTime(0);
          if (send) toast({ title: "Gravação terminada", description: "A enviar a sua mensagem de voz..." });
          else toast({ title: "Gravação cancelada" });
      }
  };

  const handleContribution = () => {
    if (!user || !group) return;
    toast({ title: "A obter localização...", description: "Por favor, autorize o acesso à sua localização." });
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const location: Geolocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
            toast({ title: "Localização obtida!", description: "A registar a sua contribuição..." });
            try {
                const result = await contributeToGroup(group.id, user.uid, location);
                if (result.success) {
                    toast({ title: "Contribuição Registada!", description: "Obrigado por contribuir." });
                    if (result.orderFinalized) {
                         toast({ title: "GRUPO COMPLETO!", description: "Todas as contribuições foram feitas. O pedido foi enviado ao administrador." });
                    }
                } else {
                   throw new Error(result.message);
                }
            } catch (error) {
                 toast({ variant: "destructive", title: "Erro ao Contribuir", description: error instanceof Error ? error.message : "Ocorreu um erro." });
            }
        },
        (error) => {
            console.error("Geolocation error:", error);
            toast({ variant: "destructive", title: "Erro de Localização", description: "Não foi possível obter a sua localização." });
        },
        { enableHighAccuracy: true }
    );
  };

  if (loading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
         <div className="space-y-4 mb-8">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-8 w-1/2" />
         </div>
        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
                <Card>
                    <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
                    <CardContent><Skeleton className="h-6 w-1/2" /></CardContent>
                </Card>
                <Card>
                    <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-1 space-y-6">
                 <Card>
                    <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-12 w-full" />
                    </CardFooter>
                 </Card>
            </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className='mb-4'>
            <Button variant="ghost" onClick={() => router.back()}><ArrowLeft/> Voltar</Button>
        </div>
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Acesso Restrito</CardTitle>
            </CardHeader>
            <CardContent>
                <p>O grupo que está a tentar aceder não foi encontrado ou foi eliminado.</p>
            </CardContent>
        </Card>
      </div>
    )
  }
  
  const groupCart = group.groupCart || [];
  const contributions = group.contributions || [];
  const hasContributed = user ? contributions.some(c => c.userId === user.uid) : false;
  const groupCartTotal = groupCart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const totalMembers = group.members.length > 0 ? group.members.length : 1;
  const contributionPerMember = groupCartTotal > 0 ? groupCartTotal / totalMembers : 0;
  
    const ChatContent = () => (
        <SheetContent className="flex flex-col p-0">
            <SheetHeader className="p-4 border-b">
                <SheetTitle>Chat do Grupo</SheetTitle>
                <SheetDescription>Comunicação em tempo real com os membros do grupo.</SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-1" ref={chatAreaRef}>
                <div className="p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-10">
                            <MessageCircle className="mx-auto h-12 w-12" />
                            <p>Seja o primeiro a dizer olá!</p>
                        </div>
                    ) : (
                        messages.map(msg => (
                            <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === user?.uid ? 'justify-end' : 'justify-start')}>
                                <div className={cn("max-w-xs md:max-w-md rounded-lg p-3", msg.senderId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                    <p className="font-semibold text-xs mb-1">{msg.senderName}</p>
                                    {msg.audioSrc ? (
                                        <AudioPlayer src={msg.audioSrc} isSender={msg.senderId === user?.uid} />
                                    ) : (
                                        <p className="whitespace-pre-wrap">{msg.text}</p>
                                    )}
                                    <p className="text-xs opacity-70 mt-1 text-right">{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: pt })}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
            {isRecording && (
                <div className="p-4 border-t flex items-center justify-between bg-destructive/10">
                    <div className="flex items-center gap-2 text-destructive">
                        <Mic className="animate-pulse" />
                        <span>A gravar... ({formatTime(recordingTime)})</span>
                    </div>
                    <div className='flex gap-2'>
                         <Button variant="destructive" size="icon" onClick={() => stopRecording(false)}><X/></Button>
                        <Button variant="ghost" size="icon" onClick={() => stopRecording(true)}><Send/></Button>
                    </div>
                </div>
            )}
            <div className="p-4 border-t bg-background">
                <div className="flex items-center gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escreva uma mensagem..."
                        className="flex-1"
                        disabled={sendingMessage || isRecording}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    />
                     <Button size="icon" variant="ghost" onClick={isRecording ? () => stopRecording(true) : startRecording} disabled={sendingMessage}>
                        {isRecording ? <Square className="text-destructive" /> : <Mic />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={handleSendMessage} disabled={sendingMessage || isRecording}>
                        {sendingMessage ? <Loader2 className="animate-spin" /> : <Send />}
                    </Button>
                </div>
            </div>
        </SheetContent>
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4"><ArrowLeft/> Voltar </Button>
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-3xl font-headline">{group.name}</CardTitle>
                            <CardDescription>{group.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                             <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" /> {group.participants} / {group.target} membros
                            </div>
                            <span>Criado por: {creatorName}</span>
                        </CardContent>
                    </Card>

                    <Card>
                         <CardHeader>
                            <CardTitle>Produtos para o Grupo</CardTitle>
                            <CardDescription>O criador do grupo seleciona os produtos. As contribuições são divididas por todos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {products.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {products.map(product => (
                                        <ProductCard 
                                            key={product.id} 
                                            product={product} 
                                            onAddToCart={user?.uid === group.creatorId ? (p) => handleUpdateGroupCart(p, 'add') : undefined}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p>Nenhum produto disponível.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-1 space-y-6">
                    <Card>
                         <CardHeader>
                            <CardTitle>Carrinho e Contribuições</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             {groupCart.length > 0 ? (
                                <ScrollArea className="h-[200px] pr-4">
                                    <div className="space-y-4">
                                    {groupCart.map(item => (
                                        <div key={item.product.id} className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center">
                                                    <Package className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{item.product.name}</p>
                                                    <p className="text-xs text-muted-foreground">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(item.product.price)}</p>
                                                </div>
                                            </div>
                                            {user?.uid === group.creatorId ? (
                                                <div className="flex items-center gap-1">
                                                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleUpdateGroupCart(item.product, 'update', item.quantity - 1)}><Minus className="h-3 w-3"/></Button>
                                                    <span className="w-4 text-center text-sm">{item.quantity}</span>
                                                    <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleUpdateGroupCart(item.product, 'update', item.quantity + 1)}><Plus className="h-3 w-3"/></Button>
                                                </div>
                                            ) : (
                                                 <p className="text-sm">x{item.quantity}</p>
                                            )}
                                        </div>
                                    ))}
                                    </div>
                                </ScrollArea>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">O carrinho do grupo está vazio.</p>
                            )}
                             <Separator/>
                            <div className="space-y-2">
                                <div className="flex justify-between font-semibold">
                                    <span>Total do Carrinho:</span>
                                    <span>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(groupCartTotal)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Valor por membro:</span>
                                    <span>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(contributionPerMember)}</span>
                                </div>
                            </div>
                            <Separator/>
                             <div>
                                <h4 className="font-semibold mb-2 text-sm">Progresso das Contribuições ({contributions.length}/{totalMembers})</h4>
                                <Progress value={(contributions.length / totalMembers) * 100} />
                                <div className="mt-2 space-y-1 text-xs">
                                     {group.members.map(member => {
                                        const hasPaid = contributions.some(c => c.userId === member.uid);
                                        return (
                                            <div key={member.uid} className="flex justify-between items-center">
                                                <span className={cn(hasPaid && "line-through text-muted-foreground")}>{member.name}</span>
                                                {hasPaid ? <CheckCircle className="h-4 w-4 text-green-500"/> : <XCircle className="h-4 w-4 text-muted-foreground/50"/>}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </CardContent>
                        {groupCartTotal > 0 && (
                            <CardFooter>
                                <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button className="w-full" disabled={hasContributed}>
                                        {hasContributed ? 'Já Contribuiu' : 'Contribuir'}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar Contribuição</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        <div>
                                            A sua localização será solicitada para a entrega. Tem a certeza que deseja contribuir com <span className="font-bold">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(contributionPerMember)}</span>?
                                            <div className="text-xs text-muted-foreground mt-2">(Nota: Isto é uma simulação. Nenhum pagamento real será processado.)</div>
                                        </div>
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleContribution}>Confirmar</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                                </AlertDialog>
                            </CardFooter>
                        )}
                    </Card>

                    {user?.uid === group.creatorId && (
                         <Card>
                            <CardHeader>
                                <CardTitle>Gestão de Membros</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {group.joinRequests.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-sm">Pedidos de Adesão ({group.joinRequests.length})</h4>
                                        {group.joinRequests.map(req => (
                                            <div key={req.uid} className="flex justify-between items-center">
                                                <span>{req.name}</span>
                                                {actionLoading[req.uid] ? <Loader2 className="animate-spin" /> : (
                                                    <div className="flex gap-2">
                                                        <Button size="sm" variant="ghost" className="text-green-600" onClick={() => handleAction(req.uid, 'approve')}><UserCheck/></Button>
                                                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleAction(req.uid, 'remove')}><UserMinus/></Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {group.joinRequests.length > 0 && group.members.length > 0 && <Separator className="my-4"/>}

                                {group.members.length > 0 && (
                                     <div className="space-y-2">
                                        <h4 className="font-semibold text-sm">Membros Atuais ({group.members.length})</h4>
                                        {group.members.map(mem => (
                                            <div key={mem.uid} className="flex justify-between items-center">
                                                <span>{mem.name} {mem.uid === group.creatorId && '(Criador)'}</span>
                                                {actionLoading[mem.uid] ? <Loader2 className="animate-spin"/> : (<>{mem.uid !== group.creatorId && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleAction(mem.uid, 'remove')}><UserMinus/></Button>}</>)}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {group.members.length === 0 && group.joinRequests.length === 0 && (<p className="text-sm text-muted-foreground">Nenhum membro ou pedido de adesão.</p>)}
                            </CardContent>
                            <CardFooter>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="w-full" disabled={actionLoading['delete']}>
                                            {actionLoading['delete'] ? <Loader2 className="animate-spin"/> : <Trash2/>}
                                            Eliminar Grupo
                                        </Button>
                                    </AlertDialogTrigger>
                                     <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação não pode ser desfeita. Isto irá eliminar permanentemente o grupo, incluindo todos os dados.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteGroup} >Eliminar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardFooter>
                        </Card>
                    )}
                </div>
            </div>

            <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
                <SheetTrigger asChild>
                    <Button className="fixed bottom-4 right-4 rounded-full h-16 w-16 shadow-lg z-20">
                        <MessagesSquare/>
                    </Button>
                </SheetTrigger>
                <ChatContent />
            </Sheet>
        </div>
    );
}

    
