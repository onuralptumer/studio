'use client';

import { useContext } from 'react';
import { FocusStoreContext, Task } from '@/contexts/focus-store-context';

export const useFocusStore = () => {
  const context = useContext(FocusStoreContext);
  if (context === undefined) {
    throw new Error('useFocusStore must be used within a FocusStoreProvider');
  }
  const { state, dispatch, isInitialized } = context;

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
    addTask,
    completeTask,
    removeTask,
    setSettings,
    getStats,
  };
};
