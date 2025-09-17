
'use client'

import { useEffect } from 'react';
import FocusFlowApp from '@/components/app/focus-flow-app';
import { FocusStoreProvider } from '@/contexts/focus-store-context';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export default function FocusPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  if (loading || !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <FocusStoreProvider>
      <FocusFlowApp />
    </FocusStoreProvider>
  );
}
