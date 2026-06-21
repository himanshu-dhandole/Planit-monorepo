import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import apiClient from '../lib/apiClient';
import { toast } from 'sonner';
import { 
  Trash2, 
  Calendar, 
  IndianRupee, 
  ArrowRight, 
  Wallet,
  CheckCircle,
  Loader2,
  Activity,
  ShieldCheck
} from 'lucide-react';
import CloudsBackground from './CloudsBackground';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function CartPage() {
  const navigate = useNavigate();
  const { customerProfile } = useContext(AuthContext);
  const { cart, removeFromCart, updateCartItemDates, clearCart } = useContext(CartContext);
  
  const [wallet, setWallet] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [processingEventId, setProcessingEventId] = useState(null);

  useEffect(() => {
    if (customerProfile?.id) {
      fetchWallet();
    }
  }, [customerProfile]);

  const fetchWallet = async () => {
    try {
      const res = await apiClient.get('/api/wallet');
      const walletData = res.data?.data || res.data;
      setWallet(walletData);
    } catch (err) {
      console.error("Error fetching wallet:", err);
    }
  };

  const handleConfirmCheckout = async (eventId, eventTitle, items, subtotal) => {
    for (const item of items) {
      if (!item.startDt || !item.endDt) {
        toast.error(`Please select dates for "${item.service.name}".`);
        return;
      }
      if (new Date(item.startDt) >= new Date(item.endDt)) {
        toast.error(`End date must be after start date for "${item.service.name}".`);
        return;
      }
    }

    if (wallet && wallet.balance < subtotal) {
      toast.error(`Insufficient wallet balance for ${eventTitle}.`);
      return;
    }

    try {
      setBookingLoading(true);
      setProcessingEventId(eventId);
      
      const payload = items.map(item => ({
        eventId: eventId,
        serviceId: item.service.id,
        customerId: customerProfile.id,
        startDt: item.startDt,
        endDt: item.endDt,
        bookingAmount: item.service.price,
        paymentMethod: 'WALLET'
      }));

      await apiClient.post('/api/bookings/batch', payload);
      toast.success(`Bookings confirmed for "${eventTitle}"!`);
      
      items.forEach(item => removeFromCart(item.service.id, eventId));
      fetchWallet();
      
      // If the cart only had this one event, redirect to my-events.
      // Otherwise stay so they can checkout the rest.
      const remainingEvents = new Set(cart.filter(item => item.eventId !== eventId).map(i => i.eventId));
      if (remainingEvents.size === 0) {
        setTimeout(() => navigate('/my-events'), 300);
      }
      
    } catch (err) {
      console.error("Event checkout failed:", err);
      toast.error(err.response?.data?.message || `Failed to confirm bookings for "${eventTitle}".`);
    } finally {
      setBookingLoading(false);
      setProcessingEventId(null);
    }
  };

  // Group items by eventId
  const groupedCart = cart.reduce((acc, item) => {
    const key = item.eventId;
    if (!acc[key]) {
      acc[key] = {
        eventId: item.eventId,
        eventTitle: item.eventTitle,
        items: []
      };
    }
    acc[key].items.push(item);
    return acc;
  }, {});

  const groupedCartList = Object.values(groupedCart);

  if (!customerProfile) {
    return (
      <CloudsBackground>
        <div className="flex-1 pt-32 relative font-sans w-full min-h-screen py-12 px-4 sm:px-6 lg:px-8 z-10">
          <div className="max-w-md mx-auto mt-24">
            <div className="bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white text-center">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Profile Required</h2>
              <p className="text-slate-600 font-medium mb-8">You need to set up your customer profile before you can manage your event checkout.</p>
              <Link to="/profile" className="w-full block px-6 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-sm">
                Complete Profile Setup
              </Link>
            </div>
          </div>
        </div>
      </CloudsBackground>
    );
  }

  return (
    <CloudsBackground>
      <div className="flex-1 pt-32 pb-24 relative font-sans w-full min-h-screen px-4 sm:px-6 lg:px-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75 }}
          className="max-w-7xl mx-auto space-y-8"
        >
          {/* Header Section */}
          <div className="pt-12 mb-16 relative border-b border-slate-200/60 pb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight"
              >
                Confirm your bookings
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-lg text-slate-600 font-medium max-w-2xl"
              >
                Review dates, calculate totals, and process payment seamlessly from your Planit Wallet.
              </motion.p>
            </div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {cart.length > 0 && (
                <button 
                  onClick={clearCart}
                  className="text-sm font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-xl transition-all border border-transparent hover:border-rose-100"
                >
                  Clear All Checkouts
                </button>
              )}
            </motion.div>
          </div>

          {groupedCartList.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] max-w-2xl mx-auto mt-20"
            >
              <h2 className="text-2xl font-extrabold text-slate-800 mb-4 tracking-tight">Checkout is Empty</h2>
              <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">
                Find the perfect services for your event and add them to your checkout. We'll keep them organized here.
              </p>
              <Link to="/services" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all inline-flex items-center gap-2 shadow-sm">
                Browse Services <ArrowRight size={16} />
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-24">
              <AnimatePresence>
                {groupedCartList.map((group, index) => {
                  const eventSubtotal = group.items.reduce((acc, item) => acc + item.service.price, 0);
                  const isProcessing = bookingLoading && processingEventId === group.eventId;

                  return (
                    <motion.div
                      key={group.eventId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16"
                    >
                      {/* Left Column: Review Items */}
                      <div className="lg:col-span-7 xl:col-span-8 space-y-8">
                        
                        <div className="flex items-center gap-3 border-b border-slate-200 pb-6">
                          <Activity size={28} className="text-indigo-500" />
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Event Details</span>
                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{group.eventTitle}</h2>
                          </div>
                        </div>

                        <div className="space-y-8">
                          <AnimatePresence>
                            {group.items.map((item, i) => (
                              <motion.div
                                key={item.service.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                className={`flex flex-col sm:flex-row gap-6 ${i !== group.items.length - 1 ? 'border-b border-slate-100 pb-8' : ''}`}
                              >
                                 {/* Image Thumbnail */}
                                 <div className="w-full sm:w-36 h-32 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60 relative">
                                    {item.service.photos && item.service.photos.length > 0 ? (
                                      <img src={item.service.photos[0]} alt={item.service.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400 font-bold text-xs">
                                        No Photo
                                      </div>
                                    )}
                                 </div>
                                 
                                 {/* Service Details & Date Selection */}
                                 <div className="flex-1 flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-4">
                                      <div>
                                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block mb-1">
                                          {item.service.category}
                                        </span>
                                        <h4 className="font-extrabold text-slate-800 text-lg leading-tight">
                                          {item.service.name}
                                        </h4>
                                      </div>
                                      <div className="text-right pl-4">
                                        <div className="font-extrabold text-slate-900 text-lg flex items-center justify-end">
                                          <IndianRupee size={14} className="text-slate-400 mr-0.5" />
                                          {item.service.price.toLocaleString('en-IN')}
                                        </div>
                                        <button 
                                          onClick={() => removeFromCart(item.service.id, group.eventId)}
                                          className="text-xs font-bold text-rose-500 hover:text-rose-700 mt-2 hover:underline transition-all"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>

                                    {/* Date Pickers Inline */}
                                    <div className="flex flex-col sm:flex-row gap-4">
                                      <div className="flex-1 bg-slate-50/50 rounded-xl border border-slate-200/60 p-2.5 hover:border-slate-300 transition-colors focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1 pl-1">
                                          <Calendar size={12} className="text-indigo-400" /> Start Date & Time
                                        </label>
                                        <DatePicker
                                          selected={item.startDt ? new Date(item.startDt) : null}
                                          onChange={(date) => updateCartItemDates(item.service.id, group.eventId, date ? date.toISOString() : null, item.endDt)}
                                          showTimeSelect
                                          timeFormat="HH:mm"
                                          timeIntervals={30}
                                          dateFormat="MMM d, yyyy h:mm aa"
                                          placeholderText="Select start..."
                                          className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none px-1"
                                          wrapperClassName="w-full"
                                        />
                                      </div>
                                      <div className="flex-1 bg-slate-50/50 rounded-xl border border-slate-200/60 p-2.5 hover:border-slate-300 transition-colors focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1 pl-1">
                                          <Calendar size={12} className="text-indigo-400" /> End Date & Time
                                        </label>
                                        <DatePicker
                                          selected={item.endDt ? new Date(item.endDt) : null}
                                          onChange={(date) => updateCartItemDates(item.service.id, group.eventId, item.startDt, date ? date.toISOString() : null)}
                                          showTimeSelect
                                          timeFormat="HH:mm"
                                          timeIntervals={30}
                                          minDate={item.startDt ? new Date(item.startDt) : null}
                                          dateFormat="MMM d, yyyy h:mm aa"
                                          placeholderText="Select end..."
                                          className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none px-1"
                                          wrapperClassName="w-full"
                                        />
                                      </div>
                                    </div>
                                 </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Right Column: Sticky Order Summary */}
                      <div className="lg:col-span-5 xl:col-span-4 relative">
                        <div className="sticky top-32 space-y-6">
                          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white">
                            
                            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight mb-6 flex items-center gap-2">
                              Price Details
                            </h3>

                            {/* Line Items */}
                            <div className="space-y-4 mb-6 text-slate-600 font-medium">
                              {group.items.map((item) => (
                                <div key={item.service.id} className="flex justify-between items-start">
                                  <span className="flex-1 pr-4">{item.service.name}</span>
                                  <span className="font-semibold text-slate-900 flex items-center shrink-0">
                                    <IndianRupee size={12} className="mr-0.5" />
                                    {item.service.price.toLocaleString('en-IN')}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="h-px w-full bg-slate-200 mb-6"></div>

                            {/* Total Line */}
                            <div className="flex justify-between items-center mb-8">
                              <span className="font-extrabold text-slate-900">Total (INR)</span>
                              <span className="text-2xl font-black text-slate-900 flex items-center">
                                <IndianRupee size={18} className="mr-0.5" />
                                {eventSubtotal.toLocaleString('en-IN')}
                              </span>
                            </div>

                            {/* Wallet Inline Integration */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8">
                              <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-2">
                                  <Wallet size={16} className="text-indigo-600" />
                                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Planit Wallet</span>
                                </div>
                                <span className="text-sm font-extrabold text-indigo-600 flex items-center">
                                  <IndianRupee size={12} className="mr-0.5" />
                                  {wallet?.balance ? wallet.balance.toLocaleString('en-IN') : '0.00'}
                                </span>
                              </div>

                              {wallet && wallet.balance < eventSubtotal && (
                                <div className="mt-3 flex items-center gap-2 text-rose-600 bg-rose-50 px-3 py-2 rounded-xl border border-rose-100 text-xs font-bold">
                                  <span>Insufficient balance</span>
                                </div>
                              )}
                            </div>

                            {/* Action Button */}
                            {wallet && wallet.balance < eventSubtotal ? (
                              <button
                                onClick={() => navigate('/wallet')}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 text-lg hover:-translate-y-0.5"
                              >
                                Top Up Wallet <ArrowRight size={18} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleConfirmCheckout(group.eventId, group.eventTitle, group.items, eventSubtotal)}
                                disabled={isProcessing}
                                className="w-full py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 text-lg disabled:opacity-75 hover:-translate-y-0.5"
                              >
                                {isProcessing ? (
                                  <><Loader2 className="animate-spin" size={20} /> Processing...</>
                                ) : (
                                  <><ShieldCheck size={20} /> Confirm and Pay</>
                                )}
                              </button>
                            )}

                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </CloudsBackground>
  );
}
