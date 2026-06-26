import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Wallet, Minus, IndianRupee, ArrowRight, ShieldCheck, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../../lib/apiClient';

const WalletWithdraw = ({ onSuccess, maxAmount }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('input');

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setStep('input'), 300);
  };

  const handleWithdraw = (e) => {
    e.preventDefault();
    const withdrawAmount = parseFloat(amount);
    if (!amount || withdrawAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (withdrawAmount > maxAmount) {
      toast.error("Insufficient balance");
      return;
    }
    setStep('confirm');
  };

  const confirmWithdraw = async () => {
    try {
      setIsLoading(true);
      await apiClient.post('/api/wallet/withdraw', { amount: parseFloat(amount) });
      toast.success("Amount withdrawn successfully!");
      setAmount('');
      closeModal();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to withdraw funds");
    } finally {
      setIsLoading(false);
    }
  };

  const presetAmounts = [500, 1000, 5000, maxAmount].filter(a => a > 0);
  const uniquePresets = [...new Set(presetAmounts)];

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
                onClick={closeModal}
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                className="relative w-full max-w-md bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/40 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full blur-3xl -mr-32 -mt-32 -z-10" />

                <div className="p-6 sm:p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="text-slate-800">
                      <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Wallet size={24} className="text-purple-600" /> Withdraw Funds
                      </h3>
                      <p className="text-slate-500 text-sm mt-1 font-medium">Transfer money to your bank account</p>
                    </div>
                    <button
                      onClick={closeModal}
                      className="p-2 bg-white/60 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full transition-colors border border-white/40"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {step === 'input' ? (
                      <motion.form 
                        key="input"
                        initial={{ opacity: 0, x: -20 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: 20 }} 
                        transition={{ duration: 0.2 }}
                        onSubmit={handleWithdraw} 
                        className="space-y-6"
                      >
                        <div className="bg-white/40 border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.015)] backdrop-blur-sm focus-within:bg-white/60 rounded-2xl p-6 relative group transition-all">
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider">Withdraw Amount</label>
                            <span className="text-xs text-slate-500 font-semibold">Max: ₹{maxAmount.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="relative flex items-center">
                            <div className="absolute left-0 pl-1">
                              <IndianRupee className="text-slate-400" size={28} strokeWidth={2.5} />
                            </div>
                            <input
                              type="number"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              min="1"
                              max={maxAmount}
                              step="1"
                              autoFocus
                              className="w-full pl-10 pr-4 py-2 bg-transparent text-4xl font-extrabold text-slate-800 outline-none placeholder:text-slate-350 transition-all border-none focus:ring-0 focus:outline-none"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-slate-455 uppercase tracking-wider mb-3">Quick Select</p>
                          <div className="grid grid-cols-4 gap-2 sm:gap-3">
                            {uniquePresets.map((preset) => {
                              const isSelected = amount === preset.toString();
                              return (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setAmount(preset.toString())}
                                  className={`py-2.5 rounded-xl text-sm font-bold transition-all relative overflow-hidden border ${
                                    isSelected
                                      ? 'text-white border-purple-500 shadow-md shadow-purple-500/20'
                                      : 'bg-white/30 text-slate-650 hover:bg-white/50 hover:text-slate-900 border-white/40'
                                  }`}
                                >
                                  {isSelected && (
                                    <motion.div 
                                      layoutId="activePresetWithdraw" 
                                      className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600" 
                                      style={{ borderRadius: 12 }} 
                                    />
                                  )}
                                  <span className="relative z-10">{preset === maxAmount ? 'All' : `₹${preset}`}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 backdrop-blur-sm">
                          <ShieldCheck className="text-purple-600 shrink-0" size={16} />
                          <p className="text-xs text-purple-800 font-semibold leading-normal">Withdrawals are processed instantly to your default bank account.</p>
                        </div>

                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxAmount || isLoading}
                            className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-lg p-4 shadow-md shadow-purple-600/20 transition-all hover:shadow-purple-600/35 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                          >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                            <span>Withdraw</span>
                            <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                          </button>
                        </div>
                      </motion.form>
                    ) : (
                      <motion.div 
                        key="confirm"
                        initial={{ opacity: 0, x: 20 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: -20 }} 
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                      >
                        <div className="bg-white/40 border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.015)] backdrop-blur-sm rounded-2xl p-8 text-center">
                          <div className="w-16 h-16 bg-purple-500/10 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/25">
                            <IndianRupee size={32} strokeWidth={2.5} />
                          </div>
                          <h4 className="text-xl font-bold text-slate-800 mb-2">Confirm Withdrawal</h4>
                          <p className="text-slate-500 text-sm font-medium">
                            You are about to withdraw <span className="font-extrabold text-slate-900 text-base">₹{parseFloat(amount).toLocaleString('en-IN')}</span> from your wallet to your default bank account.
                          </p>
                        </div>
                        
                        <div className="flex gap-3">
                          <button 
                            type="button" 
                            onClick={() => setStep('input')} 
                            disabled={isLoading}
                            className="flex-1 bg-white/40 hover:bg-white/60 text-slate-700 border border-white/60 hover:text-slate-900 font-bold py-3.5 rounded-xl transition-all disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button 
                            type="button" 
                            onClick={confirmWithdraw} 
                            disabled={isLoading} 
                            className="flex-[2] relative group overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-purple-600/20 hover:shadow-purple-600/35 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <span>Confirm & Withdraw</span>}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3.5 shadow-md shadow-purple-600/20 transition-all hover:shadow-purple-600/35 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Minus size={20} />
        Withdraw Funds
      </button>
    </>
  );
};

export default WalletWithdraw;
