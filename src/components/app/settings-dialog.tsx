'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
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

  const handleDurationChange = (value: number[]) => {
    setSettings({ ...settings, duration: value[0] });
  };

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
          <div className="grid gap-3">
            <Label htmlFor="duration" className="font-semibold">
              Focus Duration: {settings.duration} minutes
            </Label>
            <Slider
              id="duration"
              min={1}
              max={60}
              step={1}
              value={[settings.duration]}
              onValueChange={handleDurationChange}
            />
          </div>
        </div>
        <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
