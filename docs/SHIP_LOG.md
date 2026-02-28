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
- Run backfill mutations on prod DB via Convex dashboard (`migratePhoneType` → `backfillSearchNormalized` → `cleanupLegacyBrandModel`)
- Tighten schema after backfill: make `phoneType` required, remove optional `brand`/`model` entries
