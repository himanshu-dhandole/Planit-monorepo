import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
      {createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
                onClick={() => setIsModalOpen(false)}
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                className="relative w-full max-w-md bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/40 overflow-hidden"
              >
                {/* Header Decorative Background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl -mr-32 -mt-32 -z-10" />

                <div className="p-6 sm:p-8">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="text-slate-800">
                      <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Wallet size={24} className="text-indigo-600" /> Add Funds
                      </h3>
                      <p className="text-slate-500 text-sm mt-1 font-medium">Deposit money to your Planit Wallet</p>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="p-2 bg-white/60 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-colors border border-white/40"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleDeposit} className="space-y-6">
                    {/* Amount Input */}
                    <div className="bg-white/40 border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.015)] backdrop-blur-sm focus-within:bg-white/60 rounded-2xl p-6 relative group transition-all">
                      <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-2">Deposit Amount</label>
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
                          className="w-full pl-10 pr-4 py-2 bg-transparent text-4xl font-extrabold text-slate-800 outline-none placeholder:text-slate-350 transition-all border-none focus:ring-0 focus:outline-none"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Preset Amounts */}
                    <div>
                      <p className="text-xs font-bold text-slate-450 uppercase tracking-wider mb-3">Quick Add</p>
                      <div className="grid grid-cols-4 gap-2 sm:gap-3">
                        {presetAmounts.map((preset) => {
                          const isSelected = amount === preset.toString();
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setAmount(preset.toString())}
                              className={`py-2.5 rounded-xl text-sm font-bold transition-all relative overflow-hidden border ${
                                isSelected
                                  ? 'text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                                  : 'bg-white/30 text-slate-650 hover:bg-white/50 hover:text-slate-900 border-white/40'
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
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
                      <ShieldCheck className="text-blue-600 shrink-0" size={16} />
                      <p className="text-xs text-blue-800 font-semibold leading-normal">Funds are securely stored and can be used for instant bookings.</p>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={!amount || parseFloat(amount) <= 0}
                        className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold text-lg p-4 shadow-md shadow-indigo-600/20 transition-all hover:shadow-indigo-600/35 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                      >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                        <span>Proceed to Pay</span>
                        <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

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
        className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold py-3.5 shadow-md shadow-indigo-600/20 transition-all hover:shadow-indigo-600/35 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Plus size={20} />
        Add Money to Wallet
      </button>
    </>
  );
};

export default WalletDeposit;
