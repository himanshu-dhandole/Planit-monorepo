import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../lib/apiClient';
import { toast } from 'sonner';
import { 
  Calendar, 
  MapPin, 
  X, 
  Info,
  CalendarDays,
  Loader2,
  CheckCircle,
  MessageSquare,
  IndianRupee,
  User,
  Mail,
  Phone,
  Check,
  Ban,
  ArrowRight
} from 'lucide-react';
import CloudsBackground from './CloudsBackground';
import PageTransition from './PageTransition';
import { motion, AnimatePresence } from 'framer-motion';

export default function VendorBookingsPage() {
  const navigate = useNavigate();
  const { customerProfile } = useContext(AuthContext);
  
  const [vendorProfile, setVendorProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  
  // Modal State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [disputes, setDisputes] = useState([]);

  useEffect(() => {
    if (customerProfile?.id) {
      fetchVendorAndBookings();
      fetchDisputes();
    }
  }, [customerProfile]);

  const fetchVendorAndBookings = async () => {
    try {
      setLoading(true);
      // 1. Fetch Vendor Profile
      const vendorRes = await apiClient.get(`/api/vendor/customer/${customerProfile.id}`);
      const vendor = vendorRes.data?.data || vendorRes.data;
      setVendorProfile(vendor);

      if (vendor?.id) {
        // 2. Fetch Bookings
        const bookingsRes = await apiClient.get(`/api/vendor/bookings/${vendor.id}?page=0&size=100`);
        const data = bookingsRes.data?.data?.content || bookingsRes.data?.content || [];
        setBookings(data);
      }
    } catch (err) {
      console.error("Error fetching vendor bookings:", err);
      toast.error("Failed to load your vendor dashboard bookings");
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
      console.error("Error fetching vendor disputes:", err);
    }
  };

  const handleOpenModal = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleUpdateStatus = async (bookingId, action) => {
    let endpoint = "";
    let confirmMsg = "";
    
    if (action === "ACCEPT") {
      endpoint = `/api/bookings/${bookingId}/accept`;
      confirmMsg = "Are you sure you want to accept this booking?";
    } else if (action === "REJECT") {
      endpoint = `/api/bookings/${bookingId}/reject`;
      confirmMsg = "Are you sure you want to reject this booking?";
    } else if (action === "CANCEL") {
      endpoint = `/api/bookings/${bookingId}/cancel/vendor`;
      confirmMsg = "Are you sure you want to cancel this booking? This will issue a refund to the customer.";
    }

    if (!window.confirm(confirmMsg)) return;

    try {
      setActionLoading(true);
      const res = await apiClient.post(endpoint);
      const updatedBooking = res.data?.data || res.data;
      toast.success(`Booking ${action.toLowerCase()}ed successfully.`);
      
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: updatedBooking.status } : b));
      if (selectedBooking && selectedBooking.id === bookingId) {
        setSelectedBooking(prev => ({ ...prev, status: updatedBooking.status }));
      }
      setShowModal(false);
    } catch (err) {
      console.error(`Error updating booking status (${action}):`, err);
      toast.error(err.response?.data?.message || "Failed to update booking status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartChat = async (customerId) => {
    if (!customerId) return;
    try {
      setChatLoading(true);
      const res = await apiClient.post('/api/chat/conversations', { customerId });
      const conversation = res.data?.data || res.data;
      navigate(`/chats?id=${conversation.id}`);
      toast.success("Opening chat channel...");
    } catch (err) {
      console.error("Error initiating chat:", err);
      toast.error("Failed to start chat with customer");
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
              Customer Bookings
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-lg text-slate-600 font-medium max-w-2xl mx-auto"
            >
              Manage pending requests and confirmed bookings for your services.
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
                  className="bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-[1.8rem] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.02)] animate-pulse flex flex-col justify-between h-[240px]"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="w-16 h-4 bg-slate-200 rounded" />
                        <div className="w-2/3 h-6 bg-slate-200 rounded" />
                      </div>
                      <div className="w-20 h-5 bg-slate-200 rounded" />
                    </div>
                    <div className="bg-slate-50/50 border border-slate-100/50 p-3 rounded-2xl space-y-2">
                      <div className="w-1/2 h-3.5 bg-slate-200 rounded" />
                      <div className="w-2/3 h-3.5 bg-slate-200 rounded" />
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
              <p className="text-slate-500 max-w-sm mx-auto">No customer service bookings fit the selected status filter at the moment.</p>
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
                        {(() => {
                          const bookingDispute = disputes.find(d => d.bookingId === booking.id);
                          if (bookingDispute) {
                            return (
                              <span className="inline-block mt-2 px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-bold rounded-md uppercase tracking-wider animate-pulse">
                                Dispute Raised ({bookingDispute.status})
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <span className={`px-2.5 py-0.5 border text-[10px] font-extrabold rounded-md uppercase tracking-wider ${getStatusStyle(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-100/50 p-3 rounded-2xl space-y-2 text-xs font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-indigo-500" />
                        <span>Client: {booking.clientName || `Customer #${booking.customerId}`}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-indigo-400" />
                        <span>{new Date(booking.startDt).toLocaleString()} - {new Date(booking.endDt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100/80 mt-6 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Amount Earned</span>
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
                        onClick={() => handleStartChat(booking.customerId)}
                        disabled={chatLoading}
                        className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 rounded-xl transition-colors"
                        title="Chat with Customer"
                      >
                        <MessageSquare size={16} />
                      </button>
                      {booking.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(booking.id, "ACCEPT")}
                            disabled={actionLoading}
                            className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            title="Accept Request"
                          >
                            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(booking.id, "REJECT")}
                            disabled={actionLoading}
                            className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            title="Reject Request"
                          >
                            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
                          </button>
                        </>
                      )}
                      {booking.status === "CONFIRMED" && (
                        <button
                          onClick={() => handleUpdateStatus(booking.id, "CANCEL")}
                          disabled={actionLoading}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-500 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {actionLoading ? <Loader2 size={12} className="animate-spin" /> : null}
                          Cancel & Refund
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
                {/* Client Contact Info */}
                <div className="bg-indigo-50/50 border border-indigo-100/50 p-4 rounded-2xl space-y-3">
                  <span className="text-[10px] text-indigo-600 uppercase tracking-wide font-extrabold block mb-1">Customer Details</span>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <User size={14} className="text-indigo-500" />
                    <span>Name: {selectedBooking.clientName || `Customer #${selectedBooking.customerId}`}</span>
                  </div>
                  {selectedBooking.clientEmail && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <Mail size={14} className="text-indigo-500" />
                      <span>Email: {selectedBooking.clientEmail}</span>
                    </div>
                  )}
                  {selectedBooking.clientPhone && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <Phone size={14} className="text-indigo-500" />
                      <span>Phone: {selectedBooking.clientPhone}</span>
                    </div>
                  )}
                </div>

                {/* Service Details */}
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

                {/* Info Grid */}
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
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide block mb-0.5">Start Date</span>
                    <span className="text-slate-800 text-xs font-bold">{new Date(selectedBooking.startDt).toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide block mb-0.5">End Date</span>
                    <span className="text-slate-800 text-xs font-bold">{new Date(selectedBooking.endDt).toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide block mb-0.5">Booked At</span>
                    <span className="text-slate-800 text-xs font-bold">{new Date(selectedBooking.bookedAt).toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide block mb-0.5">Cost</span>
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
                    onClick={() => handleStartChat(selectedBooking.customerId)}
                    className="flex-1 py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold border border-indigo-100 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare size={16} /> Chat Client
                  </button>

                  {selectedBooking.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(selectedBooking.id, "ACCEPT")}
                        disabled={actionLoading}
                        className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        {actionLoading ? <Loader2 className="animate-spin" size={16} /> : null}
                        {actionLoading ? "Accepting..." : "Accept"}
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(selectedBooking.id, "REJECT")}
                        disabled={actionLoading}
                        className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        {actionLoading ? <Loader2 className="animate-spin" size={16} /> : null}
                        {actionLoading ? "Rejecting..." : "Reject"}
                      </button>
                    </>
                  )}

                  {selectedBooking.status === "CONFIRMED" && (
                    <button
                      onClick={() => handleUpdateStatus(selectedBooking.id, "CANCEL")}
                      disabled={actionLoading}
                      className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                    >
                      {actionLoading ? <Loader2 className="animate-spin" size={16} /> : null}
                      {actionLoading ? "Cancelling..." : "Cancel & Refund"}
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
