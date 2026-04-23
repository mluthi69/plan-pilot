/**
 * Funding warning logic.
 * Surfaces participants whose plan is ending soon, who are over-spending
 * relative to elapsed plan time, or who have no active service agreement.
 */
import type { Participant } from "@/hooks/useParticipantsDb";
import type { ServiceAgreement } from "@/hooks/useAgreements";

export type FundingSeverity = "info" | "warn" | "critical";

export interface FundingWarning {
  participantId: string;
  participantName: string;
  severity: FundingSeverity;
  message: string;
  detail?: string;
}

const DAYS = 86_400_000;

function daysBetween(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / DAYS;
}

/** Total committed value of an active agreement. */
function activeCommitted(participantId: string, agreements: ServiceAgreement[]) {
  return agreements
    .filter((a) => a.participant_id === participantId && a.status === "active")
    .reduce((n, a) => n + Number(a.total_value ?? 0), 0);
}

export function buildFundingWarnings(
  participants: Participant[],
  agreements: ServiceAgreement[]
): FundingWarning[] {
  const now = new Date();
  const out: FundingWarning[] = [];

  for (const p of participants) {
    if (p.status !== "active") continue;

    // Plan end approaching
    if (p.plan_end) {
      const daysLeft = daysBetween(now, new Date(p.plan_end));
      if (daysLeft < 0) {
        out.push({
          participantId: p.id,
          participantName: p.name,
          severity: "critical",
          message: "Plan has expired",
          detail: `Ended ${new Date(p.plan_end).toLocaleDateString("en-AU")}`,
        });
      } else if (daysLeft <= 14) {
        out.push({
          participantId: p.id,
          participantName: p.name,
          severity: "critical",
          message: `Plan ends in ${Math.ceil(daysLeft)} days`,
          detail: `Ends ${new Date(p.plan_end).toLocaleDateString("en-AU")}`,
        });
      } else if (daysLeft <= 30) {
        out.push({
          participantId: p.id,
          participantName: p.name,
          severity: "warn",
          message: `Plan ends in ${Math.ceil(daysLeft)} days`,
          detail: `Renewal review needed`,
        });
      }
    }

    // Burn-rate vs elapsed plan time
    if (p.plan_start && p.plan_end && Number(p.total_budget) > 0) {
      const start = new Date(p.plan_start).getTime();
      const end = new Date(p.plan_end).getTime();
      const elapsed = Math.min(1, Math.max(0, (now.getTime() - start) / (end - start)));
      const expected = Number(p.total_budget) * elapsed;
      const committed = activeCommitted(p.id, agreements);
      if (committed > expected * 1.2 && elapsed > 0.1) {
        out.push({
          participantId: p.id,
          participantName: p.name,
          severity: "warn",
          message: "Spending faster than plan duration",
          detail: `Committed $${committed.toLocaleString("en-AU")} vs ~$${expected.toFixed(0)} expected at ${(elapsed * 100).toFixed(0)}% through plan`,
        });
      }
    }

    // No active agreement
    const hasActive = agreements.some(
      (a) => a.participant_id === p.id && a.status === "active"
    );
    if (!hasActive) {
      out.push({
        participantId: p.id,
        participantName: p.name,
        severity: "warn",
        message: "No active service agreement",
        detail: "New visits cannot be priced or claimed",
      });
    }
  }

  // Sort by severity then name
  const order: Record<FundingSeverity, number> = { critical: 0, warn: 1, info: 2 };
  return out.sort(
    (a, b) => order[a.severity] - order[b.severity] || a.participantName.localeCompare(b.participantName)
  );
}