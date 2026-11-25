import React, { useEffect, useMemo, useState } from 'react';
import { AdminUser, OrderStatus, TShirtOrder } from '../types';
import {
  getEffectiveDeliveryStatus,
  getEffectivePaymentStatus,
  normalizePhoneDigits,
  subscribeToOrders,
  updateOrderAdminNotes,
  updateOrderStatus,
} from '../services/firebaseGalleryService';
import {
  DateFilterPreset,
  ORDER_STATUS_OPTIONS,
  ORDER_STATUS_STYLES,
  PAYMENT_STATUS_OPTIONS,
  PAYMENT_STATUS_STYLES,
  exportOrdersToCsv,
  formatCurrency,
  formatOrderDate,
  isSameLocalDay,
  isWithinDateFilter,
} from '../utils/orderHelpers';
import { OrderFlipCard } from './OrderFlipCard';
import { OrderDetailModal } from './OrderDetailModal';
import { ScreenshotViewerModal } from './ScreenshotViewerModal';
import {
  Package,
  Clock,
  Search,
  Filter,
  ArrowUpDown,
  LayoutGrid,
  Table as TableIcon,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Truck,
  XCircle,
  Loader2,
  Shirt,
  Eye,
  AlertCircle,
  Download,
} from 'lucide-react';

interface AdminOrdersTabProps {
  adminUser?: AdminUser | null;
  onNavigateToPayment?: (orderId: string) => void;
  onNavigateToCourier?: (orderId: string) => void;
}

type SortField = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'qty_desc' | 'name_asc' | 'status';

type StatKey =
  | 'all'
  | 'new_today'
  | 'Pending'
  | 'Payment Verification'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export const AdminOrdersTab: React.FC<AdminOrdersTabProps> = ({
  adminUser = null,
  onNavigateToPayment,
  onNavigateToCourier,
}) => {
  const [orders, setOrders] = useState<TShirtOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters, Search, Sort & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('All');
  const [onlyNewToday, setOnlyNewToday] = useState(false);
  const [sortBy, setSortBy] = useState<SortField>('date_desc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Modals
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [viewerImage, setViewerImage] = useState<{ url: string; orderId: string } | null>(null);

  useEffect(() => {
    const unsub = subscribeToOrders(
      (data) => {
        setOrders(data);
        setLoading(false);
        setErrorMsg(null);
      },
      (err) => {
        setErrorMsg(err.message || 'Failed to sync orders from database.');
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // Reset pagination whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, datePreset, customStartDate, customEndDate, statusFilter, paymentStatusFilter, onlyNewToday, sortBy, pageSize]);

  // 9 Dashboard Statistics
  const stats = useMemo(() => {
    const today = new Date();
    let newToday = 0;
    let pending = 0;
    let paymentVerification = 0;
    let confirmed = 0;
    let processing = 0;
    let shipped = 0;
    let delivered = 0;
    let cancelled = 0;

    orders.forEach((o) => {
      if (isSameLocalDay(o.createdAt, today)) newToday++;
      const ps = getEffectivePaymentStatus(o);
      if (o.status === 'Pending') pending++;
      if (o.status === 'Payment Verification' || ps === 'Screenshot Uploaded' || ps === 'Under Verification') {
        paymentVerification++;
      }
      if (o.status === 'Confirmed') confirmed++;
      if (o.status === 'Processing') processing++;
      if (o.status === 'Shipped') shipped++;
      if (o.status === 'Delivered') delivered++;
      if (o.status === 'Cancelled') cancelled++;
    });

    return {
      total: orders.length,
      newToday,
      pending,
      paymentVerification,
      confirmed,
      processing,
      shipped,
      delivered,
      cancelled,
    };
  }, [orders]);

  const statCards: Array<{
    key: StatKey;
    label: string;
    value: number;
    accent: string;
    icon: React.FC<{ className?: string }>;
  }> = [
    { key: 'all', label: 'Total Orders', value: stats.total, accent: 'text-sky-600 bg-sky-50 border-sky-200', icon: Package },
    { key: 'new_today', label: 'New Orders', value: stats.newToday, accent: 'text-amber-600 bg-amber-50 border-amber-200', icon: Sparkles },
    { key: 'Pending', label: 'Pending Orders', value: stats.pending, accent: 'text-amber-700 bg-amber-50 border-amber-200', icon: Clock },
    { key: 'Payment Verification', label: 'Payment Verification', value: stats.paymentVerification, accent: 'text-orange-600 bg-orange-50 border-orange-200', icon: ShieldCheck },
    { key: 'Confirmed', label: 'Confirmed Orders', value: stats.confirmed, accent: 'text-sky-700 bg-sky-50 border-sky-200', icon: CheckCircle2 },
    { key: 'Processing', label: 'Processing Orders', value: stats.processing, accent: 'text-blue-700 bg-blue-50 border-blue-200', icon: Loader2 },
    { key: 'Shipped', label: 'Shipped Orders', value: stats.shipped, accent: 'text-sky-700 bg-sky-100 border-sky-300', icon: Truck },
    { key: 'Delivered', label: 'Delivered Orders', value: stats.delivered, accent: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
    { key: 'Cancelled', label: 'Cancelled Orders', value: stats.cancelled, accent: 'text-red-700 bg-red-50 border-red-200', icon: XCircle },
  ];

  const handleStatClick = (key: StatKey) => {
    if (key === 'all') {
      setOnlyNewToday(false);
      setStatusFilter('All');
      setPaymentStatusFilter('All');
      return;
    }
    if (key === 'new_today') {
      setOnlyNewToday((prev) => !prev);
      setStatusFilter('All');
      return;
    }
    setOnlyNewToday(false);
    setStatusFilter((prev) => (prev === key ? 'All' : key));
  };

  // Filtered & Sorted Orders
  const processedOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const qDigits = normalizePhoneDigits(searchQuery);
    const today = new Date();

    const filtered = orders.filter((order) => {
      if (onlyNewToday && !isSameLocalDay(order.createdAt, today)) return false;

      if (!isWithinDateFilter(order.createdAt, datePreset, customStartDate, customEndDate)) {
        return false;
      }

      if (statusFilter !== 'All') {
        if (statusFilter === 'Payment Verification') {
          const ps = getEffectivePaymentStatus(order);
          if (order.status !== 'Payment Verification' && ps !== 'Screenshot Uploaded' && ps !== 'Under Verification') {
            return false;
          }
        } else if (order.status !== statusFilter) {
          return false;
        }
      }

      const ps = getEffectivePaymentStatus(order);
      if (paymentStatusFilter !== 'All' && ps !== paymentStatusFilter) {
        return false;
      }

      if (q) {
        const idMatch = order.id.toLowerCase().includes(q);
        const nameMatch = order.customer.fullName.toLowerCase().includes(q);
        const phoneMatch =
          order.customer.phone.toLowerCase().includes(q) ||
          (qDigits.length >= 3 && normalizePhoneDigits(order.customer.phone).includes(qDigits));
        if (!idMatch && !nameMatch && !phoneMatch) return false;
      }

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'amount_desc':
          return (b.totalPrice || 0) - (a.totalPrice || 0);
        case 'amount_asc':
          return (a.totalPrice || 0) - (b.totalPrice || 0);
        case 'qty_desc':
          return (b.quantity || 0) - (a.quantity || 0);
        case 'name_asc':
          return (a.customer.fullName || '').localeCompare(b.customer.fullName || '');
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        case 'date_desc':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return sorted;
  }, [orders, searchQuery, datePreset, customStartDate, customEndDate, statusFilter, paymentStatusFilter, onlyNewToday, sortBy]);

  const totalPages = Math.max(1, Math.ceil(processedOrders.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedOrders = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return processedOrders.slice(start, start + pageSize);
  }, [processedOrders, safePage, pageSize]);

  const detailOrder = useMemo(
    () => orders.find((o) => o.id === detailOrderId) || null,
    [orders, detailOrderId]
  );

  const hasActiveFilters =
    Boolean(searchQuery) ||
    datePreset !== 'all' ||
    statusFilter !== 'All' ||
    paymentStatusFilter !== 'All' ||
    onlyNewToday;

  const resetAllFilters = () => {
    setSearchQuery('');
    setDatePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setStatusFilter('All');
    setPaymentStatusFilter('All');
    setOnlyNewToday(false);
    setSortBy('date_desc');
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;
    try {
      await updateOrderStatus(targetOrder, newStatus, adminUser);
    } catch (e: any) {
      alert(e.message || 'Failed to update order status.');
    }
  };

  const handleSaveNotes = async (orderId: string, notes: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;
    try {
      await updateOrderAdminNotes(targetOrder, notes, adminUser);
    } catch (e: any) {
      alert(e.message || 'Failed to save admin notes.');
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <Clock className="w-4 h-4 animate-spin text-sky-500" />
        <span>Syncing customer orders from database...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 9 Dashboard Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-2.5">
        {statCards.map((card) => {
          const Icon = card.icon;
          const isActive =
            (card.key === 'all' && !onlyNewToday && statusFilter === 'All') ||
            (card.key === 'new_today' && onlyNewToday) ||
            (card.key !== 'all' && card.key !== 'new_today' && statusFilter === card.key);

          return (
            <button
              key={card.key}
              type="button"
              onClick={() => handleStatClick(card.key)}
              className={`bg-white rounded-xl p-3 border text-left transition-all shadow-sm hover:shadow-md flex flex-col justify-between gap-2 ${
                isActive ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-slate-200 hover:border-sky-300'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className={`p-1.5 rounded-lg border ${card.accent}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="text-lg font-extrabold text-slate-900">{card.value}</span>
              </div>
              <span className="text-[11px] font-bold text-slate-600 leading-tight">{card.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search, Filters, Sorting & View Switcher Toolbar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Order ID, Customer Name, or Mobile Number..."
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Sort + View Toggle + Export CSV + Reset */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortField)}
                className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer text-xs"
              >
                <option value="date_desc">Order Date (Newest)</option>
                <option value="date_asc">Order Date (Oldest)</option>
                <option value="amount_desc">Total Amount (High - Low)</option>
                <option value="amount_asc">Total Amount (Low - High)</option>
                <option value="qty_desc">Quantity (High - Low)</option>
                <option value="name_asc">Customer Name (A - Z)</option>
                <option value="status">Order Status</option>
              </select>
            </div>

            <div className="flex items-center bg-white border border-slate-300 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                  viewMode === 'cards' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>3D Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                  viewMode === 'table' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>

            <button
              type="button"
              disabled={processedOrders.length === 0}
              onClick={() =>
                exportOrdersToCsv(
                  processedOrders,
                  getEffectivePaymentStatus,
                  getEffectiveDeliveryStatus
                )
              }
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-sky-50 disabled:opacity-40 border border-sky-300 text-sky-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Export filtered orders to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Date Presets + Status & Payment Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/80">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-amber-500" /> Filters:
          </span>

          {(
            [
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'this_week', label: 'This Week' },
              { id: 'this_month', label: 'This Month' },
              { id: 'custom', label: 'Custom Date Range' },
            ] as const
          ).map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setDatePreset(preset.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                datePreset === preset.id
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-sky-300'
              }`}
            >
              {preset.label}
            </button>
          ))}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-800 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="All">Order Status: All</option>
            {ORDER_STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                Order: {st}
              </option>
            ))}
          </select>

          <select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-800 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="All">Payment Status: All</option>
            {PAYMENT_STATUS_OPTIONS.map((ps) => (
              <option key={ps} value={ps}>
                Payment: {ps}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Date Range Inputs */}
        {datePreset === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-600">From:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-600">To:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Empty State or Orders Display */}
      {paginatedOrders.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <Package className="w-9 h-9 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-800">No Matching Orders Found</p>
          <p className="text-xs text-slate-500">
            {orders.length === 0
              ? 'Customer orders placed through the store will appear here automatically in real time.'
              : 'Try adjusting your search query or active filters.'}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        /* INTERACTIVE 3D FLIP ORDER CARD SYSTEM */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {paginatedOrders.map((order) => (
            <OrderFlipCard
              key={order.id}
              order={order}
              onViewComplete={(o) => setDetailOrderId(o.id)}
              onVerifyPayment={(o) => {
                if (onNavigateToPayment) onNavigateToPayment(o.id);
              }}
              onManageCourier={(o) => {
                if (onNavigateToCourier) onNavigateToCourier(o.id);
              }}
              onUpdateStatus={handleUpdateStatus}
              onSaveNotes={handleSaveNotes}
              onViewScreenshot={(url, id) => setViewerImage({ url, orderId: id })}
            />
          ))}
        </div>
      ) : (
        /* RECENT ORDERS TABLE VIEW */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-600">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Qty</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedOrders.map((order) => {
                const pStatus = getEffectivePaymentStatus(order);
                return (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-sky-700 whitespace-nowrap">
                      #{order.id}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{order.customer.fullName}</p>
                      <p className="text-[11px] text-slate-500">{order.customer.phone}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                          {order.mockupImageUrl ? (
                            <img src={order.mockupImageUrl} alt={order.garmentName} className="w-full h-full object-contain" />
                          ) : (
                            <Shirt className="w-4 h-4 text-sky-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate max-w-[160px]">{order.garmentName}</p>
                          <p className="text-[10px] text-slate-500">Size: {order.size}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{order.quantity}</td>
                    <td className="py-3 px-4 font-extrabold text-sky-700 whitespace-nowrap">
                      {formatCurrency(order.totalPrice)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {formatOrderDate(order.createdAt)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onNavigateToPayment?.(order.id)}
                        className={`px-2 py-1 rounded-lg border text-[10px] font-bold hover:opacity-80 ${PAYMENT_STATUS_STYLES[pStatus]}`}
                        title="Open in Payment Verification"
                      >
                        {pStatus}
                      </button>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                        className={`px-2 py-1 rounded-lg border text-[11px] font-bold cursor-pointer focus:outline-none ${ORDER_STATUS_STYLES[order.status]}`}
                      >
                        {ORDER_STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st} className="bg-white text-slate-900">
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setDetailOrderId(order.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 text-[11px] font-bold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs">
        <div className="flex items-center gap-3 text-slate-600">
          <span>
            Showing{' '}
            <strong className="text-slate-900">
              {processedOrders.length === 0 ? 0 : (safePage - 1) * pageSize + 1}
            </strong>
            –
            <strong className="text-slate-900">
              {Math.min(safePage * pageSize, processedOrders.length)}
            </strong>{' '}
            of <strong className="text-slate-900">{processedOrders.length}</strong> orders
          </span>

          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-800 cursor-pointer focus:outline-none focus:border-sky-500"
          >
            <option value={6}>6 / page</option>
            <option value={12}>12 / page</option>
            <option value={24}>24 / page</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 font-semibold flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
            .map((p, idx, arr) => (
              <React.Fragment key={p}>
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className="px-1 text-slate-400">...</span>
                )}
                <button
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs border transition-colors ${
                    p === safePage
                      ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              </React.Fragment>
            ))}

          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:opacity-40 font-semibold flex items-center gap-1"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Complete Order Detail Modal */}
      <OrderDetailModal
        order={detailOrder}
        onClose={() => setDetailOrderId(null)}
        onUpdateStatus={handleUpdateStatus}
        onSaveNotes={handleSaveNotes}
        onOpenPaymentVerify={(o) => onNavigateToPayment?.(o.id)}
        onOpenCourierEdit={(o) => onNavigateToCourier?.(o.id)}
        onViewScreenshot={(url, id) => setViewerImage({ url, orderId: id })}
      />

      {/* Payment Screenshot Zoom/Download Modal */}
      <ScreenshotViewerModal
        imageUrl={viewerImage?.url || null}
        orderId={viewerImage?.orderId}
        onClose={() => setViewerImage(null)}
      />
    </div>
  );
};
