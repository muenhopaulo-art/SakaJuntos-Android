'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LojistaPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the products page as the default dashboard view
    router.replace('/lojista/produtos');
  }, [router]);

  return null; // Render nothing while redirecting
}
