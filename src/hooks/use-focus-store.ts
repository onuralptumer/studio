
'use client';

import { useContext } from 'react';
import { FocusStoreContext, Settings, Task } from '@/contexts/focus-store-context';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
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
    const newTask: Omit<Task, 'id'> = {
        name: state.session.currentTask,
        status: 'attempted',
        date: new Date().toISOString(),
        duration: state.settings.duration,
    };
    try {
        const tasksColRef = collection(db, 'users', user.uid, 'tasks');
        const docRef = await addDoc(tasksColRef, newTask);
        dispatch({ type: 'ADD_TASK', payload: { ...newTask, id: docRef.id } });
    } catch (error) {
        console.error("Error creating task document:", error);
    }
  };

  const completeTask = async () => {
    if (!user) return;
    const lastTask = state.tasks[state.tasks.length - 1];
    if (!lastTask || lastTask.status === 'completed') return;

    try {
        // 1. Update the task status in Firestore
        const taskDocRef = doc(db, 'users', user.uid, 'tasks', lastTask.id);
        await updateDoc(taskDocRef, { status: 'completed' });
        
        // 2. Dispatch local state update for immediate UI feedback
        dispatch({ type: 'UPDATE_TASK_STATUS', payload: { id: lastTask.id, status: 'completed' } });

        // 3. Calculate new streak
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
        
        // 4. Update streak and last date in Firestore (via profile update)
        // This will be saved automatically by the useEffect in the provider
        dispatch({ type: 'SET_STREAK_DATA', payload: { streak: newStreak, lastCompletedDate: todayStr } });

        // 5. Reset the session state
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
    getStats,
  };
};
