'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Logo } from '@/components/Logo';

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

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Previne que o Chrome mostre o prompt automaticamente
      e.preventDefault();
      // Guarda o evento para que possa ser acionado mais tarde
      setDeferredPrompt(e as BeforeInstallaprocurar na web
promptEvent);
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
    } else {
      console.log('Utilizador recusou a instalação do PWA');
    }

    // O prompt só pode ser usado uma vez.
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
           <Logo className="mx-auto h-20" />
          <CardTitle className="text-3xl font-bold tracking-tight font-headline mt-4">Instale o SakaJuntos</CardTitle>
          <CardDescription>
            Leve a nossa aplicação para o seu ecrã inicial e desfrute de uma experiência mais rápida e integrada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isInstallable ? (
            <Button size="lg" className="w-full" onClick={handleInstallClick}>
              <Download className="mr-2 h-5 w-5" />
              Instalar Aplicação
            </Button>
          ) : (
             <p className="text-sm text-muted-foreground">
              A aplicação já está instalada ou o seu navegador não suporta a instalação. No iOS, use o menu "Partilhar" do Safari.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
