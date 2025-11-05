

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB in bytes
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const phoneRegex = /^9\d{8}$/;

const productSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  description: z.string().min(10, { message: 'A descrição deve ter pelo menos 10 caracteres.' }),
  price: z.coerce.number().min(0, { message: 'O preço deve ser um número positivo.' }),
  imageUrl: z.string().optional(),
  productType: z.enum(['product', 'service'], { required_error: 'Por favor, selecione um tipo.' }),
  serviceContactPhone: z.string().optional(),
}).refine(data => {
    if (data.productType === 'service') {
        return !!data.serviceContactPhone && phoneRegex.test(data.serviceContactPhone);
    }
    return true;
}, {
    message: 'O telefone para contacto é obrigatório para serviços e deve ser válido.',
    path: ['serviceContactPhone'],
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
      productType: 'product',
      serviceContactPhone: '',
    },
  });

  const { isSubmitting } = form.formState;

  const imageUrl = useWatch({
    control: form.control,
    name: 'imageUrl',
  });

  const selectedType = useWatch({
    control: form.control,
    name: 'productType',
  });

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
        form.setValue('imageUrl', reader.result as string);
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
    const result = await addProduct({ ...values, lojistaId });
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
        <Button>Adicionar Produto/Serviço</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Produto ou Serviço</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do que deseja adicionar à sua loja.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
             <FormField
              control={form.control}
              name="productType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipo de Publicação</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="product" />
                        </FormControl>
                        <FormLabel className="font-normal">Produto</FormLabel>
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
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Saco de Arroz 25kg / Canalização" {...field} />
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
                    <Textarea placeholder="Descreva o produto ou serviço..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedType === 'service' && (
               <FormField
                control={form.control}
                name="serviceContactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone para Contacto</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="9xx xxx xxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
