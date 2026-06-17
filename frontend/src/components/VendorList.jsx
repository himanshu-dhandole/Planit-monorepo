import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Star,
  ShieldCheck,
  Clock,
  ShieldAlert,
  Loader2,
  Navigation,
  Sliders,
  Store
} from "lucide-react";
import apiClient from "../lib/apiClient";
import CloudsBackground from "./CloudsBackground";
import PageTransition from "./PageTransition";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css";

export default function VendorList() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Proximity filter states
  const [useLocationFilter, setUseLocationFilter] = useState(false);
  const [userLocation, setUserLocation] = useState(null); // { lat, lon }
  const [distance, setDistance] = useState(10000); // meters (default 10km)
  const [locLoading, setLocLoading] = useState(false);
  const [hoveredVendorId, setHoveredVendorId] = useState(null);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const vendorMarkers = useRef({});
  const userMarkerRef = useRef(null);

  // Fetch vendors whenever filter options change
  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      try {
        let endpoint = "/api/public/vendor?page=0&size=50";
        if (useLocationFilter && userLocation) {
          endpoint = `/api/public/vendor/near?lat=${userLocation.lat}&lon=${userLocation.lon}&distance=${distance}&page=0&size=50`;
        }
        const response = await apiClient.get(endpoint);
        const responseData = response.data.data || response.data;
        setVendors(responseData.content || []);
      } catch (err) {
        console.error("Error fetching vendors:", err);
        setError("Failed to load vendors. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, [useLocationFilter, userLocation, distance]);

  // Request browser Geolocation API
  const enableLocationSearch = () => {
    if (useLocationFilter) {
      setUseLocationFilter(false);
      toast.info("Showing all vendors globally.");
      return;
    }

    setLocLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lon: longitude });
          setUseLocationFilter(true);
          setLocLoading(false);
          toast.success("Nearby vendors filter enabled!");
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocLoading(false);
          toast.error("Unable to retrieve your location. Please select coordinates manually.");
        }
      );
    } else {
      setLocLoading(false);
      toast.error("Geolocation is not supported by your browser.");
    }
  };

  // Cleanup map instance on unmount
  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Initialize and update Leaflet Map
  useEffect(() => {
    let active = true;
    if (!mapRef.current) return;

    import("leaflet").then((L) => {
      if (!active || !mapRef.current) return;

      // User animated pulsing GPS marker
      const customUserIcon = L.default.divIcon({
        html: `<div class="relative flex h-6 w-6 items-center justify-center">
                 <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                 <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-600 border-2 border-white shadow"></span>
               </div>`,
        className: "custom-user-marker",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      // Custom premium vendor location icon
      const getVendorIcon = (isHovered) => L.default.divIcon({
        html: `<div class="flex h-10 w-10 items-center justify-center rounded-2xl ${isHovered ? "bg-rose-600 scale-110 shadow-lg shadow-rose-200" : "bg-indigo-600 shadow-indigo-100 shadow-md"} text-white border-2 border-white transition-all duration-300 transform">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.4-4c.3-.3.8-.5 1.2-.5h8.8c.4 0 .9.2 1.2.5L22 7"/><path d="M9 17v-5"/><path d="M15 17v-5"/><path d="M3 7v10a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V7"/><path d="M12 17v-3"/></svg>
               </div>`,
        className: "custom-vendor-marker",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      });

      const mapCenter = userLocation ? [userLocation.lat, userLocation.lon] : [20.5937, 78.9629];
      const mapZoom = userLocation ? 12 : 5;

      // Create map once
      if (!mapInstance.current) {
        const map = L.default.map(mapRef.current).setView(mapCenter, mapZoom);
        L.default.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        mapInstance.current = map;
      }

      const map = mapInstance.current;

      // Redraw dimensions properly inside layout grids
      setTimeout(() => {
        if (map) map.invalidateSize();
      }, 100);

      // Handle user current location marker
      if (userLocation) {
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lon]);
        } else {
          userMarkerRef.current = L.default.marker([userLocation.lat, userLocation.lon], {
            icon: customUserIcon
          }).addTo(map);
        }
        if (useLocationFilter) {
          map.setView([userLocation.lat, userLocation.lon], 12);
        }
      } else if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }

      // Remove existing vendor markers
      Object.values(vendorMarkers.current).forEach((marker) => marker.remove());
      vendorMarkers.current = {};

      // Place new vendor markers
      vendors.forEach((vendor) => {
        const coordinates = vendor.coordinates?.coordinates;
        if (coordinates && coordinates.length === 2) {
          const lat = coordinates[1];
          const lon = coordinates[0];

          const isHovered = hoveredVendorId === vendor.id;
          const marker = L.default.marker([lat, lon], {
            icon: getVendorIcon(isHovered)
          }).addTo(map);

          marker.bindPopup(`
            <div class="p-1 font-sans text-xs">
              <strong class="text-slate-900">${vendor.businessName}</strong>
              <div class="text-slate-500 mt-1">${vendor.addressLine1 || ""}, ${vendor.state}</div>
              <div class="text-indigo-600 font-bold mt-1">${vendor.category}</div>
            </div>
          `, { closeButton: false });

          marker.on("click", () => {
            const el = document.getElementById(`vendor-card-${vendor.id}`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          });

          if (isHovered) {
            marker.openPopup();
          }

          vendorMarkers.current[vendor.id] = marker;
        }
      });

      // Fit bounds to show all markers if location filter is not active
      if (!useLocationFilter && vendors.length > 0) {
        const markerList = Object.values(vendorMarkers.current);
        if (markerList.length > 0) {
          const group = new L.default.featureGroup(markerList);
          map.fitBounds(group.getBounds().pad(0.1));
        }
      }
    });

    return () => {
      active = false;
    };
  }, [vendors, userLocation, useLocationFilter, hoveredVendorId]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <CloudsBackground>
      <PageTransition className="flex-1 pt-32 relative font-sans w-full min-h-screen py-12 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header Card */}
          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl -mr-32 -mt-32 -z-10" />
            <div>
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight"
              >
                Our Vendors
              </motion.h1>
              <p className="mt-3 text-lg text-slate-600 font-medium max-w-2xl">
                Discover top-rated professionals and businesses ready to make your next event unforgettable.
              </p>
            </div>

            {/* Geolocation Radius Controls */}
            <div className="flex flex-col gap-3 flex-shrink-0 self-start md:self-center w-full md:w-auto">
              <button
                onClick={enableLocationSearch}
                disabled={locLoading}
                className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all shadow-md text-sm ${
                  useLocationFilter
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                } disabled:opacity-75`}
              >
                {locLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Navigation size={18} className={useLocationFilter ? "animate-pulse" : ""} />
                )}
                {useLocationFilter ? "Show All Vendors" : "Find Vendors Near Me"}
              </button>

              {useLocationFilter && (
                <div className="bg-white/80 backdrop-blur-sm border border-slate-100 p-4 rounded-2xl shadow-sm flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                    <span className="flex items-center gap-1"><Sliders size={14} /> Search Radius</span>
                    <span className="text-indigo-600">{(distance / 1000).toFixed(0)} km</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="50000"
                    step="1000"
                    value={distance}
                    onChange={(e) => setDistance(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                    <span>1 km</span>
                    <span>25 km</span>
                    <span>50 km</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Split Dashboard (Map + List) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Vendor List */}
            <div className="lg:col-span-7 space-y-6">
              {loading && vendors.length === 0 ? (
                <div className="flex justify-center items-center py-24 bg-white/50 backdrop-blur rounded-3xl border border-white">
                  <Loader2 className="animate-spin text-indigo-500" size={48} />
                </div>
              ) : error ? (
                <div className="text-center text-rose-500 font-medium py-12 bg-white/50 backdrop-blur rounded-3xl border border-white">
                  {error}
                </div>
              ) : vendors.length === 0 ? (
                <div className="text-center text-slate-500 font-medium py-16 bg-white/50 backdrop-blur rounded-3xl border border-white flex flex-col items-center justify-center gap-3">
                  <Store size={40} className="text-slate-300" />
                  <span>No vendors found in this region. Try expanding your search radius!</span>
                </div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6"
                >
                  {vendors.map((vendor) => (
                    <motion.div
                      key={vendor.id}
                      id={`vendor-card-${vendor.id}`}
                      variants={itemVariants}
                      whileHover={{ y: -5 }}
                      onMouseEnter={() => setHoveredVendorId(vendor.id)}
                      onMouseLeave={() => setHoveredVendorId(null)}
                      className={`bg-white/80 backdrop-blur-md border rounded-3xl p-6 shadow-[0_8px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all group flex flex-col h-full ${
                        hoveredVendorId === vendor.id
                          ? "border-indigo-500 ring-2 ring-indigo-100"
                          : "border-white"
                      }`}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 overflow-hidden flex-shrink-0 border-4 border-white shadow-sm flex items-center justify-center text-indigo-300 font-bold text-2xl">
                          {vendor.profileImageUrl ? (
                            <img
                              src={vendor.profileImageUrl}
                              alt={vendor.businessName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            vendor.businessName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <h3 className="font-extrabold text-slate-900 text-lg truncate group-hover:text-indigo-600 transition-colors">
                            {vendor.businessName}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-medium">
                            <MapPin size={13} className="text-indigo-400" />
                            <span className="truncate">
                              {vendor.addressLine1 || "Location varies"},{" "}
                              {vendor.state}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-slate-500 text-xs mb-6 line-clamp-2 flex-1">
                        {vendor.description || "No description provided."}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md text-[10px] font-bold">
                            <Star size={10} fill="currentColor" />
                            <span>{vendor.karma > 0 ? vendor.karma.toFixed(1) : "New"}</span>
                          </div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {vendor.totalBookings || 0} bookings
                          </div>
                        </div>

                        <div>
                          {vendor.verificationStatus === "VERIFIED" ? (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                              <ShieldCheck size={12} />
                              Verified
                            </div>
                          ) : vendor.verificationStatus === "PENDING" ? (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                              <Clock size={12} />
                              Pending
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                              <ShieldAlert size={12} />
                              Unverified
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Right Column: Interactive Map */}
            <div className="lg:col-span-5 lg:sticky lg:top-40 z-0">
              <div className="bg-white/70 backdrop-blur-xl p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                <div 
                  ref={mapRef} 
                  className="w-full rounded-2xl overflow-hidden shadow-inner border border-slate-100"
                  style={{ height: "calc(100vh - 300px)", minHeight: "450px" }}
                />
              </div>
            </div>

          </div>
        </div>
      </PageTransition>
    </CloudsBackground>
  );
}
