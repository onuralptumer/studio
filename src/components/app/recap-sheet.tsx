
'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useFocusStore } from '@/hooks/use-focus-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Zap, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO } from 'date-fns';

export function RecapSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { getStats } = useFocusStore();
  const stats = getStats();

  const today = new Date();
  const todayString = format(today, 'yyyy-MM-dd');
  const todaysTasks = stats.tasks.filter(task => format(parseISO(task.date), 'yyyy-MM-dd') === todayString);
  const completedToday = todaysTasks.filter(t => t.status === 'completed').length;

  const sortedTasks = [...stats.tasks]
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
    .slice(0, 10);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-2xl font-headline">Your Recap</SheetTitle>
          <SheetDescription>
            A summary of your focus sessions.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
          <div className="py-4 grid gap-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    <CheckCircle className="mx-auto mb-2 h-6 w-6 text-green-500" />
                    Today
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedToday}/{todaysTasks.length}</div>
                  <p className="text-xs text-muted-foreground">Tasks Done</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    <Zap className="mx-auto mb-2 h-6 w-6 text-yellow-500" />
                    Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.streak}</div>
                  <p className="text-xs text-muted-foreground">Days</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    <Clock className="mx-auto mb-2 h-6 w-6 text-blue-500" />
                    Focus Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalFocusTime}</div>
                  <p className="text-xs text-muted-foreground">Minutes</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {sortedTasks.length > 0 ? (
                  <ul className="space-y-3">
                    {sortedTasks.map(task => (
                      <li key={task.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {task.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="truncate max-w-[150px] sm:max-w-[200px]">{task.name}</span>
                        </div>
                        <span className="text-muted-foreground text-xs flex-shrink-0">
                          {format(parseISO(task.date), 'MMM d, p')}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">
                    No tasks recorded yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
