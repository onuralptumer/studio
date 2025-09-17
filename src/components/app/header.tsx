'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { History, Settings } from 'lucide-react';
import { Logo } from '@/components/icons';
import { SettingsDialog } from './settings-dialog';
import { RecapSheet } from './recap-sheet';

export function AppHeader() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRecapOpen, setIsRecapOpen] = useState(false);

  return (
    <>
      <header className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Logo className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-foreground">
            InTheFlow
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsRecapOpen(true)}
            aria-label="View Recap"
          >
            <History className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Open Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>
      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      <RecapSheet open={isRecapOpen} onOpenChange={setIsRecapOpen} />
    </>
  );
}
