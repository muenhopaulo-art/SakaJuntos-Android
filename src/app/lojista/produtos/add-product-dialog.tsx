

'use client';

import { useState, useCallback } from 'react';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Star, Trophy, X } from 'lucide-react';
import { addProduct } from './actions';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { productCategories } from '@/lib/categories';
import type { PromotionPayment } from '@/lib/types';
import { PaymentInstructionsDialog } from './PaymentInstructionsDialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getUser } from '@/services/user-service';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { PROMOTION_COST, PROMOTION_PLANS } from '@/lib/config';

const phoneRegex = /^9\d{8}$/;

const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const productSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  description: z.string().min(10, { message: 'A descrição deve ter pelo menos 10 caracteres.' }),
  price: z.coerce.number().min(0, { message: 'O preço deve ser um número positivo.' }),
  stock: z.coerce.number().optional(),
  category: z.string({ required_error: "Por favor, selecione uma categoria." }),
  imageFiles: z.array(z.string()).min(1, "Por favor, carregue pelo menos uma imagem.").max(MAX_FILES, `Pode carregar no máximo ${MAX_FILES} imagens.`),
  promote: z.boolean().default(false),
  productType: z.enum(['product', 'service']).default('product'),
  serviceContactPhone: z.string().optional(),
  promotionTier: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.productType === 'product' && (data.stock === undefined || data.stock < 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['stock'],
            message: 'O stock é obrigatório para produtos e deve ser um número positivo.',
        });
    }
    if (data.productType === 'service' && data.serviceContactPhone && !phoneRegex.test(data.serviceContactPhone)) {
         ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['serviceContactPhone'],
            message: 'Por favor, insira um número de telemóvel válido (9 dígitos).',
        });
    }
    if (data.promote && !data.promotionTier) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['promotionTier'],
            message: 'Por favor, escolha um plano de destaque.',
        });
    }
});

const resizeAndCompressImage = (file: File, maxWidth: number, quality: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scaleFactor = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scaleFactor;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Não foi possível obter o contexto do canvas."));
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = ctx.canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};


export function AddProductDialog({ lojistaId }: { lojistaId: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<PromotionPayment | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const [user] = useAuthState(auth);

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      promote: false,
      productType: 'product',
      serviceContactPhone: '',
      promotionTier: 'tier1',
      imageFiles: [],
    },
  });

  const productType = form.watch('productType');
  const promote = form.watch('promote');

  const resetForm = useCallback(() => {
    form.reset({
      name: '',
      description: '',
      price: 0,
      stock: 0,
      category: '',
      imageFiles: [],
      promote: false,
      productType: 'product',
      serviceContactPhone: '',
      promotionTier: 'tier1',
    });
    setImagePreviews([]);
  }, [form]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const currentFiles = form.getValues('imageFiles') || [];
    if (files.length + currentFiles.length > MAX_FILES) {
        toast({
            variant: "destructive",
            title: "Limite de Imagens Excedido",
            description: `Você só pode carregar no máximo ${MAX_FILES} imagens.`,
        });
        return;
    }
    
    const newPreviews: string[] = [...imagePreviews];
    const newFileStrings: string[] = [...currentFiles];

    for (const file of Array.from(files)) {
        try {
            const compressedBase64 = await resizeAndCompressImage(file, 1024, 0.7);
            newPreviews.push(compressedBase64);
            newFileStrings.push(compressedBase64);
        } catch (error) {
             console.error("Image processing error:", error);
             toast({variant: "destructive", title: "Erro ao Processar Imagem", description: "Não foi possível otimizar a imagem selecionada."})
        }
    }
    
    setImagePreviews(newPreviews);
    form.setValue('imageFiles', newFileStrings, { shouldValidate: true });
    form.clearErrors("imageFiles");
  };

  const removeImage = (index: number) => {
    const newPreviews = [...imagePreviews];
    const newFileStrings = [...(form.getValues('imageFiles') || [])];
    
    newPreviews.splice(index, 1);
    newFileStrings.splice(index, 1);

    setImagePreviews(newPreviews);
    form.setValue('imageFiles', newFileStrings, { shouldValidate: true });
  }
  
  const handleClose = useCallback(() => {
    setOpen(false);
    setTimeout(() => {
      resetForm();
    }, 300);
  }, [resetForm]);

  const handlePaymentDialogClose = useCallback(() => {
    setIsPaymentDialogOpen(false);
    setPaymentDetails(null);
  }, []);

  const onSubmit = async (values: z.infer<typeof productSchema>) => {
    if (isProcessing || !user) return;
    
    setIsProcessing(true);
    
    try {
        const promotionPlan = values.promote ? PROMOTION_PLANS.find(p => p.id === values.promotionTier) : undefined;
        
        const dataToSend = { 
            ...values, 
            lojistaId,
            imageUrls: values.imageFiles,
            promotionTier: promotionPlan?.id,
            isPromoted: values.promote ? ('pending' as const) : ('inactive' as const),
        };
        
        delete (dataToSend as any).imageFiles;
        if (dataToSend.productType === 'product') {
            delete (dataToSend as any).serviceContactPhone;
        }
        if (dataToSend.productType === 'service') {
            delete (dataToSend as any).stock;
        }
        
        const result = await addProduct(dataToSend, user.uid);
        
        if (result.success) {
          if (result.payment) {
              const appUser = await getUser(user.uid);
              const fullPaymentData: PromotionPayment = {
                  id: result.payment.id,
                  lojistaId: user.uid,
                  productId: result.payment.productId,
                  amount: result.payment.amount,
                  referenceCode: result.payment.referenceCode,
                  paymentPhoneNumber: result.payment.paymentPhoneNumber,
                  userName: appUser?.name || 'N/A',
                  productName: values.name,
                  lojistaName: appUser?.name || 'N/A',
                  tier: promotionPlan?.id || 'tier1',
                  status: 'pendente',
                  createdAt: Date.now(),
              }
              setPaymentDetails(fullPaymentData);
              handleClose(); 
              setIsPaymentDialogOpen(true);
          } else {
            toast({ 
              title: `${values.productType === 'service' ? 'Serviço' : 'Produto'} Adicionado!`, 
              description: `O novo ${values.productType === 'service' ? 'serviço' : 'produto'} foi adicionado com sucesso.` 
            });
            handleClose();
          }
        } else {
          throw new Error(result.message || 'Ocorreu um erro desconhecido.');
        }

    } catch (error) {
        console.error("Error submitting product:", error);
        toast({ 
          variant: 'destructive', 
          title: 'Erro!', 
          description: error instanceof Error ? error.message : 'Não foi possível adicionar o item.' 
        });
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose();
        } else {
          setOpen(true);
        }
      }}>
        <DialogTrigger asChild>
          <Button onClick={() => setOpen(true)}>Adicionar produto ou serviço</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar produto ou serviço</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do novo produto ou serviço que deseja adicionar à sua loja.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col max-h-[80vh]">
              <ScrollArea className="flex-1 pr-6">
                <div className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="productType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>O que está a adicionar?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="product" />
                              </FormControl>
                              <FormLabel className="font-normal">Produto Físico</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="service" />
                              </FormControl>
                              <FormLabel className="font-normal">Serviço</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do {productType === 'service' ? 'Serviço' : 'Produto'}</FormLabel>
                        <FormControl>
                          <Input placeholder={productType === 'service' ? "Ex: Instalação de CCTV" : "Ex: Saco de Arroz 25kg"} {...field} />
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
                          <Textarea placeholder={`Descreva o ${productType === 'service' ? 'serviço' : 'produto'}...`} {...field} />
                        </FormControl>
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
                    {productType === 'product' && (
                      <FormField
                          control={form.control}
                          name="stock"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>Produtos em Stock</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                    )}
                  </div>
                  {productType === 'service' && (
                      <FormField
                          control={form.control}
                          name="serviceContactPhone"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel>Nº de Telefone para Contacto</FormLabel>
                              <FormControl>
                                <Input type="tel" placeholder="9xx xxx xxx" {...field} />
                              </FormControl>
                              <FormDescription>
                                  O cliente usará este número para o contactar. Se deixar em branco, será usado o número principal da sua conta.
                              </FormDescription>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                    )}
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
                            {productCategories.map(category => (
                              <SelectItem key={category} value={category}>{category}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="imageFiles"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Imagens ({imagePreviews.length}/{MAX_FILES})</FormLabel>
                        <FormControl>
                          <div>
                            <Input
                              type="file"
                              id="image-upload-lojista"
                              className="hidden"
                              accept="image/*"
                              multiple
                              onChange={handleImageChange}
                              disabled={imagePreviews.length >= MAX_FILES}
                            />
                            <label
                              htmlFor="image-upload-lojista"
                              className={`cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full ${imagePreviews.length >= MAX_FILES ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Carregar Imagens
                            </label>
                          </div>
                        </FormControl>
                         {imagePreviews.length > 0 && (
                            <div className="mt-4 grid grid-cols-3 gap-2">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative aspect-square w-full rounded-md overflow-hidden">
                                        <Image src={preview} alt={`Pré-visualização ${index + 1}`} fill className="object-cover" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-6 w-6"
                                            onClick={() => removeImage(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                         )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />
                    <FormField
                        control={form.control}
                        name="promote"
                        render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                            <div className="space-y-1 leading-none">
                                <FormLabel className='flex items-center gap-2'><Trophy className="text-yellow-500"/> Promover Publicação?</FormLabel>
                                <FormDescription>
                                    Destaque o seu produto/serviço na página inicial e alcance milhares de potenciais clientes! Mais visibilidade, mais vendas.
                                </FormDescription>
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
                    <AnimatePresence>
                        {promote && (
                             <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                <FormField
                                    control={form.control}
                                    name="promotionTier"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3 pt-4">
                                            <FormLabel className="font-semibold">Escolha o seu plano de destaque:</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="flex flex-col space-y-2"
                                                >
                                                    {PROMOTION_PLANS.map(plan => (
                                                         <FormItem key={plan.id} className="flex flex-col space-y-0 rounded-md border p-4 hover:bg-muted/50 transition-colors">
                                                            <div className='flex items-center gap-4'>
                                                                <FormControl>
                                                                    <RadioGroupItem value={plan.id} />
                                                                </FormControl>
                                                                <div className="space-y-1 leading-none">
                                                                    <FormLabel className="font-semibold">{plan.name}</FormLabel>
                                                                    <FormDescription>{plan.description}</FormDescription>
                                                                    <p className="font-bold text-foreground text-lg">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(plan.cost)}</p>
                                                                </div>
                                                            </div>
                                                        </FormItem>
                                                    ))}
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
              </ScrollArea>

              <DialogFooter className="pt-4 border-t">
                <Button 
                  type="submit" 
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isProcessing ? "A criar..." : `Adicionar ${productType === 'service' ? 'Serviço' : 'Produto'}`}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <PaymentInstructionsDialog 
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        paymentData={paymentDetails}
      />
    </>
  );
}
