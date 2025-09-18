
'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signUp: typeof createUserWithEmailAndPassword;
  signIn: typeof signInWithEmailAndPassword;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let isMounted = true;

    const handleAuth = async () => {
      // First, process any pending redirect result.
      try {
        await getRedirectResult(auth);
        // If the user signed in via redirect, onAuthStateChanged will now
        // fire with the correct user.
      } catch (error) {
        console.error("Error processing redirect result:", error);
      }

      // Now, set up the listener. It will fire with the user from the redirect
      // or the existing session.
      unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        if (isMounted) {
          setUser(fbUser);
          if (fbUser) {
            // User is logged in, navigate them to the main app.
            // Using replace so they don't get stuck in a login loop on back button.
            router.replace('/focus');
          }
          setLoading(false);
        }
      });
    };

    handleAuth();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
    // This effect should only run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const signUp = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const signIn = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // After signing out, redirect to the homepage.
      router.push('/');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
