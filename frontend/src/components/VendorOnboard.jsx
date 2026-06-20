import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import { toast } from 'sonner';
import { Briefcase, MapPin, Phone, Building2, Tag, CheckCircle, FileText, Loader2, ArrowLeft } from 'lucide-react';
import CloudsBackground from './CloudsBackground';
import 'leaflet/dist/leaflet.css';
import { FileUploaderRegular } from '@uploadcare/react-uploader';
import '@uploadcare/react-uploader/core.css';

export default function VendorOnboard() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    businessName: '',
    description: '',
    category: 'VENUE', // Default enum value
    phoneNumber: '',
    upiAddress: '',
    addressLine1: '',
    addressLine2: '',
    pincode: '',
    state: '',
    pan: '',
    gstNumber: '',
    profileImageUrl: '',
    latitude: '',
    longitude: ''
  });

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);

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

    if (!mapRef.current) return;

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
          draggable: true
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
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const payload = {
        ...formData,
        coordinates: formData.latitude && formData.longitude ? {
          type: 'Point',
          coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)]
        } : null
      };
      delete payload.latitude;
      delete payload.longitude;

      // POST to backend API
      const res = await apiClient.post('/api/user/request/vendor', payload);
      if (res.data) {
        toast.success("Application submitted successfully! Our admins will review it shortly.");
        navigate('/profile');
      }
    } catch (err) {
      console.error("Error submitting vendor application:", err);
      toast.error(err.response?.data?.message || "Failed to submit application. Please verify all fields.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <CloudsBackground>
      <div className="flex-1 pt-32 relative font-sans w-full py-12 px-4 sm:px-6 lg:px-8 overflow-y-auto z-10">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <button 
            onClick={() => navigate('/profile')} 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-semibold"
          >
            <ArrowLeft size={20} /> Back to Profile
          </button>

          {/* Header */}
          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white text-center">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3 shadow-sm">
              <Briefcase size={40} className="-rotate-3" />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Become a Vendor</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join Planit as a vendor to list your services, manage bookings, and grow your business. Fill out the application below to get started.
            </p>
          </div>

          {/* Application Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Business Info */}
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Building2 className="text-blue-500" /> Business Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name *</label>
                  <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} required className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-800 shadow-sm" placeholder="Your Business Name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-gray-400"><Tag size={18} /></span>
                    <select name="category" value={formData.category} onChange={handleChange} required className="w-full bg-white pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-800 shadow-sm appearance-none">
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
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Business Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} rows="4" className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-800 shadow-sm resize-none" placeholder="Describe what your business offers..."></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Image (Optional)</label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {formData.profileImageUrl && (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shadow-sm shrink-0">
                        <img src={formData.profileImageUrl} alt="Profile Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => setFormData(prev => ({ ...prev, profileImageUrl: '' }))} 
                          className="absolute top-1 right-1 bg-white/85 p-1 rounded-full text-red-500 hover:text-red-750 transition-colors shadow-sm"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <FileUploaderRegular
                      pubkey="demopublickey"
                      maxLocalFileSizeBytes={10000000}
                      multiple={false}
                      imgOnly={true}
                      sourceList="local, url, camera"
                      className="uc-light"
                      onChange={(e) => {
                        const successfulFiles = e.allEntries.filter((file) => file.status === "success");
                        if (successfulFiles.length > 0) {
                          const url = successfulFiles[0].cdnUrl;
                          setFormData(prev => ({ ...prev, profileImageUrl: url }));
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Phone className="text-green-500" /> Contact Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Business Phone *</label>
                  <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-gray-800 shadow-sm" placeholder="+1 (555) 000-0000" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">UPI Address</label>
                  <input type="text" name="upiAddress" value={formData.upiAddress} onChange={handleChange} className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-gray-800 shadow-sm" placeholder="yourname@upi" />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <MapPin className="text-rose-500" /> Business Address
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 1 *</label>
                  <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleChange} required className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-gray-800 shadow-sm" placeholder="Street Address" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address Line 2</label>
                  <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-gray-800 shadow-sm" placeholder="Apartment, suite, etc." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">State *</label>
                  <input type="text" name="state" value={formData.state} onChange={handleChange} required className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-gray-800 shadow-sm" placeholder="Your State" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode *</label>
                  <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} required className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none transition-all text-gray-800 shadow-sm" placeholder="000000" />
                </div>

                <div className="md:col-span-2 flex justify-start">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-sm font-semibold transition-all border border-rose-100 shadow-sm"
                  >
                    <MapPin size={16} /> Use Current GPS Location
                  </button>
                </div>

                <div className="md:col-span-2 mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pinpoint Business Location on Map</label>
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
                      * Please pinpoint your business location on the map by clicking/dragging or click "Use Current GPS Location"
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tax & Legal */}
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-sm border border-white">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FileText className="text-purple-500" /> Legal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">PAN Number *</label>
                  <input type="text" name="pan" value={formData.pan} onChange={handleChange} required className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-gray-800 shadow-sm uppercase" placeholder="ABCDE1234F" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">GST Number *</label>
                  <input type="text" name="gstNumber" value={formData.gstNumber} onChange={handleChange} required className="w-full bg-white px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-gray-800 shadow-sm uppercase" placeholder="22AAAAA0000A1Z5" />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-6">
              <button 
                type="submit" 
                disabled={saving}
                className="bg-gray-900 hover:bg-black text-white px-10 py-4 rounded-xl shadow-lg transition-all font-bold flex items-center gap-2 disabled:opacity-70 text-lg"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                {saving ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </CloudsBackground>
  );
}
