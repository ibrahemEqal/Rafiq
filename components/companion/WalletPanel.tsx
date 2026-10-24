"use client";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Trash2, Wallet, ArrowDownLeft } from "lucide-react";
import { walletSummary, moneyToCents } from "@/lib/companion/math";
import type { CompanionData } from "@/lib/companion/model";
import { Field, fieldClass, saveClass } from "./fields";
export default function WalletPanel({
  wallet,
  today,
  onSave,
  onAdd,
  busy,
}: {
  wallet: CompanionData["wallet"];
  today: string;
  onSave: (wallet: CompanionData["wallet"]) => Promise<boolean>;
  onAdd: () => void;
  busy: boolean;
}) {
  const t = useTranslations("Companion");
  const locale = useLocale();
  const summary = walletSummary(wallet, today);
  const [month, setMonth] = useState(today.slice(0, 7));
  const months = [
    ...new Set([
      today.slice(0, 7),
      ...wallet.expenses.map((item) => item.date.slice(0, 7)),
    ]),
  ]
    .sort()
    .reverse();
  const history = wallet.expenses.filter((item) => item.date.startsWith(month));
  const money = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 2,
    }).format(value / 100);
  async function budget(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = moneyToCents(
      String(new FormData(event.currentTarget).get("budget")),
    );
    if (value !== null) await onSave({ ...wallet, budgetCents: value });
  }
  async function remove(id: string) {
    if (!window.confirm(t("deleteExpenseConfirm"))) return;
    await onSave({
      ...wallet,
      expenses: wallet.expenses.filter((item) => item.id !== id),
    });
  }
  return (
    <div className="space-y-6">
      <section className="companion-paper p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="companion-eyebrow">
              <Wallet size={15} aria-hidden="true" />
              {t("walletEyebrow")}
            </p>
            <h2 className="mt-2 text-2xl font-bold">{t("walletTitle")}</h2>
          </div>
          <button type="button" onClick={onAdd} className={saveClass}>
            <Plus size={17} aria-hidden="true" />
            {t("addExpense")}
          </button>
        </div>
        <p className="mt-3 text-sm leading-7 text-muted">
          {t("walletHint")}
        </p>
        <div className="my-6 grid gap-3 sm:grid-cols-3">
          {[
            ["spentThisMonth", summary.spent],
            ["remainingBudget", wallet.budgetCents ? summary.remaining : null],
            ["dailyAllowance", summary.daily],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className={`rounded-2xl p-5 ${label === "remainingBudget" && Number(value) < 0 ? "bg-rose-50" : "bg-[#f4f5ee]"}`}
            >
              <p className="text-xs font-bold text-muted">
                {t(String(label))}
              </p>
              <p className="mt-3 break-words text-2xl font-bold text-[#183d34]">
                {value === null ? "—" : money(Number(value))}
              </p>
            </div>
          ))}
        </div>
        <form
          onSubmit={budget}
          className="grid items-end gap-3 rounded-2xl border border-line p-4 sm:grid-cols-[1fr_auto]"
        >
          <Field id="monthly-budget" label={t("monthlyBudget")}>
            <input
              id="monthly-budget"
              name="budget"
              type="number"
              min="0"
              max="1000000"
              step="0.01"
              required
              defaultValue={wallet.budgetCents / 100}
              className={fieldClass}
            />
          </Field>
          <button disabled={busy} className={saveClass}>
            {t("saveBudget")}
          </button>
        </form>
        <p className="mt-3 text-xs leading-6 text-muted">
          {t("budgetMathHint", { days: summary.remainingDays })}
        </p>
      </section>
      <section className="companion-paper p-5 sm:p-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-bold">{t("expenseHistory")}</h3>
          <select
            aria-label={t("expenseMonth")}
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            className="rounded-xl border border-line bg-paper px-3 py-2 text-sm"
          >
            {months.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        {history.length ? (
          <ul className="divide-y divide-line-soft">
            {[...history]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((expense) => (
                <li key={expense.id} className="flex items-center gap-3 py-4">
                  <span className="rounded-xl bg-amber-50 p-2.5 text-amber-700">
                    <ArrowDownLeft size={18} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p dir="auto" className="break-words text-sm font-bold">
                      {expense.title}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {t(`expenseCategories.${expense.category}`)} ·{" "}
                      {expense.date}
                    </p>
                  </div>
                  <span className="text-sm font-bold">
                    {money(expense.cents)}
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(expense.id)}
                    aria-label={t("deleteNamed", { name: expense.title })}
                    className="rounded-lg p-2 text-muted hover:text-red-700"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </li>
              ))}
          </ul>
        ) : (
          <p className="companion-empty">{t("noExpenses")}</p>
        )}
      </section>
    </div>
  );
}
