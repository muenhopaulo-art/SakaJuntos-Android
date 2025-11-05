

'use client';

import { useState, useRef } from 'react';
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X } from 'lucide-react';
import { addProduct } from './actions';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB in bytes
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const productSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  description: z.string().min(10, { message: 'A descrição deve ter pelo menos 10 caracteres.' }),
  price: z.coerce.number().min(0, { message: 'O preço deve ser um número positivo.' }),
  imageUrl: z.string().optional(),
  category: z.string().min(2, { message: 'A categoria é obrigatória.'}),
  stock: z.coerce.number().min(0, { message: 'O stock deve ser um número positivo.' }),
  isPromoted: z.boolean().default(false),
});

export function AddProductDialog({ lojistaId }: { lojistaId: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      imageUrl: '',
      category: '',
      stock: 0,
      isPromoted: false,
    },
  });

  const { isSubmitting, watch } = form.formState;

  const imageUrl = watch('imageUrl');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
        form.setError("imageUrl", { message: `O ficheiro é demasiado grande (máx 4.5MB).` });
        return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        form.setError("imageUrl", { message: `Formato de ficheiro inválido.` });
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        form.setValue('imageUrl', reader.result as string, { shouldValidate: true });
        form.clearErrors("imageUrl");
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const removeImage = () => {
    form.setValue('imageUrl', '');
  };

  const onSubmit = async (values: z.infer<typeof productSchema>) => {
    const productData = {
        ...values,
        lojistaId: lojistaId,
        isPromoted: values.isPromoted ? 'active' : 'inactive',
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
        <Button>Adicionar Produto</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Produto</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do que deseja adicionar à sua loja.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Sapatilhas Nike Air" {...field} />
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
                    <Textarea placeholder="Descreva o produto..." {...field} />
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
                  <FormControl>
                    <Input placeholder="Ex: Vestuário" {...field} />
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
                <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Stock</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
              control={form.control}
              name="imageUrl"
              render={() => (
                <FormItem>
                  <FormLabel>Imagem</FormLabel>
                  {imageUrl && (
                      <div className="relative aspect-video w-full">
                          <Image src={imageUrl} alt="Pré-visualização" fill className="rounded-md object-contain"/>
                          <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={removeImage}>
                              <X className="h-4 w-4" />
                          </Button>
                      </div>
                  )}
                  <FormControl>
                    <div>
                      <Input
                        type="file"
                        id="image-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                        ref={fileInputRef}
                        disabled={!!imageUrl}
                      />
                      <label
                        htmlFor="image-upload"
                        className={cn(
                            "cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full",
                            !!imageUrl && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Carregar Imagem
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPromoted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Promover Produto?</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Produtos promovidos aparecem no carrossel da página inicial.
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
