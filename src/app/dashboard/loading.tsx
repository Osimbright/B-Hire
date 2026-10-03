export default function DashboardLoading() {
  return (
    <div className="animate-pulse" aria-label="Loading">
      <div className="mb-8 h-12 w-64 rounded-2xl bg-line/70" />
      <div className="grid gap-4 xl:grid-cols-12">
        <div className="h-72 rounded-3xl bg-line/50 xl:col-span-7" />
        <div className="h-72 rounded-3xl bg-line/50 xl:col-span-5" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-56 rounded-3xl bg-line/50 xl:col-span-4" />
        ))}
      </div>
    </div>
  );
}
