// convex/affiliates.ts
import { query } from "./_generated/server";

// ── Ethiopia time (UTC+3) — same helper as dashboard.ts ────────────────────
const ETH_OFFSET_MS = 3 * 60 * 60 * 1000;

function ethTodayStart(now: number): number {
  const ethNow = now + ETH_OFFSET_MS;
  const ethMidnight = ethNow - (ethNow % 86_400_000);
  return ethMidnight - ETH_OFFSET_MS;
}

export const getOverview = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const todayStart = ethTodayStart(now);

    // ── Active affiliate count ────────────────────────────────────────────
    const activeAffiliates = await ctx.db
      .query("affiliates")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();
    const totalAffiliates = activeAffiliates.length;

    // ── All referrals ─────────────────────────────────────────────────────
    const allReferrals = await ctx.db.query("referrals").collect();

    // Distinct referred users
    const uniqueUsers = new Set(allReferrals.map((r) => r.referredTelegramUserId));
    const totalReferredPeople = uniqueUsers.size;

    // New today (Ethiopian timezone)
    const newReferralsToday = allReferrals.filter(
      (r) => r.createdAt >= todayStart
    ).length;

    // Top 3 codes by total referral count
    const codeCounts = new Map<string, number>();
    for (const r of allReferrals) {
      codeCounts.set(r.code, (codeCounts.get(r.code) ?? 0) + 1);
    }
    const topCodes = Array.from(codeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([code, count]) => ({ code, count }));

    // Recent 5 referrals newest-first
    const recentReferrals = [...allReferrals]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map((r) => ({
        code: r.code,
        referredTelegramUserId: r.referredTelegramUserId,
        createdAt: r.createdAt,
        source: r.source,
      }));

    return {
      totalAffiliates,
      totalReferredPeople,
      newReferralsToday,
      topCodes,
      recentReferrals,
    };
  },
});
