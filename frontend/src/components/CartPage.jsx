import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import apiClient from '../lib/apiClient';
import { toast } from 'sonner';
import { 
  ShoppingBag, 
  Trash2, 
  Calendar, 
  IndianRupee, 
  Sparkles, 
  AlertCircle, 
  Plus, 
  ArrowRight, 
  Wallet,
  CheckCircle,
  MapPin,
  Tag,
  Building
} from 'lucide-react';
import CloudsBackground from './CloudsBackground';
import PageTransition from './PageTransition';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartPage() {
  const navigate = useNavigate();
  const { customerProfile } = useContext(AuthContext);
  const { cart, removeFromCart, updateCartItemDates, clearCart } = useContext(CartContext);
  
  const [wallet, setWallet] = useState(null);
  const [bookingLoading, setBookingLoading] = useState({});

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

  const handleCheckoutEventGroup = async (eventId, eventTitle, items) => {
    // Validate dates for all items in this group
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
    if (wallet && wallet.balance < eventSubtotal) {
      toast.error(`Insufficient wallet balance to book services for "${eventTitle}".`);
      return;
    }

    try {
      setBookingLoading(prev => ({ ...prev, [eventId]: true }));
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
      
      // Remove these checked-out items from the cart
      items.forEach(item => removeFromCart(item.service.id, eventId));
      
      // Refresh wallet balance
      fetchWallet();
      
      // If cart is now empty, or navigate to Events page
      navigate('/my-events');
    } catch (err) {
      console.error("Event checkout failed:", err);
      toast.error(err.response?.data?.message || `Failed to confirm bookings for "${eventTitle}".`);
    } finally {
      setBookingLoading(prev => ({ ...prev, [eventId]: false }));
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
        <div className="flex-1 flex flex-col justify-center items-center min-h-screen pt-20 px-4">
          <div className="max-w-md bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white text-center shadow-lg">
            <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Onboarding Required</h2>
            <p className="text-slate-600 mb-6">You need to set up your customer profile before you can book services.</p>
            <Link to="/vendor-onboard" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors inline-block shadow-md">
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
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/50 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/80 shadow-sm">
                <ShoppingBag className="text-indigo-600" size={24} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Event Cart</h1>
                <p className="text-slate-500 font-medium text-sm mt-0.5">Manage and check out parent event service groups.</p>
              </div>
            </div>
            {cart.length > 0 && (
              <button 
                onClick={clearCart}
                className="text-xs font-bold text-rose-500 hover:text-rose-700 px-4 py-2 border border-rose-200 bg-rose-50/50 rounded-xl transition-all"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Wallet Balance Display */}
          {cart.length > 0 && (
            <div className="bg-white/60 backdrop-blur-md border border-white p-5 rounded-3xl flex items-center gap-4 shadow-sm w-fit">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Wallet size={20} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Wallet Balance</p>
                <p className="font-extrabold text-slate-800 text-sm flex items-center">
                  <IndianRupee size={12} className="mr-0.5 text-slate-500" />
                  {wallet?.balance ? wallet.balance.toLocaleString('en-IN') : '0.00'}
                </p>
              </div>
              <Link to="/wallet" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-xs ml-4">
                Top Up
              </Link>
            </div>
          )}

          {groupedCartList.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/60 backdrop-blur-xl border border-white rounded-[2rem] p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.03)]"
            >
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white">
                <ShoppingBag size={28} className="text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Your Cart is Empty</h2>
              <p className="text-slate-500 max-w-sm mx-auto mb-8">
                Attach services to events in our Discover page to view them here grouped by event.
              </p>
              <Link to="/services" className="px-6 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all inline-flex items-center gap-2 shadow-md">
                Browse Services <ArrowRight size={16} />
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-10">
              {groupedCartList.map((group) => {
                const eventSubtotal = group.items.reduce((acc, item) => acc + item.service.price, 0);
                const isInsufficient = wallet && wallet.balance < eventSubtotal;

                return (
                  <motion.div
                    key={group.eventId}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-[2.5rem] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6"
                  >
                    {/* Event Group Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Parent Event</span>
                        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">{group.eventTitle}</h2>
                      </div>
                      <div className="text-sm font-semibold text-slate-500 flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl">
                        <span>Associated Services:</span>
                        <span className="font-bold text-indigo-600">{group.items.length}</span>
                      </div>
                    </div>

                    {/* Services inside Event Cart */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 space-y-4">
                        {group.items.map((item) => (
                          <div
                            key={item.service.id}
                            className="bg-white/90 border border-slate-100 rounded-3xl p-5 shadow-[0_4px_15px_rgb(0,0,0,0.02)] flex flex-col sm:flex-row gap-5 relative overflow-hidden group/item"
                          >
                            {/* Service Photo */}
                            <div className="w-full sm:w-24 h-24 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 shrink-0">
                              {item.service.photos && item.service.photos.length > 0 ? (
                                <img src={item.service.photos[0]} alt={item.service.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-200 text-xs font-bold">
                                  No Photo
                                </div>
                              )}
                            </div>

                            {/* Service Content */}
                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start mb-1">
                                  <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                                    {item.service.category}
                                  </span>
                                  <button 
                                    onClick={() => removeFromCart(item.service.id, group.eventId)}
                                    className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                                    title="Remove from Event"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                                <h3 className="font-bold text-slate-800 text-base group-hover/item:text-indigo-600 transition-colors">
                                  {item.service.name}
                                </h3>
                                {item.service.vendorId && (
                                  <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                                    <Building size={10} /> Vendor ID: {item.service.vendorId}
                                  </p>
                                )}
                              </div>

                              {/* Dates inline configuration */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                <div>
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-1">
                                    <Calendar size={10} className="text-indigo-400" /> Start Date
                                  </label>
                                  <input
                                    type="datetime-local"
                                    value={item.startDt || ''}
                                    onChange={(e) => updateCartItemDates(item.service.id, group.eventId, e.target.value, item.endDt)}
                                    className="w-full px-3 py-1.5 bg-white/50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1 mb-1">
                                    <Calendar size={10} className="text-indigo-400" /> End Date
                                  </label>
                                  <input
                                    type="datetime-local"
                                    value={item.endDt || ''}
                                    onChange={(e) => updateCartItemDates(item.service.id, group.eventId, item.startDt, e.target.value)}
                                    className="w-full px-3 py-1.5 bg-white/50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                                  />
                                </div>
                              </div>

                            </div>

                            {/* Individual Pricing */}
                            <div className="absolute top-5 right-5 sm:relative sm:top-0 sm:right-0 sm:self-center sm:text-right font-extrabold text-slate-800 text-sm flex items-center shrink-0">
                              <IndianRupee size={12} className="text-slate-400 mr-0.5" />
                              {item.service.price}
                            </div>

                          </div>
                        ))}
                      </div>

                      {/* Checkout summary for this event group */}
                      <div className="space-y-4">
                        <div className="bg-slate-50/80 border border-slate-200/50 p-6 rounded-3xl space-y-4">
                          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide mb-2">Event Checkout Summary</h3>
                          
                          <div className="flex justify-between items-center py-2 border-b border-slate-200/50 text-xs font-semibold text-slate-500">
                            <span>Services Total ({group.items.length})</span>
                            <span className="text-slate-800 font-bold flex items-center">
                              <IndianRupee size={12} /> {eventSubtotal}
                            </span>
                          </div>

                          <div className="flex justify-between items-center py-3 border-b border-slate-200/50">
                            <span className="text-sm font-bold text-slate-800">Total Event Cost</span>
                            <span className="text-lg font-extrabold text-slate-900 flex items-center">
                              <IndianRupee size={14} className="text-slate-400" /> {eventSubtotal.toLocaleString('en-IN')}
                            </span>
                          </div>

                          {isInsufficient && (
                            <div className="bg-red-50 text-red-600 text-xs font-semibold p-3 rounded-xl border border-red-100 flex items-center gap-1.5">
                              <AlertCircle size={16} /> Insufficient Wallet balance to book.
                            </div>
                          )}

                          <button
                            onClick={() => handleCheckoutEventGroup(group.eventId, group.eventTitle, group.items)}
                            disabled={bookingLoading[group.eventId] || isInsufficient}
                            className="w-full py-3.5 bg-indigo-600 text-white font-bold text-sm rounded-2xl shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                          >
                            {bookingLoading[group.eventId] ? "Confirming..." : "Checkout Event Bookings"}
                          </button>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

        </div>
      </PageTransition>
    </CloudsBackground>
  );
}
