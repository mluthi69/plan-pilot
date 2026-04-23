/**
 * NDIA bulk-payment-request CSV export.
 * Format follows the NDIA "Bulk Payment Request" template for plan managers.
 * Columns chosen from the canonical spec:
 *   RegistrationNumber, NDISNumber, SupportsDeliveredFrom, SupportsDeliveredTo,
 *   SupportNumber, ClaimReference, Quantity, Hours, UnitPrice, GSTCode, ClaimType, ABN
 */
import type { Invoice } from "@/hooks/useInvoices";

export interface ClaimRow {
  invoice: Invoice;
  participantNdis?: string | null;
  registrationNumber?: string | null;
  supportNumber?: string | null;
  hours?: number | null;
  unitPrice?: number | null;
  serviceFrom?: string | null;
  serviceTo?: string | null;
}

function csvCell(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function dayString(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  // NDIA expects DD/MM/YYYY
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

const HEADERS = [
  "RegistrationNumber",
  "NDISNumber",
  "SupportsDeliveredFrom",
  "SupportsDeliveredTo",
  "SupportNumber",
  "ClaimReference",
  "Quantity",
  "Hours",
  "UnitPrice",
  "GSTCode",
  "ClaimType",
  "ABN",
] as const;

export function buildClaimCsv(rows: ClaimRow[]): string {
  const out: string[] = [HEADERS.join(",")];
  for (const r of rows) {
    const inv = r.invoice;
    const hours = r.hours ?? 1;
    const qty = hours;
    const unit = r.unitPrice ?? Number(inv.amount) / qty;
    const line = [
      r.registrationNumber ?? "",
      (r.participantNdis ?? "").replace(/\s+/g, ""),
      dayString(r.serviceFrom ?? inv.received_at),
      dayString(r.serviceTo ?? inv.received_at),
      r.supportNumber ?? "",
      inv.invoice_number,
      qty.toFixed(2),
      hours.toFixed(2),
      unit.toFixed(2),
      "P2", // GST-free
      "Standard",
      inv.provider_abn ?? "",
    ].map(csvCell);
    out.push(line.join(","));
  }
  return out.join("\r\n") + "\r\n";
}

export function downloadCsv(filename: string, contents: string) {
  const blob = new Blob([contents], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}