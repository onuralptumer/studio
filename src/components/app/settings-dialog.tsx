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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useFocusStore } from '@/hooks/use-focus-store';
import { NudgeTone } from './focus-flow-app';
import { Badge } from '../ui/badge';
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

  const handleToneChange = (value: NudgeTone) => {
    setSettings({ ...settings, tone: value });
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
          <div className="grid gap-3">
            <div className='flex items-center gap-2'>
              <Label htmlFor="tone" className="font-semibold">
                Nudge Tone
              </Label>
              <Badge variant="outline">Premium</Badge>
            </div>
            <Select
              value={settings.tone}
              onValueChange={handleToneChange}
            >
              <SelectTrigger id="tone" className="w-full">
                <SelectValue placeholder="Select a tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calm">Calm</SelectItem>
                <SelectItem value="fun">Fun</SelectItem>
                <SelectItem value="firm">Firm</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose the tone for motivational nudges.
            </p>
          </div>
        </div>
        <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
