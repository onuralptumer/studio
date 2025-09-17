'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppHeader } from '@/components/app/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FocusBubble } from '@/components/app/focus-bubble';
import { useFocusStore } from '@/hooks/use-focus-store';
import { getMotivationalNudge } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Check, Repeat } from 'lucide-react';

type AppState = 'idle' | 'focusing' | 'paused' | 'finished';
export type NudgeTone = 'calm' | 'fun' | 'firm';

export default function FocusFlowApp() {
  const { isInitialized, settings, addTask, completeTask, getStats } = useFocusStore();
  const { toast } = useToast();
  
  const [appState, setAppState] = useState<AppState>('idle');
  const [currentTask, setCurrentTask] = useState('');
  const [timeLeft, setTimeLeft] = useState(settings.duration * 60);
  const [nudgeIntervalId, setNudgeIntervalId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTimeLeft(settings.duration * 60);
  }, [settings.duration]);

  const startTimer = () => {
    if (currentTask.trim() === '') {
      toast({
        title: 'No Task Entered',
        description: 'Please enter a task to focus on.',
        variant: 'destructive',
      });
      return;
    }
    setAppState('focusing');
    addTask({
      id: Date.now().toString(),
      name: currentTask,
      status: 'attempted',
      date: new Date().toISOString(),
      duration: settings.duration,
    });
  };

  const stopTimer = () => {
    setAppState('finished');
  };

  const handleTaskDone = () => {
    const stats = getStats();
    const lastTask = stats.tasks[stats.tasks.length - 1];
    if (lastTask) {
      completeTask(lastTask.id);
    }
    reset();
  };
  
  const handleRetry = () => {
    reset();
  };

  const reset = () => {
    setCurrentTask('');
    setAppState('idle');
    setTimeLeft(settings.duration * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const fetchNudge = useCallback(async () => {
    if (appState !== 'focusing') return;
    const timeElapsedMinutes = settings.duration - Math.floor(timeLeft / 60);
    const nudge = await getMotivationalNudge({
      task: currentTask,
      timeElapsedMinutes,
      tone: settings.tone,
    });
    toast({
      title: 'A little nudge for you!',
      description: nudge,
    });
  }, [appState, currentTask, settings.duration, settings.tone, timeLeft, toast]);

  useEffect(() => {
    if (appState === 'focusing') {
      const timerId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerId);
            setAppState('finished');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Set up nudges at 1/3 and 2/3 of the way through
      const nudgeTime1 = Math.floor(settings.duration * 60 / 3);
      const nudgeTime2 = Math.floor(settings.duration * 60 * 2 / 3);
      const nudgeTimeout1 = setTimeout(fetchNudge, nudgeTime1 * 1000);
      const nudgeTimeout2 = setTimeout(fetchNudge, nudgeTime2 * 1000);

      return () => {
        clearInterval(timerId);
        clearTimeout(nudgeTimeout1);
        clearTimeout(nudgeTimeout2);
      };
    }
  }, [appState, fetchNudge, settings.duration]);

  if (!isInitialized) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const renderContent = () => {
    switch (appState) {
      case 'idle':
        return (
          <Card className="w-full max-w-md shadow-xl border-none bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-headline">What's your next task?</CardTitle>
              <CardDescription>Enter one thing to focus on right now.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  startTimer();
                }}
                className="flex flex-col gap-4"
              >
                <Input
                  placeholder="e.g., Draft the project proposal"
                  className="text-center text-lg h-12"
                  value={currentTask}
                  onChange={e => setCurrentTask(e.target.value)}
                />
                <Button type="submit" size="lg" className="h-12 text-lg">
                  Start Focusing
                </Button>
              </form>
            </CardContent>
          </Card>
        );
      case 'focusing':
      case 'paused':
        const progress = ((settings.duration * 60 - timeLeft) / (settings.duration * 60)) * 100;
        return (
          <FocusBubble
            task={currentTask}
            progress={progress}
            isPaused={appState === 'paused'}
            onTogglePause={() => setAppState(appState === 'paused' ? 'focusing' : 'paused')}
            onStop={stopTimer}
            timeLeft={formatTime(timeLeft)}
          />
        );
      case 'finished':
        return (
          <Card className="w-full max-w-md text-center shadow-xl border-none bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-3xl font-headline">Session Complete!</CardTitle>
              <CardDescription>Nice work. Take a short break.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Button size="lg" onClick={handleTaskDone} className="h-12 text-lg">
                <Check className="mr-2" /> Mark as Done
              </Button>
              <Button variant="secondary" size="lg" onClick={handleRetry} className="h-12 text-lg">
                <Repeat className="mr-2" /> Retry Later
              </Button>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-grow flex items-center justify-center p-4 sm:p-8">
        {renderContent()}
      </main>
    </div>
  );
}
