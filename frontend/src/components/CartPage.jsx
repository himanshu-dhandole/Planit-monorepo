import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import apiClient from '../lib/apiClient';
import { toast } from 'sonner';
import { 
  CalendarCheck, 
  Trash2, 
  Calendar, 
  IndianRupee, 
  Sparkles, 
  AlertCircle, 
  ArrowRight, 
  Wallet,
  CheckCircle,
  Crown,
  Loader2,
  X
} from 'lucide-react';
import CloudsBackground from './CloudsBackground';
import PageTransition from './PageTransition';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function CartPage() {
  const navigate = useNavigate();
  const { customerProfile } = useContext(AuthContext);
  const { cart, removeFromCart, updateCartItemDates, clearCart } = useContext(CartContext);
  
  const [wallet, setWallet] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // Checkout Modal State
  const [checkoutModal, setCheckoutModal] = useState({ isOpen: false, eventId: null, eventTitle: '', items: [], subtotal: 0 });

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

  const openCheckoutConfirmation = (eventId, eventTitle, items) => {
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

    const eventSubtotal = items.reduce((acc, item) => acc + item.service.price, 0);
    setCheckoutModal({ isOpen: true, eventId, eventTitle, items, subtotal: eventSubtotal });
  };

  const handleConfirmCheckout = async () => {
    const { eventId, eventTitle, items, subtotal } = checkoutModal;

    if (wallet && wallet.balance < subtotal) {
      toast.error(`Insufficient wallet balance. Please top up your wallet.`);
      return;
    }

    try {
      setBookingLoading(true);
      const payload = items.map(item => ({
        eventId: eventId,
        serviceId: item.service.id,
        customerId: customerProfile.id,
        startDt: item.startDt,
        endDt: item.endDt,
        bookingAmount: item.service.price
      }));

      await apiClient.post('/api/bookings/batch', payload);
      toast.success(`Bookings confirmed for event "${eventTitle}"!`);
      
      items.forEach(item => removeFromCart(item.service.id, eventId));
      fetchWallet();
      
      setCheckoutModal({ isOpen: false, eventId: null, eventTitle: '', items: [], subtotal: 0 });
      
      // Smooth redirect
      setTimeout(() => {
        navigate('/my-events');
      }, 300);
      
    } catch (err) {
      console.error("Event checkout failed:", err);
      toast.error(err.response?.data?.message || `Failed to confirm bookings for "${eventTitle}".`);
    } finally {
      setBookingLoading(false);
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
        <div className="flex-1 flex flex-col justify-center items-center min-h-screen pt-20 px-4 z-10 relative">
          <div className="max-w-md bg-white/90 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-slate-200 text-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-100">
              <AlertCircle size={40} className="text-amber-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Profile Required</h2>
            <p className="text-slate-600 mb-8 font-medium">You need to set up your customer profile before you can manage your event checkout.</p>
            <Link to="/profile" className="w-full block px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200">
              Complete Profile Setup
            </Link>
          </div>
        </div>
      </CloudsBackground>
    );
  }

  return (
    <CloudsBackground>
      <PageTransition className="flex-1 pt-32 pb-12 px-4 sm:px-6 lg:px-8 relative font-sans w-full min-h-screen z-10">
        <div className="max-w-4xl mx-auto space-y-10">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 border-b border-slate-200/60 pb-6">
            <div className="text-left relative">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight flex items-center gap-4"
              >
                <div className="w-14 h-14 bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm flex items-center justify-center -rotate-3 border border-slate-200 shrink-0">
                  <CalendarCheck size={28} className="text-indigo-600" />
                </div>
                Event Checkout
              </motion.h1>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-base md:text-lg text-slate-600 font-medium max-w-xl"
              >
                Review dates and securely finalize bookings for your upcoming events.
              </motion.p>
            </div>

            <div className="flex flex-col items-end gap-4">
              {cart.length > 0 && (
                <button 
                  onClick={clearCart}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 px-4 py-2 bg-white/50 border border-rose-100 hover:border-rose-200 rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  <Trash2 size={14} /> Clear All Events
                </button>
              )}
            </div>
          </div>

          {groupedCartList.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/80 backdrop-blur-2xl border border-white rounded-[3rem] p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
            >
              <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-white shadow-sm rotate-3">
                <CalendarCheck size={40} className="text-indigo-400 -rotate-3" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800 mb-4 tracking-tight">Checkout is Empty</h2>
              <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">
                Find the perfect services for your event and add them to your checkout. We'll keep them organized here.
              </p>
              <Link to="/services" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all inline-flex items-center gap-2 shadow-md hover:-translate-y-0.5">
                Browse Services <ArrowRight size={16} />
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-16">
              <AnimatePresence>
                {groupedCartList.map((group, index) => {
                  const eventSubtotal = group.items.reduce((acc, item) => acc + item.service.price, 0);

                  return (
                    <motion.div
                      key={group.eventId}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                      className="space-y-6"
                    >
                      {/* Floating Event Header */}
                      <div className="flex items-center gap-3 px-2">
                        <div className="w-10 h-10 bg-white/80 backdrop-blur-xl rounded-xl flex items-center justify-center shadow-sm border border-slate-200 shrink-0">
                          <Sparkles size={20} className="text-indigo-500" />
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-0.5">Event Name</span>
                          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{group.eventTitle}</h2>
                        </div>
                      </div>

                      {/* Services Cards Grid */}
                      <div className="grid grid-cols-1 gap-4">
                        <AnimatePresence>
                          {group.items.map((item) => (
                            <motion.div
                              key={item.service.id}
                              layout
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9, x: -20 }}
                              className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col md:flex-row gap-6 relative group/item transition-all"
                            >
                              {/* Service Photo */}
                              <div className="w-full md:w-40 h-40 rounded-2xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100 relative">
                                {item.service.photos && item.service.photos.length > 0 ? (
                                  <img src={item.service.photos[0]} alt={item.service.name} className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-500" />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-bold">
                                    <Crown size={32} />
                                  </div>
                                )}
                              </div>

                              {/* Service Details */}
                              <div className="flex-1 flex flex-col justify-between overflow-visible">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md uppercase tracking-wider inline-block mb-1">
                                      {item.service.category}
                                    </span>
                                    <h3 className="font-extrabold text-slate-800 text-lg leading-tight">
                                      {item.service.name}
                                    </h3>
                                  </div>
                                  <button 
                                    onClick={() => removeFromCart(item.service.id, group.eventId)}
                                    className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-all shrink-0"
                                    title="Remove from Event"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 mt-2 overflow-visible">
                                  <div className="relative flex-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1.5 ml-1">
                                      <Calendar size={12} className="text-indigo-400" /> Start Date
                                    </label>
                                    <DatePicker
                                      selected={item.startDt ? new Date(item.startDt) : null}
                                      onChange={(date) => updateCartItemDates(item.service.id, group.eventId, date ? date.toISOString() : null, item.endDt)}
                                      showTimeSelect
                                      timeFormat="HH:mm"
                                      timeIntervals={30}
                                      dateFormat="MMM d, yyyy h:mm aa"
                                      placeholderText="Select start..."
                                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                                      wrapperClassName="w-full"
                                    />
                                  </div>
                                  <div className="relative flex-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1.5 ml-1">
                                      <Calendar size={12} className="text-indigo-400" /> End Date
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
                                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all"
                                      wrapperClassName="w-full"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Price */}
                              <div className="md:border-l border-slate-100 md:pl-6 md:ml-2 flex md:flex-col justify-between md:justify-center items-center md:items-end pt-4 md:pt-0 border-t md:border-t-0 shrink-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cost</span>
                                <div className="font-extrabold text-slate-900 text-lg flex items-center">
                                  <IndianRupee size={14} className="text-slate-400 mr-0.5" />
                                  {item.service.price.toLocaleString('en-IN')}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>

                      {/* Clean Summary Bottom Bar */}
                      <div className="bg-white/90 backdrop-blur-2xl border border-white p-5 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.04)] flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-6">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Services</span>
                            <span className="text-slate-800 font-extrabold text-lg">{group.items.length} Items</span>
                          </div>
                          <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Total Cost</span>
                            <span className="text-indigo-600 font-black text-2xl flex items-center">
                              <IndianRupee size={18} className="mr-0.5" />
                              {eventSubtotal.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => openCheckoutConfirmation(group.eventId, group.eventTitle, group.items)}
                          className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 text-white font-bold rounded-2xl shadow-md hover:bg-black transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                          Checkout Event <ArrowRight size={18} />
                        </button>
                      </div>

                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

        </div>
      </PageTransition>

      {/* Modern Planit Wallet Style Confirmation Popup */}
      <AnimatePresence>
        {checkoutModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => !bookingLoading && setCheckoutModal({ isOpen: false, eventId: null, eventTitle: '', items: [], subtotal: 0 })}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-[2rem] p-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Confirm Booking
                </h3>
                <button 
                  onClick={() => !bookingLoading && setCheckoutModal({ isOpen: false, eventId: null, eventTitle: '', items: [], subtotal: 0 })}
                  disabled={bookingLoading}
                  className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-slate-500 font-medium text-sm mb-6">
                You are about to book <strong className="text-slate-800">{checkoutModal.items.length}</strong> services for your event <strong className="text-slate-800">"{checkoutModal.eventTitle}"</strong>.
              </p>

              {/* Wallet Info Block inside Modal */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 space-y-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Amount</span>
                  <span className="text-lg font-black text-slate-900 flex items-center">
                    <IndianRupee size={16} className="text-slate-500 mr-0.5" />
                    {checkoutModal.subtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                
                <div className="h-px w-full bg-slate-200"></div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 border border-indigo-200">
                      <Wallet size={14} className="text-indigo-600" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Wallet Balance</span>
                      <span className="text-sm font-extrabold text-indigo-600 flex items-center">
                        <IndianRupee size={12} className="mr-0.5" />
                        {wallet?.balance ? wallet.balance.toLocaleString('en-IN') : '0.00'}
                      </span>
                    </div>
                  </div>
                  {wallet && wallet.balance < checkoutModal.subtotal && (
                    <span className="text-[10px] font-black text-rose-500 bg-rose-50 border border-rose-100 px-2 py-1 rounded-md uppercase tracking-wider">
                      Insufficient
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setCheckoutModal({ isOpen: false, eventId: null, eventTitle: '', items: [], subtotal: 0 })}
                  disabled={bookingLoading}
                  className="flex-1 py-3.5 px-4 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                
                {wallet && wallet.balance < checkoutModal.subtotal ? (
                  <button
                    onClick={() => navigate('/wallet')}
                    className="flex-[1.5] py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    Top Up Wallet <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleConfirmCheckout}
                    disabled={bookingLoading}
                    className="flex-[1.5] py-3.5 px-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-all shadow-md hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-75"
                  >
                    {bookingLoading ? (
                      <><Loader2 className="animate-spin" size={18} /> Processing</>
                    ) : (
                      <><CheckCircle size={18} /> Confirm</>
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </CloudsBackground>
  );
}
