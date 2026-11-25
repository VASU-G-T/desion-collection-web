import React, { useEffect, useMemo, useState } from 'react';
import { AdminUser, CourierCompany, CourierInfo, DeliveryStatus, TShirtOrder } from '../types';
import {
  getEffectiveDeliveryStatus,
  subscribeToOrders,
  updateOrderCourierAndDelivery,
} from '../services/firebaseGalleryService';
import {
  COURIER_COMPANIES,
  DELIVERY_STATUS_OPTIONS,
  DELIVERY_STATUS_STYLES,
  formatCurrency,
  formatOrderDateTime,
  getOrderCourierDisplayName,
} from '../utils/orderHelpers';
import {
  Truck,
  Search,
  Clock,
  Save,
  History,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Package,
  X,
} from 'lucide-react';

interface AdminCourierTabProps {
  adminUser: AdminUser | null;
  focusedOrderId?: string | null;
  onClearFocus?: () => void;
}

const COURIER_TYPE_OPTIONS = ['Standard', 'Express', 'Speed Post', 'Air', 'Surface', 'Priority'];

export const AdminCourierTab: React.FC<AdminCourierTabProps> = ({
  adminUser,
  focusedOrderId,
  onClearFocus,
}) => {
  const [orders, setOrders] = useState<TShirtOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Courier Form State
  const [courierType, setCourierType] = useState<string>('Standard');
  const [courierCompany, setCourierCompany] = useState<CourierCompany>('DTDC');
  const [customCourierName, setCustomCourierName] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [shippingCharge, setShippingCharge] = useState<string>('0');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>('Order Confirmed');
  const [remarks, setRemarks] = useState('');

  const [saving, setSaving] = useState(false);
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
      setSelectedOrderId(focusedOrderId);
    } else if (!selectedOrderId && orders.length > 0) {
      setSelectedOrderId(orders[0].id);
    }
  }, [focusedOrderId, orders]);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  // Populate editor whenever selectedOrder changes
  useEffect(() => {
    if (!selectedOrder) return;
    const c: CourierInfo = selectedOrder.courier || {};
    const comp = c.courierCompany as CourierCompany | undefined;
    const knownCompany = COURIER_COMPANIES.includes(comp as CourierCompany)
      ? (comp as CourierCompany)
      : 'Other';

    setCourierType(c.courierType || 'Standard');
    setCourierCompany(comp ? knownCompany : 'India Post');
    setCustomCourierName(
      c.customCourierName || (comp && !COURIER_COMPANIES.includes(comp as CourierCompany) ? comp : '')
    );
    setTrackingId(c.trackingId || '');
    setTrackingUrl(c.trackingUrl || '');
    setDispatchDate(c.dispatchDate || '');
    setExpectedDeliveryDate(c.expectedDeliveryDate || '');
    setShippingCharge(c.shippingCharge !== undefined ? String(c.shippingCharge) : '0');
    setDeliveryNotes(c.deliveryNotes || '');
    setDeliveryStatus(getEffectiveDeliveryStatus(selectedOrder));
    setRemarks('');
    setFeedback(null);
  }, [selectedOrder?.id]);

  const filteredOrders = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return orders.filter((o) => {
      const ds = getEffectiveDeliveryStatus(o);
      if (statusFilter !== 'All' && ds !== statusFilter) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.customer.fullName.toLowerCase().includes(q) ||
        o.customer.phone.toLowerCase().includes(q) ||
        (o.courier?.trackingId || '').toLowerCase().includes(q)
      );
    });
  }, [orders, searchTerm, statusFilter]);

  const handleSaveCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!adminUser) {
      setFeedback({ type: 'error', text: 'Admin login required to update courier & delivery details.' });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      await updateOrderCourierAndDelivery(
        selectedOrder,
        {
          courierType,
          courierCompany,
          customCourierName: courierCompany === 'Other' ? customCourierName : undefined,
          trackingId,
          trackingUrl: trackingUrl.trim() || undefined,
          dispatchDate: dispatchDate || undefined,
          expectedDeliveryDate: expectedDeliveryDate || undefined,
          shippingCharge: shippingCharge ? Number(shippingCharge) : 0,
          deliveryNotes,
        },
        deliveryStatus,
        remarks || `Delivery status updated to ${deliveryStatus}`,
        adminUser
      );
      setRemarks('');
      setFeedback({
        type: 'success',
        text: `Courier & delivery details saved for Order #${selectedOrder.id}.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update courier info.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <Clock className="w-4 h-4 animate-spin text-sky-500" />
        <span>Loading courier & delivery dispatch queue...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Truck className="w-4 h-4 text-sky-600" />
            <span>Courier & Delivery Management System</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Assign couriers, track AWB numbers, manage dispatch dates, and update verified delivery milestones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Order ID, Customer, AWB..."
              className="bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-sky-500 w-56"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="All">All Delivery Statuses</option>
            {DELIVERY_STATUS_OPTIONS.map((ds) => (
              <option key={ds} value={ds}>
                {ds}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Orders Queue */}
        <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2 max-h-[680px] overflow-y-auto">
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-[11px] font-bold uppercase text-slate-500">
              Select Order ({filteredOrders.length})
            </span>
            {focusedOrderId && onClearFocus && (
              <button
                type="button"
                onClick={onClearFocus}
                className="text-[10px] font-bold text-sky-600 hover:underline"
              >
                Show All
              </button>
            )}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">No orders match filter.</div>
          ) : (
            filteredOrders.map((order) => {
              const ds = getEffectiveDeliveryStatus(order);
              const isSelected = selectedOrder?.id === order.id;
              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all space-y-1.5 ${
                    isSelected
                      ? 'bg-white border-sky-500 ring-2 ring-sky-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-sky-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold font-mono text-sky-700">#{order.id}</span>
                    <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${DELIVERY_STATUS_STYLES[ds]}`}>
                      {ds}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {order.customer.fullName} • {order.garmentName}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{getOrderCourierDisplayName(order)}</span>
                    <span className="font-mono">{order.courier?.trackingId || 'No AWB'}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right: Courier Assignment & History Editor */}
        <div className="lg:col-span-7">
          {!selectedOrder ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-500">
              <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              Select an order from the left to assign courier & manage delivery.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
              {/* Order Banner */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Dispatch & Courier — <span className="font-mono text-sky-600">#{selectedOrder.id}</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>
                      {selectedOrder.customer.fullName} ({selectedOrder.customer.phone}) —{' '}
                      {selectedOrder.customer.city}, {selectedOrder.customer.state} {selectedOrder.customer.zipCode}
                    </span>
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold ${
                    DELIVERY_STATUS_STYLES[getEffectiveDeliveryStatus(selectedOrder)]
                  }`}
                >
                  {getEffectiveDeliveryStatus(selectedOrder)}
                </span>
              </div>

              {feedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  <span className="flex items-center gap-2 font-medium">
                    {feedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                    )}
                    {feedback.text}
                  </span>
                  <button type="button" onClick={() => setFeedback(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSaveCourier} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      1. Courier Type
                    </label>
                    <select
                      value={courierType}
                      onChange={(e) => setCourierType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    >
                      {COURIER_TYPE_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      2. Courier Company *
                    </label>
                    <select
                      value={courierCompany}
                      onChange={(e) => setCourierCompany(e.target.value as CourierCompany)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    >
                      {COURIER_COMPANIES.map((comp) => (
                        <option key={comp} value={comp}>
                          {comp}
                        </option>
                      ))}
                    </select>
                  </div>

                  {courierCompany === 'Other' && (
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Custom Courier Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={customCourierName}
                        onChange={(e) => setCustomCourierName(e.target.value)}
                        placeholder="Enter courier service name"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      3. Tracking ID / AWB Number
                    </label>
                    <input
                      type="text"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                      placeholder="e.g. D123456789 / EE123456789IN"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Order Delivery Status *
                    </label>
                    <select
                      value={deliveryStatus}
                      onChange={(e) => setDeliveryStatus(e.target.value as DeliveryStatus)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500"
                    >
                      {DELIVERY_STATUS_OPTIONS.map((ds) => (
                        <option key={ds} value={ds}>
                          {ds}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      4. Dispatch Date
                    </label>
                    <input
                      type="date"
                      value={dispatchDate}
                      onChange={(e) => setDispatchDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      5. Expected Delivery Date
                    </label>
                    <input
                      type="date"
                      value={expectedDeliveryDate}
                      onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      6. Shipping Charge ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={shippingCharge}
                      onChange={(e) => setShippingCharge(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Official Tracking URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    7. Delivery Notes (Visible in Order Record)
                  </label>
                  <textarea
                    rows={2}
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Packaging instructions, fragile handling, landmark notes..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Shipping Update Remarks (Logged to History)
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Handed over to DTDC hub / Out for local delivery"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>

                {deliveryStatus === 'Delivered' && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">
                    <strong>Delivery Guard:</strong> Marking as Delivered requires a valid Courier Company and Tracking ID / AWB Number.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-sky-500/20"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving Courier Update...' : 'Save Courier & Delivery Update'}</span>
                </button>
              </form>

              {/* Shipping History */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <h5 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-amber-500" />
                  <span>Shipping History ({selectedOrder.deliveryHistory?.length || 0})</span>
                </h5>
                {selectedOrder.deliveryHistory && selectedOrder.deliveryHistory.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedOrder.deliveryHistory
                      .slice()
                      .reverse()
                      .map((entry) => (
                        <div
                          key={entry.id}
                          className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{entry.status}</span>
                            {entry.courierCompany && (
                              <span className="text-sky-700 font-semibold ml-2">
                                {entry.courierCompany}
                                {entry.trackingId ? ` (${entry.trackingId})` : ''}
                              </span>
                            )}
                            {entry.remarks && <p className="text-slate-600 mt-0.5">{entry.remarks}</p>}
                            <p className="text-[10px] text-slate-400">Updated by: {entry.updatedBy}</p>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {formatOrderDateTime(entry.timestamp)}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    No shipping updates recorded yet for this order.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
