
'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Trophy } from 'lucide-react';
import { addProduct } from './actions';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { PromotionPayment } from '@/lib/types';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getUser } from '@/services/user-service';
import { PaymentInstructionsDialog } from './PaymentInstructionsDialog';

const productSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  description: z.string().min(10, { message: 'A descrição deve ter pelo menos 10 caracteres.' }),
  price: z.coerce.number().min(0, { message: 'O preço deve ser um número positivo.' }),
  images: z.array(z.any()).max(4, { message: 'Pode carregar no máximo 4 imagens.' }).optional(),
  category: z.string().min(2, { message: 'A categoria é obrigatória.'}),
  productType: z.enum(['product', 'service'], { required_error: 'Por favor, selecione o tipo.' }),
  stock: z.coerce.number().min(0, { message: 'O stock deve ser um número positivo.' }),
  isPromoted: z.boolean().default(false),
  promotionTier: z.string().optional(),
}).refine(data => !data.isPromoted || (data.isPromoted && data.promotionTier), {
    message: "Por favor, selecione um plano de destaque.",
    path: ["promotionTier"],
});

const categories = [
    "Alimentação e Bebidas",
    "Casa e Jardim",
    "Eletrónicos",
    "Saúde e Beleza",
    "Serviços",
    "Vestuário e Acessórios",
    "Veículos e Peças",
    "Outros"
];

const promotionTiers: { [key: string]: number } = {
    tier1: 1000,
    tier2: 1500,
    tier3: 2500,
};

export function AddProductDialog({ lojistaId }: { lojistaId: string }) {
  const [isClient, setIsClient] = useState(false);
  const [open, setOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<PromotionPayment | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [user] = useAuthState(auth);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      images: [],
      category: '',
      productType: 'product',
      stock: 0,
      isPromoted: false,
    },
  });

  const { isSubmitting } = form.formState;
  const productType = form.watch('productType');
  const isPromoted = form.watch('isPromoted');
  const images = form.watch('images') || [];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const currentImages = form.getValues('images') || [];
    if (currentImages.length + files.length > 4) {
        form.setError("images", { message: `Pode carregar no máximo 4 imagens.` });
        return;
    }
    
    let validFiles: File[] = [...currentImages];
    let newPreviews: string[] = [...previews];

    for (const file of files) {
        validFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
    }
    
    form.setValue('images', validFiles, { shouldValidate: true });
    setPreviews(newPreviews);
    form.clearErrors("images");
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    const currentImages = form.getValues('images') || [];
    const updatedImages = currentImages.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    form.setValue('images', updatedImages);
    setPreviews(updatedPreviews);
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const storage = getStorage();
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file, { contentType: file.type });
    return getDownloadURL(snapshot.ref);
  };

  const onSubmit = async (values: z.infer<typeof productSchema>) => {
    if (!user) {
        toast({variant: 'destructive', title: 'Erro!', description: 'Utilizador não autenticado.'});
        return;
    }

    try {
        const imageFiles = form.getValues('images') || [];
        let imageUrls: string[] = [];

        if (imageFiles.length > 0) {
            const uploadPromises = imageFiles.map(file => 
                uploadFile(file, `product_images/${lojistaId}/${Date.now()}_${file.name}`)
            );
            imageUrls = await Promise.all(uploadPromises);
        }

        const productData = {
            name: values.name,
            description: values.description,
            price: values.price,
            category: values.category,
            productType: values.productType,
            stock: values.productType === 'service' ? Infinity : values.stock,
            lojistaId: lojistaId, // Pass the lojistaId from props
            imageUrls: imageUrls,
            isPromoted: 'inactive' as 'active' | 'inactive',
        };
        
        const tier = values.isPromoted && values.promotionTier ? values.promotionTier : undefined;

        const result = await addProduct(productData, tier);
        
        if (result.success && result.paymentData) {
          const appUser = await getUser(user.uid);
          setPaymentData({ ...result.paymentData, userName: appUser?.name || 'N/A' });
          setIsPaymentDialogOpen(true);
        } else if (result.success) {
          toast({ title: 'Publicação Adicionada!', description: 'O seu produto/serviço foi adicionado com sucesso.' });
        } else {
          throw new Error(result.message);
        }

        setOpen(false);
        form.reset();
        setPreviews([]);
        router.refresh();

    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro!', description: (error as Error).message });
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
          if(!isOpen) {
              form.reset();
              setPreviews([]);
          }
          setOpen(isOpen);
      }}>
        <DialogTrigger asChild>
          <Button>Adicionar Produto/Serviço</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Publicação</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do que deseja adicionar à sua loja.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto pr-4">
              <FormField
                control={form.control}
                name="productType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>O que desejas publicar?</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="product">Produto</SelectItem>
                            <SelectItem value="service">Serviço</SelectItem>
                          </SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder={productType === 'product' ? "Ex: Sapatilhas Nike Air" : "Ex: Serviço de Limpeza"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descreva a sua publicação..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                  <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Preço (AOA)</FormLabel>
                      <FormControl>
                          <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
                  <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>{productType === 'product' ? 'Stock' : 'Disponibilidade'}</FormLabel>
                      <FormControl>
                          <Input type="number" {...field} disabled={productType === 'service'} />
                      </FormControl>
                      {productType === 'service' && <FormDescription className="text-xs">Serviços têm stock ilimitado.</FormDescription>}
                      <FormMessage />
                      </FormItem>
                  )}
                  />
              </div>
              <FormField
                control={form.control}
                name="images"
                render={() => (
                  <FormItem>
                    <FormLabel>Imagens (máx. 4)</FormLabel>
                    <div className="grid grid-cols-4 gap-2">
                       {previews.map((url, index) => (
                           <div key={index} className="relative aspect-square w-full">
                              <Image src={url} alt={`Pré-visualização ${index + 1}`} fill className="rounded-md object-cover"/>
                              <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => removeImage(index)}>
                                  <X className="h-4 w-4" />
                              </Button>
                          </div>
                       ))}
                    </div>
                    <FormControl>
                      <div>
                        <Input
                          type="file"
                          id="image-upload"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageChange}
                          ref={fileInputRef}
                          disabled={images.length >= 4}
                          multiple
                        />
                        <label
                          htmlFor="image-upload"
                          className={cn(
                              "cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full mt-2",
                              images.length >= 4 && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Carregar Imagem(ns)
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator />
               <FormField
                control={form.control}
                name="isPromoted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2"><Trophy className="text-yellow-500"/> Promover Publicação?</FormLabel>
                      <p className="text-xs text-muted-foreground pr-4">
                          Destaque o seu produto/serviço na página inicial e alcance milhares de potenciais clientes! Mais visibilidade, mais vendas.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              {isPromoted && (
                   <div className="space-y-4 rounded-lg border bg-zinc-50 p-4">
                       <FormField
                          control={form.control}
                          name="promotionTier"
                          render={({ field }) => (
                              <FormItem className="space-y-3">
                              <FormLabel className="font-semibold">Escolha o seu plano de destaque:</FormLabel>
                              <FormControl>
                                  <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex flex-col space-y-2"
                                  >
                                  <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-3 hover:bg-zinc-100 transition-colors">
                                      <FormControl>
                                      <RadioGroupItem value="tier1" />
                                      </FormControl>
                                      <FormLabel className="font-normal flex-1 cursor-pointer">
                                          <span className="font-bold">1 Mês de Destaque</span> - Alcance até 10,000 utilizadores.
                                          <p className="font-bold text-lg">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(promotionTiers.tier1)}</p>
                                      </FormLabel>
                                  </FormItem>
                                   <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-3 hover:bg-zinc-100 transition-colors">
                                      <FormControl>
                                      <RadioGroupItem value="tier2" />
                                      </FormControl>
                                      <FormLabel className="font-normal flex-1 cursor-pointer">
                                           <span className="font-bold">2 Meses de Destaque</span> - Alcance até 25,000 utilizadores.
                                          <p className="font-bold text-lg">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(promotionTiers.tier2)}</p>
                                      </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-3 hover:bg-zinc-100 transition-colors">
                                      <FormControl>
                                      <RadioGroupItem value="tier3" />
                                      </FormControl>
                                      <FormLabel className="font-normal flex-1 cursor-pointer">
                                           <span className="font-bold">3.5 Meses de Destaque</span> - Máxima visibilidade!
                                          <p className="font-bold text-lg">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(promotionTiers.tier3)}</p>
                                      </FormLabel>
                                  </FormItem>
                                  </RadioGroup>
                              </FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                          />
                  </div>
              )}
              <DialogFooter className="sticky bottom-0 bg-background pt-4 z-10">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Adicionar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <PaymentInstructionsDialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen} paymentData={paymentData} />
    </>
  );
}
