'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { AuthForm } from '@/components/auth-form';
import { Dashboard } from '@/components/Dashboard';
import { AdminDashboard } from '@/components/AdminDashboard';
import { LojistaDashboard } from '@/components/LojistaDashboard';
import { getUser, User } from '@/services/user-service';
import { auth } from '@/lib/firebase';
import { Logo } from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';
import { LojistaOnboarding } from '@/components/LojistaOnboarding';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const appUser = await getUser(firebaseUser.uid);
          setUser(appUser);
        } catch (error) {
            console.error("Failed to fetch user profile for an authenticated user:", error);
            toast({
                variant: "destructive",
                title: "Erro ao Carregar Perfil",
                description: "Não foi possível carregar os seus dados. Por favor, tente novamente mais tarde.",
            });
            setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [toast]);

  const handleLogout = async () => {
    setLoading(true);
    await auth.signOut();
  }
  
  if (loading) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8 bg-background">
        <div className="relative flex items-center justify-center w-32 h-32">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse"></div>
          <Logo className="w-20 h-20 text-primary animate-pulse" />
        </div>
        <p className="mt-6 text-lg font-semibold text-muted-foreground animate-pulse">A carregar...</p>
      </main>
    )
  }

  // AuthGuard now handles redirection, so this direct rendering is safer.
  // We don't need a top-level check for user, as the AuthGuard will redirect.
  // The logic inside decides what to show to an authenticated user.
  const renderContent = () => {
    if (!user) {
        // This case should ideally not be hit if AuthGuard is working correctly on this page,
        // but as a fallback, we can show the login form.
        return <AuthForm />;
    }

    switch (user.role) {
      case 'admin':
        return <AdminDashboard user={user} onLogout={handleLogout} />;
      case 'lojista':
        if (user.storeStatus === 'approved') {
          return <LojistaDashboard user={user} onLogout={handleLogout} />;
        }
        return <LojistaOnboarding user={user} onLogout={handleLogout} />;
      case 'client':
      default:
        if (user.wantsToBeLojista) {
          return <LojistaOnboarding user={user} onLogout={handleLogout} />;
        }
        return <Dashboard user={user} onLogout={handleLogout} />;
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-6xl mx-auto">
        {renderContent()}
      </div>
    </main>
  );
}
