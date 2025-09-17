
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
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

type AppState = 'idle' | 'focusing' | 'paused' | 'finished';

export default function FocusFlowApp() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { isInitialized, settings, setSettings, addTask, completeTask, getStats } = useFocusStore();
  const { toast } = useToast();
  
  const [appState, setAppState] = useState<AppState>('idle');
  const [currentTask, setCurrentTask] = useState('');
  const [timeLeft, setTimeLeft] = useState(settings.duration * 60);

  const nudgeTimestamps = useRef<number[]>([]);
  const nextNudgeIndex = useRef(0);
  const pauseStartTime = useRef<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    setTimeLeft(settings.duration * 60);
  }, [settings.duration]);


  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      if (isVisible && appState === 'focusing' && pauseStartTime.current !== null) {
          // Tab is visible again, adjust nudge timestamps by the duration the tab was hidden
          const pauseDuration = (Date.now() - pauseStartTime.current) / 1000;
          nudgeTimestamps.current = nudgeTimestamps.current.map(t => t - pauseDuration);
          pauseStartTime.current = null;
      } else if (!isVisible && appState === 'focusing') {
          // Tab is hidden, record pause start time
          pauseStartTime.current = Date.now();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [appState]);


  const scheduleNudges = useCallback(() => {
    // Total session duration in seconds.
    const sessionDurationSeconds = settings.duration * 60;
    
    // Nudge count is at least 1, or more for longer sessions (1 per 5 mins).
    const nudgeCount = Math.ceil(settings.duration / 5) || 1;
    
    // Quiet Start: No nudges in the first 25% of the session.
    const quietStartSeconds = sessionDurationSeconds * 0.25;
    
    // Quiet End: No nudges in the last 10% of the session.
    const quietEndSeconds = sessionDurationSeconds * 0.10;
    
    // The "active" window is the time available for sending nudges.
    const activeNudgeWindowDuration = sessionDurationSeconds - quietStartSeconds - quietEndSeconds;
    
    // If the window is too short, no nudges will be scheduled.
    if (activeNudgeWindowDuration < 1) {
        nudgeTimestamps.current = [];
        nextNudgeIndex.current = 0;
        return;
    }

    // To create evenly-spaced nudges, we divide the active window into segments.
    // Adding 1 to nudgeCount ensures the intervals are between the nudges.
    const intervalBetweenNudges = activeNudgeWindowDuration / (nudgeCount + 1);
    
    const timestamps: number[] = [];
    for (let i = 1; i <= nudgeCount; i++) {
        // Calculate the time for each nudge. We start from the beginning of the active window
        // and add the interval for each subsequent nudge.
        const nudgeTimeFromStart = quietStartSeconds + (i * intervalBetweenNudges);
        
        // Timestamps are stored as "time left", so we subtract from the total duration.
        timestamps.push(Math.floor(sessionDurationSeconds - nudgeTimeFromStart));
    }

    // Sort timestamps in descending order, so it's easy to check the next one.
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

  const showNudge = useCallback(() => {
    const sessionDuration = settings.duration * 60;
    const elapsedSeconds = sessionDuration - timeLeft;
    const progress = (elapsedSeconds / sessionDuration) * 100;

    let messageCategory: 'gentle' | 'motivating' | 'playful';

    if (progress < 50) {
      messageCategory = 'gentle';
    } else if (progress >= 50 && progress < 75) {
      messageCategory = 'motivating';
    } else {
      messageCategory = 'playful';
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
    if (appState !== 'focusing') {
        return;
    }

    const timerId = setInterval(() => {
        let newTimeLeft = 0;
        setTimeLeft(prevTimeLeft => {
            newTimeLeft = prevTimeLeft - 1;

            if (newTimeLeft <= 0) {
                clearInterval(timerId);
                setAppState('finished');
                return 0;
            }
            return newTimeLeft;
        });

        // Check for nudges
        const nextNudgeTime = nudgeTimestamps.current[nextNudgeIndex.current];
        const isVisible = document.visibilityState === 'visible';
        
        if (
            nextNudgeTime !== undefined &&
            newTimeLeft <= nextNudgeTime &&
            isVisible
        ) {
            showNudge();
        }

    }, 1000);

    return () => {
        clearInterval(timerId);
    };
}, [appState, showNudge]);


  if (loading || !isInitialized || !user) {
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
                <div className="grid gap-3 pt-2">
                  <Label htmlFor="duration" className="font-semibold text-center">
                    Focus Duration: {settings.duration} minutes
                  </Label>
                  <Slider
                    id="duration"
                    min={1}
                    max={60}
                    step={1}
                    value={[settings.duration]}
                    onValueChange={(value) => setSettings({ ...settings, duration: value[0] })}
                  />
                </div>
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
