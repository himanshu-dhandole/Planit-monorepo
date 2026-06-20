import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../lib/apiClient';
import { toast } from 'sonner';
import { Camera, FileText, User, MapPin, Phone, CheckCircle, Clock, AlertCircle, Loader2, Shield, Briefcase, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CloudsBackground from './CloudsBackground';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';

export default function Profile() {
  const { user, refreshUser } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState(null);
  const [status, setStatus] = useState('PENDING'); // PENDING, VERIFIED, NOT_VERIFIED
  const [aura, setAura] = useState(null);
  const [isEditing, setIsEditing] = useState(true);
  const navigate = useNavigate();
  const isVendor = user?.roles && (Array.isArray(user.roles) ? user.roles : [user.roles]).some(role => role === 'VENDOR' || role === 'ROLE_VENDOR');

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
  
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    phoneNumber: '',
    bio: '',
    addressLine1: '',
    addressLine2: '',
    state: '',
    pincode: '',
    latitude: '',
    longitude: ''
  });

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);

  const [files, setFiles] = useState({
    profilePic: null,
    aadhar: null
  });

  const [preview, setPreview] = useState({
    profilePic: null,
    aadhar: null
  });

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get(`/api/customer/user/${user.id}`);
      if (res.data) {
        // Backend returns an ApiResponse wrapper: { timeStamp, data: {...}, error }
        const profile = res.data.data || res.data;
        
        if (profile && profile.id) {
          setCustomerId(profile.id);
          setStatus(profile.verificationStatus || 'PENDING');
          setAura(profile.aura !== undefined && profile.aura !== null ? profile.aura : 500.0);
          setFormData({
            firstName: profile.firstName || '',
            middleName: profile.middleName || '',
            lastName: profile.lastName || '',
            phoneNumber: profile.phoneNumber || '',
            bio: profile.bio || '',
            addressLine1: profile.addressLine1 || '',
            addressLine2: profile.addressLine2 || '',
            state: profile.state || '',
            pincode: profile.pincode || '',
            latitude: profile.coordinates?.coordinates?.[1] || '',
            longitude: profile.coordinates?.coordinates?.[0] || ''
          });
          setPreview({
            profilePic: profile.profilePictureUrl || null,
            aadhar: profile.aadharUrl || null
          });
          setIsEditing(false); // Found a profile, so default to read-only
        }
      }
    } catch (err) {
      if (err.response?.status !== 404 && err.response?.status !== 500) {
        console.error("Error fetching profile:", err);
      }
      // If 404 or error, it means profile might not exist yet, which is fine
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
      if (data && data.address) {
        const addr = data.address;
        const house = addr.house_number || addr.building || addr.house_name || "";
        const road = addr.road || addr.pedestrian || addr.highway || "";
        const suburb = addr.suburb || addr.neighbourhood || addr.city_district || "";
        const county = addr.county || "";
        const city = addr.city || addr.town || addr.village || addr.municipality || "";
        
        const line1 = [house, road, suburb, county, city].filter(Boolean).join(", ") || data.display_name || "";
        const stateName = addr.state || addr.region || "";
        const pin = addr.postcode || "";

        setFormData(prev => ({
          ...prev,
          addressLine1: line1 || prev.addressLine1,
          state: stateName || prev.state,
          pincode: pin || prev.pincode
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
          setFormData(prev => ({
            ...prev,
            latitude: latitude.toString(),
            longitude: longitude.toString()
          }));
          
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

  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!mapRef.current || loading) return;

    import('leaflet').then((L) => {
      if (!active || !mapRef.current) return;

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

      const lat = parseFloat(formData.latitude) || 20.5937;
      const lng = parseFloat(formData.longitude) || 78.9629;
      const zoom = formData.latitude && formData.longitude ? 14 : 5;

      if (!mapInstance.current) {
        const map = L.default.map(mapRef.current).setView([lat, lng], zoom);
        L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        mapInstance.current = map;

        const marker = L.default.marker([lat, lng], {
          draggable: isEditing
        }).addTo(map);

        markerInstance.current = marker;

        marker.on('dragend', () => {
          const position = marker.getLatLng();
          setFormData(prev => ({
            ...prev,
            latitude: position.lat.toString(),
            longitude: position.lng.toString()
          }));
          fetchAddressFromCoords(position.lat, position.lng);
        });

        map.on('click', (e) => {
          if (!isEditing) return;
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          setFormData(prev => ({
            ...prev,
            latitude: lat.toString(),
            longitude: lng.toString()
          }));
          fetchAddressFromCoords(lat, lng);
        });
      } else {
        const map = mapInstance.current;
        const marker = markerInstance.current;

        setTimeout(() => {
          if (map) map.invalidateSize();
        }, 100);

        if (formData.latitude && formData.longitude) {
          const currentMarkerLatLng = marker.getLatLng();
          if (currentMarkerLatLng.lat !== lat || currentMarkerLatLng.lng !== lng) {
            map.setView([lat, lng]);
            marker.setLatLng([lat, lng]);
          }
        }

        if (isEditing) {
          marker.dragging?.enable();
        } else {
          marker.dragging?.disable();
        }
      }
    });

    return () => {
      active = false;
    };
  }, [isEditing, loading]);

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    console.log(`[Profile.jsx] File selected for ${field}:`, file ? file.name : 'No file selected');
    if (file) {
      setFiles(prev => ({ ...prev, [field]: file }));
      setPreview(prev => ({ ...prev, [field]: URL.createObjectURL(file) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("[Profile.jsx] Starting profile save process...");
    console.log("[Profile.jsx] Current customerId:", customerId);
    console.log("[Profile.jsx] Files state:", files);
    
    setSaving(true);
    
    try {
      const data = new FormData();
      
      const customerDto = {
        userId: user.id,
        ...formData,
        coordinates: formData.latitude && formData.longitude ? {
          type: 'Point',
          coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)]
        } : null
      };
      delete customerDto.latitude;
      delete customerDto.longitude;
      
      console.log("[Profile.jsx] Customer DTO being sent:", customerDto);
      
      data.append('customer', new Blob([JSON.stringify(customerDto)], {
        type: "application/json"
      }));

      if (files.profilePic) {
        console.log("[Profile.jsx] Appending profilePic file to FormData");
        data.append('profilePic', files.profilePic);
      }
      if (files.aadhar) {
        console.log("[Profile.jsx] Appending aadhar file to FormData");
        data.append('aadhar', files.aadhar);
      }

      let res;
      if (customerId) {
        // Update
        console.log(`[Profile.jsx] Sending PUT request to /api/customer/${customerId}`);
        res = await apiClient.put(`/api/customer/${customerId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log("[Profile.jsx] PUT request successful. Response:", res.data);
        toast.success("Profile updated successfully!");
      } else {
        // Create
        console.log("[Profile.jsx] Sending POST request to /api/customer");
        res = await apiClient.post(`/api/customer`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log("[Profile.jsx] POST request successful. Response:", res.data);
        toast.success("Profile created successfully!");
      }
      
      if (res.data) {
        const savedProfile = res.data.data || res.data;
        setStatus(savedProfile.verificationStatus || 'PENDING');
        setPreview({
          profilePic: savedProfile.profilePictureUrl || preview.profilePic,
          aadhar: savedProfile.aadharUrl || preview.aadhar
        });
        setFiles({ profilePic: null, aadhar: null }); // Clear selected files after successful upload
        setIsEditing(false); // Switch back to read-only after saving
        
        // Refresh token to get the updated CUSTOMER role
        await refreshUser();
      }

    } catch (err) {
      console.error("[Profile.jsx] Error occurred during save:", err);
      console.error("[Profile.jsx] Error Response Data:", err.response?.data);
      console.error("[Profile.jsx] Detailed Backend Error:", err.response?.data?.error);
      console.error("[Profile.jsx] Error Status:", err.response?.status);
      toast.error(err.response?.data?.message || "Failed to save profile. Please check the fields.");
    } finally {
      console.log("[Profile.jsx] Save process finished.");
      setSaving(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'VERIFIED':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200 shadow-sm"><CheckCircle size={14}/> Verified</span>;
      case 'NOT_VERIFIED':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold border border-red-200 shadow-sm"><AlertCircle size={14}/> Not Verified</span>;
      default:
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold border border-yellow-200 shadow-sm"><Clock size={14}/> Pending Verification</span>;
    }
  };

  if (loading) {
    return (
      <CloudsBackground>
        <div className="flex-1 pt-32 pb-12 px-4 sm:px-6 lg:px-8 relative font-sans w-full min-h-screen z-10 animate-pulse">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-slate-200 rounded-full shrink-0" />
                <div className="space-y-3">
                  <div className="w-48 h-8 bg-slate-200 rounded" />
                  <div className="w-32 h-4 bg-slate-200 rounded" />
                  <div className="w-24 h-5 bg-slate-200 rounded-md" />
                </div>
              </div>
              <div className="w-32 h-10 bg-slate-200 rounded-xl" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Details Cards */}
              <div className="lg:col-span-2 space-y-8">
                {/* Details Form Card */}
                <div className="bg-white/60 backdrop-blur-md p-8 rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
                  <div className="w-36 h-6 bg-slate-200 rounded" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="w-24 h-4 bg-slate-200 rounded" />
                        <div className="w-full h-12 bg-slate-200 rounded-xl" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Address Form Card */}
                <div className="bg-white/60 backdrop-blur-md p-8 rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
                  <div className="w-36 h-6 bg-slate-200 rounded" />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-slate-200 rounded" />
                      <div className="w-full h-12 bg-slate-200 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="w-20 h-4 bg-slate-200 rounded" />
                        <div className="w-full h-12 bg-slate-200 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <div className="w-20 h-4 bg-slate-200 rounded" />
                        <div className="w-full h-12 bg-slate-200 rounded-xl" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Side Card Skeleton */}
              <div className="space-y-8">
                <div className="bg-white/60 backdrop-blur-md p-8 rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
                  <div className="w-36 h-6 bg-slate-200 rounded" />
                  <div className="w-full h-40 bg-slate-200 rounded-2xl" />
                  <div className="w-full h-12 bg-slate-200 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CloudsBackground>
    );
  }

  return (
    <CloudsBackground>
      <div className="flex-1 pt-32 relative font-sans w-full py-12 px-4 sm:px-6 lg:px-8 overflow-y-auto z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75 }}
          className="max-w-5xl mx-auto space-y-8"
        >
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
          <div className="flex items-center gap-6">
            <div className="relative group">
              {/* Badge ring wrapper */}
              <div className={`rounded-full ${
                aura >= 800.0 
                  ? 'bg-gradient-to-tr from-purple-500 via-pink-400 to-indigo-500 p-1 shadow-[0_0_20px_rgba(168,85,247,0.6)] animate-pulse'
                  : aura >= 500.0 
                    ? 'bg-gradient-to-tr from-cyan-400 via-teal-350 to-blue-400 p-1 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                    : 'border-4 border-white shadow-lg'
              }`}>
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-4 border-white">
                  {preview.profilePic ? (
                    <img src={preview.profilePic} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={48} className="text-gray-300" />
                  )}
                </div>
              </div>
              
              {/* LinkedIn-style badge overlay at the bottom */}
              {aura !== null && aura >= 500.0 && (
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 px-3 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border border-white shadow flex items-center gap-0.5 whitespace-nowrap ${
                  aura >= 800.0
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                }`}>
                  <Star size={8} fill="currentColor" />
                  {aura >= 800.0 ? 'RADIANT TRUSTED' : 'LUMINOUS TRUSTED'}
                </div>
              )}

              <label className={`absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 transition-colors text-white p-2.5 rounded-full shadow-lg cursor-pointer transform translate-x-2 -translate-y-2 group-hover:scale-110 ${(!isEditing && 'hidden') || (aura !== null && aura >= 500.0 && 'translate-y-[-8px] translate-x-[8px]')}`}>
                <Camera size={18} />
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'profilePic')} disabled={!isEditing} />
              </label>
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {formData.firstName || formData.lastName ? `${formData.firstName} ${formData.lastName}` : 'Complete Your Profile'}
              </h1>
              <p className="text-gray-500 font-medium">{user?.email}</p>
              
              {user?.roles && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {(Array.isArray(user.roles) ? user.roles : [user.roles]).map((role, idx) => {
                    const roleName = typeof role === 'string' ? role.replace('ROLE_', '').replace('_', ' ') : String(role);
                    return (
                      <span key={idx} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-sm">
                        <Shield size={14} />
                        <span className="capitalize">{roleName.toLowerCase()}</span>
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2 items-center">
                {getStatusBadge()}
                {aura !== null && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100 shadow-sm">
                    <Star size={12} fill="currentColor" className="text-indigo-500" />
                    Aura: {aura.toFixed(1)}
                  </span>
                )}
                {aura !== null && getTrustBadge(aura)}
              </div>
              {aura !== null && aura < 300.0 && (
                <div className="mt-2.5 flex items-center gap-1.5 text-rose-600 text-xs font-semibold bg-rose-50/50 border border-rose-100 px-3 py-1.5 rounded-xl w-fit">
                  <AlertCircle size={14} />
                  <span>Stricter refund verification checks apply due to low aura (&lt; 300.0)</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-4 self-start md:self-center">
            {!isVendor && !isEditing && customerId && (
              <button 
                onClick={() => navigate('/vendor-onboard')} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl shadow-sm transition-all font-semibold flex items-center gap-2"
              >
                <Briefcase size={18} /> Apply for Vendor
              </button>
            )}
            {isVendor && !isEditing && (
              <button 
                onClick={() => navigate('/vendor-dashboard')} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl shadow-sm transition-all font-semibold flex items-center gap-2"
              >
                <Briefcase size={18} /> Vendor Dashboard
              </button>
            )}
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)} 
                className="bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 px-6 py-2.5 rounded-xl shadow-sm transition-all font-semibold flex items-center gap-2"
              >
                Edit Profile
              </button>
            )}
            {isEditing && (
              <button 
                onClick={handleSubmit} 
                disabled={saving}
                className="bg-gray-900 hover:bg-black text-white px-8 py-3 rounded-xl shadow-md transition-all font-semibold flex items-center gap-2 disabled:opacity-70"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : null}
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            )}
          </div>
        </div>

        {/* Main Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Info Card */}
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <User className="text-blue-500" /> Personal Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} disabled={!isEditing} required className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-800 shadow-sm disabled:opacity-60 disabled:bg-gray-50" placeholder="John" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Middle Name</label>
                  <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} disabled={!isEditing} className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-800 shadow-sm disabled:opacity-60 disabled:bg-gray-50" placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} disabled={!isEditing} required className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-800 shadow-sm disabled:opacity-60 disabled:bg-gray-50" placeholder="Doe" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-gray-400"><Phone size={18} /></span>
                    <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} disabled={!isEditing} required className="w-full bg-white pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-800 shadow-sm disabled:opacity-60 disabled:bg-gray-50" placeholder="+1 (555) 000-0000" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                  <textarea name="bio" value={formData.bio} onChange={handleChange} disabled={!isEditing} rows="4" className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-800 shadow-sm resize-none disabled:opacity-60 disabled:bg-gray-50" placeholder="Tell us a bit about yourself..."></textarea>
                </div>
              </div>
            </div>

            {/* Address Card */}
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <MapPin className="text-rose-500" /> Address Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 1 *</label>
                  <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleChange} disabled={!isEditing} required className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-gray-800 shadow-sm disabled:opacity-60 disabled:bg-gray-50" placeholder="Street Address" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 2</label>
                  <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} disabled={!isEditing} className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-gray-800 shadow-sm disabled:opacity-60 disabled:bg-gray-50" placeholder="Apartment, suite, etc." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">State *</label>
                  <input type="text" name="state" value={formData.state} onChange={handleChange} disabled={!isEditing} required className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-gray-800 shadow-sm disabled:opacity-60 disabled:bg-gray-50" placeholder="Your State" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode *</label>
                  <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} disabled={!isEditing} required className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-gray-800 shadow-sm disabled:opacity-60 disabled:bg-gray-50" placeholder="000000" />
                </div>

                {isEditing && (
                  <div className="md:col-span-2 flex justify-start">
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-sm font-semibold transition-all border border-rose-100 shadow-sm"
                    >
                      <MapPin size={16} /> Use Current GPS Location
                    </button>
                  </div>
                )}

                <div className="md:col-span-2 mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pinpoint Location on Map</label>
                  <div 
                    ref={mapRef} 
                    className="w-full h-64 rounded-2xl border border-gray-200 overflow-hidden shadow-inner z-0 relative"
                    style={{ minHeight: '250px' }}
                  />
                  {(formData.latitude || formData.longitude) ? (
                    <p className="text-xs text-slate-500 mt-2 font-medium">
                      Coordinates: {parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}
                    </p>
                  ) : (
                    <p className="text-xs text-rose-500 mt-2 font-medium animate-pulse">
                      * Please pinpoint your address on the map by clicking/dragging or click "Use Current GPS Location"
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Identity Card */}
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FileText className="text-amber-500" /> Identity Verification
              </h3>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">Please upload a clear picture of your Aadhar card for verification. This helps us maintain a secure platform.</p>
                
                <div className={`w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden group transition-colors ${isEditing ? 'hover:bg-gray-100' : ''}`}>
                  {preview.aadhar ? (
                    <div className="w-full h-full relative">
                      <img src={preview.aadhar} alt="Aadhar" className="w-full h-full object-cover" />
                      {isEditing && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white font-medium bg-black/50 px-4 py-2 rounded-lg">Change File</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center px-4">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Camera size={24} />
                      </div>
                      <p className="text-sm font-medium text-gray-700">Click to upload Aadhar</p>
                      <p className="text-xs text-gray-400 mt-1">JPEG, PNG or JPG (max. 5MB)</p>
                    </div>
                  )}
                  {isEditing && (
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleFileChange(e, 'aadhar')} />
                  )}
                </div>
              </div>
            </div>
            
          </div>
          
        </div>
        </motion.div>
      </div>
    </CloudsBackground>
  );
}
