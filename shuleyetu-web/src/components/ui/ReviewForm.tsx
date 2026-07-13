'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';

interface ReviewFormProps {
  vendorId: string;
  onSuccess?: () => void;
}

export default function ReviewForm({ vendorId, onSuccess }: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setMessage({ type: 'error', text: 'Please select a rating' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      setMessage({ type: 'error', text: 'Please log in to submit a review' });
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/vendors/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ vendor_id: vendorId, rating, comment }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Review submitted!' });
        setRating(0);
        setComment('');
        onSuccess?.();
        router.refresh();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to submit review' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-700 bg-slate-800/50 p-5 space-y-4">
      <h3 className="text-lg font-semibold text-slate-100">Leave a Review</h3>

      {/* Star Rating */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="text-2xl transition-colors"
          >
            <span className={
              (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-slate-600'
            }>
              ★
            </span>
          </button>
        ))}
        {rating > 0 && <span className="ml-2 text-sm text-slate-400">{rating}/5</span>}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience (optional)..."
        maxLength={1000}
        rows={3}
        className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500/30"
      />

      {/* Message */}
      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
          {message.text}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || rating === 0}
        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
