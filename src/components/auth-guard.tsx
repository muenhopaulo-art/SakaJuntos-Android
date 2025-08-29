
'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from './Logo';
import { getUser, User } from '@/services/user-service';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';
import { OrdersSheet } from '../app/orders-sheet';

// Allow access to the main page for the auth logic to handle roles
const publicPaths = ['/login', '/seed'];
const adminPaths = ['/admin', '/admin/orders', '/admin/users', '/admin/products'];
const lojistaPaths = ['/lojista', '/lojista/produtos', '/lojista/pedidos'];

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
    const pathIsLojista = lojistaPaths.some(p => pathname.startsWith(p));

    // If user is not logged in and not on a public path, redirect to login
    if (!user && !pathIsPublic) {
      router.push('/login');
      return;
    }
    
    if (user) {
        // Redirect logged-in users from public pages to their respective dashboards
        if (pathIsPublic) {
             if (appUser?.role === 'admin') router.push('/admin');
             else if (appUser?.role === 'lojista') router.push('/lojista');
             else router.push('/');
             return;
        }

        // If a non-admin tries to access admin pages, redirect them
        if (appUser?.role !== 'admin' && pathIsAdmin) {
            router.push('/dashboard');
            return;
        }

        // If an admin is on a non-admin page, redirect them to admin
        if (appUser?.role === 'admin' && !pathIsAdmin) {
            router.push('/admin');
            return;
        }
        
        // If a non-lojista tries to access lojista pages, redirect them
        if (appUser?.role !== 'lojista' && pathIsLojista) {
            router.push('/dashboard');
            return;
        }

        // If user is a pending/rejected lojista, restrict access to other pages
        if (appUser?.wantsToBecomeLojista && appUser.verificationStatus !== 'approved' && pathname !== '/dashboard') {
            router.push('/dashboard');
            return;
        }
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
  const pathIsLayoutLess = adminPaths.some(p => pathname.startsWith(p)) || lojistaPaths.some(p => pathname.startsWith(p));
  const pathIsGroupDetails = /^\/grupos\/[^/]+$/.test(pathname);


  // Render children without the main layout for public, admin and lojista pages
  if (pathIsPublic || pathIsLayoutLess) {
    return <>{children}</>;
  }

  // Render children inside the main layout for all other authenticated pages
  return (
     <div className="relative flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        {user && !pathIsGroupDetails && (
          <div className="fixed bottom-4 right-4 z-50">
            <OrdersSheet />
          </div>
        )}
    </div>
  );
}
