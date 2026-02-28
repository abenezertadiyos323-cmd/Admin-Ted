// convex/demand.ts
// Demand event logging for the TedyTech bot and mini app.
//
// Callers:
//   - Telegram bot (n8n): logs source="bot" when a customer asks about a phone type
//   - Mini app search:    logs source="search" when a customer searches a phone type
//   - Mini app selection: logs source="select" when a customer submits an exchange form
//
// POST https://<deployment>.convex.cloud/api/mutation
// { "path": "demand:logDemandEvent", "args": { "source": "bot", "phoneType": "iPhone 15 Pro", ... } }

import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const logDemandEvent = mutation({
  args: {
    source: v.union(
      v.literal("bot"),
      v.literal("search"),
      v.literal("select"),
    ),
    phoneType: v.string(),
    userId: v.optional(v.string()),
    threadId: v.optional(v.id("threads")),
    meta: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const trimmed = args.phoneType.trim();
    if (!trimmed) {
      throw new Error("phoneType must be non-empty");
    }
    return await ctx.db.insert("demand_events", {
      source: args.source,
      phoneType: trimmed,
      createdAt: Date.now(),
      userId: args.userId,
      threadId: args.threadId,
      meta: args.meta,
    });
  },
});
