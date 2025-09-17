
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
    // First, handle the redirect result from Google Sign-In.
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          // A user has successfully signed in via redirect.
          // The onAuthStateChanged listener below will handle setting the user and redirecting.
          // We don't need to explicitly setUser here, as onAuthStateChanged will fire.
        }
      })
      .catch((error) => {
        // Handle Errors here.
        console.error("Error getting redirect result: ", error);
      })
      .finally(() => {
        // After processing the redirect, set up the auth state listener.
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          setUser(user);
          setLoading(false);
          if (user) {
            router.push('/focus');
          }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
      });
  }, [router]);

  const signUp = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  const signIn = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
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
