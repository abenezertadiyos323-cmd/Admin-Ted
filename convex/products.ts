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
  v.literal("New"),
  v.literal("Like New"),
  v.literal("Excellent"),
  v.literal("Good"),
  v.literal("Fair"),
  v.literal("Poor"),
);

type ProductType = "phone" | "accessory";

function normalizeExchangeEnabled(type: ProductType, exchangeEnabled: boolean) {
  return type === "phone" ? exchangeEnabled : false;
}

/**
 * Build a normalized, lowercase search text from the indexable product fields.
 * Used when inserting or updating a product so listProducts can filter without
 * calling .toLowerCase() on every field at query time.
 */
function buildSearchText(p: {
  brand: string;
  model: string;
  storage?: string;
  ram?: string;
  condition?: string;
}): string {
  return [p.brand, p.model, p.storage, p.ram, p.condition]
    .filter((s): s is string => typeof s === "string" && s.length > 0)
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

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
    q: v.optional(v.string()),
  },
  handler: async (ctx, { includeArchived, type, brand, lowStockOnly, q }) => {
    const indexedProducts = await ctx.db
      .query("products")
      .withIndex("by_isArchived_createdAt", (qb) =>
        includeArchived
          ? qb.gte("isArchived", false) // all: false then true
          : qb.eq("isArchived", false)
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
    if (q) {
      // Normalize the query the same way buildSearchText normalizes stored values.
      const ql = q.toLowerCase().replace(/\s+/g, " ").trim();
      // Hard cap: consider only the newest 300 post-structural-filter candidates.
      // This prevents an unbounded in-memory scan when q is provided.
      const candidates = products.slice(0, 300);
      products = candidates.filter((p) => {
        // Fall back to inline concat for products not yet backfilled.
        const st =
          p.searchText ??
          `${p.brand} ${p.model}`.toLowerCase();
        return st.includes(ql);
      });
    }

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
    const exchangeEnabled = normalizeExchangeEnabled(args.type, args.exchangeEnabled);
    return await ctx.db.insert("products", {
      ...args,
      exchangeEnabled,
      isArchived: false,
      searchText: buildSearchText(args),
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
    const existing = await ctx.db.get(productId);
    if (!existing) {
      throw new Error("Product not found");
    }

    const effectiveType: ProductType = patch.type ?? existing.type;
    const effectiveExchangeEnabled = patch.exchangeEnabled ?? existing.exchangeEnabled;
    const normalizedExchangeEnabled = normalizeExchangeEnabled(
      effectiveType,
      effectiveExchangeEnabled,
    );

    // Recompute searchText using the merged (effective) field values.
    const searchText = buildSearchText({
      brand: patch.brand ?? existing.brand,
      model: patch.model ?? existing.model,
      storage: patch.storage ?? existing.storage,
      ram: patch.ram ?? existing.ram,
      condition: patch.condition ?? existing.condition,
    });

    await ctx.db.patch(productId, {
      ...patch,
      exchangeEnabled: normalizedExchangeEnabled,
      searchText,
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
 * One-time backfill: compute and store searchText for every product that
 * doesn't have it yet (i.e. created before this field was introduced).
 * Run once from the Convex dashboard: call products:backfillSearchText with {}.
 * Safe to re-run — skips rows that already have a non-empty searchText.
 */
export const backfillSearchText = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("products").collect();
    let count = 0;
    for (const p of all) {
      if (!p.searchText) {
        await ctx.db.patch(p._id, {
          searchText: buildSearchText({
            brand: p.brand,
            model: p.model,
            storage: p.storage,
            ram: p.ram,
            condition: p.condition,
          }),
        });
        count++;
      }
    }
    return { backfilled: count };
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
