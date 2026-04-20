import { useState } from 'react';
import toast from 'react-hot-toast';

function MetricCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur-md sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className={`mt-3 text-xl font-extrabold sm:text-2xl ${accent}`}>{value}</p>
    </div>
  );
}

function QAStatusBadge({ status }) {
  const style =
    status === 'Passed'
      ? 'bg-emerald-100 text-emerald-700'
      : status === 'Failed'
        ? 'bg-rose-100 text-rose-700'
        : 'bg-amber-100 text-amber-700';

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${style}`}>{status}</span>;
}

function QAPanel() {
  const [ticketId, setTicketId] = useState('');
  const [qaResult, setQAResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCheckQA = async () => {
    const normalizedTicketId = ticketId.trim().toUpperCase();
    if (!normalizedTicketId) {
      toast.error('Enter a Jira Ticket ID');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/qa-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticketId: normalizedTicketId }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.detail || 'Unable to fetch QA status');
      }

      setQAResult(payload);
      setLogs(payload.logs || []);
      toast.success(`QAAgent checked ${payload.ticketId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to fetch QA status';
      setQAResult(null);
      setLogs([]);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-700">QA Flow</p>
        <h2 className="mt-2 text-2xl font-black text-slate-900">Check QA Status by Jira Ticket</h2>
        <p className="mt-2 text-sm text-slate-600">
          QAAgent evaluates ticket-level QA metrics and computes release readiness decision.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Jira Ticket ID
            <input
              type="text"
              value={ticketId}
              onChange={(event) => setTicketId(event.target.value.toUpperCase())}
              placeholder="SR-2"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold tracking-[0.08em] text-slate-900 outline-none transition focus:border-fuchsia-500"
            />
          </label>
          <button
            type="button"
            onClick={handleCheckQA}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-fuchsia-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-700 disabled:cursor-not-allowed disabled:bg-fuchsia-300"
          >
            {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
            {loading ? 'Checking...' : 'Check QA'}
          </button>
        </div>

        {errorMessage ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          {qaResult ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">QA Summary</p>
                  <h3 className="mt-2 text-2xl font-black text-slate-900">{qaResult.ticketId}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{qaResult.decision}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <QAStatusBadge status={qaResult.qaStatus} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Total Tests" value={qaResult.totalTests} accent="text-slate-900" />
                <MetricCard label="Passed" value={qaResult.passed} accent="text-emerald-600" />
                <MetricCard label="Failed" value={qaResult.failed} accent="text-rose-600" />
                <MetricCard label="Coverage" value={`${qaResult.coverage}%`} accent="text-indigo-600" />
              </div>
            </div>
          ) : (
            <div className="flex min-h-44 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center text-sm text-slate-500">
              Check a Jira ticket to view QA metrics and decision.
            </div>
          )}
        </div>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-slate-950 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-300">QA Logs</p>
        <h2 className="mt-2 text-2xl font-black text-white">Execution Trace</h2>
        <p className="mt-2 text-sm text-slate-400">QAAgent → QA Service → QA Decision</p>

        <div className="mt-6 space-y-3">
          {logs.length ? (
            logs.map((entry, index) => (
              <article key={`${entry.step}-${index}`} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300">{entry.step}</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">{entry.message}</p>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-5 text-sm text-slate-400">
              No QA activity yet.
            </div>
          )}
        </div>
      </article>
    </section>
  );
}

export default QAPanel;
