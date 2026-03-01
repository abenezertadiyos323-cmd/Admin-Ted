// convex/affiliates.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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

// ── getOrCreateMyAffiliate ────────────────────────────────────────────────
// Called by the customer mini app Earn page on load.
// Returns existing affiliate for this user, or creates one.
// Code format: "REF" + 6 random digits (100000–999999). Collision-safe.

export const getOrCreateMyAffiliate = mutation({
  args: { telegramUserId: v.string() },
  handler: async (ctx, { telegramUserId }) => {
    // 1. Return existing affiliate if present
    const existing = await ctx.db
      .query("affiliates")
      .withIndex("by_ownerTelegramUserId", (q) =>
        q.eq("ownerTelegramUserId", telegramUserId)
      )
      .first();
    if (existing) return existing;

    // 2. Generate a unique 6-digit code, collision-safe
    let code: string;
    let attempts = 0;
    do {
      if (++attempts > 10) throw new Error("Failed to generate unique affiliate code after 10 attempts");
      code = "REF" + Math.floor(100_000 + Math.random() * 900_000).toString();
    } while (
      await ctx.db
        .query("affiliates")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first()
    );

    // 3. Insert and return the new affiliate
    const id = await ctx.db.insert("affiliates", {
      code,
      ownerTelegramUserId: telegramUserId,
      createdAt: Date.now(),
      status: "active",
    });

    // ctx.db.get cannot return null here — we just inserted this document
    return (await ctx.db.get(id))!;
  },
});

// ── trackReferral ─────────────────────────────────────────────────────────
// Called by the Telegram bot on /start <code>, or any referral surface.
// Validates the code is active, then records the referral idempotently.
// Silent no-op on unknown/inactive codes; no-op on duplicate (code, user) pairs.

export const trackReferral = mutation({
  args: {
    code: v.string(),
    referredTelegramUserId: v.string(),
    source: v.optional(v.string()),
  },
  handler: async (ctx, { code, referredTelegramUserId, source }) => {
    // 1. Ensure affiliate exists and is active
    const aff = await ctx.db
      .query("affiliates")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
    if (!aff || aff.status !== "active") return null;

    // 2. Idempotent: one referral per (code + referredTelegramUserId)
    const existing = await ctx.db
      .query("referrals")
      .withIndex("by_code_referredTelegramUserId", (q) =>
        q.eq("code", code).eq("referredTelegramUserId", referredTelegramUserId)
      )
      .first();
    if (existing) return existing;

    // 3. Insert and return new referral
    const id = await ctx.db.insert("referrals", {
      code,
      referredTelegramUserId,
      createdAt: Date.now(),
      source: source ?? "telegram_start",
    });

    return (await ctx.db.get(id))!;
  },
});
