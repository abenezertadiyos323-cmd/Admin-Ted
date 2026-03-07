// convex/phoneActions.ts
// Customer mini app phone actions and exchange request submission.
// No admin auth required — called directly by the customer app.

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a phone action record (inquiry, exchange, call, map).
 * Called by customer mini app to track user interactions.
 */
export const createPhoneActionRequest = mutation({
  args: {
    sessionId: v.string(),
    actionType: v.union(
      v.literal("inquiry"),
      v.literal("exchange"),
      v.literal("call"),
      v.literal("map"),
    ),
    sourceTab: v.union(
      v.literal("home"),
      v.literal("search"),
      v.literal("saved"),
      v.literal("product_detail"),
      v.literal("about"),
    ),
    sourceProductId: v.optional(v.string()),
    timestamp: v.optional(v.number()),
    // Legacy fields kept optional for backward compatibility.
    phoneId: v.optional(v.string()),
    variantId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sourceProductId = args.sourceProductId ?? args.phoneId;
    const id = await ctx.db.insert("phoneActions", {
      sessionId: args.sessionId,
      actionType: args.actionType,
      sourceTab: args.sourceTab,
      sourceProductId: sourceProductId ?? undefined,
      timestamp: args.timestamp ?? Date.now(),
      phoneId: args.phoneId ?? sourceProductId ?? undefined,
      variantId: args.variantId ?? undefined,
      createdAt: Date.now(),
    });
    return id;
  },
});

/**
 * Create an exchange request from the customer mini app.
 * Stores raw customer submission (brand name, storage, condition, notes).
 * Returns the leadId for the customer to include in Telegram deep link.
 */
export const createExchangeRequestMiniapp = mutation({
  args: {
    sessionId: v.string(),
    desiredPhoneId: v.string(),
    offeredModel: v.string(),
    offeredStorageGb: v.number(),
    offeredCondition: v.string(),
    offeredNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("exchangeRequests", {
      sessionId: args.sessionId,
      desiredPhoneId: args.desiredPhoneId,
      offeredModel: args.offeredModel,
      offeredStorageGb: args.offeredStorageGb,
      offeredCondition: args.offeredCondition,
      offeredNotes: args.offeredNotes ?? "",
      status: "new",
      createdAt: Date.now(),
    });
    return id;
  },
});

/**
 * Query exchange requests by session.
 * Called by customer app useExchangeRequests hook.
 */
export const getExchangeRequestsV2 = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("exchangeRequests")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .collect();
  },
});

/**
 * Get exchange request detail.
 * Called by customer app useExchangeDetail hook.
 * Returns { request, images } shape for compatibility.
 * No authorization — exchangeRequests are customer submissions identified by ID.
 */
export const getExchangeDetailV2 = query({
  args: {
    requestId: v.id("exchangeRequests"),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.requestId);
    if (!doc) return {};

    // Verify ownership if sessionId provided
    if (args.sessionId && doc.sessionId !== args.sessionId) return {};

    return {
      request: doc,
      images: [],
    };
  },
});
