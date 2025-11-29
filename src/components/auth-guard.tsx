
'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { Logo } from './Logo';
import { getUser, User } from '@/services/user-service';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';
import { Package } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';


const CartProvider = dynamic(
  () => import('@/contexts/cart-provider-client'),
  { 
    ssr: false
  }
);

// Allow access to the main page for the auth logic to handle roles
const publicPaths = ['/login', '/seed'];
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
  const { toast } = useToast();
  const [lastBackPress, setLastBackPress] = useState(0);

  // Back button exit logic for Capacitor/Android
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
        CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          if (pathname === '/') {
            const timeNow = new Date().getTime();
            if (timeNow - lastBackPress < 2000) {
              CapacitorApp.exitApp();
            } else {
              setLastBackPress(timeNow);
              toast({
                description: "Clique novamente para sair.",
              });
            }
          } else {
            router.back();
          }
        });
    }

    return () => {
      // Clean up the listener when the component unmounts
      if (Capacitor.isNativePlatform()) {
        CapacitorApp.removeAllListeners();
      }
    };
  }, [pathname, lastBackPress, toast, router]);


  useEffect(() => {
    const fetchAppUser = async () => {
      if (user) {
        try {
          const profile = await getUser(user.uid);
          setAppUser(profile);
          // Register for push notifications once we have the user
          registerForPushNotifications();
        } catch (error) {
          console.error("Error fetching app user, signing out", error);
          auth.signOut();
        }
      }
      setIsAppUserLoading(false);
    };

    const registerForPushNotifications = async () => {
        // Only run this logic on native platforms
        if (!Capacitor.isNativePlatform()) {
            return;
        }

        try {
            let permStatus = await PushNotifications.checkPermissions();

            if (permStatus.receive === 'prompt') {
                permStatus = await PushNotifications.requestPermissions();
            }

            if (permStatus.receive !== 'granted') {
                throw new Error('User denied permissions!');
            }

            await PushNotifications.register();

            // Example listeners for when notifications are received
            PushNotifications.addListener('pushNotificationReceived', notification => {
                console.log('Push notification received: ', notification);
                // Optionally show a local notification or update UI
            });

            PushNotifications.addListener('pushNotificationActionPerformed', notification => {
                console.log('Push notification action performed', notification.actionId, notification.inputValue);
                const link = notification.notification.data.link;
                if (link) {
                    router.push(link);
                }
            });

        } catch (e) {
            console.error('Error with push notifications', e);
        }
    }

    if (!loading) {
      fetchAppUser();
    }
  }, [user, loading, router]);


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
    
    if (user && appUser) {
        // Redirect logged-in users from public pages to their respective dashboards
        if (pathIsPublic) { 
             let destination = '/'; // Default for client/courier
             if (appUser.role === 'admin') destination = '/admin';
             else if (appUser.role === 'lojista') destination = '/lojista';
             
             router.replace(destination); // Use replace to prevent back navigation to login
             return;
        }

        // If an admin tries to access non-admin pages, redirect them to admin dashboard
        if (appUser.role === 'admin' && !pathIsAdmin) {
            router.replace('/admin');
            return;
        }
        
        // If a courier tries to access any protected dashboard, redirect them.
        if (appUser.role === 'courier' && (pathIsAdmin || pathIsLojista)) {
            router.replace('/');
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
