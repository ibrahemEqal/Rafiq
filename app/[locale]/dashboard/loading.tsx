export default function DashboardLoading() {
  return <div aria-busy="true" className="mx-auto w-full max-w-5xl animate-pulse space-y-5 px-4 py-12">
    <div className="h-44 rounded-3xl bg-slate-200" />
    {[1, 2, 3].map((item) => <div key={item} className="h-52 rounded-2xl bg-slate-100" />)}
  </div>;
}
