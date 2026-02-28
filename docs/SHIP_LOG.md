# Ship Log — Admin-Ted

Entries are newest-first.

---

## 2026-03-01 00:31 EAST

**Repo:** Admin-Ted
**Last good commit:** `cee6df4`
**Prod Convex:** https://fastidious-schnauzer-265.convex.cloud

### What changed
- Removed unused mock API layer (dead code cleanup)
- Wired Inbox and Exchanges views to live Convex backend — mocks fully gone
- Dark-themed ProductForm; FAB now hidden on detail routes
- Swept remaining light-palette CSS classes to dark design tokens
- Fixed sticky tabs freezing on scroll

### Quick verify
```bash
git status -sb
git rev-list --left-right --count origin/main...HEAD
npm run build
```

### Next priority
- **Backfill order (prod):** `products:migratePhoneType` → `products:backfillSearchText` → `products:backfillSearchNormalized` → `products:cleanupLegacyBrandModel` — all idempotent; run via `npx convex run <path> --url https://fastidious-schnauzer-265.convex.cloud`
- **Also run:** `products:backfillIsArchived` + `threads:backfillFirstMessageAt` (independent; fixes "First-Time Today" dashboard count)
- **After all backfills pass:** edit `convex/schema.ts` — make `phoneType` required, drop `brand`/`model` optional entries, make `searchNormalized` required — then `npx convex deploy --yes`
- **Note:** `convex/` last changed in `930af00`; confirm that commit was deployed to prod before running backfills

### Tomorrow commands (copy-paste)
```bash
# --- PROD (fastidious-schnauzer-265) ---
# If 930af00 convex/ changes weren't deployed yet, run this first:
# npx convex deploy --yes

npx convex run products:migratePhoneType --url https://fastidious-schnauzer-265.convex.cloud
npx convex run products:backfillSearchText --url https://fastidious-schnauzer-265.convex.cloud
npx convex run products:backfillSearchNormalized --url https://fastidious-schnauzer-265.convex.cloud
npx convex run products:cleanupLegacyBrandModel --url https://fastidious-schnauzer-265.convex.cloud
npx convex run products:backfillIsArchived --url https://fastidious-schnauzer-265.convex.cloud
npx convex run threads:backfillFirstMessageAt --url https://fastidious-schnauzer-265.convex.cloud

# --- DEV (dutiful-toucan-720) ---
npx convex run products:migratePhoneType --url https://dutiful-toucan-720.convex.cloud
npx convex run products:backfillSearchText --url https://dutiful-toucan-720.convex.cloud
npx convex run products:backfillSearchNormalized --url https://dutiful-toucan-720.convex.cloud
npx convex run products:cleanupLegacyBrandModel --url https://dutiful-toucan-720.convex.cloud
npx convex run products:backfillIsArchived --url https://dutiful-toucan-720.convex.cloud
npx convex run threads:backfillFirstMessageAt --url https://dutiful-toucan-720.convex.cloud
```
