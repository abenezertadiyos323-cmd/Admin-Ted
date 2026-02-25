// convex/files.ts
// Convex Storage helpers — generates pre-signed upload URLs for client-side uploads

import { mutation } from "./_generated/server";

/**
 * Returns a short-lived upload URL that the browser can POST a file to directly.
 * After uploading, the response JSON contains { storageId } which should be
 * passed to createProduct / updateProduct.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
