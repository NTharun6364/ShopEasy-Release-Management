/**
 * QAAgentPanel – Universal Selenium QA Intelligence Panel
 *
 * Accepts a ticketId prop, calls POST /api/check-qa, and renders:
 *  - Detected module + framework badge
 *  - Status banner (green / amber / red)
 *  - Metrics grid (total, passed, failed, coverage, execution time)
 *  - Animated score bar
 *  - Decision callout
 *  - Execution trace log
 *  - Screenshot list (when failures exist)
 */
import { useEffect, useRef, useState } from 'react';

const STATUS_STYLE = {
  Passed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  Failed: 'border-rose-200 bg-rose-50 text-rose-800',
  'In Progress': 'border-amber-200 bg-amber-50 text-amber-800',
  'App Offline': 'border-slate-200 bg-slate-50 text-slate-600',
  Unavailable: 'border-slate-200 bg-slate-50 text-slate-600',
  Error: 'border-rose-200 bg-rose-50 text-rose-800',
};

const MODULE_ICON = {
  Cart: '🛒',
  Checkout: '💳',
  Auth: '🔐',
  Product: '📦',
  Admin: '⚙️',
  Ui: '🎨',
  Unknown: '🔍',
};

function MetricTile({ label, value, color = 'slate' }) {
  const tones = {
    green: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    red: 'border-rose-200 bg-rose-50 text-rose-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    slate: 'border-slate-200 bg-slate-50 text-slate-900',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-900',
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[color] || tones.slate}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

export default function QAAgentPanel({ ticketId }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  useEffect(() => {
    if (!ticketId) {
      setResult(null);
      setError('');
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError('');

    fetch('/api/check-qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.detail || 'QA check failed');
        setResult(data);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message || 'QA check failed');
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [ticketId]);

  if (!ticketId) return null;

  const MODULE_KEY = result?.module || 'Unknown';
  const status = result?.qaStatus || '';
  const passRate =
    result?.totalTests > 0 ? Math.round((result.passed / result.totalTests) * 100) : 0;

  const barColor =
    passRate >= 90 ? 'bg-emerald-500' : passRate >= 70 ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <article className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-200/50 backdrop-blur-xl">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            QAAgent Intelligence
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-900">Universal Selenium QA Engine</h2>
          <p className="mt-1 text-sm text-slate-600">
            Auto-detecting module from Jira ticket and executing matching test suite.
          </p>
        </div>

        {result ? (
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className="text-xl">
              {MODULE_ICON[MODULE_KEY] || MODULE_ICON.Unknown}
            </span>
            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
              {result?.framework || 'Selenium'}
            </span>
          </div>
        ) : null}
      </div>

      {/* ── Loading ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-semibold text-indigo-800">
            Running Selenium tests for {ticketId}…
          </p>
        </div>
      ) : null}

      {/* ── Error ───────────────────────────────────────────────────── */}
      {error && !loading ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      {/* ── Result payload ─────────────────────────────────────────── */}
      {result && !loading ? (
        <div className="mt-6 space-y-5">
          {/* Module + Status banner */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Ticket</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{result.ticketId}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Detected Module</p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {MODULE_ICON[MODULE_KEY] || ''} {result.module}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Suite</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{result.suiteName || 'N/A'}</p>
            </div>
            <span
              className={`inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] ${STATUS_STYLE[status] || STATUS_STYLE['In Progress']}`}
            >
              Status: {status}
            </span>
              {result.mcpServer && result.mcpServer !== 'N/A' ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold tracking-[0.12em] text-indigo-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  MCP: {result.mcpServer}
                </span>
              ) : null}
              {result.cachedAt ? (
                <span className="text-xs font-semibold text-slate-400">
                  Cached: {new Date(result.cachedAt).toLocaleTimeString()}
                </span>
              ) : null}
          </div>

          {/* Metrics grid */}
          <MetricTile
            label="Exec Time"
            value={result.executionTime || '—'}
            color="indigo"
          />

          {/* Pass-rate progress bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Pass Rate</span>
              <span>{passRate}%</span>
            </div>
            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                style={{ width: `${passRate}%` }}
              />
            </div>
          </div>

          {/* Decision callout */}
          <div
            className={`rounded-2xl border p-4 ${
              result.decision.includes('Passed')
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : result.decision.includes('Failed') || result.decision.includes('Error')
                  ? 'border-rose-200 bg-rose-50 text-rose-900'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">Decision</p>
            <p className="mt-2 text-base font-black">{result.decision}</p>
          </div>

          {/* Screenshots (failure evidence) */}
          {result.screenshots && result.screenshots.length > 0 ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">
                Failure Screenshots ({result.screenshots.length})
              </p>
              <ul className="mt-2 space-y-1">
                {result.screenshots.map((path, idx) => (
                  <li key={`${path}-${idx}`} className="truncate text-xs font-mono text-rose-800">
                    {path}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Structured failure logs (separate from full trace) */}
          {result.failureLogs && result.failureLogs.length > 0 ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-300">
                Failure Logs ({result.failureLogs.length})
              </p>
              <div className="mt-3 space-y-2">
                {result.failureLogs.map((entry, idx) => (
                  <div key={`fail-${entry.step}-${idx}`} className="rounded-xl border border-rose-800 bg-rose-900/80 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-300">{entry.step}</p>
                    <p className="mt-1 text-sm text-rose-100">{entry.message}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Execution trace */}
          {result.logs && result.logs.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-950 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
                Execution Trace
              </p>
              <div className="mt-3 space-y-2">
                {result.logs.map((entry, idx) => (
                  <div
                    key={`${entry.step}-${idx}`}
                    className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">
                      {entry.step}
                    </p>
                    <p className="mt-1 text-sm text-slate-300">{entry.message}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
