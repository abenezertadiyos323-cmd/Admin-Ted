# Affiliate Mutations Design Document

**Date:** 2026-03-01
**Status:** Approved
**Scope:** Admin-Ted Convex backend only (customer mini app wired separately; bot wiring deferred)

---

## Summary

Add two write mutations to `convex/affiliates.ts` so the customer mini app (Earn page) and the Telegram bot can write to the `affiliates` and `referrals` tables. Both tables already exist in the schema. The Admin Affiliates overview stats (total affiliates, referred people, etc.) become non-zero once these mutations are called.

---

## Mutations

### 1. `getOrCreateMyAffiliate`

**Purpose:** Called by the customer mini app Earn page on load. Returns the existing affiliate for the user, or creates one if none exists.

**Args:** `{ telegramUserId: v.string() }`

**Logic:**
1. Query `affiliates` via `by_ownerTelegramUserId` index — return existing doc if found
2. Generate code: `"REF"` + 6 random digits (`Math.floor(100_000 + Math.random() * 900_000)`)
3. Collision guard: `do…while` loop re-generates if code already exists (checked via `by_code` index)
4. Insert and return the new affiliate doc

**Returns:** Full affiliate document `{ _id, code, ownerTelegramUserId, createdAt, status, _creationTime }`

**Idempotent:** Yes — same user calling multiple times always gets the same affiliate doc.

---

### 2. `trackReferral`

**Purpose:** Called by the Telegram bot on `/start <code>` payload, or by any surface that wants to record a referral event.

**Args:** `{ code: v.string(), referredTelegramUserId: v.string(), source: v.optional(v.string()) }`

**Logic:**
1. Verify the affiliate code exists via `by_code` index — silently return `{ inserted: false }` if not found (safe for stale bot payloads)
2. Check `by_referred_and_code` index for existing `(referredTelegramUserId, code)` pair — return `{ inserted: false }` if duplicate
3. Insert referral row: `{ code, referredTelegramUserId, createdAt: Date.now(), source }`

**Returns:** `{ inserted: boolean }` — caller knows whether this was a new referral

**Idempotent:** Yes — same `(code, referredTelegramUserId)` pair is a no-op.

---

## File Changed

| File | Change |
|------|--------|
| `convex/affiliates.ts` | Add `getOrCreateMyAffiliate` mutation + `trackReferral` mutation |

Also required after code change:
- `npx convex deploy --yes` — pushes to `fastidious-schnauzer-265` (prod)
- `npx convex codegen` — regenerates `_generated/api.d.ts` so TypeScript knows about the new mutations

---

## Out of Scope

- Customer mini app Earn page UI (separate repo, separate session)
- Bot `/start` payload handler (n8n wiring deferred)
- No frontend changes in Admin-Ted
