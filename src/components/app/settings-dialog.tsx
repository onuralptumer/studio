'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useFocusStore } from '@/hooks/use-focus-store';
import { Button } from '../ui/button';

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { settings, setSettings } = useFocusStore();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline">Settings</DialogTitle>
          <DialogDescription>
            Customize your focus sessions.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <p className="text-sm text-muted-foreground">
            Focus duration can be changed on the main screen.
          </p>
        </div>
        <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
