'use client';

import { useState } from 'react';

interface NewsletterFormProps {
  source: string;
  buttonText?: string;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
}

export function NewsletterForm({
  source,
  buttonText = 'Subscribe',
  className = '',
  inputClassName = '',
  buttonClassName = '',
}: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(false);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });
      if (res.ok) {
        setSubscribed(true);
        setEmail('');
        setTimeout(() => setSubscribed(false), 5000);
      }
    } catch {
      // Silently fail — don't break the page
    }
  };

  return (
    <form onSubmit={handleSubscribe} className={className}>
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClassName}
          required
        />
        <button type="submit" className={buttonClassName}>
          {buttonText}
        </button>
      </div>
      {subscribed && (
        <p className="mt-2 text-sm text-sky-400">✓ Thank you for subscribing!</p>
      )}
    </form>
  );
}
