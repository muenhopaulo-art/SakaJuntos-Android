

'use client';

import { useState, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
import { Loader2, Upload, X, FileUp, Trophy } from 'lucide-react';
import { addProduct } from './actions';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB in bytes
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ACCEPTED_PDF_TYPES = ["application/pdf"];

const productSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  description: z.string().min(10, { message: 'A descrição deve ter pelo menos 10 caracteres.' }),
  price: z.coerce.number().min(0, { message: 'O preço deve ser um número positivo.' }),
  imageUrls: z.array(z.string()).max(4, { message: 'Pode carregar no máximo 4 imagens.' }).optional(),
  category: z.string().min(2, { message: 'A categoria é obrigatória.'}),
  productType: z.enum(['product', 'service'], { required_error: 'Por favor, selecione o tipo.' }),
  stock: z.coerce.number().min(0, { message: 'O stock deve ser um número positivo.' }),
  isPromoted: z.boolean().default(false),
  promotionTier: z.string().optional(),
  paymentProof: z.string().optional(),
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


export function AddProductDialog({ lojistaId }: { lojistaId: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      imageUrls: [],
      category: '',
      productType: 'product',
      stock: 0,
      isPromoted: false,
    },
  });

  const { isSubmitting } = form.formState;
  const productType = form.watch('productType');
  const imageUrls = form.watch('imageUrls') || [];
  const isPromoted = form.watch('isPromoted');
  const paymentProof = form.watch('paymentProof');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (imageUrls.length + files.length > 4) {
        form.setError("imageUrls", { message: `Pode carregar no máximo 4 imagens.` });
        return;
    }

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
         if (file.size > MAX_FILE_SIZE) {
            form.setError("imageUrls", { message: `O ficheiro ${file.name} é demasiado grande (máx 4.5MB).` });
            continue;
        }
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            form.setError("imageUrls", { message: `Ficheiro ${file.name} tem um formato inválido.` });
            continue;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            form.setValue('imageUrls', [...(form.getValues('imageUrls') || []), reader.result as string], { shouldValidate: true });
            form.clearErrors("imageUrls");
        };
        reader.readAsDataURL(file);
    }
    
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    form.setValue('imageUrls', imageUrls.filter((_, i) => i !== index));
  };
  
  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
        form.setError("paymentProof", { message: `O PDF é demasiado grande (máx 4.5MB).` });
        return;
    }
    if (!ACCEPTED_PDF_TYPES.includes(file.type)) {
        form.setError("paymentProof", { message: `Formato de ficheiro inválido. Apenas PDF.` });
        return;
    }

    // Here you would typically upload the file and store the URL.
    // For this example, we'll just store the file name as a placeholder.
    form.setValue('paymentProof', file.name, { shouldValidate: true });
    form.clearErrors("paymentProof");
  };

  const onSubmit = async (values: z.infer<typeof productSchema>) => {
    const productData = {
        ...values,
        stock: values.productType === 'service' ? Infinity : values.stock, // Services have infinite stock
        lojistaId: lojistaId,
        isPromoted: values.isPromoted ? 'active' : ('inactive' as 'active' | 'inactive'),
        // In a real app, you'd upload files to a storage service and save the URLs
        // For now, we are saving base64 data URIs which is not optimal
    }
    const result = await addProduct(productData);
    if (result.success) {
      toast({ title: 'Publicação Adicionada!', description: 'O seu produto/serviço foi adicionado com sucesso.' });
      setOpen(false);
      form.reset();
      router.refresh();
    } else {
      toast({ variant: 'destructive', title: 'Erro!', description: result.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if(!isOpen) {
            form.reset();
        }
        setOpen(isOpen);
    }}>
      <DialogTrigger asChild>
        <Button>Adicionar Publicação</Button>
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
              name="imageUrls"
              render={() => (
                <FormItem>
                  <FormLabel>Imagens (máx. 4)</FormLabel>
                  <div className="grid grid-cols-4 gap-2">
                     {imageUrls.map((url, index) => (
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
                        disabled={imageUrls.length >= 4}
                        multiple
                      />
                      <label
                        htmlFor="image-upload"
                        className={cn(
                            "cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full mt-2",
                            imageUrls.length >= 4 && "opacity-50 cursor-not-allowed"
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
                                        <p className="font-bold text-lg">1000 Kz</p>
                                    </FormLabel>
                                </FormItem>
                                 <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-3 hover:bg-zinc-100 transition-colors">
                                    <FormControl>
                                    <RadioGroupItem value="tier2" />
                                    </FormControl>
                                    <FormLabel className="font-normal flex-1 cursor-pointer">
                                         <span className="font-bold">2 Meses de Destaque</span> - Alcance até 25,000 utilizadores.
                                        <p className="font-bold text-lg">1500 Kz</p>
                                    </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-3 hover:bg-zinc-100 transition-colors">
                                    <FormControl>
                                    <RadioGroupItem value="tier3" />
                                    </FormControl>
                                    <FormLabel className="font-normal flex-1 cursor-pointer">
                                         <span className="font-bold">3.5 Meses de Destaque</span> - Máxima visibilidade!
                                        <p className="font-bold text-lg">2500 Kz</p>
                                    </FormLabel>
                                </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    
                    <div className="text-sm">
                        <p>Efetue o pagamento por Express para o número: <strong className="text-base">939282065</strong>.</p>
                        <p className="text-xs text-muted-foreground">Após o pagamento, anexe o comprovativo em PDF abaixo. A sua promoção será ativada após aprovação do administrador.</p>
                    </div>

                     <FormField
                        control={form.control}
                        name="paymentProof"
                        render={() => (
                            <FormItem>
                            <FormLabel>Comprovativo de Pagamento (PDF)</FormLabel>
                             <FormControl>
                                <div>
                                <Input
                                    type="file"
                                    id="pdf-upload"
                                    className="hidden"
                                    accept=".pdf"
                                    onChange={handlePdfChange}
                                    ref={pdfInputRef}
                                />
                                <label
                                    htmlFor="pdf-upload"
                                    className={cn("cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full",
                                    !!paymentProof && "border-green-500 text-green-700"
                                    )}
                                >
                                    <FileUp className="mr-2 h-4 w-4" />
                                    {paymentProof ? `Ficheiro: ${paymentProof}` : 'Carregar PDF'}
                                </label>
                                </div>
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
  );
}
