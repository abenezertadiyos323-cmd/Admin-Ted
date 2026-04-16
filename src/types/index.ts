import type { Id } from '../../convex/_generated/dataModel';

export type ProductType = 'phone' | 'accessory';

export type Condition = 'New' | 'Like New' | 'Excellent' | 'Good' | 'Fair' | 'Poor';

export interface Variant {
  storage: string;
  ram?: string;
  price: number;
  stock: number;
}

export interface Product {
  _id: Id<'products'>;
  _creationTime: number;
  type: ProductType;
  phoneType?: string;
  brand?: string;
  model?: string;
  ram?: string;
  storage?: string;
  condition?: Condition;
  price: number;
  stockQuantity: number;
  exchangeEnabled: boolean;
  description?: string;
  images: string[];
  isArchived: boolean;
  archivedAt?: number;
  createdAt: number;
  createdBy: string;
  updatedAt: number;
  updatedBy: string;
  sellerId: string;
  batteryHealth?: string;
  modelOrigin?: string;
  network?: string;
  screenSize?: string;
  battery?: string;
  mainCamera?: string;
  selfieCamera?: string;
  simType?: string;
  color?: string;
  operatingSystem?: string;
  features?: string;
  variants?: Variant[];
}

export interface Thread {
  _id: Id<'threads'>;
  _creationTime: number;
  telegramId: string;
  customerFirstName: string;
  customerLastName?: string;
  customerUsername?: string;
  status: 'new' | 'seen' | 'done';
  unreadCount: number;
  lastMessageAt: number;
  lastMessagePreview?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  _id: Id<'messages'>;
  _creationTime: number;
  threadId: Id<'threads'>;
  sender: 'customer' | 'admin';
  senderRole?: 'customer' | 'admin' | 'bot';
  senderTelegramId: string;
  text: string;
  createdAt: number;
}

export interface Exchange {
  _id: Id<'exchanges'>;
  _creationTime: number;
  telegramId: string;
  threadId: Id<'threads'>;
  desiredPhoneId: Id<'products'>;
  tradeInBrand: string;
  tradeInModel: string;
  tradeInStorage: string;
  tradeInRam: string;
  tradeInCondition: Condition;
  status: 'Pending' | 'Quoted' | 'Accepted' | 'Completed' | 'Rejected';
  calculatedTradeInValue: number;
  calculatedDifference: number;
  finalTradeInValue: number;
  finalDifference: number;
  createdAt: number;
  updatedAt: number;
}
