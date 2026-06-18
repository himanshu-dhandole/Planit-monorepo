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
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={closeModal}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="relative w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full blur-3xl -mr-32 -mt-32 -z-10" />

              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between mb-8">
                  <div className="text-slate-800">
                    <h3 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                      <Wallet size={24} className="text-purple-600" /> Withdraw Funds
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">Transfer money to your bank account</p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
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
                      <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative group">
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Withdraw Amount</label>
                          <span className="text-xs text-slate-500 font-medium">Max: ₹{maxAmount.toLocaleString('en-IN')}</span>
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
                            className="w-full pl-10 pr-4 py-2 bg-transparent text-4xl font-extrabold text-slate-900 outline-none placeholder:text-slate-200 transition-all"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Select</p>
                        <div className="grid grid-cols-4 gap-2 sm:gap-3">
                          {uniquePresets.map((preset) => {
                            const isSelected = amount === preset.toString();
                            return (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setAmount(preset.toString())}
                                className={`py-2.5 rounded-xl text-sm font-bold transition-all relative overflow-hidden ${
                                  isSelected
                                    ? 'text-white shadow-lg shadow-purple-500/30'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
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

                      <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-50/50 border border-purple-100/50">
                        <ShieldCheck className="text-purple-500 shrink-0" size={16} />
                        <p className="text-xs text-purple-700 font-medium">Withdrawals are processed instantly to your default bank account.</p>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxAmount || isLoading}
                          className="w-full relative group overflow-hidden rounded-2xl bg-slate-900 text-white font-semibold text-lg p-4 shadow-xl shadow-slate-900/20 transition-all hover:shadow-slate-900/40 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
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
                      <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 text-center">
                        <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-100">
                          <IndianRupee size={32} strokeWidth={2.5} />
                        </div>
                        <h4 className="text-xl font-bold text-slate-800 mb-2">Confirm Withdrawal</h4>
                        <p className="text-slate-500 text-sm">
                          You are about to withdraw <span className="font-bold text-slate-900 text-base">₹{parseFloat(amount).toLocaleString('en-IN')}</span> from your wallet to your default bank account.
                        </p>
                      </div>
                      
                      <div className="flex gap-3">
                        <button 
                          type="button" 
                          onClick={() => setStep('input')} 
                          disabled={isLoading}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button 
                          type="button" 
                          onClick={confirmWithdraw} 
                          disabled={isLoading} 
                          className="flex-[2] relative group overflow-hidden bg-slate-900 text-white font-bold py-3.5 rounded-xl transition-all hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
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
        className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 shadow-lg shadow-purple-600/30 transition-all hover:shadow-purple-600/50 active:scale-[0.98] flex items-center justify-center gap-2"
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Minus size={20} />
        Withdraw Funds
      </button>
    </>
  );
};

export default WalletWithdraw;
