
'use client';

import { useContext } from 'react';
import { FocusStoreContext, Task } from '@/contexts/focus-store-context';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { doc, deleteDoc, writeBatch, collection } from 'firebase/firestore';
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

  const finishSession = () => {
    dispatch({ type: 'FINISH_SESSION' });
  };

  const resetSession = () => {
    dispatch({ type: 'RESET_SESSION' });
  };

  const completeTask = async () => {
    if (state.session.appState !== 'finished' || !state.session.currentTaskId || !user) return;
    
    const tempTaskId = state.session.currentTaskId;
    const task = state.tasks.find(t => t.id === tempTaskId);

    if (task && task.status === 'attempted') {
        const batch = writeBatch(db);
        const tasksColRef = collection(db, 'users', user.uid, 'tasks');
        const newTaskRef = doc(tasksColRef);

        batch.set(newTaskRef, {
            name: task.name,
            status: 'completed',
            date: task.date,
            duration: task.duration,
        });

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
        const newProfile = {
            streak: newStreak,
            lastCompletedDate: newLastCompletedDate,
        };
        batch.update(userDocRef, newProfile);
        
        await batch.commit();

        dispatch({
            type: 'COMPLETE_SESSION_SUCCESS',
            payload: { taskId: tempTaskId, newProfile }
        });
        resetSession();
    }
  };


  const removeTask = async (taskId: string) => {
    if (!user) return;
    const taskDocRef = doc(db, 'users', user.uid, 'tasks', taskId);
    await deleteDoc(taskDocRef);
    dispatch({ type: 'REMOVE_TASK_SUCCESS', payload: taskId });
  };

  const setSettings = (settings: { duration: number }) => {
    dispatch({ type: 'SET_SETTINGS', payload: settings });
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
    plan: state.plan,
    tasks: state.tasks,
    settings: state.settings,
    session: state.session,
    startFocus,
    pauseFocus,
    resumeFocus,
    finishSession,
    resetSession,
    completeTask,
    removeTask,
    setSettings,
    getStats,
  };
};
