
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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
import { createGroupPromotion } from '@/services/product-service';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { getUser } from '@/services/user-service';
import { uploadFile } from '@/services/storage-service';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const createGroupSchema = z.object({
  name: z.string().min(3, { message: 'O nome do grupo deve ter pelo menos 3 caracteres.' }),
  members: z.coerce.number().min(2, { message: 'O grupo deve ter pelo menos 2 membros.' }),
  description: z.string().min(10, { message: 'A descrição deve ter pelo menos 10 caracteres.' }),
  image: z.any()
    .refine((file) => !!file, "A imagem é obrigatória.")
    .refine((file) => file?.size <= MAX_FILE_SIZE, `O tamanho máximo do ficheiro é 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
      "Apenas os formatos .jpg, .jpeg, .png e .webp são suportados."
    ),
});

type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

const resizeImage = (file: File, maxWidth: number): Promise<File> => {
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
        ctx.canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          } else {
            reject(new Error("Falha ao criar o blob da imagem redimensionada."));
          }
        }, file.type, 0.8); // 80% quality
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};


export function CreateGroupForm({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [user] = useAuthState(auth);
  const router = useRouter();


  const form = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: '',
      members: 2,
      description: '',
    },
  });
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // First, set preview immediately for better UX
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      try {
        // Resize the image
        const resizedFile = await resizeImage(file, 1024); // Resize to max-width 1024px
        form.setValue('image', resizedFile, { shouldValidate: true });
      } catch (error) {
        console.error("Image resize error:", error);
        toast({ variant: "destructive", title: "Erro ao redimensionar imagem", description: "Tente um ficheiro diferente."});
        // Fallback to original file if resizing fails, but still validate it
        form.setValue('image', file, { shouldValidate: true });
      }
    }
  };


  const onSubmit = async (data: CreateGroupFormValues) => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Erro de Autenticação",
            description: "Precisa de estar autenticado para criar um grupo.",
        });
        return;
    }
     if (!data.image) {
        form.setError('image', { message: 'Por favor, carregue uma imagem.' });
        return;
    }
    
    setIsLoading(true);

    try {
        const appUser = await getUser(user.uid);
        if (!appUser || !appUser.name) {
            throw new Error("Não foi possível encontrar os dados do seu perfil. Tente fazer login novamente.");
        }
        
        // 1. Upload image to Firebase Storage
        const imageUrl = await uploadFile(data.image, `group_images/${Date.now()}_${data.image.name}`);

        // 2. Create group with the returned image URL
        const result = await createGroupPromotion({
            name: data.name,
            target: data.members,
            creatorId: user.uid,
            creatorName: appUser.name,
            description: data.description,
            price: 0, // Price is now determined by products in group cart
            imageUrls: [imageUrl],
            aiHint: "group purchase",
        });

        if (result.success) {
            toast({
                title: 'Grupo Criado com Sucesso!',
                description: `O grupo "${data.name}" foi criado.`,
            });
            router.refresh();
            setOpen(false);
            form.reset();
            setPreview(null);
        } else {
            throw new Error(result.message || "Não foi possível criar o grupo. Tente novamente.");
        }
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Erro ao Criar Grupo",
            description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Grupo</DialogTitle>
          <DialogDescription>
            Defina um nome e o número de participantes para o seu novo grupo de compras.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Grupo/Produto</FormLabel>
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
                    <Input placeholder="Descreva o produto do grupo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imagem do Grupo</FormLabel>
                  <FormControl>
                    <div>
                      <Input 
                        type="file" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg, image/webp"
                      />
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                        <Upload className="mr-2 h-4 w-4" />
                        Carregar Imagem
                      </Button>
                    </div>
                  </FormControl>
                   {preview && (
                      <div className="mt-4 relative w-full h-48 rounded-md overflow-hidden">
                        <Image src={preview} alt="Pré-visualização da imagem" fill style={{ objectFit: 'cover' }} />
                      </div>
                    )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="members"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Membros Necessário</FormLabel>
                  <FormControl>
                    <Input type="number" min="2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter className="sticky bottom-0 bg-background pt-4">
                <Button type="submit" disabled={isLoading || !user} className="w-full sm:w-auto">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isLoading ? 'A criar...' : 'Criar Grupo'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
