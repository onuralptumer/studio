
'use client';

import Link from 'next/link';
import { Logo } from '@/components/icons';
import { useState, useEffect } from 'react';

export default function PrivacyPage() {
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
            <span className="text-2xl font-bold font-headline">InTheFlow</span>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold tracking-tight font-headline">
                Privacy Policy — InTheFlow
              </h1>
              <p className="text-muted-foreground">
                {effectiveDate ? `Effective Date: ${effectiveDate}`: 'Loading date...'}
              </p>
            </div>

            <div className="space-y-6">
              <section className="space-y-3">
                <h2 className="text-2xl font-bold font-headline">
                  1. What Information We Collect
                </h2>
                <p>
                  <strong>Tasks & session data:</strong> We store the task text
                  you type, session duration, and completion status.
                </p>
                <p>
                  <strong>Preferences:</strong> Tone of nudges, reminder
                  settings, and theme choices.
                </p>
                <p>
                  <strong>Usage data:</strong> Basic analytics (e.g., number of
                  sessions, clicks) to improve the app.
                </p>
                <p>
                  <strong>Optional contact info:</strong> If you sign up with
                  email, we store it to send recaps or premium updates.
                </p>
                <p className="font-semibold">
                  We do not sell, rent, or share your personal data with
                  advertisers.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-bold font-headline">
                  2. How We Use Your Data
                </h2>
                <ul className="list-disc space-y-2 pl-6">
                  <li>To provide the core service (timers, nudges, recaps).</li>
                  <li>
                    To improve user experience (e.g., which nudges people
                    like).
                  </li>
                  <li>To communicate with you (only if you opted in).</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-bold font-headline">
                  3. Data Storage & Security
                </h2>
                <ul className="list-disc space-y-2 pl-6">
                  <li>
                    Data is stored securely on Vercel servers.
                  </li>
                  <li>
                    Sensitive info (like email) is encrypted in transit and at
                    rest.
                  </li>
                  <li>
                    You can request deletion of all your data anytime by
                    emailing [your contact email].
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-bold font-headline">
                  4. Third-Party Services
                </h2>
                <p>
                  We may use third-party tools for analytics (e.g., Google
                  Analytics) or email delivery. These services have their own
                  privacy policies.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-bold font-headline">5. Your Rights</h2>
                <p>Depending on your region (GDPR/CCPA):</p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>Request access to your data.</li>
                  <li>Ask us to delete your data.</li>
                  <li>Opt out of communications.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-2xl font-bold font-headline">6. Contact Us</h2>
                <p>
                  For questions or requests: [your contact email].
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
              &copy; {new Date().getFullYear()} InTheFlow. All rights reserved.
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
