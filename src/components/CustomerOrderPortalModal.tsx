import React, { useEffect, useState } from 'react';
import { CustomerNotification, SiteSettings, TShirtOrder } from '../types';
import {
  findCustomerOrderSecure,
  getCourierTrackingUrl,
  getEffectiveDeliveryStatus,
  getEffectivePaymentStatus,
  markCustomerNotificationRead,
  submitCustomerPaymentProof,
  subscribeToCustomerNotifications,
  subscribeToCustomerOrder,
  validatePaymentScreenshot,
} from '../services/firebaseGalleryService';
import {
  DELIVERY_STATUS_STYLES,
  DELIVERY_TIMELINE_STEPS,
  ORDER_STATUS_STYLES,
  PAYMENT_STATUS_STYLES,
  formatCurrency,
  formatOrderDate,
  formatOrderDateTime,
  getOrderCourierDisplayName,
  getPaymentMethodLabel,
} from '../utils/orderHelpers';
import {
  X,
  Search,
  Truck,
  CreditCard,
  Bell,
  Upload,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  QrCode,
  RefreshCw,
  Package,
  Clock,
  ShieldCheck,
  Shirt,
} from 'lucide-react';

interface CustomerOrderPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteSettings: SiteSettings | null;
  initialOrderId?: string;
  initialPhone?: string;
}

const RECENT_ORDERS_KEY = 'nextprinters_my_orders';

export interface SavedOrderRef {
  id: string;
  phone: string;
}

export function saveLocalCustomerOrderRef(orderId: string, phone: string) {
  try {
    const raw = localStorage.getItem(RECENT_ORDERS_KEY);
    const list: SavedOrderRef[] = raw ? JSON.parse(raw) : [];
    const next = [{ id: orderId, phone }, ...list.filter((r) => r.id !== orderId)].slice(0, 5);
    localStorage.setItem(RECENT_ORDERS_KEY, JSON.stringify(next));
  } catch {}
}

export function getLocalCustomerOrderRefs(): SavedOrderRef[] {
  try {
    const raw = localStorage.getItem(RECENT_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const CustomerOrderPortalModal: React.FC<CustomerOrderPortalModalProps> = ({
  isOpen,
  onClose,
  siteSettings,
  initialOrderId = '',
  initialPhone = '',
}) => {
  const [lookupOrderId, setLookupOrderId] = useState(initialOrderId);
  const [lookupPhone, setLookupPhone] = useState(initialPhone);
  const [verifiedLookup, setVerifiedLookup] = useState<{ id: string; phone: string } | null>(null);
  const [order, setOrder] = useState<TShirtOrder | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [recentRefs, setRecentRefs] = useState<SavedOrderRef[]>([]);

  // Post-order Payment Submission State
  const [payMethod, setPayMethod] = useState<'upi' | 'bank_transfer'>('upi');
  const [txnId, setTxnId] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payTime, setPayTime] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [submittingPay, setSubmittingPay] = useState(false);
  const [payFeedback, setPayFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const saved = getLocalCustomerOrderRefs();
    setRecentRefs(saved);

    if (initialOrderId && initialPhone) {
      setLookupOrderId(initialOrderId);
      setLookupPhone(initialPhone);
      handleLookup(initialOrderId, initialPhone);
    } else if (saved.length > 0 && !order) {
      setLookupOrderId(saved[0].id);
      setLookupPhone(saved[0].phone);
      handleLookup(saved[0].id, saved[0].phone);
    }
  }, [isOpen, initialOrderId, initialPhone]);

  // Live Firestore listener for the currently verified order
  useEffect(() => {
    if (!isOpen || !verifiedLookup) return;
    const unsub = subscribeToCustomerOrder(
      verifiedLookup.id,
      verifiedLookup.phone,
      (liveOrder) => {
        if (liveOrder) setOrder(liveOrder);
      },
      (err) => {
        console.warn('Live customer order listener:', err);
      }
    );
    return () => unsub();
  }, [isOpen, verifiedLookup?.id, verifiedLookup?.phone]);

  // Subscribe to customer notifications for the active order
  useEffect(() => {
    if (!isOpen || !order) {
      setNotifications([]);
      return;
    }
    const unsub = subscribeToCustomerNotifications([order.id], (list) => {
      setNotifications(list);
    });
    return () => unsub();
  }, [isOpen, order?.id]);

  // Sync payment form fields when an order loads
  useEffect(() => {
    if (!order) return;
    setTxnId(order.paymentTxnId || '');
    setPayDate(order.paymentDate || new Date().toISOString().slice(0, 10));
    setPayTime(order.paymentTime || '');
    setPayerPhone(order.paymentPayerPhone || order.customer.phone || '');
    setPayAmount(String(order.paymentAmount ?? order.totalPrice ?? ''));
    setPayMethod(order.paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'upi');
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setPayFeedback(null);
  }, [order?.id]);

  useEffect(() => {
    if (!screenshotFile) {
      setScreenshotPreview(null);
      return;
    }
    const url = URL.createObjectURL(screenshotFile);
    setScreenshotPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [screenshotFile]);

  if (!isOpen) return null;

  const handleLookup = async (idOverride?: string, phoneOverride?: string) => {
    const idVal = (idOverride ?? lookupOrderId).trim().replace(/^#/, '');
    const phoneVal = (phoneOverride ?? lookupPhone).trim();
    if (!idVal || !phoneVal) {
      setLookupError('Please enter both your Order ID and Mobile Number.');
      return;
    }

    try {
      setLookupLoading(true);
      setLookupError(null);
      const found = await findCustomerOrderSecure(idVal, phoneVal);
      if (!found) {
        setOrder(null);
        setVerifiedLookup(null);
        setLookupError('No order found matching that Order ID and Mobile Number.');
        return;
      }
      setOrder(found);
      setVerifiedLookup({ id: found.id, phone: phoneVal });
      saveLocalCustomerOrderRef(found.id, phoneVal);
      setRecentRefs(getLocalCustomerOrderRefs());
    } catch (err: any) {
      setOrder(null);
      setVerifiedLookup(null);
      setLookupError(err.message || 'Unable to verify order details.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleScreenshotSelect = (file: File) => {
    setPayFeedback(null);
    const check = validatePaymentScreenshot(file);
    if (!check.valid) {
      setPayFeedback({ type: 'error', text: check.error || 'Invalid screenshot file.' });
      setScreenshotFile(null);
      return;
    }
    setScreenshotFile(file);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setPayFeedback(null);

    try {
      setSubmittingPay(true);
      const updated = await submitCustomerPaymentProof(
        order,
        {
          paymentTxnId: txnId,
          paymentDate: payDate,
          paymentTime: payTime || undefined,
          paymentPayerPhone: payerPhone,
          paymentAmount: Number(payAmount) || order.totalPrice,
          paymentMethod: payMethod,
        },
        screenshotFile
      );
      setOrder(updated);
      setScreenshotFile(null);
      setPayFeedback({
        type: 'success',
        text: 'Payment proof submitted! Status is now "Screenshot Uploaded" pending admin verification.',
      });
    } catch (err: any) {
      setPayFeedback({ type: 'error', text: err.message || 'Failed to submit payment details.' });
    } finally {
      setSubmittingPay(false);
    }
  };

  const paymentStatus = order ? getEffectivePaymentStatus(order) : 'Awaiting Payment';
  const deliveryStatus = order ? getEffectiveDeliveryStatus(order) : 'Order Confirmed';
  const trackingUrl = order ? getCourierTrackingUrl(order.courier) : null;
  const canEditPayment = order && paymentStatus !== 'Verified' && order.status !== 'Cancelled';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl border border-sky-200">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Track Order & Submit Payment
              </h2>
              <p className="text-xs text-slate-500">
                View courier tracking, live payment verification status, and submit or replace payment screenshots
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Secure Order Lookup Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup();
            }}
            className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Order ID *</label>
                <input
                  type="text"
                  required
                  value={lookupOrderId}
                  onChange={(e) => setLookupOrderId(e.target.value)}
                  placeholder="e.g. ord_1726..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="sm:col-span-5">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Registered Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  placeholder="Enter mobile used at checkout"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{lookupLoading ? '...' : 'Track'}</span>
                </button>
              </div>
            </div>

            {recentRefs.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                <span className="text-slate-500 font-semibold">Recent on this device:</span>
                {recentRefs.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setLookupOrderId(r.id);
                      setLookupPhone(r.phone);
                      handleLookup(r.id, r.phone);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:border-sky-400 font-mono text-sky-700 font-bold"
                  >
                    #{r.id}
                  </button>
                ))}
              </div>
            )}

            {lookupError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}
          </form>

          {order && (
            <div className="space-y-5">
              {/* Customer Notifications */}
              {notifications.length > 0 && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-amber-600" /> Order & Payment Notifications
                  </h3>
                  <div className="space-y-2 max-h-44 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.read && markCustomerNotificationRead(n.id)}
                        className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                          n.read
                            ? 'bg-white/80 border-slate-200 text-slate-600'
                            : 'bg-white border-amber-300 text-slate-900 shadow-sm'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold flex items-center gap-1.5">
                            {!n.read && <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />}
                            <span>{n.title}</span>
                          </p>
                          <p className="text-[11px]">{n.message}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatOrderDateTime(n.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Summary & Status Strip */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="bg-sky-50 text-sky-700 border border-sky-200 font-mono font-bold px-2.5 py-1 rounded-lg">
                      Order ID: #{order.id}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Placed: <strong className="text-slate-700">{formatOrderDateTime(order.createdAt)}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold ${PAYMENT_STATUS_STYLES[paymentStatus]}`}>
                      Payment: {paymentStatus}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold ${ORDER_STATUS_STYLES[order.status]}`}>
                      Order: {order.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <div className="md:col-span-6 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      {order.mockupImageUrl ? (
                        <img src={order.mockupImageUrl} alt={order.garmentName} className="w-full h-full object-contain p-1" />
                      ) : (
                        <Shirt className="w-6 h-6 text-sky-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-900 truncate">{order.garmentName}</p>
                      <p className="text-[11px] text-slate-600">
                        Size: <strong>{order.size}</strong> • Color: <strong>{order.color || 'Custom'}</strong> • Qty: <strong>{order.quantity}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Payment Amount</span>
                    <p className="text-sky-700 font-extrabold text-base">
                      {formatCurrency(order.paymentAmount ?? order.totalPrice)}
                    </p>
                  </div>
                  <div className="md:col-span-3">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Delivery Status</span>
                    <span className={`inline-flex px-2.5 py-1 rounded-lg border text-[11px] font-bold ${DELIVERY_STATUS_STYLES[deliveryStatus]}`}>
                      {deliveryStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Courier & Delivery Tracking Section + Visual Timeline */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-sky-700 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-amber-500" /> Courier & Delivery Tracking
                  </h3>
                  {trackingUrl && (
                    <a
                      href={trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-[11px] font-bold inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Track Package
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-white border border-slate-200 rounded-xl p-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Courier Company</span>
                    <strong className="text-slate-900">{getOrderCourierDisplayName(order)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Tracking Number</span>
                    <strong className="font-mono text-slate-900">{order.courier?.trackingId || 'Pending'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Dispatch Date</span>
                    <strong className="text-slate-900">{order.courier?.dispatchDate || 'Not yet dispatched'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Expected Delivery</span>
                    <strong className="text-slate-900">{order.courier?.expectedDeliveryDate || 'TBD'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Status</span>
                    <strong className="text-sky-700">{deliveryStatus}</strong>
                  </div>
                </div>

                {/* Visual Delivery Status Timeline */}
                {order.status === 'Cancelled' || deliveryStatus === 'Delivery Failed' || deliveryStatus === 'Returned' ? (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      Current Order / Delivery Exception: {order.status === 'Cancelled' ? 'Order Cancelled' : deliveryStatus}
                    </span>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Delivery Status Timeline
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                      {DELIVERY_TIMELINE_STEPS.map((step, idx) => {
                        const activeIdx = DELIVERY_TIMELINE_STEPS.indexOf(deliveryStatus);
                        const hasStarted = order.status !== 'Pending' || paymentStatus === 'Verified';
                        const isDone = hasStarted && activeIdx >= idx;
                        const isCurrent = hasStarted && activeIdx === idx;
                        return (
                          <div
                            key={step}
                            className={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition-all ${
                              isCurrent
                                ? 'bg-sky-50 border-sky-500 text-sky-800 shadow-sm'
                                : isDone
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-700'
                                : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center ${
                                isCurrent
                                  ? 'bg-sky-500 text-white'
                                  : isDone
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-200 text-slate-500'
                              }`}
                            >
                              {isDone ? '✓' : idx + 1}
                            </span>
                            <span className="text-[10px] font-bold leading-tight">{step}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {order.deliveryHistory && order.deliveryHistory.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-sky-500" /> Shipping Updates
                    </p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {order.deliveryHistory.slice().reverse().map((h) => (
                        <div key={h.id} className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex justify-between gap-2 text-[11px]">
                          <div>
                            <strong className="text-slate-900">{h.status}</strong>
                            {h.remarks && <span className="text-slate-600"> — {h.remarks}</span>}
                          </div>
                          <span className="text-slate-400 shrink-0">{formatOrderDate(h.timestamp)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Post-Order Payment Submission / Screenshot Replacement */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-sky-600" />
                      <span>
                        {order.paymentProofUrl ? 'Submitted Payment Proof & Details' : 'Submit Payment Information'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {canEditPayment
                        ? 'Upload your UPI / Bank Transfer payment screenshot (JPG, JPEG, PNG, WEBP) or replace before verification.'
                        : 'Payment verification is finalized. No further modifications allowed.'}
                    </p>
                  </div>
                  {paymentStatus === 'Verified' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4" /> Verified
                    </span>
                  )}
                </div>

                {order.paymentRejectionReason && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                    <strong>Admin Note / Rejection Reason:</strong> {order.paymentRejectionReason}
                  </div>
                )}

                {payFeedback && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      payFeedback.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}
                  >
                    {payFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{payFeedback.text}</span>
                  </div>
                )}

                {canEditPayment ? (
                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    {siteSettings?.qrCodeUrl && payMethod === 'upi' && (
                      <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <img
                          src={siteSettings.qrCodeUrl}
                          alt="Official UPI QR"
                          className="w-20 h-20 rounded-lg bg-white border border-slate-200 object-contain p-1 shrink-0"
                        />
                        <div className="text-[11px] text-slate-600 space-y-1">
                          <p className="font-bold text-slate-900 flex items-center gap-1">
                            <QrCode className="w-3.5 h-3.5 text-sky-500" /> Official NextPrinters Payment QR
                          </p>
                          <p>Pay <strong>{formatCurrency(order.totalPrice)}</strong> and upload your payment confirmation screenshot below.</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Payment Method *
                        </label>
                        <select
                          value={payMethod}
                          onChange={(e) => setPayMethod(e.target.value as 'upi' | 'bank_transfer')}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                        >
                          <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                          <option value="bank_transfer">Bank Transfer (IMPS / NEFT)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          UPI Transaction ID / UTR Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={txnId}
                          onChange={(e) => setTxnId(e.target.value)}
                          placeholder="e.g. 429812345678"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Customer Mobile Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={payerPhone}
                          onChange={(e) => setPayerPhone(e.target.value)}
                          placeholder="Mobile number"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Payment Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={payDate}
                          onChange={(e) => setPayDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Payment Time (Optional)
                        </label>
                        <input
                          type="time"
                          value={payTime}
                          onChange={(e) => setPayTime(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Payment Amount ($) *
                        </label>
                        <input
                          type="number"
                          required
                          min="0.01"
                          step="0.01"
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    {/* Screenshot Upload + Preview & Replace */}
                    <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Payment Screenshot (JPG, JPEG, PNG, WEBP • Max 10MB)
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {order.paymentProofUrl
                              ? 'You can replace your existing screenshot anytime before admin verification.'
                              : 'Preview your screenshot before submitting.'}
                          </p>
                        </div>
                        <label className="inline-flex cursor-pointer items-center gap-1.5 bg-white hover:bg-sky-50 border border-sky-300 text-sky-700 font-bold px-3.5 py-2 rounded-xl text-xs shadow-sm shrink-0">
                          {order.paymentProofUrl || screenshotPreview ? (
                            <RefreshCw className="w-3.5 h-3.5" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {screenshotPreview || order.paymentProofUrl
                              ? 'Replace Screenshot'
                              : 'Choose Screenshot'}
                          </span>
                          <input
                            type="file"
                            accept="image/png, image/jpeg, image/jpg, image/webp"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleScreenshotSelect(e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>

                      {(screenshotPreview || order.paymentProofUrl) && (
                        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-2.5">
                          <img
                            src={screenshotPreview || order.paymentProofUrl}
                            alt="Screenshot Preview"
                            className="w-20 h-20 object-contain rounded-lg border border-slate-200 bg-slate-50 shrink-0"
                          />
                          <div className="text-[11px] text-slate-600 min-w-0">
                            <p className="font-bold text-slate-900">
                              {screenshotFile ? `New Preview: ${screenshotFile.name}` : 'Currently Uploaded Screenshot'}
                            </p>
                            {screenshotFile && (
                              <p className="text-slate-500">
                                {(screenshotFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to submit
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={submittingPay}
                      className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-500/20"
                    >
                      <Upload className="w-4 h-4" />
                      <span>
                        {submittingPay
                          ? 'Submitting Payment Details...'
                          : order.paymentProofUrl
                          ? 'Update / Resubmit Payment Verification'
                          : 'Submit Payment Details'}
                      </span>
                    </button>
                  </form>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Method</span>
                      <strong className="text-slate-900">{getPaymentMethodLabel(order.paymentMethod)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">UTR / Txn ID</span>
                      <strong className="font-mono text-slate-900">{order.paymentTxnId || '—'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Payment Date</span>
                      <strong className="text-slate-900">{order.paymentDate || formatOrderDate(order.createdAt)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Amount</span>
                      <strong className="text-sky-700">{formatCurrency(order.paymentAmount ?? order.totalPrice)}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
