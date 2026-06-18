import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../lib/apiClient';
import { toast } from 'sonner';
import { 
  Calendar, 
  MapPin, 
  AlertCircle, 
  X, 
  Info,
  CalendarDays,
  Loader2,
  CheckCircle,
  MessageSquare,
  IndianRupee
} from 'lucide-react';
import CloudsBackground from './CloudsBackground';
import PageTransition from './PageTransition';
import { motion, AnimatePresence } from 'framer-motion';

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const { customerProfile } = useContext(AuthContext);
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  
  // Modal State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (customerProfile?.id) {
      fetchBookings();
    }
  }, [customerProfile]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/api/customer/bookings/${customerProfile.id}?page=0&size=100`);
      const data = res.data?.data?.content || res.data?.content || [];
      setBookings(data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      toast.error("Failed to load your bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleCancelBooking = async (bookingId, currentStatus) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    const isPending = currentStatus === "PENDING";
    const endpoint = isPending 
      ? `/api/bookings/${bookingId}/cancel/before`
      : `/api/bookings/${bookingId}/cancel/after`;

    try {
      setCancelLoading(true);
      const res = await apiClient.post(endpoint);
      const updatedBooking = res.data?.data || res.data;
      toast.success("Booking cancelled successfully.");
      
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: updatedBooking.status } : b));
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking(prev => ({ ...prev, status: updatedBooking.status }));
      }
      setShowModal(false);
    } catch (err) {
      console.error("Error cancelling booking:", err);
      toast.error(err.response?.data?.message || "Failed to cancel booking");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleStartChat = async (serviceId) => {
    if (!serviceId) return;
    try {
      setChatLoading(true);
      const res = await apiClient.post('/api/chat/conversations', { serviceId });
      const conversation = res.data?.data || res.data;
      navigate(`/chats?id=${conversation.id}`);
      toast.success("Opening chat channel...");
    } catch (err) {
      console.error("Error initiating chat:", err);
      toast.error("Failed to start chat with vendor");
    } finally {
      setChatLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'REJECTED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'PENDING':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'ALL') return true;
    return booking.status === filter;
  });

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
      <PageTransition className="flex-1 pt-32 pb-12 px-4 sm:px-6 lg:px-8 relative font-sans w-full min-h-screen z-10">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/50 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/80 shadow-sm">
                <CalendarDays className="text-indigo-600" size={24} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">My Bookings</h1>
                <p className="text-slate-500 font-medium text-sm mt-0.5">Manage and track your service bookings.</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 pb-2">
            {['ALL', 'PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                  filter === status
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-white/60 hover:bg-white text-slate-600 border-slate-200/60 backdrop-blur-sm'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {filteredBookings.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[2rem] p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
              <h2 className="text-xl font-bold text-slate-800 mb-2">No Bookings Found</h2>
              <p className="text-slate-500 max-w-sm mx-auto mb-6">Explore our services directory to hire professional catering, music, decoration, or venues for your events.</p>
              <button 
                onClick={() => navigate('/services')}
                className="px-5 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-all"
              >
                Browse Services
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredBookings.map((booking) => (
                <motion.div
                  key={booking.id}
                  layout
                  className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-0.5 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md uppercase tracking-wider mb-1">
                          {booking.services?.category || "SERVICE"}
                        </span>
                        <h3 className="font-extrabold text-slate-800 text-lg leading-tight">
                          {booking.services?.name || "Service Item"}
                        </h3>
                      </div>
                      <span className={`px-2.5 py-0.5 border text-[10px] font-extrabold rounded-md uppercase tracking-wider ${getStatusStyle(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs font-semibold text-slate-500">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-indigo-400" />
                        <span>{new Date(booking.startDt).toLocaleString()} - {new Date(booking.endDt).toLocaleString()}</span>
                      </div>
                      {booking.services?.location && (
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-indigo-400" />
                          <span>{booking.services.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100/80 mt-6 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Total Cost</span>
                      <span className="text-slate-900 text-base font-extrabold flex items-center">
                        <IndianRupee size={14} className="text-slate-400 mr-0.5" />
                        {booking.bookingAmount}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenModal(booking)}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                        title="View Details"
                      >
                        <Info size={16} />
                      </button>
                      <button
                        onClick={() => handleStartChat(booking.services?.id)}
                        disabled={chatLoading}
                        className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 rounded-xl transition-colors"
                        title="Chat with Vendor"
                      >
                        <MessageSquare size={16} />
                      </button>
                      {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
                        <button
                          onClick={() => handleCancelBooking(booking.id, booking.status)}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-500 text-xs font-bold rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        </div>
      </PageTransition>

      {/* Booking Details Modal */}
      <AnimatePresence>
        {showModal && selectedBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-8 md:p-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                  <CheckCircle className="text-indigo-600" size={24} /> Booking Details
                </h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Service Header */}
                <div className="flex gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 flex-shrink-0">
                    {selectedBooking.services?.photos && selectedBooking.services.photos.length > 0 ? (
                      <img src={selectedBooking.services.photos[0]} alt={selectedBooking.services.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-indigo-300 font-bold text-xs">
                        No Photo
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="inline-block px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-extrabold rounded-md uppercase tracking-wider mb-1">
                      {selectedBooking.services?.category || "SERVICE"}
                    </span>
                    <h4 className="font-extrabold text-slate-800 text-base">{selectedBooking.services?.name || "Service Item"}</h4>
                    {selectedBooking.services?.location && (
                      <p className="text-xs text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-indigo-400" /> {selectedBooking.services.location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Grid Info */}
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide block mb-0.5">Booking ID</span>
                    <span className="text-slate-800 text-sm font-bold"># {selectedBooking.id}</span>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide block mb-0.5">Status</span>
                    <span className={`inline-block px-2.5 py-0.5 border text-[10px] font-extrabold rounded-md uppercase tracking-wider ${getStatusStyle(selectedBooking.status)}`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide block mb-0.5">Start Date & Time</span>
                    <span className="text-slate-800 text-xs font-bold">{new Date(selectedBooking.startDt).toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide block mb-0.5">End Date & Time</span>
                    <span className="text-slate-800 text-xs font-bold">{new Date(selectedBooking.endDt).toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide block mb-0.5">Booked At</span>
                    <span className="text-slate-800 text-xs font-bold">{new Date(selectedBooking.bookedAt).toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide block mb-0.5">Amount</span>
                    <span className="text-slate-900 text-sm font-extrabold flex items-center">
                      <IndianRupee size={12} className="text-slate-400 mr-0.5" />
                      {selectedBooking.bookingAmount}
                    </span>
                  </div>
                </div>

                {selectedBooking.cancellationReason && (
                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-xs font-semibold text-rose-600">
                    <span className="text-[10px] text-rose-400 uppercase tracking-wide block mb-1">Cancellation Reason</span>
                    {selectedBooking.cancellationReason}
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => handleStartChat(selectedBooking.services?.id)}
                    className="flex-1 py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold border border-indigo-100 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare size={16} /> Chat Vendor
                  </button>
                  {(selectedBooking.status === "PENDING" || selectedBooking.status === "CONFIRMED") && (
                    <button
                      onClick={() => handleCancelBooking(selectedBooking.id, selectedBooking.status)}
                      disabled={cancelLoading}
                      className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center"
                    >
                      {cancelLoading ? "Processing..." : "Cancel Booking"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </CloudsBackground>
  );
}
