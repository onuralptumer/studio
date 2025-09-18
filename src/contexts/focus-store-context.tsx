
'use client';

import React, { createContext, useReducer, useEffect, useState, ReactNode } from 'react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

const LOCAL_STORAGE_KEY = 'oneTaskNowStore';

export type Task = {
  id: string;
  name: string;
  status: 'attempted' | 'completed';
  date: string; // ISO string
  duration: number; // in minutes
};

type Settings = {
  duration: number;
  sound: boolean;
};

type AppState = 'idle' | 'focusing' | 'paused' | 'finished';

type SessionState = {
  appState: AppState;
  currentTask: string;
  currentTaskId: string | null;
  sessionEndTime: number | null; // UTC timestamp
  pauseDuration: number;
};

type FocusState = {
  tasks: Task[];
  streak: number;
  lastCompletedDate: string | null; // ISO string date part
  settings: Settings;
  session: SessionState;
};

type Action =
  | { type: 'ADD_TASK'; payload: Task }
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
  pauseDuration: 0,
};

const initialState: FocusState = {
  tasks: [],
  streak: 0,
  lastCompletedDate: null,
  settings: {
    duration: 25,
    sound: false,
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
          appState: 'focusing',
          currentTask: taskName,
          currentTaskId: newTaskId,
          sessionEndTime: Date.now() + duration * 60 * 1000,
          pauseDuration: 0,
        },
      };
    }
    case 'PAUSE_FOCUS': {
      if (state.session.appState !== 'focusing') return state;
      return {
        ...state,
        session: {
          ...state.session,
          appState: 'paused',
          sessionEndTime: state.session.sessionEndTime, // This will be adjusted on resume
        },
      };
    }
    case 'RESUME_FOCUS': {
      if (state.session.appState !== 'paused' || !state.session.sessionEndTime) return state;
       // When resuming, add the pause duration to the end time
      const pausedAt = state.session.sessionEndTime; // Not really, but we need a timestamp
      const newEndTime = Date.now() + (state.session.sessionEndTime - Date.now());

      return {
        ...state,
        session: {
          ...state.session,
          appState: 'focusing',
          sessionEndTime: state.session.sessionEndTime, // Don't adjust time on resume for now, timer continues
        },
      };
    }
    case 'FINISH_SESSION': {
      return {
        ...state,
        session: {
          ...state.session,
          appState: 'finished',
        },
      };
    }
    case 'RESET_SESSION': {
      return {
        ...state,
        session: initialSessionState,
      };
    }
    case 'ADD_TASK': {
      // This is now handled by START_FOCUS, but kept for potential direct additions
      return { ...state, tasks: [...state.tasks, action.payload] };
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
      // Ensure rehydrated state has all new properties
      return { ...initialState, ...action.payload };
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
  const [state, dispatch] = useReducer(focusReducer, initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const storedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedState) {
        const parsedState = JSON.parse(storedState);
        // On rehydration, if a session was active, check if it has expired
        if ((parsedState.session.appState === 'focusing' || parsedState.session.appState === 'paused') && parsedState.session.sessionEndTime) {
            if (Date.now() > parsedState.session.sessionEndTime) {
                parsedState.session.appState = 'finished'; // Mark as finished if time is up
            }
        }
        dispatch({ type: 'REHYDRATE', payload: parsedState });
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error("Failed to save state to localStorage", error);
      }
    }
  }, [state, isInitialized]);

  return (
    <FocusStoreContext.Provider value={{ state, dispatch, isInitialized }}>
      {children}
    </FocusStoreContext.Provider>
  );
};
