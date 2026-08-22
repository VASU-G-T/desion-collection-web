import React, { useEffect, useState } from 'react';
import { TShirtOrder } from '../types';
import { subscribeToOrders, updateOrderStatus } from '../services/firebaseGalleryService';
import { Package, Truck, CheckCircle2, Clock, MapPin, Phone, User, QrCode, CreditCard, ExternalLink } from 'lucide-react';

export const AdminOrdersTab: React.FC = () => {
  const [orders, setOrders] = useState<TShirtOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

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

  const handleStatusChange = async (orderId: string, newStatus: TShirtOrder['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (e) {
      alert('Failed to update order status');
    }
  };

  const filteredOrders = orders.filter((o) => statusFilter === 'All' || o.status === statusFilter);

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <Clock className="w-4 h-4 animate-spin text-sky-500" />
        <span>Loading customer orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-sky-500" /> Customer T-Shirt Orders ({orders.length})
          </h3>
          <p className="text-[11px] text-slate-500">Manage custom print requests, shipping addresses & payment proofs</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="All">All Statuses ({orders.length})</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>
      </div>

      {/* Orders Table / List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-slate-50/50 border border-slate-200 rounded-2xl space-y-2">
          <Package className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs font-bold text-slate-700">No Customer Orders Found</p>
          <p className="text-[11px] text-slate-400">Orders placed by customers will appear here in real-time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow">
              
              {/* Top Row: Order ID, Date & Status Dropdown */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="bg-sky-100 text-sky-800 text-[11px] font-bold font-mono px-2.5 py-1 rounded-lg">
                    #{order.id}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-extrabold text-slate-900">${order.totalPrice}</span>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as TShirtOrder['status'])}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none cursor-pointer ${
                      order.status === 'Delivered'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : order.status === 'Shipped'
                        ? 'bg-sky-50 text-sky-700 border-sky-300'
                        : order.status === 'Confirmed'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                        : 'bg-amber-50 text-amber-700 border-amber-300'
                    }`}
                  >
                    <option value="Pending">Pending Review</option>
                    <option value="Confirmed">Payment Confirmed</option>
                    <option value="Shipped">Order Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Order Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                
                {/* 1. Item & Quantity */}
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Garment Details</p>
                  <p className="font-bold text-slate-900">{order.garmentName}</p>
                  <p className="text-slate-600">Size: <strong className="text-slate-900">{order.size}</strong> • Qty: <strong className="text-slate-900">{order.quantity}</strong></p>
                  <p className="text-[11px] text-slate-500">Placed Designs: {order.placedDesignsCount || 1}</p>
                </div>

                {/* 2. Customer Shipping Info */}
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-sky-500" /> Customer & Shipping
                  </p>
                  <p className="font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="w-3 h-3 text-slate-400" /> {order.customer.fullName}
                  </p>
                  <p className="text-slate-600 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" /> {order.customer.phone}
                  </p>
                  <p className="text-slate-500 text-[11px] leading-snug">
                    {order.customer.streetAddress}, {order.customer.city}, {order.customer.state} {order.customer.zipCode}, {order.customer.country}
                  </p>
                </div>

                {/* 3. Payment Method & Proof */}
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Payment Method</p>
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    {order.paymentMethod === 'qr_code' ? (
                      <>
                        <QrCode className="w-4 h-4 text-sky-500" />
                        <span>UPI / QR Code Scan</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 text-sky-500" />
                        <span>Card (ending in {order.cardLast4 || '****'})</span>
                      </>
                    )}
                  </div>

                  {order.paymentTxnId && (
                    <p className="text-[11px] text-slate-600 font-mono">Ref ID: {order.paymentTxnId}</p>
                  )}

                  {order.paymentProofUrl && (
                    <button
                      onClick={() => setSelectedProofUrl(order.paymentProofUrl || null)}
                      className="mt-1 text-[11px] text-sky-600 hover:underline font-bold flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> View Uploaded Payment Proof
                    </button>
                  )}
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

      {/* Proof Lightbox Modal */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white p-4 rounded-3xl max-w-lg w-full relative space-y-4 text-center">
            <button
              onClick={() => setSelectedProofUrl(null)}
              className="absolute top-3 right-3 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-sm font-bold text-slate-900">Uploaded Payment Proof Screenshot</h4>
            <div className="max-h-[70vh] overflow-y-auto rounded-2xl border border-slate-200">
              <img src={selectedProofUrl} alt="Payment Proof" className="w-full h-auto object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
