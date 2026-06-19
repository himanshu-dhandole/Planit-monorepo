import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  Calendar,
  X,
} from "lucide-react";
import apiClient from "../lib/apiClient";
import CloudsBackground from "./CloudsBackground";
import PageTransition from "./PageTransition";
import { toast } from "sonner";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ServiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { user, customerProfile } = useContext(AuthContext);
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState(null);
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  // Vendor & Testimonials states
  const [vendor, setVendor] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [testimonialText, setTestimonialText] = useState("");
  const [testimonialLoading, setTestimonialLoading] = useState(false);
  const [hasCompletedBooking, setHasCompletedBooking] = useState(false);

  // Event modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [showCreateEventInline, setShowCreateEventInline] = useState(false);
  const [pendingAction, setPendingAction] = useState(""); // 'book' or 'cart'
  const [modalStep, setModalStep] = useState("dates"); // 'dates' or 'event'
  const getTodayDate = (daysOffset = 0, hour = 9) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  const [inlineEventForm, setInlineEventForm] = useState({
    title: "",
    description: "",
    address: "",
    startDate: getTodayDate(1, 9),
    endDate: getTodayDate(1, 18),
  });

  const [startDt, setStartDt] = useState(() => getTodayDate(1, 9));
  const [endDt, setEndDt] = useState(() => getTodayDate(1, 18));

  // Load events
  const fetchEvents = async () => {
    try {
      setEventsLoading(true);
      const res = await apiClient.get(
        `/api/events/customer/${customerProfile.id}?page=0&size=100`,
      );
      const eventsData = res.data?.data?.content || res.data?.content || [];
      setEvents(eventsData);
      if (eventsData.length > 0) {
        setSelectedEventId(eventsData[0].id.toString());
      }
    } catch (err) {
      console.error("Error loading events:", err);
      toast.error("Failed to load events.");
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    if (showEventModal && customerProfile?.id) {
      fetchEvents();
    }
  }, [showEventModal, customerProfile]);

  const handleDatesSubmit = async (e) => {
    e.preventDefault();
    if (!startDt || !endDt) {
      toast.error("Please select both start and end dates.");
      return;
    }
    if (new Date(startDt) >= new Date(endDt)) {
      toast.error("End date must be after start date.");
      return;
    }

    if (pendingAction === "book") {
      // Direct booking: create "Single Booking" event and add to cart
      try {
        setEventsLoading(true);
        const payload = {
          customerId: customerProfile.id,
          title: `Single Booking - ${service.name}`,
          description: "Auto-generated event for single booking.",
          address: service.location || "",
          startDate: startDt.toISOString(),
          endDate: endDt.toISOString(),
        };
        const res = await apiClient.post("/api/events/create", payload);
        const created = res.data?.data || res.data;
        
        addToCart(
          service,
          startDt.toISOString(),
          endDt.toISOString(),
          parseInt(created.id),
          created.title,
        );
        setShowEventModal(false);
        navigate("/cart");
        toast.success("Added to bookings!");
      } catch (err) {
        console.error("Error creating direct booking:", err);
        toast.error("Failed to process booking.");
      } finally {
        setEventsLoading(false);
      }
    } else {
      // Add to event: perform addToCart using the selected event
      try {
        const found = events.find((ev) => ev.id.toString() === selectedEventId);
        if (!found) {
          toast.error("Please select a valid event.");
          return;
        }

        addToCart(
          service,
          startDt.toISOString(),
          endDt.toISOString(),
          parseInt(found.id),
          found.title,
        );
        setShowEventModal(false);
        setModalStep("dates"); // Reset for next time
        toast.success("Added to event successfully!");
      } catch (err) {
        console.error("Error adding to cart:", err);
        toast.error("Failed to associate service with event.");
      }
    }
  };

  const handleEventSelectionSubmit = async (e) => {
    e.preventDefault();

    try {
      if (showCreateEventInline) {
        if (
          !inlineEventForm.title ||
          !inlineEventForm.startDate ||
          !inlineEventForm.endDate
        ) {
          toast.error("Please fill in required fields to create the event.");
          return;
        }
        setEventsLoading(true);
        const payload = {
          customerId: customerProfile.id,
          title: inlineEventForm.title,
          description: inlineEventForm.description,
          address: inlineEventForm.address,
          startDate: inlineEventForm.startDate.toISOString(),
          endDate: inlineEventForm.endDate.toISOString(),
        };
        const res = await apiClient.post("/api/events/create", payload);
        const created = res.data?.data || res.data;
        setEvents((prev) => [...prev, created]);
        setSelectedEventId(created.id.toString());
        setShowCreateEventInline(false);
        setInlineEventForm({
          title: "",
          description: "",
          address: "",
          startDate: getTodayDate(1, 9),
          endDate: getTodayDate(1, 18),
        });
        setEventsLoading(false);
      } else {
        const found = events.find((ev) => ev.id.toString() === selectedEventId);
        if (!found) {
          toast.error("Please select a valid event.");
          return;
        }
      }

      // Move to dates step
      setModalStep("dates");
    } catch (err) {
      console.error("Error creating event:", err);
      toast.error("Failed to create event.");
      setEventsLoading(false);
    }
  };

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

  useEffect(() => {
    if (!service?.vendorId) return;

    const fetchVendorAndTestimonials = async () => {
      try {
        const [vendorRes, testimonialsRes] = await Promise.all([
          apiClient.get(`/api/public/vendor/${service.vendorId}`),
          apiClient.get(`/api/testimonials/vendor/${service.vendorId}/featured`)
        ]);
        setVendor(vendorRes.data?.data || vendorRes.data);
        setTestimonials(testimonialsRes.data?.data || testimonialsRes.data || []);
      } catch (err) {
        console.error("Error loading vendor or testimonials:", err);
      }
    };

    const checkCompletedBooking = async () => {
      if (!customerProfile?.id) return;
      try {
        const res = await apiClient.get(`/api/customer/bookings/${customerProfile.id}?page=0&size=100`);
        const bookingsList = res.data?.data?.content || res.data?.content || [];
        const hasCompleted = bookingsList.some(b => b.services?.vendorId === service.vendorId && b.status === 'COMPLETED');
        setHasCompletedBooking(hasCompleted);
      } catch (err) {
        console.error("Error checking completed bookings:", err);
      }
    };

    fetchVendorAndTestimonials();
    checkCompletedBooking();
  }, [service, customerProfile]);

  const handleSubmitTestimonial = async (e) => {
    e.preventDefault();
    if (!testimonialText.trim()) {
      toast.error("Please write a recommendation comment.");
      return;
    }
    try {
      setTestimonialLoading(true);
      const payload = {
        vendorId: service.vendorId,
        serviceId: service.id,
        testimonialText: testimonialText
      };
      await apiClient.post('/api/testimonials', payload);
      toast.success("Thank you! Your testimonial has been submitted to the vendor.");
      setTestimonialText("");
      setShowTestimonialForm(false);
      
      const res = await apiClient.get(`/api/testimonials/vendor/${service.vendorId}/featured`);
      setTestimonials(res.data?.data || res.data || []);
    } catch (err) {
      console.error("Error submitting testimonial:", err);
      toast.error(err.response?.data?.message || "Failed to submit testimonial.");
    } finally {
      setTestimonialLoading(false);
    }
  };

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
              {vendor && (
                <>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full font-bold text-xs">
                    <Star size={14} fill="currentColor" className="text-indigo-500" />
                    Reputation: {vendor.karma ? vendor.karma.toFixed(2) : "5.00"}
                  </div>
                  {vendor.karma >= 4.5 && (
                    <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      GOLD TRUSTED
                    </span>
                  )}
                  {vendor.karma >= 4.0 && vendor.karma < 4.5 && (
                    <span className="bg-gradient-to-r from-slate-400 to-slate-300 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      SILVER TRUSTED
                    </span>
                  )}
                </>
              )}
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

              {/* Testimonials & Recommendations Card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="text-indigo-500 animate-pulse" size={22} />
                    Customer Recommendations
                  </h3>
                  {hasCompletedBooking && !showTestimonialForm && (
                    <button
                      onClick={() => setShowTestimonialForm(true)}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-xl transition-all border border-indigo-100"
                    >
                      + Recommend Vendor
                    </button>
                  )}
                </div>

                {/* Recommendation input form */}
                {showTestimonialForm && (
                  <form onSubmit={handleSubmitTestimonial} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-6 space-y-4">
                    <h4 className="text-sm font-bold text-slate-800">Write a Recommendation</h4>
                    <p className="text-xs text-slate-500">
                      Share your experience working with this vendor. Testimonials are featured on their public profile.
                    </p>
                    <textarea
                      value={testimonialText}
                      onChange={(e) => setTestimonialText(e.target.value)}
                      required
                      maxLength={1000}
                      rows={4}
                      placeholder="Would you recommend this vendor's services to other customers? Why?"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium resize-none shadow-sm"
                    />
                    <div className="flex justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setShowTestimonialForm(false);
                          setTestimonialText("");
                        }}
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={testimonialLoading}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all disabled:opacity-75 flex items-center gap-1.5"
                      >
                        {testimonialLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                        Submit Recommendation
                      </button>
                    </div>
                  </form>
                )}

                {/* Testimonial slider/carousel */}
                {testimonials.length === 0 ? (
                  <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-sm text-slate-500">No recommendations left for this vendor yet.</p>
                    {hasCompletedBooking ? (
                      <p className="text-xs text-indigo-600 mt-2 font-semibold">
                        You have completed bookings with this vendor! Be the first to recommend them.
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-2">
                        Only verified customers with completed bookings can leave recommendations.
                      </p>
                    )}
                  </div>
                ) : (
                  <Carousel
                    className="w-full"
                    opts={{
                      loop: true,
                    }}
                    plugins={[
                      Autoplay({
                        delay: 5000,
                      }),
                    ]}
                  >
                    <CarouselContent>
                      {testimonials.map((t) => (
                        <CarouselItem key={t.id}>
                          <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-100 rounded-2xl p-6 shadow-sm transition-all relative overflow-hidden group min-h-[140px] flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/40 rounded-full blur-2xl pointer-events-none" />
                            <p className="text-slate-600 text-sm font-serif italic leading-relaxed relative z-10 mb-4">
                              "{t.testimonialText}"
                            </p>
                            <div className="flex justify-between items-end relative z-10">
                              <div>
                                <span className="font-extrabold text-slate-800 text-sm block">{t.customerName}</span>
                                <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                                  Verified Customer • {new Date(t.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                <ShieldCheck size={10} /> Recommended
                              </span>
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    {testimonials.length > 1 && (
                      <div className="flex justify-end gap-2 mt-4">
                        <CarouselPrevious className="static translate-y-0" />
                        <CarouselNext className="static translate-y-0" />
                      </div>
                    )}
                  </Carousel>
                )}
              </motion.div>

              {/* Customer Reviews Card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Star className="text-amber-500 fill-amber-500" size={22} />
                    Customer Reviews
                  </h3>
                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {service.reviews ? service.reviews.length : 0}
                  </span>
                </div>

                {!service.reviews || service.reviews.length === 0 ? (
                  <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-sm text-slate-500">No reviews left for this service yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {service.reviews.map((r) => (
                      <div key={r.id} className="bg-slate-50/70 hover:bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-sm transition-all relative overflow-hidden group">
                        <div className="flex justify-between items-start gap-4 mb-3">
                          <div>
                            <span className="font-bold text-slate-800 text-sm">Verified Customer</span>
                            <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">
                              {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          
                          {/* Render Stars */}
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={12}
                                fill={star <= r.rating ? "#f59e0b" : "transparent"}
                                className={star <= r.rating ? "text-amber-500" : "text-slate-200"}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-600 text-xs font-medium leading-relaxed italic">
                          "{r.reviewText}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
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
                    onClick={() => {
                      if (!user) {
                        navigate("/signin");
                        return;
                      }
                      if (!customerProfile) {
                        toast.error(
                          "Please set up your customer profile first.",
                        );
                        return;
                      }
                      setPendingAction("book");
                      setModalStep("dates");
                      setShowEventModal(true);
                    }}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <CalendarCheck size={20} className="text-white" />
                    Book Separately
                  </button>

                  <button
                    onClick={() => {
                      if (!user) {
                        navigate("/signin");
                        return;
                      }
                      if (!customerProfile) {
                        toast.error(
                          "Please set up your customer profile first.",
                        );
                        return;
                      }
                      setPendingAction("cart");
                      setModalStep("event");
                      setShowEventModal(true);
                    }}
                    className="w-full py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 flex items-center justify-center gap-2 group"
                  >
                    <Sparkles size={20} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                    Add to Event
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

        {/* Event / Dates Selection Modal - Light Wallet Theme Styled */}
        <AnimatePresence>
          {showEventModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={() => {
                  setShowEventModal(false);
                  setShowCreateEventInline(false);
                  setModalStep("dates");
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-md bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-8 md:p-10 overflow-visible"
              >
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-indigo-100/50 to-purple-100/50 rounded-full blur-2xl -mr-24 -mt-24 pointer-events-none" />

                <div className="relative z-10 flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                    {modalStep === "dates" ? (
                      <>
                        <CalendarCheck size={24} className="text-indigo-500" /> 
                        Select Dates
                      </>
                    ) : (
                      <>
                        <Sparkles size={24} className="text-indigo-500" />
                        Choose Event
                      </>
                    )}
                  </h3>
                  <button
                    onClick={() => {
                      setShowEventModal(false);
                      setShowCreateEventInline(false);
                      setModalStep("dates");
                    }}
                    className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="relative z-10">
                  {modalStep === "dates" ? (
                    <form onSubmit={handleDatesSubmit} className="space-y-6">
                      <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                            <Calendar size={14} className="text-indigo-500" /> 
                            Start Date & Time
                          </label>
                          <DatePicker
                            selected={startDt}
                            onChange={(date) => setStartDt(date)}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={30}
                            timeCaption="Time"
                            dateFormat="MMMM d, yyyy h:mm aa"
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                            wrapperClassName="w-full"
                          />
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                            <Calendar size={14} className="text-indigo-500" /> 
                            End Date & Time
                          </label>
                          <DatePicker
                            selected={endDt}
                            onChange={(date) => setEndDt(date)}
                            showTimeSelect
                            timeFormat="HH:mm"
                            timeIntervals={30}
                            timeCaption="Time"
                            dateFormat="MMMM d, yyyy h:mm aa"
                            minDate={startDt}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                            wrapperClassName="w-full"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={eventsLoading}
                        className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 text-lg"
                      >
                        {eventsLoading ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : pendingAction === "book" ? (
                          "Confirm Booking"
                        ) : (
                          "Confirm Add to Event"
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleEventSelectionSubmit} className="space-y-5">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          {showCreateEventInline ? "New Event Details" : "Your Events"}
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowCreateEventInline(!showCreateEventInline)}
                          className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors"
                        >
                          {showCreateEventInline ? "Select Existing" : "+ Create New"}
                        </button>
                      </div>

                      {!showCreateEventInline ? (
                        eventsLoading ? (
                          <div className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center text-sm font-medium text-slate-500">
                            <Loader2 className="animate-spin text-indigo-500 mr-2" size={18} /> 
                            Loading events...
                          </div>
                        ) : events.length === 0 ? (
                          <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                            <p className="text-sm font-medium text-slate-600 mb-4">
                              You haven't created any events yet.
                            </p>
                            <button
                              type="button"
                              onClick={() => setShowCreateEventInline(true)}
                              className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-md hover:scale-105 transition-transform"
                            >
                              Create Your First Event
                            </button>
                          </div>
                        ) : (
                          <div className="bg-slate-50 p-2 rounded-2xl border border-slate-200">
                            <select
                              value={selectedEventId}
                              onChange={(e) => setSelectedEventId(e.target.value)}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-base font-semibold text-slate-800 appearance-none cursor-pointer shadow-sm"
                            >
                              {events.map((ev) => (
                                <option key={ev.id} value={ev.id}>
                                  {ev.title}
                                </option>
                              ))}
                            </select>
                          </div>
                        )
                      ) : (
                        <div className="space-y-3 p-5 bg-slate-50 rounded-2xl border border-slate-200">
                          <div>
                            <input
                              type="text"
                              placeholder="Event Title *"
                              value={inlineEventForm.title}
                              onChange={(e) =>
                                setInlineEventForm((prev) => ({
                                  ...prev,
                                  title: e.target.value,
                                }))
                              }
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 font-medium shadow-sm"
                              required
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Short Description"
                              value={inlineEventForm.description}
                              onChange={(e) =>
                                setInlineEventForm((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 font-medium shadow-sm"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Address / Venue"
                              value={inlineEventForm.address}
                              onChange={(e) =>
                                setInlineEventForm((prev) => ({
                                  ...prev,
                                  address: e.target.value,
                                }))
                              }
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 font-medium shadow-sm"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1 mb-1 block">Start Date</label>
                              <DatePicker
                                selected={inlineEventForm.startDate}
                                onChange={(date) =>
                                  setInlineEventForm((prev) => ({
                                    ...prev,
                                    startDate: date,
                                  }))
                                }
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={30}
                                dateFormat="MMM d, yyyy h:mm aa"
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                wrapperClassName="w-full"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1 mb-1 block">End Date</label>
                              <DatePicker
                                selected={inlineEventForm.endDate}
                                onChange={(date) =>
                                  setInlineEventForm((prev) => ({
                                    ...prev,
                                    endDate: date,
                                  }))
                                }
                                showTimeSelect
                                timeFormat="HH:mm"
                                timeIntervals={30}
                                minDate={inlineEventForm.startDate}
                                dateFormat="MMM d, yyyy h:mm aa"
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                wrapperClassName="w-full"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowEventModal(false)}
                          className="px-4 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={(!showCreateEventInline && events.length === 0) || eventsLoading}
                          className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50 text-lg flex items-center justify-center"
                        >
                          {eventsLoading ? (
                            <Loader2 className="animate-spin" size={20} />
                          ) : (
                            "Continue to Dates"
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </PageTransition>
    </CloudsBackground>
  );
}
