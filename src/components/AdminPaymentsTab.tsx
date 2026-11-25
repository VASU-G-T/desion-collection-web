import React, { useEffect, useMemo, useState } from 'react';
import { AdminUser, OrderPaymentStatus, TShirtOrder } from '../types';
import {
  getEffectivePaymentStatus,
  subscribeToOrders,
  verifyOrderPayment,
} from '../services/firebaseGalleryService';
import {
  PAYMENT_STATUS_OPTIONS,
  PAYMENT_STATUS_STYLES,
  downloadScreenshotImage,
  formatCurrency,
  formatOrderDate,
  formatOrderDateTime,
  getPaymentMethodLabel,
} from '../utils/orderHelpers';
import { ScreenshotViewerModal } from './ScreenshotViewerModal';
import {
  ShieldCheck,
  Search,
  Eye,
  ZoomIn,
  Download,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  AlertTriangle,
  History,
  CreditCard,
  X,
} from 'lucide-react';

interface AdminPaymentsTabProps {
  adminUser: AdminUser | null;
  focusedOrderId?: string | null;
  onClearFocus?: () => void;
}

export const AdminPaymentsTab: React.FC<AdminPaymentsTabProps> = ({
  adminUser,
  focusedOrderId,
  onClearFocus,
}) => {
  const [orders, setOrders] = useState<TShirtOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [viewerImage, setViewerImage] = useState<{ url: string; orderId: string } | null>(null);
  const [reasonModal, setReasonModal] = useState<{
    order: TShirtOrder;
    targetStatus: 'Rejected' | 'Awaiting Payment';
  } | null>(null);
  const [reasonText, setReasonText] = useState('');
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const unsub = subscribeToOrders(
      (data) => {
        setOrders(data);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (focusedOrderId) {
      setSearchTerm(focusedOrderId);
      setStatusFilter('All');
    }
  }, [focusedOrderId]);

  // Detect duplicate Transaction IDs across active orders so admin can spot conflicts before approval
  const duplicateTxnCounts = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((o) => {
      const txn = o.paymentTxnId?.trim().toUpperCase();
      if (txn && o.status !== 'Cancelled' && getEffectivePaymentStatus(o) !== 'Rejected') {
        map.set(txn, (map.get(txn) || 0) + 1);
      }
    });
    return map;
  }, [orders]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { All: orders.length };
    PAYMENT_STATUS_OPTIONS.forEach((s) => {
      counts[s] = 0;
    });
    orders.forEach((o) => {
      const ps = getEffectivePaymentStatus(o);
      counts[ps] = (counts[ps] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return orders.filter((order) => {
      const ps = getEffectivePaymentStatus(order);
      if (statusFilter !== 'All' && ps !== statusFilter) return false;
      if (!q) return true;
      return (
        order.id.toLowerCase().includes(q) ||
        order.customer.fullName.toLowerCase().includes(q) ||
        order.customer.phone.toLowerCase().includes(q) ||
        (order.paymentTxnId || '').toLowerCase().includes(q)
      );
    });
  }, [orders, searchTerm, statusFilter]);

  const runVerification = async (
    order: TShirtOrder,
    nextStatus: OrderPaymentStatus,
    reason?: string
  ) => {
    if (!adminUser) {
      setFeedback({ type: 'error', text: 'Admin login required to verify payments.' });
      return;
    }
    try {
      setBusyOrderId(order.id);
      setFeedback(null);
      await verifyOrderPayment(order, nextStatus, adminUser, reason);
      setFeedback({
        type: 'success',
        text: `Order #${order.id} payment updated to "${nextStatus}". Customer notification sent.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Verification update failed.' });
    } finally {
      setBusyOrderId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <Clock className="w-4 h-4 animate-spin text-sky-500" />
        <span>Loading payment verification records...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>Payment Management & Verification Dashboard</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Inspect screenshots, verify transaction IDs/UTRs, and maintain full audit logs. Payments are never auto-verified.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (!e.target.value && onClearFocus) onClearFocus();
              }}
              placeholder="Order ID, Name, Mobile, or UTR..."
              className="bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 w-60"
            />
          </div>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                if (onClearFocus) onClearFocus();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <span className="font-medium">{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="p-0.5 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Status Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(['All', ...PAYMENT_STATUS_OPTIONS] as const).map((status) => {
          const active = statusFilter === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border whitespace-nowrap transition-all flex items-center gap-1.5 ${
                active
                  ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300'
              }`}
            >
              <span>{status}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {statusCounts[status] || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Payment List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center space-y-2">
          <CreditCard className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs font-bold text-slate-700">No Matching Payment Records</p>
          <p className="text-[11px] text-slate-500">Adjust your search or status filter to view orders.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const pStatus = getEffectivePaymentStatus(order);
            const txnKey = order.paymentTxnId?.trim().toUpperCase();
            const isDupTxn = Boolean(txnKey && (duplicateTxnCounts.get(txnKey) || 0) > 1);
            const isBusy = busyOrderId === order.id;
            const historyOpen = expandedHistoryId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow space-y-3"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  {/* Order & Customer */}
                  <div className="lg:col-span-3 space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-bold font-mono px-2 py-0.5 rounded-lg">
                        #{order.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${PAYMENT_STATUS_STYLES[pStatus]}`}>
                        {pStatus}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 truncate">{order.customer.fullName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Mobile: {order.paymentPayerPhone || order.customer.phone}
                    </p>
                  </div>

                  {/* Transaction & Amount */}
                  <div className="lg:col-span-3 space-y-1 text-xs min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">Amount:</span>
                      <strong className="text-sky-700 font-extrabold text-sm">
                        {formatCurrency(order.paymentAmount ?? order.totalPrice)}
                      </strong>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Method: <strong className="text-slate-800">{getPaymentMethodLabel(order.paymentMethod)}</strong>
                    </p>
                    <p className="text-[11px] text-slate-600 font-mono truncate">
                      UTR/Txn: {order.paymentTxnId || (order.cardLast4 ? `Card **** ${order.cardLast4}` : 'Not submitted')}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Pay Date: {order.paymentDate || formatOrderDate(order.createdAt)}
                      {order.paymentTime ? ` ${order.paymentTime}` : ''}
                    </p>
                    {isDupTxn && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 border border-red-200 text-[10px] font-bold text-red-700">
                        <AlertTriangle className="w-3 h-3" /> Duplicate UTR Detected
                      </div>
                    )}
                  </div>

                  {/* Screenshot Thumbnail & Zoom/Download */}
                  <div className="lg:col-span-3 flex items-center gap-3">
                    {order.paymentProofUrl ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setViewerImage({ url: order.paymentProofUrl!, orderId: order.id })}
                          className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shrink-0 hover:border-sky-400 transition-colors group relative"
                          title="Click to View & Zoom Screenshot"
                        >
                          <img
                            src={order.paymentProofUrl}
                            alt="Payment Screenshot"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <ZoomIn className="w-4 h-4 text-white" />
                          </div>
                        </button>
                        <div className="flex flex-col gap-1 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setViewerImage({ url: order.paymentProofUrl!, orderId: order.id })}
                            className="text-sky-600 hover:underline font-bold flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> View / Zoom
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadScreenshotImage(order.paymentProofUrl!, order.id)}
                            className="text-slate-600 hover:text-sky-600 font-semibold flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" /> Download
                          </button>
                        </div>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic bg-slate-50 border border-dashed border-slate-200 rounded-xl px-3 py-2">
                        No screenshot uploaded
                      </span>
                    )}
                  </div>

                  {/* Admin Actions */}
                  <div className="lg:col-span-3 flex flex-wrap lg:justify-end gap-1.5">
                    <button
                      type="button"
                      disabled={isBusy || pStatus === 'Verified'}
                      onClick={() => {
                        if (isDupTxn && !window.confirm('Warning: This Transaction ID appears on another order. Approve anyway?')) {
                          return;
                        }
                        runVerification(order, 'Verified', 'Transaction details verified by admin');
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white text-[11px] font-bold flex items-center gap-1 transition-colors shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        setReasonText(order.paymentRejectionReason || '');
                        setReasonModal({ order, targetStatus: 'Rejected' });
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-red-50 border border-red-300 text-red-600 text-[11px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        setReasonText('');
                        setReasonModal({ order, targetStatus: 'Awaiting Payment' });
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-50 border border-amber-300 text-amber-700 text-[11px] font-bold flex items-center gap-1 transition-colors"
                      title="Request New Screenshot"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Re-upload</span>
                    </button>

                    <select
                      value={pStatus}
                      disabled={isBusy}
                      onChange={(e) => {
                        const next = e.target.value as OrderPaymentStatus;
                        if (next === 'Rejected' || next === 'Awaiting Payment') {
                          setReasonText('');
                          setReasonModal({ order, targetStatus: next });
                        } else {
                          runVerification(order, next, `Status set to ${next}`);
                        }
                      }}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer"
                    >
                      {PAYMENT_STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Rejection reason / Verified meta / History toggle */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex flex-wrap items-center gap-3">
                    {order.verifiedBy && (
                      <span className="text-emerald-700 font-medium">
                        Verified by <strong>{order.verifiedBy}</strong> ({formatOrderDateTime(order.verifiedAt)})
                      </span>
                    )}
                    {order.paymentRejectionReason && (
                      <span className="text-red-600 font-medium">
                        Rejection / Request Reason: <strong>{order.paymentRejectionReason}</strong>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpandedHistoryId(historyOpen ? null : order.id)}
                    className="text-sky-600 hover:underline font-bold flex items-center gap-1 ml-auto"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>
                      {historyOpen ? 'Hide' : 'Verification'} History ({order.verificationHistory?.length || 0})
                    </span>
                  </button>
                </div>

                {historyOpen && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                    {order.verificationHistory && order.verificationHistory.length > 0 ? (
                      order.verificationHistory
                        .slice()
                        .reverse()
                        .map((entry) => (
                          <div
                            key={entry.id}
                            className="bg-white border border-slate-200 rounded-lg p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]"
                          >
                            <div>
                              <span className="font-bold text-slate-900">{entry.status}</span>
                              <span className="text-slate-500 ml-2">
                                By: {entry.adminName || entry.adminId} ({entry.adminId})
                              </span>
                              {entry.reason && <p className="text-slate-600 mt-0.5">{entry.reason}</p>}
                            </div>
                            <span className="text-slate-400 font-mono text-[10px]">
                              {formatOrderDateTime(entry.timestamp)}
                            </span>
                          </div>
                        ))
                    ) : (
                      <p className="text-[11px] text-slate-500 italic">No verification actions logged yet.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Screenshot Zoom & Download Lightbox */}
      <ScreenshotViewerModal
        imageUrl={viewerImage?.url || null}
        orderId={viewerImage?.orderId}
        onClose={() => setViewerImage(null)}
      />

      {/* Rejection / Request New Screenshot Reason Modal */}
      {reasonModal && (
        <div
          className="fixed inset-0 z-[70] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setReasonModal(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-slate-900">
                {reasonModal.targetStatus === 'Rejected'
                  ? 'Reject Payment & Add Reason'
                  : 'Request New Payment Screenshot'}
              </h4>
              <button
                type="button"
                onClick={() => setReasonModal(null)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Order <strong className="font-mono text-sky-700">#{reasonModal.order.id}</strong> — Customer will receive a live notification with this message.
            </p>
            <textarea
              rows={3}
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder={
                reasonModal.targetStatus === 'Rejected'
                  ? 'e.g. UTR number does not match bank statement / wrong amount...'
                  : 'e.g. Screenshot is blurry or UTR number is cropped. Please upload a clearer image.'
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReasonModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reasonText.trim()}
                onClick={async () => {
                  const { order, targetStatus } = reasonModal;
                  const txt = reasonText.trim();
                  setReasonModal(null);
                  await runVerification(order, targetStatus, txt);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold shadow-sm"
              >
                {reasonModal.targetStatus === 'Rejected' ? 'Confirm Reject' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
