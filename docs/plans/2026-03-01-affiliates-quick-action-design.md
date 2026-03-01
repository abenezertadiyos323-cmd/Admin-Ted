# Affiliates Quick Action — Design Document

**Date:** 2026-03-01
**Status:** Approved
**Author:** Claude Code + user

---

## Summary

Add an "Affiliates" button to the Admin Home Quick Actions grid. On click it opens a bottom-sheet modal (same pattern as Restock Suggestions and Content Plan) showing a read-only overview of affiliate and referral activity. No new bottom-nav tab is added.

---

## Architecture

### Approach Chosen
Option A — Bottom-sheet modal in `Dashboard.tsx`. Consistent with the two existing Quick Actions. No routing changes.

### Files Changed
| File | Change |
|------|--------|
| `convex/schema.ts` | Add `affiliates` and `referrals` tables |
| `convex/affiliates.ts` | New file — `getOverview` query |
| `src/pages/Dashboard.tsx` | Add `showAffiliates` state, button, and `AffiliatesModal` component |

---

## Data Layer

### New Table: `affiliates`

```ts
affiliates: defineTable({
  code: v.string(),                  // unique referral code
  ownerTelegramUserId: v.string(),
  createdAt: v.number(),             // timestamp ms
  status: v.union(v.literal("active"), v.literal("inactive")),
})
  .index("by_code", ["code"])
  .index("by_status", ["status"])
  .index("by_ownerTelegramUserId", ["ownerTelegramUserId"])
```

### New Table: `referrals`

```ts
referrals: defineTable({
  code: v.string(),                       // affiliate code used
  referredTelegramUserId: v.string(),
  createdAt: v.number(),                  // timestamp ms
  source: v.optional(v.string()),         // "bot" | "link" | etc.
})
  .index("by_code", ["code"])
  .index("by_createdAt", ["createdAt"])
  .index("by_referred_and_code", ["referredTelegramUserId", "code"])
```

**Uniqueness enforcement:** `(code, referredTelegramUserId)` uniqueness enforced at write time via query-before-insert in the referral creation mutation (Convex lacks composite unique constraints).

### New Query: `convex/affiliates.ts` — `getOverview`

Returns:
```ts
{
  totalAffiliates: number,         // active affiliates count
  totalReferredPeople: number,     // distinct referredTelegramUserId count
  newReferralsToday: number,       // referrals since start of Ethiopian day (UTC+3)
  topCodes: Array<{
    code: string,
    count: number,
  }>,                              // top 3 by referral count, sorted desc
  recentReferrals: Array<{
    code: string,
    referredTelegramUserId: string,
    createdAt: number,
    source?: string,
  }>,                              // last 5 by createdAt desc
}
```

---

## UI

### Quick Actions Grid (`Dashboard.tsx`)

Existing grid (2-col):
```
[ 📦 Restock Suggestions ]  [ 📅 Content Plan (7d) ]
```

After change:
```
[ 📦 Restock Suggestions ]  [ 📅 Content Plan (7d) ]
[ 🤝 Affiliates           ]
```

Third button spans or sits left in the 2-col grid (matches existing button styles).

### `AffiliatesModal` Component

Bottom-sheet modal, same structural pattern as `RestockModal`:

```
┌─────────────────────────────────┐
│ 🤝 Affiliate Overview       [✕] │  Header
├─────────────────────────────────┤
│ Total Affiliates          [ 12 ]│  Stat row
│ Total Referred People     [ 87 ]│
│ New Referrals Today       [  3 ]│
├─────────────────────────────────┤
│ Top 3 Codes by Referrals        │  Section
│  1. TEDDY10 ──────────── 34     │
│  2. SALE20  ──────────── 28     │
│  3. PROMO5  ──────────── 15     │
├─────────────────────────────────┤
│ Recent Referrals (last 5)       │  Section
│  🔗 TEDDY10 · user_123          │
│     2 min ago                   │
│  ...                            │
├─────────────────────────────────┤
│           [ Close ]             │
└─────────────────────────────────┘
```

- **Loading state:** `<LoadingSpinner />` while query returns `undefined`
- **Empty state:** "No affiliates yet" with neutral icon
- **Timestamps:** Relative ("2 min ago", "today", "yesterday")
- **User IDs:** Truncated Telegram user ID (admin-only view, no PII concern)

---

## State Management

In `Dashboard.tsx`:
```tsx
const [showAffiliates, setShowAffiliates] = useState(false);
const affiliates = useQuery(api.affiliates.getOverview);
```

Query runs only after Convex hydrates (same pattern as `getDemandMetrics`).

---

## Build & Deploy Steps

1. Update `convex/schema.ts`
2. Create `convex/affiliates.ts`
3. Update `src/pages/Dashboard.tsx`
4. `npm run build` — verify no TypeScript errors
5. `npx convex deploy --yes` — deploy schema + query to prod (`fastidious-schnauzer-265`)
6. Commit + push frontend

---

## Out of Scope

- No money / revenue tracking
- No order tracking
- No affiliate management (add/edit/delete) — read-only overview only
- No bottom-nav tab
