'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X } from 'lucide-react';
import { updateUserVerificationStatus } from './actions';
import type { User } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface UserActionsProps {
  user: User;
}

export function UserActions({ user }: UserActionsProps) {
  const [loadingAction, setLoadingAction] = useState<'approve' | 'reject' | null>(null);
  const { toast } = useToast();

  const handleUpdateStatus = async (action: 'approve' | 'reject') => {
    setLoadingAction(action);
    const result = await updateUserVerificationStatus(user.uid, action);
    setLoadingAction(null);

    if (result.success) {
      toast({ title: 'Sucesso!', description: `O utilizador ${user.name} foi ${action === 'approve' ? 'aprovado' : 'rejeitado'}.` });
    } else {
      toast({ variant: 'destructive', title: 'Erro!', description: result.message });
    }
  };
  
  if (user.wantsToBecomeLojista && user.verificationStatus === 'pending') {
    return (
      <div className="flex gap-2 justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700" disabled={!!loadingAction}>
              {loadingAction === 'approve' ? <Loader2 className="animate-spin" /> : <Check />}
              Aprovar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Aprovar Lojista?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem a certeza que deseja aprovar {user.name} como lojista? A sua função será alterada e terá acesso ao painel de lojista.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleUpdateStatus('approve')}>Aprovar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700" disabled={!!loadingAction}>
              {loadingAction === 'reject' ? <Loader2 className="animate-spin" /> : <X />}
              Rejeitar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rejeitar Pedido?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem a certeza que deseja rejeitar o pedido de verificação de {user.name}? Esta ação pode ser revertida manualmente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleUpdateStatus('reject')} className="bg-destructive hover:bg-destructive/90">Rejeitar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return null; // No actions needed for other users at the moment
}
