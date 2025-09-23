
'use client';

import React, { createContext, useReducer, useEffect, useState, ReactNode, useCallback } from 'react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';

export type Task = {
  id: string;
  name: string;
  status: 'attempted' | 'completed';
  date: string; // ISO string
  duration: number; // in minutes
};

type Settings = {
  duration: number;
};

type AppState = 'idle' | 'focusing' | 'paused' | 'finished';

type SessionState = {
  appState: AppState;
  currentTask: string;
  currentTaskId: string | null;
  sessionEndTime: number | null; // UTC timestamp
  remainingTimeOnPause: number | null; // seconds
};

type FocusState = {
  tasks: Task[];
  streak: number;
  lastCompletedDate: string | null; // ISO string date part
  settings: Settings;
  session: SessionState;
};

type Action =
  | { type: 'COMPLETE_TASK'; payload: string }
  | { type: 'SET_SETTINGS'; payload: Settings }
  | { type: 'REMOVE_TASK'; payload: string }
  | { type: 'REHYDRATE'; payload: FocusState }
  | { type: 'START_FOCUS'; payload: { taskName: string; duration: number } }
  | { type: 'PAUSE_FOCUS' }
  | { type: 'RESUME_FOCUS' }
  | { type: 'FINISH_SESSION' }
  | { type: 'RESET_SESSION' };

const initialSessionState: SessionState = {
  appState: 'idle',
  currentTask: '',
  currentTaskId: null,
  sessionEndTime: null,
  remainingTimeOnPause: null,
};

const initialState: FocusState = {
  tasks: [],
  streak: 0,
  lastCompletedDate: null,
  settings: {
    duration: 25,
  },
  session: initialSessionState,
};

const focusReducer = (state: FocusState, action: Action): FocusState => {
  switch (action.type) {
    case 'START_FOCUS': {
      const { taskName, duration } = action.payload;
      const newTaskId = Date.now().toString();
      const newTask: Task = {
        id: newTaskId,
        name: taskName,
        status: 'attempted',
        date: new Date().toISOString(),
        duration: duration,
      };
      return {
        ...state,
        tasks: [...state.tasks, newTask],
        session: {
          ...initialSessionState,
          appState: 'focusing',
          currentTask: taskName,
          currentTaskId: newTaskId,
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
      return {
        ...state,
        session: {
          ...state.session,
          appState: 'finished',
          remainingTimeOnPause: null,
        },
      };
    }
    case 'RESET_SESSION': {
      return {
        ...state,
        session: initialSessionState,
      };
    }
    case 'COMPLETE_TASK': {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      let newStreak = state.streak;
      let newLastCompletedDate = state.lastCompletedDate;

      if (!state.lastCompletedDate) {
        newStreak = 1;
        newLastCompletedDate = todayStr;
      } else {
        const lastDate = parseISO(state.lastCompletedDate);
        if (isYesterday(lastDate)) {
          newStreak += 1;
          newLastCompletedDate = todayStr;
        } else if (!isToday(lastDate)) {
          newStreak = 1;
          newLastCompletedDate = todayStr;
        }
      }

      const newTasks = state.tasks.map(task =>
        task.id === action.payload ? { ...task, status: 'completed' as const } : task
      );

      return {
        ...state,
        tasks: newTasks,
        streak: newStreak,
        lastCompletedDate: newLastCompletedDate,
      };
    }
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'REMOVE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      };
    case 'REHYDRATE':
      return { ...state, ...action.payload, session: initialState.session };
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

  const saveStateToFirestore = useCallback(async (currentState: FocusState) => {
    if (user) {
      try {
        // We don't want to persist the session state in Firestore
        const { session, ...stateToSave } = currentState;
        await setDoc(doc(db, 'users', user.uid), stateToSave);
      } catch (error) {
        console.error("Failed to save state to Firestore", error);
      }
    }
  }, [user]);

  useEffect(() => {
    const loadStateFromFirestore = async () => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        try {
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const firestoreState = docSnap.data() as FocusState;
            dispatch({ type: 'REHYDRATE', payload: firestoreState });
          } else {
            // New user, save initial state to create the document
            await saveStateToFirestore(initialState);
          }
        } catch (error) {
          console.error("Failed to load state from Firestore", error);
        }
      }
      setIsInitialized(true);
    };

    if (user && !isInitialized) {
      loadStateFromFirestore();
    } else if (!user) {
        // If user logs out, we are not 'initialized' for the new state.
        setIsInitialized(false);
    }
  }, [user, isInitialized, saveStateToFirestore]);

  useEffect(() => {
    if (isInitialized && user) {
      saveStateToFirestore(state);
    }
  }, [state, isInitialized, user, saveStateToFirestore]);

  return (
    <FocusStoreContext.Provider value={{ state, dispatch, isInitialized }}>
      {children}
    </FocusStoreContext.Provider>
  );
};
