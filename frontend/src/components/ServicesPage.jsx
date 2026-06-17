import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Tag, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import apiClient from '../lib/apiClient';
import CustomLoader from './CustomLoader';

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await apiClient.get('/api/services?page=0&size=100');
      const content = res.data?.data?.content || res.data?.content || [];
      setServices(Array.isArray(content) ? content : []);
    } catch (err) {
      console.error("Error fetching services:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#CBE4F9] to-[#E3F2FC] flex items-center justify-center">
        <CustomLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#CBE4F9] to-[#E3F2FC] pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-noise pointer-events-none z-0"></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header section */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-serif tracking-tight text-gray-900 mb-4"
          >
            Explore Services
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600 text-lg"
          >
            Connect with top-rated professional vendors for equipment, styling, and services.
          </motion.p>
        </div>

        {/* Search bar */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-md mx-auto mb-12"
        >
          <div className="relative bg-white/40 backdrop-blur-xl border border-white/60 rounded-full px-5 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center">
            <Search className="text-gray-400 mr-3" size={20} />
            <input 
              type="text" 
              placeholder="Search services, locations, categories..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 w-full text-sm font-medium"
            />
          </div>
        </motion.div>

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-20 bg-white/40 backdrop-blur-md border border-white/20 rounded-3xl p-8 max-w-lg mx-auto shadow-sm">
            <p className="text-gray-500 font-semibold text-lg">No services found</p>
            <p className="text-gray-400 text-sm mt-1">Try refining your search keyword or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/services/${service.id}`)}
                className="bg-white/50 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between group h-[300px]"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 border border-white/50 rounded-full text-xs font-bold text-gray-700 shadow-sm">
                      <Tag size={12} className="text-blue-500" />
                      {service.category}
                    </span>
                    <span className="text-xl font-extrabold text-blue-600 font-sans">
                      ₹{service.price}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 truncate">
                    {service.name}
                  </h3>
                  
                  <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3">
                    {service.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/40 flex items-center justify-between">
                  <span className="flex items-center text-xs font-semibold text-gray-500 gap-1">
                    <MapPin size={14} className="text-gray-400" />
                    {service.location || 'Remote'}
                  </span>
                  
                  <span className="flex items-center text-sm font-bold text-gray-800 gap-1 group-hover:gap-2 transition-all">
                    View Details
                    <ArrowRight size={16} className="text-gray-600 group-hover:text-black" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
