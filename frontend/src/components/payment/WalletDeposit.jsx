import React, { useState } from 'react';
import { Wallet, Plus, IndianRupee, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import RazorpayCheckout from './RazorpayCheckout';
import { motion, AnimatePresence } from 'framer-motion';

const WalletDeposit = ({ onSuccess }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [razorpayOpen, setRazorpayOpen] = useState(false);

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setRazorpayOpen(true);
  };

  const handlePaymentSuccess = async (paymentData) => {
    toast.success("Wallet credited successfully!");
    setAmount('');
    setIsModalOpen(false);
    setRazorpayOpen(false);
    if (onSuccess) {
      onSuccess(paymentData);
    }
  };

  const presetAmounts = [500, 1000, 5000, 10000];

  return (
    <>
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="relative w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
            >
              {/* Header Decorative Background */}
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-t-3xl -z-10" />

              <div className="p-6 sm:p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                  <div className="text-white">
                    <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                      <Wallet size={24} /> Add Funds
                    </h3>
                    <p className="text-blue-100 text-sm mt-1">Deposit money to your Planit Wallet</p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleDeposit} className="space-y-6">
                  {/* Amount Input */}
                  <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative group">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Deposit Amount</label>
                    <div className="relative flex items-center">
                      <div className="absolute left-0 pl-1">
                        <IndianRupee className="text-slate-400" size={28} strokeWidth={2.5} />
                      </div>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="1"
                        step="1"
                        autoFocus
                        className="w-full pl-10 pr-4 py-2 bg-transparent text-4xl font-extrabold text-slate-900 outline-none placeholder:text-slate-200 transition-all"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Preset Amounts */}
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Add</p>
                    <div className="grid grid-cols-4 gap-2 sm:gap-3">
                      {presetAmounts.map((preset) => {
                        const isSelected = amount === preset.toString();
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setAmount(preset.toString())}
                            className={`py-2.5 rounded-xl text-sm font-bold transition-all relative overflow-hidden ${
                              isSelected
                                ? 'text-white shadow-lg shadow-indigo-500/30'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                            }`}
                          >
                            {isSelected && (
                              <motion.div 
                                layoutId="activePreset" 
                                className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600" 
                                style={{ borderRadius: 12 }} 
                              />
                            )}
                            <span className="relative z-10">₹{preset}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Info text */}
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50/50 border border-blue-100/50">
                    <ShieldCheck className="text-blue-500 shrink-0" size={16} />
                    <p className="text-xs text-blue-700 font-medium">Funds are securely stored and can be used for instant bookings.</p>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={!amount || parseFloat(amount) <= 0}
                      className="w-full relative group overflow-hidden rounded-2xl bg-slate-900 text-white font-semibold text-lg p-4 shadow-xl shadow-slate-900/20 transition-all hover:shadow-slate-900/40 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                      <span>Proceed to Pay</span>
                      <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Razorpay Checkout Instance */}
      <RazorpayCheckout
        bookingId={null} // null for wallet deposit
        amount={parseFloat(amount) || 0}
        onSuccess={handlePaymentSuccess}
        onCancel={() => setRazorpayOpen(false)}
        isOpen={razorpayOpen}
        vendorName="Planit Wallet"
      />

      {/* Trigger Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold py-4 shadow-lg shadow-indigo-600/30 transition-all hover:shadow-indigo-600/50 active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Plus size={20} />
        Add Money to Wallet
      </button>
    </>
  );
};

export default WalletDeposit;
