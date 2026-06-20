import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../lib/apiClient';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, MapPin, CheckCircle, XCircle, Clock, Loader2, IndianRupee, Phone, FileText, Briefcase, User, Map, CreditCard, Activity, Star, ShieldAlert, Navigation } from 'lucide-react';
import { FileUploaderRegular } from '@uploadcare/react-uploader';
import '@uploadcare/react-uploader/core.css';
import 'leaflet/dist/leaflet.css';
import CloudsBackground from './CloudsBackground';
import CustomLoader from './CustomLoader';
import PageTransition from './PageTransition';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

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
  const [activeTab, setActiveTab] = useState('services');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

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
          // If the list has just one empty entry, replace it
          if (prev.length === 1 && !prev[0].city && !prev[0].state) {
            return [{ city, state }];
          }
          // Check if exists
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
      if (vendorProfile?.id) {
        // Parallelize for fast refresh
        const [vendorRes, servicesRes, testimonialsRes] = await Promise.all([
          apiClient.get(`/api/vendor/customer/${customerProfile.id}`),
          apiClient.get(`/api/vendor/services/${vendorProfile.id}?page=0&size=100`),
          apiClient.get(`/api/testimonials/vendor/${vendorProfile.id}`)
        ]);
        setVendorProfile(vendorRes.data?.data || vendorRes.data);
        setServices(servicesRes.data?.data?.content || servicesRes.data?.content || []);
        setTestimonials(testimonialsRes.data?.data || testimonialsRes.data || []);
      } else {
        const vendorRes = await apiClient.get(`/api/vendor/customer/${customerProfile.id}`);
        const vendor = vendorRes.data?.data || vendorRes.data;
        setVendorProfile(vendor);

        if (vendor?.id) {
          const [servicesRes, testimonialsRes] = await Promise.all([
            apiClient.get(`/api/vendor/services/${vendor.id}?page=0&size=100`),
            apiClient.get(`/api/testimonials/vendor/${vendor.id}`)
          ]);
          setServices(servicesRes.data?.data?.content || servicesRes.data?.content || []);
          setTestimonials(testimonialsRes.data?.data || testimonialsRes.data || []);
        }
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
        category: formData.category || vendorProfile.category, // Default to vendor's category
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
      fetchVendorData(true); // Refresh list smoothly
    } catch (err) {
      console.error("Error adding service:", err);
      toast.error(err.response?.data?.message || "Failed to add service");
    } finally {
      setFormLoading(false);
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

  if (loading) {
    return (
      <CloudsBackground>
        <div className="flex-1 pt-32 pb-12 px-4 sm:px-6 lg:px-8 relative font-sans w-full min-h-screen z-10 animate-pulse">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header Skeleton */}
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

            {/* Details Card Skeleton */}
            <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white/80 p-8 space-y-6">
              <div className="w-48 h-6 bg-slate-200 rounded" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-3">
                    <div className="w-24 h-4 bg-slate-200 rounded" />
                    <div className="w-full h-6 bg-slate-200 rounded" />
                    <div className="w-1/2 h-6 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Tab Bar Skeleton */}
            <div className="flex gap-6 border-b border-gray-200/60 pb-3">
              <div className="w-32 h-6 bg-slate-200 rounded" />
              <div className="w-32 h-6 bg-slate-200 rounded" />
            </div>

            {/* Services Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between">
                    <div className="w-16 h-5 bg-slate-200 rounded-md" />
                    <div className="w-16 h-5 bg-slate-200 rounded-md" />
                  </div>
                  <div className="w-3/4 h-6 bg-slate-200 rounded" />
                  <div className="w-full h-12 bg-slate-200 rounded animate-pulse" />
                  <div className="h-[1px] bg-slate-100 w-full" />
                  <div className="flex justify-between">
                    <div className="w-12 h-4 bg-slate-200 rounded" />
                    <div className="w-20 h-4 bg-slate-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CloudsBackground>
    );
  }

  return (
    <CloudsBackground>
      <PageTransition className="flex-1 pt-32 relative font-sans w-full min-h-screen py-12 px-4 sm:px-6 lg:px-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75 }}
          className="max-w-6xl mx-auto space-y-8"
        >

          {/* Suspension Banner */}
          {vendorProfile && vendorProfile.aura < 100.0 && (
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
          
          {/* Vendor Header */}
          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full blur-3xl -mr-32 -mt-32 -z-10" />
            
            <div className="flex items-center gap-6">
              {vendorProfile?.profileImageUrl ? (
                <img src={vendorProfile.profileImageUrl} alt="Business Logo" className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-md">
                  {vendorProfile?.businessName?.charAt(0) || 'V'}
                </div>
              )}
              
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{vendorProfile?.businessName || 'Your Business'}</h1>
                <p className="text-gray-600 font-medium mt-1 flex items-center gap-2">
                  <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-md">{vendorProfile?.category}</span>
                  • {vendorProfile?.state}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-sm hover:shadow-md"
            >
              <Plus size={20} />
              List New Service
            </button>
          </div>

          {/* Expanded Vendor Details */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-sm border border-white p-6 md:p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Briefcase className="text-blue-500" /> Business Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider flex items-center gap-1"><User size={12}/> Owner Name</p>
                  <p className="font-bold text-gray-800">{vendorProfile?.ownerName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider flex items-center gap-1"><Phone size={12}/> Phone Number</p>
                  <p className="font-bold text-gray-800">{vendorProfile?.phoneNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider flex items-center gap-1"><CreditCard size={12}/> UPI Address</p>
                  <p className="font-bold text-gray-800">{vendorProfile?.upiAddress || 'N/A'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider flex items-center gap-1"><FileText size={12}/> PAN</p>
                  <p className="font-bold text-gray-800 uppercase">{vendorProfile?.pan || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider flex items-center gap-1"><FileText size={12}/> GST Number</p>
                  <p className="font-bold text-gray-800 uppercase">{vendorProfile?.gstNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider flex items-center gap-1"><Map size={12}/> Address</p>
                  <p className="font-bold text-gray-800 text-sm">
                    {vendorProfile?.addressLine1}{vendorProfile?.addressLine2 ? `, ${vendorProfile.addressLine2}` : ''}<br/>
                    {vendorProfile?.state}, {vendorProfile?.pincode}
                  </p>
                </div>
              </div>

              <div className="space-y-4 lg:border-l lg:border-gray-100 lg:pl-8">
                <div>
                  <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider flex items-center gap-1"><Activity size={12}/> Total Bookings</p>
                  <p className="text-2xl font-extrabold text-blue-600">{vendorProfile?.totalBookings || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider flex items-center gap-1"><Star size={12}/> Aura Score</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-extrabold text-indigo-600">
                      {typeof vendorProfile?.aura === 'number' ? vendorProfile.aura.toFixed(1) : (vendorProfile?.aura || '500.0')}
                    </span>
                    {getTrustBadge(vendorProfile?.aura !== undefined && vendorProfile?.aura !== null ? vendorProfile.aura : 500.0)}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider">Verification Status</p>
                  <div className="mt-1">{getStatusBadge(vendorProfile?.verificationStatus)}</div>
                </div>
              </div>
            </div>

            {vendorProfile?.description && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider">Business Description</p>
                <p className="text-gray-600 text-sm leading-relaxed">{vendorProfile.description}</p>
              </div>
            )}
          </div>

          {/* Add Service Form Modal */}
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar bg-white/95 backdrop-blur-xl border-white/40 shadow-2xl rounded-3xl p-6 md:p-8">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">Create New Service</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddService} className="space-y-5 mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Service Name *</label>
                    <input required name="name" value={formData.name} onChange={handleInputChange} type="text" className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g., Premium Wedding Photography" />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Price (₹) *</label>
                    <input required name="price" value={formData.price} onChange={handleInputChange} type="number" min="1" step="0.01" className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="5000" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Description</label>
                  <textarea required name="description" value={formData.description} onChange={handleInputChange} rows="3" className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" placeholder="Describe what the service includes..."></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1">
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
                  
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Location Area (Fallback)</label>
                    <input name="location" value={formData.location} onChange={handleInputChange} type="text" className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g., Downtown, Citywide" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Locations Input list */}
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
                          <button type="button" onClick={() => handleRemoveLocation(index)} className="p-2.5 text-red-500 hover:bg-red-550 hover:bg-red-50 rounded-xl border border-red-100 transition-colors shrink-0">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Leaflet Map selector */}
                  <div className="space-y-3 flex flex-col">
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
                <div className="space-y-3">
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
                  <button type="button" onClick={() => setShowAddForm(false)} disabled={formLoading} className="px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
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

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200/60 pb-px gap-6">
            <button
              onClick={() => setActiveTab('services')}
              className={`pb-4 text-lg font-bold transition-all relative ${
                activeTab === 'services'
                  ? 'text-blue-600 font-extrabold'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Services ({services.length})
              {activeTab === 'services' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('testimonials')}
              className={`pb-4 text-lg font-bold transition-all relative ${
                activeTab === 'testimonials'
                  ? 'text-blue-600 font-extrabold'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Testimonials ({testimonials.length})
              {activeTab === 'testimonials' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          </div>

          {/* Active Tab Panel */}
          {activeTab === 'services' ? (
            <div className="space-y-6">
              {services.length === 0 ? (
                <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white p-12 text-center">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus size={32} className="text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">No services listed yet</h3>
                  <p className="text-gray-500 mt-2 max-w-md mx-auto">Start reaching customers by adding your first service offering. It will be reviewed by our admin team shortly after submission.</p>
                  <button onClick={() => setShowAddForm(true)} className="mt-6 px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm">
                    List New Service
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((service) => (
                    <div key={service.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-all flex flex-col h-full group">
                      <div className="flex justify-between items-start mb-4">
                        {getStatusBadge(service.verificationStatus)}
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-md">{service.category}</span>
                      </div>
                      
                      <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-blue-600 transition-colors">{service.name}</h3>
                      <p className="text-sm text-gray-500 mb-6 line-clamp-3 flex-1">{service.description}</p>
                      
                      <div className="pt-4 border-t border-gray-100 mt-auto grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider">Price</p>
                          <p className="font-bold text-gray-900 flex items-center"><IndianRupee size={14} className="mr-0.5 text-gray-500"/>{service.price}</p>
                        </div>
                        {service.location && (
                          <div>
                            <p className="text-xs text-gray-400 font-semibold mb-1 uppercase tracking-wider">Location</p>
                            <p className="font-bold text-gray-900 text-sm truncate flex items-center"><MapPin size={14} className="mr-1 text-gray-500"/>{service.location}</p>
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
                  <p className="text-gray-500 mt-2 max-w-md mx-auto">When customers complete bookings and recommend your services, their testimonials will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {testimonials.map((testimonial) => (
                    <div key={testimonial.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-all flex flex-col justify-between group relative overflow-hidden">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-gray-900">{testimonial.customerName}</h4>
                            <p className="text-xs text-gray-400 font-semibold">{testimonial.createdAt ? new Date(testimonial.createdAt).toLocaleDateString() : ''}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${testimonial.isFeatured ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-gray-50 text-gray-400 border border-gray-200'}`}>
                            <Star size={12} fill={testimonial.isFeatured ? 'currentColor' : 'none'} />
                            {testimonial.isFeatured ? 'Featured' : 'Standard'}
                          </span>
                        </div>

                        {testimonial.serviceName && (
                          <p className="text-xs text-blue-600 font-bold mb-3 flex items-center gap-1">
                            <Briefcase size={12} /> Service: {testimonial.serviceName}
                          </p>
                        )}

                        <p className="text-sm text-gray-600 italic leading-relaxed mb-6 font-medium">
                          "{testimonial.testimonialText}"
                        </p>
                      </div>

                      <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-auto">
                        <button
                          onClick={() => handleToggleFeature(testimonial.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            testimonial.isFeatured
                              ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/50'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Star size={14} fill={testimonial.isFeatured ? 'currentColor' : 'none'} />
                          {testimonial.isFeatured ? 'Unfeature' : 'Feature on Profile'}
                        </button>
                        <button
                          onClick={() => handleDeleteTestimonial(testimonial.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100/70 border border-red-100 text-red-700 rounded-xl text-xs font-bold transition-all"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </motion.div>
      </PageTransition>
    </CloudsBackground>
  );
}
