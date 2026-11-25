import React, { useState, useEffect } from 'react';
import { CustomerAddress, SiteSettings, TShirtSize, TShirtOrder } from '../types';
import { createTShirtOrder, validatePaymentScreenshot } from '../services/firebaseGalleryService';
import { saveLocalCustomerOrderRef } from './CustomerOrderPortalModal';
import { X, ShoppingBag, QrCode, CreditCard, CheckCircle2, AlertCircle, Truck, ShieldCheck } from 'lucide-react';

interface OrderTShirtModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteSettings: SiteSettings | null;
  garmentName: string;
  garmentColor?: string;
  mockupImageUrl?: string;
  placedDesignsCount: number;
  onOpenOrderPortal?: (orderId: string, phone: string) => void;
}

export const OrderTShirtModal: React.FC<OrderTShirtModalProps> = ({
  isOpen,
  onClose,
  siteSettings,
  garmentName,
  garmentColor,
  mockupImageUrl,
  placedDesignsCount,
  onOpenOrderPortal,
}) => {
  // Order Details State
  const [size, setSize] = useState<TShirtSize>('L');
  const [quantity, setQuantity] = useState<number>(1);
  const unitPrice = 24.99; // $24.99 per custom shirt
  const totalPrice = parseFloat((unitPrice * quantity).toFixed(2));

  // Customer Address State
  const [customer, setCustomer] = useState<CustomerAddress>({
    fullName: '',
    phone: '',
    email: '',
    streetAddress: '',
    city: '',
    district: '',
    state: '',
    zipCode: '',
    country: 'India',
  });

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'qr_code' | 'card'>('qr_code');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
  const [paymentTxnId, setPaymentTxnId] = useState('');

  // Card State
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Form Progress & Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<TShirtOrder | null>(null);

  useEffect(() => {
    if (!paymentProofFile) {
      setPaymentProofPreview(null);
      return;
    }
    const url = URL.createObjectURL(paymentProofFile);
    setPaymentProofPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [paymentProofFile]);

  if (!isOpen) return null;

  const handleAddressChange = (field: keyof CustomerAddress, value: string) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customer.fullName || !customer.phone || !customer.streetAddress || !customer.city || !customer.zipCode) {
      setErrorMsg('Please complete all required customer shipping address fields.');
      return;
    }

    if (paymentMethod === 'card') {
      if (!cardName || !cardNumber || !cardExpiry || !cardCvc) {
        setErrorMsg('Please enter valid credit/debit card details.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const cardLast4 = paymentMethod === 'card' && cardNumber ? cardNumber.slice(-4) : undefined;

      const newOrder = await createTShirtOrder(
        {
          customer,
          size,
          color: garmentColor || garmentName,
          quantity,
          unitPrice,
          totalPrice,
          paymentMethod,
          paymentTxnId: paymentTxnId.trim() || undefined,
          cardLast4,
          garmentName,
          mockupImageUrl: mockupImageUrl || undefined,
          placedDesignsCount,
        },
        paymentProofFile
      );

      saveLocalCustomerOrderRef(newOrder.id, newOrder.customer.phone);
      setConfirmedOrder(newOrder);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Order Custom T-Shirt</h2>
              <p className="text-[11px] text-slate-400">Direct print production & express doorstep shipping</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* Success Screen */}
          {confirmedOrder ? (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-slate-900">Order Placed Successfully!</h3>
                <p className="text-xs text-slate-500 font-mono">Order ID: #{confirmedOrder.id}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left max-w-md mx-auto space-y-2 text-xs">
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Item:</span>
                  <span className="text-slate-900 font-bold">{confirmedOrder.garmentName} ({confirmedOrder.size})</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Quantity:</span>
                  <span className="text-slate-900 font-bold">{confirmedOrder.quantity} Shirt(s)</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-slate-500">Total Paid / Due:</span>
                  <span className="text-sky-600 font-extrabold">${confirmedOrder.totalPrice}</span>
                </div>
                <div className="flex justify-between font-medium border-t border-slate-200 pt-2">
                  <span className="text-slate-500">Deliver To:</span>
                  <span className="text-slate-900 font-semibold text-right">{confirmedOrder.customer.fullName}, {confirmedOrder.customer.city}</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Use your Order ID & Mobile Number anytime to submit/replace payment proof or track courier updates.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {onOpenOrderPortal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenOrderPortal(confirmedOrder.id, confirmedOrder.customer.phone);
                    }}
                    className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-3 rounded-2xl text-xs transition-colors shadow-lg shadow-sky-500/20 flex items-center gap-2"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Submit Payment & Track Order</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-2xl text-xs transition-colors shadow-lg"
                >
                  Close & Return to Gallery
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitOrder} className="space-y-6">

              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. Garment & Size Selector */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Selected Garment:</span>
                  <span className="text-xs font-semibold text-sky-600">{garmentName}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1.5">Select T-Shirt Size *</label>
                    <div className="grid grid-cols-6 gap-1.5">
                      {(['S', 'M', 'L', 'XL', 'XXL', '3XL'] as TShirtSize[]).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSize(sz)}
                          className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                            size === sz
                              ? 'bg-sky-500 text-slate-950 border-sky-500 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-sky-400'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1.5">Quantity</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-24 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-sky-500"
                      />
                      <span className="text-xs font-semibold text-slate-500">
                        x ${unitPrice} = <strong className="text-slate-900">${totalPrice}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Customer Shipping Address */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-sky-500" /> Customer Shipping Address
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={customer.fullName}
                      onChange={(e) => handleAddressChange('fullName', e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">Phone Number (For Delivery) *</label>
                    <input
                      type="tel"
                      required
                      value={customer.phone}
                      onChange={(e) => handleAddressChange('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">Email Address (Optional)</label>
                    <input
                      type="email"
                      value={customer.email || ''}
                      onChange={(e) => handleAddressChange('email', e.target.value)}
                      placeholder="customer@example.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">Street Address *</label>
                    <input
                      type="text"
                      required
                      value={customer.streetAddress}
                      onChange={(e) => handleAddressChange('streetAddress', e.target.value)}
                      placeholder="123 Main Street, Suite 400"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={customer.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      placeholder="Chennai"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">District (Optional)</label>
                    <input
                      type="text"
                      value={customer.district || ''}
                      onChange={(e) => handleAddressChange('district', e.target.value)}
                      placeholder="District"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">State / Province</label>
                    <input
                      type="text"
                      value={customer.state}
                      onChange={(e) => handleAddressChange('state', e.target.value)}
                      placeholder="Tamil Nadu"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">Zip / Postal Code *</label>
                    <input
                      type="text"
                      required
                      value={customer.zipCode}
                      onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                      placeholder="600001"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">Country</label>
                    <input
                      type="text"
                      value={customer.country}
                      onChange={(e) => handleAddressChange('country', e.target.value)}
                      placeholder="India"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Payment Method Options */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Choose Payment Option
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qr_code')}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      paymentMethod === 'qr_code'
                        ? 'bg-sky-50/80 border-sky-500 text-sky-950 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <QrCode className="w-6 h-6 text-sky-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold">UPI / QR Code Scan</p>
                      <p className="text-[10px] text-slate-500">Scan & Upload Proof</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      paymentMethod === 'card'
                        ? 'bg-sky-50/80 border-sky-500 text-sky-950 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 text-sky-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Credit / Debit Card</p>
                      <p className="text-[10px] text-slate-500">Visa, Mastercard, Amex</p>
                    </div>
                  </button>
                </div>

                {/* QR Code Scan Details */}
                {paymentMethod === 'qr_code' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="text-center space-y-2">
                      <p className="text-xs font-bold text-slate-800">Scan Admin Payment QR Code</p>
                      
                      {siteSettings?.qrCodeUrl ? (
                        <div className="w-44 h-44 bg-white p-2 border border-slate-300 rounded-2xl mx-auto shadow-md flex items-center justify-center">
                          <img src={siteSettings.qrCodeUrl} alt="Payment QR Code" className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-44 h-44 bg-slate-200 border-2 border-dashed border-slate-300 rounded-2xl mx-auto flex flex-col items-center justify-center p-4 text-center">
                          <QrCode className="w-10 h-10 text-slate-400" />
                          <p className="text-[10px] text-slate-500 mt-2 font-medium">Official Admin QR Code</p>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                        Scan with GPay, PhonePe, Paytm or any UPI App to pay <strong className="text-slate-900">${totalPrice}</strong>. (You can also submit proof after placing your order.)
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">Transaction Ref / UTR ID</label>
                        <input
                          type="text"
                          value={paymentTxnId}
                          onChange={(e) => setPaymentTxnId(e.target.value)}
                          placeholder="e.g. 123456789012"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">Upload Payment Screenshot (JPG/PNG/WEBP)</label>
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/jpg, image/webp"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const f = e.target.files[0];
                              const check = validatePaymentScreenshot(f);
                              if (!check.valid) {
                                setErrorMsg(check.error || 'Invalid screenshot');
                                return;
                              }
                              setErrorMsg(null);
                              setPaymentProofFile(f);
                            }
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700 focus:outline-none cursor-pointer"
                        />
                      </div>
                    </div>

                    {paymentProofPreview && (
                      <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={paymentProofPreview} alt="Payment Preview" className="w-12 h-12 rounded-lg object-contain border border-slate-200" />
                          <span className="text-[11px] font-semibold text-slate-700 truncate">{paymentProofFile?.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPaymentProofFile(null)}
                          className="text-[11px] font-bold text-red-500 hover:underline shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Card Details Form */}
                {paymentMethod === 'card' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">Cardholder Name *</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <div className="col-span-2">
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">Card Number *</label>
                        <input
                          type="text"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())}
                          placeholder="4532 0000 0000 8888"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">Expiry *</label>
                        <input
                          type="text"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">CVC *</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                          placeholder="123"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold py-3.5 px-6 rounded-2xl text-xs transition-colors shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{isSubmitting ? 'Processing Order...' : `Confirm & Place Order ($${totalPrice})`}</span>
              </button>

            </form>
          )}

        </div>
      </div>
    </div>
  );
};
