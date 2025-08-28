
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
import { createUser } from '@/services/user-service';
import { useRouter } from 'next/navigation';
import { Checkbox } from './ui/checkbox';

const phoneRegex = /^9\d{8}$/; // Aceita números de 9 dígitos que começam com 9

const loginSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Por favor, insira um número de telemóvel angolano válido (9 dígitos).'),
  password: z.string().min(1, { message: 'A senha é obrigatória.' }),
});

const registerSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  phone: z.string().regex(phoneRegex, 'Por favor, insira um número de telemóvel angolano válido (9 dígitos).'),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
  wantsToBeLojista: z.boolean().default(false),
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
    defaultValues: { name: '', phone: '', password: '', wantsToBeLojista: false },
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
                wantsToBeLojista: registerValues.wantsToBeLojista,
            });
            
            toast({
                title: "Conta Criada!",
                description: registerValues.wantsToBeLojista 
                  ? "O seu pedido de verificação foi enviado. Entraremos em contacto."
                  : "O seu registo foi concluído com sucesso. A entrar...",
            });
            router.push('/');
        } else {
            // Login mode
            await signInWithEmailAndPassword(auth, email, values.password);
            toast({
                title: "Login bem-sucedido!",
                description: "Bem-vindo de volta.",
            });
            router.push('/');
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
            <Logo className="h-24 w-24 sm:h-32 sm:w-32 mx-auto text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-wide uppercase mt-4">
                SakaJuntos
            </h1>
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
                            <FormLabel className="sr-only">Nome Completo</FormLabel>
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
                    <FormLabel className="sr-only">Número de Telemóvel</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="O seu número (9xx xxx xxx)" {...field} disabled={isLoading} className="py-3 px-4 rounded-xl"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Senha</FormLabel>
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
                    name="wantsToBeLojista"
                    render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                        <FormControl>
                        <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading}
                        />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                        <FormLabel>
                            Quero ser um lojista
                        </FormLabel>
                        <FormDescription>
                           Irá submeter um pedido para vender os seus produtos na plataforma.
                        </FormDescription>
                        </div>
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
