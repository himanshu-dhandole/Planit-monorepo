import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  IndianRupee,
  Star,
  Loader2,
  ArrowLeft,
  Share,
  Heart,
  ShieldCheck,
  Scale,
  Activity,
  CalendarCheck,
  Sparkles,
  Crown,
} from "lucide-react";
import apiClient from "../lib/apiClient";
import CloudsBackground from "./CloudsBackground";
import PageTransition from "./PageTransition";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import Autoplay from "embla-carousel-autoplay";

export default function ServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState(null);
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await apiClient.get(`/api/services/${id}`);
        setService(res.data?.data || res.data);
      } catch (err) {
        console.error("Error fetching service details:", err);
        toast.error("Failed to load service details.");
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  if (loading) {
    return (
      <CloudsBackground>
        <div className="flex-1 flex justify-center items-center min-h-screen pt-20">
          <Loader2 className="animate-spin text-indigo-500" size={48} />
        </div>
      </CloudsBackground>
    );
  }

  if (!service) {
    return (
      <CloudsBackground>
        <div className="flex-1 flex flex-col justify-center items-center min-h-screen pt-20">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">
            Service not found
          </h2>
          <button
            onClick={() => navigate("/services")}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            Back to Services
          </button>
        </div>
      </CloudsBackground>
    );
  }

  // Format locations
  const locationText =
    service.availableLocations && service.availableLocations.length > 0
      ? service.availableLocations.map((l) => l.city).join(", ")
      : service.location || "Location not specified";

  return (
    <CloudsBackground>
      <PageTransition className="flex-1 pt-32 pb-12 px-4 sm:px-6 lg:px-8 relative font-sans w-full min-h-screen z-10">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Top Bar Navigation */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-slate-600 hover:text-indigo-600 transition-colors font-medium bg-white/50 px-4 py-2 rounded-xl backdrop-blur-sm border border-white"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back
            </button>
            <div className="flex gap-3">
              <button className="flex items-center text-slate-600 hover:text-rose-500 transition-colors bg-white/50 p-2.5 rounded-xl backdrop-blur-sm border border-white group">
                <Heart size={20} className="group-hover:fill-rose-500" />
              </button>
              <button className="flex items-center text-slate-600 hover:text-indigo-600 transition-colors bg-white/50 p-2.5 rounded-xl backdrop-blur-sm border border-white">
                <Share size={20} />
              </button>
            </div>
          </div>

          {/* Header Section */}
          <div className="text-center mb-8 relative">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight"
            >
              {service.name}
            </motion.h1>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-4 flex flex-wrap justify-center items-center gap-4 text-sm font-medium text-slate-700"
            >
              <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-3 py-1 rounded-full font-bold">
                <Star size={16} fill="currentColor" />
                <span>
                  {service.rating > 0 ? service.rating.toFixed(1) : "New"}
                </span>
                {service.reviews && service.reviews.length > 0 && (
                  <span className="text-amber-500 ml-1">
                    ({service.reviews.length} reviews)
                  </span>
                )}
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1 text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full font-bold uppercase tracking-wider text-xs">
                {service.category}
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1 text-slate-600 bg-slate-50 px-3 py-1 rounded-full font-bold">
                <MapPin size={16} className="text-indigo-400" />
                <span>{locationText}</span>
              </div>
            </motion.div>
          </div>

          {/* Image Slider using Shadcn Carousel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-5xl mx-auto mt-8"
          >
            {service.photos && service.photos.length > 0 ? (
              <div className="relative">
                <Carousel
                  setApi={setApi}
                  className="w-full"
                  opts={{
                    loop: true,
                  }}
                  plugins={[
                    Autoplay({
                      delay: 4000,
                    }),
                  ]}
                >
                  <CarouselContent>
                    {service.photos.map((photo, i) => (
                      <CarouselItem key={i}>
                        <div className="w-full h-[40vh] md:h-[50vh] max-h-[500px] overflow-hidden rounded-3xl relative shadow-[0_8px_30px_rgb(0,0,0,0.08)] bg-slate-100 border-4 border-white">
                          <img
                            src={photo}
                            alt={`${service.name} image ${i}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80" />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>

                  {/* Custom themed navigation buttons */}
                  <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white/90 backdrop-blur-md border-white/50 text-indigo-900 transition-all shadow-lg scale-110" />
                  <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/50 hover:bg-white/90 backdrop-blur-md border-white/50 text-indigo-900 transition-all shadow-lg scale-110" />
                </Carousel>

                {/* Dots Indicator */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 z-10 bg-black/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/20">
                  {Array.from({ length: count }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => api?.scrollTo(i)}
                      className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                        i + 1 === current
                          ? "bg-white scale-125 w-4"
                          : "bg-white/50 hover:bg-white/80"
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-full h-[40vh] md:h-[50vh] max-h-[500px] rounded-3xl bg-indigo-50 flex items-center justify-center border-4 border-white shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                <span className="text-indigo-300 text-xl font-semibold">
                  No photos available
                </span>
              </div>
            )}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
            {/* Left Column: Info & Trust Badges */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description Card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-125 duration-1000 -z-10" />

                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  About this service
                </h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-lg">
                  {service.description || "No description provided."}
                </p>

                {service.verificationStatus && (
                  <div className="mt-6 flex items-center gap-2 text-sm font-bold text-emerald-600 bg-emerald-50 w-fit px-4 py-2 rounded-xl">
                    <ShieldCheck size={18} />
                    Vendor Verification: {service.verificationStatus}
                  </div>
                )}
              </motion.div>

              {/* Trust & Safety Features (Wallet Theme Colored Card) */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-indigo-600 p-8 rounded-3xl shadow-lg text-white relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -mr-24 -mt-24" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl -ml-16 -mb-16" />

                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <ShieldCheck size={24} className="text-indigo-200" /> Planit
                  Protection
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10 mb-8">
                  <div className="bg-white/10 rounded-2xl p-5 border border-white/10 hover:bg-white/20 transition-colors">
                    <CalendarCheck size={28} className="text-indigo-200 mb-3" />
                    <h4 className="font-bold text-lg mb-1">
                      Full Cancellation Protection
                    </h4>
                    <p className="text-indigo-100 text-sm">
                      Flexible policies and secure refunds if your plans change.
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-5 border border-white/10 hover:bg-white/20 transition-colors">
                    <Activity size={28} className="text-indigo-200 mb-3" />
                    <h4 className="font-bold text-lg mb-1">Event Insurance</h4>
                    <p className="text-indigo-100 text-sm">
                      If a vendor cancels and it's not possible to proceed, a
                      better vendor will be provided ASAP.
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-5 border border-white/10 hover:bg-white/20 transition-colors">
                    <Scale size={28} className="text-indigo-200 mb-3" />
                    <h4 className="font-bold text-lg mb-1">
                      Dispute Resolution
                    </h4>
                    <p className="text-indigo-100 text-sm">
                      You can get full refunds if you win a dispute against a
                      vendor.
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-5 border border-white/10 hover:bg-white/20 transition-colors">
                    <Sparkles size={28} className="text-indigo-200 mb-3" />
                    <h4 className="font-bold text-lg mb-1">
                      Karma Protections
                    </h4>
                    <p className="text-indigo-100 text-sm">
                      Ensuring fair dealing and a stress-free experience for
                      everyone involved.
                    </p>
                  </div>
                </div>

                {/* Planit Plus Premium Black Box (Now inside Protection Section) */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="bg-[#0a0a0a] text-white p-8 rounded-3xl shadow-[0_20px_40px_rgb(0,0,0,0.2)] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between group z-10"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 translate-x-[-100%] group-hover:translate-x-[100%] ease-in-out" />

                  <div className="relative z-10 md:max-w-md">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-3xl font-black tracking-tighter uppercase">
                        Planit
                      </h3>
                      <span className="bg-white text-black text-xs font-bold px-3 py-1 rounded-full tracking-wider uppercase">
                        Plus
                      </span>
                    </div>

                    <p className="text-[1.1rem] text-slate-300 font-serif leading-snug mb-8 md:mb-0">
                      Designed to effortlessly fit into your everyday event
                      planning flow.
                    </p>
                  </div>

                  <div className="relative z-10 flex flex-col mt-auto md:mt-0 md:items-end">
                    <div className="text-slate-500 line-through text-sm font-bold tracking-tight">
                      ₹599
                    </div>
                    <div className="flex items-baseline gap-1 mb-5">
                      <span className="text-5xl font-extrabold tracking-tighter">
                        ₹299
                      </span>
                      <span className="text-slate-400 font-medium">/event</span>
                    </div>

                    <button
                      onClick={() => navigate("/premium")}
                      className="bg-white text-black font-bold py-3.5 px-8 rounded-full w-full md:w-fit hover:scale-105 transition-transform duration-300 active:scale-95 whitespace-nowrap"
                    >
                      Upgrade to Plus
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Right Column: Pricing & Actions */}
            <div className="space-y-6 sticky top-32 h-fit">
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-2xl -mr-16 -mt-16 -z-10" />

                <div className="text-center border-b border-slate-100 pb-6 mb-6">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Service Price
                  </p>
                  <div className="flex items-center justify-center text-slate-900">
                    <IndianRupee
                      size={32}
                      strokeWidth={3}
                      className="text-slate-400 mr-1"
                    />
                    <span className="text-5xl font-extrabold tracking-tight">
                      {service.price
                        ? service.price.toLocaleString("en-IN")
                        : "0.00"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => toast.success("Booking flow initiated")}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    Book Now
                  </button>

                  <button
                    onClick={() => toast.success("Added to event")}
                    className="w-full py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <CalendarCheck size={20} className="text-indigo-500" />
                    Add to event
                  </button>
                </div>

                <div className="mt-6 text-center text-xs text-slate-400 font-medium">
                  {service.isAvailable === false ? (
                    <span className="text-rose-500">
                      Currently unavailable for new bookings
                    </span>
                  ) : (
                    <span>Instant booking available via Planit Wallet</span>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </PageTransition>
    </CloudsBackground>
  );
}
