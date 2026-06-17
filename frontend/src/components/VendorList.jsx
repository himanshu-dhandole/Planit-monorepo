import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Star,
  ShieldCheck,
  Clock,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import apiClient from "../lib/apiClient";
import CloudsBackground from "./CloudsBackground";
import PageTransition from "./PageTransition";

export default function VendorList() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await apiClient.get(
          "/api/public/vendor?page=0&size=50",
        );
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
  }, []);

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

  if (loading) {
    return (
      <CloudsBackground>
        <div className="flex-1 flex justify-center items-center h-screen">
          <Loader2 className="animate-spin text-indigo-500" size={48} />
        </div>
      </CloudsBackground>
    );
  }

  if (error) {
    return (
      <CloudsBackground>
        <div className="flex-1 flex justify-center items-center h-screen text-red-500 font-medium">
          {error}
        </div>
      </CloudsBackground>
    );
  }

  return (
    <CloudsBackground>
      <PageTransition className="flex-1 pt-32 relative font-sans w-full min-h-screen py-12 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="bg-white/70 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white relative overflow-hidden text-center mb-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl -mr-32 -mt-32 -z-10" />
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight"
            >
              Our Vendors
            </motion.h1>
            <p className="mt-3 text-lg text-slate-600 font-medium max-w-2xl mx-auto">
              Discover top-rated professionals and businesses ready to make your
              next event unforgettable.
            </p>
          </div>

          {vendors.length === 0 ? (
            <div className="text-center text-slate-500 font-medium py-12 bg-white/50 backdrop-blur rounded-3xl border border-white">
              No vendors found.
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {vendors.map((vendor) => (
                <motion.div
                  key={vendor.id}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className="bg-white/80 backdrop-blur-md border border-white rounded-3xl p-6 shadow-[0_8px_20px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all group flex flex-col h-full"
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
                      <h3 className="font-extrabold text-slate-900 text-xl truncate group-hover:text-indigo-600 transition-colors">
                        {vendor.businessName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1 font-medium">
                        <MapPin size={14} className="text-indigo-400" />
                        <span className="truncate">
                          {vendor.addressLine1 || "Location varies"},{" "}
                          {vendor.state}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-slate-500 text-sm mb-6 line-clamp-2 flex-1">
                    {vendor.description || "No description provided."}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md text-xs font-bold">
                        <Star size={12} fill="currentColor" />
                        <span>{vendor.karma > 0 ? vendor.karma : "New"}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {vendor.totalBookings || 0} reviews
                      </div>
                    </div>

                    <div>
                      {vendor.verificationStatus === "VERIFIED" ? (
                        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                          <ShieldCheck size={14} />
                          Verified
                        </div>
                      ) : vendor.verificationStatus === "PENDING" ? (
                        <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                          <Clock size={14} />
                          Pending
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                          <ShieldAlert size={14} />
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
      </PageTransition>
    </CloudsBackground>
  );
}
