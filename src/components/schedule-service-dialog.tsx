
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { createServiceRequest } from '@/services/service-actions';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import type { Product } from '@/lib/types';

const scheduleSchema = z.object({
  requestedDate: z.date({ required_error: 'A data do agendamento é obrigatória.' }),
  requestedPeriod: z.enum(['manha', 'tarde'], { required_error: 'Por favor, selecione um período.' }),
  address: z.string().min(10, { message: 'O endereço deve ter pelo menos 10 caracteres.' }),
  notes: z.string().optional(),
});

interface ScheduleServiceDialogProps {
    product: Product;
    children: React.ReactNode;
}

export function ScheduleServiceDialog({ product, children }: ScheduleServiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [user, loadingUser] = useAuthState(auth);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof scheduleSchema>>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      address: '',
      notes: '',
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof scheduleSchema>) => {
    if (!user || !user.email) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar autenticado para agendar um serviço.' });
        return;
    }
    if (!product.lojistaId) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Este serviço não tem um vendedor associado.' });
        return;
    }

    const result = await createServiceRequest({
        ...values,
        clientId: user.uid,
        serviceId: product.id,
        lojistaId: product.lojistaId,
    });

    if (result.success) {
      toast({ title: 'Agendamento Enviado!', description: 'O vendedor entrará em contato para confirmar.' });
      setOpen(false);
      form.reset();
    } else {
      toast({ variant: 'destructive', title: 'Erro!', description: result.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar Serviço: {product.name}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes abaixo para solicitar o agendamento.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <FormField
              control={form.control}
              name="requestedDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data Desejada</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: pt })
                          ) : (
                            <span>Escolha uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="requestedPeriod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Período Preferencial</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="manha" />
                        </FormControl>
                        <FormLabel className="font-normal">Manhã</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="tarde" />
                        </FormControl>
                        <FormLabel className="font-normal">Tarde</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, Bairro, Cidade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas Adicionais</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descreva brevemente o problema ou o que precisa." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting || loadingUser}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Enviar Pedido
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
