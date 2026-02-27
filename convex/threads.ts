import { mutation } from "./_generated/server";

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
