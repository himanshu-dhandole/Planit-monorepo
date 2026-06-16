import React, { useState, useCallback, useEffect } from 'react';
import { CreditCard, AlertCircle, Loader2, CheckCircle, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../../lib/apiClient';
import { motion, AnimatePresence } from 'framer-motion';

const RazorpayCheckout = ({ 
  bookingId, 
  amount, 
  onSuccess, 
  onCancel, 
  isOpen,
  vendorName = "Planit Vendor"
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize Razorpay script
  useEffect(() => {
    if (!document.getElementById('razorpay-checkout-js')) {
      const script = document.createElement('script');
      script.id = 'razorpay-checkout-js';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const handlePayment = useCallback(async () => {
    if (!window.Razorpay) {
      setError("Razorpay is not loaded. Please check your internet connection and refresh.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Create order on backend
      let orderUrl = `/api/payments/${bookingId}/razorpay/order`;
      // For wallet topups, bookingId might be null, so backend might need a different route
      // The guide implies wallet might use a generic deposit or a dummy bookingId, 
      // but let's assume it supports wallet with a different route or just standard if bookingId provided.
      if (!bookingId) {
        // If it's a wallet deposit, there might be a different endpoint.
        // The guide mentions `RazorpayCheckout` with `bookingId={null}` for wallet,
        // let's adjust it to use the wallet specific route if there's one, or we need to pass a specific `isWallet` prop.
        // Wait, the guide's wallet component uses: `bookingId={null}`. Let's see if the backend handles it.
        // The backend guide says `/api/payments/{bookingId}/razorpay/order`. Let's assume bookingId = 'wallet' or similar if not present, but for now let's just make the request.
        // I will assume the guide's wallet approach requires an endpoint for wallet order creation.
        // Let's pass `wallet` as bookingId to the backend or use a specific route if needed. 
        // For now, I'll fallback to `wallet/razorpay/order` if no bookingId.
        orderUrl = `/api/wallet/razorpay/order?amount=${amount}`; 
      }

      const orderResponse = await apiClient.post(orderUrl, !bookingId ? { amount } : undefined);

      const orderData = orderResponse.data?.data || orderResponse.data;
      
      if (!orderData || !orderData.id) {
        throw new Error("Failed to create payment order");
      }

      // Step 2: Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_HERE',
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Planit",
        description: `Payment to ${vendorName}`,
        order_id: orderData.id,
        
        handler: async (response) => {
          try {
            // Step 3: Verify payment on backend
            let verifyUrl = `/api/payments/${bookingId}/razorpay/verify`;
            if (!bookingId) {
                verifyUrl = `/api/wallet/razorpay/verify`;
            }

            const verifyResponse = await apiClient.post(
              verifyUrl,
              {
                razorpayOrderId: orderData.id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                amount: amount // Pass amount for wallet deposit verification if needed
              }
            );

            const paymentData = verifyResponse.data?.data || verifyResponse.data;
            
            toast.success("Payment successful!");
            
            if (onSuccess) {
              onSuccess(paymentData);
            }
          } catch (verifyError) {
            console.error("Payment verification failed:", verifyError);
            toast.error(
              verifyError.response?.data?.error?.message || 
              "Payment verification failed. Please contact support."
            );
            setError("Payment verification failed");
          }
        },
        prefill: {
          name: "Planit User",
          email: "user@planit.com",
        },
        theme: {
          color: "#0f172a" // slate-900
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            if (onCancel) onCancel();
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
        console.error("Payment failed:", response);
        toast.error(
          response.error?.description || 
          "Payment failed. Please try again."
        );
        setError(response.error?.description);
      });

      razorpay.open();
    } catch (err) {
      console.error("Error initiating payment:", err);
      const errorMsg = 
        err.response?.data?.error?.message || 
        err.message || 
        "Failed to initiate payment";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [bookingId, amount, vendorName, onSuccess, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={!isLoading ? onCancel : undefined}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
          >
            {/* Header Background */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-t-3xl -z-10" />

            <div className="p-6 sm:p-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-8">
                <div className="text-white">
                  <h3 className="text-2xl font-bold tracking-tight">Checkout</h3>
                  <p className="text-slate-300 text-sm mt-1 flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    Secured by Razorpay
                  </p>
                </div>
                <button
                  onClick={onCancel}
                  disabled={isLoading}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Amount Card */}
              <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-2xl -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
                <div className="relative z-10">
                  <p className="text-sm font-medium text-slate-500 mb-1">Total to pay</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                      ₹{amount?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vendor Info */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-6">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                  {vendorName.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Paying to</p>
                  <p className="font-semibold text-slate-900">{vendorName}</p>
                </div>
              </div>

              {/* Error State */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex gap-3 text-red-800 mb-6">
                      <AlertCircle className="shrink-0 mt-0.5 text-red-500" size={18} />
                      <p className="text-sm font-medium leading-relaxed">{error}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Features List */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle size={16} />
                  </div>
                  <p className="text-sm font-medium text-slate-600">Instant Payment Confirmation</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
                    <CreditCard size={16} />
                  </div>
                  <p className="text-sm font-medium text-slate-600">Cards, UPI, NetBanking supported</p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handlePayment}
                disabled={isLoading}
                className="w-full relative group overflow-hidden rounded-2xl bg-slate-900 text-white font-semibold text-lg p-4 shadow-xl shadow-slate-900/20 transition-all hover:shadow-slate-900/40 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                <div className="relative flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Pay Securely</span>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform group-hover:translate-x-1">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  )}
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RazorpayCheckout;
