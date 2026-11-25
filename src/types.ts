export type Category = 'All' | 'T-Shirt' | 'Design';

export interface PrintSpec {
  method: 'Screen Printing' | 'DTG Direct-to-Garment' | 'Sublimation' | 'Heat Transfer' | 'Embroidery';
  colorWay: string;
  material: string;
  printLocation: 'Front Chest' | 'Full Back' | 'Left Sleeve' | 'Over-Sized Front' | 'All Over';
  dpi: number;
}

export interface ImageItem {
  id: string;
  title: string;
  category: Category;
  description: string;
  author: string;
  url: string;
  storagePath: string;
  fileSize: string;
  createdAt: string;
  downloadCount: number;
  favoriteCount: number;
  tags: string[];
  aspectRatio: 'square' | 'landscape' | 'portrait';
  width: number;
  height: number;
  isFavorite?: boolean;
  views?: number;
  printSpec?: PrintSpec;
}

export interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAdmin: boolean;
}

export type SortOption = 'newest' | 'downloads' | 'favorites' | 'views' | 'title';

export type GarmentType = 'tshirt' | 'oversized' | 'hoodie' | 'totebag';

export interface MockupBackground {
  id: string;
  name: string;
  imageUrl: string;
  category: GarmentType;
  storagePath?: string;
  createdAt?: string;
  uploadedByAdmin?: boolean;
  isTemp?: boolean;
}

export interface FilterState {
  searchQuery: string;
  category: Category;
  sortBy: SortOption;
  onlyFavorites: boolean;
  selectedTag: string | null;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  storagePath: string;
  couponCode: string;
  isActive: boolean;
  createdAt: string;
}

export interface SiteSettings {
  logoUrl?: string;
  logoStoragePath?: string;
  siteName?: string;
  qrCodeUrl?: string;
  qrCodeStoragePath?: string;
}

export interface CustomerAddress {
  fullName: string;
  phone: string;
  email?: string;
  streetAddress: string;
  city: string;
  district?: string;
  state: string;
  zipCode: string;
  country: string;
  profileImageUrl?: string;
}

export type TShirtSize = 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL';

export type OrderStatus =
  | 'Pending'
  | 'Payment Verification'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export type OrderPaymentStatus =
  | 'Awaiting Payment'
  | 'Screenshot Uploaded'
  | 'Under Verification'
  | 'Verified'
  | 'Rejected'
  | 'Refund Pending'
  | 'Refunded';

export type CourierCompany =
  | 'India Post'
  | 'DTDC'
  | 'Professional Couriers'
  | 'Blue Dart'
  | 'Delhivery'
  | 'Other';

export type DeliveryStatus =
  | 'Order Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Ready for Dispatch'
  | 'Shipped'
  | 'In Transit'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Delivery Failed'
  | 'Returned';

export interface PaymentVerificationEntry {
  id: string;
  status: OrderPaymentStatus;
  reason?: string;
  adminId: string;
  adminName?: string;
  timestamp: string;
}

export interface CourierInfo {
  courierType?: string;
  courierCompany?: CourierCompany | string;
  customCourierName?: string;
  trackingId?: string;
  trackingUrl?: string;
  dispatchDate?: string;
  expectedDeliveryDate?: string;
  shippingCharge?: number;
  deliveryNotes?: string;
}

export interface DeliveryHistoryEntry {
  id: string;
  status: DeliveryStatus;
  remarks?: string;
  courierCompany?: string;
  trackingId?: string;
  updatedBy: string;
  timestamp: string;
}

export type CustomerNotificationType =
  | 'order_placed'
  | 'payment_submitted'
  | 'payment_verified'
  | 'payment_rejected'
  | 'order_confirmed'
  | 'order_packed'
  | 'order_shipped'
  | 'order_out_for_delivery'
  | 'order_delivered'
  | 'courier_updated';

export interface CustomerNotification {
  id: string;
  orderId: string;
  customerPhone: string;
  type: CustomerNotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  details: string;
  actorId: string;
  actorName?: string;
  timestamp: string;
}

export interface TShirtOrder {
  id: string;
  createdAt: string;
  updatedAt?: string;
  customer: CustomerAddress;
  size: TShirtSize;
  color?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice: number;
  paymentMethod: 'qr_code' | 'card' | 'upi' | 'bank_transfer';
  paymentProofUrl?: string;
  paymentTxnId?: string;
  paymentDate?: string;
  paymentTime?: string;
  paymentAmount?: number;
  paymentPayerPhone?: string;
  paymentStatus?: OrderPaymentStatus;
  paymentRejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationHistory?: PaymentVerificationEntry[];
  cardLast4?: string;
  status: OrderStatus;
  garmentName: string;
  mockupImageUrl?: string;
  placedDesignsCount: number;
  courier?: CourierInfo;
  deliveryStatus?: DeliveryStatus;
  deliveryHistory?: DeliveryHistoryEntry[];
  adminNotes?: string;
  auditLogs?: AuditLogEntry[];
}


