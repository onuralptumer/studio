
'use client';

import { useContext } from 'react';
import { FocusStoreContext, Settings, Task } from '@/contexts/focus-store-context';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { format, isToday, isYesterday, parseISO } from 'date-fns';


export const useFocusStore = () => {
  const context = useContext(FocusStoreContext);
  if (context === undefined) {
    throw new Error('useFocusStore must be used within a FocusStoreProvider');
  }
  const { state, dispatch, isInitialized } = context;
  const { user } = useAuth();

  const startFocus = (taskName: string) => {
    dispatch({ type: 'START_FOCUS', payload: { taskName, duration: state.settings.duration } });
  };

  const pauseFocus = () => {
    dispatch({ type: 'PAUSE_FOCUS' });
  };

  const resumeFocus = () => {
    dispatch({ type: 'RESUME_FOCUS' });
  };

  const finishSession = async () => {
    if (!user) return;

    // Logic to enforce task limit for free users
    if (state.plan === 'free' && state.tasks.length >= 10) {
      try {
        const tasksColRef = collection(db, 'users', user.uid, 'tasks');
        const q = query(tasksColRef, orderBy('date', 'asc'), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const oldestTaskDoc = querySnapshot.docs[0];
          await deleteDoc(doc(db, 'users', user.uid, 'tasks', oldestTaskDoc.id));
        }
      } catch (error) {
        console.error("Error deleting oldest task:", error);
      }
    }

    const newTask: Omit<Task, 'id'> = {
        name: state.session.currentTask,
        status: 'attempted',
        date: new Date().toISOString(),
        duration: state.settings.duration,
    };
    try {
        const tasksColRef = collection(db, 'users', user.uid, 'tasks');
        // The new task is added, and the listener in the context will update the state.
        await addDoc(tasksColRef, newTask);
        dispatch({ type: 'RESET_SESSION_AFTER_FINISH' });
    } catch (error) {
        console.error("Error creating task document:", error);
    }
  };

  const completeTask = async () => {
    if (!user) return;
    // Find the most recently added 'attempted' task
    const lastTask = [...state.tasks]
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
      .find(t => t.status === 'attempted');
      
    if (!lastTask) return;

    try {
        // 1. Update the task status in Firestore
        const taskDocRef = doc(db, 'users', user.uid, 'tasks', lastTask.id);
        await updateDoc(taskDocRef, { status: 'completed' });
        
        // 2. The local state will update automatically via the onSnapshot listener.
        // Now calculate streak.
        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');
        let newStreak = state.streak;
        
        if (!state.lastCompletedDate) {
            newStreak = 1;
        } else {
            const lastDate = parseISO(state.lastCompletedDate);
            if (isYesterday(lastDate)) {
            newStreak += 1;
            } else if (!isToday(lastDate)) {
            newStreak = 1;
            }
        }
        
        // 3. Update streak and last date locally. This will be saved automatically.
        dispatch({ type: 'SET_STREAK_DATA', payload: { streak: newStreak, lastCompletedDate: todayStr } });

        // 4. Reset the session state
        dispatch({ type: 'RESET_SESSION' });

    } catch (error) {
        console.error("Error completing task:", error);
    }
  };

  const retryTask = () => {
    dispatch({ type: 'RESET_SESSION' });
  };
  
  const setSettings = (settings: Settings) => {
    dispatch({ type: 'SET_SETTINGS', payload: settings });
  };

  const removeTask = async (taskId: string) => {
    if (!user) return;
    try {
        const taskDocRef = doc(db, 'users', user.uid, 'tasks', taskId);
        await deleteDoc(taskDocRef);
        // The onSnapshot listener in the provider will handle the local state update
    } catch (error) {
        console.error("Error deleting task:", error);
    }
  };

  const stopFocus = () => {
    dispatch({ type: 'RESET_SESSION' });
  };
  
  const getStats = () => {
    const totalFocusTime = state.tasks
      .filter(t => t.status === 'completed')
      .reduce((acc, task) => acc + task.duration, 0);

    return {
      tasks: state.tasks,
      streak: state.streak,
      totalFocusTime: Math.round(totalFocusTime),
    };
  };

  return {
    isInitialized,
    ...state,
    startFocus,
    pauseFocus,
    resumeFocus,
    finishSession,
    completeTask,
    retryTask,
    setSettings,
    removeTask,
    stopFocus,
    getStats,
  };
};
