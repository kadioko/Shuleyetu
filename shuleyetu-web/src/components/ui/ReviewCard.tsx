'use client';

import { StarRating } from './StarRating';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  reviewer_name: string | null;
  created_at: string;
}

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const date = new Date(review.created_at).toLocaleDateString('en-TZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/10 text-sm font-bold text-sky-400">
            {(review.reviewer_name ?? 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">
              {review.reviewer_name ?? 'Anonymous'}
            </p>
            <p className="text-xs text-slate-500">{date}</p>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>
      {review.title && (
        <p className="mt-3 text-sm font-semibold text-slate-100">{review.title}</p>
      )}
      {review.comment && (
        <p className="mt-2 text-sm text-slate-400 leading-relaxed">{review.comment}</p>
      )}
    </div>
  );
}
