'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { getUser, User } from '@/services/user-service';
import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Dashboard } from '@/components/Dashboard';
import { AdminDashboard } from '@/components/AdminDashboard';
import { LojistaDashboard } from '@/components/LojistaDashboard';
import { LojistaOnboarding } from '@/components/LojistaOnboarding';

export default function DashboardPage() {
  const [user, authLoading] = useAuthState(auth);
  const [appUser, setAppUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      if (user) {
        try {
          const profile = await getUser(user.uid);
          setAppUser(profile);
        } catch (error) {
          console.error("Failed to fetch user profile, logging out.", error);
          auth.signOut();
        }
      }
      setLoading(false);
    };

    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else {
        fetchUser();
      }
    }
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    await auth.signOut();
    // AuthGuard will handle the redirect to /login
  };
  
  if (authLoading || loading) {
     return (
       <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <div className="relative flex items-center justify-center w-32 h-32">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse"></div>
          <Logo className="w-20 h-20 text-primary animate-pulse" />
        </div>
        <p className="mt-6 text-lg font-semibold text-muted-foreground animate-pulse">A carregar...</p>
      </div>
    );
  }

  if (!user || !appUser) {
    // This case should be handled by AuthGuard, but as a fallback:
    router.push('/login');
    return null;
  }
  
  const renderDashboard = () => {
    switch (appUser.role) {
      case 'admin':
        return <AdminDashboard user={appUser} onLogout={handleLogout} />;
      case 'lojista':
        if (appUser.storeStatus === 'approved') {
          return <LojistaDashboard user={appUser} onLogout={handleLogout} />;
        }
        return <LojistaOnboarding user={appUser} onLogout={handleLogout} />;
      case 'client':
      default:
        // Client can also be in the process of becoming a lojista
        if (appUser.wantsToBeLojista) {
            return <LojistaOnboarding user={appUser} onLogout={handleLogout} />;
        }
        return <Dashboard user={appUser} onLogout={handleLogout} />;
    }
  };


  return (
     <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <div className="w-full max-w-2xl">
       {renderDashboard()}
      </div>
    </div>
  );
}
