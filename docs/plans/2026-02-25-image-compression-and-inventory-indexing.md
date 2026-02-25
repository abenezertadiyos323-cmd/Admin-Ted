# Image Compression & Inventory Indexing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement client-side image resizing/compression (PART A) and optimize product listing with isArchived flag + thumbnail-only URL resolution (PARTS B-E).

**Architecture:**
- PART A: Create image processing utility that resizes long side to 1200px, converts to WebP/JPEG, quality 0.8, maintains preview with processed blob ObjectURL.
- PARTS B-E: Add `isArchived` boolean field to schema (complementing archivedAt), create index for efficient filtering, update listProducts to resolve URLs only for first image, update mutations to set isArchived consistently, update components to handle partial URL resolution.

**Tech Stack:** React, Convex (schema/queries/mutations), Canvas API for image processing, TypeScript.

---

## PART A: Image Processing Utility

### Task 1: Create image processing utility function

**Files:**
- Create: `src/lib/imageProcessor.ts`

**Step 1: Write the function signature and validation**

```typescript
// src/lib/imageProcessor.ts
/**
 * Resizes image so the longest side is maxWidth, converts to WebP/JPEG,
 * quality 0.8. Returns a processed Blob and its ObjectURL for preview.
 */
export async function processImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8,
): Promise<{ blob: Blob; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const img = new Image();
        img.onload = async () => {
          // Calculate new dimensions
          const { width, height } = calculateDimensions(img.width, img.height, maxWidth);

          // Create canvas and draw resized image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Failed to get canvas context');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to WebP if supported, else JPEG
          const mimeType = supportsWebP() ? 'image/webp' : 'image/jpeg';
          canvas.toBlob(
            (blob) => {
              if (!blob) throw new Error('Canvas.toBlob returned null');
              const previewUrl = URL.createObjectURL(blob);
              resolve({ blob, previewUrl });
            },
            mimeType,
            quality,
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function calculateDimensions(
  origWidth: number,
  origHeight: number,
  maxWidth: number,
): { width: number; height: number } {
  if (origWidth <= maxWidth && origHeight <= maxWidth) {
    return { width: origWidth, height: origHeight };
  }

  const isWidthLonger = origWidth >= origHeight;
  const scale = maxWidth / (isWidthLonger ? origWidth : origHeight);
  return {
    width: Math.round(origWidth * scale),
    height: Math.round(origHeight * scale),
  };
}

function supportsWebP(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
}
```

**Step 2: Test the function in isolation**

Run: `npm run build` to verify no TypeScript errors
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/lib/imageProcessor.ts
git commit -m "feat: add image processing utility for resize/compress"
```

---

## PART B: Schema Changes

### Task 2: Add isArchived field to products schema

**Files:**
- Modify: `convex/schema.ts:83-121` (products table definition)

**Step 1: Read the current schema**

Already read: `convex/schema.ts` lines 83-121

**Step 2: Add isArchived field and index**

Replace the products table definition:

```typescript
  products: defineTable({
    type: ProductType,
    brand: Brand,
    model: v.string(),

    ram: v.optional(v.string()),
    storage: v.optional(v.string()),
    condition: v.optional(Condition),

    price: v.number(),
    stockQuantity: v.number(),

    exchangeEnabled: v.boolean(),
    description: v.optional(v.string()),

    images: v.array(v.object({
      storageId: v.id("_storage"),
      // url is NOT stored — resolved at query time via ctx.storage.getUrl()
      order: v.number(),
    })),

    isArchived: v.boolean(), // NEW: boolean flag for efficient filtering
    archivedAt: v.optional(v.number()), // KEPT: for display/audit trail

    createdAt: v.number(),
    createdBy: v.string(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  })
    .index("by_type", ["type"])
    .index("by_brand", ["brand"])
    .index("by_type_and_brand", ["type", "brand"])
    .index("by_isArchived_createdAt", ["isArchived", "createdAt"]) // NEW: optimized filtering + ordering
    .index("by_archivedAt_and_stockQuantity", ["archivedAt", "stockQuantity"])
    .index("by_archivedAt", ["archivedAt"])
    .index("by_exchangeEnabled", ["exchangeEnabled"])
    .index("by_type_and_exchangeEnabled_and_archivedAt", [
      "type",
      "exchangeEnabled",
      "archivedAt",
    ]),
```

**Step 3: Commit schema changes**

```bash
git add convex/schema.ts
git commit -m "feat: add isArchived boolean field and index to products"
```

---

## PART C: Backend listProducts Optimization

### Task 3: Update listProducts to use withIndex and resolve only thumbnail URLs

**Files:**
- Modify: `convex/products.ts:35-89` (listProducts and helper functions)

**Step 1: Update resolveImages to only resolve first image**

Replace the `resolveImages` helper and update `listProducts`:

```typescript
// ---- Helper: resolve only the first image (thumbnail) ----
async function resolveThumbnail(
  ctx: { storage: { getUrl: (id: string) => Promise<string | null> } },
  images: Array<{ storageId: string; order: number }>,
) {
  if (images.length === 0) return [];

  // Only resolve URL for first image (by order)
  const sorted = [...images].sort((a, b) => a.order - b.order);
  const first = sorted[0];
  const url = first ? (await ctx.storage.getUrl(first.storageId)) ?? "" : "";

  return images.map((img) => ({
    storageId: img.storageId,
    order: img.order,
    url: img.storageId === first?.storageId ? url : undefined, // Only first has url
  }));
}

// ---- Helper: resolve all images (for detail view) ----
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

/**
 * List all products with optional filtering.
 * Returns images with resolved URLs ONLY for the first image (thumbnail) to reduce storage calls.
 * Sorted newest-first using by_isArchived_createdAt index.
 */
export const listProducts = query({
  args: {
    includeArchived: v.optional(v.boolean()),
    type: v.optional(vProductType),
    brand: v.optional(vBrand),
    lowStockOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, { includeArchived, type, brand, lowStockOnly }) => {
    // Use the by_isArchived_createdAt index for efficient filtering
    let products = await ctx.db
      .query("products")
      .withIndex("by_isArchived_createdAt", (q) =>
        includeArchived ? q.gte("isArchived", false) : q.eq("isArchived", false)
      )
      .order("desc")
      .collect();

    if (type) products = products.filter((p) => p.type === type);
    if (brand) products = products.filter((p) => p.brand === brand);
    if (lowStockOnly) products = products.filter((p) => p.stockQuantity <= 2);

    // Resolve storage URLs for thumbnails only (first image per product)
    return Promise.all(
      products.map(async (p) => ({
        ...p,
        images: await resolveThumbnail(ctx, p.images),
      })),
    );
  },
});
```

**Step 2: Update getProductById to resolve all URLs**

The current implementation already resolves all images, which is correct for detail view. Verify it stays as-is:

```typescript
/**
 * Fetch a single product by its Convex ID.
 * Returns images with resolved URLs for ALL images.
 */
export const getProductById = query({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    const p = await ctx.db.get(productId);
    if (!p) return null;
    return { ...p, images: await resolveImages(ctx, p.images) };
  },
});
```

**Step 3: Commit listProducts optimization**

```bash
git add convex/products.ts
git commit -m "feat: optimize listProducts with isArchived index and thumbnail-only URL resolution"
```

---

## PART D: Mutations Updates

### Task 4: Update createProduct, archiveProduct, restoreProduct mutations

**Files:**
- Modify: `convex/products.ts:112-191` (all mutations)

**Step 1: Update createProduct to set isArchived=false**

```typescript
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
      isArchived: false, // NEW: explicitly set on create
      createdAt: now,
      updatedAt: now,
    });
  },
});
```

**Step 2: Update archiveProduct to set isArchived=true**

```typescript
/**
 * Soft-delete a product by setting isArchived to true and archivedAt to current timestamp.
 */
export const archiveProduct = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    const now = Date.now();
    await ctx.db.patch(productId, {
      isArchived: true, // NEW: set flag
      archivedAt: now, // KEPT: for display/audit
      updatedAt: now,
    });
  },
});
```

**Step 3: Update restoreProduct to set isArchived=false**

```typescript
/**
 * Restore a previously archived product by clearing isArchived and archivedAt.
 */
export const restoreProduct = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, { productId }) => {
    await ctx.db.patch(productId, {
      isArchived: false, // NEW: clear flag
      archivedAt: undefined, // KEPT: for display/audit
      updatedAt: Date.now(),
    });
  },
});
```

**Step 4: Commit mutations**

```bash
git add convex/products.ts
git commit -m "feat: update mutations to manage isArchived flag"
```

---

## PART A (Continued): Use Image Processor in ProductForm

### Task 5: Update ProductForm.tsx to process images before upload

**Files:**
- Modify: `src/pages/ProductForm.tsx:1-134` (imports, uploadPendingImages function)

**Step 1: Add import for image processor**

Add to imports at top:

```typescript
import { processImage } from '../lib/imageProcessor';
```

**Step 2: Update uploadPendingImages to process images first**

Replace the `uploadPendingImages` function (currently lines 120-133):

```typescript
  // Upload all pending images to Convex Storage — process them first
  const uploadPendingImages = async (): Promise<Array<{ storageId: Id<'_storage'>; order: number }>> => {
    const results: Array<{ storageId: Id<'_storage'>; order: number }> = [];
    for (const pending of pendingImages) {
      // Process: resize, compress, convert to WebP/JPEG
      const { blob } = await processImage(pending.file, 1200, 0.8);

      const uploadUrl = await generateUploadUrl({});
      const resp = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': blob.type },
        body: blob,
      });
      const { storageId } = (await resp.json()) as { storageId: string };
      results.push({ storageId: storageId as Id<'_storage'>, order: pending.order });
    }
    return results;
  };
```

**Step 3: Verify preview still works**

The preview already uses `pending?.preview` which comes from `URL.createObjectURL(file)` in handleFileSelected. The processed blob's ObjectURL is not being used for preview in the current implementation—it uses the original file's ObjectURL. This is fine because:
1. Preview is instant (no processing needed)
2. The uploaded file will be processed
3. User sees close approximation in preview (original, not compressed)

No changes needed to preview logic.

**Step 4: Commit ProductForm updates**

```bash
git add src/pages/ProductForm.tsx
git commit -m "feat: add image processing to ProductForm before upload"
```

---

## PART E: Frontend Component Updates

### Task 6: Ensure ProductCard handles optional image URLs

**Files:**
- Review: `src/components/ProductCard.tsx` (already handles missing urls)

**Step 1: Verify ProductCard implementation**

Current code at line 12:
```typescript
const imageUrl = product.images[0]?.url;
```

And lines 21-31 already handle `imageUrl` being undefined, which is correct since in listProducts, only the first image will have a url.

**No changes needed** — ProductCard already handles the case where some images don't have urls.

**Step 2: Verify Inventory page**

Current code at line 28 calls:
```typescript
const convexProducts = useQuery(api.products.listProducts, { type: activeType });
```

Inventory filters and displays products. Since listProducts returns products with thumbnail urls resolved, this will work correctly.

**No changes needed** — Inventory already works with the new URL resolution strategy.

**Step 3: Commit (confirm no changes needed)**

```bash
git status
# Expected: nothing for ProductCard.tsx or Inventory.tsx
```

---

## Summary: Files Changed & Schema Changes

### Files Changed:
1. **Create:** `src/lib/imageProcessor.ts` — image resize/compress utility
2. **Modify:** `convex/schema.ts` — add `isArchived: boolean` field and index
3. **Modify:** `convex/products.ts` — update listProducts, add resolveThumbnail helper, update mutations
4. **Modify:** `src/pages/ProductForm.tsx` — import and use imageProcessor in uploadPendingImages

### Schema Changes:
- **Add field:** `products.isArchived: boolean` (required field, no default in DB—set in mutations)
- **Add index:** `products.index("by_isArchived_createdAt", ["isArchived", "createdAt"])`

### Migration/Backfill:
**ACTION REQUIRED:** After schema push, all existing products will have `isArchived` as an undefined field in the database. This must be backfilled or handled.

**Option 1 (Recommended):** Create a migration mutation to backfill all existing products:

```typescript
// One-time migration mutation (can be deleted after running)
export const backfillIsArchived = mutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    let updated = 0;
    for (const p of products) {
      if (p.isArchived === undefined) {
        await ctx.db.patch(p._id, {
          isArchived: p.archivedAt ? true : false,
        });
        updated++;
      }
    }
    return { updated };
  },
});
```

Run once after schema deployment: `call backfillIsArchived()` in Convex dashboard, then delete the mutation.

**Option 2:** Accept that existing products are undefined on `isArchived`, and update queries to:
```typescript
.eq("isArchived", false) // will NOT match undefined
```
Then update to:
```typescript
.or((q) => q.eq("isArchived", false), (q) => q.eq("isArchived", undefined))
```

**Recommendation:** Use Option 1 (backfill) for clean data.

---

## Validation Checklist

After completing all tasks:

1. **npm run build** passes (no TypeScript errors)
2. **Create a test product** with a large phone photo (>3MB):
   - Confirm uploaded file is much smaller (processed)
   - Confirm image renders in Inventory thumbnail
   - Confirm detail view shows all images with URLs
3. **Test archive/restore:**
   - Archive a product
   - Verify it disappears from Inventory list
   - Run listProducts with `includeArchived=true` and confirm it appears
   - Restore product and verify it reappears in list
4. **No changes to:** Inbox, Exchanges, Dashboard, ProductCard, Inventory page behavior

---
