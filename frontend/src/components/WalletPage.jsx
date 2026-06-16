import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../lib/apiClient';
import { toast } from 'sonner';
import { Wallet as WalletIcon, IndianRupee, Loader2, ArrowUpRight, Activity } from 'lucide-react';
import CloudsBackground from './CloudsBackground';
import { WalletDeposit } from './payment';
import { motion } from 'framer-motion';

export default function WalletPage() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/wallet');
      const walletData = res.data?.data || res.data;
      if (walletData) {
        setWallet(walletData);
      }
    } catch (err) {
      console.error("Error fetching wallet:", err);
      // It's possible the user doesn't have a wallet created yet until they deposit,
      // or backend auto-creates it. We handle it gracefully.
      if (err.response?.status !== 404) {
        toast.error("Failed to load wallet data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchWallet();
    }
  }, [user]);

  const handleDepositSuccess = () => {
    // Refresh wallet after successful deposit
    fetchWallet();
  };

  if (loading) {
    return (
      <CloudsBackground>
        <div className="flex-1 flex justify-center items-center h-screen">
          <Loader2 className="animate-spin text-indigo-500" size={48} />
        </div>
      </CloudsBackground>
    );
  }

  return (
    <CloudsBackground>
      <div className="flex-1 pt-32 relative font-sans w-full min-h-screen py-12 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header Section */}
          <div className="text-center mb-12">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 transform rotate-3"
            >
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center -rotate-3">
                <WalletIcon size={32} className="text-indigo-600" />
              </div>
            </motion.div>
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight"
            >
              Planit Wallet
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-lg text-slate-600 font-medium max-w-2xl mx-auto"
            >
              Manage your funds for seamless, instant bookings without reaching for your card every time.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Balance Card */}
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-125 duration-1000 -z-10" />
              
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                  <Activity size={20} className="text-indigo-500" /> Current Balance
                </h3>
                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold tracking-wide uppercase">
                  Active
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline text-slate-900">
                  <IndianRupee size={36} strokeWidth={3} className="mr-1 text-slate-400" />
                  <span className="text-6xl font-extrabold tracking-tight">
                    {wallet?.balance ? wallet.balance.toLocaleString('en-IN') : '0.00'}
                  </span>
                </div>
                <p className="text-sm text-slate-500 font-medium mt-2">Available for bookings</p>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <WalletDeposit onSuccess={handleDepositSuccess} />
              </div>
            </motion.div>

            {/* Quick Actions & Info */}
            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-sm border border-white">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ArrowUpRight size={20} className="text-emerald-500" /> Quick Add
                </h3>
                <p className="text-sm text-slate-600 mb-6">Need funds quickly? Use the quick add buttons in the deposit menu to top up your account instantly.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Zero</p>
                    <p className="text-sm font-semibold text-slate-800">Hidden Fees</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Instant</p>
                    <p className="text-sm font-semibold text-slate-800">Transactions</p>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-600 p-8 rounded-3xl shadow-lg text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
                <h3 className="text-xl font-bold mb-2">Secure & Encrypted</h3>
                <p className="text-indigo-100 text-sm leading-relaxed">
                  Your funds are securely managed and transactions are processed using industry-standard encryption through Razorpay.
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </CloudsBackground>
  );
}
