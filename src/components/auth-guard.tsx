'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader } from 'lucide-react';
import { Logo } from './Logo';

// Allow access to the main page for the auth logic to handle roles
const publicPaths = ['/login', '/seed'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      const pathIsPublic = publicPaths.includes(pathname);

      // If user is not logged in and not on a public path, redirect to login
      if (!user && !pathIsPublic) {
        router.push('/login');
      }
      
      // If user is logged in and on the login page, redirect to home
      if (user && pathIsPublic) {
        router.push('/');
      }
    }
  }, [user, loading, router, pathname]);

  // Show a loading screen while auth state is being determined,
  // but allow access to public paths and the home page immediately if not loading.
  if (loading && !publicPaths.includes(pathname)) {
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
  
  return <>{children}</>;
}
