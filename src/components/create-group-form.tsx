
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
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { createGroupPromotion } from '@/services/product-service';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { getUser } from '@/services/user-service';

const createGroupSchema = z.object({
  name: z.string().min(3, { message: 'O nome do grupo deve ter pelo menos 3 caracteres.' }),
  members: z.coerce.number().min(2, { message: 'O grupo deve ter pelo menos 2 membros.' }),
  description: z.string().min(10, { message: 'A descrição deve ter pelo menos 10 caracteres.' }),
  price: z.coerce.number().min(1, { message: 'O preço deve ser maior que zero.' }),
  imageUrl: z.string().url({ message: 'Por favor, insira um URL de imagem válido.' }).optional().or(z.literal('')),
});

type CreateGroupFormValues = z.infer<typeof createGroupSchema>;


export function CreateGroupForm({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [user] = useAuthState(auth);
  const router = useRouter();


  const form = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: '',
      members: 2,
      description: '',
      price: 0,
      imageUrl: '',
    },
  });

  const onSubmit = async (data: CreateGroupFormValues) => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Erro de Autenticação",
            description: "Precisa de estar autenticado para criar um grupo.",
        });
        return;
    }
    
    setIsLoading(true);

    try {
        const appUser = await getUser(user.uid);
        if (!appUser || !appUser.name) {
            throw new Error("Não foi possível encontrar os dados do seu perfil. Tente fazer login novamente.");
        }

        const result = await createGroupPromotion({
            name: data.name,
            target: data.members,
            creatorId: user.uid,
            creatorName: appUser.name,
            description: data.description,
            price: data.price,
            imageUrl: data.imageUrl,
            aiHint: "group purchase",
        });

        if (result.success) {
            toast({
                title: 'Grupo Criado com Sucesso!',
                description: `O grupo "${data.name}" foi criado.`,
            });
            router.refresh(); // Refresh the page to show the new group
            setOpen(false);
            form.reset();
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
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço Total (AOA)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" {...field} />
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
                  <FormLabel>URL da Imagem</FormLabel>
                  <FormControl>
                    <Input placeholder="https://exemplo.com/imagem.png" {...field} />
                  </FormControl>
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
