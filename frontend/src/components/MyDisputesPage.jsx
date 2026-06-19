import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../lib/apiClient';
import { toast } from 'sonner';
import { 
  AlertTriangle, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle, 
  MessageSquare, 
  IndianRupee, 
  Scale, 
  Loader2, 
  ArrowRight,
  Info,
  Briefcase,
  X,
  MapPin
} from 'lucide-react';
import CloudsBackground from './CloudsBackground';
import PageTransition from './PageTransition';
import { motion, AnimatePresence } from 'framer-motion';

export default function MyDisputesPage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  // Booking details popup states
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [fetchingBooking, setFetchingBooking] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchDisputes();
    }
  }, [user]);

  const handleViewBooking = async (bookingId) => {
    try {
      setFetchingBooking(true);
      const res = await apiClient.get(`/api/bookings/${bookingId}`);
      const bookingData = res.data?.data || res.data;
      setSelectedBooking(bookingData);
      setShowBookingModal(true);
    } catch (err) {
      console.error("Error fetching booking details:", err);
      toast.error("Failed to load booking details");
    } finally {
      setFetchingBooking(false);
    }
  };

  const getBookingStatusStyle = (status) => {
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

  const fetchDisputes = async () => {
    try {
      setLoading(true);
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
      toast.error("Failed to load disputes");
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'IN_REVIEW':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CLOSED':
        return 'bg-slate-100 text-slate-600 border-slate-300';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  const formatDisputeType = (type) => {
    if (!type) return 'Other';
    return type.split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const filteredDisputes = disputes.filter(dispute => {
    if (filter === 'ALL') return true;
    return dispute.status === filter;
  });

  const handleStartChat = async (serviceId) => {
    if (!serviceId) return;
    try {
      toast.loading("Opening chat channel...");
      const res = await apiClient.post('/api/chat/conversations', { serviceId });
      const conversation = res.data?.data || res.data;
      navigate(`/chats?id=${conversation.id}`);
      toast.dismiss();
    } catch (err) {
      console.error("Error initiating chat:", err);
      toast.error("Failed to start chat with vendor");
    }
  };



  return (
    <CloudsBackground>
      <PageTransition className="flex-1 pt-32 pb-12 px-4 sm:px-6 lg:px-8 relative font-sans w-full min-h-screen z-10">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/50 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/80 shadow-sm">
                <Scale className="text-rose-600" size={24} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Disputes Center</h1>
                <p className="text-slate-500 font-medium text-sm mt-0.5">Track, review, and manage your booking disputes.</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 pb-2">
            {['ALL', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                  filter === status
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                    : 'bg-white/60 hover:bg-white text-slate-600 border-slate-200/60 backdrop-blur-sm'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-[1.8rem] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.02)] animate-pulse flex flex-col justify-between h-[260px]"
                >
                  <div className="space-y-4">
                    {/* Top Section */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100/60">
                      <div className="space-y-2 flex-1">
                        <div className="w-1/4 h-5 bg-slate-200 rounded" />
                        <div className="w-1/3 h-4 bg-slate-200 rounded" />
                      </div>
                      <div className="flex gap-2">
                        <div className="w-20 h-5 bg-slate-200 rounded-md" />
                        <div className="w-20 h-5 bg-slate-200 rounded-md" />
                      </div>
                    </div>
                    {/* Grid Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                      <div className="bg-slate-50/45 p-4 rounded-2xl border border-slate-100/60 h-24 flex flex-col justify-between">
                        <div className="w-12 h-3 bg-slate-200 rounded" />
                        <div className="w-20 h-4 bg-slate-200 rounded" />
                        <div className="w-28 h-3 bg-slate-200 rounded" />
                      </div>
                      <div className="md:col-span-2 space-y-3">
                        <div className="w-28 h-3.5 bg-slate-200 rounded" />
                        <div className="w-full h-12 bg-slate-200 rounded-xl" />
                      </div>
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
              {filteredDisputes.length === 0 ? (
                <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[2rem] p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
              <Scale className="text-slate-300 mx-auto mb-4" size={48} />
              <h2 className="text-xl font-bold text-slate-800 mb-2">No Disputes Found</h2>
              <p className="text-slate-500 max-w-sm mx-auto mb-6">If you have issues with bookings, you can file disputes directly from the My Bookings page.</p>
              <button 
                onClick={() => navigate('/my-bookings')}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all"
              >
                Go to My Bookings
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredDisputes.map((dispute) => {
                const isRaisedByMe = String(dispute.raisedByUserId) === String(user?.id);
                return (
                  <motion.div
                    key={dispute.id}
                    layout
                    className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Top section */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-slate-900 font-extrabold text-lg">
                              Dispute #{dispute.id}
                            </span>
                            <span className="text-xs text-slate-400 font-semibold">• Raised {dispute.createdAt ? new Date(dispute.createdAt).toLocaleString() : 'N/A'}</span>
                          </div>
                          <div className="text-sm font-bold text-slate-700 mt-0.5">
                            Type: <span className="text-indigo-600">{formatDisputeType(dispute.type)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 items-center">
                          <span className={`px-2.5 py-0.5 border text-[10px] font-extrabold rounded-md uppercase tracking-wider ${isRaisedByMe ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {isRaisedByMe ? 'Raised by Me' : 'Raised Against Me'}
                          </span>
                          <span className={`px-2.5 py-0.5 border text-[10px] font-extrabold rounded-md uppercase tracking-wider ${getStatusStyle(dispute.status)}`}>
                            {dispute.status}
                          </span>
                        </div>
                      </div>

                      {/* Content Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Booking Info */}
                        <div className="md:col-span-1 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wide block mb-1">Booking Info</span>
                            <span className="font-extrabold text-slate-800 text-sm block">Booking #{dispute.bookingId}</span>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <button
                              onClick={() => handleViewBooking(dispute.bookingId)}
                              disabled={fetchingBooking}
                              className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1 disabled:opacity-50"
                            >
                              {fetchingBooking ? 'Loading...' : 'View Booking Details'} <ArrowRight size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Dispute Details */}
                        <div className="md:col-span-2 space-y-4">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wide block mb-1">Reason Description</span>
                            <p className="text-slate-600 text-sm font-medium leading-relaxed bg-white/60 border border-slate-100 p-3 rounded-xl">
                              {dispute.reason}
                            </p>
                          </div>

                          {/* Resolution details */}
                          {(dispute.status === 'RESOLVED' || dispute.status === 'CLOSED') && (
                            <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl space-y-2">
                              <span className="text-[10px] text-emerald-600 uppercase tracking-wide font-extrabold block">Resolution Summary</span>
                              {dispute.resolvedAt && (
                                <div className="text-[11px] text-slate-400 font-semibold">
                                  Resolved On: {new Date(dispute.resolvedAt).toLocaleString()}
                                </div>
                              )}
                              <p className="text-slate-700 text-sm font-semibold mt-1">
                                {dispute.resolutionNote || "This dispute was closed by administrator."}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

        </div>
      </PageTransition>

      {/* Booking Details Modal */}
      <AnimatePresence>
        {showBookingModal && selectedBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setShowBookingModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-8 md:p-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                  <CheckCircle className="text-rose-600" size={24} /> Booking Details
                </h3>
                <button 
                  onClick={() => setShowBookingModal(false)}
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
                    <span className={`inline-block px-2.5 py-0.5 border text-[10px] font-extrabold rounded-md uppercase tracking-wider ${getBookingStatusStyle(selectedBooking.status)}`}>
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
                    <span className="text-slate-800 text-xs font-bold">{selectedBooking.bookedAt ? new Date(selectedBooking.bookedAt).toLocaleString() : 'N/A'}</span>
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
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all shadow-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </CloudsBackground>
  );
}
