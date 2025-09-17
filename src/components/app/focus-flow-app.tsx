'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppHeader } from '@/components/app/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FocusBubble } from '@/components/app/focus-bubble';
import { useFocusStore } from '@/hooks/use-focus-store';
import { useToast } from '@/hooks/use-toast';
import { Check, Repeat } from 'lucide-react';
import { NudgeMessages } from '@/lib/nudges';

type AppState = 'idle' | 'focusing' | 'paused' | 'finished';
export type NudgeTone = 'calm' | 'fun' | 'firm';

export default function FocusFlowApp() {
  const { isInitialized, settings, addTask, completeTask, getStats } = useFocusStore();
  const { toast } = useToast();
  
  const [appState, setAppState] = useState<AppState>('idle');
  const [currentTask, setCurrentTask] = useState('');
  const [timeLeft, setTimeLeft] = useState(settings.duration * 60);

  const [isTabVisible, setIsTabVisible] = useState(true);
  const nudgeTimestamps = useRef<number[]>([]);
  const nextNudgeIndex = useRef(0);
  const lastInteractionTime = useRef(Date.now());


  useEffect(() => {
    setTimeLeft(settings.duration * 60);
  }, [settings.duration]);


  useEffect(() => {
    const updateUserInteraction = () => {
      lastInteractionTime.current = Date.now();
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setIsTabVisible(true);
        updateUserInteraction();
      } else {
        setIsTabVisible(false);
      }
    };

    window.addEventListener('keydown', updateUserInteraction);
    window.addEventListener('click', updateUserInteraction);
    window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', updateUserInteraction);
      window.removeEventListener('click', updateUserInteraction);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);


  const scheduleNudges = useCallback(() => {
    const sessionDurationSeconds = settings.duration * 60;
    
    const nudgeCount = Math.ceil(settings.duration / 10) || 1;
    
    const quietStartSeconds = sessionDurationSeconds * 0.25;
    const quietEndSeconds = sessionDurationSeconds * 0.10;
    
    const activeNudgeWindowStart = sessionDurationSeconds - quietStartSeconds;
    const activeNudgeWindowEnd = quietEndSeconds;
    const activeNudgeWindowDuration = activeNudgeWindowStart - activeNudgeWindowEnd;
    
    const intervalBetweenNudges = activeNudgeWindowDuration / (nudgeCount + 1);
    
    const timestamps: number[] = [];
    for (let i = 1; i <= nudgeCount; i++) {
        const nudgeTime = activeNudgeWindowStart - (i * intervalBetweenNudges);
        timestamps.push(Math.floor(nudgeTime));
    }

    nudgeTimestamps.current = timestamps.sort((a,b) => b-a);
    nextNudgeIndex.current = 0;
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
    scheduleNudges();
    lastInteractionTime.current = Date.now();
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

  const showNudge = useCallback(async () => {
    const sessionDuration = settings.duration * 60;
    const elapsedSeconds = sessionDuration - timeLeft;
    const progress = (elapsedSeconds / sessionDuration) * 100;

    let messageCategory: 'gentle' | 'motivating' | 'playful';

    if (progress < 50) {
      messageCategory = 'gentle';
    } else if (progress >= 50 && progress < 75) {
      messageCategory = 'motivating';
    } else if (progress >= 75 && progress < 90) {
      messageCategory = 'playful';
    } else {
      return; // No nudges in the last 10%
    }
    
    const messages = NudgeMessages[messageCategory];
    const nudge = messages[Math.floor(Math.random() * messages.length)];
    
    toast({
      title: 'A little nudge for you!',
      description: nudge,
      duration: 15000,
    });
    
    nextNudgeIndex.current += 1;
  }, [toast, settings.duration, timeLeft]);


  useEffect(() => {
    let timerId: NodeJS.Timeout;

    if (appState === 'focusing') {
      timerId = setInterval(() => {
        setTimeLeft(prevTimeLeft => {
          if (prevTimeLeft <= 1) {
            clearInterval(timerId);
            setAppState('finished');
            return 0;
          }
          const newTimeLeft = prevTimeLeft - 1;

          const nextNudgeTime = nudgeTimestamps.current[nextNudgeIndex.current];
          if (nextNudgeTime && newTimeLeft <= nextNudgeTime) {
              const timeSinceLastInteraction = (Date.now() - lastInteractionTime.current) / 1000;
              
              if (
                  isTabVisible &&
                  appState === 'focusing' &&
                  timeSinceLastInteraction > 30
              ) {
                  showNudge();
              }
          }

          return newTimeLeft;
        });
      }, 1000);
    }
    
    return () => {
      clearInterval(timerId);
    };
  }, [appState, showNudge, isTabVisible]);


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
            onTogglePause={() => {
              const newState = appState === 'paused' ? 'focusing' : 'paused';
              setAppState(newState);
              if (newState === 'focusing') {
                lastInteractionTime.current = Date.now();
              }
            }}
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
