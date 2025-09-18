'use client';

import React, { createContext, useReducer, useEffect, useState, ReactNode } from 'react';
import { format, isToday, isYesterday, differenceInCalendarDays, parseISO } from 'date-fns';

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

type FocusState = {
  tasks: Task[];
  streak: number;
  lastCompletedDate: string | null; // ISO string date part
  settings: Settings;
};

type Action =
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'COMPLETE_TASK'; payload: string } // id of the task
  | { type: 'SET_SETTINGS'; payload: Settings }
  | { type: 'REMOVE_TASK'; payload: string } // id of the task
  | { type: 'REHYDRATE'; payload: FocusState };

const initialState: FocusState = {
  tasks: [],
  streak: 0,
  lastCompletedDate: null,
  settings: {
    duration: 1,
    sound: false,
  },
};

const focusReducer = (state: FocusState, action: Action): FocusState => {
  switch (action.type) {
    case 'ADD_TASK': {
      const newState = { ...state, tasks: [...state.tasks, action.payload] };
      return newState;
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
      return action.payload;
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
        // Data integrity check and migration can be added here
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
