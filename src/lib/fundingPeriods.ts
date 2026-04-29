/**
 * Pure helpers for NDIS funding period math.
 *
 * Rules:
 *  - A booking spends from the period its date falls in.
 *  - If `allow_unspent_rollover` is true, leftover from earlier periods is
 *    added to the current period's available amount.
 *  - Future periods NEVER contribute to the current period's availability.
 */

export interface FundingPeriod {
  id: string;
  agreement_category_id: string;
  period_index: number;
  period_start: string; // ISO date
  period_end: string;   // ISO date (inclusive)
  allocated_amount: number;
}

export interface PeriodSpend {
  period_id: string;
  spent: number;
}

/** Find the funding period a given date falls in. */
export function findPeriodFor(
  date: Date | string,
  periods: FundingPeriod[],
): FundingPeriod | null {
  const t = (typeof date === "string" ? new Date(date) : date).getTime();
  return periods.find((p) => {
    const s = new Date(p.period_start).getTime();
    const e = new Date(p.period_end + "T23:59:59").getTime();
    return t >= s && t <= e;
  }) ?? null;
}

export interface AvailabilityBreakdown {
  allocated: number;
  rolledOver: number;
  spent: number;
  available: number;
}

/**
 * Compute available funds for `period`, given spend per period and the
 * rollover preference. Earlier-period unspent funds are added when allowed.
 */
export function computeAvailable(
  period: FundingPeriod,
  allPeriods: FundingPeriod[],
  spendByPeriod: Record<string, number>,
  rolloverEnabled: boolean,
): AvailabilityBreakdown {
  const sameCat = allPeriods.filter(
    (p) => p.agreement_category_id === period.agreement_category_id,
  );

  let rolledOver = 0;
  if (rolloverEnabled) {
    for (const p of sameCat) {
      if (p.period_index < period.period_index) {
        const leftover = Math.max(
          0,
          Number(p.allocated_amount) - (spendByPeriod[p.id] ?? 0),
        );
        rolledOver += leftover;
      }
    }
  }

  const spent = spendByPeriod[period.id] ?? 0;
  const allocated = Number(period.allocated_amount);
  return {
    allocated,
    rolledOver,
    spent,
    available: Math.max(0, allocated + rolledOver - spent),
  };
}

/** hh:mm helper for time-based units. */
export function hoursBetween(start: Date | string, end: Date | string): number {
  const a = typeof start === "string" ? new Date(start) : start;
  const b = typeof end === "string" ? new Date(end) : end;
  return Math.max(0, (b.getTime() - a.getTime()) / 3_600_000);
}

export function formatHoursMinutes(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${m.toString().padStart(2, "0")}`;
}
