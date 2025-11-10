'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Monitor, CheckCircle, Share, MoreVertical } from 'lucide-react';
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

  useEffect(() => {
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
    } else {
      console.log('Utilizador recusou a instalação do PWA');
    }

    // O prompt só pode ser usado uma vez.
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const benefits = [
    "Acesso rápido a partir do ecrã inicial",
    "Experiência de utilização mais rápida e fluida",
    "Funcionalidades offline para quando não tem internet",
    "Notificações diretamente no seu dispositivo"
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto text-center">
        <Download className="mx-auto h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-bold tracking-tight font-headline">Instale o SakaJuntos</h1>
        <p className="text-xl text-muted-foreground mt-2">
          Leve a nossa aplicação para o seu ecrã inicial e desfrute de uma experiência mais rápida e integrada.
        </p>
      </div>

      <Card className="max-w-3xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Vantagens de Instalar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-muted-foreground">{benefit}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator className="my-12" />

      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8 font-headline">Como Instalar</h2>
        <div className="grid md:grid-cols-2 gap-8">
            {/* Desktop Instructions */}
            <Card>
                <CardHeader>
                <div className="flex items-center gap-3">
                    <Monitor className="h-8 w-8 text-primary" />
                    <CardTitle>No Computador</CardTitle>
                </div>
                <CardDescription>(Chrome, Edge, etc.)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>No seu computador, pode instalar a aplicação diretamente a partir do navegador.</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                        <li>Procure pelo ícone de instalação <Download className="inline h-4 w-4" /> na barra de endereço.</li>
                        <li>Clique nele e depois em "Instalar".</li>
                        <li>A aplicação será adicionada ao seu ambiente de trabalho ou menu de aplicações.</li>
                    </ol>
                     {isInstallable && (
                        <Button className="w-full" onClick={handleInstallClick}>
                            <Download className="mr-2 h-4 w-4" />
                            Instalar Agora
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Android Instructions */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                         <Smartphone className="h-8 w-8 text-primary" />
                        <CardTitle>No Android</CardTitle>
                    </div>
                    <CardDescription>(Chrome)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>Adicione facilmente a aplicação ao seu ecrã inicial para um acesso rápido.</p>
                     <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                        <li>Abra o menu do Chrome (os três pontos <MoreVertical className="inline h-4 w-4" />).</li>
                        <li>Selecione a opção "Instalar aplicação" ou "Adicionar ao ecrã principal".</li>
                        <li>Confirme a adição na janela que aparecer.</li>
                    </ol>
                     {isInstallable && (
                        <Button className="w-full" onClick={handleInstallClick}>
                            <Download className="mr-2 h-4 w-4" />
                            Instalar Agora
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* iOS Instructions */}
             <Card className="md:col-span-2">
                <CardHeader>
                     <div className="flex items-center gap-3">
                         <Smartphone className="h-8 w-8 text-primary" />
                        <CardTitle>No iPhone / iPad</CardTitle>
                    </div>
                    <CardDescription>(Safari)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>O processo no iOS é um pouco diferente, mas igualmente simples.</p>
                     <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                        <li>Abra este site no navegador **Safari**.</li>
                        <li>Toque no botão "Partilhar" (o ícone com uma seta a apontar para cima <Share className="inline h-4 w-4" />).</li>
                        <li>Deslize para cima e procure pela opção "Adicionar ao ecrã principal".</li>
                        <li>Escolha um nome para o atalho e confirme.</li>
                    </ol>
                </CardContent>
            </Card>

        </div>
      </div>
    </div>
  );
}
