import React, { useState, useEffect, useContext, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../lib/apiClient';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';
import { 
  Calendar, 
  MapPin, 
  Edit, 
  Trash2, 
  AlertCircle, 
  Plus, 
  X, 
  CalendarDays,
  Loader2,
  CheckCircle,
  IndianRupee,
  ChevronDown,
  Sparkles,
  ChevronUp,
  CreditCard,
  Crown
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

  const [mapContainer, setMapContainer] = useState(null);
  const mapRef = (node) => {
    setMapContainer(node);
  };
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);

  const fetchAddressFromCoords = async (lat, lng) => {
    const toastId = toast.loading("Fetching address details for this location...");
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "Planit-App-Geocoding"
          }
        }
      );
      
      if (!response.ok) throw new Error("Failed to fetch address");
      
      const data = await response.json();
      if (data && data.display_name) {
        setFormData(prev => ({
          ...prev,
          address: data.display_name
        }));

        toast.success("Address details auto-filled successfully!", {
          id: toastId,
          duration: 3000
        });
      } else {
        toast.dismiss(toastId);
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      toast.error("Could not fetch address details for this coordinate. Please type manually.", {
        id: toastId
      });
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (mapInstance.current && markerInstance.current) {
            mapInstance.current.setView([latitude, longitude], 14);
            markerInstance.current.setLatLng([latitude, longitude]);
          }
          fetchAddressFromCoords(latitude, longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Unable to retrieve GPS coordinates. Please select on the map manually.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser.");
    }
  };

  // Clean up map instance when modal closes
  useEffect(() => {
    if (!showModal && mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
      markerInstance.current = null;
    }
  }, [showModal]);

  // Leaflet Map Initialization
  useEffect(() => {
    let active = true;

    if (!showModal || !mapContainer) return;

    import('leaflet').then((L) => {
      if (!active || !mapContainer) return;

      import('leaflet/dist/images/marker-icon.png').then((icon) => {
        import('leaflet/dist/images/marker-icon-2x.png').then((icon2x) => {
          import('leaflet/dist/images/marker-shadow.png').then((shadow) => {
            if (!active) return;
            delete L.default.Icon.Default.prototype._getIconUrl;
            L.default.Icon.Default.mergeOptions({
              iconUrl: icon.default,
              iconRetinaUrl: icon2x.default,
              shadowUrl: shadow.default,
            });
          });
        });
      });

      let lat = 20.5937;
      let lng = 78.9629;
      let zoom = 5;

      const initializeMap = (startLat, startLng, startZoom) => {
        if (!mapInstance.current && mapContainer) {
          const map = L.default.map(mapContainer).setView([startLat, startLng], startZoom);
          L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);

          mapInstance.current = map;

          // Force layout recalculation for map inside modal container
          setTimeout(() => {
            if (map) map.invalidateSize();
          }, 200);

          const marker = L.default.marker([startLat, startLng], {
            draggable: true
          }).addTo(map);

          markerInstance.current = marker;

          marker.on('dragend', () => {
            const position = marker.getLatLng();
            fetchAddressFromCoords(position.lat, position.lng);
          });

          map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            marker.setLatLng([lat, lng]);
            fetchAddressFromCoords(lat, lng);
          });
        }
      };

      if (formData.address) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}&limit=1`)
          .then(res => res.json())
          .then(data => {
            if (active && data && data.length > 0) {
              const addressLat = parseFloat(data[0].lat);
              const addressLng = parseFloat(data[0].lon);
              initializeMap(addressLat, addressLng, 14);
            } else {
              initializeMap(lat, lng, zoom);
            }
          })
          .catch(() => {
            initializeMap(lat, lng, zoom);
          });
      } else {
        initializeMap(lat, lng, zoom);
      }
    });

    return () => {
      active = false;
    };
  }, [showModal, mapContainer]);

  // Booking Details Modal State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [formSaving, setFormSaving] = useState(false);

  // Disable body scroll when modal is active
  useEffect(() => {
    if (showModal || showBookingModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal, showBookingModal]);

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

  const handleOpenBookingModal = (booking, eventId, e) => {
    e.stopPropagation();
    setSelectedBooking({ ...booking, eventId });
    setShowBookingModal(true);
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    
    // We don't need a browser window.confirm anymore since the design is ultra-premium,
    // but to prevent accidents we'll keep it for now.
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

  const openEditModal = (event, e) => {
    e.stopPropagation();
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
      setFormSaving(true);
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
        setEvents(prev => [created, ...prev]);
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
    } finally {
      setFormSaving(false);
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
        return 'bg-green-50 text-green-700 border-green-200';
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'COMPLETED':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'PENDING_BOOKING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };



  return (
    <CloudsBackground>
      <PageTransition className="flex-1 pt-32 pb-12 px-4 sm:px-6 lg:px-8 relative font-sans w-full min-h-screen z-10">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header Section */}
          <div className="text-center pt-8 mb-16 relative">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight"
            >
              My Events
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-lg text-slate-600 font-medium max-w-2xl mx-auto mb-8"
            >
              Create, monitor, and manage your curated events perfectly.
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center"
            >
              <button 
                onClick={openCreateModal}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 px-8 py-3.5 text-base rounded-2xl font-bold transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Plus size={20} /> Create New Event
              </button>
            </motion.div>
          </div>

          {loading ? (
            <div className="space-y-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white/60 backdrop-blur-xl border border-gray-200/60 rounded-[2.5rem] p-6 md:p-8 shadow-[0_12px_40px_rgb(0,0,0,0.02)] animate-pulse space-y-6">
                  <div className="flex gap-5">
                    <div className="w-14 h-14 bg-gray-200 rounded-2xl shrink-0" />
                    <div className="space-y-3 flex-1">
                      <div className="w-20 h-4 bg-gray-200 rounded" />
                      <div className="w-1/3 h-7 bg-gray-200 rounded" />
                      <div className="w-full h-4 bg-gray-200 rounded" />
                      <div className="w-5/6 h-4 bg-gray-200 rounded" />
                    </div>
                  </div>
                  <div className="h-[1px] bg-gray-100/60 w-full" />
                  <div className="flex justify-between items-center">
                    <div className="flex gap-6">
                      <div className="w-24 h-4 bg-gray-200 rounded" />
                      <div className="w-24 h-4 bg-gray-200 rounded" />
                    </div>
                    <div className="w-24 h-8 bg-gray-200 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/80 backdrop-blur-2xl border border-white rounded-[3rem] p-16 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
            >
              <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-white shadow-sm rotate-3">
                <CalendarDays size={40} className="text-blue-400 -rotate-3" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 tracking-tight">No Events Scheduled</h2>
              <p className="text-gray-500 max-w-sm mx-auto mb-8 font-medium">
                Create an event to start custom booking wedding organizers, caterers, decorators, or photographers.
              </p>
              <button 
                onClick={openCreateModal}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-6 py-2.5 text-base rounded-xl font-semibold transition-all inline-flex items-center gap-2"
              >
                Create First Event <Plus size={16} />
              </button>
            </motion.div>
          ) : (
            <div className="space-y-8">
              <AnimatePresence>
                {events.map((event, index) => {
                  const isExpanded = expandedEventId === event.id;
                  const bookings = eventBookings[event.id] || [];
                  const isBookingsLoading = bookingsLoading[event.id];

                  return (
                    <motion.div
                      key={event.id}
                      layout
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05, duration: 0.75 }}
                      className="bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-6 lg:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-sm transition-all overflow-hidden group/container"
                    >
                      {/* Event Header & Actions */}
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 cursor-pointer" onClick={() => handleToggleExpand(event.id)}>
                        <div className="flex gap-5 flex-1">
                          <div className="space-y-1">
                            <span className={`inline-block px-2.5 py-0.5 border text-[10px] font-semibold rounded-md uppercase tracking-wider mb-2 ${getStatusStyle(event.status)}`}>
                              {event.status}
                            </span>
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight group-hover/container:text-blue-600 transition-colors">
                              {event.title}
                            </h2>
                            <p className="text-slate-600 text-sm font-medium mt-2 max-w-xl leading-relaxed">
                              {event.description || "No description provided."}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-semibold text-slate-500">
                              <span className="flex items-center gap-1.5">
                                <Calendar size={14} className="text-blue-400" />
                                {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                              </span>
                              {event.address && (
                                <span className="flex items-center gap-1.5">
                                  <MapPin size={14} className="text-blue-400" />
                                  {event.address}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Top Right Actions */}
                        <div className="flex items-center gap-2 md:self-start self-end shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={(e) => openEditModal(event, e)}
                            className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Edit Event"
                          >
                            <Edit size={18} />
                          </button>
                          {event.status !== 'CANCELLED' && event.status !== 'CONFIRMED' && (
                            <button
                              onClick={(e) => handleCancelEvent(event, e)}
                              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              title="Cancel Event"
                            >
                              <X size={18} />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDeleteEvent(event.id, e)}
                            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete Event"
                          >
                            <Trash2 size={18} />
                          </button>
                          
                          {/* Expand chevron */}
                          <div className="w-px h-6 bg-gray-200 mx-2 hidden md:block"></div>
                          
                          <button
                            onClick={() => handleToggleExpand(event.id)}
                            className="p-2.5 text-gray-400 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 transition-all hidden md:flex"
                          >
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Bookings Grid */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            className="border-t border-gray-100/80 pt-6 overflow-hidden"
                          >
                            <div className="flex items-center justify-between mb-6">
                              <h4 className="text-sm font-semibold text-gray-800 tracking-tight flex items-center gap-2">
                                <CreditCard size={18} className="text-blue-500" /> Booked Services
                              </h4>
                              {bookings.length > 0 && !isBookingsLoading && (
                                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                                  {bookings.length} Items
                                </span>
                              )}
                            </div>
                            
                            {isBookingsLoading ? (
                              <div className="flex justify-center py-12">
                                <Loader2 className="animate-spin text-blue-500" size={32} />
                              </div>
                            ) : bookings.length === 0 ? (
                              <div className="text-center py-12 bg-gray-50/50 border border-gray-100 rounded-[2rem]">
                                <Crown size={32} className="text-gray-300 mx-auto mb-3" />
                                <p className="text-sm font-semibold text-gray-500">No services booked for this event yet.</p>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); navigate('/services'); }}
                                  className="mt-4 px-4 py-2 bg-white text-blue-600 font-semibold border border-gray-200 rounded-xl shadow-sm hover:border-blue-200 text-xs transition-all"
                                >
                                  Browse Services
                                </button>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {bookings.map((booking) => (
                                  <motion.div 
                                    key={booking.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    onClick={(e) => handleOpenBookingModal(booking, event.id, e)}
                                    className="bg-gray-50 hover:bg-white border border-gray-100 hover:border-blue-100 p-5 rounded-[1.5rem] flex items-center justify-between cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all group/booking"
                                  >
                                    <div>
                                      <span className="inline-block px-2 py-0.5 bg-white border border-gray-200 text-gray-600 text-[9px] font-semibold rounded-md uppercase tracking-wider mb-2">
                                        {booking.services?.category || "SERVICE"}
                                      </span>
                                      <h5 className="font-semibold text-gray-800 text-base leading-tight group-hover/booking:text-blue-600 transition-colors">
                                        {booking.services?.name || "Service Item"}
                                      </h5>
                                      <p className="text-[10px] text-gray-400 font-semibold mt-1 uppercase tracking-wider">
                                        Status: <span className={booking.status === 'CONFIRMED' ? 'text-green-500' : 'text-gray-600'}>{booking.status}</span>
                                      </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <div className="font-semibold text-gray-900 text-lg flex items-center justify-end mb-1">
                                        <IndianRupee size={14} className="text-gray-400 mr-0.5" />
                                        {booking.bookingAmount.toLocaleString('en-IN')}
                                      </div>
                                      <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1 justify-end">
                                        <Calendar size={10} />
                                        {new Date(booking.startDt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

        </div>
      </PageTransition>

      {/* Modern Planit Style Create/Edit Modal */}
      {createPortal(
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowModal(false)}
              />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-[600px] bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-[2rem] p-8 md:p-10 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 tracking-tight flex items-center gap-2">
                  {modalMode === 'create' ? <Plus className="text-blue-600"/> : <Edit className="text-blue-600"/>}
                  {modalMode === 'create' ? 'Create New Event' : 'Edit Event Details'}
                </h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-5">
                <div>
                  <label className="text-[13px] font-medium text-gray-700 mb-2 block">Title *</label>
                  <input
                    type="text"
                    placeholder="E.g. The Grand Wedding Reception"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-sm font-semibold text-gray-800 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-gray-700 mb-2 block">Description</label>
                  <textarea
                    placeholder="Brief details about the event theme, expectations, etc."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows="3"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-sm font-semibold text-gray-800 resize-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-gray-700 mb-2 block">Address / Venue</label>
                  <input
                    type="text"
                    placeholder="E.g. Grand Palace Hall, Mumbai"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-sm font-semibold text-gray-800 transition-all"
                  />
                </div>

                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-lg text-sm font-semibold transition-all shadow-sm"
                  >
                    <MapPin size={16} /> Use Current GPS Location
                  </button>
                </div>

                <div>
                  <label className="text-[13px] font-medium text-gray-700 mb-2 block">Pinpoint Venue on Map</label>
                  <div 
                    ref={mapRef} 
                    className="w-full h-48 rounded-2xl border border-gray-200 overflow-hidden shadow-inner z-0 relative"
                    style={{ minHeight: '180px' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[13px] font-medium text-gray-700 mb-2 block">Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-xs font-semibold text-gray-800 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-gray-700 mb-2 block">End Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-xs font-semibold text-gray-800 transition-all"
                      required
                    />
                  </div>
                </div>

                {modalMode === 'edit' && (
                  <div>
                    <label className="text-[13px] font-medium text-gray-700 mb-2 block">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-sm font-semibold text-gray-800 transition-all"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PENDING_BOOKING">Pending Booking</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={formSaving}
                    className="flex-1 px-6 py-2.5 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-xl transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSaving}
                    className="flex-[1.5] px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-sm flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {formSaving ? (
                      <>
                        <Loader2 className="animate-spin text-white" size={18} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        {modalMode === 'create' ? 'Create Event' : 'Save Changes'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Booking Details Modal */}
      {createPortal(
        <AnimatePresence>
          {showBookingModal && selectedBooking && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setShowBookingModal(false)}
              />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-[600px] bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-[2rem] p-8 md:p-10 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 tracking-tight flex items-center gap-2">
                  <CheckCircle className="text-blue-600" size={24} /> Booking Details
                </h3>
                <button 
                  onClick={() => setShowBookingModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Service Info Header */}
                <div className="flex gap-5 items-center bg-gray-50 p-5 rounded-[1.5rem] border border-gray-100 shadow-sm">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-200 flex-shrink-0 shadow-sm">
                    {selectedBooking.services?.photos && selectedBooking.services.photos.length > 0 ? (
                      <img src={selectedBooking.services.photos[0]} alt={selectedBooking.services.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 font-semibold text-xs">
                        <Crown size={24} />
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="inline-block px-2.5 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 text-[9px] font-semibold rounded-md uppercase tracking-wider mb-1">
                      {selectedBooking.services?.category || "SERVICE"}
                    </span>
                    <h4 className="font-semibold text-gray-900 text-lg leading-tight">{selectedBooking.services?.name || "Service Item"}</h4>
                    {selectedBooking.services?.location && (
                      <p className="text-xs text-gray-500 font-semibold flex items-center gap-1 mt-1">
                        <MapPin size={12} className="text-blue-400" /> {selectedBooking.services.location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Details list */}
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-gray-500">
                  <div className="bg-white border border-gray-200 p-4 rounded-[1.25rem] shadow-sm">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Booking ID</span>
                    <span className="text-gray-800 text-sm font-semibold"># {selectedBooking.id}</span>
                  </div>
                  <div className="bg-white border border-gray-200 p-4 rounded-[1.25rem] shadow-sm">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Status</span>
                    <span className={`inline-block px-2.5 py-0.5 border text-[10px] font-semibold rounded-md uppercase tracking-wider ${getStatusStyle(selectedBooking.status)}`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                  <div className="bg-white border border-gray-200 p-4 rounded-[1.25rem] shadow-sm">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Start Date</span>
                    <span className="text-gray-800 text-xs font-semibold">{new Date(selectedBooking.startDt).toLocaleString()}</span>
                  </div>
                  <div className="bg-white border border-gray-200 p-4 rounded-[1.25rem] shadow-sm">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">End Date</span>
                    <span className="text-gray-800 text-xs font-semibold">{new Date(selectedBooking.endDt).toLocaleString()}</span>
                  </div>
                  <div className="col-span-2 bg-gray-50 border border-gray-200 p-5 rounded-[1.25rem] shadow-sm flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Total Amount Paid</span>
                      <span className="text-[10px] text-gray-400 block">Booked At: {new Date(selectedBooking.bookedAt).toLocaleDateString()}</span>
                    </div>
                    <span className="text-gray-900 text-2xl font-semibold flex items-center">
                      <IndianRupee size={18} className="text-gray-500 mr-0.5" />
                      {selectedBooking.bookingAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {selectedBooking.cancellationReason && (
                  <div className="bg-red-50 border border-red-100 p-5 rounded-2xl text-xs font-semibold text-red-600">
                    <span className="text-[10px] text-red-400 uppercase tracking-widest block mb-1.5">Cancellation Reason</span>
                    {selectedBooking.cancellationReason}
                  </div>
                )}

                {/* Cancel Booking Action */}
                {(selectedBooking.status === "PENDING" || selectedBooking.status === "CONFIRMED") && (
                  <button
                    onClick={handleCancelBooking}
                    disabled={cancelLoading}
                    className="w-full px-6 py-2.5 mt-2 bg-red-600 hover:bg-red-700 text-white shadow-sm font-semibold rounded-xl transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {cancelLoading ? <><Loader2 size={16} className="animate-spin"/> Processing</> : "Cancel Booking Request"}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </CloudsBackground>
  );
}
