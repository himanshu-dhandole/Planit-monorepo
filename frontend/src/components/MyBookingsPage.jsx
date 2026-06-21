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
  IndianRupee,
  ArrowRight,
  Star,
  ShieldAlert
} from 'lucide-react';
import CloudsBackground from './CloudsBackground';
import PageTransition from './PageTransition';
import { motion, AnimatePresence } from 'framer-motion';

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const { user, customerProfile } = useContext(AuthContext);
  
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  
  // Modal State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // Dispute States
  const [disputes, setDisputes] = useState([]);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeBooking, setDisputeBooking] = useState(null);
  const [disputeType, setDisputeType] = useState('PAYMENT_ISSUE');
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);

  // Review States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Complaint States
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintBooking, setComplaintBooking] = useState(null);
  const [complaintText, setComplaintText] = useState('');
  const [complaintLoading, setComplaintLoading] = useState(false);

  useEffect(() => {
    if (customerProfile?.id) {
      fetchBookings();
      fetchDisputes();
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

  const fetchDisputes = async () => {
    try {
      const res = await apiClient.get('/api/disputes/my');
      let dataList = [];
      if (res.data?.data && Array.isArray(res.data.data)) {
        dataList = res.data.data;
      } else if (res.data?.data?.content && Array.isArray(res.data.data.content)) {
        dataList = res.data.data.content;
      } else if (res.data?.content && Array.isArray(res.data.content)) {
        dataList = res.data.content;
      } else if (Array.isArray(res.data)) {
        dataList = res.data;
      }
      setDisputes(dataList);
    } catch (err) {
      console.error("Error fetching disputes:", err);
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

  const handleRaiseDispute = async (e) => {
    e.preventDefault();
    if (!disputeReason.trim()) {
      toast.error("Please enter a reason for the dispute");
      return;
    }
    try {
      setDisputeLoading(true);
      const payload = {
        bookingId: disputeBooking.id,
        type: disputeType,
        reason: disputeReason
      };
      await apiClient.post('/api/disputes', payload);
      toast.success("Dispute raised successfully! Our admins will review it.");
      setShowDisputeModal(false);
      setDisputeReason('');
      fetchDisputes();
    } catch (err) {
      console.error("Error raising dispute:", err);
      toast.error(err.response?.data?.message || "Failed to raise dispute");
    } finally {
      setDisputeLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      toast.error("Please enter your review comment.");
      return;
    }
    try {
      setReviewLoading(true);
      const payload = {
        bookingId: reviewBooking.id,
        rating: reviewRating,
        reviewText: reviewText
      };
      await apiClient.post('/api/reviews', payload);
      toast.success("Review submitted successfully! Thank you for your feedback.");
      setShowReviewModal(false);
      setReviewText('');
      setReviewRating(5);
      fetchBookings();
    } catch (err) {
      console.error("Error submitting review:", err);
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!complaintText.trim()) {
      toast.error("Please enter the complaint description.");
      return;
    }
    try {
      setComplaintLoading(true);
      const payload = {
        bookingId: complaintBooking.id,
        raisedByUserId: user.id,
        againstUserId: 0,
        blame: "PENDING_RESOLUTION",
        description: complaintText
      };
      await apiClient.post('/api/complaints', payload);
      toast.success("Complaint filed successfully! Our admins will review and resolve it.");
      setShowComplaintModal(false);
      setComplaintText('');
    } catch (err) {
      console.error("Error raising complaint:", err);
      toast.error(err.response?.data?.message || "Failed to file complaint");
    } finally {
      setComplaintLoading(false);
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



  return (
    <CloudsBackground>
      <PageTransition className="flex-1 pt-32 pb-12 px-4 sm:px-6 lg:px-8 relative font-sans w-full min-h-screen z-10">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Header Section */}
          <div className="text-center pt-8 mb-10 relative">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight"
            >
              My Bookings
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-lg text-slate-600 font-medium max-w-2xl mx-auto"
            >
              Manage and track your service bookings.
            </motion.p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-3 pb-8">
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

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-[1.8rem] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.02)] animate-pulse flex flex-col justify-between h-[220px]"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="w-16 h-4 bg-slate-200 rounded" />
                        <div className="w-2/3 h-6 bg-slate-200 rounded" />
                      </div>
                      <div className="w-20 h-5 bg-slate-200 rounded" />
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="w-1/2 h-3.5 bg-slate-200 rounded" />
                      <div className="w-1/3 h-3.5 bg-slate-200 rounded" />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100/80 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="w-12 h-3 bg-slate-200 rounded" />
                      <div className="w-16 h-5 bg-slate-200 rounded" />
                    </div>
                    <div className="flex gap-2">
                      <div className="w-9 h-9 bg-slate-200 rounded-xl" />
                      <div className="w-9 h-9 bg-slate-200 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75 }}
            >
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
                      {booking.status === "COMPLETED" && (
                        <button
                          onClick={() => {
                            setReviewBooking(booking);
                            setShowReviewModal(true);
                          }}
                          className="px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-100 text-amber-600 text-xs font-bold rounded-xl transition-colors animate-fade-in"
                        >
                          Review
                        </button>
                      )}
                      {(booking.status === "CONFIRMED" || booking.status === "COMPLETED") && (
                        <button
                          onClick={() => {
                            setComplaintBooking(booking);
                            setShowComplaintModal(true);
                          }}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-500 text-xs font-bold rounded-xl transition-colors"
                        >
                          Complaint
                        </button>
                      )}
                      {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
                        <button
                          onClick={() => handleCancelBooking(booking.id, booking.status)}
                          disabled={cancelLoading}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-500 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {cancelLoading ? <Loader2 size={12} className="animate-spin" /> : null}
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
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

                {(() => {
                  const bookingDispute = disputes.find(d => d.bookingId === selectedBooking.id);
                  if (bookingDispute) {
                    return (
                      <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-xs font-semibold text-rose-700">
                        <span className="text-[10px] text-rose-400 uppercase tracking-wide block mb-1">Dispute Filed ({bookingDispute.status})</span>
                        <div className="font-bold text-slate-800">Reason: {bookingDispute.reason}</div>
                        {bookingDispute.resolutionNote && (
                          <div className="mt-2 pt-2 border-t border-rose-200">
                            <strong>Resolution Note:</strong> {bookingDispute.resolutionNote}
                          </div>
                        )}
                        <button
                          onClick={() => {
                            setShowModal(false);
                            navigate('/disputes');
                          }}
                          className="mt-3 text-xs text-indigo-600 hover:underline font-extrabold flex items-center gap-1"
                        >
                          View in Disputes Center <ArrowRight size={12} />
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => handleStartChat(selectedBooking.services?.id)}
                    className="flex-1 py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold border border-indigo-100 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare size={16} /> Chat Vendor
                  </button>
                  {(() => {
                    const bookingDispute = disputes.find(d => d.bookingId === selectedBooking.id);
                    if (bookingDispute) return null;

                    if (selectedBooking.status === "CONFIRMED" || selectedBooking.status === "COMPLETED") {
                      return (
                        <button
                          onClick={() => {
                            setDisputeBooking(selectedBooking);
                            setShowModal(false);
                            setShowDisputeModal(true);
                          }}
                          className="flex-1 py-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <AlertCircle size={16} /> Raise Dispute
                        </button>
                      );
                    }

                    if (selectedBooking.status === "PENDING") {
                      return (
                        <button
                          onClick={() => handleCancelBooking(selectedBooking.id, selectedBooking.status)}
                          disabled={cancelLoading}
                          className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                        >
                          {cancelLoading ? <Loader2 className="animate-spin" size={16} /> : null}
                          {cancelLoading ? "Processing..." : "Cancel Booking"}
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Raise Dispute Modal */}
      <AnimatePresence>
        {showDisputeModal && disputeBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setShowDisputeModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-8 md:p-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                  <AlertCircle className="text-rose-600" size={24} /> Raise a Dispute
                </h3>
                <button 
                  onClick={() => setShowDisputeModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleRaiseDispute} className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-600">
                  <div>Booking ID: <strong className="text-slate-800">#{disputeBooking.id}</strong></div>
                  <div className="mt-1">Service: <strong className="text-slate-800">{disputeBooking.services?.name}</strong></div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Dispute Type *</label>
                  <select 
                    value={disputeType}
                    onChange={(e) => setDisputeType(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-semibold"
                  >
                    <option value="PAYMENT_ISSUE">Payment Issue</option>
                    <option value="SERVICE_NOT_DELIVERED">Service Not Delivered</option>
                    <option value="QUALITY_ISSUE">Quality Issue</option>
                    <option value="CANCELLATION_DISPUTE">Cancellation Dispute</option>
                    <option value="VENDOR_NO_SHOW">Vendor No Show</option>
                    <option value="OTHER">Other / Miscellaneous</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Reason / Explanation *</label>
                  <textarea 
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    required
                    maxLength={1000}
                    rows="4"
                    placeholder="Describe the issue in detail..."
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium resize-none"
                  />
                  <div className="text-[10px] text-slate-400 text-right">{disputeReason.length}/1000 characters</div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowDisputeModal(false)}
                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={disputeLoading}
                    className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-75"
                  >
                    {disputeLoading ? <Loader2 className="animate-spin" size={16} /> : null}
                    Submit Dispute
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && reviewBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setShowReviewModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-8 md:p-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                  <Star className="text-amber-500 fill-amber-500" size={24} /> Submit a Review
                </h3>
                <button 
                  onClick={() => setShowReviewModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-600">
                  <div>Booking ID: <strong className="text-slate-800">#{reviewBooking.id}</strong></div>
                  <div className="mt-1">Service: <strong className="text-slate-800">{reviewBooking.services?.name}</strong></div>
                </div>

                {/* Rating selection (Stars) */}
                <div className="space-y-2 text-center">
                  <label className="text-sm font-bold text-gray-700 block mb-2">Your Rating *</label>
                  <div className="flex justify-center items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setReviewHoverRating(star)}
                        onMouseLeave={() => setReviewHoverRating(0)}
                        className="text-slate-300 hover:scale-110 active:scale-95 transition-all"
                      >
                        <Star
                          size={36}
                          fill={star <= (reviewHoverRating || reviewRating) ? "#f59e0b" : "transparent"}
                          className={star <= (reviewHoverRating || reviewRating) ? "text-amber-500" : "text-slate-300"}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-slate-500 block mt-1">
                    {reviewRating === 5 ? "Excellent (5 Stars)" :
                     reviewRating === 4 ? "Very Good (4 Stars)" :
                     reviewRating === 3 ? "Average (3 Stars)" :
                     reviewRating === 2 ? "Below Average (2 Stars)" :
                     "Poor (1 Star)"}
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Write your feedback *</label>
                  <textarea 
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    required
                    maxLength={1000}
                    rows="4"
                    placeholder="Tell us what you liked or disliked about this vendor's service..."
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all text-sm font-medium resize-none shadow-sm"
                  />
                  <div className="text-[10px] text-slate-400 text-right">{reviewText.length}/1000 characters</div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reviewLoading}
                    className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-75"
                  >
                    {reviewLoading ? <Loader2 className="animate-spin" size={16} /> : null}
                    Submit Review
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Complaint Modal */}
      <AnimatePresence>
        {showComplaintModal && complaintBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setShowComplaintModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-8 md:p-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                  <ShieldAlert className="text-rose-600" size={24} /> File a Complaint
                </h3>
                <button 
                  onClick={() => setShowComplaintModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitComplaint} className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs font-semibold text-slate-600">
                  <div>Booking ID: <strong className="text-slate-800">#{complaintBooking.id}</strong></div>
                  <div className="mt-1">Service: <strong className="text-slate-800">{complaintBooking.services?.name}</strong></div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Describe the issue *</label>
                  <textarea 
                    value={complaintText}
                    onChange={(e) => setComplaintText(e.target.value)}
                    required
                    maxLength={1000}
                    rows="5"
                    placeholder="Explain what went wrong in detail. Our admin team will investigate and assign blame according to system rules."
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all text-sm font-medium resize-none shadow-sm"
                  />
                  <div className="text-[10px] text-slate-400 text-right">{complaintText.length}/1000 characters</div>
                </div>

                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-[11px] font-semibold text-amber-700 flex gap-2">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-amber-500" />
                  <span>
                    Warning: Filing false or malicious complaints will result in a <strong>-50.0</strong> Aura reputation penalty.
                  </span>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowComplaintModal(false)}
                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={complaintLoading}
                    className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-75"
                  >
                    {complaintLoading ? <Loader2 className="animate-spin" size={16} /> : null}
                    File Complaint
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </CloudsBackground>
  );
}
