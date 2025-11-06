
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
  
  return null; // No actions needed for now as verification is removed
}
