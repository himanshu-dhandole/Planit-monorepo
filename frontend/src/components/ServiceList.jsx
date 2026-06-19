import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  IndianRupee,
  Star,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";
import apiClient from "../lib/apiClient";
import { useNavigate } from "react-router-dom";
import CloudsBackground from "./CloudsBackground";
import PageTransition from "./PageTransition";

const categories = [
  "ALL",
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

// Carousel Component for Service Cards
const ImageCarousel = ({ photos, name }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let interval;
    if (isHovered && photos && photos.length > 1) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isHovered, photos]);
  
  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  if (!photos || photos.length === 0) {
    return (
      <div className="w-full h-full bg-indigo-50 flex items-center justify-center">
        <span className="text-indigo-200 font-medium text-sm">No photos</span>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full group overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {photos.map((photo, index) => (
        <img
          key={index}
          src={photo}
          alt={`${name} photo ${index + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
            index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
          loading="lazy"
        />
      ))}
      
      {photos.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 backdrop-blur text-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm z-10"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 backdrop-blur text-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm z-10"
          >
            <ChevronRight size={18} />
          </button>
          
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {photos.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function ServiceList() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

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
    const matchesCategory =
      categoryFilter === "ALL" ? true : service.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <CloudsBackground>
      <PageTransition className="flex-1 pt-24 relative font-sans w-full min-h-screen py-12 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Header & Search Bar (Wallet Theme Inspired) */}
          <div className="text-center pt-12 mb-10 relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl -z-10 opacity-60" />
            
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight"
            >
              Discover Services
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-lg text-slate-600 font-medium max-w-2xl mx-auto mb-10"
            >
              Find the perfect vendors, venues, and experiences for your next unforgettable event.
            </motion.p>

            {/* Floating Search Bar */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="max-w-3xl mx-auto bg-white/80 backdrop-blur-xl p-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white flex items-center gap-2"
            >
               <div className="pl-4 text-slate-400 shrink-0">
                  <Search size={22} />
               </div>
               <input
                  type="text"
                  placeholder="What are you looking for?"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent border-none py-3 px-2 text-lg focus:ring-0 outline-none text-slate-700 placeholder-slate-400 font-medium"
                />
               <div className="shrink-0 pr-2">
                 <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full font-bold transition-colors shadow-md">
                    Search
                 </button>
               </div>
            </motion.div>
          </div>

          {/* Categories Horizontal Scroll */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar max-w-7xl mx-auto px-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
             {categories.map((cat) => (
               <button
                 key={cat}
                 onClick={() => setCategoryFilter(cat)}
                 className={`whitespace-nowrap px-6 py-3 rounded-full text-sm font-bold transition-all ${
                   categoryFilter === cat 
                   ? 'bg-slate-900 text-white shadow-lg' 
                   : 'bg-white/80 backdrop-blur-md text-slate-600 hover:bg-white hover:shadow border border-white'
                 }`}
               >
                 {cat === 'ALL' ? 'All Services' : cat.charAt(0) + cat.slice(1).toLowerCase()}
               </button>
             ))}
          </motion.div>

          {/* Services Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div
                  key={n}
                  className="bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)] animate-pulse flex flex-col h-[420px]"
                >
                  {/* Carousel Placeholder */}
                  <div className="relative h-60 w-full p-3 pb-0">
                    <div className="w-full h-full rounded-2xl bg-slate-200" />
                  </div>
                  {/* Content Section */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <div className="w-2/3 h-5 bg-slate-200 rounded" />
                        <div className="w-12 h-5 bg-slate-200 rounded-lg" />
                      </div>
                      <div className="w-full h-4 bg-slate-200 rounded" />
                      <div className="w-5/6 h-4 bg-slate-200 rounded" />
                    </div>
                    <div className="flex justify-between items-end pt-4 border-t border-slate-100/60 mt-4">
                      <div className="space-y-1">
                        <div className="w-12 h-3 bg-slate-200 rounded" />
                        <div className="w-20 h-5 bg-slate-200 rounded" />
                      </div>
                      <div className="space-y-1 text-right flex flex-col items-end">
                        <div className="w-16 h-4.5 bg-slate-200 rounded-lg" />
                        <div className="w-12 h-3.5 bg-slate-200 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              <AnimatePresence>
                {filteredServices.length > 0 ? (
                  filteredServices.map((service, index) => (
                    <motion.div
                      key={service.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.75, delay: index * 0.05 }}
                      onClick={() => navigate(`/services/${service.id}`)}
                      className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.12)] transition-all group cursor-pointer flex flex-col"
                    >
                      {/* Carousel Top Section */}
                      <div className="relative h-60 w-full p-3 pb-0">
                         <div className="w-full h-full rounded-2xl overflow-hidden relative shadow-sm">
                            <ImageCarousel photos={service.photos} name={service.name} />
                         </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2 gap-2">
                           <div>
                              <h3 className="font-extrabold text-slate-900 text-lg leading-tight line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                {service.name}
                              </h3>
                           </div>
                           <div className="flex items-center gap-1 text-slate-700 bg-slate-100/80 px-2 py-1 rounded-lg text-xs font-bold shrink-0">
                             <Star size={12} className="text-amber-500" fill="currentColor" />
                             <span>
                               {service.rating > 0
                                 ? service.rating.toFixed(1)
                                 : "New"}
                             </span>
                           </div>
                        </div>

                        <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">
                          {service.description}
                        </p>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                               Starting at
                            </span>
                            <div className="flex items-center text-slate-900 font-extrabold text-lg">
                              <IndianRupee size={16} strokeWidth={3} className="mr-0.5 text-slate-400" />
                              {service.price}
                            </div>
                          </div>

                          <div className="flex flex-col items-end">
                             <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-lg uppercase tracking-wider mb-1.5">
                               {service.category}
                             </span>
                             {service.availableLocations &&
                             service.availableLocations.length > 0 ? (
                               <div className="flex items-center gap-1 text-slate-500 text-xs font-medium">
                                 <MapPin size={12} className="text-indigo-400 shrink-0" />
                                 <span className="truncate max-w-[100px]">
                                   {service.availableLocations[0].city}
                                   {service.availableLocations.length > 1 && "..."}
                                 </span>
                               </div>
                             ) : (
                               <div className="flex items-center gap-1 text-slate-500 text-xs font-medium">
                                 <MapPin size={12} className="text-indigo-400 shrink-0" />
                                 <span className="truncate max-w-[100px]">
                                   {service.location || "Multiple"}
                                 </span>
                               </div>
                             )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center text-slate-500 font-medium bg-white/50 backdrop-blur-sm rounded-3xl border border-white shadow-sm">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                       <Search size={24} className="text-slate-400" />
                    </div>
                    <p className="text-lg">No services found matching your criteria.</p>
                    <button 
                       onClick={() => { setSearchTerm(""); setCategoryFilter("ALL"); }}
                       className="mt-4 text-indigo-600 font-bold hover:text-indigo-700"
                    >
                       Clear Filters
                    </button>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </PageTransition>

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </CloudsBackground>
  );
}
