'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle, Loader2, Users, ShoppingBag, Truck, Target } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

// Define a interface para o evento de instalação
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function DownloadPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verifica se a app já está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Previne que o Chrome mostre o prompt automaticamente
      e.preventDefault();
      // Guarda o evento para que possa ser acionado mais tarde
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostra o prompt de instalação
    await deferredPrompt.prompt();

    // Espera pela escolha do utilizador
    const { outcome } = await deferredPrompt.userChoice;
    
    // Opcional: Analisar o resultado
    if (outcome === 'accepted') {
      console.log('Utilizador aceitou a instalação do PWA');
      setIsInstalled(true);
    } else {
      console.log('Utilizador recusou a instalação do PWA');
    }

    // O prompt só pode ser usado uma vez.
    setDeferredPrompt(null);
  };

  const benefits = [
      {
          icon: Users,
          title: "Poupança em Grupo",
          description: "Junte-se a outras pessoas para comprar produtos em quantidade e consiga preços muito mais baixos do que compraria sozinho."
      },
      {
          icon: ShoppingBag,
          title: "MiniShopping Conveniente",
          description: "Explore uma vasta gama de produtos e serviços de vendedores locais, tudo num único lugar, e faça as suas compras individuais com facilidade."
      },
       {
          icon: Target,
          title: "Venda para Toda Angola",
          description: "É vendedor? Alcance mais de 100.000 potenciais clientes em todo o país e veja o seu negócio crescer como nunca."
      },
      {
          icon: Truck,
          title: "Entregas à Sua Porta",
          description: "Seja em grupo ou individualmente, as suas compras são entregues onde quer que esteja, com rapidez e segurança."
      },
  ]

  const renderInstallButton = () => {
    if (isInstalled) {
      return (
        <Button size="lg" className="w-full" disabled>
          <CheckCircle className="mr-2 h-5 w-5" />
          Aplicação Já Instalada
        </Button>
      );
    }
    if (deferredPrompt) {
      return (
        <Button size="lg" className="w-full" onClick={handleInstallClick}>
          <Download className="mr-2 h-5 w-5" />
          Instalar Aplicação
        </Button>
      );
    }
    // Show a disabled button while waiting for the prompt
    return (
        <Button size="lg" className="w-full" disabled>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            A preparar instalação...
        </Button>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-lg text-center shadow-lg">
        <CardHeader>
           <Logo className="mx-auto h-20" />
          <CardTitle className="text-3xl font-bold tracking-tight font-headline mt-4">Bem-vindo ao SakaJuntos!</CardTitle>
          <CardDescription className="text-base">
            A sua plataforma para compras inteligentes em Angola. Junte-se, contribua e receba produtos a preços incríveis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="text-left space-y-4">
                {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-4">
                        <benefit.icon className="h-5 w-5 text-green-600 mt-1 flex-shrink-0"/>
                        <div>
                            <h4 className="font-semibold">{benefit.title}</h4>
                            <p className="text-sm text-muted-foreground">{benefit.description}</p>
                        </div>
                    </div>
                ))}
            </div>
            <Separator />
            <div className="space-y-4">
               <h3 className="text-lg font-semibold">Leve a experiência completa!</h3>
              
              {renderInstallButton()}

               <p className="text-xs text-muted-foreground">Instalar a aplicação adiciona um atalho ao seu ecrã inicial para um acesso mais rápido e notificações em tempo real.</p>
               {!deferredPrompt && !isInstalled && (
                 <p className="text-xs text-muted-foreground">O botão de instalação ficará disponível em instantes. Enquanto isso, que tal <Link href="/login?mode=register" className="underline font-semibold">criar a sua conta</Link> e explorar?</p>
               )}
               <p className="text-xs text-muted-foreground">Se o botão não funcionar, procure a opção "Adicionar ao ecrã principal" no menu do seu navegador.</p>
            </div>
        </CardContent>
         <CardFooter className="flex-col gap-4 pt-6">
            <Separator/>
            <Button asChild variant="link">
                <Link href="/login">Já tem conta? Entrar</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
