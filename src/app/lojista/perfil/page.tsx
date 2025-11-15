
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getUser, type User } from '@/services/user-service';
import { updateUserProfile } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const provinces = [
    "Bengo", "Benguela", "Bié", "Cabinda", "Quando Cubango", "Cuanza Norte",
    "Cuanza Sul", "Cunene", "Huambo", "Huíla", "Luanda", "Lunda Norte",
    "Lunda Sul", "Malanje", "Moxico", "Namibe", "Uíge", "Zaire"
];

const profileSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  phone: z.string().regex(/^9\d{8}$/, 'Por favor, insira um número de telemóvel angolano válido (9 dígitos).'),
  province: z.string().min(1, { message: 'Por favor, selecione a sua província.' }),
  email: z.string().email(),
});


export default function LojistaProfilePage() {
    const [user, authLoading] = useAuthState(auth);
    const [appUser, setAppUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: '',
            phone: '',
            province: '',
            email: '',
        },
    });

    useEffect(() => {
        if (user) {
            setLoading(true);
            getUser(user.uid).then(profile => {
                if (profile) {
                    setAppUser(profile);
                    form.reset({
                        name: profile.name,
                        phone: profile.phone,
                        province: profile.province,
                        email: profile.email,
                    });
                }
                setLoading(false);
            });
        } else if (!authLoading) {
            setLoading(false);
        }
    }, [user, authLoading, form]);

    const { isSubmitting } = form.formState;

    const onSubmit = async (values: z.infer<typeof profileSchema>) => {
        if (!user) return;
        
        const result = await updateUserProfile(user.uid, {
            name: values.name,
            phone: values.phone,
            province: values.province,
        });

        if (result.success) {
            toast({ title: 'Perfil Atualizado!', description: 'As suas informações foram guardadas com sucesso.' });
        } else {
            toast({ variant: 'destructive', title: 'Erro!', description: result.message });
        }
    };
    
    if (loading || authLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-64" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>
        )
    }

    if (!user || !appUser) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Erro</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Não foi possível carregar o seu perfil. Por favor, tente novamente.</p>
                </CardContent>
            </Card>
        )
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle>Meu Perfil</CardTitle>
                <CardDescription>Atualize as suas informações pessoais e de contacto.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                         <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome Completo</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Telefone</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="province"
                            render={({ field }) => (
                                <FormItem>
                                     <FormLabel>Província</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a sua província" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {provinces.map(province => (
                                                <SelectItem key={province} value={province}>{province}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input {...field} disabled />
                                    </FormControl>
                                     <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Alterações
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
