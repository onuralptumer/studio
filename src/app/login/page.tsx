
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AuthForm } from '@/components/app/auth-form';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/focus');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return <AuthForm mode="login" />;
}
