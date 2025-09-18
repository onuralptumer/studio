
'use client';

import { useContext } from 'react';
import { FocusStoreContext, Task } from '@/contexts/focus-store-context';

export const useFocusStore = () => {
  const context = useContext(FocusStoreContext);
  if (context === undefined) {
    throw new Error('useFocusStore must be used within a FocusStoreProvider');
  }
  const { state, dispatch, isInitialized } = context;

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

  const addTask = (task: Task) => {
    dispatch({ type: 'ADD_TASK', payload: task });
  };

  const completeTask = (taskId: string) => {
    dispatch({ type: 'COMPLETE_TASK', payload: taskId });
  };

  const removeTask = (taskId: string) => {
    dispatch({ type: 'REMOVE_TASK', payload: taskId });
  };

  const setSettings = (settings: { duration: number; sound: boolean }) => {
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
    tasks: state.tasks,
    settings: state.settings,
    session: state.session,
    startFocus,
    pauseFocus,
    resumeFocus,
    finishSession,
    resetSession,
    addTask,
    completeTask,
    removeTask,
    setSettings,
    getStats,
  };
};
