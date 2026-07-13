'use client';

import { useEffect, useState } from 'react';

interface HealthCheck {
  status: 'ok' | 'error' | 'unknown';
  responseTime?: number;
  message?: string;
}

interface HealthDetails {
  database: HealthCheck;
  auth: HealthCheck;
  clickpesa: HealthCheck;
  redis: HealthCheck;
  jobs: HealthCheck;
}

interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  responseTime: string;
  version: string;
  environment: string;
  checks: Record<string, string>;
  details: HealthDetails;
  error?: string;
}

const REFRESH_INTERVAL = 30;
const CHECK_LABELS: Record<string, string> = {
  database: 'Database',
  auth: 'Authentication',
  clickpesa: 'ClickPesa',
  redis: 'Redis / Rate Limiting',
  jobs: 'Background Jobs',
};

export default function StatusPage() {
  const [status, setStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setStatus(data);
      setLastChecked(new Date());
    } catch (error) {
      setStatus({
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: 0,
        responseTime: '0ms',
        version: '1.0.0',
        environment: 'unknown',
        checks: {},
        details: {
          database: { status: 'error', message: 'Failed to fetch health status' },
          auth: { status: 'error' },
          clickpesa: { status: 'error' },
          redis: { status: 'error' },
          jobs: { status: 'error' },
        },
        error: error instanceof Error ? error.message : 'Failed to fetch health status',
      });
      setLastChecked(new Date());
    } finally {
      setLoading(false);
      setCountdown(REFRESH_INTERVAL);
    }
  };

  useEffect(() => {
    checkHealth();
    const refreshInterval = setInterval(() => {
      checkHealth();
    }, REFRESH_INTERVAL * 1000);

    const tickInterval = setInterval(() => {
      setCountdown((c) => (c <= 1 ? REFRESH_INTERVAL : c - 1));
    }, 1000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(tickInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isHealthy = status?.status === 'healthy';
  const statusColor = isHealthy ? 'text-emerald-400' : status?.status === 'degraded' ? 'text-amber-400' : 'text-red-400';
  const statusBgColor = isHealthy ? 'bg-emerald-500/10' : status?.status === 'degraded' ? 'bg-amber-500/10' : 'bg-red-500/10';
  const statusBorderColor = isHealthy ? 'border-emerald-500/30' : status?.status === 'degraded' ? 'border-amber-500/30' : 'border-red-500/30';

  const renderCheck = (key: string, value: string, detail?: HealthCheck) => {
    const label = CHECK_LABELS[key] ?? key;
    const isOk = value === 'ok';
    const isUnknown = value === 'unknown';
    const color = isOk ? 'text-emerald-400' : isUnknown ? 'text-slate-400' : 'text-red-400';
    const bg = isOk ? 'bg-emerald-500/10' : isUnknown ? 'bg-slate-500/10' : 'bg-red-500/10';
    const dot = isOk ? 'bg-emerald-400' : isUnknown ? 'bg-slate-400' : 'bg-red-400';
    const text = isOk ? 'Operational' : isUnknown ? 'Not configured' : 'Error';

    return (
      <div key={key} className="rounded-lg bg-slate-800/50 px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">{label}</span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${bg} ${color}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {text}
          </span>
        </div>
        {detail?.responseTime ? (
          <p className="mt-1 text-xs text-slate-500">{detail.responseTime}ms</p>
        ) : null}
        {detail?.message ? (
          <p className="mt-1 text-xs text-slate-500">{detail.message}</p>
        ) : null}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-100">Shuleyetu Status</h1>
          <p className="mt-2 text-slate-400">Real-time service health monitoring</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 p-8">
            <div className="text-center">
              <div className="mb-4 inline-flex animate-spin rounded-full border-4 border-slate-700 border-t-sky-500 p-4">
                <span className="sr-only">Loading...</span>
              </div>
              <p className="text-slate-400">Checking service status...</p>
            </div>
          </div>
        ) : status ? (
          <div className={`rounded-xl border ${statusBorderColor} ${statusBgColor} p-6`}>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Service Status</p>
                <p className={`text-2xl font-bold ${statusColor}`}>
                  {isHealthy ? '✓ Operational' : status.status === 'degraded' ? '⚠ Degraded' : '✗ Unavailable'}
                </p>
              </div>
              <div className={`h-4 w-4 rounded-full ${isOkDot(status.status)}`} />
            </div>

            <div className="space-y-3 border-t border-slate-800 pt-6">
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <span className={`font-medium ${statusColor}`}>{status.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Response Time</span>
                <span className="font-medium text-slate-200">{status.responseTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Uptime</span>
                <span className="font-medium text-slate-200">
                  {Math.floor(status.uptime / 60)} min {Math.floor(status.uptime % 60)} sec
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Version</span>
                <span className="font-medium text-slate-200">{status.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Environment</span>
                <span className="font-medium text-slate-200">{status.environment}</span>
              </div>
            </div>

            <div className="mt-6 space-y-2 border-t border-slate-800 pt-6">
              <p className="text-sm font-medium text-slate-400">Service Checks</p>
              <div className="space-y-2">
                {status.details
                  ? Object.entries(status.checks).map(([key, value]) =>
                      renderCheck(key, value, status.details?.[key as keyof HealthDetails])
                    )
                  : null}
              </div>
            </div>

            {status.error && (
              <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                <p className="text-sm text-red-300">{status.error}</p>
              </div>
            )}

            <div className="mt-6 border-t border-slate-800 pt-6 text-center">
              <p className="text-xs text-slate-400">Last updated: {lastChecked?.toLocaleTimeString()}</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <div className="relative h-5 w-28 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-sky-500/40 transition-all duration-1000 ease-linear"
                    style={{ width: `${((REFRESH_INTERVAL - countdown) / REFRESH_INTERVAL) * 100}%` }}
                  />
                </div>
                <p className="text-xs tabular-nums text-slate-500">Next check in {countdown}s</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 text-center">
          <button
            onClick={checkHealth}
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-sky-400"
          >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
}

function isOkDot(status: string): string {
  if (status === 'healthy') return 'bg-emerald-400';
  if (status === 'degraded') return 'bg-amber-400';
  return 'bg-red-400';
}
