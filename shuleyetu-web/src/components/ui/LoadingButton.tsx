'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function LoadingButton({
  loading = false,
  children,
  variant = 'primary',
  className,
  disabled,
  ...props
}: LoadingButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200';

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-3 text-sm text-slate-950 shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-sky-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed',
    secondary:
      'border-2 border-slate-600 bg-slate-900/50 px-6 py-3 text-sm text-slate-100 backdrop-blur-sm hover:border-sky-500 hover:bg-slate-800/80 hover:text-white disabled:border-slate-700 disabled:bg-slate-800/30 disabled:text-slate-500 disabled:cursor-not-allowed',
    danger:
      'bg-gradient-to-r from-red-500 to-red-600 px-6 py-3 text-sm text-white shadow-lg shadow-red-500/20 hover:from-red-400 hover:to-red-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed',
  };

  return (
    <button
      className={cn(baseStyles, variantStyles[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      <span className={loading ? 'opacity-90' : ''}>{children}</span>
    </button>
  );
}
