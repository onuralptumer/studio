
'use client';

import React, { createContext, useReducer, useEffect, useState, ReactNode, useCallback } from 'react';
import { doc, getDoc, setDoc, collection, query, onSnapshot, Unsubscribe, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { z } from 'zod';
import { format, isToday, isYesterday, parseISO } from 'date-fns';


// Data Structures & Zod Schemas for validation
const TaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['attempted', 'completed']),
  date: z.string(), // Kept as string, assuming ISO format
  duration: z.number(),
});
export type Task = z.infer<typeof TaskSchema>;

const SettingsSchema = z.object({
  duration: z.number().min(1).max(120),
});
export type Settings = z.infer<typeof SettingsSchema>;

const UserProfileSchema = z.object({
    plan: z.enum(['free', 'pro']).default('free'),
    settings: SettingsSchema.default({ duration: 25 }),
    streak: z.number().default(0),
    lastCompletedDate: z.string().nullable().default(null),
});
type UserProfile = z.infer<typeof UserProfileSchema>;

type AppState = 'idle' | 'focusing' | 'paused' | 'finished';

const SessionStateSchema = z.object({
  appState: z.enum(['idle', 'focusing', 'paused', 'finished']),
  currentTask: z.string(),
  sessionEndTime: z.number().nullable(),
  remainingTimeOnPause: z.number().nullable(),
});

type SessionState = z.infer<typeof SessionStateSchema>;

export type FocusState = UserProfile & {
  tasks: Task[];
  session: SessionState;
};


// Actions
type Action =
  | { type: 'SET_PROFILE'; payload: UserProfile }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'START_FOCUS'; payload: { taskName: string; duration: number } }
  | { type: 'PAUSE_FOCUS' }
  | { type: 'RESUME_FOCUS' }
  | { type: 'SET_STREAK_DATA'; payload: { streak: number, lastCompletedDate: string | null }}
  | { type: 'RESET_SESSION' }
  | { type: 'RESET_SESSION_AFTER_FINISH' }
  | { type: 'SET_SETTINGS'; payload: Settings }
  | { type: 'SET_SESSION'; payload: SessionState };


const initialState: FocusState = {
  tasks: [],
  streak: 0,
  lastCompletedDate: null,
  settings: {
    duration: 25,
  },
  plan: 'free',
  session: {
    appState: 'idle',
    currentTask: '',
    sessionEndTime: null,
    remainingTimeOnPause: null,
  },
};

const focusReducer = (state: FocusState, action: Action): FocusState => {
  switch (action.type) {
    case 'SET_PROFILE':
      return { ...state, ...action.payload };
    case 'SET_TASKS':
        return { ...state, tasks: action.payload };

    case 'START_FOCUS': {
      const { taskName, duration } = action.payload;
      return {
        ...state,
        session: {
          ...initialState.session,
          appState: 'focusing',
          currentTask: taskName,
          sessionEndTime: Date.now() + duration * 60 * 1000,
        },
      };
    }

    case 'PAUSE_FOCUS': {
      if (state.session.appState !== 'focusing' || !state.session.sessionEndTime) return state;
      const remainingTime = (state.session.sessionEndTime - Date.now()) / 1000;
      return {
        ...state,
        session: {
          ...state.session,
          appState: 'paused',
          remainingTimeOnPause: Math.max(0, remainingTime),
        },
      };
    }

    case 'RESUME_FOCUS': {
      if (state.session.appState !== 'paused' || state.session.remainingTimeOnPause === null) return state;
      const newSessionEndTime = Date.now() + state.session.remainingTimeOnPause * 1000;
      return {
        ...state,
        session: {
          ...state.session,
          appState: 'focusing',
          sessionEndTime: newSessionEndTime,
          remainingTimeOnPause: null,
        },
      };
    }
    
    case 'SET_STREAK_DATA':
        return {
            ...state,
            streak: action.payload.streak,
            lastCompletedDate: action.payload.lastCompletedDate,
        };

    case 'RESET_SESSION':
        return { ...state, session: initialState.session };

    case 'RESET_SESSION_AFTER_FINISH':
      return { 
        ...state, 
        session: {
          ...state.session,
          appState: 'finished',
        }
      };

    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    
    case 'SET_SESSION':
      return { ...state, session: action.payload };

    default:
      return state;
  }
};

type FocusStoreContextType = {
  state: FocusState;
  dispatch: React.Dispatch<Action>;
  isInitialized: boolean;
};

export const FocusStoreContext = createContext<FocusStoreContextType | undefined>(undefined);

const LOCAL_STORAGE_SESSION_KEY = 'oneTaskNow.session';

export const FocusStoreProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(focusReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  const saveProfileToFirestore = useCallback(async (stateToSave: FocusState) => {
    if (!user) return;
    try {
      const userProfileData: UserProfile = {
        plan: stateToSave.plan,
        settings: stateToSave.settings,
        streak: stateToSave.streak,
        lastCompletedDate: stateToSave.lastCompletedDate,
      };

      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, userProfileData, { merge: true });
    } catch (error) {
      console.error("Failed to save profile to Firestore:", error);
    }
  }, [user]);

  // Effect to load state from Firestore and session from localStorage
  useEffect(() => {
    if (!user) {
      dispatch({ type: 'SET_PROFILE', payload: initialState });
      dispatch({ type: 'SET_TASKS', payload: [] });
      setIsInitialized(true);
      return;
    }

    let profileUnsubscribe: Unsubscribe | undefined;
    let tasksUnsubscribe: Unsubscribe | undefined;

    const loadState = async () => {
      // Load session from localStorage
      try {
        const storedSession = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
        if (storedSession) {
          const parsedSession = SessionStateSchema.safeParse(JSON.parse(storedSession));
          if (parsedSession.success) {
             // If session ended while tab was closed, move to finished state
            if (parsedSession.data.appState === 'focusing' && parsedSession.data.sessionEndTime && parsedSession.data.sessionEndTime < Date.now()) {
                dispatch({ type: 'RESET_SESSION_AFTER_FINISH' });
            } else {
                dispatch({ type: 'SET_SESSION', payload: parsedSession.data });
            }
          }
        }
      } catch (e) {
        console.error("Failed to load session from localStorage", e);
        localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
      }


      // Listen to user profile
      const profileDocRef = doc(db, 'users', user.uid);
      profileUnsubscribe = onSnapshot(profileDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const parseResult = UserProfileSchema.safeParse(docSnap.data());
          if (parseResult.success) {
            dispatch({ type: 'SET_PROFILE', payload: parseResult.data });
          } else {
            console.error("Zod validation failed for profile:", parseResult.error);
            saveProfileToFirestore(initialState);
            dispatch({ type: 'SET_PROFILE', payload: initialState });
          }
        } else {
          saveProfileToFirestore(initialState);
        }
        setIsInitialized(true);
      });

      // Listen to tasks subcollection
      const tasksQuery = query(collection(db, 'users', user.uid, 'tasks'));
      tasksUnsubscribe = onSnapshot(tasksQuery, (querySnapshot) => {
        const tasks: Task[] = [];
        querySnapshot.forEach((doc) => {
          const parseResult = TaskSchema.safeParse({ id: doc.id, ...doc.data() });
          if (parseResult.success) {
            tasks.push(parseResult.data);
          } else {
            console.error("Zod validation failed for a task:", parseResult.error);
          }
        });
        dispatch({ type: 'SET_TASKS', payload: tasks });
      });
    };
    
    loadState();

    return () => {
      if (profileUnsubscribe) profileUnsubscribe();
      if (tasksUnsubscribe) tasksUnsubscribe();
    };
  }, [user, saveProfileToFirestore]);

  // Effect to automatically save profile to Firestore whenever relevant parts change
  useEffect(() => {
    if (isInitialized && user) {
        saveProfileToFirestore(state);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.settings, state.streak, state.plan, state.lastCompletedDate, user, isInitialized, saveProfileToFirestore]);

  // Effect to save session to localStorage
  useEffect(() => {
    if (isInitialized) {
        try {
            if (state.session.appState === 'idle' || state.session.appState === 'finished') {
                localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
            } else {
                localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(state.session));
            }
        } catch (e) {
            console.error("Failed to save session to localStorage", e);
        }
    }
  }, [state.session, isInitialized]);


  return (
    <FocusStoreContext.Provider value={{ state, dispatch, isInitialized }}>
      {children}
    </FocusStoreContext.Provider>
  );
};
