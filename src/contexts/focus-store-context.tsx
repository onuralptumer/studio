
'use client';

import React, { createContext, useReducer, useEffect, useState, ReactNode, useCallback } from 'react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { doc, getDoc, setDoc, collection, query, onSnapshot, addDoc, updateDoc, writeBatch } from 'firebase/firestore';
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

type UserProfile = {
  plan: 'free' | 'pro';
  streak: number;
  lastCompletedDate: string | null; // ISO string date part
  settings: Settings;
};

type FocusState = UserProfile & {
  tasks: Task[];
  session: SessionState;
};


type Action =
  | { type: 'SET_USER_PROFILE'; payload: UserProfile }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_OR_UPDATE_TASK'; payload: Task }
  | { type: 'REMOVE_TASK_SUCCESS'; payload: string }
  | { type: 'SET_SETTINGS'; payload: Settings }
  | { type: 'START_FOCUS'; payload: { taskName: string; duration: number } }
  | { type: 'PAUSE_FOCUS' }
  | { type: 'RESUME_FOCUS' }
  | { type: 'FINISH_SESSION' }
  | { type: 'RESET_SESSION' }
  | { type: 'COMPLETE_SESSION_SUCCESS'; payload: { taskId: string; newProfile: Partial<UserProfile> } };


const initialSessionState: SessionState = {
  appState: 'idle',
  currentTask: '',
  currentTaskId: null,
  sessionEndTime: null,
  remainingTimeOnPause: null,
};

const initialState: FocusState = {
  tasks: [],
  plan: 'free',
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
      const newTaskId = Date.now().toString(); // Temporary ID, will be replaced by Firestore ID
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
      // If the task was only attempted, remove it from the list
      const newTasks = state.tasks.filter(task => {
        if (task.id === state.session.currentTaskId) {
            return task.status === 'completed';
        }
        return true;
      });

      return {
        ...state,
        tasks: newTasks,
        session: initialSessionState,
      };
    }
    case 'COMPLETE_SESSION_SUCCESS': {
        const { taskId, newProfile } = action.payload;
        return {
            ...state,
            ...newProfile,
            tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: 'completed' } : t),
        };
    }
    case 'SET_USER_PROFILE':
      return { ...state, ...action.payload, session: state.session }; // Keep session state during rehydration
    
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };

    case 'ADD_OR_UPDATE_TASK': {
        const existingTaskIndex = state.tasks.findIndex(t => t.id === action.payload.id);
        let newTasks;
        if (existingTaskIndex > -1) {
            newTasks = [...state.tasks];
            newTasks[existingTaskIndex] = action.payload;
        } else {
            newTasks = [...state.tasks, action.payload];
        }
        return { ...state, tasks: newTasks };
    }

    case 'SET_SETTINGS':
        return { ...state, settings: action.payload };
    
    case 'REMOVE_TASK_SUCCESS':
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

  useEffect(() => {
    if (user && !isInitialized) {
      const userDocRef = doc(db, 'users', user.uid);
      
      // Listen for user profile changes
      const unsubscribeProfile = onSnapshot(userDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          dispatch({ type: 'SET_USER_PROFILE', payload: docSnap.data() as UserProfile });
        } else {
          // Create a new user profile document
          const newUserProfile: UserProfile = {
            plan: 'free',
            streak: 0,
            lastCompletedDate: null,
            settings: { duration: 25 },
          };
          await setDoc(userDocRef, newUserProfile);
          dispatch({ type: 'SET_USER_PROFILE', payload: newUserProfile });
        }
        setIsInitialized(true);
      }, (error) => {
        console.error("Error listening to user profile:", error);
        setIsInitialized(true); // Still initialize on error to not block UI
      });

      // Listen for task changes
      const tasksColRef = collection(db, 'users', user.uid, 'tasks');
      const q = query(tasksColRef);
      const unsubscribeTasks = onSnapshot(q, (querySnapshot) => {
        const tasks: Task[] = [];
        querySnapshot.forEach((doc) => {
          tasks.push({ id: doc.id, ...doc.data() } as Task);
        });
        dispatch({ type: 'SET_TASKS', payload: tasks });
      });

      return () => {
        unsubscribeProfile();
        unsubscribeTasks();
        setIsInitialized(false);
        dispatch({ type: 'SET_USER_PROFILE', payload: initialState }); // Reset state on logout
        dispatch({ type: 'SET_TASKS', payload: [] });
      };
    } else if (!user) {
      setIsInitialized(true); // No user, so we are "initialized" with empty state
    }
  }, [user]);

  // Effect to save settings
  useEffect(() => {
    if (isInitialized && user && state.plan) { // state.plan is a proxy for loaded state
      const userDocRef = doc(db, 'users', user.uid);
      updateDoc(userDocRef, { settings: state.settings });
    }
  }, [state.settings, user, isInitialized]);
  
  // Effect to handle completing a task
  useEffect(() => {
    const completeTaskAsync = async () => {
        if (state.session.appState === 'finished' && state.session.currentTaskId && user) {
            const tempTaskId = state.session.currentTaskId;
            const task = state.tasks.find(t => t.id === tempTaskId);

            if (task && task.status === 'attempted') {
                const batch = writeBatch(db);

                // 1. Add the new task to the 'tasks' subcollection
                const tasksColRef = collection(db, 'users', user.uid, 'tasks');
                const newTaskRef = doc(tasksColRef); // Auto-generate ID
                batch.set(newTaskRef, {
                    name: task.name,
                    status: 'completed', // Mark as completed
                    date: task.date,
                    duration: task.duration,
                });
                
                // 2. Calculate new streak and update user profile
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
                
                const userDocRef = doc(db, 'users', user.uid);
                const newProfile: Partial<UserProfile> = {
                    streak: newStreak,
                    lastCompletedDate: newLastCompletedDate,
                };
                batch.update(userDocRef, newProfile);
                
                // 3. Commit batch
                await batch.commit();
                
                // 4. Update local state
                dispatch({
                    type: 'COMPLETE_SESSION_SUCCESS',
                    payload: { taskId: tempTaskId, newProfile }
                });
            }
        }
    };
    
    // This logic now resides with the button click in the component.
    // The effect could be used for other real-time updates if needed.

  }, [state.session.appState, state.session.currentTaskId, user, state.tasks, state.streak, state.lastCompletedDate]);


  return (
    <FocusStoreContext.Provider value={{ state, dispatch, isInitialized }}>
      {children}
    </FocusStoreContext.Provider>
  );
};
