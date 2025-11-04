

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
  imageUrls: z.array(z.string()).min(1, 'É necessário carregar pelo menos uma imagem.').max(4, 'Pode carregar no máximo 4 imagens.'),
  category: z.enum(['produto', 'serviço'], { required_error: 'Por favor, selecione uma categoria.' }),
  contactPhone: z.string().optional(),
}).refine(data => {
    if (data.category === 'serviço') {
        return !!data.contactPhone && phoneRegex.test(data.contactPhone);
    }
    return true;
}, {
    message: 'O telefone para contacto é obrigatório para serviços e deve ser válido.',
    path: ['contactPhone'],
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
      imageUrls: [],
      category: 'produto',
      contactPhone: '',
    },
  });

  const { isSubmitting } = form.formState;

  const imageUrls = useWatch({
    control: form.control,
    name: 'imageUrls',
  });

  const selectedCategory = useWatch({
    control: form.control,
    name: 'category',
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const currentImageCount = imageUrls.length;
    const filesToProcess = Array.from(files).slice(0, 4 - currentImageCount);

    if (files.length + currentImageCount > 4) {
        toast({
            variant: "destructive",
            title: "Limite de Imagens Excedido",
            description: "Só pode carregar um máximo de 4 imagens."
        });
    }

    let validationError = false;
    filesToProcess.forEach(file => {
        if (file.size > MAX_FILE_SIZE) {
            form.setError("imageUrls", { message: `O ficheiro ${file.name} é demasiado grande (máx 4.5MB).` });
            validationError = true;
        }
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            form.setError("imageUrls", { message: `Formato de ficheiro inválido em ${file.name}.` });
            validationError = true;
        }
    });

    if (validationError) return;

    const newImageUrls = [...imageUrls];
    let processedCount = 0;

    filesToProcess.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
            newImageUrls.push(reader.result as string);
            processedCount++;
            if (processedCount === filesToProcess.length) {
                form.setValue('imageUrls', newImageUrls);
                form.clearErrors("imageUrls");
            }
        };
        reader.readAsDataURL(file);
    });

    // Reset file input
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImageUrls = imageUrls.filter((_, i) => i !== index);
    form.setValue('imageUrls', newImageUrls);
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
              name="category"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="produto" />
                        </FormControl>
                        <FormLabel className="font-normal">Produto</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="serviço" />
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
            
            {selectedCategory === 'serviço' && (
               <FormField
                control={form.control}
                name="contactPhone"
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
              name="imageUrls"
              render={() => (
                <FormItem>
                  <FormLabel>Imagens (mín. 1, máx. 4)</FormLabel>
                  {imageUrls && imageUrls.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {imageUrls.map((url, index) => (
                              <div key={index} className="relative aspect-square">
                                  <Image src={url} alt={`Pré-visualização ${index + 1}`} fill className="rounded-md object-cover"/>
                                  <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => removeImage(index)}>
                                      <X className="h-4 w-4" />
                                  </Button>
                                  {index === 0 && <div className="absolute bottom-0 left-0 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-br-md rounded-tl-md">Capa</div>}
                              </div>
                          ))}
                      </div>
                  )}
                  <FormControl>
                    <div>
                      <Input
                        type="file"
                        id="image-upload"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        ref={fileInputRef}
                        disabled={imageUrls.length >= 4}
                      />
                      <label
                        htmlFor="image-upload"
                        className={cn(
                            "cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full",
                            imageUrls.length >= 4 && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {imageUrls.length > 0 ? 'Adicionar mais' : 'Carregar Imagens'}
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
