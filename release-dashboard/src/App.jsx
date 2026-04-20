import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import QAAgentPanel from './components/QAAgentPanel';

function getBand(score, max) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  if (pct >= 80) return 'good';
  if (pct >= 55) return 'warning';
  return 'issue';
}

function MetricCard({ title, value, subtitle, color, band = 'warning', interactive = false, active = false, onClick }) {
  const tone =
    color === 'planner'
      ? 'from-cyan-50 to-cyan-100/40 border-cyan-200'
      : color === 'pr'
        ? 'from-emerald-50 to-emerald-100/40 border-emerald-200'
        : color === 'qa'
          ? 'from-fuchsia-50 to-fuchsia-100/40 border-fuchsia-200'
          : color === 'risk'
            ? 'from-amber-50 to-amber-100/40 border-amber-200'
            : 'from-slate-50 to-slate-100/40 border-slate-200';

  const bandStyle =
    band === 'good'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : band === 'warning'
        ? 'bg-amber-100 text-amber-800 border-amber-200'
        : 'bg-rose-100 text-rose-800 border-rose-200';

  const body = (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
      <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${bandStyle}`}>
        {band}
      </span>
      <h3 className="mt-3 text-3xl font-black text-slate-900">{value}</h3>
      <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
      {interactive ? <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Click for details</p> : null}
    </>
  );

  if (!interactive) {
    return <article className={`rounded-3xl border bg-gradient-to-br ${tone} p-5 shadow-sm`}>{body}</article>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border bg-gradient-to-br ${tone} p-5 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${active ? 'ring-2 ring-indigo-500/70 shadow-lg' : ''}`}
    >
      {body}
    </button>
  );
}

function EnvironmentBadge({ value }) {
  const normalized = value.toUpperCase();
  const style =
    normalized === 'PROD'
      ? 'bg-rose-100 text-rose-700 border-rose-200'
      : normalized === 'UAT'
        ? 'bg-amber-100 text-amber-700 border-amber-200'
        : 'bg-cyan-100 text-cyan-700 border-cyan-200';

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold tracking-[0.12em] ${style}`}>
      {normalized}
    </span>
  );
}

function CircularMeter({ score, max = 100 }) {
  const pct = Math.max(0, Math.min(100, (score / max) * 100));
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const stroke = pct >= 90 ? '#059669' : pct >= 75 ? '#d97706' : '#dc2626';

  return (
    <div className="relative h-36 w-36">
      <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} stroke="#e2e8f0" strokeWidth="10" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          stroke={stroke}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-slate-900">{Math.round(pct)}</span>
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Readiness</span>
      </div>
    </div>
  );
}

function ScoreDetailDrawer({ open, onClose, detail }) {
  const scoreBand = detail ? getBand(detail.score, detail.max) : 'warning';
  const scoreTone =
    scoreBand === 'good'
      ? 'text-emerald-700 bg-emerald-100 border-emerald-200'
      : scoreBand === 'warning'
        ? 'text-amber-700 bg-amber-100 border-amber-200'
        : 'text-rose-700 bg-rose-100 border-rose-200';

  const sectionStyle = {
    good: 'border-emerald-200 bg-emerald-50/80 text-emerald-900',
    warning: 'border-amber-200 bg-amber-50/80 text-amber-900',
    issue: 'border-rose-200 bg-rose-50/80 text-rose-900',
  };

  return (
    <div className={`fixed inset-0 z-50 transition ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
      <button
        type="button"
        aria-label="Close details"
        onClick={onClose}
        className={`absolute inset-0 bg-slate-900/55 backdrop-blur-sm transition ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 p-6 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Score Intelligence</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">{detail?.title || 'Details'}</h3>
              <p className="mt-2 text-sm text-slate-600">Score breakdown and targeted improvement actions.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Close
            </button>
          </div>

          {detail ? (
            <div className="mt-4 flex items-center gap-3">
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${scoreTone}`}>
                {detail.score}/{detail.max}
              </span>
              <span className="text-sm font-semibold text-slate-700">{detail.summary}</span>
            </div>
          ) : null}
        </div>

        {detail ? (
          <div className="space-y-5 p-6">
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">1. Score Breakdown</p>
              <div className="mt-3 space-y-2">
                {detail.breakdown.map((item, idx) => (
                  <div
                    key={`${item.label}-${idx}`}
                    className="rounded-xl border border-slate-200 bg-white p-3 transition duration-300 hover:shadow-sm"
                    style={{ transitionDelay: `${Math.min(idx * 40, 200)}ms` }}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-700">
                        {item.points}/{item.max}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className={`rounded-2xl border p-4 ${sectionStyle.good}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em]">2. Positive Factors</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {detail.positiveFactors.length ? (
                  detail.positiveFactors.map((factor, idx) => <li key={`${factor}-${idx}`}>- {factor}</li>)
                ) : (
                  <li>- No strong positives detected yet.</li>
                )}
              </ul>
            </section>

            <section className={`rounded-2xl border p-4 ${sectionStyle.warning}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em]">3. Negative Factors</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {detail.negativeFactors.length ? (
                  detail.negativeFactors.map((factor, idx) => <li key={`${factor}-${idx}`}>- {factor}</li>)
                ) : (
                  <li>- No significant negative factors.</li>
                )}
              </ul>
            </section>

            <section className={`rounded-2xl border p-4 ${sectionStyle.issue}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em]">4. Missing Points</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {detail.missingPoints.length ? (
                  detail.missingPoints.map((item, idx) => <li key={`${item.label}-${idx}`}>- {item.label}: -{item.points} points</li>)
                ) : (
                  <li>- Full points achieved.</li>
                )}
              </ul>
            </section>

            <section className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-4 text-indigo-900">
              <p className="text-xs font-semibold uppercase tracking-[0.14em]">5. Recommendation To Improve Score</p>
              <p className="mt-2 text-sm leading-6">{detail.recommendation}</p>
            </section>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function App() {
  const [ticketId, setTicketId] = useState('');
  const [flow, setFlow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [approval, setApproval] = useState('');
  const [timestamp, setTimestamp] = useState(new Date());
  const [activeCard, setActiveCard] = useState('');

  const environment = (import.meta.env.VITE_ENVIRONMENT || 'STAGING').toUpperCase();

  useEffect(() => {
    const timer = setInterval(() => setTimestamp(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') setActiveCard('');
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    const normalized = ticketId.trim().toUpperCase();
    if (!normalized) {
      setFlow(null);
      setErrorMessage('');
      setApproval('');
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setErrorMessage('');
      setApproval('');

      try {
        const response = await fetch('/api/auto-release', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId: normalized }),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.detail || 'Auto release flow failed');
        }

        setFlow(payload);
        setActiveCard('');
        toast.success(`Flow updated for ${payload.ticketId}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Auto release flow failed';
        setFlow(null);
        setErrorMessage(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }, 550);

    return () => clearTimeout(timer);
  }, [ticketId]);

  const totalScore = flow?.scorecard?.totalScore ?? 0;

  const cardDetails = useMemo(() => {
    if (!flow) return {};

    const planner = flow.planner || {};
    const builder = flow.builder || {};
    const qa = flow.qa || {};
    const risk = flow.risk || {};
    const scorecard = flow.scorecard || {};

    const plannerStatus = String(planner.status || '').toLowerCase();
    const plannerPriority = String(planner.priority || '').toLowerCase();
    const plannerAssignee = String(planner.assignee || '').trim().toLowerCase();
    const plannerDescription = String(planner.description || '').toLowerCase();

    const plannerStatusDone = ['done', 'closed', 'resolved'].includes(plannerStatus);
    const plannerPriorityHealthy = ['low', 'medium'].includes(plannerPriority);
    const plannerAssigneeAvailable = !['', 'unassigned', 'unspecified', 'none'].includes(plannerAssignee);
    const plannerNoBlockers = !plannerDescription.includes('blocker');

    const plannerBreakdown = [
      {
        label: 'Ticket status readiness',
        points: plannerStatusDone ? 10 : 4,
        max: 10,
        detail: `Current status: ${planner.status || 'Unknown'}`,
      },
      {
        label: 'Priority health',
        points: plannerPriorityHealthy ? 5 : 2,
        max: 5,
        detail: `Priority: ${planner.priority || 'Unknown'}`,
      },
      {
        label: 'Assignee ownership',
        points: plannerAssigneeAvailable ? 5 : 1,
        max: 5,
        detail: `Assignee: ${planner.assignee || 'Unassigned'}`,
      },
      {
        label: 'Blocker check',
        points: plannerNoBlockers ? 5 : 1,
        max: 5,
        detail: plannerNoBlockers ? 'No blockers found in ticket details.' : 'Potential blockers detected in ticket details.',
      },
    ];

    const prs = builder.prs || [];
    const prCount = Number(builder.prCount || 0);
    const primaryPr = prs[0] || {};
    const prStatus = String(primaryPr.status || '').toLowerCase();

    const prExists = prCount > 0;
    const prApproved = ['merged', 'open'].includes(prStatus);
    const prChecksPassed = ['merged', 'open'].includes(prStatus);
    const prMergeReady = prStatus === 'merged' || prStatus === 'open';

    const prBreakdown = [
      {
        label: 'PR link coverage',
        points: prExists ? 8 : 0,
        max: 8,
        detail: `${prCount} pull request(s) matched to ticket.`,
      },
      {
        label: 'Approval readiness',
        points: prApproved ? 6 : 1,
        max: 6,
        detail: `Primary PR status: ${primaryPr.status || 'Not found'}`,
      },
      {
        label: 'Checks heuristic',
        points: prChecksPassed ? 6 : 1,
        max: 6,
        detail: prChecksPassed ? 'Checks are treated as passing by status heuristic.' : 'Checks are not passing by status heuristic.',
      },
      {
        label: 'Merge readiness',
        points: prMergeReady ? 5 : 1,
        max: 5,
        detail: prMergeReady ? 'PR is open/merged and considered merge-ready.' : 'PR is not in a merge-ready state.',
      },
    ];

    const qaStatus = String(qa.qaStatus || '').toLowerCase();
    const totalTests = Number(qa.totalTests || 0);
    const passed = Number(qa.passed || 0);
    const failed = Number(qa.failed || 0);
    const coverage = Number(qa.coverage || 0);
    const passRate = totalTests > 0 ? (passed / totalTests) * 100 : 0;
    const regressionClean = qaStatus === 'passed' && failed === 0;

    const qaBreakdown = [
      {
        label: 'Pass rate quality',
        points: passRate >= 95 ? 12 : passRate >= 85 ? 8 : 4,
        max: 12,
        detail: `Pass rate: ${Math.round(passRate)}% (${passed}/${totalTests || 0})`,
      },
      {
        label: 'Failed test load',
        points: failed === 0 ? 10 : failed <= 2 ? 4 : 1,
        max: 10,
        detail: `${failed} failed test(s).`,
      },
      {
        label: 'Regression stability',
        points: regressionClean ? 6 : 2,
        max: 6,
        detail: regressionClean ? 'No regression risk detected.' : 'Regression or instability indicators present.',
      },
      {
        label: 'Coverage confidence',
        points: coverage >= 90 ? 7 : coverage >= 75 ? 4 : 1,
        max: 7,
        detail: `Coverage: ${coverage}%`,
      },
    ];

    const openSev1 = Number(risk.openSev1Bugs || 0);
    const blockers = Number(risk.deploymentBlockers || 0);
    const safeWindow = Boolean(risk.safeReleaseWindow);

    const riskBreakdown = [
      {
        label: 'Critical bug pressure',
        points: openSev1 === 0 ? 6 : 0,
        max: 6,
        detail: `Open Sev1 bugs: ${openSev1}`,
      },
      {
        label: 'Deployment blockers',
        points: blockers === 0 ? 5 : 0,
        max: 5,
        detail: `Deployment blockers: ${blockers}`,
      },
      {
        label: 'Safe release window',
        points: safeWindow ? 4 : 1,
        max: 4,
        detail: safeWindow ? 'Current UTC window is marked safe.' : 'Current UTC window is outside preferred release time.',
      },
    ];

    const buildDetail = (title, score, max, breakdown, recommendation) => {
      const positiveFactors = breakdown.filter((item) => item.points === item.max).map((item) => item.detail);
      const negativeFactors = breakdown.filter((item) => item.points < item.max).map((item) => item.detail);
      const missingPoints = breakdown
        .filter((item) => item.points < item.max)
        .map((item) => ({ label: item.label, points: item.max - item.points }));

      return {
        title,
        score,
        max,
        summary: `${Math.round((score / Math.max(max, 1)) * 100)}% category readiness`,
        breakdown,
        positiveFactors,
        negativeFactors,
        missingPoints,
        recommendation,
      };
    };

    return {
      planner: buildDetail(
        'Planner Score',
        Number(scorecard.plannerScore || 0),
        Number(scorecard.plannerMax || 25),
        plannerBreakdown,
        plannerAssigneeAvailable && plannerStatusDone
          ? 'Keep ticket metadata stable and preserve blocker-free descriptions to maintain planning score.'
          : 'Close the ticket state loop, assign clear ownership, and remove blocker flags from Jira context to recover planner points.'
      ),
      pr: buildDetail(
        'PR Score',
        Number(scorecard.prScore || 0),
        Number(scorecard.prMax || 25),
        prBreakdown,
        prExists
          ? 'Strengthen review confidence by ensuring approvals and check status are explicit in the PR metadata.'
          : 'Create and link at least one PR for this ticket, then push it to open or merged state to unlock score quickly.'
      ),
      qa: buildDetail(
        'QA Score',
        Number(scorecard.qaScore || 0),
        Number(scorecard.qaMax || 35),
        qaBreakdown,
        failed === 0 && coverage >= 90
          ? 'Maintain current quality gate and monitor regression drift before release.'
          : 'Reduce failing tests first, then increase coverage toward 90% to reclaim most QA points.'
      ),
      risk: buildDetail(
        'Risk Score',
        Number(scorecard.riskScore || 0),
        Number(scorecard.riskMax || 15),
        riskBreakdown,
        openSev1 === 0 && blockers === 0
          ? 'Preserve release discipline and execute during safe windows to sustain risk confidence.'
          : 'Resolve Sev1 and deployment blockers before release and prefer safe UTC windows for production rollout.'
      ),
    };
  }, [flow]);

  const activeDetail = activeCard ? cardDetails[activeCard] : null;

  const automatedDecision = useMemo(() => {
    if (totalScore >= 90) return 'Ready for Production';
    if (totalScore >= 75) return 'Human Review Required';
    return 'Hold Release';
  }, [totalScore]);

  const finalStatus = useMemo(() => {
    if (approval === 'approve') return 'Approved for Production';
    if (approval === 'hold') return 'Release on Hold';
    if (approval === 'reject') return 'Release Rejected';
    return automatedDecision;
  }, [approval, automatedDecision]);

  const statusTone =
    finalStatus === 'Approved for Production' || finalStatus === 'Ready for Production'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : finalStatus === 'Human Review Required' || finalStatus === 'Release on Hold'
        ? 'bg-amber-100 text-amber-800 border-amber-200'
        : 'bg-rose-100 text-rose-800 border-rose-200';

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-slate-200/60 backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-indigo-700">Release Command Center</p>
              <h1 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">AUTO RELEASE FLOW SCORECARD</h1>
              <p className="mt-2 text-sm text-slate-600 sm:text-base">
                AI + Human Governed Release Readiness Platform
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Auto Trigger Enabled</span>
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                {timestamp.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Jira Ticket ID
              <input
                type="text"
                value={ticketId}
                onChange={(event) => setTicketId(event.target.value.toUpperCase())}
                placeholder="SR-2"
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold tracking-[0.08em] text-slate-900 outline-none transition focus:border-indigo-500"
              />
            </label>
            <div className="rounded-2xl border border-slate-300 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Environment</p>
              <div className="mt-2"><EnvironmentBadge value={environment} /></div>
            </div>
            <div className="rounded-2xl border border-slate-300 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Flow State</p>
              <p className="mt-2 text-sm font-bold text-slate-800">{loading ? 'Orchestrating agents...' : 'Standby'}</p>
            </div>
          </div>

          {errorMessage ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {errorMessage}
            </div>
          ) : null}
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                title="Planner Score"
                value={`${flow?.scorecard?.plannerScore ?? 0}/${flow?.scorecard?.plannerMax ?? 25}`}
                subtitle="Jira readiness"
                color="planner"
                band={getBand(flow?.scorecard?.plannerScore ?? 0, flow?.scorecard?.plannerMax ?? 25)}
                interactive
                active={activeCard === 'planner'}
                onClick={() => setActiveCard('planner')}
              />
              <MetricCard
                title="PR Score"
                value={`${flow?.scorecard?.prScore ?? 0}/${flow?.scorecard?.prMax ?? 25}`}
                subtitle="Code integration"
                color="pr"
                band={getBand(flow?.scorecard?.prScore ?? 0, flow?.scorecard?.prMax ?? 25)}
                interactive
                active={activeCard === 'pr'}
                onClick={() => setActiveCard('pr')}
              />
              <MetricCard
                title="QA Score"
                value={`${flow?.scorecard?.qaScore ?? 0}/${flow?.scorecard?.qaMax ?? 35}`}
                subtitle="Test quality"
                color="qa"
                band={getBand(flow?.scorecard?.qaScore ?? 0, flow?.scorecard?.qaMax ?? 35)}
                interactive
                active={activeCard === 'qa'}
                onClick={() => setActiveCard('qa')}
              />
              <MetricCard
                title="Risk Score"
                value={`${flow?.scorecard?.riskScore ?? 0}/${flow?.scorecard?.riskMax ?? 15}`}
                subtitle="Production safety"
                color="risk"
                band={getBand(flow?.scorecard?.riskScore ?? 0, flow?.scorecard?.riskMax ?? 15)}
                interactive
                active={activeCard === 'risk'}
                onClick={() => setActiveCard('risk')}
              />
              <MetricCard
                title="Total Score"
                value={`${flow?.scorecard?.totalScore ?? 0}/${flow?.scorecard?.totalMax ?? 100}`}
                subtitle="Release readiness"
                color="total"
                band={getBand(flow?.scorecard?.totalScore ?? 0, flow?.scorecard?.totalMax ?? 100)}
              />
            </div>

            <article className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-200/50 backdrop-blur-xl">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Decision Panel</p>
                  <h2 className="mt-2 text-3xl font-black text-slate-900">{finalStatus}</h2>
                  <p className="mt-2 text-sm text-slate-600">{flow?.releaseManager?.recommendedAction || 'Awaiting orchestration output'}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Ticket: {flow?.ticketId || 'N/A'} • Last Updated: {flow?.releaseManager?.lastUpdated ? new Date(flow.releaseManager.lastUpdated).toLocaleString() : '-'}
                  </p>
                </div>
                <CircularMeter score={totalScore} />
              </div>

              <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full ${totalScore >= 90 ? 'bg-emerald-500' : totalScore >= 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.max(0, Math.min(100, totalScore))}%` }}
                />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setApproval('approve')}
                  className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Approve Release
                </button>
                <button
                  type="button"
                  onClick={() => setApproval('hold')}
                  className="rounded-2xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
                >
                  Hold Release
                </button>
                <button
                  type="button"
                  onClick={() => setApproval('reject')}
                  className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
                >
                  Reject Release
                </button>
              </div>

              <div className={`mt-4 inline-flex rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] ${statusTone}`}>
                Final Decision: {finalStatus} • Confidence {flow?.releaseManager?.confidence ?? 0}%
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-200/50 backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Operations Insight</p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Blockers Count</p>
                  <p className="mt-2 text-2xl font-black text-slate-900">{flow?.blockersCount ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Risk Engine</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">
                    Sev1: {flow?.risk?.openSev1Bugs ?? 0} • Blockers: {flow?.risk?.deploymentBlockers ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">Safe Window: {flow?.risk?.safeReleaseWindow ? 'Yes' : 'No'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Trend Snapshot</p>
                  <div className="mt-3 flex items-end gap-1.5">
                    {[58, 66, 74, 79, 85, totalScore || 62].map((n, i) => (
                      <div key={i} className="w-6 rounded-t bg-indigo-400/70" style={{ height: `${Math.max(20, n)}px` }} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Recent Deployment History</p>
                <div className="mt-2 space-y-2">
                  {(flow?.recentDeployments || []).map((item) => (
                    <div key={`${item.version}-${item.time}`} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm">
                      <span className="font-semibold text-slate-900">{item.version}</span>
                      <span className="text-slate-600">{new Date(item.time).toLocaleString()}</span>
                      <span className={`font-bold ${item.status === 'Success' ? 'text-emerald-600' : 'text-rose-600'}`}>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            {/* ── Universal Selenium QAAgent Panel ──────────────────────── */}
            <QAAgentPanel ticketId={ticketId.trim().toUpperCase() || ''} />
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-slate-950 p-6 shadow-lg shadow-slate-300/30">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">Execution Trace</p>
            <h2 className="mt-2 text-2xl font-black text-white">Live Agent Logs</h2>
            <p className="mt-2 text-sm text-slate-400">PlannerAgent -&gt; BuilderAgent -&gt; QAAgent -&gt; Risk Engine -&gt; ReleaseManager</p>

            <div className="mt-6 space-y-3">
              {(flow?.logs || []).length ? (
                flow.logs.map((entry, idx) => (
                  <article key={`${entry.step}-${idx}`} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">{entry.step}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">{entry.message}</p>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-5 text-sm text-slate-400">
                  Enter ticket ID to start orchestration trace.
                </div>
              )}
            </div>
          </aside>
        </section>
      </div>

      <ScoreDetailDrawer open={Boolean(activeDetail)} onClose={() => setActiveCard('')} detail={activeDetail} />
    </div>
  );
}

export default App;
