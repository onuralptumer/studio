
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
import { MusicPlayer } from './music-player';
import { AdsenseAd } from './adsense-ad';

export default function FocusFlowApp() {
  const { user, loading } = useAuth();
  const {
    isInitialized,
    settings,
    setSettings,
    session,
    startFocus,
    pauseFocus,
    resumeFocus,
    finishSession,
    completeTask,
    retryTask,
    plan,
  } = useFocusStore();
  const { toast } = useToast();

  const [taskInput, setTaskInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  const nudgeTimestamps = useRef<number[]>([]);
  const nextNudgeIndex = useRef(0);

  useEffect(() => {
    if (isInitialized) {
      if (session.appState === 'focusing') {
        const remaining = session.sessionEndTime ? (session.sessionEndTime - Date.now()) / 1000 : 0;
        setTimeLeft(Math.max(0, remaining));
      } else if (session.appState === 'paused' && session.remainingTimeOnPause) {
        setTimeLeft(session.remainingTimeOnPause);
      } else {
        setTimeLeft(settings.duration * 60);
        setTaskInput('');
      }
    }
  }, [session.appState, settings.duration, isInitialized, session.sessionEndTime, session.remainingTimeOnPause]);

  const handlePauseToggle = () => {
    if (session.appState === 'paused') {
      resumeFocus();
    } else {
      pauseFocus();
    }
  };

  const scheduleNudges = useCallback(() => {
    const sessionDurationSeconds = settings.duration * 60;
    const nudgeCount = Math.ceil(settings.duration / 5) || 1;
    const quietStartSeconds = sessionDurationSeconds * 0.25;
    const quietEndSeconds = sessionDurationSeconds * 0.10;
    const activeNudgeWindowDuration = sessionDurationSeconds - quietStartSeconds - quietEndSeconds;
    const intervalBetweenNudges = activeNudgeWindowDuration / (nudgeCount + 1);
    
    const timestamps: number[] = [];
    for (let i = 1; i <= nudgeCount; i++) {
        const nudgeTimeFromStart = quietStartSeconds + (i * intervalBetweenNudges);
        timestamps.push(Math.floor(sessionDurationSeconds - nudgeTimeFromStart));
    }

    nudgeTimestamps.current = timestamps.sort((a,b) => b-a);
    nextNudgeIndex.current = 0;
  }, [settings.duration]);

  const startTimer = () => {
    if (taskInput.trim() === '') {
      toast({
        title: 'No Task Entered',
        description: 'Please enter a task to focus on.',
        variant: 'destructive',
      });
      return;
    }
    scheduleNudges();
    startFocus(taskInput);
  };

  const formatTime = (seconds: number) => {
    const totalSeconds = Math.ceil(seconds);
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
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
      messageCategory = 'playful';
    } else {
      messageCategory = 'motivating';
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
    if (session.appState !== 'focusing') {
      return;
    }

    const timerId = setInterval(() => {
      const remaining = session.sessionEndTime ? (session.sessionEndTime - Date.now()) / 1000 : 0;
      
      if (remaining <= 0) {
        clearInterval(timerId);
        finishSession();
        setTimeLeft(0);
        return;
      }
      
      setTimeLeft(remaining);

      const nextNudgeTime = nudgeTimestamps.current[nextNudgeIndex.current];
      const isVisible = document.visibilityState === 'visible';

      if (
        nextNudgeTime !== undefined &&
        remaining <= nextNudgeTime &&
        isVisible
      ) {
        showNudge();
      }
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, [session.appState, showNudge, session.sessionEndTime, finishSession]);

  if (loading || !isInitialized || !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const renderContent = () => {
    switch (session.appState) {
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
                  value={taskInput}
                  onChange={e => setTaskInput(e.target.value)}
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
            task={session.currentTask}
            progress={progress}
            isPaused={session.appState === 'paused'}
            onTogglePause={handlePauseToggle}
            onStop={finishSession}
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
              <Button size="lg" onClick={completeTask} className="h-12 text-lg">
                <Check className="mr-2" /> Mark as Done
              </Button>
              <Button variant="secondary" size="lg" onClick={retryTask} className="h-12 text-lg">
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
        <div className="flex flex-col items-center gap-8 w-full">
          {renderContent()}
          {plan === 'free' && (
            <div className="w-full max-w-lg pt-4">
              <AdsenseAd key={session.sessionEndTime || 'idle-ad'} />
            </div>
          )}
        </div>
      </main>
      <footer className="fixed bottom-0 left-0 right-0 p-4 flex justify-center">
        <MusicPlayer isPlayingOverride={session.appState !== 'finished'} />
      </footer>
    </div>
  );
}
