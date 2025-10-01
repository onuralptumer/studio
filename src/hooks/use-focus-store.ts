
'use client';

import { useContext } from 'react';
import { FocusStoreContext, Settings, Task } from '@/contexts/focus-store-context';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
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

    // Logic to enforce task history limit for free users
    if (state.plan === 'free' && state.tasks.length >= 10) {
      try {
        const tasksColRef = collection(db, 'users', user.uid, 'tasks');
        const q = query(tasksColRef, orderBy('date', 'asc'), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const oldestTaskDoc = querySnapshot.docs[0];
          // We are removing this feature, but the logic stays to not break anything for now.
          // await deleteDoc(doc(db, 'users', user.uid, 'tasks', oldestTaskDoc.id));
        }
      } catch (error) {
        console.error("Error managing task history:", error);
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
        await addDoc(tasksColRef, newTask);
        dispatch({ type: 'RESET_SESSION_AFTER_FINISH' });
    } catch (error) {
        console.error("Error creating task document:", error);
    }
  };

  const completeTask = async () => {
    if (!user) return;
    const lastTask = [...state.tasks]
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
      .find(t => t.status === 'attempted');
      
    if (!lastTask) return;

    try {
        const taskDocRef = doc(db, 'users', user.uid, 'tasks', lastTask.id);
        await updateDoc(taskDocRef, { status: 'completed' });
        
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
        
        dispatch({ type: 'SET_STREAK_DATA', payload: { streak: newStreak, lastCompletedDate: todayStr } });
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

  const todaysSessionCount = state.tasks.filter(task => isToday(parseISO(task.date))).length;

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
    stopFocus,
    getStats,
    todaysSessionCount,
  };
};
