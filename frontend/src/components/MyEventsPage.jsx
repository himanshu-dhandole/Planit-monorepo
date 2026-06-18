import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../lib/apiClient';
import { toast } from 'sonner';
import { 
  Calendar, 
  MapPin, 
  Edit, 
  Trash2, 
  AlertCircle, 
  Plus, 
  X, 
  Info,
  CalendarDays,
  Loader2,
  CheckCircle,
  Tag,
  IndianRupee
} from 'lucide-react';
import CloudsBackground from './CloudsBackground';
import PageTransition from './PageTransition';
import { motion, AnimatePresence } from 'framer-motion';

export default function MyEventsPage() {
  const navigate = useNavigate();
  const { customerProfile } = useContext(AuthContext);
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [eventBookings, setEventBookings] = useState({});
  const [bookingsLoading, setBookingsLoading] = useState({});
  
  // Create / Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    startDate: '',
    endDate: '',
    status: 'DRAFT'
  });

  // Booking Details Modal State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const getTodayString = (daysOffset = 0, hour = 9) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    d.setHours(hour, 0, 0, 0);
    const tzoffset = d.getTimezoneOffset() * 60000;
    return (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (customerProfile?.id) {
      fetchEvents();
    }
  }, [customerProfile]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/api/events/customer/${customerProfile.id}?page=0&size=100`);
      const data = res.data?.data?.content || res.data?.content || [];
      setEvents(data);
    } catch (err) {
      console.error("Error fetching events:", err);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const fetchEventBookings = async (eventId) => {
    try {
      setBookingsLoading(prev => ({ ...prev, [eventId]: true }));
      const res = await apiClient.get(`/api/events/booking/${eventId}?page=0&size=100`);
      const bookings = res.data?.data?.content || res.data?.content || [];
      setEventBookings(prev => ({ ...prev, [eventId]: bookings }));
    } catch (err) {
      console.error("Error fetching bookings for event:", err);
    } finally {
      setBookingsLoading(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const handleOpenBookingModal = (booking, eventId) => {
    setSelectedBooking({ ...booking, eventId });
    setShowBookingModal(true);
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    const isPending = selectedBooking.status === "PENDING";
    const endpoint = isPending 
      ? `/api/bookings/${selectedBooking.id}/cancel/before`
      : `/api/bookings/${selectedBooking.id}/cancel/after`;

    try {
      setCancelLoading(true);
      const res = await apiClient.post(endpoint);
      const updatedBooking = res.data?.data || res.data;
      toast.success("Booking cancelled successfully.");
      
      const eventId = selectedBooking.eventId;
      if (eventId) {
        setEventBookings(prev => ({
          ...prev,
          [eventId]: prev[eventId].map(b => b.id === selectedBooking.id ? { ...b, status: updatedBooking.status } : b)
        }));
      }
      
      setSelectedBooking(prev => ({ ...prev, status: updatedBooking.status }));
      setShowBookingModal(false);
    } catch (err) {
      console.error("Error cancelling booking:", err);
      toast.error(err.response?.data?.message || "Failed to cancel booking");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleToggleExpand = (eventId) => {
    if (expandedEventId === eventId) {
      setExpandedEventId(null);
    } else {
      setExpandedEventId(eventId);
      if (!eventBookings[eventId]) {
        fetchEventBookings(eventId);
      }
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      title: '',
      description: '',
      address: '',
      startDate: getTodayString(1, 9),
      endDate: getTodayString(1, 18),
      status: 'DRAFT'
    });
    setShowModal(true);
  };

  const openEditModal = (event) => {
    setModalMode('edit');
    setSelectedEventId(event.id);
    setFormData({
      title: event.title,
      description: event.description || '',
      address: event.address || '',
      startDate: event.startDate ? event.startDate.substring(0, 16) : getTodayString(1, 9),
      endDate: event.endDate ? event.endDate.substring(0, 16) : getTodayString(1, 18),
      status: event.status || 'DRAFT'
    });
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.startDate || !formData.endDate) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      const payload = {
        customerId: customerProfile.id,
        title: formData.title,
        description: formData.description,
        address: formData.address,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status
      };

      if (modalMode === 'create') {
        const res = await apiClient.post('/api/events/create', payload);
        toast.success("Event created successfully!");
        const created = res.data?.data || res.data;
        setEvents(prev => [...prev, created]);
      } else {
        const res = await apiClient.put(`/api/events/${selectedEventId}`, payload);
        toast.success("Event updated successfully!");
        const updated = res.data?.data || res.data;
        setEvents(prev => prev.map(ev => ev.id === selectedEventId ? updated : ev));
      }
      setShowModal(false);
    } catch (err) {
      console.error("Error saving event:", err);
      toast.error(err.response?.data?.message || "Failed to save event");
    }
  };

  const handleDeleteEvent = async (eventId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this event? This action will remove the event.")) {
      return;
    }

    try {
      await apiClient.delete(`/api/events/${eventId}`);
      toast.success("Event deleted.");
      setEvents(prev => prev.filter(ev => ev.id !== eventId));
    } catch (err) {
      console.error("Error deleting event:", err);
      toast.error("Failed to delete event");
    }
  };

  const handleCancelEvent = async (event, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to cancel this event? This will change status to CANCELLED.")) {
      return;
    }

    try {
      const payload = {
        customerId: customerProfile.id,
        title: event.title,
        description: event.description,
        address: event.address,
        startDate: event.startDate,
        endDate: event.endDate,
        status: 'CANCELLED'
      };
      const res = await apiClient.put(`/api/events/${event.id}`, payload);
      toast.success("Event cancelled.");
      const updated = res.data?.data || res.data;
      setEvents(prev => prev.map(ev => ev.id === event.id ? updated : ev));
    } catch (err) {
      console.error("Error cancelling event:", err);
      toast.error("Failed to cancel event");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'COMPLETED':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'PENDING_BOOKING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
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
      <PageTransition className="flex-1 pt-32 pb-12 px-4 sm:px-6 lg:px-8 relative font-sans w-full min-h-screen z-10">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/50 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/80 shadow-sm">
                <CalendarDays className="text-indigo-600" size={24} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">My Events</h1>
                <p className="text-slate-500 font-medium text-sm mt-0.5">Manage and monitor details of your curated events.</p>
              </div>
            </div>
            <button 
              onClick={openCreateModal}
              className="bg-indigo-600 text-white font-bold px-5 py-3 rounded-2xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <Plus size={18} /> Create Event
            </button>
          </div>

          {events.length === 0 ? (
            <div className="bg-white/60 backdrop-blur-xl border border-white rounded-[2rem] p-12 text-center shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
              <h2 className="text-xl font-bold text-slate-800 mb-2">No Events Scheduled</h2>
              <p className="text-slate-500 max-w-sm mx-auto mb-6">Create an event to start custom booking wedding organizers, caterers, decorators, or photographers.</p>
              <button 
                onClick={openCreateModal}
                className="px-5 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-all"
              >
                Create First Event
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const isExpanded = expandedEventId === event.id;
                const bookings = eventBookings[event.id] || [];
                const isBookingsLoading = bookingsLoading[event.id];

                return (
                  <motion.div
                    key={event.id}
                    layout="position"
                    className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all group overflow-hidden"
                  >
                    <div 
                      onClick={() => handleToggleExpand(event.id)}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-slate-800 text-xl group-hover:text-indigo-600 transition-colors">
                            {event.title}
                          </h3>
                          <span className={`px-2.5 py-0.5 border text-[10px] font-extrabold rounded-md uppercase tracking-wider ${getStatusStyle(event.status)}`}>
                            {event.status}
                          </span>
                        </div>
                        <p className="text-slate-500 text-sm">{event.description || "No description provided."}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400 pt-1">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} className="text-indigo-400" />
                            {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                          </span>
                          {event.address && (
                            <span className="flex items-center gap-1">
                              <MapPin size={14} className="text-indigo-400" />
                              {event.address}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start md:self-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditModal(event); }}
                          className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                          title="Edit Event"
                        >
                          <Edit size={16} />
                        </button>
                        {event.status !== 'CANCELLED' && event.status !== 'CONFIRMED' && (
                          <button
                            onClick={(e) => handleCancelEvent(event, e)}
                            className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-100 rounded-xl transition-colors"
                            title="Cancel Event"
                          >
                            <X size={16} />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteEvent(event.id, e)}
                          className="p-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors"
                          title="Delete Event"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Bookings / Services Expanded Area */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-6 border-t border-slate-100 pt-6"
                        >
                          <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-4">Booked Services</h4>
                          
                          {isBookingsLoading ? (
                            <div className="flex justify-center py-6">
                              <Loader2 className="animate-spin text-indigo-500" size={24} />
                            </div>
                          ) : bookings.length === 0 ? (
                            <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-100 rounded-2xl">
                              <p className="text-xs text-slate-400">No bookings associated with this event yet.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {bookings.map((booking) => (
                                <div 
                                  key={booking.id}
                                  onClick={() => handleOpenBookingModal(booking, event.id)}
                                  className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:border-indigo-300 hover:shadow-[0_4px_15px_rgb(0,0,0,0.02)] transition-all"
                                >
                                  <div>
                                    <span className="inline-block px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md uppercase tracking-wider mb-1">
                                      {booking.services?.category || "SERVICE"}
                                    </span>
                                    <h5 className="font-bold text-slate-800 text-sm">{booking.services?.name || "Service Item"}</h5>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Status: {booking.status}</p>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-slate-800 text-sm flex items-center justify-end">
                                      <IndianRupee size={12} className="text-slate-400 mr-0.5" />
                                      {booking.bookingAmount}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-semibold">
                                      {new Date(booking.startDt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </motion.div>
                );
              })}
            </div>
          )}

        </div>
      </PageTransition>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
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
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                  {modalMode === 'create' ? 'Create New Event' : 'Edit Event Details'}
                </h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Title *</label>
                  <input
                    type="text"
                    placeholder="E.g. Wedding Reception"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-sm font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Description</label>
                  <textarea
                    placeholder="Short description of the event details..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows="3"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-sm font-medium resize-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Address / Venue</label>
                  <input
                    type="text"
                    placeholder="E.g. Grand Palace Hall, Mumbai"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-sm font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">End Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                      required
                    />
                  </div>
                </div>

                {modalMode === 'edit' && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 block">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-sm font-semibold text-slate-700"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PENDING_BOOKING">Pending Booking</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-bold rounded-xl transition-all shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md"
                  >
                    Save Event
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Booking Details Modal */}
      <AnimatePresence>
        {showBookingModal && selectedBooking && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
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
                  <CheckCircle className="text-indigo-600" size={24} /> Booking Details
                </h3>
                <button 
                  onClick={() => setShowBookingModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Service Info Header */}
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

                {/* Details list */}
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

                {/* Cancel Booking Action */}
                {(selectedBooking.status === "PENDING" || selectedBooking.status === "CONFIRMED") && (
                  <button
                    onClick={handleCancelBooking}
                    disabled={cancelLoading}
                    className="w-full py-3.5 bg-rose-50 border border-rose-200 hover:border-rose-300 text-rose-600 font-bold rounded-2xl hover:bg-rose-100 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    {cancelLoading ? "Processing..." : "Cancel Booking Request"}
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
