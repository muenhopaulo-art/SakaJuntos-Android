'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, AuthErrorCodes } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    // Generate a dummy email from the phone number
    const email = `+${phone.replace(/\D/g, '')}@sakajuntos.web`;
    // Use the phone number as the password
    const password = phone;

    try {
      // First, try to sign in
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Login bem-sucedido!",
        description: "Bem-vindo de volta.",
      });
      router.push("/");
    } catch (error: any) {
      // If sign in fails because user not found or creds are invalid, try to create an account
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          toast({
            title: "Conta criada com sucesso!",
            description: "O seu login foi efetuado.",
          });
          router.push("/");
        } catch (creationError: any) {
          toast({
            title: "Erro ao criar conta",
            description: creationError.message,
            variant: "destructive",
          });
        }
      } else {
        // Handle other errors (e.g., wrong password, invalid email)
        let errorMessage = "Ocorreu um erro desconhecido.";
        if (error.code === AuthErrorCodes.INVALID_PASSWORD) {
            errorMessage = "A palavra-passe está incorreta. Verifique o seu número de telefone.";
        } else if (error.code === AuthErrorCodes.INVALID_EMAIL) {
            errorMessage = "O formato do email é inválido.";
        }
        toast({
          title: "Erro de autenticação",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] bg-background p-4">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleAuth}>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold font-headline">Entrar ou Criar Conta</CardTitle>
            <CardDescription>
              Use o seu número de telefone para aceder ou criar a sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input 
                id="phone" 
                type="tel"
                placeholder="O seu número de telefone" 
                required 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Aguarde..." : <><LogIn className="mr-2 h-4 w-4" /> Entrar</>}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
