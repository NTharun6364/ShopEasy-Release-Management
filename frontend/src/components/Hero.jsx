import { Link } from 'react-router-dom';

function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-100 via-rose-100 to-sky-100 px-6 py-12 shadow-sm md:px-12 md:py-16">
      <div className="absolute -right-16 -top-12 h-44 w-44 rounded-full bg-orange-300/50 blur-2xl" />
      <div className="absolute -bottom-12 left-20 h-40 w-40 rounded-full bg-sky-300/50 blur-2xl" />

      <div className="relative max-w-2xl space-y-4">
        <p className="inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-700">
          New season arrivals
        </p>
        <h1 className="text-4xl font-black leading-tight text-slate-900 md:text-5xl">
          Shop smarter, live better with ShopEasy.
        </h1>
        <p className="text-base text-slate-700 md:text-lg">
          Discover curated products, effortless checkout, and a shopping experience crafted for speed and style.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            to="/products"
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Start Shopping
          </Link>
          <Link
            to="/signup"
            className="rounded-full border border-slate-800 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white"
          >
            Create Account
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Hero;
