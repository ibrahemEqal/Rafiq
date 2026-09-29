export default function BooksLoading() {
  return <div className="min-h-screen bg-[#f5f7fb] px-4 pb-24 pt-10" aria-busy="true" aria-label="Loading">
    <div className="mx-auto max-w-7xl animate-pulse">
      <div className="h-72 rounded-[2rem] bg-slate-900" />
      <div className="mx-auto -mt-5 h-44 max-w-6xl rounded-[1.75rem] border border-slate-200 bg-white" />
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-80 rounded-[1.75rem] border border-slate-200 bg-white" />)}</div>
    </div>
  </div>;
}
