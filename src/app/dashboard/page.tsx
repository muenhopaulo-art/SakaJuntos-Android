
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // This page is obsolete. The user's role determines if they go to /admin or /lojista.
    // We redirect to /lojista as the new default for all non-admin users.
    router.replace('/lojista');
  }, [router]);

  return null; // Render nothing while redirecting
}
