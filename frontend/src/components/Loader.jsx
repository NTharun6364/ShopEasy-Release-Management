function Loader({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700">
        <span className="h-3 w-3 animate-pulse rounded-full bg-orange-500" />
        {label}
      </div>
    </div>
  );
}

export default Loader;
