import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

function ScoreCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur-md sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className={`mt-3 text-xl font-extrabold sm:text-2xl ${accent}`}>{value}</p>
    </div>
  );
}

function ApprovalButton({ active, color, label, onClick }) {
  const style =
    color === 'approve'
      ? active
        ? 'bg-emerald-600 text-white'
        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
      : color === 'hold'
        ? active
          ? 'bg-amber-600 text-white'
          : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
        : active
          ? 'bg-rose-600 text-white'
          : 'bg-rose-50 text-rose-700 hover:bg-rose-100';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${style}`}
    >
      {label}
    </button>
  );
}

function AutoReleasePanel() {
  const [ticketId, setTicketId] = useState('');
  const [flowResult, setFlowResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [approvalDecision, setApprovalDecision] = useState('');

  useEffect(() => {
    const normalizedTicketId = ticketId.trim().toUpperCase();
    if (!normalizedTicketId) {
      setFlowResult(null);
      setLogs([]);
      setErrorMessage('');
      setApprovalDecision('');
      return;
    }

    const timerId = setTimeout(async () => {
      setLoading(true);
      setErrorMessage('');
      setApprovalDecision('');

      try {
        const response = await fetch('/api/auto-release', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ticketId: normalizedTicketId }),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.detail || 'Unable to run auto release flow');
        }

        setFlowResult(payload);
        setLogs(payload.logs || []);
        toast.success(`Auto flow completed for ${payload.ticketId}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to run auto release flow';
        setFlowResult(null);
        setLogs([]);
        setErrorMessage(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }, 600);

    return () => clearTimeout(timerId);
  }, [ticketId]);

  const finalStatus = useMemo(() => {
    if (!approvalDecision) return 'Awaiting Human Approval';
    if (approvalDecision === 'approve') return 'Ready for Production';
    if (approvalDecision === 'hold') return 'On Hold';
    return 'Rejected';
  }, [approvalDecision]);

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-700">Auto Release Flow</p>
        <h2 className="mt-2 text-2xl font-black text-slate-900">Planner + Builder + QA Scorecard</h2>
        <p className="mt-2 text-sm text-slate-600">
          Enter a Jira ticket ID and the dashboard automatically orchestrates PlannerAgent, BuilderAgent, and QAAgent.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Jira Ticket ID
            <input
              type="text"
              value={ticketId}
              onChange={(event) => setTicketId(event.target.value.toUpperCase())}
              placeholder="SR-2"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold tracking-[0.08em] text-slate-900 outline-none transition focus:border-indigo-500"
            />
          </label>
          <div className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">
            {loading ? 'Running flow...' : 'Auto Trigger Enabled'}
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          {flowResult ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Combined Scorecard</p>
                  <h3 className="mt-2 text-2xl font-black text-slate-900">{flowResult.ticketId}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{flowResult.scorecard.recommendation}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <ScoreCard label="Planner Score" value={flowResult.scorecard.plannerScore} accent="text-cyan-600" />
                <ScoreCard label="QA Score" value={flowResult.scorecard.qaScore} accent="text-fuchsia-600" />
                <ScoreCard label="PR Score" value={flowResult.scorecard.prScore} accent="text-green-600" />
                <ScoreCard label="Total Score" value={flowResult.scorecard.totalScore} accent="text-slate-900" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <ScoreCard label="Planner Decision" value={flowResult.planner.decision} accent="text-indigo-600" />
                <ScoreCard label="QA Status" value={flowResult.qa.qaStatus} accent="text-amber-600" />
                <ScoreCard label="PR Count" value={flowResult.builder.prCount} accent="text-emerald-600" />
                <ScoreCard label="Final Status" value={finalStatus} accent="text-rose-600" />
              </div>

              <div className="rounded-2xl border border-slate-300 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Human Approval</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ApprovalButton
                    label="Approve Release"
                    color="approve"
                    active={approvalDecision === 'approve'}
                    onClick={() => setApprovalDecision('approve')}
                  />
                  <ApprovalButton
                    label="Hold Release"
                    color="hold"
                    active={approvalDecision === 'hold'}
                    onClick={() => setApprovalDecision('hold')}
                  />
                  <ApprovalButton
                    label="Reject"
                    color="reject"
                    active={approvalDecision === 'reject'}
                    onClick={() => setApprovalDecision('reject')}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-44 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center text-sm text-slate-500">
              Enter a Jira ticket to run auto release flow.
            </div>
          )}
        </div>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-slate-950 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-300">Flow Logs</p>
        <h2 className="mt-2 text-2xl font-black text-white">Execution Trace</h2>
        <p className="mt-2 text-sm text-slate-400">PlannerAgent + BuilderAgent + QAAgent</p>

        <div className="mt-6 space-y-3">
          {logs.length ? (
            logs.map((entry, index) => (
              <article key={`${entry.step}-${index}`} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">{entry.step}</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">{entry.message}</p>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-5 text-sm text-slate-400">
              No auto flow activity yet.
            </div>
          )}
        </div>
      </article>
    </section>
  );
}

export default AutoReleasePanel;
