'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader } from 'lucide-react';

const publicPaths = ['/login'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      const pathIsPublic = publicPaths.includes(pathname);

      // If the user is not logged in and the path is not public, redirect to login
      if (!user && !pathIsPublic) {
        router.push('/login');
      }
      
      // If the user is logged in and tries to access login page, redirect to home
      if (user && pathIsPublic) {
        router.push('/');
      }
    }
  }, [user, loading, router, pathname]);

  if (loading || (!user && !publicPaths.includes(pathname))) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader className="h-10 w-10 animate-spin" />
      </div>
    );
  }
  
  // if user is logged in, or the path is public, show the children
  return <>{children}</>;
}
