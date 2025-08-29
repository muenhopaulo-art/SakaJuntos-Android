
'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from './Logo';
import { getUser, User } from '@/services/user-service';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';

// Allow access to the main page for the auth logic to handle roles
const publicPaths = ['/login', '/seed'];
const adminPaths = ['/admin', '/admin/orders', '/admin/users'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, loading] = useAuthState(auth);
  const [appUser, setAppUser] = useState<User | null>(null);
  const [isAppUserLoading, setIsAppUserLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchAppUser = async () => {
      if (user) {
        try {
          const profile = await getUser(user.uid);
          setAppUser(profile);
        } catch (error) {
          console.error("Error fetching app user, signing out", error);
          auth.signOut();
        }
      }
      setIsAppUserLoading(false);
    };

    if (!loading) {
      fetchAppUser();
    }
  }, [user, loading]);


  useEffect(() => {
    if (loading || isAppUserLoading) return; // Wait for both auth and user profile to load

    const pathIsPublic = publicPaths.includes(pathname);
    const pathIsAdmin = adminPaths.some(p => pathname.startsWith(p));

    // If user is not logged in and not on a public path, redirect to login
    if (!user && !pathIsPublic) {
      router.push('/login');
      return;
    }
    
    // If user is logged in and on a public path, redirect to home
    if (user && pathIsPublic) {
      router.push('/');
      return;
    }

    // If user is a pending/rejected lojista, restrict access to other pages
    if (appUser && appUser.wantsToBecomeLojista && appUser.verificationStatus !== 'approved') {
        if (pathname !== '/dashboard') {
            router.push('/dashboard');
        }
    }

    // If a non-admin tries to access admin pages, redirect them
    if (appUser && appUser.role !== 'admin' && pathIsAdmin) {
      router.push('/dashboard'); // Or show an unauthorized page
    }


  }, [user, appUser, loading, isAppUserLoading, router, pathname]);

  // Show a loading screen while auth state is being determined,
  // but allow access to public paths immediately if not loading.
  if ((loading || isAppUserLoading) && !publicPaths.includes(pathname)) {
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
  
  const pathIsPublic = publicPaths.includes(pathname);
  const pathIsAdmin = adminPaths.some(p => pathname.startsWith(p));

  // Render children without the main layout for public and admin pages
  if (pathIsPublic || pathIsAdmin) {
    return <>{children}</>;
  }

  // Render children inside the main layout for all other authenticated pages
  return (
     <div className="relative flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
    </div>
  );
}
