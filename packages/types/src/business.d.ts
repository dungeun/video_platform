/**
 * @company/types - 비즈니스 도메인 타입
 */
import { ID, EntityMetadata, Money, Address, ContactInfo, FileInfo, Status } from './common';
export interface Product extends EntityMetadata {
    id: ID;
    sku: string;
    name: string;
    description: string;
    shortDescription?: string;
    categoryId: ID;
    brandId?: ID;
    supplierId?: ID;
    status: ProductStatus;
    type: ProductType;
    price: Money;
    originalPrice?: Money;
    costPrice?: Money;
    inventory: ProductInventory;
    images: FileInfo[];
    videos?: FileInfo[];
    documents?: FileInfo[];
    attributes: ProductAttribute[];
    variants?: ProductVariant[];
    seo: ProductSEO;
    weight?: number;
    dimensions?: ProductDimensions;
    isDigital: boolean;
    isTaxable: boolean;
    isShippable: boolean;
}
export type ProductStatus = 'active' | 'inactive' | 'draft' | 'archived' | 'out_of_stock';
export type ProductType = 'simple' | 'variable' | 'grouped' | 'external' | 'subscription';
export interface ProductInventory {
    quantity: number;
    reservedQuantity: number;
    minQuantity: number;
    maxQuantity?: number;
    trackQuantity: boolean;
    allowBackorder: boolean;
    stockStatus: 'in_stock' | 'out_of_stock' | 'on_backorder';
}
export interface ProductAttribute {
    name: string;
    value: string | number | boolean;
    type: AttributeType;
    isRequired: boolean;
    isVariable: boolean;
    displayOrder: number;
}
export type AttributeType = 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'color' | 'image';
export interface ProductVariant {
    id: ID;
    sku: string;
    name: string;
    price: Money;
    inventory: ProductInventory;
    attributes: Record<string, string>;
    image?: string;
    isDefault: boolean;
}
export interface ProductDimensions {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
}
export interface ProductSEO {
    title?: string;
    description?: string;
    keywords?: string[];
    slug: string;
}
export interface Category extends EntityMetadata {
    id: ID;
    name: string;
    description?: string;
    slug: string;
    parentId?: ID;
    image?: string;
    isActive: boolean;
    displayOrder: number;
    level: number;
    path: string;
    children?: Category[];
    productCount: number;
}
export interface Brand extends EntityMetadata {
    id: ID;
    name: string;
    description?: string;
    logo?: string;
    website?: string;
    isActive: boolean;
    productCount: number;
}
export interface Order extends EntityMetadata {
    id: ID;
    orderNumber: string;
    customerId?: ID;
    guestInfo?: GuestCustomer;
    status: OrderStatus;
    items: OrderItem[];
    subtotal: Money;
    tax: Money;
    shipping: Money;
    discount: Money;
    total: Money;
    shippingAddress: Address;
    billingAddress: Address;
    shippingMethod: ShippingMethod;
    payment: OrderPayment;
    notes?: string;
    tags?: string[];
    source: OrderSource;
    estimatedDelivery?: Date;
    deliveredAt?: Date;
    cancelledAt?: Date;
    refundedAt?: Date;
}
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'returned';
export interface OrderItem {
    id: ID;
    productId: ID;
    variantId?: ID;
    sku: string;
    name: string;
    quantity: number;
    unitPrice: Money;
    totalPrice: Money;
    tax: Money;
    discount: Money;
    attributes?: Record<string, string>;
    image?: string;
}
export interface ShippingMethod {
    id: ID;
    name: string;
    description?: string;
    price: Money;
    estimatedDays: number;
    trackingEnabled: boolean;
    carrier?: string;
}
export interface OrderPayment {
    method: PaymentMethod;
    status: PaymentStatus;
    transactionId?: string;
    gatewayResponse?: Record<string, any>;
    paidAt?: Date;
    failedAt?: Date;
    failureReason?: string;
}
export type PaymentMethod = 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'cash' | 'crypto';
export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'failed' | 'cancelled' | 'refunded';
export type OrderSource = 'web' | 'mobile' | 'pos' | 'phone' | 'email' | 'api';
export interface GuestCustomer {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
}
export interface Customer extends EntityMetadata {
    id: ID;
    userId?: ID;
    email: string;
    firstName: string;
    lastName: string;
    displayName: string;
    phone?: string;
    birthDate?: Date;
    gender?: 'male' | 'female' | 'other';
    addresses: CustomerAddress[];
    defaultBillingAddressId?: ID;
    defaultShippingAddressId?: ID;
    totalOrders: number;
    totalSpent: Money;
    averageOrderValue: Money;
    lastOrderAt?: Date;
    segment: CustomerSegment;
    tags: string[];
    notes?: string;
    acceptsMarketing: boolean;
    preferredLanguage: string;
    preferredCurrency: string;
}
export interface CustomerAddress extends Address {
    id: ID;
    name: string;
    isDefault: boolean;
    type: 'billing' | 'shipping' | 'both';
}
export type CustomerSegment = 'new' | 'regular' | 'vip' | 'inactive' | 'high_risk';
export interface Cart {
    id: ID;
    customerId?: ID;
    sessionId?: string;
    items: CartItem[];
    subtotal: Money;
    tax: Money;
    shipping: Money;
    discount: Money;
    total: Money;
    coupons: AppliedCoupon[];
    shippingAddress?: Address;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date;
}
export interface CartItem {
    id: ID;
    productId: ID;
    variantId?: ID;
    sku: string;
    name: string;
    image?: string;
    quantity: number;
    unitPrice: Money;
    totalPrice: Money;
    attributes?: Record<string, string>;
    addedAt: Date;
}
export interface Coupon extends EntityMetadata {
    id: ID;
    code: string;
    name: string;
    description?: string;
    type: CouponType;
    value: number;
    minimumAmount?: Money;
    maximumDiscount?: Money;
    conditions: CouponCondition[];
    usageLimit?: number;
    usageCount: number;
    usageLimitPerCustomer?: number;
    startDate: Date;
    endDate?: Date;
    isActive: boolean;
    applicableProducts?: ID[];
    applicableCategories?: ID[];
    excludedProducts?: ID[];
    excludedCategories?: ID[];
}
export type CouponType = 'percentage' | 'fixed_amount' | 'free_shipping' | 'buy_x_get_y';
export interface CouponCondition {
    type: 'min_amount' | 'min_quantity' | 'product_in_cart' | 'customer_group' | 'first_order';
    value: any;
}
export interface AppliedCoupon {
    couponId: ID;
    code: string;
    discountAmount: Money;
    appliedAt: Date;
}
export interface Review extends EntityMetadata {
    id: ID;
    productId: ID;
    customerId: ID;
    orderId?: ID;
    rating: number;
    title?: string;
    content: string;
    images?: FileInfo[];
    isVerified: boolean;
    verifiedPurchase: boolean;
    status: ReviewStatus;
    moderatedBy?: ID;
    moderatedAt?: Date;
    moderationNotes?: string;
    helpfulCount: number;
    notHelpfulCount: number;
    merchantReply?: ReviewReply;
}
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'hidden';
export interface ReviewReply {
    content: string;
    repliedBy: ID;
    repliedAt: Date;
}
export interface Wishlist extends EntityMetadata {
    id: ID;
    customerId: ID;
    name: string;
    description?: string;
    isPublic: boolean;
    isDefault: boolean;
    items: WishlistItem[];
}
export interface WishlistItem {
    id: ID;
    productId: ID;
    variantId?: ID;
    addedAt: Date;
    notes?: string;
}
export interface InventoryMovement extends EntityMetadata {
    id: ID;
    productId: ID;
    variantId?: ID;
    type: InventoryMovementType;
    quantity: number;
    reason: string;
    referenceId?: ID;
    referenceType?: string;
    balanceAfter: number;
    cost?: Money;
    notes?: string;
}
export type InventoryMovementType = 'sale' | 'return' | 'adjustment' | 'restock' | 'damage' | 'transfer';
export interface Shipment extends EntityMetadata {
    id: ID;
    orderId: ID;
    trackingNumber?: string;
    carrier: string;
    service: string;
    status: ShipmentStatus;
    fromAddress: Address;
    toAddress: Address;
    packages: Package[];
    cost: Money;
    shippedAt?: Date;
    estimatedDelivery?: Date;
    deliveredAt?: Date;
    trackingEvents: TrackingEvent[];
    instructions?: string;
    signatureRequired: boolean;
    insuranceValue?: Money;
}
export type ShipmentStatus = 'pending' | 'shipped' | 'in_transit' | 'delivered' | 'failed' | 'returned';
export interface Package {
    weight: number;
    dimensions: ProductDimensions;
    items: PackageItem[];
}
export interface PackageItem {
    productId: ID;
    quantity: number;
    sku: string;
    name: string;
}
export interface TrackingEvent {
    timestamp: Date;
    status: string;
    description: string;
    location?: string;
}
export interface Supplier extends EntityMetadata {
    id: ID;
    name: string;
    code: string;
    description?: string;
    contactInfo: ContactInfo;
    address: Address;
    contractStartDate?: Date;
    contractEndDate?: Date;
    paymentTerms: string;
    currency: string;
    rating: number;
    onTimeDeliveryRate: number;
    qualityRating: number;
    status: Status;
    isPreferred: boolean;
    products: SupplierProduct[];
}
export interface SupplierProduct {
    supplierProductId: string;
    productId: ID;
    supplierPrice: Money;
    minimumOrderQuantity: number;
    leadTimeDays: number;
    isAvailable: boolean;
}
export interface SalesAnalytics {
    period: AnalyticsPeriod;
    totalRevenue: Money;
    totalOrders: number;
    averageOrderValue: Money;
    conversionRate: number;
    topProducts: ProductSalesData[];
    topCategories: CategorySalesData[];
    customerMetrics: CustomerAnalytics;
    geographicData: GeographicSalesData[];
}
export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
export interface ProductSalesData {
    productId: ID;
    name: string;
    revenue: Money;
    quantity: number;
    orders: number;
}
export interface CategorySalesData {
    categoryId: ID;
    name: string;
    revenue: Money;
    quantity: number;
    orders: number;
}
export interface CustomerAnalytics {
    newCustomers: number;
    returningCustomers: number;
    customerLifetimeValue: Money;
    churnRate: number;
    retentionRate: number;
}
export interface GeographicSalesData {
    country: string;
    state?: string;
    city?: string;
    revenue: Money;
    orders: number;
    customers: number;
}
//# sourceMappingURL=business.d.ts.map