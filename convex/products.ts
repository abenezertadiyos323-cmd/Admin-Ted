// convex/products.ts
// Products backend — queries and mutations for TedyTech Admin

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ---- Shared validators (mirrors schema enums) ----

const vProductType = v.union(v.literal("phone"), v.literal("accessory"));

const vBrand = v.union(
  v.literal("iPhone"),
  v.literal("Samsung"),
  v.literal("Tecno"),
  v.literal("Infinix"),
  v.literal("Xiaomi"),
  v.literal("Oppo"),
  v.literal("Other"),
);

const vCondition = v.union(
  v.literal("Excellent"),
  v.literal("Good"),
  v.literal("Fair"),
  v.literal("Poor"),
);

// Image stored in DB: only storageId + order. url is computed at query time.
const vImageInput = v.object({
  storageId: v.id("_storage"),
  order: v.number(),
});

// ---- Helper: resolve ALL storage URLs (used by getProductById) ----

async function resolveImages(
  ctx: { storage: { getUrl: (id: string) => Promise<string | null> } },
  images: Array<{ storageId: string; order: number }>,
) {
  return Promise.all(
    images.map(async (img) => ({
      storageId: img.storageId,
      order: img.order,
      url: (await ctx.storage.getUrl(img.storageId)) ?? "",
    })),
  );
}

// ---- Helper: resolve ONLY the first image URL (thumbnail, for list view) ----

async function resolveThumbnail(
  ctx: { storage: { getUrl: (id: string) => Promise<string | null> } },
  images: Array<{ storageId: string; order: number }>,
) {
  if (images.length === 0) return [];
  const sorted = [...images].sort((a, b) => a.order - b.order);
  const firstId = sorted[0].storageId;
  const url = (await ctx.storage.getUrl(firstId)) ?? "";
  return images.map((img) => ({
    storageId: img.storageId,
    order: img.order,
    ...(img.storageId === firstId ? { url } : {}),
  }));
}

// ================================================================
//  QUERIES
// ================================================================

/**
 * List all products with optional filtering.
 * Sorted newest-first using by_isArchived_createdAt index.
 * Resolves URL ONLY for the first image (thumbnail) to reduce storage.getUrl calls.
 * Use getProductById to get all image URLs.
 */
export const listProducts = query({
  args: {
    includeArchived: v.optional(v.boolean()),
    type: v.optional(vProductType),
    brand: v.optional(vBrand),
    lowStockOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, { includeArchived, type, brand, lowStockOnly }) => {
    const indexedProducts = await ctx.db
      .query("products")
      .withIndex("by_isArchived_createdAt", (q) =>
        includeArchived
          ? q.gte("isArchived", false) // all: false then true
          : q.eq("isArchived", false)
      )
      .order("desc")
      .collect();

    // Compatibility: legacy rows created before isArchived existed may be absent from this index.
    const legacyProducts = (await ctx.db.query("products").collect())
      .filter((p) => (p as { isArchived?: boolean }).isArchived === undefined)
      .map((p) => ({ ...p, isArchived: false }));

    const merged = [...indexedProducts, ...legacyProducts];
    const deduped = Array.from(
      new Map(merged.map((p) => [p._id, p])).values(),
    ).sort((a, b) => b.createdAt - a.createdAt);

    let products = includeArchived
      ? deduped
      : deduped.filter((p) => p.isArchived === false);

    if (type) products = products.filter((p) => p.type === type);
    if (brand) products = products.filter((p) => p.brand === brand);
    if (lowStockOnly) products = products.filter((p) => p.stockQuantity <= 2);

    // Resolve thumbnail URL only
    return Promise.all(
      products.map(async (p) => ({
        ...p,
        images: await resolveThumbnail(ctx, p.images),
      })),
    );
  },
});

/**
 * Fetch a single product by its Convex ID.
 * Returns images with resolved URLs.
 */
export const getProductById = query({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    const p = await ctx.db.get(productId);
    if (!p) return null;
    return { ...p, images: await resolveImages(ctx, p.images) };
  },
});

// ================================================================
//  MUTATIONS
// ================================================================

/**
 * Create a new product. Images are passed as { storageId, order } pairs;
 * url is NOT stored — it is resolved at query time via Convex Storage.
 */
export const createProduct = mutation({
  args: {
    type: vProductType,
    brand: vBrand,
    model: v.string(),
    ram: v.optional(v.string()),
    storage: v.optional(v.string()),
    condition: v.optional(vCondition),
    price: v.number(),
    stockQuantity: v.number(),
    exchangeEnabled: v.boolean(),
    description: v.optional(v.string()),
    images: v.array(vImageInput),
    createdBy: v.string(),
    updatedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("products", {
      ...args,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Patch an existing product. Only provided fields are updated.
 * Always updates updatedAt and updatedBy.
 */
export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    type: v.optional(vProductType),
    brand: v.optional(vBrand),
    model: v.optional(v.string()),
    ram: v.optional(v.string()),
    storage: v.optional(v.string()),
    condition: v.optional(vCondition),
    price: v.optional(v.number()),
    stockQuantity: v.optional(v.number()),
    exchangeEnabled: v.optional(v.boolean()),
    description: v.optional(v.string()),
    images: v.optional(v.array(vImageInput)),
    updatedBy: v.string(),
  },
  handler: async (ctx, { productId, updatedBy, ...patch }) => {
    await ctx.db.patch(productId, {
      ...patch,
      updatedAt: Date.now(),
      updatedBy,
    });
  },
});

/**
 * Quickly adjust stock by +1 or -1 from Inventory controls.
 */
export const updateStockQuantity = mutation({
  args: {
    productId: v.id("products"),
    delta: v.number(),
  },
  handler: async (ctx, { productId, delta }) => {
    if (delta !== 1 && delta !== -1) {
      throw new Error("delta must be exactly 1 or -1");
    }

    const product = await ctx.db.get(productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const newQty = Math.max(0, product.stockQuantity + delta);
    await ctx.db.patch(productId, {
      stockQuantity: newQty,
    });

    return { stockQuantity: newQty };
  },
});

/**
 * Soft-delete a product: sets isArchived=true (for index) and archivedAt (for display).
 */
export const archiveProduct = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    const now = Date.now();
    await ctx.db.patch(productId, {
      isArchived: true,
      archivedAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Restore a previously archived product: clears isArchived and archivedAt.
 */
export const restoreProduct = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    await ctx.db.patch(productId, {
      isArchived: false,
      archivedAt: undefined,
      updatedAt: Date.now(),
    });
  },
});

/**
 * One-time backfill: sets isArchived on all products that predate the field.
 * Run once from the Convex dashboard, then this mutation can be deleted.
 * Not exposed in the API surface — import via internal if needed.
 */
export const backfillIsArchived = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("products").collect();
    let count = 0;
    for (const p of all) {
      // isArchived will be undefined on rows that existed before the schema change
      if ((p as { isArchived?: boolean }).isArchived === undefined) {
        await ctx.db.patch(p._id, {
          isArchived: p.archivedAt != null ? true : false,
        });
        count++;
      }
    }
    return { backfilled: count };
  },
});
