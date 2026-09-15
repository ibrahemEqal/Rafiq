export default function PageSkeleton() {
  return <div aria-busy="true" aria-label="Loading / جارٍ التحميل" className="mx-auto w-full max-w-6xl space-y-8 px-4 py-12 motion-safe:animate-pulse">
    <div className="h-10 w-64 max-w-full rounded-xl bg-slate-200" />
    <div className="h-5 w-96 max-w-full rounded-lg bg-slate-100" />
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="h-72 rounded-3xl border border-slate-100 bg-white" />)}
    </div>
  </div>;
}
