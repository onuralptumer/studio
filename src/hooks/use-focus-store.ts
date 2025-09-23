
'use client';

import { useContext } from 'react';
import { FocusStoreContext, Settings } from '@/contexts/focus-store-context';

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

  const completeTask = () => {
    dispatch({ type: 'COMPLETE_TASK' });
  };

  const retryTask = () => {
    dispatch({ type: 'RETRY_TASK' });
  };
  
  const setSettings = (settings: Settings) => {
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
    ...state,
    startFocus,
    pauseFocus,
    resumeFocus,
    finishSession,
    completeTask,
    retryTask,
    setSettings,
    getStats,
  };
};
