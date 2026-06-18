import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, MapPin, Tag, ArrowLeft, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../lib/apiClient';
import CustomLoader from './CustomLoader';
import { toast } from 'sonner';

export default function ServiceDetailPage() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [service, setService] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchServiceAndVendor();
  }, [id]);

  const fetchServiceAndVendor = async () => {
    try {
      const serviceRes = await apiClient.get(`/api/services/${id}`);
      const serviceData = serviceRes.data?.data || serviceRes.data;
      setService(serviceData);
      
      if (serviceData?.vendorId) {
        const vendorRes = await apiClient.get(`/api/public/vendor/${serviceData.vendorId}`);
        setVendor(vendorRes.data?.data || vendorRes.data);
      }
    } catch (err) {
      console.error("Error fetching service details:", err);
      toast.error("Failed to load service details");
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to chat with the vendor");
      navigate('/signin');
      return;
    }
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      // 1. Initialize or find the conversation
      const conversationRes = await apiClient.post('/api/chat/conversations', {
        vendorId: service.vendorId,
        serviceId: service.id
      });
      
      const conversation = conversationRes.data?.data || conversationRes.data;
      
      // 2. Navigate to chats page with conversationId and initial message
      navigate(`/chats?id=${conversation.id}&msg=${encodeURIComponent(message.trim())}`);
      toast.success("Chat initialized successfully!");
    } catch (err) {
      console.error("Error initiating chat:", err);
      toast.error("Failed to start chat. Make sure you have completed your profile.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#CBE4F9] to-[#E3F2FC] flex items-center justify-center">
        <CustomLoader />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#CBE4F9] to-[#E3F2FC] pt-32 pb-24 px-4 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Service not found</h2>
        <button onClick={() => navigate('/services')} className="mt-4 bg-white/80 hover:bg-white text-gray-800 px-6 py-2 rounded-full border">
          Back to Services
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#CBE4F9] to-[#E3F2FC] pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="absolute inset-0 bg-noise pointer-events-none z-0"></div>
      
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Back button */}
        <button 
          onClick={() => navigate('/services')}
          className="flex items-center gap-2 text-gray-600 hover:text-black font-semibold text-sm mb-8 transition-colors bg-white/40 border border-white/50 px-4 py-2 rounded-full backdrop-blur-md shadow-sm"
        >
          <ArrowLeft size={16} /> Back to Services
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info (Left Column) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/50 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.03)]"
            >
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/80 border border-white/50 rounded-full text-xs font-bold text-gray-700 shadow-sm">
                  <Tag size={12} className="text-blue-500" />
                  {service.category}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/80 border border-white/50 rounded-full text-xs font-bold text-gray-700 shadow-sm">
                  <MapPin size={12} className="text-gray-400" />
                  {service.location || 'Remote'}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 font-serif leading-tight">
                {service.name}
              </h1>

              <div className="text-2xl font-extrabold text-blue-600 mb-8">
                ₹{service.price} <span className="text-sm font-semibold text-gray-500">starting price</span>
              </div>

              <div className="border-t border-white/40 pt-8">
                <h3 className="text-lg font-bold text-gray-800 mb-3">About this service</h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                  {service.description}
                </p>
              </div>
            </motion.div>

            {/* Vendor card */}
            {vendor && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/50 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex items-center gap-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xl font-bold shadow-md">
                  {vendor.businessName?.charAt(0) || 'V'}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">{vendor.businessName}</h4>
                  <p className="text-xs text-gray-500 font-semibold">{vendor.category} • {vendor.state}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Chat with Vendor (Right Column) */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgb(0,0,0,0.06)] sticky top-28"
            >
              <div className="w-12 h-12 bg-blue-50/80 rounded-full flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                <MessageSquare className="text-blue-500" size={22} />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2 font-serif tracking-tight">Chat with Vendor</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                Send an inquiry to discuss availability, customizations, or details.
              </p>

              <form onSubmit={handleStartChat} className="flex flex-col gap-4">
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about availability, packages..." 
                  rows="4"
                  required
                  className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-sm placeholder-gray-400 font-medium"
                ></textarea>

                <button 
                  type="submit" 
                  disabled={submitting || !message.trim()}
                  className="w-full py-4 bg-[#111111] hover:bg-black text-white font-semibold rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {submitting ? 'Connecting...' : 'Start Chat'}
                  <Send size={16} />
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
