
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
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
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Logo } from './Logo';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { createUser, getUser } from '@/services/user-service';
import { useRouter } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const phoneRegex = /^9\d{8}$/; // Aceita números de 9 dígitos que começam com 9

const provinces = [
    "Bengo", "Benguela", "Bié", "Cabinda", "Cuando Cubango", "Cuanza Norte",
    "Cuanza Sul", "Cunene", "Huambo", "Huíla", "Luanda", "Lunda Norte",
    "Lunda Sul", "Malanje", "Moxico", "Namibe", "Uíge", "Zaire"
];

const loginSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Por favor, insira um número de telemóvel angolano válido (9 dígitos).'),
  password: z.string().min(1, { message: 'A senha é obrigatória.' }),
});

const registerSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  phone: z.string().regex(phoneRegex, 'Por favor, insira um número de telemóvel angolano válido (9 dígitos).'),
  province: z.string().min(1, { message: 'Por favor, selecione a sua província.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
  role: z.enum(['lojista', 'courier'], { // 'client' is now represented by 'lojista'
    required_error: "Precisa de selecionar um tipo de conta."
  }),
});


export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { toast } = useToast();
  const router = useRouter();

  const formSchema = authMode === 'login' ? loginSchema : registerSchema;
  
  // Need to use any here because the types from zod can't be easily reconciled
  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', phone: '', password: '', province: '', role: 'lojista' },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
     setIsLoading(true);
     try {
        const email = `+244${values.phone}@sakajuntos.com`; // Use phone number to create a unique email
        
        if (authMode === 'register') {
            const registerValues = values as z.infer<typeof registerSchema>;
            // 1. Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, registerValues.password);
            const user = userCredential.user;
            
            // 2. Create user profile in our database (Firestore)
            await createUser(user.uid, {
                name: registerValues.name,
                phone: values.phone,
                province: registerValues.province,
                role: registerValues.role,
            });
            
            toast({
                title: "Conta Criada!",
                description: "O seu registo foi concluído com sucesso. A entrar...",
            });
            router.push('/');
        } else {
            // Login mode
            const userCredential = await signInWithEmailAndPassword(auth, email, values.password);
            const user = userCredential.user;
            
            // Fetch user profile to check role for redirection
            const appUser = await getUser(user.uid);

            toast({
                title: "Login bem-sucedido!",
                description: "Bem-vindo de volta.",
            });

            if (appUser && appUser.role === 'admin') {
                router.push('/admin');
            } else if (appUser && appUser.role === 'lojista') {
                router.push('/lojista');
            }
             else {
                router.push('/');
            }
        }

     } catch (error: any) {
        let errorMessage = "Ocorreu um erro desconhecido. Tente novamente.";
        if (error.code) {
            switch (error.code) {
                case 'auth/user-not-found':
                case 'auth/invalid-credential':
                    errorMessage = 'Número de telemóvel ou senha incorretos.';
                    break;
                case 'auth/email-already-in-use':
                    errorMessage = 'Este número de telemóvel já está registado. Tente entrar.';
                    break;
                case 'auth/invalid-email':
                     errorMessage = 'O número de telemóvel fornecido não é válido.';
                     break;
                case 'auth/weak-password':
                    errorMessage = 'A senha é muito fraca. Tente uma mais forte.';
                    break;
                default:
                    errorMessage = `Erro: ${error.message}`;
            }
        }
        toast({
            variant: "destructive",
            title: `Erro ao ${authMode === 'login' ? 'entrar' : 'registar'}`,
            description: errorMessage,
        });
     } finally {
        setIsLoading(false);
     }
  }

  const toggleMode = () => {
    setAuthMode(prev => (prev === 'login' ? 'register' : 'login'));
    form.reset();
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl shadow-2xl">
        <header className="text-center mb-8">
            <Logo className="mx-auto" />
            <p className="text-sm font-light text-gray-500 mt-2 tracking-wide mb-6">
              {authMode === 'login' ? 'Compras em grupo inteligentes, entregas à sua porta.' : 'Junte-se. Contribua. Receba.'}
            </p>
        </header>
        <CardContent className="p-0">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {authMode === 'register' && (
                  <>
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                        <FormItem>
                            <FormControl>
                            <Input placeholder="O seu nome completo" {...field}  disabled={isLoading} className="py-3 px-4 rounded-xl"/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                  </>
              )}
               <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="tel" placeholder="O seu número (9xx xxx xxx)" {...field} disabled={isLoading} className="py-3 px-4 rounded-xl"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {authMode === 'register' && (
                 <FormField
                    control={form.control}
                    name="province"
                    render={({ field }) => (
                        <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                                <FormControl>
                                    <SelectTrigger className="py-3 px-4 rounded-xl">
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
              )}

               <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="password" placeholder="A sua senha" {...field} disabled={isLoading} className="py-3 px-4 rounded-xl"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {authMode === 'register' && (
                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Deseja registar-se como:</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-col space-y-2"
                                    disabled={isLoading}
                                >
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="lojista" />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                            Cliente / Vendedor
                                        </FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                            <RadioGroupItem value="courier" />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                            Entregador
                                        </FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                    />
              )}
              <Button type="submit" className="w-full h-12 text-base rounded-xl" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? (authMode === 'login' ? 'A entrar...' : 'A registar...') : (authMode === 'login' ? 'Entrar' : 'Registar')}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm">
            <Button variant="link" onClick={toggleMode} className="text-primary hover:text-primary/80">
                {authMode === 'login' ? 'Não tem uma conta? Crie uma' : 'Já tem uma conta? Entre aqui'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
