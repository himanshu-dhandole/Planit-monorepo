import React, { useState } from 'react';
import { CreditCard, Wallet, IndianRupee, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import RazorpayCheckout from './RazorpayCheckout';
import { toast } from 'sonner';
import apiClient from '../../lib/apiClient';
import { motion, AnimatePresence } from 'framer-motion';

const BookingPayment = ({ 
  bookingId, 
  amount, 
  vendorName,
  onPaymentSuccess 
}) => {
  const [selectedMethod, setSelectedMethod] = useState(null); // 'razorpay' or 'wallet'
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePaymentSubmit = async () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (selectedMethod === 'razorpay') {
      setIsRazorpayOpen(true);
    } else if (selectedMethod === 'wallet') {
      await processWalletPayment();
    }
  };

  const processWalletPayment = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.post(`/api/payments/${bookingId}/pay-wallet`);
      const paymentData = response.data?.data || response.data;
      
      toast.success("Payment successful from wallet!");
      if (onPaymentSuccess) {
        onPaymentSuccess(paymentData);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || err.response?.data?.message || "Failed to process wallet payment. Insufficient balance?";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!bookingId || !amount) {
    return null;
  }

  return (
    <>
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
        {/* Header section with gradient */}
        <div className="bg-slate-50 border-b border-slate-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-900">Payment Details</h3>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-semibold">
              <ShieldCheck size={14} />
              Secure Checkout
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Amount Due</p>
              <div className="flex items-center text-slate-900">
                <IndianRupee size={24} strokeWidth={2.5} className="mr-1 text-slate-400" />
                <span className="text-3xl font-extrabold tracking-tight">
                  {amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            {vendorName && (
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Paying To</p>
                <p className="text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg">{vendorName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-6">
          <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Select Payment Method</h4>
          
          <div className="space-y-3">
            {/* Razorpay Option */}
            <motion.label 
              whileTap={{ scale: 0.98 }}
              className={`relative flex items-center p-4 rounded-2xl cursor-pointer border-2 transition-all ${
                selectedMethod === 'razorpay' 
                  ? 'border-indigo-500 bg-indigo-50/30' 
                  : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input 
                type="radio" 
                name="payment_method" 
                className="sr-only" 
                checked={selectedMethod === 'razorpay'}
                onChange={() => setSelectedMethod('razorpay')}
              />
              
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-colors ${
                selectedMethod === 'razorpay' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'bg-slate-100 text-slate-500'
              }`}>
                <CreditCard size={24} />
              </div>
              
              <div className="flex-1">
                <h5 className="font-bold text-slate-900 text-lg">Razorpay Checkout</h5>
                <p className="text-sm text-slate-500 font-medium">Credit/Debit Cards, UPI, NetBanking</p>
              </div>

              {/* Radio Indicator */}
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                selectedMethod === 'razorpay' ? 'border-indigo-500' : 'border-slate-300'
              }`}>
                <AnimatePresence>
                  {selectedMethod === 'razorpay' && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="w-3 h-3 rounded-full bg-indigo-500" 
                    />
                  )}
                </AnimatePresence>
              </div>
            </motion.label>

            {/* Wallet Option */}
            <motion.label 
              whileTap={{ scale: 0.98 }}
              className={`relative flex items-center p-4 rounded-2xl cursor-pointer border-2 transition-all ${
                selectedMethod === 'wallet' 
                  ? 'border-blue-500 bg-blue-50/30' 
                  : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input 
                type="radio" 
                name="payment_method" 
                className="sr-only" 
                checked={selectedMethod === 'wallet'}
                onChange={() => setSelectedMethod('wallet')}
              />
              
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-colors ${
                selectedMethod === 'wallet' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 text-slate-500'
              }`}>
                <Wallet size={24} />
              </div>
              
              <div className="flex-1">
                <h5 className="font-bold text-slate-900 text-lg">Planit Wallet</h5>
                <p className="text-sm text-slate-500 font-medium">Pay instantly using your wallet balance</p>
              </div>

              {/* Radio Indicator */}
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                selectedMethod === 'wallet' ? 'border-blue-500' : 'border-slate-300'
              }`}>
                <AnimatePresence>
                  {selectedMethod === 'wallet' && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="w-3 h-3 rounded-full bg-blue-500" 
                    />
                  )}
                </AnimatePresence>
              </div>
            </motion.label>
          </div>

          <button
            onClick={handlePaymentSubmit}
            disabled={!selectedMethod || isLoading}
            className="mt-8 w-full relative group overflow-hidden rounded-2xl bg-slate-900 text-white font-semibold text-lg p-4 shadow-xl shadow-slate-900/20 transition-all hover:shadow-slate-900/40 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            <div className={`absolute inset-0 transition-opacity duration-300 -z-10 ${
              selectedMethod === 'razorpay' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100' : 
              selectedMethod === 'wallet' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100' : ''
            }`} />
            
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <span>Confirm Payment</span>
                <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Razorpay Checkout Modal */}
      <RazorpayCheckout
        bookingId={bookingId}
        amount={amount}
        onSuccess={(data) => {
          setIsRazorpayOpen(false);
          if(onPaymentSuccess) onPaymentSuccess(data);
        }}
        onCancel={() => setIsRazorpayOpen(false)}
        isOpen={isRazorpayOpen}
        vendorName={vendorName}
      />
    </>
  );
};

export default BookingPayment;
