/**
 * Combines per-category plan budgets with agreement commitments
 * and invoice activity to produce a real utilisation breakdown.
 */
import type { BudgetCategory } from "@/hooks/useBudgetCategories";
import type { ServiceAgreement } from "@/hooks/useAgreements";
import type { Invoice } from "@/hooks/useInvoices";

export interface CategoryUtilisation extends BudgetCategory {
  committed: number; // active agreement value, attributed to category
  pending: number;   // invoices: pending / approved / exception
  paid: number;      // invoices: paid
  used: number;
  remaining: number;
  pct: number;
}

/** Map an invoice's category string onto a budget code bucket. */
function invoiceCodeBucket(cat: string): "Core" | "CB" | "Capital" {
  if (/capacity/i.test(cat)) return "CB";
  if (/capital/i.test(cat)) return "Capital";
  return "Core";
}

/**
 * Distribute a single dollar amount across categories that share the
 * given code, weighted by their budget. Falls back to first category
 * of that code if budgets are zero.
 */
function distribute(
  amount: number,
  code: "Core" | "CB" | "Capital",
  cats: BudgetCategory[],
  out: Map<string, number>,
) {
  const matching = cats.filter((c) => c.code === code);
  if (matching.length === 0) return;
  const totalBudget = matching.reduce((s, c) => s + Number(c.budget ?? 0), 0);
  if (totalBudget <= 0) {
    const first = matching[0];
    out.set(first.id, (out.get(first.id) ?? 0) + amount);
    return;
  }
  for (const c of matching) {
    const share = (Number(c.budget) / totalBudget) * amount;
    out.set(c.id, (out.get(c.id) ?? 0) + share);
  }
}

export function buildCategoryUtilisation(
  categories: BudgetCategory[],
  agreements: ServiceAgreement[],
  invoices: Invoice[],
): CategoryUtilisation[] {
  const committed = new Map<string, number>();
  const pending = new Map<string, number>();
  const paid = new Map<string, number>();

  // Active agreement total spread across Core (most agreements are direct support)
  for (const a of agreements) {
    if (a.status !== "active") continue;
    distribute(Number(a.total_value ?? 0), "Core", categories, committed);
  }

  // Invoices: bucket by category code, then split by status
  for (const inv of invoices) {
    const bucket = invoiceCodeBucket(inv.category);
    const amount = Number(inv.amount ?? 0);
    if (inv.status === "paid") {
      distribute(amount, bucket, categories, paid);
    } else if (
      inv.status === "pending" ||
      inv.status === "approved" ||
      inv.status === "exception"
    ) {
      distribute(amount, bucket, categories, pending);
    }
  }

  return categories.map((c) => {
    const com = committed.get(c.id) ?? 0;
    const pen = pending.get(c.id) ?? 0;
    const pd = paid.get(c.id) ?? 0;
    const used = com + pen + pd;
    const budget = Number(c.budget ?? 0);
    const remaining = budget - used;
    const pct = budget > 0 ? Math.min(100, Math.round((used / budget) * 100)) : 0;
    return { ...c, committed: com, pending: pen, paid: pd, used, remaining, pct };
  });
}