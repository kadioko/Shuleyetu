'use client';

const STEPS = [
  { status: 'pending', label: 'Order Placed', description: 'Your order has been received' },
  { status: 'awaiting_payment', label: 'Awaiting Payment', description: 'Payment confirmation needed' },
  { status: 'paid', label: 'Paid', description: 'Payment received successfully' },
  { status: 'processing', label: 'Processing', description: 'Vendor is preparing your order' },
  { status: 'shipped', label: 'Ready / Shipped', description: 'Order is ready for pickup or delivery' },
  { status: 'completed', label: 'Completed', description: 'Order fulfilled successfully' },
];

interface OrderTimelineProps {
  currentStatus: string;
  paymentStatus: string;
}

export function OrderTimeline({ currentStatus, paymentStatus }: OrderTimelineProps) {
  const currentIndex = STEPS.findIndex((s) => s.status === currentStatus.toLowerCase());

  // If cancelled or failed, show special state
  const isFailed = currentStatus === 'cancelled' || currentStatus === 'failed';

  return (
    <div className="w-full">
      {isFailed ? (
        <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-950/20 p-4 text-center">
          <p className="text-sm font-medium text-red-300">
            Order {currentStatus === 'cancelled' ? 'Cancelled' : 'Failed'}
          </p>
          <p className="text-xs text-red-300/70 mt-1">
            {currentStatus === 'cancelled'
              ? 'This order has been cancelled.'
              : 'There was an issue processing this order.'}
          </p>
        </div>
      ) : null}

      <div className="relative">
        {/* Connecting line */}
        <div className="absolute left-4 top-8 bottom-8 w-0.5 bg-slate-800 md:left-1/2 md:-translate-x-px" />

        <div className="space-y-6">
          {STEPS.map((step, index) => {
            const isActive = index <= currentIndex && !isFailed;
            const isCurrent = index === currentIndex && !isFailed;
            const isPast = index < currentIndex && !isFailed;

            return (
              <div
                key={step.status}
                className={`relative flex items-center gap-4 md:gap-0 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Content */}
                <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right md:pr-10' : 'md:text-left md:pl-10'}`}>
                  <p
                    className={`text-sm font-semibold transition-colors ${
                      isActive ? 'text-slate-100' : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p
                    className={`text-xs mt-0.5 transition-colors ${
                      isActive ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {step.status === 'awaiting_payment' && paymentStatus === 'paid'
                      ? 'Payment confirmed'
                      : step.description}
                  </p>
                </div>

                {/* Dot */}
                <div className="relative z-10 flex flex-shrink-0 items-center justify-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                      isCurrent
                        ? 'border-sky-500 bg-sky-500/20 text-sky-400 shadow-lg shadow-sky-500/20'
                        : isPast
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                        : 'border-slate-700 bg-slate-900 text-slate-600'
                    }`}
                  >
                    {isPast ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : isCurrent ? (
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
                      </span>
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-slate-600" />
                    )}
                  </div>
                </div>

                {/* Spacer for alternating layout */}
                <div className="flex-1 hidden md:block" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
