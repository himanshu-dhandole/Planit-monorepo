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
  Crown,
  Book,
  Folder,
  FileText,
  CheckSquare,
  LayoutGrid,
  Menu,
  MoreHorizontal,
  ArrowDownUp,
  Search,
  Bell,
  User,
  ArrowRight,
  Lightbulb,
  MessageSquare,
  Info
} from 'lucide-react';
import CloudsBackground from './CloudsBackground';
import PageTransition from './PageTransition';
import { motion, AnimatePresence } from 'framer-motion';
import { Client } from '@stomp/stompjs';
import WalletPage from './WalletPage';
import ChatPage from './ChatPage';
import { FileUploaderRegular } from '@uploadcare/react-uploader';
import '@uploadcare/react-uploader/core.css';

export default function MyEventsPage() {
  const navigate = useNavigate();
  const { customerProfile } = useContext(AuthContext);
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [eventBookings, setEventBookings] = useState({});
  const [bookingsLoading, setBookingsLoading] = useState({});
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [tasks, setTasks] = useState({});
  const [schedule, setSchedule] = useState({});
  const [newTaskText, setNewTaskText] = useState('');
  const [taskAttachmentUrl, setTaskAttachmentUrl] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState('');

  const stompClientRef = useRef(null);
  const taskSubRef = useRef(null);

  const fetchTasksForEvent = async (eventId) => {
    try {
      const res = await apiClient.get(`/api/events/booking/${eventId}?page=0&size=100`);
      const bookings = res.data?.data?.content || res.data?.content || [];
      setEventBookings(prev => ({ ...prev, [eventId]: bookings }));
      
      if (bookings.length > 0) {
        setSelectedBookingId(bookings[0].id.toString());
      } else {
        setSelectedBookingId('');
      }

      const allTasks = [];
      for (const booking of bookings) {
        try {
          const taskRes = await apiClient.get(`/api/tasks/booking/${booking.id}`);
          const bookingTasks = taskRes.data || [];
          bookingTasks.forEach(t => {
            t.booking = booking;
          });
          allTasks.push(...bookingTasks);
        } catch (taskErr) {
          console.error("Error fetching tasks for booking " + booking.id, taskErr);
        }
      }
      setTasks(prev => ({ ...prev, [eventId]: allTasks }));
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  useEffect(() => {
    if (selectedEvent?.id) {
      const storedSchedule = localStorage.getItem(`event_schedule_${selectedEvent.id}`);
      if (storedSchedule) {
        setSchedule(prev => ({ ...prev, [selectedEvent.id]: JSON.parse(storedSchedule) }));
      } else {
        const defaultSchedule = [
          { id: 's1', stage: 'Morning Setup', time: '8 AM', text: 'Vendor Arrival', completed: false },
          { id: 's2', stage: 'Main Event', time: '4 PM', text: 'Guests Arrive', completed: false },
          { id: 's3', stage: 'Main Event', time: '6 PM', text: 'Dinner Service', completed: false }
        ];
        setSchedule(prev => ({ ...prev, [selectedEvent.id]: defaultSchedule }));
        localStorage.setItem(`event_schedule_${selectedEvent.id}`, JSON.stringify(defaultSchedule));
      }

      fetchTasksForEvent(selectedEvent.id);
    }
  }, [selectedEvent]);

  useEffect(() => {
    if (!selectedEvent?.id) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const brokerURL = `${protocol}//${window.location.host}/ws`;

    const client = new Client({
      brokerURL: brokerURL,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => console.log('[Task WS Debug]', str),
    });

    client.onConnect = () => {
      console.log('Task WebSocket connected');
      stompClientRef.current = client;

      const dest = `/topic/event-tasks/${selectedEvent.id}`;
      taskSubRef.current = client.subscribe(dest, (message) => {
        console.log("WebSocket task update notification received for event " + selectedEvent.id);
        fetchTasksForEvent(selectedEvent.id);
      });
    };

    client.onDisconnect = () => {
      console.log('Task WebSocket disconnected');
      stompClientRef.current = null;
    };

    client.activate();

    return () => {
      if (taskSubRef.current) {
        taskSubRef.current.unsubscribe();
        taskSubRef.current = null;
      }
      client.deactivate();
    };
  }, [selectedEvent?.id]);

  const saveSchedule = (eventId, updatedSchedule) => {
    setSchedule(prev => ({ ...prev, [eventId]: updatedSchedule }));
    localStorage.setItem(`event_schedule_${eventId}`, JSON.stringify(updatedSchedule));
  };

  const handleToggleTask = async (taskId) => {
    try {
      const res = await apiClient.put(`/api/tasks/${taskId}/toggle`);
      const updatedTask = res.data;
      setTasks(prev => ({
        ...prev,
        [selectedEvent.id]: prev[selectedEvent.id].map(t => t.id === taskId ? { ...t, completed: updatedTask.completed } : t)
      }));
      toast.success("Task status updated.");
    } catch (err) {
      console.error("Error toggling task:", err);
      toast.error("Failed to update task status.");
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    if (!selectedBookingId) {
      toast.error("Please book a vendor first before assigning tasks.");
      return;
    }

    try {
      const res = await apiClient.post('/api/tasks', {
        bookingId: parseInt(selectedBookingId),
        title: newTaskText.trim(),
        description: "Task for vendor service assigned by Customer.",
        priority: false,
        attachmentUrl: taskAttachmentUrl || null,
        dueDate: new Date(Date.now() + 5*24*60*60*1000).toISOString()
      });

      const created = res.data;
      const targetBooking = (eventBookings[selectedEvent.id] || []).find(b => b.id === parseInt(selectedBookingId));
      created.booking = targetBooking;

      setTasks(prev => ({
        ...prev,
        [selectedEvent.id]: [...(prev[selectedEvent.id] || []), created]
      }));
      setNewTaskText('');
      setTaskAttachmentUrl('');
      toast.success("Task assigned successfully.");
    } catch (err) {
      console.error("Error creating task:", err);
      toast.error("Failed to create task.");
    }
  };
  
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
  const [chatLoading, setChatLoading] = useState(false);
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

  const handleStartChat = async (serviceId) => {
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

  const handleOpenBookingModal = (booking, eventId, e) => {
    e.stopPropagation();
    setSelectedBooking({ ...booking, eventId });
    setShowBookingModal(true);
  };

  const handleCancelBooking = async (bookingToCancel) => {
    const target = bookingToCancel || selectedBooking;
    if (!target) return;
    
    // We don't need a browser window.confirm anymore since the design is ultra-premium,
    // but to prevent accidents we'll keep it for now.
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    const isPending = target.status === "PENDING";
    const endpoint = isPending 
      ? `/api/bookings/${target.id}/cancel/before`
      : `/api/bookings/${target.id}/cancel/after`;

    try {
      setCancelLoading(true);
      const res = await apiClient.post(endpoint);
      const updatedBooking = res.data?.data || res.data;
      toast.success("Booking cancelled successfully.");
      
      const eventId = target.eventId || selectedEvent?.id;
      if (eventId) {
        setEventBookings(prev => ({
          ...prev,
          [eventId]: prev[eventId].map(b => b.id === target.id ? { ...b, status: updatedBooking.status } : b)
        }));
      }
      
      if (selectedBooking && selectedBooking.id === target.id) {
        setSelectedBooking(prev => ({ ...prev, status: updatedBooking.status }));
        setShowBookingModal(false);
      }
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



  return (
    <CloudsBackground>
      <PageTransition className="flex-1 pt-32 pb-12 px-4 sm:px-6 lg:px-8 relative font-sans w-full min-h-screen z-10 flex flex-col justify-start">
        {selectedEvent ? (
          <div className="max-w-6xl mx-auto w-full bg-white rounded-[2rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15),0_10px_30px_-5px_rgba(0,0,0,0.1)] border border-white/60 overflow-hidden flex flex-col md:flex-row min-h-[700px]">
            
            {/* LEFT SIDEBAR */}
            <div className="w-full md:w-64 bg-[#F5F4F3] border-b md:border-b-0 md:border-r border-gray-200/60 flex flex-col py-6 shrink-0 text-left">
              {/* Back to all events link */}
              <div className="px-4 mb-4">
                <button 
                  onClick={() => { setSelectedEvent(null); setSearchQuery(''); }}
                  className="text-xs text-gray-500 hover:text-indigo-600 font-bold flex items-center gap-1.5 transition-colors"
                >
                  &larr; Back to All Events
                </button>
              </div>

              {/* Active Event Selector Card */}
              <div className="px-4 mb-6">
                <div className="flex items-center gap-3 bg-white px-3 py-3 rounded-2xl shadow-sm border border-gray-100/80 hover:shadow-md transition-shadow relative group">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-yellow-300 to-orange-400 flex items-center justify-center text-white text-sm font-black shadow-sm shrink-0">
                    {selectedEvent.title?.charAt(0) || 'E'}
                  </div>
                  <span className="text-sm font-bold text-gray-800 flex-1 truncate">{selectedEvent.title}</span>
                  <div className="flex -space-x-1 shrink-0">
                    <div className="w-4.5 h-4.5 rounded-full bg-pink-100 border-2 border-white z-10"></div>
                    <div className="w-4.5 h-4.5 rounded-full bg-blue-100 border-2 border-white"></div>
                  </div>
                </div>
              </div>

              {/* Navigation list */}
              <div className="flex-1 px-3 space-y-6">
                <div>
                  <nav className="space-y-0.5">
                    <button 
                      onClick={() => setActiveTab('dashboard')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white text-gray-900 shadow-sm border border-gray-100/80' : 'text-gray-600 hover:bg-gray-200/40 hover:text-gray-900'}`}
                    >
                      <FileText size={16} className={activeTab === 'dashboard' ? 'text-indigo-600' : 'text-gray-400'} />
                      Dashboard
                    </button>
                    <button 
                      onClick={() => { setActiveTab('bookings'); setSearchQuery(''); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'bookings' && !searchQuery ? 'bg-white text-gray-900 shadow-sm border border-gray-100/80' : 'text-gray-600 hover:bg-gray-200/40 hover:text-gray-900'}`}
                    >
                      <CheckSquare size={16} className={activeTab === 'bookings' && !searchQuery ? 'text-indigo-600' : 'text-gray-400'} />
                      Bookings
                    </button>
                    <button 
                      onClick={() => setActiveTab('calendar')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'calendar' ? 'bg-white text-gray-900 shadow-sm border border-gray-100/80' : 'text-gray-600 hover:bg-gray-200/40 hover:text-gray-900'}`}
                    >
                      <Calendar size={16} className={activeTab === 'calendar' ? 'text-indigo-600' : 'text-gray-400'} />
                      Calendar
                    </button>
                    <button 
                      onClick={() => setActiveTab('wallet')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'wallet' ? 'bg-white text-gray-900 shadow-sm border border-gray-100/80' : 'text-gray-600 hover:bg-gray-200/40 hover:text-gray-900'}`}
                    >
                      <CreditCard size={16} className={activeTab === 'wallet' ? 'text-indigo-600' : 'text-gray-400'} />
                      Wallet
                    </button>
                    <button 
                      onClick={() => setActiveTab('chats')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'chats' ? 'bg-white text-gray-900 shadow-sm border border-gray-100/80' : 'text-gray-600 hover:bg-gray-200/40 hover:text-gray-900'}`}
                    >
                      <MessageSquare size={16} className={activeTab === 'chats' ? 'text-indigo-600' : 'text-gray-400'} />
                      Chats
                    </button>
                  </nav>
                </div>

                {/* VENDORS Section */}
                <div>
                  <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Vendors</h3>
                  <nav className="space-y-0.5">
                    <button 
                      onClick={() => { setActiveTab('bookings'); setSearchQuery('CATERING'); }}
                      className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'bookings' && searchQuery === 'CATERING' ? 'bg-white text-gray-900 shadow-sm border border-gray-100/80' : 'text-gray-600 hover:bg-gray-200/40 hover:text-gray-900'}`}
                    >
                      <Book size={16} className="text-gray-400 shrink-0" />
                      Caterers
                    </button>
                    <button 
                      onClick={() => { setActiveTab('bookings'); setSearchQuery('VENUE'); }}
                      className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'bookings' && searchQuery === 'VENUE' ? 'bg-white text-gray-900 shadow-sm border border-gray-100/80' : 'text-gray-600 hover:bg-gray-200/40 hover:text-gray-900'}`}
                    >
                      <Lightbulb size={16} className="text-gray-400 shrink-0" />
                      Venues
                    </button>
                  </nav>
                </div>

                {/* RENTALS Section */}
                <div>
                  <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Rentals</h3>
                  <nav className="space-y-0.5">
                    <button 
                      onClick={() => { setActiveTab('bookings'); setSearchQuery('TRANSPORT'); }}
                      className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'bookings' && searchQuery === 'TRANSPORT' ? 'bg-white text-gray-900 shadow-sm border border-gray-100/80' : 'text-gray-600 hover:bg-gray-200/40 hover:text-gray-900'}`}
                    >
                      <Folder size={16} className="text-gray-400 shrink-0" />
                      Equipment
                    </button>
                    <button 
                      onClick={() => { setActiveTab('bookings'); setSearchQuery('SERVICES'); }}
                      className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${activeTab === 'bookings' && searchQuery === 'SERVICES' ? 'bg-white text-gray-900 shadow-sm border border-gray-100/80' : 'text-gray-600 hover:bg-gray-200/40 hover:text-gray-900'}`}
                    >
                      <Folder size={16} className="text-gray-400 shrink-0" />
                      Services
                    </button>
                  </nav>
                </div>
              </div>

              {/* New Event Button inside Sidebar */}
              <div className="px-4 mt-6">
                <button 
                  onClick={openCreateModal}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white text-xs font-bold py-3.5 rounded-xl transition-all shadow-sm"
                >
                  <Plus size={14} /> New Event
                </button>
              </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 bg-white p-6 md:p-8 flex flex-col text-left overflow-y-auto">
              {/* Header bar */}
              <div className="flex items-center justify-between pb-6 border-b border-gray-100 mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Plus size={24} className="text-gray-300" />
                  {activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'bookings' ? 'Bookings' : activeTab === 'calendar' ? 'Calendar' : activeTab === 'wallet' ? 'Wallet' : activeTab === 'chats' ? 'Chats' : ''}
                </h2>
                
                <div className="flex items-center gap-4 text-gray-400">
                  <LayoutGrid size={20} className="hover:text-gray-700 cursor-pointer transition-colors" />
                  <Menu size={20} className="hover:text-gray-700 cursor-pointer transition-colors" />
                  <MoreHorizontal size={20} className="hover:text-gray-700 cursor-pointer transition-colors" />
                  <ArrowDownUp size={18} className="hover:text-gray-700 cursor-pointer transition-colors ml-1" />
                </div>
              </div>

              {/* RENDER VIEWS BY ACTIVE TAB */}
              {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  
                  {/* Card 1: Recent Messages */}
                  <div className="bg-[#FFF0F3] border border-[#FFE3E8] rounded-3xl p-5 hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-gray-800 mb-4 text-base">Recent Messages</h3>
                    <div className="space-y-4">
                      {eventBookings[selectedEvent.id]?.length > 0 ? (
                        <>
                          <div 
                            onClick={() => navigate('/chats')} 
                            className="bg-[#FF91A4] text-white p-3.5 rounded-2xl text-xs font-semibold shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer"
                          >
                            <p className="font-bold truncate">Catering Request</p>
                            <p className="text-[10px] text-white/90 mt-0.5">{eventBookings[selectedEvent.id][0].services?.name}</p>
                          </div>
                          <p className="text-[11px] text-gray-500 italic leading-relaxed px-1 font-medium">
                            "We can accommodate the vegan menu requests for 50 guests."
                          </p>
                          {eventBookings[selectedEvent.id][1] && (
                            <div 
                              onClick={() => navigate('/chats')} 
                              className="bg-[#95D5B2] text-white p-3.5 rounded-2xl text-xs font-semibold shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all cursor-pointer"
                            >
                              <p className="font-bold truncate">Equipment Inquiry</p>
                              <p className="text-[10px] text-white/90 mt-0.5">{eventBookings[selectedEvent.id][1].services?.name}</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="bg-[#FF91A4] text-white p-3.5 rounded-2xl text-xs font-semibold shadow-sm hover:scale-[1.02] transition-all cursor-pointer">
                            <p className="font-bold">Catering Inquiry</p>
                            <p className="text-[10px] text-white/90 mt-0.5">Taste of Italy</p>
                          </div>
                          <p className="text-[11px] text-gray-500 italic leading-relaxed px-1 font-medium">
                            "We can accommodate the vegan menu requests for 50 guests."
                          </p>
                          <div className="bg-[#95D5B2] text-white p-3.5 rounded-2xl text-xs font-semibold shadow-sm hover:scale-[1.02] transition-all cursor-pointer">
                            <p className="font-bold">Equipment Rental</p>
                            <p className="text-[10px] text-white/90 mt-0.5">Pro AV Solutions</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Event Schedule */}
                  <div className="bg-white border border-gray-150 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-gray-800 mb-4 text-base">Event Schedule</h3>
                    <div className="space-y-4">
                      {schedule[selectedEvent.id]?.map((item) => (
                        <div key={item.id} className="space-y-1.5">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.stage}</p>
                          <label className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={item.completed}
                              onChange={() => {
                                const updated = schedule[selectedEvent.id].map(s => s.id === item.id ? { ...s, completed: !s.completed } : s);
                                saveSchedule(selectedEvent.id, updated);
                              }}
                              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                            />
                            <span className={item.completed ? 'line-through text-gray-400' : ''}>
                              {item.text} ({item.time})
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card 3: New Vendor Request */}
                  <div className="bg-[#FEF9D9] border border-[#FBEBB5] rounded-3xl p-5 hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-gray-800 mb-4 text-base">New Vendor Request</h3>
                    <div className="space-y-4 text-xs font-medium text-gray-700 leading-relaxed">
                      {eventBookings[selectedEvent.id]?.length > 0 ? (
                        <>
                          <p className="font-bold text-[10px] text-yellow-800/80 uppercase tracking-widest">Active Bookings Status</p>
                          <div className="space-y-2">
                            {eventBookings[selectedEvent.id].slice(0, 2).map((booking) => (
                              <div key={booking.id} className="bg-white/80 p-2.5 rounded-xl border border-yellow-200/50">
                                <p className="font-bold text-gray-800 truncate">{booking.services?.name}</p>
                                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">{booking.status}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="font-bold text-[10px] text-yellow-800/80 uppercase tracking-widest">Status: Pending Approval</p>
                          <p className="text-[11px] text-yellow-900/80 leading-relaxed">A new vendor has applied to join the marketplace and offer peer-to-peer equipment rentals.</p>
                          <div className="pt-2 border-t border-yellow-200/40">
                            <p className="font-bold text-gray-800 mb-1">Vendor Details</p>
                            <p className="text-[11px] text-gray-600 font-semibold leading-relaxed">
                              Name: DJ Sparkle<br/>
                              Service: Audio Equipment Rental<br/>
                              Location: Downtown Area
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Card 4: Event Tasks */}
                  <div className="bg-[#E6F4EA] border border-[#CEEAD6] rounded-3xl p-5 hover:shadow-md transition-shadow flex flex-col justify-between min-h-[280px]">
                    <div>
                      <h3 className="font-bold text-gray-800 mb-3 text-base">Event Tasks</h3>
                      <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                        {(!tasks[selectedEvent.id] || tasks[selectedEvent.id].length === 0) ? (
                          <p className="text-[11px] text-gray-400 italic text-center py-4">No tasks created yet.</p>
                        ) : (
                          tasks[selectedEvent.id]?.map((task) => (
                            <div key={task.id} className="flex items-center justify-between gap-2">
                              <label className="flex items-start gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none flex-1 min-w-0">
                                <input 
                                  type="checkbox"
                                  checked={task.completed || false}
                                  onChange={() => handleToggleTask(task.id)}
                                  className="w-4 h-4 rounded border-green-400 text-green-600 focus:ring-green-500 cursor-pointer mt-0.5 shrink-0"
                                />
                                <div className="flex flex-col min-w-0 text-left">
                                  <span className={`text-slate-800 font-bold ${task.completed ? 'line-through text-slate-400 font-normal' : ''}`}>
                                    {task.title}
                                  </span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {task.booking?.services?.name && (
                                      <span className="text-[8px] text-green-700 uppercase font-black tracking-wide">
                                        @{task.booking.services.name}
                                      </span>
                                    )}
                                    {task.attachmentUrl && (
                                      <a 
                                        href={task.attachmentUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-[8px] text-indigo-600 hover:underline font-extrabold uppercase flex items-center gap-0.5"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        [File]
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    
                    {/* Add Task Input Form */}
                    {(eventBookings[selectedEvent.id] && eventBookings[selectedEvent.id].length > 0) ? (
                      <form 
                        onSubmit={handleAddTask}
                        className="mt-4 pt-3 border-t border-green-200/50 flex flex-col gap-2"
                      >
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            placeholder="Add custom task..."
                            className="flex-1 min-w-0 bg-white/70 border border-green-300/40 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-green-500 text-gray-800 font-semibold"
                            required
                          />
                          <button 
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white p-1.5 rounded-xl transition-colors shrink-0"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-green-700 font-black uppercase tracking-wider shrink-0">For:</span>
                          <select
                            value={selectedBookingId}
                            onChange={(e) => setSelectedBookingId(e.target.value)}
                            className="flex-1 min-w-0 bg-white/80 border border-green-300/30 rounded-lg px-2 py-1 text-[10px] outline-none focus:ring-1 focus:ring-green-500 text-slate-700 font-bold"
                          >
                            {(eventBookings[selectedEvent.id] || []).map(b => (
                              <option key={b.id} value={b.id.toString()}>
                                {b.services?.name || "Service ID: " + b.id}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col gap-1 mt-1">
                          <span className="text-[9px] text-green-700 font-black uppercase tracking-wider text-left">Attachment (PDF/Image):</span>
                          <div className="flex items-center gap-2">
                            <FileUploaderRegular
                              key={`task-upload-${taskAttachmentUrl ? 'has-file' : 'empty'}`}
                              pubkey="demopublickey"
                              onChange={(e) => {
                                const successfulFiles = e.allEntries.filter((file) => file.status === "success");
                                if (successfulFiles.length > 0) {
                                  setTaskAttachmentUrl(successfulFiles[0].cdnUrl);
                                  toast.success("Attachment uploaded successfully!");
                                }
                              }}
                            />
                            {taskAttachmentUrl && (
                              <span className="text-[9px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded">
                                Uploaded!
                              </span>
                            )}
                          </div>
                        </div>
                      </form>
                    ) : (
                      <div className="mt-4 pt-3 border-t border-green-200/50 text-center">
                        <p className="text-[10px] text-green-800/80 font-black uppercase tracking-wider leading-relaxed">
                          Hire a vendor to unlock collaborative tasks
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bookings View inside Dashboard */}
              {activeTab === 'bookings' && (
                <div>
                  {(() => {
                    const currentBookings = eventBookings[selectedEvent.id] || [];
                    const filtered = currentBookings.filter(b => {
                      const category = b.services?.category;
                      if (searchQuery === 'CATERING') return category === 'CATERING';
                      if (searchQuery === 'VENUE') return category === 'VENUE';
                      if (searchQuery === 'TRANSPORT') return category === 'TRANSPORT' || category === 'LOGISTICS' || category === 'TRANSPORTATION';
                      if (searchQuery === 'SERVICES') return category !== 'CATERING' && category !== 'VENUE' && category !== 'TRANSPORT' && category !== 'LOGISTICS' && category !== 'TRANSPORTATION';
                      return true;
                    });
                    
                    const isBookingsLoading = bookingsLoading[selectedEvent.id];

                    return (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{searchQuery ? `${searchQuery} bookings` : 'All bookings'}</span>
                          {searchQuery && (
                            <button 
                              onClick={() => setSearchQuery('')}
                              className="text-xs text-indigo-600 hover:underline font-bold"
                            >
                              Show All Bookings
                            </button>
                          )}
                        </div>
                        
                        {isBookingsLoading ? (
                          <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-indigo-500" size={32} />
                          </div>
                        ) : filtered.length === 0 ? (
                          <div className="text-center py-12 bg-slate-50 border border-slate-100 rounded-3xl">
                            <Crown size={32} className="text-slate-300 mx-auto mb-3" />
                            <p className="text-sm font-semibold text-slate-500">No services booked for this category.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {filtered.map((booking) => (
                              <div 
                                key={booking.id}
                                className="bg-white border border-slate-200/80 hover:border-indigo-150 p-5 rounded-[1.75rem] flex flex-col justify-between hover:shadow-md transition-all group/booking relative overflow-hidden"
                              >
                                <div className="flex gap-4 items-start">
                                  {/* Service Photo */}
                                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 flex-shrink-0 shadow-sm relative">
                                    {booking.services?.photos && booking.services.photos.length > 0 ? (
                                      <img src={booking.services.photos[0]} alt={booking.services.name} className="w-full h-full object-cover group-hover/booking:scale-105 transition-transform duration-300" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50 font-bold">
                                        <Crown size={20} className="text-slate-400" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-extrabold rounded-md uppercase tracking-wider">
                                        {booking.services?.category || "SERVICE"}
                                      </span>
                                      <span className={`px-2 py-0.5 border text-[9px] font-extrabold rounded-md uppercase tracking-wider ${getStatusStyle(booking.status)}`}>
                                        {booking.status}
                                      </span>
                                    </div>
                                    <h5 className="font-extrabold text-slate-800 text-sm md:text-base leading-tight truncate">
                                      {booking.services?.name || "Service Item"}
                                    </h5>
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold mt-1.5">
                                      <Calendar size={11} className="text-indigo-400" />
                                      <span>{new Date(booking.startDt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Divider */}
                                <div className="h-[1px] bg-slate-100 my-4" />

                                {/* Price and Action Buttons */}
                                <div className="flex items-center justify-between mt-auto">
                                  <div>
                                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Total Price</span>
                                    <div className="font-black text-slate-900 text-base flex items-center">
                                      <IndianRupee size={12} className="text-slate-400 mr-0.5" />
                                      {booking.bookingAmount.toLocaleString('en-IN')}
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={(e) => handleOpenBookingModal(booking, selectedEvent.id, e)}
                                      className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200/60 rounded-xl transition-all"
                                      title="View Details"
                                    >
                                      <Info size={14} />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartChat(booking.services?.id);
                                      }}
                                      disabled={chatLoading}
                                      className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100/80 rounded-xl transition-all disabled:opacity-50"
                                      title="Chat with Vendor"
                                    >
                                      <MessageSquare size={14} />
                                    </button>
                                    {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCancelBooking(booking);
                                        }}
                                        disabled={cancelLoading}
                                        className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-500 text-[10px] font-bold rounded-xl transition-all disabled:opacity-50"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Calendar View inside Dashboard */}
              {activeTab === 'calendar' && (
                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 md:p-8 space-y-6">
                  <div className="flex gap-4 items-center bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm shrink-0">
                      <CalendarDays size={24} className="text-indigo-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">{selectedEvent.title} Timeline</h4>
                      <p className="text-xs text-gray-500 font-semibold mt-1 leading-relaxed">
                        Event starts on <span className="text-slate-800 font-bold">{new Date(selectedEvent.startDate).toLocaleString()}</span> and ends on <span className="text-slate-800 font-bold">{new Date(selectedEvent.endDate).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                  
                  {/* Styled Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Start Date</span>
                      <span className="text-xl font-black text-indigo-600 block">{new Date(selectedEvent.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span className="text-xs text-slate-500 font-bold mt-1 block">{new Date(selectedEvent.startDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">End Date</span>
                      <span className="text-xl font-black text-indigo-600 block">{new Date(selectedEvent.endDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span className="text-xs text-slate-500 font-bold mt-1 block">{new Date(selectedEvent.endDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'wallet' && (
                <div className="w-full">
                  <WalletPage embedded={true} />
                </div>
              )}

              {activeTab === 'chats' && (
                <div className="w-full flex-1 flex flex-col min-h-[500px]">
                  <ChatPage embedded={true} />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 border-b border-slate-200/60 pb-6 text-left">
              <div className="text-left relative">
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight flex items-center gap-4"
                >
                  <div className="w-14 h-14 bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm flex items-center justify-center -rotate-3 border border-slate-200 shrink-0">
                    <CalendarDays size={28} className="text-indigo-600" />
                  </div>
                  My Events
                </motion.h1>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4 text-base md:text-lg text-slate-600 font-medium max-w-xl"
                >
                  Create, monitor, and manage your curated events perfectly.
                </motion.p>
              </div>

              <div className="flex flex-col items-end gap-4">
                <button 
                  onClick={openCreateModal}
                  disabled={loading}
                  className="bg-slate-900 text-white font-bold px-6 py-3.5 rounded-2xl hover:bg-black transition-all flex items-center gap-2 shadow-lg hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={18} /> New Event
                </button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-8">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-[2.5rem] p-6 md:p-8 shadow-[0_12px_40px_rgb(0,0,0,0.02)] animate-pulse space-y-6">
                    <div className="flex gap-5">
                      <div className="w-14 h-14 bg-slate-200 rounded-2xl shrink-0" />
                      <div className="space-y-3 flex-1">
                        <div className="w-20 h-4 bg-slate-200 rounded" />
                        <div className="w-1/3 h-7 bg-slate-200 rounded" />
                        <div className="w-full h-4 bg-slate-200 rounded" />
                        <div className="w-5/6 h-4 bg-slate-200 rounded" />
                      </div>
                    </div>
                    <div className="h-[1px] bg-slate-100/60 w-full" />
                    <div className="flex justify-between items-center">
                      <div className="flex gap-6">
                        <div className="w-24 h-4 bg-slate-200 rounded" />
                        <div className="w-24 h-4 bg-slate-200 rounded" />
                      </div>
                      <div className="w-24 h-8 bg-slate-200 rounded-xl" />
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
                <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-white shadow-sm rotate-3">
                  <CalendarDays size={40} className="text-indigo-400 -rotate-3" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-800 mb-4 tracking-tight">No Events Scheduled</h2>
                <p className="text-slate-500 max-w-sm mx-auto mb-8 font-medium">
                  Create an event to start custom booking wedding organizers, caterers, decorators, or photographers.
                </p>
                <button 
                  onClick={openCreateModal}
                  className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all inline-flex items-center gap-2 shadow-md hover:-translate-y-0.5"
                >
                  Create First Event <Plus size={16} />
                </button>
              </motion.div>
            ) : (
              <div className="space-y-8">
                <AnimatePresence>
                  {events.map((event, index) => {
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
                        onClick={() => setSelectedEvent(event)}
                        className="bg-white/90 backdrop-blur-xl border border-slate-200 hover:border-indigo-200 rounded-[2.5rem] p-6 md:p-8 shadow-[0_12px_40px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgb(0,0,0,0.06)] transition-all overflow-hidden group/container cursor-pointer text-left"
                      >
                        {/* Event Header & Actions */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                          <div className="flex gap-5 flex-1 min-w-0">
                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 shadow-sm shrink-0">
                              <Sparkles size={24} className="text-indigo-500" />
                            </div>
                            <div className="space-y-1 min-w-0 flex-1">
                              <span className={`inline-block px-2.5 py-0.5 border text-[10px] font-extrabold rounded-md uppercase tracking-wider mb-2 ${getStatusStyle(event.status)}`}>
                                {event.status}
                              </span>
                              <h2 className="text-2xl font-black text-slate-900 tracking-tight group-hover/container:text-indigo-600 transition-colors truncate">
                                {event.title}
                              </h2>
                              <p className="text-slate-500 text-sm font-medium mt-2 max-w-xl leading-relaxed line-clamp-2">
                                {event.description || "No description provided."}
                              </p>
                              
                              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-bold text-slate-400">
                                <span className="flex items-center gap-1.5">
                                  <Calendar size={14} className="text-indigo-400" />
                                  {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                                </span>
                                {event.address && (
                                  <span className="flex items-center gap-1.5 truncate max-w-xs">
                                    <MapPin size={14} className="text-indigo-400" />
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
                              className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                              title="Edit Event"
                            >
                              <Edit size={18} />
                            </button>
                            {event.status !== 'CANCELLED' && event.status !== 'CONFIRMED' && (
                              <button
                                onClick={(e) => handleCancelEvent(event, e)}
                                className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                title="Cancel Event"
                              >
                                <X size={18} />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDeleteEvent(event.id, e)}
                              className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                              title="Delete Event"
                            >
                              <Trash2 size={18} />
                            </button>
                            
                            <div className="w-px h-6 bg-slate-200 mx-2 hidden md:block"></div>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(event);
                                setActiveTab('bookings');
                                setSearchQuery('');
                              }}
                              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                            >
                              <CheckSquare size={14} /> Bookings
                            </button>

                            <button
                              onClick={() => setSelectedEvent(event)}
                              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition-all"
                            >
                              Go to Dashboard &rarr;
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
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
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={() => setShowModal(false)}
              />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-[2rem] p-8 md:p-10 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  {modalMode === 'create' ? <Plus className="text-indigo-600"/> : <Edit className="text-indigo-600"/>}
                  {modalMode === 'create' ? 'Create New Event' : 'Edit Event Details'}
                </h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-5">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1 block">Title *</label>
                  <input
                    type="text"
                    placeholder="E.g. The Grand Wedding Reception"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-800 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1 block">Description</label>
                  <textarea
                    placeholder="Brief details about the event theme, expectations, etc."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows="3"
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-800 resize-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1 block">Address / Venue</label>
                  <input
                    type="text"
                    placeholder="E.g. Grand Palace Hall, Mumbai"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-800 transition-all"
                  />
                </div>

                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-sm font-semibold transition-all border border-rose-100 shadow-sm"
                  >
                    <MapPin size={16} /> Use Current GPS Location
                  </button>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1 block">Pinpoint Venue on Map</label>
                  <div 
                    ref={mapRef} 
                    className="w-full h-48 rounded-2xl border border-slate-200 overflow-hidden shadow-inner z-0 relative"
                    style={{ minHeight: '180px' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1 block">Start Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold text-slate-800 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1 block">End Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold text-slate-800 transition-all"
                      required
                    />
                  </div>
                </div>

                {modalMode === 'edit' && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1 block">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-800 transition-all"
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
                    className="flex-1 py-4 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSaving}
                    className="flex-[1.5] py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-all shadow-md hover:-translate-y-0.5 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={() => setShowBookingModal(false)}
              />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-[2rem] p-8 md:p-10 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <CheckCircle className="text-indigo-600" size={24} /> Booking Details
                </h3>
                <button 
                  onClick={() => setShowBookingModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Service Info Header */}
                <div className="flex gap-5 items-center bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100 shadow-sm">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-200 flex-shrink-0 shadow-sm">
                    {selectedBooking.services?.photos && selectedBooking.services.photos.length > 0 ? (
                      <img src={selectedBooking.services.photos[0]} alt={selectedBooking.services.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-xs">
                        <Crown size={24} />
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="inline-block px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] font-extrabold rounded-md uppercase tracking-wider mb-1">
                      {selectedBooking.services?.category || "SERVICE"}
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-lg leading-tight">{selectedBooking.services?.name || "Service Item"}</h4>
                    {selectedBooking.services?.location && (
                      <p className="text-xs text-slate-500 font-bold flex items-center gap-1 mt-1">
                        <MapPin size={12} className="text-indigo-400" /> {selectedBooking.services.location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Details list */}
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
                  <div className="bg-white border border-slate-200 p-4 rounded-[1.25rem] shadow-sm">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Booking ID</span>
                    <span className="text-slate-800 text-sm font-black"># {selectedBooking.id}</span>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-[1.25rem] shadow-sm">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Status</span>
                    <span className={`inline-block px-2.5 py-0.5 border text-[10px] font-extrabold rounded-md uppercase tracking-wider ${getStatusStyle(selectedBooking.status)}`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-[1.25rem] shadow-sm">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Start Date</span>
                    <span className="text-slate-800 text-xs font-bold">{new Date(selectedBooking.startDt).toLocaleString()}</span>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-[1.25rem] shadow-sm">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">End Date</span>
                    <span className="text-slate-800 text-xs font-bold">{new Date(selectedBooking.endDt).toLocaleString()}</span>
                  </div>
                  <div className="col-span-2 bg-slate-50 border border-slate-200 p-5 rounded-[1.25rem] shadow-sm flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Total Amount Paid</span>
                      <span className="text-[10px] text-slate-400 block">Booked At: {new Date(selectedBooking.bookedAt).toLocaleDateString()}</span>
                    </div>
                    <span className="text-slate-900 text-2xl font-black flex items-center">
                      <IndianRupee size={18} className="text-slate-500 mr-0.5" />
                      {selectedBooking.bookingAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {selectedBooking.cancellationReason && (
                  <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl text-xs font-semibold text-rose-600">
                    <span className="text-[10px] text-rose-400 uppercase tracking-widest block mb-1.5">Cancellation Reason</span>
                    {selectedBooking.cancellationReason}
                  </div>
                )}

                {/* Cancel Booking Action */}
                {(selectedBooking.status === "PENDING" || selectedBooking.status === "CONFIRMED") && (
                  <button
                    onClick={handleCancelBooking}
                    disabled={cancelLoading}
                    className="w-full py-4 mt-2 bg-white border border-rose-200 hover:border-rose-300 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition-all text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
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
