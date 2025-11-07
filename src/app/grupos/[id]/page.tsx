

'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { removeMember, requestToJoinGroup, deleteGroup, updateGroupCart, contributeToGroup, getProducts, addMember, queryUserByPhone } from '@/services/product-service';
import { sendMessage } from '@/services/chat-service';
import type { GroupPromotion, Product, CartItem, ChatMessage, Geolocation, Contribution, GroupMember, JoinRequest, User } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Users, MessagesSquare, ListChecks, UserCheck, UserPlus, UserMinus, Loader2, ShoppingCart, Trash2, Plus, Minus, Send, Mic, Square, Play, Pause, X, MessageCircle, ShieldAlert, Trash, CheckCircle, XCircle, Package, Search, ListFilter, MapPin as MapIcon, Hourglass, Home } from 'lucide-react';
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
import { collection, query, orderBy, onSnapshot, Timestamp, doc, getDocs, getDoc, DocumentData, DocumentSnapshot } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose, SheetDescription } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { finalizeGroupOrder } from './actions';
import { approveJoinRequest } from '@/services/product-service';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const SHIPPING_COST_PER_MEMBER = 1000;
const provinces = [ "Bengo", "Benguela", "Bié", "Cabinda", "Quando Cubango", "Cuanza Norte", "Cuanza Sul", "Cunene", "Huambo", "Huíla", "Luanda", "Lunda Norte", "Lunda Sul", "Malanje", "Moxico", "Namibe", "Uíge", "Zaire"];

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


const ChatDialogContent = ({ groupId, user }: { groupId: string; user: User | null }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    if (!groupId) return;
    const unsubscribe = onSnapshot(query(collection(db, 'groupPromotions', groupId, 'messages'), orderBy('createdAt', 'asc')), (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    if (chatAreaRef.current) {
        chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !groupId) return;
    setSendingMessage(true);
    const result = await sendMessage(groupId, user.uid, { text: newMessage });
    if (result.success) {
        setNewMessage('');
    } else {
        toast({ variant: 'destructive', title: 'Erro ao enviar mensagem.', description: result.message });
    }
    setSendingMessage(false);
  };
  
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
                if(user && groupId) {
                    setSendingMessage(true);
                    await sendMessage(groupId, user.uid, { audioSrc: base64Audio });
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

  return (
    <>
      <DialogHeader className="p-4 border-b">
        <DialogTitle>Chat do Grupo</DialogTitle>
        <DialogDescription>Comunicação em tempo real com os membros do grupo.</DialogDescription>
      </DialogHeader>
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatAreaRef}>
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
                 <p className="text-xs opacity-70 mt-1 text-right">{msg.createdAt ? formatDistanceToNow(new Date((msg.createdAt as any).seconds * 1000), { addSuffix: true, locale: pt }) : 'agora'}</p>
              </div>
            </div>
          ))
        )}
      </div>
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
    </>
  );
};

function ContributionDialog({ contributionPerMember, onConfirm, open, onOpenChange }: {
    contributionPerMember: number;
    onConfirm: (address: string, location: Geolocation | null) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [isContributing, setIsContributing] = useState(false);
    const [address, setAddress] = useState('');
    const [location, setLocation] = useState<Geolocation | null>(null);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);
    const { toast } = useToast();

    const handleGetLocation = () => {
        setIsFetchingLocation(true);
        setLocation(null);
        setAddress('');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newLocation = { latitude, longitude };
                setLocation(newLocation);
                setAddress(`Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`);
                toast({ title: 'Localização Obtida!', description: 'O seu endereço foi preenchido com as suas coordenadas.' });
                setIsFetchingLocation(false);
            },
            (error) => {
                console.error("Geolocation error:", error);
                toast({ variant: 'destructive', title: 'Erro de Localização', description: 'Não foi possível obter a sua localização. Verifique as permissões do navegador.' });
                setIsFetchingLocation(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleConfirm = async () => {
        if (!address.trim()) {
            toast({ variant: 'destructive', title: 'Endereço Inválido', description: 'Por favor, insira um endereço de entrega válido.' });
            return;
        }
        setIsContributing(true);
        await onConfirm(address, location);
        setIsContributing(false);
        onOpenChange(false); // Close dialog on success
    };

    useEffect(() => {
      // Reset state when dialog is closed
      if (!open) {
        setAddress('');
        setLocation(null);
        setIsContributing(false);
        setIsFetchingLocation(false);
      }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmar Contribuição e Entrega</DialogTitle>
                    <DialogDescription>
                        A sua parte é de <span className="font-bold text-foreground">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(contributionPerMember)}</span>.
                        Por favor, insira a morada para receber a sua parte da encomenda.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="relative">
                        <Label htmlFor="address" className="sr-only">Endereço</Label>
                        <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            id="address" 
                            value={address} 
                            onChange={(e) => {
                                setAddress(e.target.value);
                                setLocation(null); // Clear location if user types manually
                            }} 
                            className="pl-10"
                            placeholder="Ex: Rua da Liberdade, Bairro Azul"
                            disabled={isFetchingLocation || isContributing}
                        />
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Ou
                            </span>
                        </div>
                    </div>
                    <Button variant="outline" onClick={handleGetLocation} disabled={isFetchingLocation || isContributing}>
                        {isFetchingLocation ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <MapIcon className="mr-2 h-4 w-4" />
                        )}
                        Usar minha localização exata
                    </Button>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isContributing}>Cancelar</Button>
                    <Button onClick={handleConfirm} disabled={isContributing || !address.trim()}>
                        {isContributing && <Loader2 className="animate-spin mr-2" />}
                        Confirmar Contribuição
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.id as string;
  const router = useRouter();
  const [group, setGroup] = useState<GroupPromotion | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [groupCart, setGroupCart] = useState<CartItem[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [lojistas, setLojistas] = useState<{[key: string]: User}>({});
  const [creatorName, setCreatorName] = useState<string>('Desconhecido');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [user, authLoading] = useAuthState(auth);
  const [appUser, setAppUser] = useState<User | null>(null);
  const { toast } = useToast();
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isContributionDialogOpen, setIsContributionDialogOpen] = useState(false);
  
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  
  const [isFinalizing, setIsFinalizing] = useState(false);
  
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);

  useEffect(() => {
    if (user) {
        getUser(user.uid).then(setAppUser);
    }
  }, [user]);


  // Real-time listeners for all group data
  useEffect(() => {
    if (!groupId) return;
    
    setLoading(true);
    let initialCreatorFetched = false;

    const unsubscribers: (() => void)[] = [];

    // Main group document
    const groupRef = doc(db, 'groupPromotions', groupId);
    const groupUnsub = onSnapshot(groupRef, async (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const groupData = { id: docSnap.id, ...data } as GroupPromotion;
            setGroup(groupData);
            
            if (data.creatorId && !initialCreatorFetched) {
                initialCreatorFetched = true;
                const creator = await getUser(data.creatorId);
                setCreatorName(creator?.name || "Desconhecido");
            }
        } else {
            setGroup(null);
        }
        setLoading(false);
    }, (err) => {
        console.error("Error listening to group document:", err);
        setGroup(null);
        setLoading(false);
    });
    unsubscribers.push(groupUnsub);

    // Subcollections
    const subcollections = ['members', 'joinRequests', 'groupCart', 'contributions'];
    const setters:any = {
        members: setMembers,
        joinRequests: setJoinRequests,
        groupCart: setGroupCart,
        contributions: setContributions,
    };

    subcollections.forEach(name => {
        const subColRef = collection(db, 'groupPromotions', groupId, name);
        const subUnsub = onSnapshot(query(subColRef), (snapshot) => {
            const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setters[name](items);
        }, (err) => {
            console.error(`Error listening to ${name} subcollection:`, err);
        });
        unsubscribers.push(subUnsub);
    });

    // Fetch static products data and lojista data
    const fetchProductsAndLojistas = async () => {
        try {
            const fetchedProducts = await getProducts();
            setProducts(fetchedProducts);

            const lojistaIds = [...new Set(fetchedProducts.map(p => p.lojistaId).filter(Boolean))];
            
            if (lojistaIds.length > 0) {
                const lojistaPromises = lojistaIds.map(id => getUser(id!));
                const lojistaResults = await Promise.all(lojistaPromises);
                
                const lojistaMap: {[key: string]: User} = {};
                lojistaResults.forEach(lojista => {
                    if (lojista) {
                        lojistaMap[lojista.uid] = lojista;
                    }
                });
                setLojistas(lojistaMap);
            }
        } catch (e) {
            console.error("Failed to fetch products or lojistas", e);
            toast({variant: 'destructive', title: "Erro ao carregar produtos"});
        }
    }

    fetchProductsAndLojistas();

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [groupId, toast]);


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
  
  const handleOpenAddMemberDialog = () => {
    setSearchPhone('');
    setFoundUser(null);
    setSearchError(null);
    setIsAddMemberDialogOpen(true);
  };
  
  const handleSearchUser = async () => {
    if (!searchPhone.trim()) {
        setSearchError('Por favor, insira um número de telefone.');
        return;
    }
    setIsSearchingUser(true);
    setFoundUser(null);
    setSearchError(null);

    try {
        const result = await queryUserByPhone(searchPhone);
        if (result.error) {
            setSearchError(result.error);
        } else if (result.user) {
            setFoundUser(result.user as User);
        } else {
            setSearchError('Nenhum utilizador encontrado com este número.');
        }
    } catch (e: any) {
        setSearchError('Ocorreu um erro no servidor. Tente novamente mais tarde.');
    } finally {
        setIsSearchingUser(false);
    }
  }

  const handleAddMember = async () => {
    if (!foundUser || !group) return;
    setIsAddingMember(true);
    try {
        const result = await addMember(group.id, foundUser.uid, foundUser.name);
        if (result.success) {
            toast({ title: 'Sucesso!', description: `${foundUser.name} foi adicionado ao grupo.` });
            setIsAddMemberDialogOpen(false);
        } else {
            throw new Error(result.message);
        }
    } catch (error: any) {
        setSearchError(error.message); // Show error inside the dialog
        toast({ variant: 'destructive', title: 'Erro ao Adicionar', description: error.message });
    } finally {
        setIsAddingMember(false);
    }
  }


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
    if (!group || !user || !members.some(m => m.id === user.uid)) {
        toast({variant: "destructive", title: "Apenas membros do grupo podem modificar o carrinho."});
        return;
    }
     if (group.status !== 'active') {
        toast({variant: "destructive", title: "Ação não permitida", description: "Este grupo já foi finalizado e não pode ser modificado."});
        return;
    }
    
    await updateGroupCart(groupId, product, change, newQuantity);
    
    if(change === 'add') {
         toast({
          title: "Adicionado ao Grupo!",
          description: `${product.name} foi adicionado ao carrinho do grupo.`,
        });
    }
  };

  const handleFinalizeOrder = async () => {
    if (!group || !user || user.uid !== group.creatorId) return;

    setIsFinalizing(true);
    try {
        const result = await finalizeGroupOrder(group.id, user.uid);
        if (result.success) {
            toast({
                title: "Pedido Finalizado!",
                description: "O pedido foi enviado ao administrador e o carrinho foi limpo.",
            });
            // The sheet will close and the cart will be empty due to real-time updates.
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erro ao Finalizar",
            description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido.",
        });
    } finally {
        setIsFinalizing(false);
    }
  };

  const handleContribution = async (address: string, location: Geolocation | null) => {
    if (!user || !group || !members.some(m => m.id === user.uid)) {
        toast({ variant: "destructive", title: "Ação não permitida", description: "Apenas membros podem contribuir." });
        return;
    }

    try {
        const result = await contributeToGroup(groupId, user.uid, address, location);
        if (result.success) {
            toast({ title: "Contribuição Registada!", description: "Obrigado por contribuir. A sua morada de entrega foi guardada." });
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        toast({ variant: "destructive", title: "Erro ao Contribuir", description: error instanceof Error ? error.message : "Ocorreu um erro." });
    }
  };

  const productCategories = useMemo(() => [...new Set(products.map(p => p.category))], [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
        const lojista = p.lojistaId ? lojistas[p.lojistaId] : null;
        const matchesSearch = productSearch ? p.name.toLowerCase().includes(productSearch.toLowerCase()) : true;
        const matchesCategory = selectedCategories.length > 0 ? selectedCategories.includes(p.category) : true;
        const matchesProvince = selectedProvinces.length > 0 ? (lojista && lojista.province && selectedProvinces.includes(lojista.province)) : true;
        return matchesSearch && matchesCategory && matchesProvince;
    });
  }, [products, productSearch, selectedCategories, selectedProvinces, lojistas]);
  
  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev => 
        prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleProvinceChange = (province: string) => {
    setSelectedProvinces(prev => 
        prev.includes(province) 
        ? prev.filter(p => p !== province)
        : [...prev, province]
    );
  };

  const isMember = user ? members.some(m => m.id === user.uid) : false;

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
        <Button variant="ghost" onClick={() => router.back()} className="absolute top-4 left-4"><ArrowLeft/> Voltar</Button>
        <Card className="max-w-md mx-auto mt-20">
            <CardHeader>
                <CardTitle>Grupo Não Encontrado</CardTitle>
            </CardHeader>
            <CardContent>
                <p>O grupo que está a tentar aceder não foi encontrado ou foi eliminado.</p>
            </CardContent>
        </Card>
      </div>
    )
  }
  
  const hasContributed = user ? contributions.some(c => c.id === user.uid) : false;
  const allMembersContributed = members.length > 0 && contributions.length === members.length;
  const groupCartTotal = groupCart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const totalMembers = members.length > 0 ? members.length : 1;
  const productsValuePerMember = groupCartTotal > 0 ? groupCartTotal / totalMembers : 0;
  const contributionPerMember = productsValuePerMember + SHIPPING_COST_PER_MEMBER;
  const isGroupFinalized = group.status === 'finalized';
  
    return (
        <div className="container mx-auto px-4 py-8">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4"><ArrowLeft/> Voltar </Button>
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                    <Card>
                         {isGroupFinalized && (
                            <div className="p-4 bg-yellow-100 border-b border-yellow-200 text-yellow-800 rounded-t-lg">
                                <div className="flex items-center gap-3">
                                    <Hourglass />
                                    <div>
                                        <h4 className="font-bold">Este grupo foi finalizado.</h4>
                                        <p className="text-sm">O pedido está a ser processado. Não é possível fazer mais alterações.</p>
                                    </div>
                                </div>
                            </div>
                        )}
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
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <CardTitle>Produtos para o Grupo</CardTitle>
                                    <CardDescription>{isGroupFinalized ? 'Estes foram os produtos selecionados.' : 'Adicionem produtos para a compra em grupo.'}</CardDescription>
                                </div>
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button variant="outline" className="relative w-full sm:w-auto">
                                            <ShoppingCart className="mr-2 h-4 w-4" />
                                            Ver Carrinho ({groupCart.reduce((acc, item) => acc + item.quantity, 0)})
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent className="flex flex-col">
                                        <SheetHeader>
                                            <SheetTitle>Carrinho do Grupo</SheetTitle>
                                        </SheetHeader>
                                        <div className="flex-1 flex flex-col">
                                            {groupCart.length > 0 ? (
                                            <>
                                                <ScrollArea className="flex-1 my-4">
                                                    <div className="space-y-4 pr-6">
                                                        {groupCart.map(item => (
                                                            <div key={item.product.id} className="flex justify-between items-center gap-2">
                                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                    <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                                                                        <Package className="h-6 w-6 text-muted-foreground" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-medium text-sm truncate">{item.product.name}</p>
                                                                        <p className="text-xs text-muted-foreground">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(item.product.price)}</p>
                                                                    </div>
                                                                </div>
                                                                {(isMember) && !isGroupFinalized ? (
                                                                    <div className="flex items-center gap-1">
                                                                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleUpdateGroupCart(item.product, 'update', item.quantity - 1)}><Minus className="h-3 w-3"/></Button>
                                                                        <span className="w-4 text-center text-sm">{item.quantity}</span>
                                                                        <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleUpdateGroupCart(item.product, 'update', item.quantity + 1)}><Plus className="h-3 w-3"/></Button>
                                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleUpdateGroupCart(item.product, 'remove')}><Trash2 className="h-4 w-4"/></Button>
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-sm font-medium">x{item.quantity}</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                                <div className="border-t pt-4 mt-auto space-y-4">
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between font-semibold">
                                                            <span>Total dos Produtos:</span>
                                                            <span>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(groupCartTotal)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-muted-foreground">
                                                            <span>Valor por membro (c/ entrega):</span>
                                                            <span>{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(contributionPerMember)}</span>
                                                        </div>
                                                    </div>
                                                    {user?.uid === group.creatorId && !isGroupFinalized && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button className="w-full" disabled={isFinalizing || groupCart.length === 0 || !allMembersContributed}>
                                                                    {isFinalizing ? <Loader2 className="mr-2 animate-spin" /> : null}
                                                                    Finalizar Compra
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Confirmar Finalização?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Esta ação enviará o pedido para o administrador e limpará o carrinho do grupo. Deseja continuar?
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={handleFinalizeOrder}>Confirmar</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
                                                     {isGroupFinalized && (
                                                        <Button className="w-full" disabled>Compra Finalizada</Button>
                                                    )}
                                                </div>
                                            </>
                                            ) : (
                                                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                                                    <ShoppingCart className="w-12 h-12 mb-4" />
                                                    <p>O carrinho do grupo está vazio.</p>
                                                </div>
                                            )}
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </div>
                           {!isGroupFinalized && isMember && (
                             <div className="mt-4 space-y-2">
                                <Input 
                                    placeholder="Pesquisar produtos..."
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    className="h-12"
                                />
                                <div className="flex flex-col sm:flex-row gap-2">
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start">
                                                <ListFilter className="mr-2 h-4 w-4"/> Filtrar por categoria
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-56">
                                            <DropdownMenuLabel>Categorias</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <ScrollArea className="h-48">
                                                {productCategories.map(category => (
                                                    <DropdownMenuItem key={category} onSelect={(e) => e.preventDefault()}>
                                                        <Checkbox 
                                                            id={`cat-${category}`}
                                                            checked={selectedCategories.includes(category)}
                                                            onCheckedChange={() => handleCategoryChange(category)}
                                                            className="mr-2"
                                                        />
                                                        <label htmlFor={`cat-${category}`} className="w-full cursor-pointer">{category}</label>
                                                    </DropdownMenuItem>
                                                ))}
                                            </ScrollArea>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start">
                                                <MapIcon className="mr-2 h-4 w-4"/> Ver produtos por província
                                            </Button>
                                        </DropdownMenuTrigger>
                                         <DropdownMenuContent className="w-56">
                                            <DropdownMenuLabel>Províncias</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <ScrollArea className="h-48">
                                                {provinces.map(province => (
                                                    <DropdownMenuItem key={province} onSelect={(e) => e.preventDefault()}>
                                                        <Checkbox 
                                                            id={`prov-${province}`}
                                                            checked={selectedProvinces.includes(province)}
                                                            onCheckedChange={() => handleProvinceChange(province)}
                                                            className="mr-2"
                                                        />
                                                         <label htmlFor={`prov-${province}`} className="w-full cursor-pointer">{province}</label>
                                                    </DropdownMenuItem>
                                                ))}
                                            </ScrollArea>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                           )}
                        </CardHeader>
                        <CardContent>
                             {isGroupFinalized ? (
                                <div className="h-96 flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/50 rounded-md">
                                    <Package className="w-16 h-16 mb-4" />
                                    <h3 className="text-lg font-semibold">Pedido em Processamento</h3>
                                    <p>Pode acompanhar o estado da sua encomenda no painel principal.</p>
                                </div>
                            ) : (
                                <ScrollArea className="h-96">
                                {filteredProducts.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                                        {filteredProducts.map(product => (
                                            <ProductCard 
                                                key={product.id} 
                                                product={product} 
                                                onAddToCart={(p) => handleUpdateGroupCart(p, 'add')}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground pt-10">Nenhum produto encontrado.</p>
                                )}
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contribuições</CardTitle>
                            <CardDescription>Acompanhe o progresso dos pagamentos.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div>
                                <div className='flex justify-between items-baseline mb-2'>
                                     <h4 className="font-semibold text-sm">Progresso ({contributions.length}/{totalMembers})</h4>
                                     <span className="font-bold text-lg">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(contributionPerMember)} / membro</span>
                                </div>
                                <Progress value={(contributions.length / totalMembers) * 100} />
                                <div className="mt-4 space-y-2 text-sm max-h-40 overflow-y-auto">
                                     {members.map(member => {
                                        const hasPaid = contributions.some(c => c.id === member.id);
                                        return (
                                            <div key={member.id} className="flex justify-between items-center bg-muted/50 p-2 rounded-md">
                                                <span className={cn(hasPaid && "line-through text-muted-foreground")}>{member.name}</span>
                                                {hasPaid ? <CheckCircle className="h-5 w-5 text-green-500"/> : <XCircle className="h-5 w-5 text-muted-foreground/50"/>}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </CardContent>
                        {groupCartTotal > 0 && !isGroupFinalized && (
                            <CardFooter>
                                <Button className="w-full" disabled={hasContributed || !isMember} onClick={() => setIsContributionDialogOpen(true)}>
                                    {hasContributed ? 'Já Contribuiu' : 'Contribuir'}
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                    
                    <ContributionDialog 
                        open={isContributionDialogOpen}
                        onOpenChange={setIsContributionDialogOpen}
                        contributionPerMember={contributionPerMember}
                        onConfirm={handleContribution}
                    />


                    {user?.uid === group.creatorId && (
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Gestão de Membros</CardTitle>
                                 <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
                                      <DialogTrigger asChild>
                                        <Button size="sm" variant="outline" onClick={handleOpenAddMemberDialog} disabled={isGroupFinalized}>
                                            <UserPlus className="mr-2"/>Adicionar
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="sm:max-w-md">
                                          <DialogHeader>
                                              <DialogTitle>Adicionar Membro</DialogTitle>
                                              <DialogDescription>
                                                  Procure por um utilizador pelo número de telefone para adicioná-lo ao grupo.
                                              </DialogDescription>
                                          </DialogHeader>
                                          <div className="py-4 space-y-4">
                                              <div className="flex items-center space-x-2">
                                                  <Input 
                                                      id="phone-search" 
                                                      placeholder="9xx xxx xxx" 
                                                      value={searchPhone} 
                                                      onChange={(e) => setSearchPhone(e.target.value)}
                                                      disabled={isSearchingUser || isAddingMember}
                                                  />
                                                  <Button type="button" onClick={handleSearchUser} disabled={isSearchingUser || isAddingMember}>
                                                      {isSearchingUser ? <Loader2 className="animate-spin"/> : <Search/>}
                                                  </Button>
                                              </div>
                                              {searchError && <p className="text-sm text-destructive">{searchError}</p>}
                                              {foundUser && (
                                                  <div className="p-4 border rounded-md bg-muted/50 space-y-3">
                                                      <p><strong>Nome:</strong> {foundUser.name}</p>
                                                      <p><strong>Telefone:</strong> {foundUser.phone}</p>
                                                      <Button className="w-full" onClick={handleAddMember} disabled={isAddingMember}>
                                                          {isAddingMember ? <Loader2 className="animate-spin"/> : 'Adicionar ao Grupo'}
                                                      </Button>
                                                  </div>
                                              )}
                                          </div>
                                      </DialogContent>
                                  </Dialog>
                            </CardHeader>
                            <CardContent>
                                {joinRequests.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-sm">Pedidos de Adesão ({joinRequests.length})</h4>
                                        {joinRequests.map(req => (
                                            <div key={req.id} className="flex justify-between items-center">
                                                <span>{req.name}</span>
                                                {actionLoading[req.id] ? <Loader2 className="animate-spin" /> : (
                                                    <div className="flex gap-2">
                                                        <Button size="sm" variant="ghost" className="text-green-600" onClick={() => handleAction(req.id, 'approve')} disabled={isGroupFinalized}><UserCheck/></Button>
                                                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleAction(req.id, 'remove')} disabled={isGroupFinalized}><UserMinus/></Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {joinRequests.length > 0 && members.length > 0 && <Separator className="my-4"/>}

                                {members.length > 0 && (
                                     <div className="space-y-2">
                                        <h4 className="font-semibold text-sm">Membros Atuais ({members.length})</h4>
                                        {members.map(mem => (
                                            <div key={mem.id} className="flex justify-between items-center">
                                                <span>{mem.name} {mem.id === group.creatorId && '(Criador)'}</span>
                                                {actionLoading[mem.id] ? <Loader2 className="animate-spin"/> : (<>{mem.id !== group.creatorId && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleAction(mem.id, 'remove')} disabled={isGroupFinalized}><UserMinus/></Button>}</>)}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {members.length === 0 && joinRequests.length === 0 && (<p className="text-sm text-muted-foreground">Nenhum membro ou pedido de adesão.</p>)}
                            </CardContent>
                            <CardFooter>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="w-full" disabled={actionLoading['delete'] || isGroupFinalized}>
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

            {isMember && (
                <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
                    <DialogTrigger asChild>
                        <Button className="fixed bottom-4 right-4 rounded-full h-16 w-16 shadow-lg z-20">
                            <MessagesSquare/>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="p-0 max-w-lg h-[80vh] flex flex-col">
                        <ChatDialogContent groupId={groupId} user={appUser}/>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
