// ============================================================
// TedyTech Admin Mini App — Mock API Service Layer
// Placeholder for future Convex integration
// ============================================================

import type {
  Product,
  Thread,
  Message,
  Exchange,
  InventoryEvent,
  DashboardStats,
  RecentActivity,
  Brand,
  ProductType,
  ThreadCategory,
  ExchangeStatus,
} from '../types';

import {
  mockProducts,
  mockThreads,
  mockMessages,
  mockExchanges,
  mockInventoryEvents,
  mockDashboardStats,
  mockRecentActivity,
} from './mockData';

// Simulate async delay
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// ---- DASHBOARD ----

export async function getDashboardStats(): Promise<DashboardStats> {
  await delay();
  return mockDashboardStats;
}

export async function getRecentActivity(): Promise<RecentActivity[]> {
  await delay();
  return mockRecentActivity;
}

// ---- PRODUCTS ----

export async function getProducts(filters?: {
  type?: ProductType;
  brand?: Brand;
  includeArchived?: boolean;
}): Promise<Product[]> {
  await delay();
  let products = [...mockProducts];

  if (!filters?.includeArchived) {
    products = products.filter((p) => !p.archivedAt);
  }
  if (filters?.type) {
    products = products.filter((p) => p.type === filters.type);
  }
  if (filters?.brand && filters.brand !== 'Other') {
    products = products.filter((p) => p.brand === filters.brand);
  } else if (filters?.brand === 'Other') {
    const mainBrands = ['iPhone', 'Samsung', 'Tecno', 'Infinix', 'Xiaomi', 'Oppo'];
    products = products.filter((p) => !mainBrands.includes(p.brand));
  }

  return products;
}

export async function getProductById(id: string): Promise<Product | null> {
  await delay();
  return mockProducts.find((p) => p._id === id) ?? null;
}

export async function getLowStockProducts(): Promise<Product[]> {
  await delay();
  return mockProducts.filter((p) => !p.archivedAt && p.stockQuantity <= 2);
}

export async function createProduct(data: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  await delay(500);
  const newProduct: Product = {
    ...data,
    _id: `prod_${Date.now()}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  mockProducts.push(newProduct);
  return newProduct;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<Product> {
  await delay(400);
  const idx = mockProducts.findIndex((p) => p._id === id);
  if (idx === -1) throw new Error('Product not found');
  mockProducts[idx] = { ...mockProducts[idx], ...data, updatedAt: Date.now() };
  return mockProducts[idx];
}

export async function archiveProduct(id: string): Promise<void> {
  await delay(400);
  const idx = mockProducts.findIndex((p) => p._id === id);
  if (idx !== -1) {
    mockProducts[idx].archivedAt = Date.now();
    mockProducts[idx].updatedAt = Date.now();
  }
}

export async function restoreProduct(id: string): Promise<void> {
  await delay(400);
  const idx = mockProducts.findIndex((p) => p._id === id);
  if (idx !== -1) {
    delete mockProducts[idx].archivedAt;
    mockProducts[idx].updatedAt = Date.now();
  }
}

export async function getInventoryEvents(productId: string): Promise<InventoryEvent[]> {
  await delay();
  return mockInventoryEvents.filter((e) => e.productId === productId);
}

// ---- THREADS ----

export async function getThreads(category?: ThreadCategory): Promise<Thread[]> {
  await delay();
  const threads = mockThreads.filter((t) => t.status !== 'done');
  if (!category) return threads;
  return threads.filter((t) => t.category === category);
}

export async function getThreadById(id: string): Promise<Thread | null> {
  await delay();
  return mockThreads.find((t) => t._id === id) ?? null;
}

export async function markThreadSeen(id: string): Promise<void> {
  await delay(200);
  const idx = mockThreads.findIndex((t) => t._id === id);
  if (idx !== -1) {
    mockThreads[idx].status = 'seen';
    mockThreads[idx].unreadCount = 0;
    mockThreads[idx].updatedAt = Date.now();
  }
}

// ---- MESSAGES ----

export async function getMessages(threadId: string): Promise<Message[]> {
  await delay();
  return mockMessages
    .filter((m) => m.threadId === threadId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function sendMessage(threadId: string, text: string, adminTelegramId: string): Promise<Message> {
  await delay(400);
  const newMsg: Message = {
    _id: `msg_${Date.now()}`,
    threadId,
    sender: 'admin',
    senderTelegramId: adminTelegramId,
    text,
    createdAt: Date.now(),
  };
  mockMessages.push(newMsg);
  // Update thread
  const tIdx = mockThreads.findIndex((t) => t._id === threadId);
  if (tIdx !== -1) {
    mockThreads[tIdx].lastMessageAt = newMsg.createdAt;
    mockThreads[tIdx].lastMessagePreview = text.slice(0, 60);
    mockThreads[tIdx].hasAdminReplied = true;
    mockThreads[tIdx].updatedAt = newMsg.createdAt;
  }
  return newMsg;
}

// ---- EXCHANGES ----

export async function getExchanges(filters?: {
  category?: ThreadCategory;
  status?: ExchangeStatus;
}): Promise<Exchange[]> {
  await delay();
  let exchanges = mockExchanges.map((ex) => ({
    ...ex,
    desiredPhone: mockProducts.find((p) => p._id === ex.desiredPhoneId),
    thread: mockThreads.find((t) => t._id === ex.threadId),
  }));

  if (filters?.category) {
    exchanges = exchanges.filter((e) => e.category === filters.category);
  }
  if (filters?.status) {
    exchanges = exchanges.filter((e) => e.status === filters.status);
  }

  return exchanges;
}

export async function getExchangeById(id: string): Promise<Exchange | null> {
  await delay();
  const ex = mockExchanges.find((e) => e._id === id);
  if (!ex) return null;
  return {
    ...ex,
    desiredPhone: mockProducts.find((p) => p._id === ex.desiredPhoneId),
    thread: mockThreads.find((t) => t._id === ex.threadId),
  };
}

export async function updateExchangeStatus(
  id: string,
  status: ExchangeStatus,
  adminTelegramId: string
): Promise<Exchange> {
  await delay(500);
  const idx = mockExchanges.findIndex((e) => e._id === id);
  if (idx === -1) throw new Error('Exchange not found');

  const now = Date.now();
  mockExchanges[idx] = {
    ...mockExchanges[idx],
    status,
    updatedAt: now,
    ...(status === 'Completed' ? { completedAt: now, completedBy: adminTelegramId } : {}),
    ...(status === 'Rejected' ? { rejectedAt: now, rejectedBy: adminTelegramId } : {}),
  };

  // Auto-close thread if Completed or Rejected
  if (status === 'Completed' || status === 'Rejected') {
    const tIdx = mockThreads.findIndex((t) => t._id === mockExchanges[idx].threadId);
    if (tIdx !== -1) {
      mockThreads[tIdx].status = 'done';
      mockThreads[tIdx].updatedAt = now;
    }
  }

  return {
    ...mockExchanges[idx],
    desiredPhone: mockProducts.find((p) => p._id === mockExchanges[idx].desiredPhoneId),
    thread: mockThreads.find((t) => t._id === mockExchanges[idx].threadId),
  };
}

export async function sendQuote(
  exchangeId: string,
  quoteText: string,
  adminTelegramId: string
): Promise<{ exchange: Exchange; message: Message }> {
  await delay(500);
  const exIdx = mockExchanges.findIndex((e) => e._id === exchangeId);
  if (exIdx === -1) throw new Error('Exchange not found');

  const now = Date.now();
  const ex = mockExchanges[exIdx];

  // Create quote message
  const newMsg: Message = {
    _id: `msg_${Date.now()}`,
    threadId: ex.threadId,
    sender: 'admin',
    senderTelegramId: adminTelegramId,
    text: quoteText,
    exchangeId,
    createdAt: now,
  };
  mockMessages.push(newMsg);

  // Update exchange
  mockExchanges[exIdx] = {
    ...ex,
    status: 'Quoted',
    quotedAt: now,
    quotedBy: adminTelegramId,
    quoteMessageId: newMsg._id,
    updatedAt: now,
  };

  // Update thread
  const tIdx = mockThreads.findIndex((t) => t._id === ex.threadId);
  if (tIdx !== -1) {
    mockThreads[tIdx].lastMessageAt = now;
    mockThreads[tIdx].lastMessagePreview = quoteText.slice(0, 60);
    mockThreads[tIdx].hasAdminReplied = true;
    mockThreads[tIdx].updatedAt = now;
  }

  return {
    exchange: {
      ...mockExchanges[exIdx],
      desiredPhone: mockProducts.find((p) => p._id === ex.desiredPhoneId),
      thread: mockThreads.find((t) => t._id === ex.threadId),
    },
    message: newMsg,
  };
}
