// convex/schema.ts
// DATA V2 → Convex Schema Implementation (MVP Locked)

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/* =========================
   ENUMS
========================= */

const ProductType = v.union(
  v.literal("phone"),
  v.literal("accessory")
);

const Brand = v.union(
  v.literal("iPhone"),
  v.literal("Samsung"),
  v.literal("Tecno"),
  v.literal("Infinix"),
  v.literal("Xiaomi"),
  v.literal("Oppo"),
  v.literal("Other")
);

const Condition = v.union(
  v.literal("Excellent"),
  v.literal("Good"),
  v.literal("Fair"),
  v.literal("Poor")
);

const ThreadStatus = v.union(
  v.literal("new"),
  v.literal("seen"),
  v.literal("done")
);

const MessageSender = v.union(
  v.literal("customer"),
  v.literal("admin")
);

const ExchangeStatus = v.union(
  v.literal("Pending"),
  v.literal("Quoted"),
  v.literal("Accepted"),
  v.literal("Completed"),
  v.literal("Rejected")
);

const InventoryReason = v.union(
  v.literal("Exchange completed"),
  v.literal("Manual adjustment"),
  v.literal("Product created"),
  v.literal("Product restored from archive")
);

/* =========================
   SCHEMA
========================= */

export default defineSchema({

  /* =========================
     ADMINS
  ========================= */
  admins: defineTable({
    telegramId: v.string(),
    firstName: v.string(),
    lastName: v.optional(v.string()),
    username: v.optional(v.string()),
    isActive: v.boolean(),
    addedAt: v.number(),
    addedBy: v.optional(v.string()),
  })
    .index("by_telegramId", ["telegramId"])
    .index("by_isActive", ["isActive"]),

  /* =========================
     PRODUCTS
  ========================= */
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
      url: v.string(),
      order: v.number(),
    })),

    archivedAt: v.optional(v.number()),

    createdAt: v.number(),
    createdBy: v.string(),
    updatedAt: v.number(),
    updatedBy: v.string(),
  })
    .index("by_type", ["type"])
    .index("by_brand", ["brand"])
    .index("by_type_and_brand", ["type", "brand"])
    .index("by_archivedAt_and_stockQuantity", ["archivedAt", "stockQuantity"])
    .index("by_archivedAt", ["archivedAt"])
    .index("by_exchangeEnabled", ["exchangeEnabled"])
    .index("by_type_and_exchangeEnabled_and_archivedAt", [
      "type",
      "exchangeEnabled",
      "archivedAt",
    ]),

  /* =========================
     THREADS
  ========================= */
  threads: defineTable({
    telegramId: v.string(),
    customerFirstName: v.string(),
    customerLastName: v.optional(v.string()),
    customerUsername: v.optional(v.string()),

    status: ThreadStatus,
    unreadCount: v.number(),

    lastMessageAt: v.number(),
    lastMessagePreview: v.optional(v.string()),

    lastCustomerMessageAt: v.optional(v.number()),
    lastAdminMessageAt: v.optional(v.number()),

    hasCustomerMessaged: v.boolean(),
    hasAdminReplied: v.boolean(),
    lastCustomerMessageHasBudgetKeyword: v.boolean(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_telegramId", ["telegramId"])
    .index("by_status", ["status"])
    .index("by_status_and_updatedAt", ["status", "updatedAt"])
    .index("by_updatedAt", ["updatedAt"])
    .index("by_lastMessageAt", ["lastMessageAt"]),

  /* =========================
     MESSAGES
  ========================= */
  messages: defineTable({
    threadId: v.id("threads"),
    sender: MessageSender,
    senderTelegramId: v.string(),
    text: v.string(),
    exchangeId: v.optional(v.id("exchanges")),
    createdAt: v.number(),
  })
    .index("by_threadId", ["threadId"])
    .index("by_threadId_and_createdAt", ["threadId", "createdAt"])
    .index("by_sender_and_createdAt", ["sender", "createdAt"])
    .index("by_createdAt", ["createdAt"])
    .index("by_exchangeId", ["exchangeId"]),

  /* =========================
     EXCHANGES
  ========================= */
  exchanges: defineTable({
    telegramId: v.string(),
    threadId: v.id("threads"),
    desiredPhoneId: v.id("products"),

    tradeInBrand: v.string(),
    tradeInModel: v.string(),
    tradeInStorage: v.string(),
    tradeInRam: v.string(),
    tradeInCondition: Condition,
    tradeInImei: v.optional(v.string()),

    customerNotes: v.optional(v.string()),
    budgetMentionedInSubmission: v.boolean(),

    desiredPhonePrice: v.number(),

    calculatedTradeInValue: v.number(),
    calculatedDifference: v.number(),

    adminOverrideTradeInValue: v.optional(v.number()),
    adminOverrideDifference: v.optional(v.number()),

    finalTradeInValue: v.number(),
    finalDifference: v.number(),
    priorityValueETB: v.number(),

    status: ExchangeStatus,
    clickedContinue: v.boolean(),

    quotedAt: v.optional(v.number()),
    quotedBy: v.optional(v.string()),
    quoteMessageId: v.optional(v.id("messages")),

    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
    completedBy: v.optional(v.string()),
    rejectedAt: v.optional(v.number()),
    rejectedBy: v.optional(v.string()),
  })
    .index("by_telegramId", ["telegramId"])
    .index("by_threadId", ["threadId"])
    .index("by_status", ["status"])
    .index("by_status_and_createdAt", ["status", "createdAt"])
    .index("by_createdAt", ["createdAt"])
    .index("by_updatedAt", ["updatedAt"])
    .index("by_status_and_completedAt", ["status", "completedAt"])
    .index("by_tradeIn_exact_completed", [
      "tradeInBrand",
      "tradeInModel",
      "tradeInStorage",
      "tradeInCondition",
      "status",
    ])
    .index("by_tradeIn_brand_model_storage_completed", [
      "tradeInBrand",
      "tradeInModel",
      "tradeInStorage",
      "status",
    ])
    .index("by_tradeIn_brand_model_completed", [
      "tradeInBrand",
      "tradeInModel",
      "status",
    ])
    .index("by_threadId_and_createdAt", ["threadId", "createdAt"])
    .index("by_threadId_and_updatedAt", ["threadId", "updatedAt"]),

  /* =========================
     INVENTORY EVENTS
  ========================= */
  inventoryEvents: defineTable({
    productId: v.id("products"),
    oldQty: v.number(),
    newQty: v.number(),
    editedBy: v.string(),
    reason: InventoryReason,
    exchangeId: v.optional(v.id("exchanges")),
    timestamp: v.number(),
  })
    .index("by_productId", ["productId"])
    .index("by_productId_and_timestamp", ["productId", "timestamp"])
    .index("by_editedBy", ["editedBy"])
    .index("by_timestamp", ["timestamp"])
    .index("by_reason", ["reason"]),
});