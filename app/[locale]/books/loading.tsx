export default function BooksLoading() {
  return <div aria-busy="true" aria-label="Loading" className="mx-auto max-w-7xl animate-pulse space-y-6 px-4 py-8 motion-reduce:animate-none"><div className="h-72 rounded-[2rem] bg-slate-200" /><div className="h-32 rounded-3xl bg-slate-200" /><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2, 3, 4, 5].map(item => <div key={item} className="h-80 rounded-3xl bg-slate-200" />)}</div></div>;
}
