import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../lib/apiClient';
import { toast } from 'sonner';
import { 
  Plus, Edit2, Trash2, MapPin, CheckCircle, XCircle, Clock, Loader2, 
  IndianRupee, Phone, FileText, Briefcase, User, Map, CreditCard, 
  Activity, Star, ShieldAlert, Navigation, Folder, CheckSquare, 
  MessageSquare, Info, Calendar, X, Mail, Check, Ban, ArrowRight, 
  Tag, CalendarDays, ExternalLink, LayoutGrid 
} from 'lucide-react';
import { FileUploaderRegular } from '@uploadcare/react-uploader';
import '@uploadcare/react-uploader/core.css';
import 'leaflet/dist/leaflet.css';
import CloudsBackground from './CloudsBackground';
import CustomLoader from './CustomLoader';
import PageTransition from './PageTransition';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import WalletPage from './WalletPage';
import ChatPage from './ChatPage';
import { Client } from '@stomp/stompjs';

export default function VendorDashboard() {
  const { user, customerProfile, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [hasRefreshed, setHasRefreshed] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  // Listings Inner Tab State
  const [listingsSubTab, setListingsSubTab] = useState('services');

  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [filter, setFilter] = useState('ALL');
  
  // Modal State for Booking details
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [disputes, setDisputes] = useState([]);

  // Tasks State
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskFilter, setTaskFilter] = useState('ALL');

  const stompClientRef = useRef(null);
  const taskSubsRef = useRef([]);

  const getTrustBadge = (score) => {
    if (score === null || score === undefined) return null;
    let badgeText = 'FAINT';
    let badgeStyle = 'bg-slate-100 text-slate-500 border-slate-200';
    
    if (score >= 800.0) {
      badgeText = 'RADIANT';
      badgeStyle = 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-amber-600 shadow-sm shadow-[0_0_12px_rgba(245,158,11,0.4)]';
    } else if (score >= 500.0) {
      badgeText = 'LUMINOUS';
      badgeStyle = 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white border-cyan-500 shadow-sm shadow-[0_0_8px_rgba(6,182,212,0.3)]';
    }
    
    return (
      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badgeStyle}`}>
        <Star size={12} fill={score >= 500.0 ? 'white' : 'transparent'} />
        {badgeText}
      </span>
    );
  };

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    location: '',
  });
  const [availableLocations, setAvailableLocations] = useState([{ city: '', state: '' }]);
  const [photos, setPhotos] = useState([]);

  // Map state and refs for multi-location selection
  const [mapContainer, setMapContainer] = useState(null);
  const [mapLocations, setMapLocations] = useState([]);
  const mapRefCallback = (node) => {
    setMapContainer(node);
  };
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  const addLocationFromCoords = async (lat, lng) => {
    const toastId = toast.loading("Resolving location details...");
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
      if (data && data.address) {
        const addr = data.address;
        const city = addr.city || addr.town || addr.village || addr.municipality || "";
        const state = addr.state || addr.region || "";
        
        if (!city || !state) {
          toast.error("Could not determine city and state for this coordinate. Please click closer to a city.", {
            id: toastId
          });
          return;
        }

        setAvailableLocations(prev => {
          if (prev.length === 1 && !prev[0].city && !prev[0].state) {
            return [{ city, state }];
          }
          const exists = prev.some(loc => loc.city.toLowerCase() === city.toLowerCase() && loc.state.toLowerCase() === state.toLowerCase());
          if (exists) {
            toast.info(`${city}, ${state} already added.`, { id: toastId });
            return prev;
          }
          return [...prev, { city, state }];
        });

        setMapLocations(prev => {
          const exists = prev.some(loc => loc.city.toLowerCase() === city.toLowerCase() && loc.state.toLowerCase() === state.toLowerCase());
          if (exists) return prev;
          return [...prev, { lat, lng, city, state }];
        });

        toast.success(`Added ${city}, ${state}!`, {
          id: toastId
        });
      } else {
        toast.dismiss(toastId);
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      toast.error("Failed to resolve address coordinates.", {
        id: toastId
      });
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          if (mapInstance.current) {
            mapInstance.current.setView([latitude, longitude], 10);
          }
          await addLocationFromCoords(latitude, longitude);
        },
        (error) => {
          console.error(error);
          toast.error("Unable to retrieve GPS coordinates. Please select on the map manually.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser.");
    }
  };

  const handleRemoveLocation = (index) => {
    const locToRemove = availableLocations[index];
    if (availableLocations.length === 1) {
      setAvailableLocations([{ city: '', state: '' }]);
      setMapLocations([]);
    } else {
      setAvailableLocations(prev => prev.filter((_, i) => i !== index));
      if (locToRemove) {
        setMapLocations(prev => prev.filter(ml => 
          !(ml.city.toLowerCase() === locToRemove.city.toLowerCase() && ml.state.toLowerCase() === locToRemove.state.toLowerCase())
        ));
      }
    }
  };

  // Map cleanup when modal is closed
  useEffect(() => {
    if (!showAddForm) {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      setMapContainer(null);
      setMapLocations([]);
    }
  }, [showAddForm]);

  // Leaflet map initialization
  useEffect(() => {
    let active = true;

    if (!showAddForm || !mapContainer) return;

    import('leaflet').then((L) => {
      if (!active || !mapContainer) return;

      window.L = L.default || L;

      import('leaflet/dist/images/marker-icon.png').then((icon) => {
        import('leaflet/dist/images/marker-icon-2x.png').then((icon2x) => {
          import('leaflet/dist/images/marker-shadow.png').then((shadow) => {
            if (!active) return;
            const Leaflet = L.default || L;
            delete Leaflet.Icon.Default.prototype._getIconUrl;
            Leaflet.Icon.Default.mergeOptions({
              iconUrl: icon.default,
              iconRetinaUrl: icon2x.default,
              shadowUrl: shadow.default,
            });
          });
        });
      });

      const startLat = 20.5937;
      const startLng = 78.9629;
      const startZoom = 5;

      const Leaflet = L.default || L;
      if (!mapInstance.current) {
        const map = Leaflet.map(mapContainer).setView([startLat, startLng], startZoom);
        Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        mapInstance.current = map;

        map.on('click', async (e) => {
          const { lat, lng } = e.latlng;
          await addLocationFromCoords(lat, lng);
        });
      } else {
        setTimeout(() => {
          if (mapInstance.current) {
            mapInstance.current.invalidateSize();
          }
        }, 100);
      }
    });

    return () => {
      active = false;
    };
  }, [showAddForm, mapContainer]);

  // Map markers synchronization
  useEffect(() => {
    if (!mapInstance.current || !mapLocations) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const L = window.L;
    if (!L) return;

    mapLocations.forEach(loc => {
      const marker = L.marker([loc.lat, loc.lng])
        .addTo(mapInstance.current)
        .bindPopup(`<b>${loc.city}, ${loc.state}</b>`);
      markersRef.current.push(marker);
    });
  }, [mapLocations]);

  const fetchVendorData = async (refresh = false) => {
    if (!customerProfile?.id) return;
    
    if (refresh) setIsRefreshing(true);
    else setLoading(true);
    try {
      const vendorRes = await apiClient.get(`/api/vendor/customer/${customerProfile.id}`);
      const vendor = vendorRes.data?.data || vendorRes.data;
      setVendorProfile(vendor);

      if (vendor?.id) {
        const [servicesRes, testimonialsRes, bookingsRes, disputesRes, tasksRes] = await Promise.all([
          apiClient.get(`/api/vendor/services/${vendor.id}?page=0&size=100`),
          apiClient.get(`/api/testimonials/vendor/${vendor.id}`),
          apiClient.get(`/api/vendor/bookings/${vendor.id}?page=0&size=100`),
          apiClient.get('/api/disputes/my'),
          apiClient.get(`/api/tasks/vendor/${vendor.id}`)
        ]);
        
        setServices(servicesRes.data?.data?.content || servicesRes.data?.content || []);
        setTestimonials(testimonialsRes.data?.data || testimonialsRes.data || []);
        setBookings(bookingsRes.data?.data?.content || bookingsRes.data?.content || []);
        setTasks(tasksRes.data || []);
        
        let disputesList = [];
        const dData = disputesRes.data;
        if (dData?.data && Array.isArray(dData.data)) {
          disputesList = dData.data;
        } else if (dData?.data?.content && Array.isArray(dData.data.content)) {
          disputesList = dData.data.content;
        } else if (dData?.content && Array.isArray(dData.content)) {
          disputesList = dData.content;
        } else if (Array.isArray(dData)) {
          disputesList = dData;
        }
        setDisputes(disputesList);
      }
    } catch (error) {
      console.error("Error fetching vendor data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleToggleFeature = async (id) => {
    try {
      await apiClient.put(`/api/testimonials/${id}/feature`);
      toast.success("Testimonial featured status updated!");
      setTestimonials(prev => prev.map(t => t.id === id ? { ...t, isFeatured: !t.isFeatured } : t));
    } catch (err) {
      console.error("Error toggling testimonial feature status:", err);
      toast.error("Failed to update testimonial status");
    }
  };

  const handleDeleteTestimonial = async (id) => {
    if (!window.confirm("Are you sure you want to delete this testimonial? This action cannot be undone.")) {
      return;
    }
    try {
      await apiClient.delete(`/api/testimonials/${id}`);
      toast.success("Testimonial deleted successfully!");
      setTestimonials(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error("Error deleting testimonial:", err);
      toast.error("Failed to delete testimonial");
    }
  };

  useEffect(() => {
    const checkRole = async () => {
      const roles = user?.roles
        ? Array.isArray(user.roles)
          ? user.roles
          : [user.roles]
        : [];
      const isVendor = roles.some(role => role === "VENDOR" || role === "ROLE_VENDOR");

      if (!isVendor) {
        if (!hasRefreshed) {
          setHasRefreshed(true);
          await refreshUser();
        } else {
          toast.error("Unauthorized access. Only approved vendors can access the dashboard.");
          navigate('/');
        }
        return;
      }
      setCheckingAuth(false);
    };

    checkRole();
  }, [user, hasRefreshed]);

  useEffect(() => {
    if (!checkingAuth) {
      fetchVendorData();
    }
  }, [checkingAuth, customerProfile]);

  // WebSocket Subscription for Real-time Task updates
  useEffect(() => {
    if (!vendorProfile?.id || bookings.length === 0) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const brokerURL = `${protocol}//${window.location.host}/ws`;

    const client = new Client({
      brokerURL: brokerURL,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => console.log('[Vendor Task WS Debug]', str),
    });

    client.onConnect = () => {
      console.log('Vendor Task WebSocket connected');
      stompClientRef.current = client;

      // Extract unique eventIds from bookings
      const eventIds = [...new Set(bookings.map(b => b.eventId).filter(Boolean))];
      
      // Subscribe to each event's task topic
      taskSubsRef.current = eventIds.map(eventId => {
        const dest = `/topic/event-tasks/${eventId}`;
        return client.subscribe(dest, (message) => {
          console.log(`WebSocket task update notification received for event ${eventId}`);
          // Reload tasks
          apiClient.get(`/api/tasks/vendor/${vendorProfile.id}`).then(res => {
            setTasks(res.data || []);
          }).catch(err => console.error("Error reloading tasks via WS:", err));
        });
      });
    };

    client.onDisconnect = () => {
      console.log('Vendor Task WebSocket disconnected');
      stompClientRef.current = null;
    };

    client.activate();

    return () => {
      if (taskSubsRef.current.length > 0) {
        taskSubsRef.current.forEach(sub => sub.unsubscribe());
        taskSubsRef.current = [];
      }
      client.deactivate();
    };
  }, [vendorProfile?.id, bookings.length]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!vendorProfile?.id) {
      toast.error("Vendor profile not found");
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        vendorId: vendorProfile.id,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category || vendorProfile.category,
        location: formData.location,
        availableLocations: availableLocations.filter(loc => loc.city.trim() !== '' && loc.state.trim() !== ''),
        photos: photos,
        isAvailable: true
      };

      await apiClient.post('/api/services', payload);
      toast.success("Service created and sent for admin approval!");
      setShowAddForm(false);
      setFormData({ name: '', description: '', price: '', category: '', location: '' });
      setAvailableLocations([{ city: '', state: '' }]);
      setPhotos([]);
      fetchVendorData(true);
    } catch (err) {
      console.error("Error adding service:", err);
      toast.error(err.response?.data?.message || "Failed to add service");
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleTask = async (taskId) => {
    try {
      const res = await apiClient.put(`/api/tasks/${taskId}/toggle`);
      const updatedTask = res.data;
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: updatedTask.completed } : t));
      toast.success("Task status updated.");
    } catch (err) {
      console.error("Error toggling task:", err);
      toast.error("Failed to update task status.");
    }
  };

  const handleOpenBookingModal = (booking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
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
      setShowBookingModal(false);
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
      await apiClient.post('/api/chat/conversations', { customerId });
      toast.success("Opening chat channel...");
      setActiveTab('chats');
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return <span className="flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg"><CheckCircle size={14} /> Active</span>;
      case 'PENDING':
        return <span className="flex items-center gap-1 px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-lg"><Clock size={14} /> Pending Approval</span>;
      case 'NOT_VERIFIED':
      default:
        return <span className="flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg"><XCircle size={14} /> Rejected/Inactive</span>;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'ALL') return true;
    return booking.status === filter;
  });

  const filteredTasks = tasks.filter(task => {
    if (taskFilter === 'ALL') return true;
    if (taskFilter === 'PENDING') return !task.completed;
    if (taskFilter === 'COMPLETED') return task.completed;
    return true;
  });

  if (loading) {
    return (
      <CloudsBackground>
        <div className="flex-1 pt-32 pb-12 px-4 sm:px-6 lg:px-8 relative font-sans w-full min-h-screen z-10 animate-pulse">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-slate-200 rounded-2xl shrink-0" />
                <div className="space-y-3">
                  <div className="w-64 h-8 bg-slate-200 rounded" />
                  <div className="w-32 h-4 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="w-40 h-12 bg-slate-200 rounded-xl" />
            </div>
          </div>
        </div>
      </CloudsBackground>
    );
  }

  return (
    <CloudsBackground>
      <PageTransition className="flex-1 pt-32 pb-12 px-4 sm:px-6 lg:px-8 relative font-sans w-full min-h-screen z-10 flex flex-col justify-start">
        {vendorProfile ? (
          <div className="max-w-6xl mx-auto w-full bg-white rounded-[2rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15),0_10px_30px_-5px_rgba(0,0,0,0.1)] border border-white/60 overflow-hidden flex flex-col md:flex-row min-h-[700px]">
            
            {/* LEFT SIDEBAR */}
            <div className="w-full md:w-64 bg-[#F5F4F3] border-b md:border-b-0 md:border-r border-gray-200/60 flex flex-col py-6 shrink-0 text-left">
              {/* Profile Card */}
              <div className="px-4 mb-6">
                <div className="flex items-center gap-3 bg-white px-3 py-3 rounded-2xl shadow-sm border border-gray-100/80">
                  {vendorProfile.profileImageUrl ? (
                    <img src={vendorProfile.profileImageUrl} alt="Logo" className="w-9 h-9 rounded-lg object-cover shrink-0 shadow-sm" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-sm shrink-0">
                      {vendorProfile.businessName?.charAt(0) || 'V'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-bold text-gray-800 truncate">{vendorProfile.businessName}</p>
                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase mt-0.5 inline-block">
                      {vendorProfile.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sidebar Navigation */}
              <div className="flex-1 px-3 space-y-6">
                <div>
                  <nav className="space-y-0.5">
                    <button 
                      onClick={() => setActiveTab('overview')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-white text-gray-900 shadow-sm border border-gray-100/80' : 'text-gray-600 hover:bg-gray-200/40 hover:text-gray-900'}`}
                    >
                      <LayoutGrid size={16} className={activeTab === 'overview' ? 'text-blue-600' : 'text-gray-400'} />
                      Overview
                    </button>
                    <button 
                      onClick={() => setActiveTab('listings')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'listings' ? 'bg-white text-gray-900 shadow-sm border border-gray-100/80' : 'text-gray-600 hover:bg-gray-200/40 hover:text-gray-900'}`}
                    >
                      <Briefcase size={16} className={activeTab === 'listings' ? 'text-blue-600' : 'text-gray-400'} />
                      Listings
                    </button>
                    <button 
                      onClick={() => setActiveTab('bookings')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'bookings' ? 'bg-white text-gray-900 shadow-sm border border-gray-100/80' : 'text-gray-600 hover:bg-gray-200/40 hover:text-gray-900'}`}
                    >
                      <Folder size={16} className={activeTab === 'bookings' ? 'text-blue-600' : 'text-gray-400'} />
                      Bookings ({bookings.length})
                    </button>
                    <button 
                      onClick={() => setActiveTab('tasks')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'tasks' ? 'bg-white text-gray-900 shadow-sm border border-gray-100/80' : 'text-gray-600 hover:bg-gray-200/40 hover:text-gray-900'}`}
                    >
                      <CheckSquare size={16} className={activeTab === 'tasks' ? 'text-blue-600' : 'text-gray-400'} />
                      Client Tasks ({tasks.filter(t=>!t.completed).length})
                    </button>
                    <button 
                      onClick={() => setActiveTab('wallet')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'wallet' ? 'bg-white text-gray-900 shadow-sm border border-gray-100/80' : 'text-gray-600 hover:bg-gray-200/40 hover:text-gray-900'}`}
                    >
                      <CreditCard size={16} className={activeTab === 'wallet' ? 'text-blue-600' : 'text-gray-400'} />
                      Wallet
                    </button>
                    <button 
                      onClick={() => setActiveTab('chats')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'chats' ? 'bg-white text-gray-900 shadow-sm border border-gray-100/80' : 'text-gray-600 hover:bg-gray-200/40 hover:text-gray-900'}`}
                    >
                      <MessageSquare size={16} className={activeTab === 'chats' ? 'text-blue-600' : 'text-gray-400'} />
                      Chats
                    </button>
                  </nav>
                </div>
              </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 bg-white p-6 md:p-8 flex flex-col text-left overflow-y-auto">
              
              {/* Header bar */}
              <div className="flex items-center justify-between pb-6 border-b border-gray-100 mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  {activeTab === 'overview' ? <LayoutGrid size={24} className="text-blue-600" /> :
                   activeTab === 'listings' ? <Briefcase size={24} className="text-blue-600" /> :
                   activeTab === 'bookings' ? <Folder size={24} className="text-blue-600" /> :
                   activeTab === 'tasks' ? <CheckSquare size={24} className="text-blue-600" /> :
                   activeTab === 'wallet' ? <CreditCard size={24} className="text-blue-600" /> :
                   activeTab === 'chats' ? <MessageSquare size={24} className="text-blue-600" /> : null}
                  {activeTab === 'overview' ? 'Overview' :
                   activeTab === 'listings' ? 'Listings Manager' :
                   activeTab === 'bookings' ? 'Bookings Queue' :
                   activeTab === 'tasks' ? 'Collaborative Client Tasks' :
                   activeTab === 'wallet' ? 'Wallet Console' :
                   activeTab === 'chats' ? 'Direct Chats' : ''}
                </h2>
              </div>

              {/* RENDER VIEWS BY ACTIVE TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Suspension Banner */}
                  {vendorProfile.aura < 100.0 && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 flex items-start gap-4 shadow-sm relative overflow-hidden animate-pulse">
                      <div className="p-3 bg-red-100 rounded-2xl text-red-600">
                        <ShieldAlert size={28} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-red-800">Account Suspended</h3>
                        <p className="text-red-700 text-sm mt-1">
                          Your vendor account has been suspended because your Aura score ({vendorProfile.aura.toFixed(1)}) is below the minimum required threshold of 100.0. 
                          You will not receive new bookings or show up in search results until this is resolved. 
                          Please contact support or resolve any outstanding complaints.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Business Details Card */}
                  <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-sm border border-gray-150 p-6 md:p-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                      <Briefcase className="text-blue-500" /> Business Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider flex items-center gap-1"><User size={12}/> Owner Name</p>
                          <p className="font-bold text-gray-800">{vendorProfile.ownerName || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider flex items-center gap-1"><Phone size={12}/> Phone Number</p>
                          <p className="font-bold text-gray-800">{vendorProfile.phoneNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider flex items-center gap-1"><CreditCard size={12}/> UPI Address</p>
                          <p className="font-bold text-gray-800">{vendorProfile.upiAddress || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider flex items-center gap-1"><FileText size={12}/> PAN</p>
                          <p className="font-bold text-gray-800 uppercase">{vendorProfile.pan || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider flex items-center gap-1"><FileText size={12}/> GST Number</p>
                          <p className="font-bold text-gray-800 uppercase">{vendorProfile.gstNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider flex items-center gap-1"><Map size={12}/> Address</p>
                          <p className="font-bold text-gray-800 text-sm">
                            {vendorProfile.addressLine1}{vendorProfile.addressLine2 ? `, ${vendorProfile.addressLine2}` : ''}<br/>
                            {vendorProfile.state}, {vendorProfile.pincode}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4 lg:border-l lg:border-gray-100 lg:pl-8">
                        <div>
                          <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider flex items-center gap-1"><Activity size={12}/> Total Bookings</p>
                          <p className="text-2xl font-extrabold text-blue-600">{bookings.length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider flex items-center gap-1"><Star size={12}/> Aura Score</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-2xl font-extrabold text-indigo-600">
                              {typeof vendorProfile.aura === 'number' ? vendorProfile.aura.toFixed(1) : (vendorProfile.aura || '500.0')}
                            </span>
                            {getTrustBadge(vendorProfile.aura !== undefined && vendorProfile.aura !== null ? vendorProfile.aura : 500.0)}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider">Verification Status</p>
                          <div className="mt-1">{getStatusBadge(vendorProfile.verificationStatus)}</div>
                        </div>
                      </div>
                    </div>

                    {vendorProfile.description && (
                      <div className="mt-8 pt-6 border-t border-gray-100 text-left">
                        <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider text-left">Business Description</p>
                        <p className="text-gray-600 text-sm leading-relaxed text-left">{vendorProfile.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'listings' && (
                <div className="space-y-6">
                  {/* Listings Tab Toggle Bar */}
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                    <div className="flex gap-4">
                      <button
                        onClick={() => setListingsSubTab('services')}
                        className={`pb-2 text-sm font-bold transition-all relative ${
                          listingsSubTab === 'services'
                            ? 'text-blue-600 font-extrabold'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        Services ({services.length})
                        {listingsSubTab === 'services' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                        )}
                      </button>
                      <button
                        onClick={() => setListingsSubTab('testimonials')}
                        className={`pb-2 text-sm font-bold transition-all relative ${
                          listingsSubTab === 'testimonials'
                            ? 'text-blue-600 font-extrabold'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        Testimonials ({testimonials.length})
                        {listingsSubTab === 'testimonials' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                        )}
                      </button>
                    </div>

                    <button
                      onClick={() => setShowAddForm(true)}
                      className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                    >
                      <Plus size={14} /> Add Service
                    </button>
                  </div>

                  {listingsSubTab === 'services' ? (
                    <div className="space-y-6">
                      {services.length === 0 ? (
                        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white p-12 text-center">
                          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plus size={32} className="text-blue-400" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-800">No services listed yet</h3>
                          <p className="text-gray-500 mt-2 max-w-md mx-auto">Start reaching customers by adding your first service offering.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {services.map((service) => (
                            <div key={service.id} className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col h-full group text-left">
                              <div className="flex justify-between items-start mb-4">
                                {getStatusBadge(service.verificationStatus)}
                                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-md">{service.category}</span>
                              </div>
                              
                              <h3 className="font-bold text-gray-900 text-base mb-2 group-hover:text-blue-600 transition-colors text-left">{service.name}</h3>
                              <p className="text-xs text-gray-500 mb-6 line-clamp-3 flex-1 text-left">{service.description}</p>
                              
                              <div className="pt-4 border-t border-gray-100 mt-auto grid grid-cols-2 gap-4 text-left">
                                <div>
                                  <p className="text-[10px] text-gray-400 font-semibold mb-0.5 uppercase tracking-wider">Price</p>
                                  <p className="font-bold text-gray-900 flex items-center text-sm"><IndianRupee size={12} className="mr-0.5 text-gray-500"/>{service.price}</p>
                                </div>
                                {service.location && (
                                  <div>
                                    <p className="text-[10px] text-gray-400 font-semibold mb-0.5 uppercase tracking-wider">Location</p>
                                    <p className="font-bold text-gray-900 text-xs truncate flex items-center"><MapPin size={12} className="mr-0.5 text-gray-500"/>{service.location}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {testimonials.length === 0 ? (
                        <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white p-12 text-center">
                          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Star size={32} className="text-amber-400" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-800">No testimonials yet</h3>
                          <p className="text-gray-500 mt-2 max-w-md mx-auto"> testimonials will appear here after booking completions.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {testimonials.map((testimonial) => (
                            <div key={testimonial.id} className="bg-white border border-gray-200/80 rounded-2xl p-5 flex flex-col justify-between group relative overflow-hidden text-left">
                              <div>
                                <div className="flex justify-between items-start mb-4">
                                  <div className="text-left">
                                    <h4 className="font-bold text-gray-900 text-sm text-left">{testimonial.customerName}</h4>
                                    <p className="text-[10px] text-gray-400 font-semibold text-left">{testimonial.createdAt ? new Date(testimonial.createdAt).toLocaleDateString() : ''}</p>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${testimonial.isFeatured ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-gray-50 text-gray-400 border border-gray-200'}`}>
                                    <Star size={10} fill={testimonial.isFeatured ? 'currentColor' : 'none'} />
                                    {testimonial.isFeatured ? 'Featured' : 'Standard'}
                                  </span>
                                </div>

                                {testimonial.serviceName && (
                                  <p className="text-[10px] text-blue-600 font-bold mb-3 flex items-center gap-1 text-left">
                                    <Briefcase size={10} /> Service: {testimonial.serviceName}
                                  </p>
                                )}

                                <p className="text-xs text-gray-600 italic leading-relaxed mb-6 font-medium text-left">
                                  "{testimonial.testimonialText}"
                                </p>
                              </div>

                              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-auto">
                                <button
                                  onClick={() => handleToggleFeature(testimonial.id)}
                                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                                    testimonial.isFeatured
                                      ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/50'
                                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  <Star size={12} fill={testimonial.isFeatured ? 'currentColor' : 'none'} />
                                  {testimonial.isFeatured ? 'Unfeature' : 'Feature'}
                                </button>
                                <button
                                  onClick={() => handleDeleteTestimonial(testimonial.id)}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 hover:bg-red-100/70 border border-red-100 text-red-700 rounded-xl text-[10px] font-bold transition-all"
                                >
                                  <Trash2 size={12} />
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'bookings' && (
                <div className="space-y-6">
                  {/* Filters */}
                  <div className="flex flex-wrap gap-2 pb-2">
                    {['ALL', 'PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-xl border transition-all ${
                          filter === status
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white hover:bg-gray-50 text-slate-650 border-slate-200/60'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>

                  {bookingsLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="animate-spin text-blue-500" size={32} />
                    </div>
                  ) : filteredBookings.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-[2rem] p-12 text-center shadow-sm">
                      <h2 className="text-base font-bold text-slate-800 mb-2">No Bookings Found</h2>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">No customer bookings match the filter criteria at the moment.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {filteredBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] hover:-translate-y-0.5 transition-all flex flex-col justify-between text-left"
                        >
                          <div className="space-y-4">
                            <div className="flex justify-between items-start gap-4">
                              <div className="min-w-0 flex-1 text-left">
                                <span className="inline-block px-2.5 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 text-[9px] font-bold rounded-md uppercase tracking-wider mb-1">
                                  {booking.services?.category || "SERVICE"}
                                </span>
                                <h3 className="font-extrabold text-slate-800 text-sm md:text-base leading-tight truncate text-left">
                                  {booking.services?.name || "Service Item"}
                                </h3>
                                {disputes.find(d => d.bookingId === booking.id) && (
                                  <span className="inline-block mt-1 px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-600 text-[8px] font-bold rounded-md uppercase tracking-wider animate-pulse">
                                    Dispute Raised
                                  </span>
                                )}
                              </div>
                              <span className={`px-2 py-0.5 border text-[9px] font-extrabold rounded-md uppercase tracking-wider shrink-0 ${getStatusStyle(booking.status)}`}>
                                {booking.status}
                              </span>
                            </div>

                            <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl space-y-1.5 text-xs font-semibold text-slate-700 text-left">
                              <div className="flex items-center gap-2">
                                <User size={13} className="text-blue-500" />
                                <span className="truncate">Client: {booking.clientName || `Customer #${booking.customerId}`}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar size={13} className="text-blue-400" />
                                <span className="text-[10px]">{new Date(booking.startDt).toLocaleDateString()} - {new Date(booking.endDt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between gap-4">
                            <div className="text-left">
                              <span className="text-[8px] text-slate-400 uppercase tracking-wide block font-bold">Amount Earned</span>
                              <span className="text-slate-900 text-sm font-extrabold flex items-center">
                                <IndianRupee size={12} className="text-slate-400 mr-0.5" />
                                {booking.bookingAmount}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenBookingModal(booking)}
                                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors border border-gray-200"
                                title="View Details"
                              >
                                <Info size={14} />
                              </button>
                              <button
                                onClick={() => handleStartChat(booking.customerId)}
                                disabled={chatLoading}
                                className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 rounded-xl transition-colors disabled:opacity-50"
                                title="Chat with Customer"
                              >
                                <MessageSquare size={14} />
                              </button>
                              {booking.status === "PENDING" && (
                                <>
                                  <button
                                    onClick={() => handleUpdateStatus(booking.id, "ACCEPT")}
                                    disabled={actionLoading}
                                    className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
                                    title="Accept Request"
                                  >
                                    {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(booking.id, "REJECT")}
                                    disabled={actionLoading}
                                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-500 border border-rose-100 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
                                    title="Reject Request"
                                  >
                                    {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                                  </button>
                                </>
                              )}
                              {booking.status === "CONFIRMED" && (
                                <button
                                  onClick={() => handleUpdateStatus(booking.id, "CANCEL")}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-500 text-[10px] font-bold rounded-xl transition-colors disabled:opacity-50"
                                >
                                  Refund
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="space-y-6">
                  {/* Task Filters */}
                  <div className="flex gap-2">
                    {['ALL', 'PENDING', 'COMPLETED'].map((filterVal) => (
                      <button
                        key={filterVal}
                        onClick={() => setTaskFilter(filterVal)}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-xl border transition-all ${
                          taskFilter === filterVal
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white hover:bg-gray-50 text-slate-600 border-slate-200/60'
                        }`}
                      >
                        {filterVal}
                      </button>
                    ))}
                  </div>

                  {tasksLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="animate-spin text-blue-500" size={32} />
                    </div>
                  ) : filteredTasks.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-12 text-center">
                      <CheckSquare size={32} className="text-slate-300 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-slate-500">No collaborative customer tasks listed.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredTasks.map((task) => (
                        <div 
                          key={task.id}
                          className="bg-white border border-gray-205/85 border-gray-200 hover:border-blue-200 p-4 rounded-2xl flex items-center justify-between gap-4 transition-all shadow-[0_2px_8px_rgb(0,0,0,0.01)] text-left"
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0 text-left">
                            <input 
                              type="checkbox"
                              checked={task.completed || false}
                              onChange={() => handleToggleTask(task.id)}
                              className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer mt-0.5 shrink-0"
                            />
                            <div className="flex-1 min-w-0 text-left">
                              <h5 className={`text-slate-800 text-sm font-bold leading-tight text-left ${task.completed ? 'line-through text-slate-400 font-normal' : ''}`}>
                                {task.title}
                              </h5>
                              {task.description && <p className="text-xs text-slate-500 mt-1 text-left">{task.description}</p>}
                              
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5">
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[8px] font-black uppercase rounded tracking-wider">
                                  {task.booking?.services?.name || "Service #" + task.bookingId}
                                </span>
                                {task.dueDate && (
                                  <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                                    <Calendar size={11} className="text-blue-400" /> Due: {new Date(task.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {task.attachmentUrl && (
                            <a 
                              href={task.attachmentUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-105 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl border border-blue-100 transition-colors shrink-0"
                            >
                              <ExternalLink size={12} /> Attachment
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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
          <div className="max-w-md mx-auto bg-white border border-gray-200 p-12 text-center rounded-3xl">
            <Loader2 className="animate-spin text-blue-600 mx-auto" size={40} />
            <h2 className="text-xl font-bold text-slate-800 mt-4">Loading Vendor Profile</h2>
          </div>
        )}
      </PageTransition>

      {/* Dialog for Creating New Service */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar bg-white/95 backdrop-blur-xl border-white/40 shadow-2xl rounded-3xl p-6 md:p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">Create New Service</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddService} className="space-y-5 mt-2 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1 text-left">
                <label className="text-sm font-semibold text-gray-700">Service Name *</label>
                <input required name="name" value={formData.name} onChange={handleInputChange} type="text" className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g., Premium Wedding Photography" />
              </div>
              
              <div className="space-y-1 text-left">
                <label className="text-sm font-semibold text-gray-700">Price (₹) *</label>
                <input required name="price" value={formData.price} onChange={handleInputChange} type="number" min="1" step="0.01" className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="5000" />
              </div>
            </div>

            <div className="space-y-1 text-left">
              <label className="text-sm font-semibold text-gray-700">Description</label>
              <textarea required name="description" value={formData.description} onChange={handleInputChange} rows="3" className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" placeholder="Describe what the service includes..."></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1 text-left">
                <label className="text-sm font-semibold text-gray-700">Category *</label>
                <select required name="category" value={formData.category} onChange={handleInputChange} className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                  <option value="">Select Category</option>
                  <option value="DECORATION">Decoration</option>
                  <option value="CATERING">Catering</option>
                  <option value="VENUE">Venue</option>
                  <option value="ENTERTAINMENT">Entertainment</option>
                  <option value="PHOTOGRAPHY">Photography</option>
                  <option value="TRANSPORTATION">Transportation</option>
                  <option value="MUSIC">Music</option>
                  <option value="MAKEUP">Makeup</option>
                  <option value="TRANSPORT">Transport</option>
                  <option value="LOGISTICS">Logistics</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div className="space-y-1 text-left">
                <label className="text-sm font-semibold text-gray-700">Location Area (Fallback)</label>
                <input name="location" value={formData.location} onChange={handleInputChange} type="text" className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g., Downtown, Citywide" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-700">Available Locations (City & State) *</label>
                  <button type="button" onClick={() => setAvailableLocations([...availableLocations, { city: '', state: '' }])} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
                    <Plus size={12} /> Add Location
                  </button>
                </div>
                
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                  {availableLocations.map((loc, index) => (
                    <div key={index} className="flex gap-2.5 items-center">
                      <input 
                        required
                        type="text" 
                        value={loc.city} 
                        onChange={(e) => {
                          const newLocs = [...availableLocations];
                          newLocs[index].city = e.target.value;
                          setAvailableLocations(newLocs);
                        }} 
                        placeholder="City" 
                        className="w-full px-3 py-2 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium" 
                      />
                      <input 
                        required
                        type="text" 
                        value={loc.state} 
                        onChange={(e) => {
                          const newLocs = [...availableLocations];
                          newLocs[index].state = e.target.value;
                          setAvailableLocations(newLocs);
                        }} 
                        placeholder="State" 
                        className="w-full px-3 py-2 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-medium" 
                      />
                      <button type="button" onClick={() => handleRemoveLocation(index)} className="p-2.5 text-red-500 hover:bg-red-555 hover:bg-red-50 rounded-xl border border-red-100 transition-colors shrink-0">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 flex flex-col text-left">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <Map size={16} className="text-indigo-500" />
                    Select on Map
                  </label>
                  <button 
                    type="button" 
                    onClick={handleGetCurrentLocation} 
                    className="text-xs px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1 transition-all shadow-sm hover:shadow"
                  >
                    <Navigation size={12} className="rotate-45" /> Current GPS
                  </button>
                </div>
                
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm h-[220px] w-full z-0">
                  <div ref={mapRefCallback} className="w-full h-full"></div>
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[9px] text-white font-semibold z-10 pointer-events-none tracking-wide">
                    Click map to pin a city
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-left">
              <label className="text-sm font-semibold text-gray-700">Event Photos (Up to 5 from Uploadcare)</label>
              <div className="flex flex-wrap gap-4 items-center">
                {photos.map((photo, index) => (
                  <div key={index} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                    <img src={photo} alt={`Service ${index}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setPhotos(photos.filter((_, i) => i !== index))} className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-500 hover:text-red-700">
                      <XCircle size={14} />
                    </button>
                  </div>
                ))}
                
                {photos.length < 5 && (
                  <div className="mt-2">
                    <FileUploaderRegular 
                      key={`upload-widget-${photos.length}`}
                      pubkey="demopublickey" 
                      multiple
                      onChange={(e) => {
                        const successfulFiles = e.allEntries.filter((file) => file.status === "success");
                        const newUrls = successfulFiles.map((file) => file.cdnUrl).filter(Boolean);
                        setPhotos(prev => {
                          const combined = [...prev];
                          newUrls.forEach(url => {
                            if (!combined.includes(url)) {
                              combined.push(url);
                            }
                          });
                          return combined.slice(0, 5);
                        });
                      }} 
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setShowAddForm(false)} disabled={formLoading} className="px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={formLoading} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-70">
                {formLoading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                Submit
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
                  <CheckCircle className="text-blue-600" size={24} /> Booking Details
                </h3>
                <button 
                  onClick={() => setShowBookingModal(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 text-left">
                {/* Client Contact Info */}
                <div className="bg-blue-50/50 border border-blue-100/50 p-4 rounded-2xl space-y-3">
                  <span className="text-[10px] text-blue-600 uppercase tracking-wide font-extrabold block mb-1">Customer Details</span>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <User size={14} className="text-blue-500" />
                    <span>Name: {selectedBooking.clientName || `Customer #${selectedBooking.customerId}`}</span>
                  </div>
                  {selectedBooking.clientEmail && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <Mail size={14} className="text-blue-500" />
                      <span>Email: {selectedBooking.clientEmail}</span>
                    </div>
                  )}
                  {selectedBooking.clientPhone && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <Phone size={14} className="text-blue-500" />
                      <span>Phone: {selectedBooking.clientPhone}</span>
                    </div>
                  )}
                </div>

                {/* Service Details */}
                <div className="flex gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 flex-shrink-0">
                    {selectedBooking.services?.photos && selectedBooking.services.photos.length > 0 ? (
                      <img src={selectedBooking.services.photos[0]} alt={selectedBooking.services.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-300 font-bold text-xs">
                        No Photo
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <span className="inline-block px-2.5 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-extrabold rounded-md uppercase tracking-wider mb-1">
                      {selectedBooking.services?.category || "SERVICE"}
                    </span>
                    <h4 className="font-extrabold text-slate-800 text-base text-left">{selectedBooking.services?.name || "Service Item"}</h4>
                    {selectedBooking.services?.location && (
                      <p className="text-xs text-slate-400 font-semibold flex items-center gap-1 mt-0.5 text-left">
                        <MapPin size={12} className="text-blue-400" /> {selectedBooking.services.location}
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
                </div>

                {selectedBooking.cancellationReason && (
                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-xs font-semibold text-rose-600">
                    <span className="text-[10px] text-rose-450 uppercase tracking-wide block mb-1">Cancellation Reason</span>
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
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => {
                      setShowBookingModal(false);
                      handleStartChat(selectedBooking.customerId);
                    }}
                    className="flex-1 py-3.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold border border-blue-100 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
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
                        Accept
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(selectedBooking.id, "REJECT")}
                        disabled={actionLoading}
                        className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                      >
                        {actionLoading ? <Loader2 className="animate-spin" size={16} /> : null}
                        Reject
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
                      Cancel & Refund
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
