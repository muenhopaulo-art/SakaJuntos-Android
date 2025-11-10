
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Separator } from '@/components/ui/separator';

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
  const [isInstallable, setIsInstallable] = useState(false);
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
      setIsInstallable(true);
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
    setIsInstallable(false);
  };

  const benefits = [
      {
          icon: ArrowRight,
          title: "Acesso Rápido",
          description: "Inicie o SakaJuntos diretamente do seu ecrã principal, como uma aplicação nativa."
      },
      {
          icon: ArrowRight,
          title: "Melhor Desempenho",
          description: "Desfrute de uma experiência mais rápida e fluida, otimizada para o seu dispositivo."
      },
      {
          icon: ArrowRight,
          title: "Notificações em Tempo Real",
          description: "Receba alertas sobre o estado dos seus pedidos, mensagens de grupo e promoções."
      },
  ]

  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-lg text-center shadow-lg">
        <CardHeader>
           <Logo className="mx-auto h-20" />
          <CardTitle className="text-3xl font-bold tracking-tight font-headline mt-4">Tenha o SakaJuntos Sempre à Mão</CardTitle>
          <CardDescription>
            Junte-se, contribua e receba. A sua plataforma para compras inteligentes em grupo e individuais, agora na palma da sua mão.
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
            <div>
              {isInstallable && (
                <Button size="lg" className="w-full" onClick={handleInstallClick}>
                  <Download className="mr-2 h-5 w-5" />
                  Instalar Aplicação
                </Button>
              )}
              {isInstalled && (
                 <Button size="lg" className="w-full" disabled>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Aplicação Já Instalada
                </Button>
              )}
              {!isInstallable && !isInstalled && (
                 <p className="text-sm text-muted-foreground p-4 bg-muted rounded-md">
                  Para instalar, abra esta página no seu navegador. No iOS (iPhone), use o menu "Partilhar" e depois "Adicionar ao Ecrã Principal".
                </p>
              )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
