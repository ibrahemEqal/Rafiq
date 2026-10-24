export const fieldClass =
  "w-full min-w-0 rounded-xl border border-line bg-[#fafbf8] px-3.5 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-50";
export const saveClass =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#163d35] px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50";
export function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-bold text-ink"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
