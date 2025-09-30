
'use client';

import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

export function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleStartFree = () => {
    if (user) {
      router.push('/focus');
    } else {
      router.push('/signup');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold font-headline">
              OneTaskNow
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            {!loading && (
              <>
                {user ? (
                  <Button asChild>
                    <Link href="/focus">Go to App</Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" asChild>
                      <Link href="/login">Log In</Link>
                    </Button>
                    <Button onClick={handleStartFree}>Start Free</Button>
                  </>
                )}
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto flex flex-col items-center justify-center px-4 py-20 text-center md:px-6 md:py-32">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl font-headline">
            One task. One focus. One calmer day.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Stay productive without the overwhelm — just one task at a time.
          </p>
          <Button size="lg" className="mt-8 text-lg" onClick={handleStartFree} disabled={loading}>
            Start Free
          </Button>
          <div className="mt-12 w-full max-w-4xl">
            <Card className="overflow-hidden shadow-2xl">
              <CardContent className="p-0">
                <Image
                  src="/photo/180-1200x600.jpg"
                  //src="https://picsum.photos/id/180/1200/600"
                  alt="App Mockup"
                  width={1200}
                  height={600}
                  className="w-full"
                  data-ai-hint="app interface"
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Problem -> Solution Section */}
        <section className="bg-muted py-20 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-5xl text-center">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
                Why another focus app?
              </h2>
              <p className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl font-headline">
                Designed for calm productivity.
              </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <X className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-medium">Overwhelm from long lists</h3>
                <p className="mt-2 text-muted-foreground">
                  Too many lists create overwhelm.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <X className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-medium">Complex for ADHD brains</h3>
                <p className="mt-2 text-muted-foreground">
                  Lose track in complex planners.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <X className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-medium">Stressful reminders</h3>
                <p className="mt-2 text-muted-foreground">
                  Reminders that feel stressful, not supportive.
                </p>
              </div>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                  <Check className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">One Task Only</h3>
                <p className="mt-2 text-muted-foreground">
                  Eliminate distractions by focusing on a single objective.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                  <Check className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Gentle Nudges</h3>
                <p className="mt-2 text-muted-foreground">
                  Supportive prompts to keep you on track without adding stress.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                  <Check className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">End-of-Day Recap</h3>
                <p className="mt-2 text-muted-foreground">
                  Review your accomplishments and build momentum.
                </p>              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl font-headline">
                Get started in three simple steps
              </h2>
            </div>
            <div className="mt-12 grid gap-12 md:grid-cols-3">
              <div className="text-center">
                <div className="flex items-center justify-center">
                    <Image src="/photo/668-400x300-grayscale.jpg" alt="Step 1" width={400} height={300} className="rounded-lg shadow-md" data-ai-hint="typing task"/>
                </div>
                <h3 className="mt-6 text-xl font-bold">1. Type your next task</h3>
                <p className="mt-2 text-muted-foreground">
                  Choose one thing you want to accomplish.
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center">
                    <Image src="/photo/4-400x300-grayscale.jpg" alt="Step 2" width={400} height={300} className="rounded-lg shadow-md" data-ai-hint="timer bubble"/>
                </div>
                <h3 className="mt-6 text-xl font-bold">2. Start the bubble timer</h3>
                <p className="mt-2 text-muted-foreground">
                  Commit to a short, focused work session.
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center">
                    <Image src="/photo/20-400x300-grayscale.jpg" alt="Step 3" width={400} height={300} className="rounded-lg shadow-md" data-ai-hint="daily recap"/>
                </div>
                <h3 className="mt-6 text-xl font-bold">3. Get nudges & recap</h3>
                <p className="mt-2 text-muted-foreground">
                  Stay on track and celebrate your progress.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="bg-muted py-20 md:py-24">
            <div className="container mx-auto grid gap-12 px-4 md:grid-cols-2 md:px-6">
                <Card className="shadow-lg">
                    <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                        <h3 className="text-2xl font-bold">Gentle Nudges</h3>
                        <p className="mt-2 text-muted-foreground">Motivational micro-prompts to keep you focused without the stress.</p>
                    </CardContent>
                </Card>
                <Card className="shadow-lg">
                    <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                        <h3 className="text-2xl font-bold">Recap Streaks</h3>
                        <p className="mt-2 text-muted-foreground">Celebrate your daily wins and build a streak of productive days.</p>
                    </CardContent>
                </Card>
            </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-20 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <blockquote className="text-2xl font-semibold italic text-foreground">
                “Finally an app that doesn’t overwhelm me — it just keeps me moving.”
              </blockquote>
              <footer className="mt-4">
                <p className="text-base font-medium text-primary">— Alex</p>
              </footer>
            </div>
          </div>
        </section>

        {/* Social Proof Section */}
        <section className="py-20 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <blockquote className="text-2xl font-semibold italic text-foreground">
                “Finally get through my day without the chaos of endless to-do lists. I just type one thing, start the timer, and it feels doable. The gentle nudges keep me steady, and the recap shows me I’m actually making progress.”
              </blockquote>
              <footer className="mt-4">
                <p className="text-base font-medium text-primary">— Betty</p>
              </footer>
            </div>
          </div>
        </section>        

        {/* Closing CTA */}
        <section className="bg-primary/5 py-20 md:py-24">
          <div className="container mx-auto flex flex-col items-center px-4 text-center md:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight font-headline">
              Stay focused the simple way.
            </h2>
            <p className="mt-3 max-w-md text-lg text-muted-foreground">
              Start your first task today.
            </p>
            <Button size="lg" className="mt-8 text-lg" onClick={handleStartFree} disabled={loading}>
                Try Free Now
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-muted">
        <div className="container mx-auto flex items-center justify-between px-4 py-6 md:px-6">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} OneTaskNow. All rights reserved.
            </p>
          </div>
          <div className="flex gap-4">
             <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              Terms
            </Link>
            <Link href="/feedback" className="text-sm text-muted-foreground hover:text-foreground">
              Feedback
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

    
