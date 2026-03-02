// convex/sessions.ts
// Anonymous session creation for the Customer Mini App.
// Returns the Convex document _id as a stable session identifier.

import { mutation } from "./_generated/server";

export const createSession = mutation({
  args: {},
  handler: async (ctx) => {
    const id = await ctx.db.insert("sessions", {
      createdAt: Date.now(),
    });
    return id;
  },
});
