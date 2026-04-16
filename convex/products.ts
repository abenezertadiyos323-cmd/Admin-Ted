// convex/products.ts
// Products backend — queries and mutations for TedyTech Admin (fully aligned with Micky Mobile)

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { hasStorageGb, normalizeProductStorage } from "./lib/productStorage";

// ---- Shared validators (mirrors schema enums) ----

const vProductType = v.union(v.literal("phone"), v.literal("accessory"));

const vCondition = v.union(
  v.literal("New"),
  v.literal("Like New"),
  v.literal("Excellent"),
  v.literal("Good"),
  v.literal("Fair"),
  v.literal("Poor"),
);

const vStorageOption = v.union(
  v.literal("32GB"),
  v.literal("64GB"),
  v.literal("128GB"),
  v.literal("256GB"),
  v.literal("512GB"),
  v.literal("1TB"),
);

const vVariant = v.object({
  storage: v.string(),
  ram: v.optional(v.string()),
  price: v.number(),
  stock: v.number(),
});

type ProductType = "phone" | "accessory";

function normalizeExchangeEnabled(type: ProductType, exchangeEnabled: boolean) {
  return type === "phone" ? exchangeEnabled : false;
}

function buildSearchText(p: {
  phoneType?: string;
  storage?: string;
  ram?: string;
  condition?: string;
}): string {
  return [p.phoneType, p.storage, p.ram, p.condition]
    .filter((s): s is string => typeof s === "string" && s.length > 0)
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function buildSearchNormalized(p: {
  phoneType?: string;
  storage?: string;
  ram?: string;
  condition?: string;
}): string {
  return [p.phoneType, p.storage, p.ram, p.condition]
    .filter((s): s is string => typeof s === "string" && s.length > 0)
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

const vImageInput = v.string();

type StorageCtx = {
  storage: {
    getUrl: (id: string) => Promise<string | null>;
  };
};

type LegacyImage = {
  storageId: string;
  order?: number;
  url?: string;
};

const trimImageUrl = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const sanitizeImageUrls = (images: string[]): string[] => {
  const cleaned = images
    .map((img) => trimImageUrl(img))
    .filter((img): img is string => img !== null);
  return cleaned.slice(0, 3);
};

function asLegacyImage(value: unknown): LegacyImage | null {
  if (!value || typeof value !== "object") return null;
  const maybe = value as Partial<LegacyImage>;
  if (typeof maybe.storageId !== "string" || maybe.storageId.length === 0) {
    return null;
  }
  return {
    storageId: maybe.storageId,
    order: typeof maybe.order === "number" ? maybe.order : undefined,
    url: typeof maybe.url === "string" ? maybe.url : undefined,
  };
}

async function normalizeImageUrls(
  ctx: StorageCtx,
  images: unknown,
): Promise<string[]> {
  if (!Array.isArray(images) || images.length === 0) return [];

  const normalized = images
    .map((img, index) => {
      const directUrl = trimImageUrl(img);
      if (directUrl) {
        return { kind: "url" as const, order: index, value: directUrl };
      }
      const legacy = asLegacyImage(img);
      if (legacy) {
        return {
          kind: "legacy" as const,
          order: legacy.order ?? index,
          storageId: legacy.storageId,
          fallbackUrl: trimImageUrl(legacy.url),
        };
      }
      return null;
    })
    .filter((img): img is NonNullable<typeof img> => img !== null)
    .sort((a, b) => a.order - b.order);

  const urls: string[] = [];
  for (const img of normalized) {
    if (img.kind === "url") {
      urls.push(img.value);
      continue;
    }
    try {
      const resolved = await ctx.storage.getUrl(img.storageId);
      const url = trimImageUrl(resolved) ?? img.fallbackUrl;
      if (url) urls.push(url);
    } catch {
      if (img.fallbackUrl) urls.push(img.fallbackUrl);
    }
  }

  return sanitizeImageUrls(urls);
}

// ================================================================
//  QUERIES
// ================================================================

const LOW_STOCK_THRESHOLD = 2;

type AdminSettings = {
  phoneLowStockThreshold?: number;
  accessoryLowStockThreshold?: number;
};

function resolveThreshold(
  p: { lowStockThreshold?: number; type: string },
  settings: AdminSettings | null,
): number {
  if (p.lowStockThreshold != null) return p.lowStockThreshold;
  if (settings) {
    if (p.type === "phone" && settings.phoneLowStockThreshold != null)
      return settings.phoneLowStockThreshold;
    if (p.type === "accessory" && settings.accessoryLowStockThreshold != null)
      return settings.accessoryLowStockThreshold;
  }
  return LOW_STOCK_THRESHOLD;
}

export const listAllProducts = query({
  handler: async (ctx) => {
    try {
      const products = await ctx.db
        .query("products")
        .withIndex("by_isArchived_createdAt", (qb) => qb.eq("isArchived", false))
        .order("desc")
        .collect();

      return Promise.all(
        products.map(async (p) => {
          const images = await normalizeImageUrls(ctx, p.images);
          const normalizedStorage = normalizeProductStorage({
            storage: p.storage,
            storageOptions: p.storageOptions,
          });

          return {
            ...p,
            storage: normalizedStorage.storage,
            storageOptions: normalizedStorage.storageOptions,
            images,
            name: p.phoneType ?? "",
            main_image_url: images[0] ?? "",
            inStock: p.stockQuantity > 0,
            is_accessory: p.type === "accessory",
            exchange_available: p.exchangeEnabled,
          };
        }),
      );
    } catch {
      return [];
    }
  },
});

type InventoryTab =
  | "all"
  | "in_stock"
  | "low_stock"
  | "out_of_stock"
  | "exchange"
  | "archived";

const normalizeTab = (tab?: string): InventoryTab => {
  switch (tab) {
    case "all":
      return "all";
    case "in_stock":
    case "inStock":
      return "in_stock";
    case "low_stock":
    case "lowStock":
      return "low_stock";
    case "out_of_stock":
    case "outOfStock":
      return "out_of_stock";
    case "exchange":
    case "exchangeEnabled":
      return "exchange";
    case "archived":
      return "archived";
    default:
      return "all";
  }
};

const normalizeType = (type?: string): ProductType | undefined => {
  if (type === "phone" || type === "accessory") {
    return type;
  }
  return undefined;
};

export const listProducts = query({
  args: {
    tab: v.optional(v.string()),
    type: v.optional(v.string()),
    brand: v.optional(v.string()),
    search: v.optional(v.string()),
    condition: v.optional(vCondition),
    priceMin: v.optional(v.number()),
    priceMax: v.optional(v.number()),
    hasImages: v.optional(v.boolean()),
    storageGb: v.optional(v.number()),
    ramGb: v.optional(v.number()),
    q: v.optional(v.string()),
    includeArchived: v.optional(v.boolean()),
    lowStockOnly: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    { tab, type, brand, search, condition, priceMin, priceMax, hasImages, storageGb, ramGb, q,
      includeArchived, lowStockOnly },
  ) => {
    const adminSettingsDocs = await ctx.db.query("adminSettings").collect();
    const adminSettings: AdminSettings = adminSettingsDocs[0] ?? null;

    const normalizedTab = normalizeTab(tab);
    const resolvedType = normalizeType(type);
    const includeArchivedLegacy = !tab && includeArchived === true;
    const normalizedSearch = (search ?? q)?.toLowerCase().replace(/\s+/g, " ").trim();
    const isArchivedTab = normalizedTab === "archived";

    let indexedProducts;
    if (normalizedTab === "exchange") {
      indexedProducts = await ctx.db
        .query("products")
        .withIndex("by_isArchived_exchangeEnabled_createdAt", (qb) =>
          qb.eq("isArchived", false).eq("exchangeEnabled", true),
        )
        .order("desc")
        .collect();
    } else {
      indexedProducts = await ctx.db
        .query("products")
        .withIndex("by_isArchived_createdAt", (qb) =>
          tab
            ? qb.eq("isArchived", isArchivedTab)
            : includeArchivedLegacy
              ? qb.gte("isArchived", false)
              : qb.eq("isArchived", false),
        )
        .order("desc")
        .collect();
    }

    const legacyProducts = (await ctx.db.query("products").collect())
      .filter((p) => (p as { isArchived?: boolean }).isArchived === undefined)
      .map((p) => ({ ...p, isArchived: false }));

    const merged = [...indexedProducts, ...legacyProducts];
    const deduped = Array.from(
      new Map(merged.map((p) => [p._id, p])).values(),
    ).sort((a, b) => b.createdAt - a.createdAt);

    let products =
      normalizedTab === "archived"
        ? deduped.filter((p) => p.isArchived === true)
        : includeArchivedLegacy
          ? deduped
          : deduped.filter((p) => p.isArchived === false);

    if (normalizedTab === "in_stock") {
      products = products.filter((p) => p.stockQuantity > 0);
    } else if (normalizedTab === "out_of_stock") {
      products = products.filter((p) => p.stockQuantity === 0);
    } else if (normalizedTab === "low_stock") {
      products = products.filter(
        (p) =>
          p.stockQuantity > 0 &&
          p.stockQuantity <= resolveThreshold(p, adminSettings),
      );
    } else if (normalizedTab === "exchange") {
      products = products.filter((p) => p.exchangeEnabled === true);
    }

    if (!tab && lowStockOnly) {
      products = products.filter((p) => p.stockQuantity <= resolveThreshold(p, adminSettings));
    }

    if (resolvedType) products = products.filter((p) => p.type === resolvedType);
    if (brand) {
      const normalizedBrand = brand.toLowerCase();
      products = products.filter((p) => {
        const legacyBrand = (p as unknown as { brand?: string }).brand;
        return legacyBrand?.toLowerCase() === normalizedBrand;
      });
    }
    if (condition) products = products.filter((p) => p.condition === condition);
    if (priceMin !== undefined) products = products.filter((p) => p.price >= priceMin);
    if (priceMax !== undefined) products = products.filter((p) => p.price <= priceMax);
    if (hasImages) products = products.filter((p) => Array.isArray(p.images) && p.images.length > 0);
    if (storageGb !== undefined) {
      products = products.filter((p) =>
        hasStorageGb(storageGb, {
          storage: p.storage,
          storageOptions: p.storageOptions,
        }),
      );
    }
    if (ramGb !== undefined) {
      const ramStr = String(ramGb);
      products = products.filter((p) => p.ram?.startsWith(ramStr) ?? false);
    }

    if (normalizedSearch) {
      const candidates = products.slice(0, 300);
      const normalizedQueryNoSpaces = normalizedSearch.replace(/\s+/g, "");
      products = candidates.filter((p) => {
        const st = (p.searchNormalized ?? p.phoneType ?? "").toLowerCase().replace(/\s+/g, "");
        return st.includes(normalizedQueryNoSpaces);
      });
    }

    return Promise.all(
      products.map(async (p) => {
        try {
          const normalizedStorage = normalizeProductStorage({
            storage: p.storage,
            storageOptions: p.storageOptions,
          });
          return {
            ...p,
            storage: normalizedStorage.storage,
            storageOptions: normalizedStorage.storageOptions,
            images: await normalizeImageUrls(ctx, p.images),
          };
        } catch {
          const normalizedStorage = normalizeProductStorage({
            storage: p.storage,
            storageOptions: p.storageOptions,
          });
          return {
            ...p,
            storage: normalizedStorage.storage,
            storageOptions: normalizedStorage.storageOptions,
            images: [],
          };
        }
      }),
    );
  },
});

export const getProductById = query({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    const p = await ctx.db.get(productId);
    if (!p) return null;
    const normalizedStorage = normalizeProductStorage({
      storage: p.storage,
      storageOptions: p.storageOptions,
    });
    return {
      ...p,
      storage: normalizedStorage.storage,
      storageOptions: normalizedStorage.storageOptions,
      images: await normalizeImageUrls(ctx, p.images),
    };
  },
});

// ================================================================
//  MUTATIONS
// ================================================================

export const createProduct = mutation({
  args: {
    type: vProductType,
    phoneType: v.string(),
    ram: v.optional(v.string()),
    storage: v.optional(v.string()),
    storageOptions: v.optional(v.array(vStorageOption)),
    condition: v.optional(vCondition),
    price: v.number(),
    stockQuantity: v.number(),
    exchangeEnabled: v.boolean(),
    description: v.optional(v.string()),
    images: v.array(vImageInput),
    createdBy: v.string(),
    updatedBy: v.string(),
    sellerId: v.string(),
    brand: v.optional(v.string()),
    batteryHealth: v.optional(v.string()),
    modelOrigin: v.optional(v.string()),
    network: v.optional(v.string()),
    variants: v.optional(v.array(vVariant)),
    screenSize: v.optional(v.string()),
    battery: v.optional(v.string()),
    mainCamera: v.optional(v.string()),
    selfieCamera: v.optional(v.string()),
    simType: v.optional(v.string()),
    color: v.optional(v.string()),
    operatingSystem: v.optional(v.string()),
    features: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const exchangeEnabled = normalizeExchangeEnabled(args.type, args.exchangeEnabled);
    const images = sanitizeImageUrls(args.images);
    const normalizedStorage = normalizeProductStorage({
      storage: args.storage,
      storageOptions: args.storageOptions,
    });
    return await ctx.db.insert("products", {
      ...args,
      storage: normalizedStorage.storage,
      storageOptions: normalizedStorage.storageOptions,
      images,
      exchangeEnabled,
      isArchived: false,
      searchText: buildSearchText({
        ...args,
        storage: normalizedStorage.searchText,
      }),
      searchNormalized: buildSearchNormalized({
        ...args,
        storage: normalizedStorage.searchText,
      }),
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    type: v.optional(vProductType),
    phoneType: v.optional(v.string()),
    ram: v.optional(v.string()),
    storage: v.optional(v.string()),
    storageOptions: v.optional(v.array(vStorageOption)),
    condition: v.optional(vCondition),
    price: v.optional(v.number()),
    stockQuantity: v.optional(v.number()),
    exchangeEnabled: v.optional(v.boolean()),
    description: v.optional(v.string()),
    images: v.optional(v.array(vImageInput)),
    updatedBy: v.string(),
    brand: v.optional(v.string()),
    batteryHealth: v.optional(v.string()),
    modelOrigin: v.optional(v.string()),
    network: v.optional(v.string()),
    variants: v.optional(v.array(vVariant)),
    screenSize: v.optional(v.string()),
    battery: v.optional(v.string()),
    mainCamera: v.optional(v.string()),
    selfieCamera: v.optional(v.string()),
    simType: v.optional(v.string()),
    color: v.optional(v.string()),
    operatingSystem: v.optional(v.string()),
    features: v.optional(v.string()),
  },
  handler: async (ctx, { productId, updatedBy, images, ...patch }) => {
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
    const normalizedStorage = normalizeProductStorage({
      storage: patch.storage ?? existing.storage,
      storageOptions: patch.storageOptions ?? existing.storageOptions,
    });

    const searchFieldArgs = {
      phoneType: patch.phoneType ?? existing.phoneType,
      storage: normalizedStorage.searchText,
      ram: patch.ram ?? existing.ram,
      condition: patch.condition ?? existing.condition,
    };
    const searchText = buildSearchText(searchFieldArgs);
    const searchNormalized = buildSearchNormalized(searchFieldArgs);
    const imagePatch =
      images !== undefined ? { images: sanitizeImageUrls(images) } : {};

    await ctx.db.patch(productId, {
      ...patch,
      storage: normalizedStorage.storage,
      storageOptions: normalizedStorage.storageOptions,
      ...imagePatch,
      exchangeEnabled: normalizedExchangeEnabled,
      searchText,
      searchNormalized,
      updatedAt: Date.now(),
      updatedBy,
    });
  },
});

export const updateStockQuantity = mutation({
  args: {
    productId: v.id("products"),
    delta: v.number(),
  },
  handler: async (ctx, { productId, delta }) => {
    if (delta !== 1 && delta !== -1) throw new Error("delta must be exactly 1 or -1");
    const product = await ctx.db.get(productId);
    if (!product) throw new Error("Product not found");
    const newQty = Math.max(0, product.stockQuantity + delta);
    await ctx.db.patch(productId, { stockQuantity: newQty });
    return { stockQuantity: newQty };
  },
});

export const archiveProduct = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    const now = Date.now();
    await ctx.db.patch(productId, { isArchived: true, archivedAt: now, updatedAt: now });
  },
});

export const restoreProduct = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    await ctx.db.patch(productId, { isArchived: false, archivedAt: undefined, updatedAt: Date.now() });
  },
});

export const permanentDeleteProduct = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    await ctx.db.delete(productId);
  },
});

export const backfillSearchText = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("products").collect();
    let count = 0;
    for (const p of all) {
      if (!p.searchText) {
        const normalizedStorage = normalizeProductStorage({ storage: p.storage, storageOptions: p.storageOptions });
        await ctx.db.patch(p._id, {
          searchText: buildSearchText({
            phoneType: p.phoneType,
            storage: normalizedStorage.searchText,
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

export const backfillSearchNormalized = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("products").collect();
    let count = 0;
    for (const p of all) {
      if (!p.searchNormalized) {
        const normalizedStorage = normalizeProductStorage({ storage: p.storage, storageOptions: p.storageOptions });
        await ctx.db.patch(p._id, {
          searchNormalized: buildSearchNormalized({
            phoneType: p.phoneType,
            storage: normalizedStorage.searchText,
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

export const migratePhoneType = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("products").collect();
    let count = 0;
    for (const p of all) {
      const legacy = p as any;
      if (!legacy.phoneType && legacy.brand && legacy.model) {
        const phoneType = `${legacy.brand} ${legacy.model}`.trim();
        const normalizedStorage = normalizeProductStorage({ storage: p.storage, storageOptions: p.storageOptions });
        await ctx.db.patch(p._id, {
          phoneType,
          searchText: buildSearchText({ phoneType, storage: normalizedStorage.searchText, ram: p.ram, condition: p.condition }),
        });
        count++;
      }
    }
    return { migrated: count };
  },
});

export const backfillStorageOptions = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("products").collect();
    let count = 0;
    for (const p of all) {
      const normalizedStorage = normalizeProductStorage({ storage: p.storage, storageOptions: p.storageOptions });
      if (p.storage === normalizedStorage.storage && JSON.stringify(p.storageOptions ?? []) === JSON.stringify(normalizedStorage.storageOptions ?? [])) continue;
      await ctx.db.patch(p._id, { storage: normalizedStorage.storage, storageOptions: normalizedStorage.storageOptions });
      count++;
    }
    return { backfilled: count };
  },
});
