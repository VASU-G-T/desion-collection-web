import React, { useState } from 'react';
import { TShirtOrder, OrderStatus } from '../types';
import {
  getEffectiveDeliveryStatus,
  getEffectivePaymentStatus,
  getCourierTrackingUrl,
} from '../services/firebaseGalleryService';
import {
  ORDER_STATUS_OPTIONS,
  ORDER_STATUS_STYLES,
  PAYMENT_STATUS_STYLES,
  DELIVERY_STATUS_STYLES,
  formatCurrency,
  formatOrderDateTime,
  getOrderCourierDisplayName,
  getPaymentMethodLabel,
} from '../utils/orderHelpers';
import {
  X,
  Package,
  User,
  Shirt,
  CreditCard,
  Truck,
  ShieldCheck,
  ExternalLink,
  StickyNote,
  History,
} from 'lucide-react';

interface OrderDetailModalProps {
  order: TShirtOrder | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onSaveNotes: (orderId: string, notes: string) => Promise<void>;
  onOpenPaymentVerify: (order: TShirtOrder) => void;
  onOpenCourierEdit: (order: TShirtOrder) => void;
  onViewScreenshot: (url: string, orderId: string) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  onClose,
  onUpdateStatus,
  onSaveNotes,
  onOpenPaymentVerify,
  onOpenCourierEdit,
  onViewScreenshot,
}) => {
  const [notes, setNotes] = useState(order?.adminNotes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  React.useEffect(() => {
    setNotes(order?.adminNotes || '');
  }, [order?.id, order?.adminNotes]);

  if (!order) return null;

  const paymentStatus = getEffectivePaymentStatus(order);
  const deliveryStatus = getEffectiveDeliveryStatus(order);
  const trackingUrl = getCourierTrackingUrl(order.courier);
  const individualPrice =
    order.unitPrice ?? (order.quantity > 0 ? order.totalPrice / order.quantity : order.totalPrice);

  return (
    <div
      className="fixed inset-0 z-[65] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-sky-50 text-sky-600 border border-sky-200 rounded-xl shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-slate-900 truncate">
                Complete Order #{order.id}
              </h3>
              <p className="text-xs text-slate-500">
                Placed on {formatOrderDateTime(order.createdAt)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Status Summary Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Order Status
              </span>
              <select
                value={order.status}
                disabled={updatingStatus}
                onChange={async (e) => {
                  setUpdatingStatus(true);
                  try {
                    await onUpdateStatus(order.id, e.target.value as OrderStatus);
                  } finally {
                    setUpdatingStatus(false);
                  }
                }}
                className={`w-full px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer focus:outline-none ${ORDER_STATUS_STYLES[order.status]}`}
              >
                {ORDER_STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st} className="bg-white text-slate-900">
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Payment Verification
              </span>
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold truncate ${PAYMENT_STATUS_STYLES[paymentStatus]}`}
                >
                  {paymentStatus}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPaymentVerify(order);
                  }}
                  className="text-sky-600 hover:underline font-bold shrink-0"
                >
                  Verify
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                Delivery Status
              </span>
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold truncate ${DELIVERY_STATUS_STYLES[deliveryStatus]}`}
                >
                  {deliveryStatus}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCourierEdit(order);
                  }}
                  className="text-sky-600 hover:underline font-bold shrink-0"
                >
                  Courier
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Details */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-sm">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-sky-700 flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-500" /> Customer Details
              </h4>
              <div className="space-y-1 text-slate-700">
                <p><strong>Full Name:</strong> {order.customer.fullName}</p>
                <p><strong>Mobile:</strong> {order.customer.phone}</p>
                <p><strong>Email:</strong> {order.customer.email || 'Not provided'}</p>
                <p><strong>Address:</strong> {order.customer.streetAddress}</p>
                <p>
                  <strong>City / District:</strong> {order.customer.city}
                  {order.customer.district ? `, ${order.customer.district}` : ''}
                </p>
                <p>
                  <strong>State / Pincode:</strong> {order.customer.state || '—'} — {order.customer.zipCode}, {order.customer.country}
                </p>
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-sm">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-sky-700 flex items-center gap-1.5">
                <Shirt className="w-4 h-4 text-amber-500" /> Order Details
              </h4>
              <div className="flex gap-3">
                <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                  {order.mockupImageUrl ? (
                    <img src={order.mockupImageUrl} alt={order.garmentName} className="w-full h-full object-contain p-1" />
                  ) : (
                    <Shirt className="w-7 h-7 text-sky-400" />
                  )}
                </div>
                <div className="space-y-1 text-slate-700 flex-1 min-w-0">
                  <p className="font-bold text-slate-900">{order.garmentName}</p>
                  <p><strong>Size:</strong> {order.size} • <strong>Color:</strong> {order.color || 'Custom Selected'}</p>
                  <p><strong>Quantity:</strong> {order.quantity} • <strong>Unit Price:</strong> {formatCurrency(individualPrice)}</p>
                  <p><strong>Total Amount:</strong> <span className="text-sky-700 font-extrabold text-sm">{formatCurrency(order.totalPrice)}</span></p>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-sm">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-sky-700 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-500" /> Payment Details
              </h4>
              <div className="space-y-1 text-slate-700">
                <p><strong>Method:</strong> {getPaymentMethodLabel(order.paymentMethod)}</p>
                <p><strong>Transaction / UTR ID:</strong> <span className="font-mono">{order.paymentTxnId || (order.cardLast4 ? `Card **** ${order.cardLast4}` : 'Not submitted')}</span></p>
                <p><strong>Payment Date:</strong> {order.paymentDate || '—'} {order.paymentTime ? `at ${order.paymentTime}` : ''}</p>
                <p><strong>Amount Reported:</strong> {formatCurrency(order.paymentAmount ?? order.totalPrice)}</p>
                {order.verifiedBy && (
                  <p className="text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
                    Verified by <strong>{order.verifiedBy}</strong> on {formatOrderDateTime(order.verifiedAt)}
                  </p>
                )}
                {order.paymentRejectionReason && (
                  <p className="text-red-600"><strong>Reason:</strong> {order.paymentRejectionReason}</p>
                )}
                {order.paymentProofUrl && (
                  <button
                    type="button"
                    onClick={() => onViewScreenshot(order.paymentProofUrl!, order.id)}
                    className="mt-1 inline-flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-bold px-3 py-1.5 rounded-lg"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View Uploaded Payment Screenshot
                  </button>
                )}
              </div>
            </div>

            {/* Courier & Delivery Details */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-sm">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-sky-700 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-500" /> Courier & Delivery Details
              </h4>
              <div className="space-y-1 text-slate-700">
                <p><strong>Courier Company:</strong> {getOrderCourierDisplayName(order)}</p>
                <p><strong>Courier Type:</strong> {order.courier?.courierType || '—'}</p>
                <p><strong>Tracking ID / AWB:</strong> <span className="font-mono">{order.courier?.trackingId || 'Not assigned'}</span></p>
                <p><strong>Dispatch Date:</strong> {order.courier?.dispatchDate || '—'}</p>
                <p><strong>Expected Delivery:</strong> {order.courier?.expectedDeliveryDate || '—'}</p>
                {order.courier?.shippingCharge !== undefined && (
                  <p><strong>Shipping Charge:</strong> {formatCurrency(order.courier.shippingCharge)}</p>
                )}
                {order.courier?.deliveryNotes && (
                  <p><strong>Notes:</strong> {order.courier.deliveryNotes}</p>
                )}
                {trackingUrl && (
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sky-600 font-bold hover:underline pt-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open Courier Tracking URL
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <StickyNote className="w-4 h-4 text-amber-600" /> Admin Notes
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add internal notes about printing, sizing, or delivery..."
                className="flex-1 bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                disabled={savingNotes}
                onClick={async () => {
                  setSavingNotes(true);
                  try {
                    await onSaveNotes(order.id, notes.trim());
                  } finally {
                    setSavingNotes(false);
                  }
                }}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl text-xs transition-colors shrink-0 self-end sm:self-stretch"
              >
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>

          {/* Histories */}
          {((order.verificationHistory && order.verificationHistory.length > 0) ||
            (order.deliveryHistory && order.deliveryHistory.length > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {order.verificationHistory && order.verificationHistory.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <p className="text-[11px] font-bold uppercase text-slate-600 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-sky-500" /> Payment Verification History
                  </p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {order.verificationHistory.slice().reverse().map((h) => (
                      <div key={h.id} className="bg-white border border-slate-200 rounded-lg p-2 text-[11px]">
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-900">{h.status}</span>
                          <span className="text-slate-400 font-normal">{formatOrderDateTime(h.timestamp)}</span>
                        </div>
                        <p className="text-slate-500">By: {h.adminName || h.adminId}</p>
                        {h.reason && <p className="text-slate-600 mt-0.5">{h.reason}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {order.deliveryHistory && order.deliveryHistory.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <p className="text-[11px] font-bold uppercase text-slate-600 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-amber-500" /> Shipping & Delivery History
                  </p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {order.deliveryHistory.slice().reverse().map((d) => (
                      <div key={d.id} className="bg-white border border-slate-200 rounded-lg p-2 text-[11px]">
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-900">{d.status}</span>
                          <span className="text-slate-400 font-normal">{formatOrderDateTime(d.timestamp)}</span>
                        </div>
                        <p className="text-slate-500">
                          {d.courierCompany ? `${d.courierCompany}` : 'Courier'}
                          {d.trackingId ? ` • AWB: ${d.trackingId}` : ''} • By: {d.updatedBy}
                        </p>
                        {d.remarks && <p className="text-slate-600 mt-0.5">{d.remarks}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* System Audit Logs */}
          {order.auditLogs && order.auditLogs.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <p className="text-[11px] font-bold uppercase text-slate-600 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-500" /> Audit Log ({order.auditLogs.length})
              </p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {order.auditLogs.slice().reverse().map((log) => (
                  <div
                    key={log.id}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]"
                  >
                    <div>
                      <span className="font-mono font-bold text-sky-700 mr-2">{log.action}</span>
                      <span className="text-slate-700">{log.details}</span>
                      <span className="text-slate-400 ml-2">({log.actorName || log.actorId})</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {formatOrderDateTime(log.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
