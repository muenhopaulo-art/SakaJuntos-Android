
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Smartphone, Copy, Hourglass } from 'lucide-react';
import type { PromotionPayment } from '@/lib/types';

export function PaymentInstructionsDialog({ open, onOpenChange, paymentData }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentData: PromotionPayment | null;
}) {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;

    setTimeLeft(300);
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          onOpenChange(false);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, onOpenChange]);
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "O texto foi copiado para a área de transferência." });
  };

  if (!paymentData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
            <div className="rounded-full bg-primary/10 p-3 w-fit">
                <Smartphone className="h-6 w-6 text-primary"/>
            </div>
          <DialogTitle className="text-xl">Instruções de Pagamento</DialogTitle>
          <DialogDescription>
            Para finalizar, siga os passos abaixo no seu Multicaixa Express.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 text-center">
            <div className="rounded-lg bg-muted p-3">
                <p className="text-sm text-muted-foreground">Faça o pagamento via Express neste número:</p>
                <p className="text-2xl font-bold tracking-widest">{paymentData.paymentPhoneNumber}</p>
            </div>
             <div className="rounded-lg bg-muted p-3">
                <p className="text-sm text-muted-foreground">Valor a Pagar:</p>
                <p className="text-2xl font-bold">{new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(paymentData.amount)}</p>
            </div>
             <div className="rounded-lg bg-muted p-3">
                <p className="text-sm text-muted-foreground">Insira o teu nome no "Nome de Ordenante":</p>
                <p className="text-lg font-bold">{paymentData.userName}</p>
            </div>
            <div className="rounded-lg border-2 border-dashed border-primary/50 bg-primary/10 p-4">
                 <p className="text-sm text-muted-foreground">Insira este Código na "Mensagem Opcional":</p>
                 <div className="flex items-center justify-center gap-2">
                    <p className="text-2xl font-bold font-mono tracking-widest text-primary">{paymentData.referenceCode}</p>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(paymentData.referenceCode)}>
                        <Copy className="h-5 w-5"/>
                    </Button>
                 </div>
            </div>
            <div className="rounded-lg bg-yellow-100 text-yellow-800 p-3 text-sm flex items-center justify-center gap-2">
                <Hourglass className="h-4 w-4"/>
                <span>Aguardando Validação. O pedido expira em {formatTime(timeLeft)}.</span>
            </div>
        </div>
        <DialogFooter>
            <Button className="w-full" onClick={() => onOpenChange(false)}>Entendido</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
