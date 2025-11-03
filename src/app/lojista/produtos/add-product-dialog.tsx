
'use client';

import { useState } from 'react';
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
import { Loader2, Upload } from 'lucide-react';
import { addProduct } from './actions';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB in bytes
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];


const productSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  description: z.string().min(10, { message: 'A descrição deve ter pelo menos 10 caracteres.' }),
  price: z.coerce.number().min(0, { message: 'O preço deve ser um número positivo.' }),
  imageUrl: z.string().optional(),
});

export function AddProductDialog({ lojistaId }: { lojistaId: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      imageUrl: '',
    },
  });

  const { isSubmitting } = form.formState;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > MAX_FILE_SIZE) {
            form.setError("imageUrl", { message: "O ficheiro é demasiado grande (máx 4.5MB)." });
            return;
        }
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            form.setError("imageUrl", { message: "Formato de ficheiro inválido (apenas JPG, PNG, WEBP)." });
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            form.setValue('imageUrl', base64String);
            setImagePreview(base64String);
            form.clearErrors("imageUrl");
        };
        reader.readAsDataURL(file);
    }
  };


  const onSubmit = async (values: z.infer<typeof productSchema>) => {
    const result = await addProduct({ ...values, lojistaId });
    if (result.success) {
      toast({ title: 'Produto Adicionado!', description: 'O novo produto foi adicionado com sucesso.' });
      setOpen(false);
      form.reset();
      setImagePreview(null);
      router.refresh();
    } else {
      toast({ variant: 'destructive', title: 'Erro!', description: result.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Adicionar Produto/Serviço</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Produto</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do novo produto que deseja adicionar à sua loja.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Saco de Arroz 25kg" {...field} />
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imagem do Produto</FormLabel>
                  <FormControl>
                    <div>
                      <Input
                        type="file"
                        id="image-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
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
            {imagePreview && (
                <div className="flex justify-center p-2 border rounded-md">
                    <Image src={imagePreview} alt="Pré-visualização da imagem" width={100} height={100} className="rounded-md object-contain" />
                </div>
            )}
            <DialogFooter className="sticky bottom-0 bg-background pt-4 z-10">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Adicionar Produto
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
