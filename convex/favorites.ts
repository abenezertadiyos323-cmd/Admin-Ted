// convex/favorites.ts
// Customer favorites — shared via the MASTER deployment.
// All handlers return safe defaults on missing/invalid input and never throw.

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getFavorites = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.userId) return [];

    return await ctx.db
      .query("favorites")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId!))
      .order("desc")
      .collect();
  },
});

export const addFavorite = mutation({
  args: {
    userId: v.string(),
    phoneId: v.string(),
  },
  handler: async (ctx, args) => {
    // Idempotent: no duplicate (userId, phoneId) pairs
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("phoneId"), args.phoneId))
      .first();

    if (existing) return existing._id;

    const id = await ctx.db.insert("favorites", {
      userId: args.userId,
      phoneId: args.phoneId,
      createdAt: Date.now(),
    });
    return id;
  },
});

export const removeFavorite = mutation({
  args: {
    userId: v.string(),
    phoneId: v.string(),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("favorites")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("phoneId"), args.phoneId))
      .first();

    if (!doc) return { success: false };

    await ctx.db.delete(doc._id);
    return { success: true };
  },
});
