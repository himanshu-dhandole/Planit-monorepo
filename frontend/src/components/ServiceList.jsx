import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  IndianRupee,
  Filter,
  Star,
  Loader2,
} from "lucide-react";
import apiClient from "../lib/apiClient";
import { useNavigate } from "react-router-dom";
import CloudsBackground from "./CloudsBackground";
import PageTransition from "./PageTransition";

export default function ServiceList() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const categories = [
    "DECORATION",
    "CATERING",
    "VENUE",
    "ENTERTAINMENT",
    "PHOTOGRAPHY",
    "TRANSPORTATION",
    "MUSIC",
    "MAKEUP",
    "TRANSPORT",
    "LOGISTICS",
    "OTHER",
  ];

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/services?page=0&size=100");
      const data = res.data?.data?.content || res.data?.content || [];
      setServices(data);
    } catch (err) {
      console.error("Error fetching services:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description &&
        service.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter
      ? service.category === categoryFilter
      : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <CloudsBackground>
      <PageTransition className="flex-1 pt-32 relative font-sans w-full min-h-screen py-12 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Header & Search Bar */}
          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl -mr-32 -mt-32 -z-10" />

            <div className="text-center mb-8">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight"
              >
                Discover Services
              </motion.h1>
              <p className="mt-3 text-lg text-slate-600 font-medium">
                Find the perfect vendors and services for your next event.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center max-w-4xl mx-auto">
              <div className="relative w-full flex-1">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search services by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm text-slate-700"
                />
              </div>

              <div className="relative w-full md:w-64 shrink-0">
                <Filter
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm text-slate-700 appearance-none cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0) + cat.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Services Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin text-indigo-500" size={48} />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              <AnimatePresence>
                {filteredServices.length > 0 ? (
                  filteredServices.map((service, index) => (
                    <motion.div
                      key={service.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      onClick={() => navigate(`/services/${service.id}`)}
                      className="bg-white/80 backdrop-blur-md border border-white rounded-3xl p-5 shadow-[0_8px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all group flex flex-col h-full cursor-pointer"
                    >
                      {/* Funky Stacked Photos */}
                      <div className="relative h-48 w-full mb-6 mt-2 perspective-1000">
                        {service.photos && service.photos.length > 0 ? (
                          <div className="relative w-full h-full group-hover:scale-105 transition-transform duration-500">
                            {service.photos.slice(0, 3).map((photo, i) => {
                              const isTop = i === 0;
                              const rotation = isTop
                                ? 0
                                : (i % 2 === 0 ? 6 : -6) * i;
                              return (
                                <img
                                  key={i}
                                  src={photo}
                                  alt={`${service.name} preview ${i}`}
                                  className={`absolute inset-0 w-full h-full object-cover rounded-2xl border-4 border-white shadow-md transition-all duration-500 ${isTop ? "z-30" : i === 1 ? "z-20" : "z-10"}`}
                                  style={{
                                    transform: `rotate(${rotation}deg) scale(${1 - i * 0.05}) translateY(${i * 8}px)`,
                                    transformOrigin: "bottom center",
                                  }}
                                />
                              );
                            })}
                          </div>
                        ) : (
                          <div className="w-full h-full bg-indigo-50 rounded-2xl border-4 border-white shadow-sm flex items-center justify-center">
                            <span className="text-indigo-200 font-medium">
                              No photos
                            </span>
                          </div>
                        )}

                        {/* Price Badge */}
                        <div className="absolute -top-3 -right-3 z-40 bg-indigo-600 text-white px-3 py-1.5 rounded-xl shadow-lg font-bold flex items-center transform rotate-3 group-hover:rotate-0 transition-transform">
                          <IndianRupee size={14} className="mr-0.5" />
                          {service.price}
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg uppercase tracking-wider">
                            {service.category}
                          </span>
                          <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md text-xs font-bold">
                            <Star size={12} fill="currentColor" />
                            <span>
                              {service.rating > 0
                                ? service.rating.toFixed(1)
                                : "New"}
                            </span>
                          </div>
                        </div>

                        <h3 className="font-extrabold text-slate-900 text-xl mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                          {service.name}
                        </h3>

                        <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">
                          {service.description}
                        </p>

                        {service.availableLocations &&
                        service.availableLocations.length > 0 ? (
                          <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold mt-auto pt-4 border-t border-slate-100">
                            <MapPin size={14} className="text-indigo-400" />
                            <span className="truncate">
                              {service.availableLocations
                                .map((l) => l.city)
                                .join(", ")}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold mt-auto pt-4 border-t border-slate-100">
                            <MapPin size={14} className="text-indigo-400" />
                            <span className="truncate">
                              {service.location || "Location varies"}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center text-slate-500 font-medium bg-white/50 rounded-3xl border border-white">
                    No services found matching your criteria.
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </PageTransition>
    </CloudsBackground>
  );
}
