import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-10 text-center">
      <h1 className="text-4xl font-black text-slate-900">404</h1>
      <p className="mt-2 text-slate-600">The page you are looking for does not exist.</p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700"
      >
        Go Home
      </Link>
    </div>
  );
}

export default NotFoundPage;
