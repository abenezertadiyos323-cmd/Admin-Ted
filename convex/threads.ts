import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * One-time backfill: for each thread missing firstMessageAt,
 * find its earliest customer message and store the timestamp.
 * Safe to run multiple times (skips threads already set).
 */
export const backfillFirstMessageAt = mutation({
  args: {},
  handler: async (ctx) => {
    const threads = await ctx.db.query("threads").collect();
    let updated = 0;
    for (const thread of threads) {
      if (thread.firstMessageAt != null) continue; // already set
      const firstMsg = await ctx.db
        .query("messages")
        .withIndex("by_threadId_and_createdAt", (q) =>
          q.eq("threadId", thread._id)
        )
        .filter((q) => q.eq(q.field("sender"), "customer"))
        .first(); // ascending by createdAt → earliest customer message
      if (firstMsg) {
        await ctx.db.patch(thread._id, { firstMessageAt: firstMsg.createdAt });
        updated++;
      }
    }
    return { updated, total: threads.length };
  },
});

/**
 * Badge count: number of threads with status "new"
 * (customer messaged, admin hasn't replied/seen yet).
 * Used by the BottomNav Inbox badge.
 */
export const getInboxBadgeCount = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("threads")
      .withIndex("by_status", (q) => q.eq("status", "new"))
      .collect();
    return rows.length;
  },
});

/**
 * Badge count: number of exchanges with status "Pending".
 * Used by the BottomNav Exchange badge.
 */
export const getExchangeBadgeCount = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("exchanges")
      .withIndex("by_status", (q) => q.eq("status", "Pending"))
      .collect();
    return rows.length;
  },
});

/**
 * List all non-done threads sorted by lastMessageAt descending.
 * Category (hot/warm/cold) is computed client-side from the returned fields.
 */
export const listThreads = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db
      .query("threads")
      .withIndex("by_lastMessageAt")
      .order("desc")
      .collect();
    return all.filter((t) => t.status !== "done");
  },
});

/**
 * Get a single thread by ID. Returns null if not found.
 */
export const getThread = query({
  args: { threadId: v.id("threads") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.threadId);
  },
});

/**
 * List all messages for a thread sorted ascending by createdAt.
 */
export const listThreadMessages = query({
  args: { threadId: v.id("threads") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_threadId_and_createdAt", (q) =>
        q.eq("threadId", args.threadId)
      )
      .order("asc")
      .collect();
  },
});

/**
 * Mark a thread as seen and clear unreadCount.
 * Called by ThreadDetail when an admin opens a new thread.
 */
export const markThreadSeen = mutation({
  args: { threadId: v.id("threads") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.threadId, {
      status: "seen",
      unreadCount: 0,
      updatedAt: Date.now(),
    });
  },
});
