import {
  CourierCompany,
  DeliveryStatus,
  OrderPaymentStatus,
  OrderStatus,
  TShirtOrder,
} from '../types';

export type DateFilterPreset =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'this_month'
  | 'custom';

export const ORDER_STATUS_OPTIONS: OrderStatus[] = [
  'Pending',
  'Payment Verification',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

export const PAYMENT_STATUS_OPTIONS: OrderPaymentStatus[] = [
  'Awaiting Payment',
  'Screenshot Uploaded',
  'Under Verification',
  'Verified',
  'Rejected',
  'Refund Pending',
  'Refunded',
];

export const DELIVERY_STATUS_OPTIONS: DeliveryStatus[] = [
  'Order Confirmed',
  'Processing',
  'Packed',
  'Ready for Dispatch',
  'Shipped',
  'In Transit',
  'Out for Delivery',
  'Delivered',
  'Delivery Failed',
  'Returned',
];

export const COURIER_COMPANIES: CourierCompany[] = [
  'India Post',
  'DTDC',
  'Professional Couriers',
  'Blue Dart',
  'Delhivery',
  'Other',
];

export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  'Payment Verification': 'bg-orange-50 text-orange-700 border-orange-200',
  Confirmed: 'bg-sky-50 text-sky-700 border-sky-200',
  Processing: 'bg-blue-50 text-blue-700 border-blue-200',
  Shipped: 'bg-sky-100 text-sky-800 border-sky-300',
  Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export const PAYMENT_STATUS_STYLES: Record<OrderPaymentStatus, string> = {
  'Awaiting Payment': 'bg-slate-100 text-slate-700 border-slate-300',
  'Screenshot Uploaded': 'bg-amber-50 text-amber-700 border-amber-300',
  'Under Verification': 'bg-orange-50 text-orange-700 border-orange-300',
  Verified: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  Rejected: 'bg-red-50 text-red-700 border-red-300',
  'Refund Pending': 'bg-amber-100 text-amber-800 border-amber-300',
  Refunded: 'bg-slate-200 text-slate-700 border-slate-300',
};

export const DELIVERY_STATUS_STYLES: Record<DeliveryStatus, string> = {
  'Order Confirmed': 'bg-sky-50 text-sky-700 border-sky-200',
  Processing: 'bg-blue-50 text-blue-700 border-blue-200',
  Packed: 'bg-sky-100 text-sky-800 border-sky-300',
  'Ready for Dispatch': 'bg-amber-50 text-amber-700 border-amber-300',
  Shipped: 'bg-sky-500/15 text-sky-700 border-sky-300',
  'In Transit': 'bg-blue-100 text-blue-800 border-blue-300',
  'Out for Delivery': 'bg-orange-50 text-orange-700 border-orange-300',
  Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  'Delivery Failed': 'bg-red-50 text-red-700 border-red-300',
  Returned: 'bg-slate-100 text-slate-700 border-slate-300',
};

export function formatCurrency(amount?: number): string {
  const val = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return `$${val.toFixed(2)}`;
}

export function formatOrderDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatOrderDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getCustomerInitials(name?: string): string {
  const parts = (name || 'Customer').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'NP';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function isSameLocalDay(isoDate: string, refDate: Date): boolean {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === refDate.getFullYear() &&
    d.getMonth() === refDate.getMonth() &&
    d.getDate() === refDate.getDate()
  );
}

export function isWithinDateFilter(
  isoDate: string,
  preset: DateFilterPreset,
  customStart?: string,
  customEnd?: string
): boolean {
  if (preset === 'all') return true;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return false;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (preset === 'today') {
    return d >= startOfToday;
  }

  if (preset === 'yesterday') {
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    return d >= startOfYesterday && d < startOfToday;
  }

  if (preset === 'this_week') {
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    return d >= startOfWeek;
  }

  if (preset === 'this_month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return d >= startOfMonth;
  }

  if (preset === 'custom') {
    if (customStart) {
      const start = new Date(`${customStart}T00:00:00`);
      if (d < start) return false;
    }
    if (customEnd) {
      const end = new Date(`${customEnd}T23:59:59.999`);
      if (d > end) return false;
    }
    return true;
  }

  return true;
}

export function getOrderCourierDisplayName(order: TShirtOrder): string {
  const company = order.courier?.courierCompany;
  if (!company) return 'Not Assigned';
  if (company === 'Other') {
    return order.courier?.customCourierName?.trim() || 'Other Courier';
  }
  return company;
}

export function getPaymentMethodLabel(method: TShirtOrder['paymentMethod']): string {
  const labels: Record<TShirtOrder['paymentMethod'], string> = {
    qr_code: 'UPI / QR Code',
    upi: 'UPI Transfer',
    bank_transfer: 'Bank Transfer',
    card: 'Credit / Debit Card',
  };
  return labels[method] || 'UPI / QR Code';
}

export async function downloadScreenshotImage(url: string, orderId: string): Promise<void> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `payment-proof-${orderId}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
  } catch {
    const link = document.createElement('a');
    link.href = url;
    link.download = `payment-proof-${orderId}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}

export const DELIVERY_TIMELINE_STEPS: DeliveryStatus[] = [
  'Order Confirmed',
  'Processing',
  'Packed',
  'Ready for Dispatch',
  'Shipped',
  'In Transit',
  'Out for Delivery',
  'Delivered',
];

function csvEscape(value: unknown): string {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportOrdersToCsv(
  orders: TShirtOrder[],
  getPayStatus: (order: TShirtOrder) => OrderPaymentStatus,
  getDelivStatus: (order: TShirtOrder) => DeliveryStatus
): void {
  const headers = [
    'Order ID',
    'Order Date',
    'Customer Name',
    'Mobile Number',
    'Email',
    'Street Address',
    'City',
    'District',
    'State',
    'Pincode',
    'Country',
    'Product Name',
    'Size',
    'Color',
    'Quantity',
    'Unit Price',
    'Total Amount',
    'Payment Method',
    'Transaction ID',
    'Payment Date',
    'Payment Status',
    'Order Status',
    'Delivery Status',
    'Courier Type',
    'Courier Company',
    'Tracking ID',
    'Dispatch Date',
    'Expected Delivery Date',
    'Shipping Charge',
    'Admin Notes',
  ];

  const rows = orders.map((o) => {
    const unit = o.unitPrice ?? (o.quantity > 0 ? o.totalPrice / o.quantity : o.totalPrice);
    return [
      o.id,
      formatOrderDateTime(o.createdAt),
      o.customer.fullName,
      o.customer.phone,
      o.customer.email || '',
      o.customer.streetAddress,
      o.customer.city,
      o.customer.district || '',
      o.customer.state || '',
      o.customer.zipCode,
      o.customer.country,
      o.garmentName,
      o.size,
      o.color || '',
      o.quantity,
      unit.toFixed(2),
      o.totalPrice.toFixed(2),
      getPaymentMethodLabel(o.paymentMethod),
      o.paymentTxnId || (o.cardLast4 ? `Card **** ${o.cardLast4}` : ''),
      o.paymentDate || '',
      getPayStatus(o),
      o.status,
      getDelivStatus(o),
      o.courier?.courierType || '',
      getOrderCourierDisplayName(o),
      o.courier?.trackingId || '',
      o.courier?.dispatchDate || '',
      o.courier?.expectedDeliveryDate || '',
      o.courier?.shippingCharge ?? '',
      o.adminNotes || '',
    ].map(csvEscape);
  });

  const csvContent = [headers.map(csvEscape).join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `nextprinters-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

