
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { submitFeedback } from './actions';

export default function FeedbackPage() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback.trim().length < 10) {
      toast({
        title: 'Feedback too short',
        description: 'Please provide a bit more detail in your feedback.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      await submitFeedback({
        content: feedback,
        userId: user?.uid || null,
      });
      setIsSubmitted(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not submit your feedback. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 left-4">
        <Link href="/" className="flex items-center gap-3">
          <Logo className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold font-headline">OneTaskNow</span>
        </Link>
      </div>
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Share Your Feedback</CardTitle>
          <CardDescription>
            {isSubmitted
              ? "Thank you! We've received your feedback."
              : 'Have an idea or found a bug? We would love to hear it.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <p>Your input helps us make OneTaskNow better for everyone.</p>
              <Button asChild>
                <Link href="/">Return to Home</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                placeholder="Tell us what you think..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={6}
                required
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
