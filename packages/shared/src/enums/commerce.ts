export const ORDER_SOURCES = {
  RAZORPAY: 'razorpay',
  APPLE: 'apple',
  GOOGLE: 'google',
  POINTS: 'points',
  ADMIN: 'admin',
} as const;

export type OrderSource = (typeof ORDER_SOURCES)[keyof typeof ORDER_SOURCES];

export const ORDER_STATUSES = {
  CREATED: 'created',
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  PARTIALLY_REFUNDED: 'partially_refunded',
  REFUNDED: 'refunded',
} as const;

export type OrderStatus = (typeof ORDER_STATUSES)[keyof typeof ORDER_STATUSES];

export const PAYMENT_PROVIDERS = {
  RAZORPAY: 'razorpay',
  APPLE: 'apple',
  GOOGLE: 'google',
} as const;

export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[keyof typeof PAYMENT_PROVIDERS];

export const PAYMENT_STATUSES = {
  CAPTURED: 'captured',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[keyof typeof PAYMENT_STATUSES];

export const REFUND_STATUSES = {
  REQUESTED: 'requested',
  PROCESSED: 'processed',
  FAILED: 'failed',
} as const;

export type RefundStatus = (typeof REFUND_STATUSES)[keyof typeof REFUND_STATUSES];

export const WEBHOOK_PROVIDERS = {
  RAZORPAY: 'razorpay',
  REVENUECAT: 'revenuecat',
  MUX: 'mux',
  BIGIN: 'bigin',
} as const;

export type WebhookProvider = (typeof WEBHOOK_PROVIDERS)[keyof typeof WEBHOOK_PROVIDERS];

export const WEBHOOK_STATUSES = {
  RECEIVED: 'received',
  PROCESSED: 'processed',
  FAILED: 'failed',
} as const;

export type WebhookStatus = (typeof WEBHOOK_STATUSES)[keyof typeof WEBHOOK_STATUSES];

export const COUPON_TYPES = {
  PERCENT: 'percent',
  FLAT: 'flat',
} as const;

export type CouponType = (typeof COUPON_TYPES)[keyof typeof COUPON_TYPES];

export const CURRENCIES = {
  INR: 'INR',
} as const;

export type Currency = (typeof CURRENCIES)[keyof typeof CURRENCIES];
