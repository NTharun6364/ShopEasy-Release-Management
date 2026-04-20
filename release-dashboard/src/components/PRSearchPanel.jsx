import { useState } from 'react';
import toast from 'react-hot-toast';

function PRSearchPanel() {
  const [ticketId, setTicketId] = useState('');
  const [prResults, setPRResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSearchPR = async () => {
    const normalizedTicketId = ticketId.trim().toUpperCase();
    if (!normalizedTicketId) {
      toast.error('Enter a Jira Ticket ID');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/search-pr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ticketId: normalizedTicketId }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.detail || 'Unable to search GitHub PRs');
      }

      setPRResults(payload.prs || []);
      if (payload.prCount === 0) {
        toast.info(`No pull requests found for ${normalizedTicketId}`);
      } else {
        toast.success(`Found ${payload.prCount} pull request(s)`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to search GitHub PRs';
      setPRResults([]);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-green-700">BuilderAgent</p>
      <h2 className="mt-2 text-2xl font-black text-slate-900">GitHub PR Search</h2>
      <p className="mt-2 text-sm text-slate-600">
        Search for pull requests by Jira ticket ID in the PR title.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Jira Ticket ID
          <input
            type="text"
            value={ticketId}
            onChange={(event) => setTicketId(event.target.value.toUpperCase())}
            placeholder="SR-2"
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold tracking-[0.08em] text-slate-900 outline-none transition focus:border-green-500"
          />
        </label>
        <button
          type="button"
          onClick={handleSearchPR}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
        >
          {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
          {loading ? 'Searching...' : 'Search PRs'}
        </button>
      </div>

      {errorMessage ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        {prResults.length > 0 ? (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Pull Requests ({prResults.length})
            </p>
            <div className="space-y-3">
              {prResults.map((pr) => (
                <div key={pr.prNumber} className="rounded-2xl border border-slate-300 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <a
                        href={pr.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base font-bold text-slate-900 hover:text-green-600"
                      >
                        #{pr.prNumber} {pr.prTitle}
                      </a>
                      <p className="mt-1 text-xs text-slate-600">
                        <span className="font-semibold">{pr.repoName}</span> • Branch: <span className="font-semibold">{pr.branch}</span>
                      </p>
                    </div>
                    <div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          pr.status === 'Open'
                            ? 'bg-blue-100 text-blue-700'
                            : pr.status === 'Merged'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {pr.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center text-sm text-slate-500">
            Enter a Jira ticket ID to search for related pull requests.
          </div>
        )}
      </div>
    </article>
  );
}

export default PRSearchPanel;
