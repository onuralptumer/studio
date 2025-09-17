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
import { customizeNudgeTone, CustomizeNudgeToneInput } from '@/ai/flows/customize-nudge-tone';

type AppState = 'idle' | 'focusing' | 'paused' | 'finished';
export type NudgeTone = 'calm' | 'fun' | 'firm';

export default function FocusFlowApp() {
  const { isInitialized, settings, addTask, completeTask, getStats } = useFocusStore();
  const { toast } = useToast();
  
  const [appState, setAppState] = useState<AppState>('idle');
  const [currentTask, setCurrentTask] = useState('');
  const [timeLeft, setTimeLeft] = useState(settings.duration * 60);

  // New state for smart nudges
  const [lastInteractionTime, setLastInteractionTime] = useState(0);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const nextNudgeIndex = useRef(0);
  const nudgeTimestamps = useRef<number[]>([]);
  const lastNudgeShownTime = useRef(0);


  useEffect(() => {
    setTimeLeft(settings.duration * 60);
  }, [settings.duration]);

  const updateUserInteraction = useCallback(() => {
    setLastInteractionTime(Date.now());
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', updateUserInteraction);
    window.addEventListener('click', updateUserInteraction);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        setIsTabVisible(true);
        updateUserInteraction(); // Treat returning to tab as an interaction
      } else {
        setIsTabVisible(false);
      }
    });

    return () => {
      window.removeEventListener('keydown', updateUserInteraction);
      window.removeEventListener('click', updateUserInteraction);
    };
  }, [updateUserInteraction]);


  const scheduleNudges = useCallback(() => {
    const sessionDurationSeconds = settings.duration * 60;
    const nudgeCount = Math.ceil(settings.duration / 10) || 1;

    if (nudgeCount === 0) {
      nudgeTimestamps.current = [];
      return;
    }

    const quietStartSeconds = sessionDurationSeconds * 0.25;
    const quietEndSeconds = sessionDurationSeconds * 0.90;
    const activeNudgeWindow = quietEndSeconds - quietStartSeconds;
    
    if (activeNudgeWindow <= 0) {
      nudgeTimestamps.current = [];
      return;
    }
    
    const intervalBetweenNudges = activeNudgeWindow / (nudgeCount + 1);

    const timestamps: number[] = [];
    for (let i = 1; i <= nudgeCount; i++) {
        const nudgeTime = quietStartSeconds + (i * intervalBetweenNudges);
        timestamps.push(sessionDurationSeconds - Math.floor(nudgeTime));
    }
    nudgeTimestamps.current = timestamps.sort((a,b) => b-a); // descending order of timeLeft
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
    updateUserInteraction();
    lastNudgeShownTime.current = 0;
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
    
    const input: CustomizeNudgeToneInput = {
      task: currentTask,
      tone: settings.tone,
      elapsedTime: Math.floor(elapsedSeconds / 60)
    };
    
    try {
      const { nudge } = await customizeNudgeTone(input);
      toast({
        title: 'A little nudge for you!',
        description: nudge,
        duration: 15000,
      });
    } catch (error) {
      console.error('Error generating nudge:', error);
      toast({
        title: 'Nudge Error',
        description: 'Could not generate a custom nudge at this time.',
        variant: 'destructive',
      });
    }

    lastNudgeShownTime.current = timeLeft;
    nextNudgeIndex.current += 1;
  }, [toast, settings.tone, timeLeft, currentTask]);


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

          // Nudge Logic
          const nextNudgeTime = nudgeTimestamps.current[nextNudgeIndex.current];
          if (nextNudgeTime && newTimeLeft <= nextNudgeTime) {
              const timeSinceLastInteraction = (Date.now() - lastInteractionTime) / 1000;
              const timeSinceLastNudge = lastNudgeShownTime.current === 0 ? 999 : lastNudgeShownTime.current - newTimeLeft;
              
              if (
                  isTabVisible &&
                  timeSinceLastInteraction > 30 && // Wait 30s after returning/interaction
                  timeSinceLastNudge > 30 // Ensure nudges aren't too close
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
  }, [appState, showNudge, isTabVisible, lastInteractionTime]);


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
              setAppState(appState === 'paused' ? 'focusing' : 'paused');
              updateUserInteraction(); // Treat pausing/resuming as an interaction
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
    <div className="flex flex-col min-h-screen" onClick={updateUserInteraction}>
      <AppHeader />
      <main className="flex-grow flex items-center justify-center p-4 sm:p-8">
        {renderContent()}
      </main>
    </div>
  );
}
