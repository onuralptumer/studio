
'use client';

import React, { createContext, useReducer, useEffect, useState, ReactNode, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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

const FocusStateSchema = z.object({
  tasks: z.array(TaskSchema).default([]),
  streak: z.number().default(0),
  lastCompletedDate: z.string().nullable().default(null),
  settings: SettingsSchema.default({ duration: 25 }),
});

type AppState = 'idle' | 'focusing' | 'paused' | 'finished';

type SessionState = {
  appState: AppState;
  currentTask: string;
  sessionEndTime: number | null; // UTC timestamp
  remainingTimeOnPause: number | null; // seconds
};

export type FocusState = z.infer<typeof FocusStateSchema> & {
  session: SessionState;
  plan: 'free' | 'pro';
};


// Actions
type Action =
  | { type: 'SET_STATE'; payload: z.infer<typeof FocusStateSchema> }
  | { type: 'START_FOCUS'; payload: { taskName: string; duration: number } }
  | { type: 'PAUSE_FOCUS' }
  | { type: 'RESUME_FOCUS' }
  | { type: 'FINISH_SESSION' }
  | { type: 'COMPLETE_TASK' }
  | { type: 'RETRY_TASK' }
  | { type: 'SET_SETTINGS'; payload: Settings }
  | { type: 'SET_PLAN'; payload: 'free' | 'pro' }
  | { type: 'REMOVE_TASK'; payload: string };


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
    case 'SET_STATE':
      // Ensure settings has a default if it's missing from loaded data
      return { ...state, ...action.payload, settings: action.payload.settings || initialState.settings };

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

    case 'FINISH_SESSION': {
        const newTask: Task = {
            id: Date.now().toString(),
            name: state.session.currentTask,
            status: 'attempted',
            date: new Date().toISOString(),
            duration: state.settings.duration,
        };
        return {
            ...state,
            tasks: [...state.tasks, newTask],
            session: {
            ...state.session,
            appState: 'finished',
            remainingTimeOnPause: null,
            },
        };
    }
    
    case 'COMPLETE_TASK': {
      const lastTask = state.tasks[state.tasks.length - 1];
      if (!lastTask || lastTask.status === 'completed') return state;

      const updatedTasks = [...state.tasks];
      updatedTasks[updatedTasks.length - 1] = { ...lastTask, status: 'completed' };
      
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      let newStreak = state.streak;
      let newLastCompletedDate = state.lastCompletedDate;

      if (!state.lastCompletedDate) {
        newStreak = 1;
      } else {
        const lastDate = parseISO(state.lastCompletedDate);
        if (isYesterday(lastDate)) {
          newStreak += 1;
        } else if (!isToday(lastDate)) {
          // If the last completion was not today or yesterday, reset the streak
          newStreak = 1;
        }
        // If it was today, streak doesn't change
      }
      newLastCompletedDate = todayStr;
      
      return {
        ...state,
        tasks: updatedTasks,
        streak: newStreak,
        lastCompletedDate: newLastCompletedDate,
        session: initialState.session,
      };
    }

    case 'RETRY_TASK': {
      return {
        ...state,
        session: initialState.session,
      };
    }

    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };

    case 'SET_PLAN':
        return { ...state, plan: action.payload };

    case 'REMOVE_TASK':
        return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };

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


export const FocusStoreProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(focusReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  const saveStateToFirestore = useCallback(async (stateToSave: FocusState) => {
    if (!user) return;
    try {
      // Omit session state before saving
      const { session, ...restOfState } = stateToSave;
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, restOfState);
    } catch (error) {
      console.error("Failed to save state to Firestore:", error);
    }
  }, [user]);

  // Effect to load state from Firestore
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadState = async () => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          // Use .safeParse to avoid throwing an error
          const parseResult = FocusStateSchema.safeParse(docSnap.data());
          if (parseResult.success) {
            dispatch({ type: 'SET_STATE', payload: parseResult.data });
          } else {
            console.error("Zod validation failed:", parseResult.error);
            // If validation fails, maybe start with a fresh state
            await saveStateToFirestore(initialState);
            dispatch({ type: 'SET_STATE', payload: initialState });
          }
        } else {
          // For new users, save the initial state to create their document
          await saveStateToFirestore(initialState);
        }
        setIsInitialized(true);
      } else {
        // No user, reset to initial state and mark as initialized
        dispatch({ type: 'SET_STATE', payload: initialState });
        setIsInitialized(true);
      }
    };
    
    loadState();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, saveStateToFirestore]);

  // Effect to automatically save state to Firestore whenever it changes
  useEffect(() => {
    if (isInitialized && user) {
      saveStateToFirestore(state);
    }
  }, [state, user, isInitialized, saveStateToFirestore]);


  return (
    <FocusStoreContext.Provider value={{ state, dispatch, isInitialized }}>
      {children}
    </FocusStoreContext.Provider>
  );
};
