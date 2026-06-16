'use client';

interface ProgressStep {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'active' | 'completed';
}

interface ProgressStepsProps {
  steps: ProgressStep[];
  className?: string;
}

export function ProgressSteps({ steps, className = '' }: ProgressStepsProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          {/* Step Circle */}
          <div className="flex flex-col items-center">
            <div
              className={`
                flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors
                ${step.status === 'completed'
                  ? 'border-sky-500 bg-sky-500 text-slate-950'
                  : step.status === 'active'
                  ? 'border-sky-500 bg-slate-900 text-sky-400'
                  : 'border-slate-600 bg-slate-900 text-slate-400'
                }
              `}
            >
              {step.status === 'completed' ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            
            {/* Step Title */}
            <div className="mt-2 text-center">
              <p className={`text-xs font-medium ${
                step.status === 'completed' 
                  ? 'text-slate-200' 
                  : step.status === 'active'
                  ? 'text-sky-400'
                  : 'text-slate-400'
              }`}>
                {step.title}
              </p>
              {step.description && (
                <p className="mt-1 text-xs text-slate-400 max-w-20">
                  {step.description}
                </p>
              )}
            </div>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={`mx-4 h-0.5 w-16 transition-colors ${
                step.status === 'completed' ? 'bg-sky-500' : 'bg-slate-600'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
