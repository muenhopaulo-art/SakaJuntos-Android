
'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from './Logo';
import { getUser, User } from '@/services/user-service';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';
import { Package } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const CartProvider = dynamic(
  () => import('@/contexts/cart-provider-client'),
  { 
    ssr: false
  }
);

// Allow access to the main page for the auth logic to handle roles
const publicPaths = ['/login', '/seed', '/download'];
const adminPaths = ['/admin', '/admin/orders', '/admin/products', '/admin/users'];
const lojistaPaths = ['/lojista', '/lojista/produtos', '/lojista/pedidos', '/lojista/agendamentos', '/lojista/entregadores', '/lojista/perfil'];
// Client-facing paths that are not dashboards
const clientPaths = ['/', '/minishopping', '/grupos', '/cart', '/my-orders'];


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
    const pathIsProductDetails = /^\/produto\/[^/]+$/.test(pathname);
    const pathIsGroupDetails = /^\/grupos\/[^/]+$/.test(pathname);

    // If user is not logged in and not on a public path, redirect to login
    if (!user && !pathIsPublic) {
      router.push('/login');
      return;
    }
    
    if (user && appUser) {
        // Redirect logged-in users from public pages to their respective dashboards
        if (pathIsPublic && pathname !== '/download') { // Allow logged-in users to see download page
             if (appUser.role === 'admin') router.push('/admin');
             else if (appUser.role === 'lojista') router.push('/lojista');
             else if (appUser.role === 'client') router.push('/'); // Clients should go to homepage
             else router.push('/'); // Fallback for couriers
             return;
        }

        // If an admin tries to access non-admin pages, redirect them to admin dashboard
        if (appUser.role === 'admin' && !pathIsAdmin) {
            router.push('/admin');
            return;
        }
        
        // If a courier tries to access any protected dashboard, redirect them.
        if (appUser.role === 'courier' && (pathIsAdmin || pathIsLojista)) {
            router.push('/');
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
  
  const pathIsLayoutLess = publicPaths.includes(pathname) || adminPaths.some(p => pathname.startsWith(p)) || lojistaPaths.some(p => pathname.startsWith(p));
  const pathIsGroupDetails = /^\/grupos\/[^/]+$/.test(pathname);

  // The CartProvider must wrap all children that might need access to the cart.
  const content = <>{children}</>;

  // Render children without the main layout for public, admin and lojista pages
  if (pathIsLayoutLess) {
    return <CartProvider>{content}</CartProvider>;
  }

  // Render children inside the main layout for all other authenticated pages
  return (
     <CartProvider>
      <div className="relative flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{content}</main>
          <SiteFooter />
          {user && !pathIsGroupDetails && (
            <div className="fixed bottom-4 right-4 z-50">
              <Button asChild variant="outline" size="icon" className="relative ml-2 rounded-full h-14 w-14 shadow-lg">
                  <Link href="/my-orders">
                      <Package className="h-6 w-6" />
                      <span className="sr-only">Meus Pedidos</span>
                  </Link>
              </Button>
            </div>
          )}
      </div>
     </CartProvider>
  );
}
