'use client';

import { Button } from '@/components/ui/button';
import { Pause, Play, X } from 'lucide-react';

type FocusBubbleProps = {
  task: string;
  progress: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onStop: () => void;
  timeLeft: string;
};

export function FocusBubble({
  task,
  progress,
  isPaused,
  onTogglePause,
  onStop,
  timeLeft,
}: FocusBubbleProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full">
      <div className="relative w-80 h-80 sm:w-96 sm:h-96 rounded-full border-4 border-primary/20 bg-primary/5 flex items-center justify-center shadow-lg overflow-hidden">
        <div
          className="absolute bottom-0 left-0 w-full bg-accent/30 transition-transform duration-1000 ease-linear"
          style={{
            transform: `translateY(${(1 - progress / 100) * 100}%)`,
            height: '100%',
          }}
        />

        <div className="relative z-10 text-center p-4 flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground font-semibold">FOCUSING ON</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground max-w-xs truncate">
            {task}
          </h2>
          <p className="text-5xl sm:text-6xl font-bold font-headline text-primary tabular-nums">
            {timeLeft}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="secondary"
          size="icon"
          className="w-16 h-16 rounded-full"
          onClick={onStop}
          aria-label="Stop focus session"
        >
          <X className="w-8 h-8" />
        </Button>
        <Button
          size="icon"
          className="w-20 h-20 rounded-full"
          onClick={onTogglePause}
          aria-label={isPaused ? 'Resume focus session' : 'Pause focus session'}
        >
          {isPaused ? (
            <Play className="w-10 h-10 ml-1" />
          ) : (
            <Pause className="w-10 h-10" />
          )}
        </Button>
      </div>
    </div>
  );
}
