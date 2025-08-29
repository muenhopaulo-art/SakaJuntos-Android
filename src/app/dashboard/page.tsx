
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
    if (authLoading) return;

    if (!user) {
        router.push('/login');
        return;
    }

    getUser(user.uid)
        .then(profile => {
            setAppUser(profile);
        })
        .catch(error => {
            console.error("Failed to fetch user profile, logging out.", error);
            auth.signOut();
        })
        .finally(() => {
            setLoading(false);
        });

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
    // A loading screen or null is returned while useEffect handles the redirect.
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
         <div className="relative flex items-center justify-center w-32 h-32">
           <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse"></div>
           <Logo className="w-20 h-20 text-primary animate-pulse" />
         </div>
         <p className="mt-6 text-lg font-semibold text-muted-foreground animate-pulse">A redirecionar...</p>
       </div>
     );
  }
  
  const renderDashboard = () => {
    // Prioritize admin and lojista roles
    if (appUser.role === 'admin') {
        return <AdminDashboard user={appUser} onLogout={handleLogout} />;
    }

    if (appUser.role === 'lojista') {
        // If they are a lojista, they must be approved to see the dashboard.
        // Other statuses are handled by the onboarding component.
        if (appUser.verificationStatus === 'approved') {
            return <LojistaDashboard user={appUser} onLogout={handleLogout} />;
        }
        // If for some reason they are lojista but not approved, show onboarding.
        return <LojistaOnboarding user={appUser} onLogout={handleLogout} />;
    }

    // Handle client roles and those in the process of becoming a lojista
    if (appUser.role === 'client') {
        if (appUser.wantsToBecomeLojista) {
            return <LojistaOnboarding user={appUser} onLogout={handleLogout} />;
        }
        return <Dashboard user={appUser} onLogout={handleLogout} />;
    }

    // Fallback to the default client dashboard
    return <Dashboard user={appUser} onLogout={handleLogout} />;
  };


  return (
     <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <div className="w-full max-w-2xl">
       {renderDashboard()}
      </div>
    </div>
  );
}
