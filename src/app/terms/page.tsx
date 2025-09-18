
'use client';

import Link from 'next/link';
import { Logo } from '@/components/icons';
import { useState, useEffect } from 'react';

export default function TermsPage() {
  const [effectiveDate, setEffectiveDate] = useState('');

  useEffect(() => {
    setEffectiveDate(new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }));
  }, []);


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold font-headline">OneTaskNow</span>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight font-headline">
                Terms of Service — OneTaskNow
              </h1>
              <p className="text-muted-foreground">
                {effectiveDate ? `Effective Date: ${effectiveDate}`: 'Loading date...'}
              </p>
            </div>

            <div className="space-y-6">
              <section className="space-y-3">
                <h2 className="text-2xl font-bold font-headline">
                  1. Acceptance of Terms
                </h2>
                <p>
                  By using OneTaskNow, you agree to these terms. If you don’t
                  agree, please don’t use the app.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-bold font-headline">
                  2. Service Description
                </h2>
                <p>
                  OneTaskNow is a simple focus app that helps you work on one
                  task at a time with gentle nudges and recaps. Features may
                  change as we improve the service.
                </p>
              </section>
              
              <section className="space-y-3">
                <h2 className="text-2xl font-bold font-headline">
                  3. User Responsibilities
                </h2>
                <ul className="list-disc space-y-2 pl-6">
                  <li>
                    Use the app for personal productivity, not misuse or
                    illegal activity.
                  </li>
                  <li>Keep your account (if created) secure.</li>
                  <li>
                    Respect others’ privacy if you share your device or
                    session.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-bold font-headline">
                  4. Paid Plans
                </h2>
                 <ul className="list-disc space-y-2 pl-6">
                    <li>Pro plans are billed monthly or as a lifetime purchase.</li>
                    <li>Payments are handled through secure third-party providers.</li>
                    <li>Subscriptions renew automatically unless canceled.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-bold font-headline">5. Disclaimers</h2>
                <ul className="list-disc space-y-2 pl-6">
                  <li>The app is provided “as is.”</li>
                  <li>
                    We do not guarantee that it will meet all your needs or be
                    100% bug-free.
                  </li>
                  <li>
                    We are not responsible for productivity outcomes, missed
                    deadlines, or indirect damages.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-bold font-headline">6. Termination</h2>
                <p>
                  We may suspend or terminate accounts that violate these
                  terms. You can stop using the app anytime.
                </p>
              </section>
              
              <section className="space-y-3">
                <h2 className="text-2xl font-bold font-headline">7. Governing Law</h2>
                <p>
                  These terms are governed by the laws of [your country/state].
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-muted">
        <div className="container mx-auto flex items-center justify-between px-4 py-6 md:px-6">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} OneTaskNow. All rights reserved.
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
