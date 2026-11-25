import React, { useState } from 'react';
import {
  TShirtOrder,
  OrderStatus,
} from '../types';
import { getEffectivePaymentStatus } from '../services/firebaseGalleryService';
import {
  ORDER_STATUS_OPTIONS,
  ORDER_STATUS_STYLES,
  PAYMENT_STATUS_STYLES,
  formatCurrency,
  formatOrderDate,
  formatOrderDateTime,
  getCustomerInitials,
  getOrderCourierDisplayName,
  getPaymentMethodLabel,
} from '../utils/orderHelpers';
import {
  RotateCw,
  X,
  Shirt,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle2,
  Eye,
  StickyNote,
  Ban,
  ShieldCheck,
  ExternalLink,
  Package,
} from 'lucide-react';

interface OrderFlipCardProps {
  order: TShirtOrder;
  onViewComplete: (order: TShirtOrder) => void;
  onVerifyPayment: (order: TShirtOrder) => void;
  onManageCourier: (order: TShirtOrder) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onSaveNotes: (orderId: string, notes: string) => Promise<void>;
  onViewScreenshot: (url: string, orderId: string) => void;
}

export const OrderFlipCard: React.FC<OrderFlipCardProps> = ({
  order,
  onViewComplete,
  onVerifyPayment,
  onManageCourier,
  onUpdateStatus,
  onSaveNotes,
  onViewScreenshot,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(order.adminNotes || '');
  const [savingNotes, setSavingNotes] = useState(false);

  const paymentStatus = getEffectivePaymentStatus(order);
  const individualPrice =
    order.unitPrice ?? (order.quantity > 0 ? order.totalPrice / order.quantity : order.totalPrice);

  const handleStatusUpdate = async (nextStatus: OrderStatus) => {
    try {
      setUpdatingStatus(true);
      await onUpdateStatus(order.id, nextStatus);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleConfirmOrder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await handleStatusUpdate('Confirmed');
  };

  const handleCancelOrder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Cancel order #${order.id}?`)) {
      await handleStatusUpdate('Cancelled');
    }
  };

  const handleSaveNotesClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setSavingNotes(true);
      await onSaveNotes(order.id, notesDraft.trim());
      setEditingNotes(false);
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <div className="perspective-1000 w-full h-[520px] sm:h-[540px]">
      <div
        className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* CARD FRONT SIDE */}
        <div
          onClick={() => setIsFlipped(true)}
          className="absolute inset-0 backface-hidden bg-white border border-slate-200 hover:border-sky-400 rounded-2xl shadow-md hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
        >
          {/* Top Accent Bar */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
            <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-bold font-mono px-2.5 py-1 rounded-lg truncate">
              #{order.id}
            </span>
            <span className="text-[11px] text-slate-500 font-medium shrink-0">
              {formatOrderDate(order.createdAt)}
            </span>
          </div>

          {/* Customer Row */}
          <div className="px-4 pt-3 pb-2 flex items-center gap-3">
            {order.customer.profileImageUrl ? (
              <img
                src={order.customer.profileImageUrl}
                alt={order.customer.fullName}
                className="w-10 h-10 rounded-full object-cover border border-sky-200 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-sky-50 border border-sky-200 text-sky-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                {getCustomerInitials(order.customer.fullName)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 truncate">{order.customer.fullName}</p>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                <Phone className="w-3 h-3 text-amber-500 shrink-0" />
                <span>{order.customer.phone}</span>
              </p>
            </div>
          </div>

          {/* Product Preview Box */}
          <div className="mx-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
            <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
              {order.mockupImageUrl ? (
                <img
                  src={order.mockupImageUrl}
                  alt={order.garmentName}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <Shirt className="w-8 h-8 text-sky-400" />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                {order.garmentName}
              </h4>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-700">
                  Size: {order.size}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-700">
                  Qty: {order.quantity}
                </span>
              </div>
            </div>
          </div>

          {/* Amount & Status Badges */}
          <div className="px-4 py-3 space-y-3">
            <div className="flex items-center justify-between bg-sky-50/70 border border-sky-200/80 rounded-xl px-3.5 py-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
                Total Order Amount
              </span>
              <span className="text-lg font-extrabold text-sky-700">
                {formatCurrency(order.totalPrice)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Payment Status
                </span>
                <span
                  className={`inline-flex items-center justify-center w-full px-2 py-1 rounded-lg border text-[11px] font-bold truncate ${PAYMENT_STATUS_STYLES[paymentStatus]}`}
                >
                  {paymentStatus}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  Order Status
                </span>
                <span
                  className={`inline-flex items-center justify-center w-full px-2 py-1 rounded-lg border text-[11px] font-bold truncate ${ORDER_STATUS_STYLES[order.status]}`}
                >
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Flip Footer */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] font-semibold text-sky-600">
            <span className="flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-amber-500" />
              Click card to flip for details & actions
            </span>
            <span className="text-slate-400 font-mono text-[10px]">FRONT</span>
          </div>
        </div>

        {/* CARD BACK SIDE */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-white border-2 border-sky-400 rounded-2xl shadow-xl flex flex-col overflow-hidden">
          {/* Sticky Back Header */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Package className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="text-xs font-extrabold text-slate-900 truncate">
                Order #{order.id}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsFlipped(false);
              }}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5 text-amber-600" />
              <span>Flip Back</span>
            </button>
          </div>

          {/* Scrollable Details Body */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex-1 overflow-y-auto p-3.5 space-y-3 text-[11px]"
          >
            {/* CUSTOMER DETAILS */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 flex items-center gap-1">
                <User className="w-3 h-3 text-amber-500" /> Customer Details
              </p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-700">
                <p className="truncate"><strong className="text-slate-900">Name:</strong> {order.customer.fullName}</p>
                <p className="truncate"><strong className="text-slate-900">Mobile:</strong> {order.customer.phone}</p>
                <p className="col-span-2 truncate flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                  <strong className="text-slate-900">Email:</strong> {order.customer.email || 'Not provided'}
                </p>
                <p className="col-span-2 leading-snug">
                  <MapPin className="w-3 h-3 text-sky-500 inline mr-1" />
                  <strong className="text-slate-900">Address:</strong> {order.customer.streetAddress}
                </p>
                <p className="truncate"><strong className="text-slate-900">City:</strong> {order.customer.city}</p>
                <p className="truncate"><strong className="text-slate-900">District:</strong> {order.customer.district || '—'}</p>
                <p className="truncate"><strong className="text-slate-900">State:</strong> {order.customer.state || '—'}</p>
                <p className="truncate"><strong className="text-slate-900">Pincode:</strong> {order.customer.zipCode}</p>
              </div>
            </div>

            {/* ORDER DETAILS */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 flex items-center gap-1">
                <Shirt className="w-3 h-3 text-amber-500" /> Order Details
              </p>
              <div className="flex items-start gap-2.5">
                <div className="w-11 h-11 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                  {order.mockupImageUrl ? (
                    <img src={order.mockupImageUrl} alt={order.garmentName} className="w-full h-full object-contain p-0.5" />
                  ) : (
                    <Shirt className="w-5 h-5 text-sky-400" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 flex-1 min-w-0 text-slate-700">
                  <p className="col-span-2 truncate font-bold text-slate-900">{order.garmentName}</p>
                  <p><strong>ID:</strong> <span className="font-mono">{order.id}</span></p>
                  <p><strong>Size:</strong> {order.size}</p>
                  <p className="truncate"><strong>Color:</strong> {order.color || 'Selected Blank'}</p>
                  <p><strong>Qty:</strong> {order.quantity}</p>
                  <p><strong>Unit:</strong> {formatCurrency(individualPrice)}</p>
                  <p><strong>Total:</strong> <span className="text-sky-700 font-bold">{formatCurrency(order.totalPrice)}</span></p>
                  <p className="col-span-2"><strong>Date:</strong> {formatOrderDateTime(order.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* PAYMENT DETAILS */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-amber-500" /> Payment Details
                </p>
                <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${PAYMENT_STATUS_STYLES[paymentStatus]}`}>
                  {paymentStatus}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-700">
                <p className="truncate"><strong>Method:</strong> {getPaymentMethodLabel(order.paymentMethod)}</p>
                <p className="truncate"><strong>Date:</strong> {order.paymentDate || (order.paymentProofUrl ? formatOrderDate(order.createdAt) : 'Pending')}</p>
                <p className="col-span-2 truncate font-mono">
                  <strong className="font-sans">Txn ID:</strong> {order.paymentTxnId || (order.cardLast4 ? `Card **** ${order.cardLast4}` : 'Not submitted')}
                </p>
              </div>
              {order.paymentProofUrl ? (
                <button
                  type="button"
                  onClick={() => onViewScreenshot(order.paymentProofUrl!, order.id)}
                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-700 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> View Payment Screenshot
                </button>
              ) : (
                <p className="text-[10px] text-slate-400 italic">No payment screenshot uploaded yet.</p>
              )}
            </div>

            {/* DELIVERY DETAILS */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 flex items-center gap-1">
                  <Truck className="w-3 h-3 text-amber-500" /> Delivery Details
                </p>
                <button
                  type="button"
                  onClick={() => onManageCourier(order)}
                  className="text-[10px] font-bold text-sky-600 hover:underline"
                >
                  Assign / Edit Courier
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-700">
                <p className="truncate"><strong>Type:</strong> {order.courier?.courierType || '—'}</p>
                <p className="truncate"><strong>Company:</strong> {getOrderCourierDisplayName(order)}</p>
                <p className="col-span-2 truncate font-mono">
                  <strong className="font-sans">Tracking ID:</strong> {order.courier?.trackingId || 'Not assigned'}
                </p>
                <p className="truncate"><strong>Dispatched:</strong> {order.courier?.dispatchDate || '—'}</p>
                <p className="truncate"><strong>Expected:</strong> {order.courier?.expectedDeliveryDate || '—'}</p>
              </div>
            </div>

            {/* ADMIN NOTES EDITOR */}
            {editingNotes ? (
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5 space-y-2">
                <label className="text-[10px] font-bold uppercase text-amber-800 block">Admin Notes</label>
                <textarea
                  rows={2}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Enter internal admin remarks..."
                  className="w-full bg-white border border-amber-300 rounded-lg p-2 text-[11px] text-slate-900 focus:outline-none focus:border-sky-500"
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingNotes(false)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingNotes}
                    onClick={handleSaveNotesClick}
                    className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-bold disabled:opacity-50"
                  >
                    {savingNotes ? 'Saving...' : 'Save Note'}
                  </button>
                </div>
              </div>
            ) : order.adminNotes ? (
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-2 text-slate-700">
                <span className="text-[10px] font-bold uppercase text-amber-700 block">Admin Notes</span>
                <p className="text-[11px] leading-snug">{order.adminNotes}</p>
              </div>
            ) : null}
          </div>

          {/* Sticky Admin Actions Footer */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="p-2.5 bg-slate-50 border-t border-slate-200 space-y-2 shrink-0"
          >
            <div className="flex items-center gap-1.5">
              <select
                value={order.status}
                disabled={updatingStatus}
                onChange={(e) => handleStatusUpdate(e.target.value as OrderStatus)}
                className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-800 focus:outline-none focus:border-sky-500 cursor-pointer"
                title="Update Order Status"
              >
                {ORDER_STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    Status: {st}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => onViewComplete(order)}
                className="px-2.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
                title="View Complete Order"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => onVerifyPayment(order)}
                className="px-2 py-1.5 rounded-lg bg-white hover:bg-sky-50 border border-sky-300 text-sky-700 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                title="Verify Payment"
              >
                <ShieldCheck className="w-3 h-3" />
                <span className="truncate">Verify</span>
              </button>

              <button
                type="button"
                disabled={updatingStatus || order.status === 'Confirmed'}
                onClick={handleConfirmOrder}
                className="px-2 py-1.5 rounded-lg bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-700 text-[10px] font-bold flex items-center justify-center gap-1 disabled:opacity-50 transition-colors"
                title="Confirm Order"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span className="truncate">Confirm</span>
              </button>

              <button
                type="button"
                onClick={() => setEditingNotes((prev) => !prev)}
                className="px-2 py-1.5 rounded-lg bg-white hover:bg-amber-50 border border-amber-300 text-amber-700 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                title="Add Admin Notes"
              >
                <StickyNote className="w-3 h-3" />
                <span className="truncate">Notes</span>
              </button>

              <button
                type="button"
                disabled={updatingStatus || order.status === 'Cancelled'}
                onClick={handleCancelOrder}
                className="px-2 py-1.5 rounded-lg bg-white hover:bg-red-50 border border-red-300 text-red-600 text-[10px] font-bold flex items-center justify-center gap-1 disabled:opacity-50 transition-colors"
                title="Cancel Order"
              >
                <Ban className="w-3 h-3" />
                <span className="truncate">Cancel</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
