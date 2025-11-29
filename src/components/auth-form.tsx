
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
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useRef } from 'react';
import { Loader2, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Logo } from './Logo';
import { auth, db } from '@/lib/firebase';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { createUser, getUser, setUserOnlineStatus } from '@/services/user-service';
import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';


const phoneRegex = /^9\d{8}$/; // Aceita números de 9 dígitos que começam com 9

const provinces = [
    "Bengo", "Benguela", "Bié", "Cabinda", "Quando Cubango", "Cuanza Norte",
    "Cuanza Sul", "Cunene", "Huambo", "Huíla", "Luanda", "Lunda Norte",
    "Lunda Sul", "Malanje", "Moxico", "Namibe", "Uíge", "Zaire"
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const loginSchema = z.object({
  phone: z.string().regex(phoneRegex, 'Por favor, insira um número de telemóvel angolano válido (9 dígitos).'),
  password: z.string().min(1, { message: 'A senha é obrigatória.' }),
});

const registerSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  phone: z.string().regex(phoneRegex, 'Por favor, insira um número de telemóvel angolano válido (9 dígitos).'),
  province: z.string().min(1, { message: 'Por favor, selecione a sua província.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
  role: z.enum(['client', 'courier', 'lojista']).default('client'), // Default to 'client' for client/seller
  isLojista: z.boolean().default(false),
  photo: z.any()
    .optional()
    .refine((file) => !file || file.size <= MAX_FILE_SIZE, `O tamanho máximo do ficheiro é 5MB.`)
    .refine(
      (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file?.type),
      "Apenas os formatos .jpg, .jpeg, .png e .webp são suportados."
    ),
});


export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser] = useAuthState(auth);

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'register') {
      setAuthMode('register');
    }
  }, [searchParams]);

  const formSchema = authMode === 'login' ? loginSchema : registerSchema;
  
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', phone: '', password: '', province: '', role: 'client', isLojista: false },
  });
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('photo', file, { shouldValidate: true });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
     setIsLoading(true);
     try {
        const email = `+244${values.phone}@sakajuntos.com`;
        
        if (authMode === 'register') {
            const registerValues = values as z.infer<typeof registerSchema>;
            
            const isCourierRegistrationByLojista = registerValues.role === 'courier' && currentUser;
            const ownerLojistaId = isCourierRegistrationByLojista ? currentUser.uid : undefined;

            // 1. Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, registerValues.password);
            const user = userCredential.user;

            let photoURL: string | undefined = undefined;
            if (registerValues.photo) {
                const storage = getStorage();
                const filePath = `profile_pictures/${user.uid}`;
                const fileRef = storageRef(storage, filePath);
                await uploadBytes(fileRef, registerValues.photo);
                photoURL = await getDownloadURL(fileRef);
            }
            
            // 2. Create user profile in our database (Firestore)
            let roleToCreate: 'client' | 'lojista' | 'courier' = 'client';
            if (registerValues.role === 'courier') {
              roleToCreate = 'courier';
            } else if (registerValues.isLojista) {
              roleToCreate = 'lojista';
            }

            await createUser(user.uid, {
                name: registerValues.name,
                phone: values.phone,
                province: registerValues.province,
                role: roleToCreate,
                ownerLojistaId: ownerLojistaId,
                photoURL: photoURL,
            });

            if (!isCourierRegistrationByLojista) {
                await setUserOnlineStatus(user.uid, true);
                toast({
                    title: "Conta Criada!",
                    description: "O seu registo foi concluído com sucesso. A entrar...",
                });
                router.replace('/'); // Use replace to clear history
            } else {
                 toast({
                    title: "Entregador Registado!",
                    description: `${registerValues.name} foi adicionado à sua equipa.`,
                });
                router.replace('/lojista/entregadores'); // Use replace
            }


        } else {
            // Login mode
            const userCredential = await signInWithEmailAndPassword(auth, email, values.password);
            const user = userCredential.user;
            
            const appUser = await getUser(user.uid);
            await setUserOnlineStatus(user.uid, true);

            toast({
                title: "Login bem-sucedido!",
                description: `Bem-vindo de volta, ${appUser?.name}.`,
            });
            
            let destination = '/';
            if (appUser && appUser.role === 'admin') {
                destination = '/admin';
            }
            router.replace(destination); // Use replace to clear history
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
        } else if (error.message) {
            errorMessage = error.message;
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
    setPreview(null);
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
                        name="photo"
                        render={({ field }) => (
                            <FormItem className="flex flex-col items-center">
                               <FormControl>
                                    <div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="image/png, image/jpeg, image/webp"
                                        />
                                        <Avatar 
                                            className="h-24 w-24 cursor-pointer"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <AvatarImage src={preview || undefined} alt="Pré-visualização" />
                                            <AvatarFallback className="bg-muted">
                                                <Camera className="h-8 w-8 text-muted-foreground"/>
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                </FormControl>
                                <p className="text-xs text-muted-foreground">Adicione o seu logo ou foto</p>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
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
                  name="isLojista"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <Label>Quero ser um vendedor</Label>
                        <p className="text-sm text-muted-foreground">
                          Marque esta opção para vender os seus produtos na plataforma.
                        </p>
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
