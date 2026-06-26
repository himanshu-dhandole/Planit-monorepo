import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import apiClient from "../lib/apiClient";
import { toast } from "sonner";
import {
  Wallet as WalletIcon,
  IndianRupee,
  Loader2,
  ArrowUpRight,
  Activity,
} from "lucide-react";
import CloudsBackground from "./CloudsBackground";
import { WalletDeposit, WalletWithdraw } from "./payment";
import { motion } from "framer-motion";

export default function WalletPage() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [activeTab, setActiveTab] = useState("deposit");

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/api/wallet");
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

  const handleWithdrawSuccess = () => {
    // Refresh wallet after successful withdraw
    fetchWallet();
  };

  if (loading) {
    return (
      <CloudsBackground>
        <div className="flex-1 pt-32 relative font-sans w-full min-h-screen py-12 px-4 sm:px-6 lg:px-8 z-10 animate-pulse">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header Skeleton */}
            <div className="text-center pt-24 mb-12 space-y-4">
              <div className="w-64 h-12 bg-slate-200 rounded mx-auto" />
              <div className="w-96 h-6 bg-slate-200 rounded mx-auto" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Balance Card Skeleton */}
              <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white/80 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <div className="w-36 h-6 bg-slate-200 rounded" />
                  <div className="w-16 h-6 bg-slate-200 rounded-full" />
                </div>
                <div className="space-y-3">
                  <div className="w-48 h-12 bg-slate-200 rounded" />
                  <div className="w-32 h-4 bg-slate-200 rounded" />
                </div>
                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <div className="w-full h-12 bg-slate-200 rounded-2xl" />
                  <div className="w-full h-12 bg-slate-200 rounded-xl" />
                </div>
              </div>

              {/* Quick Actions Skeleton */}
              <div className="space-y-6">
                <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/80 shadow-sm space-y-4">
                  <div className="w-36 h-6 bg-slate-200 rounded" />
                  <div className="w-full h-12 bg-slate-200 rounded" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-16 bg-slate-200 rounded-2xl" />
                    <div className="h-16 bg-slate-200 rounded-2xl" />
                  </div>
                </div>
                <div className="h-40 bg-slate-200 rounded-3xl" />
              </div>
            </div>
          </div>
        </div>
      </CloudsBackground>
    );
  }

  return (
    <CloudsBackground>
      <div className="flex-1 pt-24 relative font-sans w-full min-h-screen py-10 px-4 sm:px-6 lg:px-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto space-y-6"
        >
          {/* Header Section */}
          <div className="text-left pt-16 mb-8">
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="text-3xl font-bold text-slate-900 tracking-tight"
            >
              Planit Wallet
            </motion.h1>
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mt-1 text-sm text-slate-500 font-semibold"
            >
              Store and top-up funds for secure, escrow-protected vendor bookings.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {/* Balance Card */}
            <motion.div
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="md:col-span-3 bg-white/40 backdrop-blur-md p-6 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.01)] border border-white/50 relative overflow-hidden group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Current Balance
                  </h3>
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-green-500/10 text-green-700 border border-green-500/20 rounded-full text-[9px] font-black uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Active
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline text-slate-900">
                    <span className="text-4xl font-black tracking-tight">
                      ₹{wallet?.balance
                        ? wallet.balance.toLocaleString("en-IN")
                        : "0.00"}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">
                    Available for immediate hiring escrows
                  </p>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-200/40">
                <div className="flex bg-white/20 p-1 rounded-xl mb-4 border border-white/20">
                  <button
                    onClick={() => setActiveTab("deposit")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      activeTab === "deposit"
                        ? "bg-white/80 backdrop-blur-md text-blue-600 shadow-sm border border-white/30"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Deposit
                  </button>
                  <button
                    onClick={() => setActiveTab("withdraw")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      activeTab === "withdraw"
                        ? "bg-white/80 backdrop-blur-md text-blue-600 shadow-sm border border-white/30"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Withdraw
                  </button>
                </div>

                {activeTab === "deposit" ? (
                  <WalletDeposit onSuccess={handleDepositSuccess} />
                ) : (
                  <WalletWithdraw
                    onSuccess={handleWithdrawSuccess}
                    maxAmount={wallet?.balance || 0}
                  />
                )}
              </div>
            </motion.div>

            {/* Quick Actions & Info */}
            <motion.div
              initial={{ x: 10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="md:col-span-2 space-y-4"
            >
              <div className="bg-white/40 backdrop-blur-md p-5 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.01)] border border-white/50">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Top-up Info
                </h3>
                <p className="text-xs text-slate-650 leading-relaxed font-semibold mb-4">
                  Top-up your balance to bypass card authorization checks during high-speed checkout milestones.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/30 p-3.5 rounded-2xl border border-white/40 text-center">
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                      Zero
                    </p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                      Fees
                    </p>
                  </div>
                  <div className="bg-white/30 p-3.5 rounded-2xl border border-white/40 text-center">
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                      Instant
                    </p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                      Credits
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 backdrop-blur-md p-5 rounded-3xl text-slate-800">
                <h3 className="text-xs font-bold mb-1 text-blue-700">Razorpay Protected</h3>
                <p className="text-blue-900/80 text-xs leading-relaxed font-semibold">
                  All transaction layers are held securely in platform safekeeping until the event date.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </CloudsBackground>
  );
}
