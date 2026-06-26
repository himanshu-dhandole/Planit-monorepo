import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../lib/apiClient';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';
import { FileUploaderRegular } from '@uploadcare/react-uploader';
import '@uploadcare/react-uploader/core.css';
import { 
  Plus, Edit, Trash2, MapPin, CheckCircle, XCircle, Clock, Loader2, 
  IndianRupee, Phone, Mail, FileText, Briefcase, User, Map, CreditCard, 
  Activity, Star, ShieldAlert, Navigation, Calendar, CalendarDays, 
  MessageSquare, ChevronDown, ChevronUp, Crown, ArrowRight, Scale, 
  Users, Server, Ban, Check, LayoutGrid, Menu, Wallet as WalletIcon, Settings, X,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import CloudsBackground from './CloudsBackground';
import PageTransition from './PageTransition';
import { motion, AnimatePresence } from 'framer-motion';
import { WalletDeposit, WalletWithdraw } from "./payment";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

export default function UnifiedDashboard({ isDemoMode = false, demoRole = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, customerProfile, logout, refreshUser } = useContext(AuthContext);

  const demoUser = useMemo(() => {
    if (!isDemoMode) return user;
    return {
      id: 1,
      email: "demo@planit.com",
      name: demoRole === 'admin' ? "Admin Console Demo" : demoRole === 'vendor' ? "Vendor Business Demo" : "Client Workspace Demo",
      roles: demoRole === 'admin' ? ['ADMIN'] : demoRole === 'vendor' ? ['VENDOR'] : ['CLIENT']
    };
  }, [user, isDemoMode, demoRole]);

  const demoCustomerProfile = useMemo(() => {
    if (!isDemoMode) return customerProfile;
    return {
      id: 1,
      firstName: demoRole === 'admin' ? "Admin" : demoRole === 'vendor' ? "Vendor" : "Client",
      lastName: "Demo",
      profilePictureUrl: ""
    };
  }, [customerProfile, isDemoMode, demoRole]);

  const displayUser = isDemoMode ? demoUser : user;
  const displayProfile = isDemoMode ? demoCustomerProfile : customerProfile;

  // Detect roles
  const roles = useMemo(() => {
    return displayUser?.roles
      ? Array.isArray(displayUser.roles)
        ? displayUser.roles
        : [displayUser.roles]
      : [];
  }, [displayUser]);

  const isVendor = useMemo(() => roles.some(r => r === 'VENDOR' || r === 'ROLE_VENDOR'), [roles]);
  const isAdmin = useMemo(() => roles.some(r => r === 'ADMIN' || r === 'ROLE_ADMIN'), [roles]);

  // Map pathnames to workspaceMode and tab
  const pathMapping = useMemo(() => ({
    '/my-events': { mode: 'client', tab: 'events' },
    '/my-bookings': { mode: 'client', tab: 'bookings' },
    '/disputes': { mode: 'client', tab: 'disputes' },
    '/wallet': { mode: 'client', tab: 'wallet' },
    '/vendor-dashboard': { mode: 'vendor', tab: 'services' },
    '/vendor-bookings': { mode: 'vendor', tab: 'vendor-bookings' },
    '/admin': { mode: 'admin', tab: 'overview' },
  }), []);

  // Determine initial workspace mode
  const [workspaceMode, setWorkspaceMode] = useState(() => {
    if (isDemoMode && demoRole) return demoRole;
    const matched = pathMapping[location.pathname];
    if (matched) {
      if (matched.mode === 'vendor' && isVendor) return 'vendor';
      if (matched.mode === 'admin' && isAdmin) return 'admin';
      if (matched.mode === 'client') return 'client';
    }
    const urlMode = searchParams.get('mode');
    if (urlMode && ['client', 'vendor', 'admin'].includes(urlMode)) {
      if (urlMode === 'vendor' && isVendor) return 'vendor';
      if (urlMode === 'admin' && isAdmin) return 'admin';
    }
    if (isAdmin) return 'admin';
    if (isVendor) return 'vendor';
    return 'client';
  });

  const [localTab, setLocalTab] = useState('overview');

  // Track the active tab via URL pathname or search params, or local state in demo mode
  const activeTab = useMemo(() => {
    if (isDemoMode) return localTab;
    const matched = pathMapping[location.pathname];
    if (matched) return matched.tab;
    return searchParams.get('tab') || 'overview';
  }, [isDemoMode, localTab, location.pathname, searchParams, pathMapping]);

  const handleSetTab = (tab) => {
    if (isDemoMode) {
      setLocalTab(tab);
      return;
    }
    const reverseMapping = {
      'events': '/my-events',
      'bookings': '/my-bookings',
      'disputes': '/disputes',
      'wallet': '/wallet',
      'vendor-bookings': '/vendor-bookings',
      'services': '/vendor-dashboard'
    };
    const path = reverseMapping[tab];
    if (path) {
      navigate(path);
    } else {
      navigate(`/dashboard?mode=${workspaceMode}&tab=${tab}`);
    }
  };

  const handleSwitchWorkspace = (mode) => {
    if (isDemoMode) {
      setWorkspaceMode(mode);
      setLocalTab('overview');
      return;
    }
    setWorkspaceMode(mode);
    if (mode === 'admin') {
      navigate('/admin');
    } else if (mode === 'vendor') {
      navigate('/vendor-dashboard');
    } else {
      navigate('/dashboard?mode=client&tab=overview');
    }
  };

  // Sync workspace switch with URL search params or paths
  useEffect(() => {
    if (isDemoMode) return;
    const matched = pathMapping[location.pathname];
    if (matched) {
      if (matched.mode !== workspaceMode) {
        setWorkspaceMode(matched.mode);
      }
      return;
    }
    const urlMode = searchParams.get('mode');
    if (urlMode && ['client', 'vendor', 'admin'].includes(urlMode)) {
      if (urlMode === 'vendor' && isVendor && workspaceMode !== 'vendor') setWorkspaceMode('vendor');
      if (urlMode === 'admin' && isAdmin && workspaceMode !== 'admin') setWorkspaceMode('admin');
      if (urlMode === 'client' && workspaceMode !== 'client') setWorkspaceMode('client');
    }
  }, [isDemoMode, location.pathname, searchParams, isVendor, isAdmin, workspaceMode, pathMapping]);

  // Collapsible sidebar groups
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);

  const dashboardContent = (
    <div className="w-full flex-1 flex transition-all overflow-hidden">
      
      {/* Notion Sidebar */}
      <motion.div 
        animate={{ width: sidebarExpanded ? 256 : 76 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white/20 backdrop-blur-xl border-r border-white/30 flex flex-col p-4 shrink-0 shadow-[4px_0_30px_rgba(0,0,0,0.02)] h-full z-20 relative overflow-hidden"
      >
        
        {/* Sidebar Toggle & Header */}
        <div className="flex items-center justify-between mb-8 px-1.5 h-8">
          <AnimatePresence initial={false}>
            {sidebarExpanded && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2.5"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-base font-black shadow-md shadow-blue-500/20">
                  P
                </div>
                <span className="font-serif text-base font-black tracking-tight text-gray-900">PLANIT Space</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setSidebarExpanded(!sidebarExpanded)} 
            className="p-1.5 hover:bg-white/40 hover:text-gray-900 rounded-xl text-gray-400 transition-colors ml-auto shadow-sm border border-transparent hover:border-white/40"
            title={sidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <LayoutGrid size={16} />
          </button>
        </div>

        {/* Workspace Selector Dropdown */}
        {sidebarExpanded && (isVendor || isAdmin || isDemoMode) && (
          <div className="mb-6 px-1.5 relative">
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-2 ml-1">Workspace Mode</label>
            <button 
              onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-white/40 border border-white/50 hover:bg-white/60 text-slate-800 backdrop-blur-md rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] hover:border-blue-300"
            >
              <span className="flex items-center gap-2">
                {workspaceMode === 'client' && <span>🔑 Client Space</span>}
                {workspaceMode === 'vendor' && <span>💼 Vendor Space</span>}
                {workspaceMode === 'admin' && <span>🛡️ Admin Space</span>}
              </span>
              <ChevronDown size={12} className={`text-slate-400 transition-transform duration-250 ${workspaceDropdownOpen ? 'rotate-180 text-blue-650' : ''}`} />
            </button>
            <AnimatePresence>
              {workspaceDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute left-1.5 right-1.5 mt-2 bg-white/80 backdrop-blur-xl border border-white/40 rounded-xl shadow-lg z-50 py-1 text-xs font-semibold overflow-hidden"
                >
                  <button 
                    onClick={() => { handleSwitchWorkspace('client'); setWorkspaceDropdownOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3.5 py-2.5 text-left hover:bg-white/50 transition-colors ${workspaceMode === 'client' ? 'text-blue-700 bg-white/60 border-y border-white/10' : 'text-slate-700'}`}
                  >
                    🔑 Client Space
                  </button>
                  {(isVendor || isDemoMode) && (
                    <button 
                      onClick={() => { handleSwitchWorkspace('vendor'); setWorkspaceDropdownOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3.5 py-2.5 text-left hover:bg-white/50 transition-colors ${workspaceMode === 'vendor' ? 'text-blue-700 bg-white/60 border-y border-white/10' : 'text-slate-700'}`}
                    >
                      💼 Vendor Space
                    </button>
                  )}
                  {(isAdmin || isDemoMode) && (
                    <button 
                      onClick={() => { handleSwitchWorkspace('admin'); setWorkspaceDropdownOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3.5 py-2.5 text-left hover:bg-white/50 transition-colors ${workspaceMode === 'admin' ? 'text-blue-700 bg-white/60 border-y border-white/10' : 'text-slate-700'}`}
                    >
                      🛡️ Admin Space
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Sidebar Navigation Items */}
        <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
          
          {/* Client Workspace Sidebar */}
          {workspaceMode === 'client' && (
            <>
              {sidebarExpanded && <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">Tasks</span>}
              <SidebarNavItem active={activeTab === 'overview'} expanded={sidebarExpanded} icon={<Activity size={18} />} label="Overview" onClick={() => handleSetTab('overview')} />
              <SidebarNavItem active={activeTab === 'events'} expanded={sidebarExpanded} icon={<CalendarDays size={18} />} label="My Events" onClick={() => handleSetTab('events')} />
              <SidebarNavItem active={activeTab === 'bookings'} expanded={sidebarExpanded} icon={<FileText size={18} />} label="My Bookings" onClick={() => handleSetTab('bookings')} />
              <SidebarNavItem active={activeTab === 'disputes'} expanded={sidebarExpanded} icon={<Scale size={18} />} label="Disputes Center" onClick={() => handleSetTab('disputes')} />
              <SidebarNavItem active={activeTab === 'wallet'} expanded={sidebarExpanded} icon={<WalletIcon size={18} />} label="Wallet" onClick={() => handleSetTab('wallet')} />
            </>
          )}

          {/* Vendor Workspace Sidebar */}
          {workspaceMode === 'vendor' && (
            <>
              {sidebarExpanded && <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">Manage Business</span>}
              <SidebarNavItem active={activeTab === 'overview'} expanded={sidebarExpanded} icon={<Activity size={18} />} label="Overview" onClick={() => handleSetTab('overview')} />
              <SidebarNavItem active={activeTab === 'services'} expanded={sidebarExpanded} icon={<Server size={18} />} label="My Services" onClick={() => handleSetTab('services')} />
              <SidebarNavItem active={activeTab === 'vendor-bookings'} expanded={sidebarExpanded} icon={<CreditCard size={18} />} label="Client Bookings" onClick={() => handleSetTab('vendor-bookings')} />
              <SidebarNavItem active={activeTab === 'testimonials'} expanded={sidebarExpanded} icon={<Star size={18} />} label="Testimonials" onClick={() => handleSetTab('testimonials')} />
              <SidebarNavItem active={activeTab === 'business-profile'} expanded={sidebarExpanded} icon={<Briefcase size={18} />} label="Business Details" onClick={() => handleSetTab('business-profile')} />
            </>
          )}

          {/* Admin Workspace Sidebar */}
          {workspaceMode === 'admin' && (
            <>
              {sidebarExpanded && <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">System Admin</span>}
              <SidebarNavItem active={activeTab === 'overview'} expanded={sidebarExpanded} icon={<Activity size={18} />} label="Overview" onClick={() => handleSetTab('overview')} />
              <SidebarNavItem active={activeTab === 'admin-customers'} expanded={sidebarExpanded} icon={<User size={18} />} label="Verify Customers" onClick={() => handleSetTab('admin-customers')} />
              <SidebarNavItem active={activeTab === 'admin-vendors'} expanded={sidebarExpanded} icon={<Briefcase size={18} />} label="Verify Vendors" onClick={() => handleSetTab('admin-vendors')} />
              <SidebarNavItem active={activeTab === 'admin-services'} expanded={sidebarExpanded} icon={<Server size={18} />} label="Verify Services" onClick={() => handleSetTab('admin-services')} />
              <SidebarNavItem active={activeTab === 'admin-disputes'} expanded={sidebarExpanded} icon={<Scale size={18} />} label="Disputes Panel" onClick={() => handleSetTab('admin-disputes')} />
              <SidebarNavItem active={activeTab === 'admin-complaints'} expanded={sidebarExpanded} icon={<ShieldAlert size={18} />} label="Complaints Panel" onClick={() => handleSetTab('admin-complaints')} />
              <SidebarNavItem active={activeTab === 'admin-aura-logs'} expanded={sidebarExpanded} icon={<FileText size={18} />} label="Aura Logs" onClick={() => handleSetTab('admin-aura-logs')} />
            </>
          )}

        </div>

        {/* Quick Profile Section at Bottom commented out as redundant */}
        {/*
        <div className="pt-4 border-t border-gray-200/60 mt-auto px-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
              {displayProfile?.profilePictureUrl ? (
                <img src={displayProfile.profilePictureUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={14} />
              )}
            </div>
            {sidebarExpanded && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate">
                  {displayUser?.name || displayProfile?.firstName || 'User'}
                </p>
                <p className="text-[10px] text-gray-500 truncate font-semibold">
                  {workspaceMode === 'admin' ? 'System Administrator' : workspaceMode === 'vendor' ? 'Service Provider' : 'Curator/Client'}
                </p>
              </div>
            )}
          </div>
        </div>
        */}

      </motion.div>

      {/* Canvas Area (Right Content) */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
          
          <div className="max-w-6xl mx-auto w-full">
            {/* Dynamic View Injection */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${workspaceMode}-${activeTab}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {workspaceMode === 'client' && (
                  <>
                    {activeTab === 'overview' && <ClientOverviewTab customerProfile={displayProfile} setTab={handleSetTab} isDemoMode={isDemoMode} />}
                    {activeTab === 'events' && <EventsTab customerProfile={displayProfile} isDemoMode={isDemoMode} />}
                    {activeTab === 'bookings' && <BookingsTab customerProfile={displayProfile} user={displayUser} isDemoMode={isDemoMode} />}
                    {activeTab === 'disputes' && <DisputesTab user={displayUser} isDemoMode={isDemoMode} />}
                    {activeTab === 'wallet' && <WalletTab user={displayUser} isDemoMode={isDemoMode} />}
                  </>
                )}

                {workspaceMode === 'vendor' && (
                  <>
                    {activeTab === 'overview' && <VendorOverviewTab customerProfile={displayProfile} setTab={handleSetTab} isDemoMode={isDemoMode} />}
                    {activeTab === 'services' && <ServicesTab customerProfile={displayProfile} isDemoMode={isDemoMode} />}
                    {activeTab === 'vendor-bookings' && <VendorBookingsTab customerProfile={displayProfile} isDemoMode={isDemoMode} />}
                    {activeTab === 'testimonials' && <TestimonialsTab customerProfile={displayProfile} isDemoMode={isDemoMode} />}
                    {activeTab === 'business-profile' && <BusinessProfileTab customerProfile={displayProfile} refreshUser={refreshUser} isDemoMode={isDemoMode} />}
                  </>
                )}

                {workspaceMode === 'admin' && (
                  <>
                    {activeTab === 'overview' && <AdminOverviewTab setTab={handleSetTab} />}
                    {activeTab === 'admin-customers' && <AdminApprovalsTab type="customer" activeTab={activeTab} isDemoMode={isDemoMode} />}
                    {activeTab === 'admin-vendors' && <AdminApprovalsTab type="vendor" activeTab={activeTab} isDemoMode={isDemoMode} />}
                    {activeTab === 'admin-services' && <AdminApprovalsTab type="service" activeTab={activeTab} isDemoMode={isDemoMode} />}
                    {activeTab === 'admin-disputes' && <AdminDisputesTab isDemoMode={isDemoMode} />}
                    {activeTab === 'admin-complaints' && <AdminComplaintsTab isDemoMode={isDemoMode} />}
                    {activeTab === 'admin-aura-logs' && <AdminAuraLogsTab isDemoMode={isDemoMode} />}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>

    </div>
  );

  if (isDemoMode) {
    return (
      <div className="w-full font-sans relative flex h-screen overflow-hidden">
        {dashboardContent}
      </div>
    );
  }

  return (
    <CloudsBackground>
      <PageTransition className="flex-1 pt-24 h-screen relative font-sans w-full z-10 flex overflow-hidden">
        {dashboardContent}
      </PageTransition>
    </CloudsBackground>
  );
}

/* Sidebar Navigation Item */
function SidebarNavItem({ active, expanded, icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 relative hover:scale-[1.01] active:scale-[0.99] ${
        active 
          ? 'text-blue-750 font-bold' 
          : 'text-slate-650 hover:bg-white/25 hover:text-slate-900'
      }`}
    >
      {active && (
        <motion.div 
          layoutId="activeSidebarTab"
          className="absolute inset-0 bg-white/60 backdrop-blur-md border border-white/80 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.02)]"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <span className={`relative z-10 transition-colors ${active ? 'text-blue-600' : 'text-slate-400'}`}>{icon}</span>
      {expanded && <span className="relative z-10 truncate">{label}</span>}
      {active && expanded && (
        <motion.div 
          layoutId="activeDot"
          className="absolute right-3.5 w-1.5 h-1.5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.6)]"
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        />
      )}
    </button>
  );
}
/* ============================================================================
   CLIENT WORKSPACE TABS
   ============================================================================ */

/* 1. Client Overview Tab */
function ClientOverviewTab({ customerProfile, setTab, isDemoMode }) {
  const [stats, setStats] = useState({ events: 0, bookings: 0, disputes: 0, wallet: 0 });
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventTasks, setEventTasks] = useState({});
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [hoveredDay, setHoveredDay] = useState(null);

  // Management Workspace states
  const [activeEventId, setActiveEventId] = useState(null);
  const [eventBudgets, setEventBudgets] = useState({});
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [newBudgetLimit, setNewBudgetLimit] = useState("");

  // Clamp selectedDay if it exceeds the number of days in the new month
  useEffect(() => {
    const daysInNewMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    if (selectedDay > daysInNewMonth) {
      setSelectedDay(daysInNewMonth);
    }
  }, [currentMonth, currentYear, selectedDay]);

  useEffect(() => {
    if (isDemoMode) {
      setStats({
        events: 3,
        bookings: 3,
        disputes: 1,
        wallet: 15450
      });
      setEvents([
        { id: 101, title: "Anjali's Sangeet Ceremony", startDate: "2026-11-12T18:00:00", status: "CONFIRMED", budget: 300000 },
        { id: 102, title: "Corporate Product Launch 2026", startDate: "2026-08-20T09:00:00", status: "PENDING_BOOKING", budget: 500000 },
        { id: 103, title: "Outdoor Birthday Bash", startDate: "2026-07-05T16:00:00", status: "DRAFT", budget: 100000 }
      ]);
      setBookings([
        { id: 501, eventId: 101, services: { name: "Shine & Sound DJs", category: "MUSIC" }, bookingAmount: 25000, status: "CONFIRMED", bookedAt: "2026-06-05T12:00:00" },
        { id: 502, eventId: 101, services: { name: "Gourmet Catering Services", category: "CATERING" }, bookingAmount: 95000, status: "PENDING", bookedAt: "2026-06-15T10:30:00" },
        { id: 503, eventId: 102, services: { name: "Luxury Wedding Florals", category: "DECORATION" }, bookingAmount: 60000, status: "CONFIRMED", bookedAt: "2026-06-20T11:00:00" }
      ]);
      setLoading(false);
      return;
    }

    if (!customerProfile?.id) return;
    const fetchOverviewData = async () => {
      try {
        setLoading(true);
        const [eventsRes, bookingsRes, disputesRes, walletRes] = await Promise.all([
          apiClient.get(`/api/events/customer/${customerProfile.id}?page=0&size=100`),
          apiClient.get(`/api/customer/bookings/${customerProfile.id}?page=0&size=100`),
          apiClient.get('/api/disputes/my'),
          apiClient.get('/api/wallet').catch(() => ({ data: { balance: 0 } }))
        ]);

        const evs = eventsRes.data?.data?.content || eventsRes.data?.content || [];
        const bks = bookingsRes.data?.data?.content || bookingsRes.data?.content || [];
        const disputesCount = disputesRes.data?.data?.length || disputesRes.data?.length || 0;
        const walletBal = walletRes.data?.data?.balance || walletRes.data?.balance || 0;

        setStats({
          events: evs.length,
          bookings: bks.length,
          disputes: disputesCount,
          wallet: walletBal
        });
        setEvents(evs);
        setBookings(bks);
      } catch (err) {
        console.error("Error loading client overview stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverviewData();
  }, [customerProfile, isDemoMode]);

  // Load and sync tasks from local storage across all events
  useEffect(() => {
    if (events.length === 0) {
      setEventTasks({});
      return;
    }
    const newEventTasks = {};
    events.forEach(event => {
      const stored = localStorage.getItem(`planit_tasks_${event.id}`);
      let tasks = [];
      if (stored) {
        try {
          tasks = JSON.parse(stored).filter(t => t.id !== 't1' && t.id !== 't2' && t.id !== 't3');
        } catch (e) {
          console.error("Error parsing stored tasks:", e);
        }
      } else {
        tasks = [];
        localStorage.setItem(`planit_tasks_${event.id}`, JSON.stringify(tasks));
      }
      newEventTasks[event.id] = tasks;
    });
    setEventTasks(newEventTasks);
  }, [events]);

  // Load event budgets from localStorage
  useEffect(() => {
    const budgets = {};
    events.forEach(e => {
      const stored = localStorage.getItem(`planit_budget_${e.id}`);
      budgets[e.id] = stored ? parseFloat(stored) : (e.budget || 200000);
    });
    setEventBudgets(budgets);
  }, [events]);

  // Sync activeEventId with events
  useEffect(() => {
    if (events.length > 0 && !activeEventId) {
      setActiveEventId(events[0].id);
    }
  }, [events, activeEventId]);

  const activeEvent = useMemo(() => {
    return events.find(e => e.id === activeEventId) || events[0] || null;
  }, [events, activeEventId]);

  const activeBudgetLimit = useMemo(() => {
    if (!activeEvent) return 200000;
    return eventBudgets[activeEvent.id] || 200000;
  }, [activeEvent, eventBudgets]);

  const activeBookings = useMemo(() => {
    if (!activeEventId) return bookings;
    return bookings.filter(b => b.eventId === activeEventId || (isDemoMode && activeEventId === 101 && (b.id === 501 || b.id === 502)) || (isDemoMode && activeEventId === 102 && b.id === 503));
  }, [bookings, activeEventId, isDemoMode]);

  const totalSpend = useMemo(() => {
    return activeBookings.reduce((sum, b) => sum + (b.bookingAmount || 0), 0);
  }, [activeBookings]);

  const totalBudget = activeBudgetLimit;

  const handleUpdateBudget = (limitValue) => {
    if (!activeEvent) return;
    const parsed = parseFloat(limitValue);
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Please enter a valid budget limit");
      return;
    }
    localStorage.setItem(`planit_budget_${activeEvent.id}`, parsed);
    setEventBudgets(prev => ({ ...prev, [activeEvent.id]: parsed }));
    setShowBudgetModal(false);
    toast.success("Project budget updated!");
  };

  const handleToggleOverviewTask = (eventId, taskId) => {
    const list = eventTasks[eventId] || [];
    const updated = list.map(t => t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t);
    setEventTasks(prev => ({ ...prev, [eventId]: updated }));
    localStorage.setItem(`planit_tasks_${eventId}`, JSON.stringify(updated));
    toast.success("Task updated!");
  };

  const handleQuickAddTask = (e) => {
    e.preventDefault();
    if (!activeEvent) return;
    const taskName = e.target.taskName.value.trim();
    const priority = e.target.priority.value;
    if (!taskName) return;

    const newTask = {
      id: `custom_${Date.now()}`,
      taskName,
      taskDescription: "Quick task",
      dueDate: activeEvent.startDate.substring(0, 10),
      priority,
      isCompleted: false,
      isCustom: true
    };

    const currentTasks = eventTasks[activeEvent.id] || [];
    const updated = [newTask, ...currentTasks];

    setEventTasks(prev => ({ ...prev, [activeEvent.id]: updated }));
    localStorage.setItem(`planit_tasks_${activeEvent.id}`, JSON.stringify(updated));
    e.target.reset();
    toast.success("Task added to project!");
  };

  const getEventProgress = (eventId) => {
    const tasks = eventTasks[eventId] || [];
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.isCompleted).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const activeTasks = useMemo(() => {
    if (!activeEvent) return [];
    return eventTasks[activeEvent.id] || [];
  }, [eventTasks, activeEvent]);

  const activePendingTasks = useMemo(() => {
    return activeTasks.filter(t => !t.isCompleted).sort((a, b) => {
      const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      const diff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (diff !== 0) return diff;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  }, [activeTasks]);

  // Spend Line-chart SVG coordinate rendering
  const chartWidth = 520;
  const chartHeight = 160;
  const chartPadding = 35;

  const chartData = useMemo(() => {
    if (activeBookings.length === 0) {
      return [];
    }
    const sorted = [...activeBookings]
      .filter(b => b.bookedAt)
      .sort((a, b) => new Date(a.bookedAt) - new Date(b.bookedAt));
    
    if (sorted.length === 0) {
      return [
        { label: "Week 1", budget: totalBudget * 0.25, val: totalSpend * 0.2 },
        { label: "Week 2", budget: totalBudget * 0.5, val: totalSpend * 0.55 },
        { label: "Week 3", budget: totalBudget * 0.75, val: totalSpend * 0.8 },
        { label: "Week 4", budget: totalBudget, val: totalSpend }
      ];
    }

    let runningSum = 0;
    return sorted.map((b, index) => {
      runningSum += b.bookingAmount;
      const label = new Date(b.bookedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return {
        label,
        budget: Math.round(((index + 1) / sorted.length) * totalBudget),
        val: runningSum
      };
    });
  }, [activeBookings, totalSpend, totalBudget]);

  const maxVal = Math.max(...chartData.map(d => Math.max(d.budget, d.val)), totalBudget, 100000);

  const pointsSpend = chartData.map((d, i) => {
    const x = chartPadding + (i * (chartWidth - 2 * chartPadding)) / (chartData.length - 1 || 1);
    const y = chartHeight - chartPadding - (d.val / maxVal) * (chartHeight - 2 * chartPadding);
    return { x, y, label: d.label, val: d.val };
  });

  const pointsBudget = chartData.map((d, i) => {
    const x = chartPadding + (i * (chartWidth - 2 * chartPadding)) / (chartData.length - 1 || 1);
    const y = chartHeight - chartPadding - (d.budget / maxVal) * (chartHeight - 2 * chartPadding);
    return { x, y, label: d.label, val: d.budget };
  });

  const getCurvePath = (points) => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`;
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const pathSpend = getCurvePath(pointsSpend);
  const pathBudget = getCurvePath(pointsBudget);
  
  const areaSpend = pointsSpend.length > 0 
    ? `${pathSpend} L ${pointsSpend[pointsSpend.length - 1].x} ${chartHeight - chartPadding} L ${pointsSpend[0].x} ${chartHeight - chartPadding} Z`
    : "";

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 0) {
        setCurrentYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 11) {
        setCurrentYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const handleDayClick = (dayObj) => {
    if (!dayObj) return;
    if (dayObj.month !== currentMonth || dayObj.year !== currentYear) {
      setCurrentMonth(dayObj.month);
      setCurrentYear(dayObj.year);
    }
    setSelectedDay(dayObj.day);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Compute days matrix: prepend previous month's end, and append next month's start to fill 42 cells
  const daysArray = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevDaysInMonth = new Date(prevYear, prevMonth + 1, 0).getDate();

    const arr = [];
    
    // Add trailing days of previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      arr.push({
        day: prevDaysInMonth - i,
        isCurrentMonth: false,
        month: prevMonth,
        year: prevYear
      });
    }

    // Add current month days
    for (let i = 1; i <= daysInMonth; i++) {
      arr.push({
        day: i,
        isCurrentMonth: true,
        month: currentMonth,
        year: currentYear
      });
    }

    // Add leading days of next month to fill grid to a multiple of 7
    const remaining = 42 - arr.length;
    for (let i = 1; i <= remaining; i++) {
      arr.push({
        day: i,
        isCurrentMonth: false,
        month: currentMonth === 11 ? 0 : currentMonth + 1,
        year: currentMonth === 11 ? currentYear + 1 : currentYear
      });
    }

    return arr;
  }, [currentMonth, currentYear]);

  // Combined events & tasks preview for tooltips, filtered by activeEventId
  const getDayAgendaPreview = (dayObj) => {
    if (!dayObj) return { events: [], tasks: [] };
    const dateStr = `${dayObj.year}-${String(dayObj.month + 1).padStart(2, '0')}-${String(dayObj.day).padStart(2, '0')}`;
    
    // Only show active event if selected
    const filteredEvents = activeEvent 
      ? (activeEvent.startDate.substring(0, 10) === dateStr ? [activeEvent] : [])
      : events.filter(ev => ev.startDate.substring(0, 10) === dateStr);
    
    const dayTasks = [];
    const eventsToScan = activeEvent ? [activeEvent] : events;
    eventsToScan.forEach(event => {
      const tasks = eventTasks[event.id] || [];
      tasks.forEach(t => {
        if (t.dueDate === dateStr) {
          dayTasks.push({
            ...t,
            eventTitle: event.title,
            eventId: event.id
          });
        }
      });
    });
    
    return { events: filteredEvents, tasks: dayTasks };
  };

  const getDayDetails = (dayObj) => {
    if (!dayObj) return { hasEvent: false, hasTask: false, eventStatus: null, eventsList: [], tasksList: [] };
    const { events: dayEvents, tasks: dayTasks } = getDayAgendaPreview(dayObj);
    const hasEvent = dayEvents.length > 0;
    const hasTask = dayTasks.length > 0;
    const eventStatus = hasEvent ? (dayEvents.some(ev => ev.status === 'CONFIRMED') ? 'CONFIRMED' : 'PENDING') : null;
    return { hasEvent, hasTask, eventStatus, eventsList: dayEvents, tasksList: dayTasks };
  };

  const agendaItems = useMemo(() => {
    const selectedDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    
    // Filter events
    const dayEvents = events.filter(ev => ev.id === activeEventId && ev.startDate.substring(0, 10) === selectedDateStr).map(ev => ({
      id: ev.id,
      type: 'event',
      time: new Date(ev.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: ev.title,
      desc: ev.address ? ev.address.split(',')[0] : "Venue Schedule",
      status: ev.status,
      raw: ev
    }));
    
    // Filter tasks
    const dayTasks = [];
    if (activeEvent) {
      const tasks = eventTasks[activeEvent.id] || [];
      tasks.forEach(t => {
        if (t.dueDate === selectedDateStr) {
          dayTasks.push({
            id: t.id,
            type: 'task',
            eventId: activeEvent.id,
            time: "Due",
            title: t.taskName,
            desc: `Project: ${activeEvent.title}`,
            priority: t.priority,
            isCompleted: t.isCompleted,
            raw: t
          });
        }
      });
    }

    const priorityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
    return [
      ...dayEvents,
      ...dayTasks.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0))
    ];
  }, [selectedDay, events, eventTasks, currentMonth, currentYear, activeEvent, activeEventId]);

  return (
    <div className="space-y-6 font-sans">
      {/* Interactive Header with workspace selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
            Hello, {customerProfile?.firstName || 'Curator'}
          </h1>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">
            Command center for your active project budgets, milestones, and checklists.
          </p>
        </div>
        
        {/* Project workspace selection dropdown */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {events.length > 0 && (
            <div className="flex items-center gap-2 bg-white/40 backdrop-blur-md border border-white/60 px-3.5 py-2 rounded-xl shadow-sm w-full md:w-auto">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Workspace:</span>
              <select 
                value={activeEventId || ""} 
                onChange={(e) => setActiveEventId(parseFloat(e.target.value))}
                className="bg-transparent border-0 text-xs font-bold text-gray-800 focus:ring-0 cursor-pointer pr-8 py-0"
              >
                {events.map(ev => (
                  <option key={ev.id} value={ev.id} className="bg-white text-gray-800">{ev.title}</option>
                ))}
              </select>
            </div>
          )}
          <button onClick={() => setTab('events')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm whitespace-nowrap ml-auto md:ml-0">
            + Create Event
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map(n => <div key={n} className="h-20 bg-gray-50 border rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <OverviewStatCard title="Total Projects" value={stats.events} onClick={() => setTab('events')} icon={<CalendarDays className="text-blue-500" size={18} />} />
          <OverviewStatCard 
            title="Adjust Budget Ceiling" 
            value={`₹${totalBudget.toLocaleString('en-IN')}`} 
            onClick={() => {
              setNewBudgetLimit(totalBudget.toString());
              setShowBudgetModal(true);
            }} 
            icon={<FileText className="text-emerald-500" size={18} />} 
          />
          <OverviewStatCard title="Project Checklist" value={activePendingTasks.length} onClick={() => setTab('events')} icon={<Scale className="text-rose-500" size={18} />} />
          <OverviewStatCard title="Wallet Balance" value={`₹${stats.wallet.toLocaleString('en-IN')}`} onClick={() => setTab('wallet')} icon={<WalletIcon className="text-blue-650" size={18} />} />
        </div>
      )}

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Line Chart and Primary Tables (Col-span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Spend Line Chart widget */}
          <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 relative shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Project Spends Progression</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-gray-800">₹{totalSpend.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-gray-400 font-semibold">spent of ₹{totalBudget.toLocaleString('en-IN')} budget</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 block"></span> Spent</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 border border-dashed border-gray-400 block"></span> Budget Limit</span>
              </div>
            </div>
            
            {/* SVG Sparkline container */}
            <div className="relative mt-2">
              {chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Activity size={24} className="text-gray-300 mb-2 animate-pulse" />
                  <p className="text-xs text-gray-400 font-semibold italic">No spend data recorded for this event. Book service providers to track spends.</p>
                </div>
              ) : (
                <>
                  <svg className="w-full h-auto" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
                    <defs>
                      <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <line x1={chartPadding} y1={chartPadding} x2={chartWidth - chartPadding} y2={chartPadding} stroke="rgba(226, 232, 240, 0.5)" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1={chartPadding} y1={chartPadding + (chartHeight - 2 * chartPadding) / 2} x2={chartWidth - chartPadding} y2={chartPadding + (chartHeight - 2 * chartPadding) / 2} stroke="rgba(226, 232, 240, 0.5)" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1={chartPadding} y1={chartHeight - chartPadding} x2={chartWidth - chartPadding} y2={chartHeight - chartPadding} stroke="rgba(203, 213, 225, 0.8)" strokeWidth="1.5" />
                    
                    {hoveredPoint !== null && pointsSpend[hoveredPoint] && (
                      <line 
                        x1={pointsSpend[hoveredPoint].x} 
                        y1={chartPadding} 
                        x2={pointsSpend[hoveredPoint].x} 
                        y2={chartHeight - chartPadding} 
                        stroke="#2563eb" 
                        strokeWidth="1.5" 
                        strokeDasharray="4 4" 
                        className="opacity-40"
                      />
                    )}

                    {areaSpend && <path d={areaSpend} fill="url(#spendGrad)" />}
                    {pathSpend && <path d={pathSpend} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                    {pathBudget && <path d={pathBudget} fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeDasharray="4 4" strokeLinecap="round" className="opacity-80" />}
                    
                    {pointsSpend.map((p, idx) => (
                      <g key={idx} onMouseEnter={() => setHoveredPoint(idx)} onMouseLeave={() => setHoveredPoint(null)}>
                        {hoveredPoint === idx && (
                          <>
                            <circle cx={p.x} cy={p.y} r={8} className="fill-blue-500/20 stroke-none animate-ping" />
                            <circle cx={p.x} cy={p.y} r={5.5} className="fill-blue-600 stroke-white stroke-2 cursor-pointer transition-all" />
                          </>
                        )}
                        <text x={p.x} y={chartHeight - 12} textAnchor="middle" className="text-[9px] fill-gray-400 font-bold">{p.label}</text>
                        <circle cx={p.x} cy={p.y} r={16} fill="transparent" className="cursor-pointer" />
                      </g>
                    ))}

                    {hoveredPoint !== null && pointsSpend[hoveredPoint] && (
                      <g className="transition-all duration-200">
                        <rect 
                          x={pointsSpend[hoveredPoint].x - 47} 
                          y={pointsSpend[hoveredPoint].y - 36} 
                          width="94" 
                          height="24" 
                          rx="8" 
                          fill="rgba(15, 23, 42, 0.95)" 
                          stroke="rgba(255, 255, 255, 0.15)"
                          strokeWidth="1"
                        />
                        <text 
                          x={pointsSpend[hoveredPoint].x} 
                          y={pointsSpend[hoveredPoint].y - 20} 
                          textAnchor="middle" 
                          fill="#ffffff" 
                          className="text-[9px] font-black tracking-tight"
                        >
                          ₹{pointsSpend[hoveredPoint].val.toLocaleString('en-IN')}
                        </text>
                      </g>
                    )}
                  </svg>
                </>
              )}
            </div>
          </div>

          {/* Side-by-Side: Projects and Tasks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Active Projects Widget */}
            <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Project Portfolio</h3>
                  <button onClick={() => setTab('events')} className="text-xs text-blue-600 font-semibold hover:underline">All Events</button>
                </div>
                {events.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-6 text-center">No active plans. Click New Event to start.</p>
                ) : (
                  <div className="space-y-4 mt-2">
                    {events.slice(0, 3).map(ev => {
                      const pct = getEventProgress(ev.id);
                      const isWorkspaceActive = ev.id === activeEventId;
                      return (
                        <div 
                          key={ev.id} 
                          onClick={() => setActiveEventId(ev.id)}
                          className={`flex items-center gap-3.5 border-b border-gray-100 last:border-0 pb-3 last:pb-0 cursor-pointer transition-all p-1.5 rounded-xl hover:bg-white/30 ${isWorkspaceActive ? 'bg-white/50 border-blue-500' : ''}`}
                        >
                          {/* Circular progress meter */}
                          <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
                              <circle 
                                cx="22" 
                                cy="22" 
                                r="18" 
                                className="stroke-slate-100 fill-none" 
                                strokeWidth="3" 
                              />
                              <motion.circle 
                                cx="22" 
                                cy="22" 
                                r="18" 
                                className="stroke-blue-600 fill-none" 
                                strokeWidth="3.5" 
                                strokeLinecap="round"
                                strokeDasharray={2 * Math.PI * 18}
                                initial={{ strokeDashoffset: 2 * Math.PI * 18 }}
                                animate={{ strokeDashoffset: 2 * Math.PI * 18 * (1 - pct / 100) }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                              />
                            </svg>
                            <span className="absolute text-[8px] font-black text-gray-700">{pct}%</span>
                          </div>
                          {/* Project details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-bold text-gray-800 text-xs truncate max-w-[130px]" title={ev.title}>{ev.title}</h4>
                              <span className={`px-2 py-0.5 border text-[7px] font-black rounded-full uppercase tracking-wider ${
                                ev.status === 'CONFIRMED' 
                                  ? 'bg-green-50 text-green-700 border-green-200' 
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>{ev.status}</span>
                            </div>
                            <div className="flex justify-between items-center mt-1 text-[9px] text-gray-400 font-semibold">
                              <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(ev.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                              <span className="font-medium">{isWorkspaceActive ? "Active workspace" : "Switch workspace"}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Checklist Scan Widget */}
            <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Project checklist</h3>
                  <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full font-bold">{activePendingTasks.length} pending</span>
                </div>
                {activePendingTasks.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-6 text-center">No tasks remaining for this project!</p>
                ) : (
                  <div className="space-y-2.5 mt-2.5 max-h-[145px] overflow-y-auto pr-0.5 custom-scrollbar">
                    {activePendingTasks.slice(0, 3).map(t => (
                      <div key={`${t.eventId}-${t.id}`} className="flex items-start gap-3 p-2.5 bg-white/30 hover:bg-white/50 border border-white/50 hover:border-blue-200 rounded-2xl text-xs shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all">
                        <input 
                          type="checkbox" 
                          checked={t.isCompleted} 
                          onChange={() => handleToggleOverviewTask(t.eventId, t.id)}
                          className="mt-0.5 w-4 h-4 text-blue-600 border-white/80 bg-white/40 rounded-md focus:ring-blue-500 cursor-pointer shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-800 truncate leading-snug" title={t.taskName}>{t.taskName}</h4>
                          <div className="flex items-center gap-2 mt-1 text-[8px] font-semibold text-gray-400">
                            <span className="flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                t.priority === 'HIGH' ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]' :
                                t.priority === 'MEDIUM' ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]' :
                                'bg-slate-400'
                              }`} />
                              <span className="text-[7.5px] uppercase font-extrabold text-slate-500 tracking-wider">
                                {t.priority}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick task addition form */}
              {activeEvent && (
                <form onSubmit={handleQuickAddTask} className="mt-4 pt-3 border-t border-white/30 flex gap-2">
                  <input 
                    type="text" 
                    name="taskName"
                    placeholder="Quick-add task..." 
                    className="flex-1 px-3 py-1.5 bg-white/50 border border-white/80 rounded-xl text-xs font-semibold focus:ring-0 focus:border-blue-500 placeholder:text-gray-400"
                    required
                  />
                  <select 
                    name="priority"
                    className="bg-white/50 border border-white/80 rounded-xl text-[10px] font-bold text-gray-600 focus:ring-0 py-1"
                  >
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Med</option>
                    <option value="LOW">Low</option>
                  </select>
                  <button 
                    type="submit" 
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Mini Calendar & Planner Schedule agenda (Col-span 1) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Sleek Mini Calendar */}
          <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4 flex justify-between items-center">
              <div className="flex items-center gap-1">
                <button 
                  onClick={handlePrevMonth} 
                  className="p-1 hover:bg-white/60 hover:text-gray-900 rounded-lg text-gray-400 transition-colors shadow-sm border border-transparent hover:border-white/40"
                  title="Previous Month"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="min-w-[95px] text-center text-slate-700 font-bold">{monthNames[currentMonth]} {currentYear}</span>
                <button 
                  onClick={handleNextMonth} 
                  className="p-1 hover:bg-white/60 hover:text-gray-900 rounded-lg text-gray-400 transition-colors shadow-sm border border-transparent hover:border-white/40"
                  title="Next Month"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
              <span className="text-[10px] text-blue-600 cursor-pointer font-bold hover:underline" onClick={() => setTab('events')}>Planner view</span>
            </h3>
            
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {weekDays.map(wd => (
                <div key={wd} className="text-gray-400 font-bold py-1">{wd}</div>
              ))}
              {daysArray.map((day, idx) => {
                const isSelected = day.day === selectedDay && day.month === currentMonth && day.year === currentYear;
                const isToday = day.day === today.getDate() && day.month === today.getMonth() && day.year === today.getFullYear();
                const details = getDayDetails(day);
                
                return (
                  <div 
                    key={idx} 
                    className="relative py-1 flex flex-col items-center justify-center group"
                    onMouseEnter={() => setHoveredDay(idx)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    <motion.button 
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDayClick(day)}
                      className={`w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center transition-all ${
                        isSelected ? 'bg-gradient-to-tr from-blue-600 to-indigo-650 text-white shadow-md font-black ring-2 ring-blue-600/20' :
                        isToday ? 'border border-blue-600 text-blue-600 font-black bg-blue-50/50' :
                        day.isCurrentMonth ? 'text-gray-700 hover:bg-white/60' : 'text-gray-300 hover:bg-white/30'
                      }`}
                    >
                      {day.day}
                    </motion.button>

                    {/* Dot Indicators */}
                    <div className="absolute bottom-0.5 flex gap-0.5 justify-center items-center">
                      {details.hasEvent && (
                        <span className={`w-1 h-1 rounded-full ${
                          isSelected ? 'bg-white' : 
                          details.eventStatus === 'CONFIRMED' ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)]' : 'bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.6)]'
                        }`} />
                      )}
                      {details.hasTask && (
                        <span className={`w-1 h-1 rounded-full ${
                          isSelected ? 'bg-white' : 'bg-indigo-500 shadow-[0_0_4px_rgba(99,102,241,0.6)]'
                        }`} />
                      )}
                    </div>

                    {/* Hover Card Tooltip */}
                    {hoveredDay === idx && (details.hasEvent || details.hasTask) && (
                      <div className="absolute bottom-9 left-1/2 -translate-x-1/2 w-48 bg-slate-900/95 text-white text-[10px] p-2.5 rounded-xl shadow-xl z-50 pointer-events-none backdrop-blur-sm border border-white/10 space-y-1.5 transition-all duration-200">
                        <div className="font-extrabold border-b border-white/15 pb-1 text-[9px] text-slate-300 uppercase tracking-wider">
                          {monthNames[day.month].substring(0, 3)} {day.day}, {day.year}
                        </div>
                        {details.eventsList.length > 0 && (
                          <div className="space-y-0.5">
                            <div className="text-[8px] text-blue-400 font-black uppercase">Events ({details.eventsList.length})</div>
                            {details.eventsList.map((ev, eidx) => (
                              <div key={eidx} className="truncate font-semibold text-slate-200">• {ev.title}</div>
                            ))}
                          </div>
                        )}
                        {details.tasksList.length > 0 && (
                          <div className="space-y-0.5 pt-1">
                            <div className="text-[8px] text-indigo-400 font-black uppercase">Tasks ({details.tasksList.length})</div>
                            {details.tasksList.map((t, tidx) => (
                              <div key={tidx} className="truncate text-slate-300 flex items-center gap-1">
                                <span className={`w-1 h-1 rounded-full ${
                                  t.priority === 'HIGH' ? 'bg-red-500' :
                                  t.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-slate-400'
                                }`} />
                                <span className="truncate">{t.taskName}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Agenda Planner List */}
            <div className="mt-5 pt-4 border-t border-white/40">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Agenda • {monthNames[currentMonth]} {selectedDay}</span>
                <span className="text-[9px] bg-white/60 text-slate-600 px-1.5 py-0.5 rounded-md font-extrabold">
                  {agendaItems.length} {agendaItems.length === 1 ? 'item' : 'items'}
                </span>
              </h4>
              {agendaItems.length === 0 ? (
                <p className="text-[10px] text-gray-400 italic py-2">No schedules planned for this day.</p>
              ) : (
                <div className="space-y-2.5">
                  {agendaItems.map((item) => {
                    if (item.type === 'event') {
                      return (
                        <motion.div 
                          whileHover={{ x: 2 }}
                          key={`${item.type}-${item.id}`} 
                          className="flex gap-3 text-xs leading-normal p-2.5 rounded-2xl bg-white/30 border border-white/40 hover:bg-white/50 hover:border-blue-200/50 transition-all shadow-sm"
                        >
                          <div className="flex flex-col items-center justify-center min-w-[45px]">
                            <span className="text-[8px] font-extrabold text-blue-700 bg-blue-500/10 border border-blue-500/20 rounded-md px-1.5 py-0.5 whitespace-nowrap">{item.time}</span>
                            <span className="text-[7px] text-blue-500 uppercase tracking-wider font-extrabold mt-1">Event</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-gray-800 truncate">{item.title}</h5>
                              <span className={`px-1.5 py-0.2 border text-[6.5px] font-black rounded-full uppercase tracking-wider ${
                                item.status === 'CONFIRMED' 
                                  ? 'bg-green-50 text-green-700 border-green-200' 
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>{item.status}</span>
                            </div>
                            <p className="text-[9px] text-gray-400 font-semibold truncate mt-0.5">{item.desc}</p>
                          </div>
                        </motion.div>
                      );
                    } else {
                      return (
                        <motion.div 
                          whileHover={{ x: 2 }}
                          key={`${item.type}-${item.id}`} 
                          className={`flex gap-3 text-xs leading-normal p-2.5 rounded-2xl border transition-all shadow-sm ${
                            item.isCompleted 
                              ? 'bg-slate-50/50 border-slate-200/40 opacity-70' 
                              : 'bg-white/30 border-white/40 hover:bg-white/50 hover:border-indigo-200/50'
                          }`}
                        >
                          <div className="flex items-center justify-center pl-1">
                            <input 
                              type="checkbox" 
                              checked={item.isCompleted} 
                              onChange={() => handleToggleOverviewTask(item.eventId, item.id)}
                              className="w-4 h-4 text-indigo-650 border-white/80 bg-white/45 rounded-md focus:ring-indigo-500 cursor-pointer shadow-sm"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h5 className={`font-bold text-gray-800 truncate ${item.isCompleted ? 'line-through text-gray-400' : ''}`}>{item.title}</h5>
                              <span className={`px-1.5 py-0.2 text-[6.5px] font-black rounded-full uppercase tracking-wider border ${
                                item.priority === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' :
                                item.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                'bg-slate-50 text-slate-700 border-slate-200'
                              }`}>{item.priority}</span>
                            </div>
                            <p className="text-[9px] text-gray-400 font-semibold truncate mt-0.5">{item.desc}</p>
                          </div>
                        </motion.div>
                      );
                    }
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick links to actions */}
          <div className="bg-gradient-to-tr from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-250/20 backdrop-blur-md rounded-3xl p-6 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.01)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -z-10" />
            <div>
              <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1">Need Service Providers? 💼</h4>
              <p className="text-[10px] text-gray-450 leading-relaxed font-semibold mt-1.5">Hire catering, professional photography, lighting decor, or sound systems securely.</p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setTab('bookings')} 
              className="mt-5 w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 hover:from-blue-750 hover:to-indigo-700 transition-all"
            >
              Book Vendors in Escrow
            </motion.button>
          </div>

        </div>

      </div>

      {/* Adjust Budget Modal */}
      {showBudgetModal && (
        <Dialog open={showBudgetModal} onOpenChange={setShowBudgetModal}>
          <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border border-gray-200">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-gray-900">Adjust Project Budget Ceiling</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateBudget(newBudgetLimit);
            }} className="space-y-4 mt-2">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Budget Limit Amount (₹)</label>
                <input 
                  type="number"
                  placeholder="200000"
                  value={newBudgetLimit}
                  onChange={(e) => setNewBudgetLimit(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-xl text-xs font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all">Save Changes</button>
                <button type="button" onClick={() => setShowBudgetModal(false)} className="flex-1 py-3 border rounded-xl text-xs font-bold text-gray-650 hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function OverviewStatCard({ title, value, icon, color = "bg-white/40 backdrop-blur-md border-white/60", onClick }) {
  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.015, boxShadow: "0 12px 30px rgba(0,0,0,0.03)" }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className={`p-6 rounded-3xl border flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.01)] cursor-pointer transition-all duration-200 ${color} hover:border-blue-400/40`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</span>
        <div className="p-2 rounded-xl bg-white/70 shadow-sm border border-white/60">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-black text-gray-800 tracking-tight mt-5">
        {value}
      </div>
    </motion.div>
  );
}

/* 2. Events Tab */
function EventsTab({ customerProfile, isDemoMode }) {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [eventBookings, setEventBookings] = useState({});
  const [bookingsLoading, setBookingsLoading] = useState({});

  const [eventSubTabs, setEventSubTabs] = useState({});
  const [eventTasks, setEventTasks] = useState({});

  const setSubTab = (eventId, subTab) => {
    setEventSubTabs(prev => ({ ...prev, [eventId]: subTab }));
  };

  const getEventTasksList = (event, bookings) => {
    const eventId = event.id;
    const stored = localStorage.getItem(`planit_tasks_${eventId}`);
    if (stored) {
      try {
        return JSON.parse(stored).filter(t => t.id !== 't1' && t.id !== 't2' && t.id !== 't3');
      } catch (e) {
        console.error("Error parsing stored tasks:", e);
      }
    }
    
    /*
    // Default initial tasks if none exist
    const defaultTasks = [
      { id: 't1', taskName: "Book venue location and address", taskDescription: "Ensure Grand Hyatt or Nesco ballrooms are locked.", dueDate: event.startDate.substring(0, 10), priority: "HIGH", isCompleted: false, isCustom: false },
      { id: 't2', taskName: "Confirm catering menu requirements", taskDescription: "Set up food preferences and buffet schedules.", dueDate: event.startDate.substring(0, 10), priority: "MEDIUM", isCompleted: false, isCustom: false },
      { id: 't3', taskName: "Coordinate event sangeet timeline", taskDescription: "Align performers, hosts, and guest entry lists.", dueDate: event.startDate.substring(0, 10), priority: "MEDIUM", isCompleted: false, isCustom: false }
    ];
    */
    const defaultTasks = [];

    // Auto-generate vendor coordination tasks from hired services
    bookings.forEach((b) => {
      defaultTasks.push({
        id: `auto_${b.id}`,
        taskName: `Coordinate with ${b.services?.name || "Service Provider"}`,
        taskDescription: `Review contract requirements for category ${b.services?.category || "Services"}. Booking ID #${b.id}.`,
        dueDate: event.startDate.substring(0, 10),
        priority: "HIGH",
        isCompleted: b.status === 'CONFIRMED' || b.status === 'RESOLVED',
        isCustom: false
      });
    });

    localStorage.setItem(`planit_tasks_${eventId}`, JSON.stringify(defaultTasks));
    return defaultTasks;
  };

  // Sync event tasks when events list or bookings load
  useEffect(() => {
    if (events.length > 0) {
      const initialTasks = {};
      events.forEach(ev => {
        const bookings = eventBookings[ev.id] || [];
        initialTasks[ev.id] = getEventTasksList(ev, bookings);
      });
      setEventTasks(initialTasks);
    }
  }, [events, eventBookings]);

  const handleToggleTask = (eventId, taskId) => {
    const list = eventTasks[eventId] || [];
    const updated = list.map(t => t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t);
    setEventTasks(prev => ({ ...prev, [eventId]: updated }));
    localStorage.setItem(`planit_tasks_${eventId}`, JSON.stringify(updated));
  };

  const handleAddCustomTask = (eventId, e) => {
    e.preventDefault();
    const taskName = e.target.taskName.value.trim();
    const taskDescription = e.target.taskDescription.value.trim();
    const dueDate = e.target.dueDate.value;
    const priority = e.target.priority.value;

    if (!taskName) return;

    const newTask = {
      id: 'custom_' + Date.now(),
      taskName,
      taskDescription,
      dueDate: dueDate || getTodayString(1).substring(0, 10),
      priority: priority || 'MEDIUM',
      isCompleted: false,
      isCustom: true
    };

    const list = eventTasks[eventId] || [];
    const updated = [newTask, ...list];
    setEventTasks(prev => ({ ...prev, [eventId]: updated }));
    localStorage.setItem(`planit_tasks_${eventId}`, JSON.stringify(updated));

    e.target.reset();
  };

  const handleDeleteTask = (eventId, taskId) => {
    const list = eventTasks[eventId] || [];
    const updated = list.filter(t => t.id !== taskId);
    setEventTasks(prev => ({ ...prev, [eventId]: updated }));
    localStorage.setItem(`planit_tasks_${eventId}`, JSON.stringify(updated));
  };

  const getMilestones = (event, bookings) => {
    const now = new Date();
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);

    const m1_status = 'COMPLETED'; // Always done
    
    const m2_status = bookings.length > 0 ? 'COMPLETED' : 'IN_PROGRESS';
    
    const m3_status = bookings.length > 0 
      ? (bookings.every(b => b.status === 'CONFIRMED' || b.status === 'RESOLVED') ? 'COMPLETED' : 'IN_PROGRESS')
      : 'PENDING';
      
    const m4_status = now > end 
      ? 'COMPLETED' 
      : (now >= start ? 'IN_PROGRESS' : 'PENDING');
      
    const m5_status = event.status === 'RESOLVED' || event.status === 'COMPLETED' || (bookings.length > 0 && bookings.every(b => b.status === 'RESOLVED') && now > end)
      ? 'COMPLETED'
      : (now > end ? 'IN_PROGRESS' : 'PENDING');

    return [
      { label: 'Planning Initiated', desc: 'Event details drafted and address set.', status: m1_status },
      { label: 'Vendors Hired', desc: `${bookings.length} provider service requests linked.`, status: m2_status },
      { label: 'Escrow Secured', desc: 'Deposit funds locked in platform safety vault.', status: m3_status },
      { label: 'Event Execution', desc: 'Decor setup, performance run, and service delivery.', status: m4_status },
      { label: 'Closeout & Release', desc: 'Escrow release verification and feedback reviews.', status: m5_status }
    ];
  };
  
  // Create / Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    startDate: '',
    endDate: '',
    status: 'DRAFT'
  });

  const [mapContainer, setMapContainer] = useState(null);
  const mapRef = (node) => {
    setMapContainer(node);
  };
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);

  const fetchEvents = async () => {
    /*
    if (isDemoMode) {
      setEvents([
        {
          id: 101,
          title: "Anjali's Sangeet Ceremony",
          description: "Traditional sangeet night with dance, music, and high-end lighting decor. Expecting 150 guests.",
          address: "Grand Hyatt Ballroom, Santacruz, Mumbai",
          startDate: "2026-11-12T18:00:00",
          endDate: "2026-11-12T23:59:00",
          status: "CONFIRMED"
        },
        {
          id: 102,
          title: "Corporate Product Launch 2026",
          description: "High tech product launch event. Needs premium catering and AV logistics setup.",
          address: "Nesco Exhibition Center, Goregaon, Mumbai",
          startDate: "2026-08-20T09:00:00",
          endDate: "2026-08-20T18:00:00",
          status: "PENDING_BOOKING"
        },
        {
          id: 103,
          title: "Outdoor Birthday Bash",
          description: "Chilled out garden themed birthday party. Needs balloon decor, DJ console, and snack stalls.",
          address: "Jogger's Park Lawn, Bandra, Mumbai",
          startDate: "2026-07-05T16:00:00",
          endDate: "2026-07-05T21:00:00",
          status: "DRAFT"
        }
      ]);
      setLoading(false);
      return;
    }
    */
    if (!customerProfile?.id) return;
    try {
      setLoading(true);
      const res = await apiClient.get(`/api/events/customer/${customerProfile.id}?page=0&size=100`);
      const data = res.data?.data?.content || res.data?.content || [];
      setEvents(data);
    } catch (err) {
      console.error("Error fetching events:", err);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [customerProfile]);

  const fetchEventBookings = async (eventId) => {
    /*
    if (isDemoMode) {
      const mockEventBookings = {
        101: [
          { id: 201, services: { name: "Shine & Sound DJs" }, status: "CONFIRMED", bookingAmount: 25000 },
          { id: 202, services: { name: "Royal Flower Decorators" }, status: "CONFIRMED", bookingAmount: 45000 }
        ],
        102: [
          { id: 203, services: { name: "Gourmet Catering Services" }, status: "PENDING", bookingAmount: 95000 }
        ],
        103: []
      };
      setEventBookings(prev => ({ ...prev, [eventId]: mockEventBookings[eventId] || [] }));
      setBookingsLoading(prev => ({ ...prev, [eventId]: false }));
      return;
    }
    */
    try {
      setBookingsLoading(prev => ({ ...prev, [eventId]: true }));
      const res = await apiClient.get(`/api/events/booking/${eventId}?page=0&size=100`);
      const bookings = res.data?.data?.content || res.data?.content || [];
      setEventBookings(prev => ({ ...prev, [eventId]: bookings }));
    } catch (err) {
      console.error("Error fetching bookings for event:", err);
    } finally {
      setBookingsLoading(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const handleToggleExpand = (eventId) => {
    if (expandedEventId === eventId) {
      setExpandedEventId(null);
    } else {
      setExpandedEventId(eventId);
      if (!eventBookings[eventId]) {
        fetchEventBookings(eventId);
      }
    }
  };

  const getTodayString = (daysOffset = 0, hour = 9) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    d.setHours(hour, 0, 0, 0);
    const tzoffset = d.getTimezoneOffset() * 60000;
    return (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      title: '',
      description: '',
      address: '',
      startDate: getTodayString(1, 9),
      endDate: getTodayString(1, 18),
      status: 'DRAFT'
    });
    setShowModal(true);
  };

  const openEditModal = (event, e) => {
    e.stopPropagation();
    setModalMode('edit');
    setSelectedEventId(event.id);
    setFormData({
      title: event.title,
      description: event.description || '',
      address: event.address || '',
      startDate: event.startDate ? event.startDate.substring(0, 16) : getTodayString(1, 9),
      endDate: event.endDate ? event.endDate.substring(0, 16) : getTodayString(1, 18),
      status: event.status || 'DRAFT'
    });
    setShowModal(true);
  };

  const handleDeleteEvent = async (eventId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this event? This action will remove the event.")) {
      return;
    }
    if (isDemoMode) {
      setEvents(prev => prev.filter(ev => ev.id !== eventId));
      toast.success("Event deleted (Demo Mode)");
      return;
    }
    try {
      await apiClient.delete(`/api/events/${eventId}`);
      toast.success("Event deleted.");
      setEvents(prev => prev.filter(ev => ev.id !== eventId));
    } catch (err) {
      console.error("Error deleting event:", err);
      toast.error("Failed to delete event");
    }
  };

  const handleCancelEvent = async (event, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to cancel this event? This will change status to CANCELLED.")) {
      return;
    }
    if (isDemoMode) {
      setEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, status: 'CANCELLED' } : ev));
      toast.success("Event cancelled (Demo Mode)");
      return;
    }
    try {
      const payload = {
        customerId: customerProfile.id,
        title: event.title,
        description: event.description,
        address: event.address,
        startDate: event.startDate,
        endDate: event.endDate,
        status: 'CANCELLED'
      };
      const res = await apiClient.put(`/api/events/${event.id}`, payload);
      toast.success("Event cancelled.");
      const updated = res.data?.data || res.data;
      setEvents(prev => prev.map(ev => ev.id === event.id ? updated : ev));
    } catch (err) {
      console.error("Error cancelling event:", err);
      toast.error("Failed to cancel event");
    }
  };

  const fetchAddressFromCoords = async (lat, lng) => {
    const toastId = toast.loading("Fetching address details...");
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
      if (data && data.display_name) {
        setFormData(prev => ({ ...prev, address: data.display_name }));
        toast.success("Address details auto-filled!", { id: toastId, duration: 3000 });
      } else {
        toast.dismiss(toastId);
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not fetch address details. Please type manually.", { id: toastId });
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (mapInstance.current && markerInstance.current) {
            mapInstance.current.setView([latitude, longitude], 14);
            markerInstance.current.setLatLng([latitude, longitude]);
          }
          fetchAddressFromCoords(latitude, longitude);
        },
        () => {
          toast.error("Unable to retrieve GPS coordinates.");
        }
      );
    }
  };

  // Map initialization in modal
  useEffect(() => {
    let active = true;
    if (!showModal || !mapContainer) return;

    import('leaflet').then((L) => {
      if (!active || !mapContainer) return;

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

      let lat = 20.5937;
      let lng = 78.9629;
      let zoom = 5;

      const initializeMap = (startLat, startLng, startZoom) => {
        if (!mapInstance.current && mapContainer) {
          const map = L.default.map(mapContainer).setView([startLat, startLng], startZoom);
          L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);

          mapInstance.current = map;
          setTimeout(() => { if (map) map.invalidateSize(); }, 200);

          const marker = L.default.marker([startLat, startLng], { draggable: true }).addTo(map);
          markerInstance.current = marker;

          marker.on('dragend', () => {
            const position = marker.getLatLng();
            fetchAddressFromCoords(position.lat, position.lng);
          });

          map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            marker.setLatLng([lat, lng]);
            fetchAddressFromCoords(lat, lng);
          });
        }
      };

      if (formData.address) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}&limit=1`)
          .then(res => res.json())
          .then(data => {
            if (active && data && data.length > 0) {
              initializeMap(parseFloat(data[0].lat), parseFloat(data[0].lon), 14);
            } else {
              initializeMap(lat, lng, zoom);
            }
          })
          .catch(() => initializeMap(lat, lng, zoom));
      } else {
        initializeMap(lat, lng, zoom);
      }
    });

    return () => {
      active = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerInstance.current = null;
      }
    };
  }, [showModal, mapContainer]);

  const [formSaving, setFormSaving] = useState(false);
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.startDate || !formData.endDate) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (isDemoMode) {
      setFormSaving(true);
      setTimeout(() => {
        const newEvent = {
          id: modalMode === 'create' ? Math.floor(Math.random() * 1000) + 200 : selectedEventId,
          title: formData.title,
          description: formData.description,
          address: formData.address,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: formData.status
        };
        if (modalMode === 'create') {
          setEvents(prev => [newEvent, ...prev]);
          toast.success("Event created successfully (Demo Mode)!");
        } else {
          setEvents(prev => prev.map(ev => ev.id === selectedEventId ? newEvent : ev));
          toast.success("Event updated successfully (Demo Mode)!");
        }
        setShowModal(false);
        setFormSaving(false);
      }, 500);
      return;
    }
    try {
      setFormSaving(true);
      const payload = {
        customerId: customerProfile.id,
        title: formData.title,
        description: formData.description,
        address: formData.address,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status
      };

      if (modalMode === 'create') {
        const res = await apiClient.post('/api/events/create', payload);
        toast.success("Event created successfully!");
        setEvents(prev => [res.data?.data || res.data, ...prev]);
      } else {
        const res = await apiClient.put(`/api/events/${selectedEventId}`, payload);
        toast.success("Event updated successfully!");
        const updated = res.data?.data || res.data;
        setEvents(prev => prev.map(ev => ev.id === selectedEventId ? updated : ev));
      }
      setShowModal(false);
    } catch (err) {
      toast.error("Failed to save event details");
    } finally {
      setFormSaving(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-55 text-green-700 border-green-200';
      case 'CANCELLED': return 'bg-red-55 text-red-700 border-red-200';
      case 'COMPLETED': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'PENDING_BOOKING': return 'bg-amber-55 text-amber-700 border-amber-200';
      default: return 'bg-blue-55 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Events Planner</h1>
          <p className="text-xs text-slate-500 font-semibold">Organize and monitor custom service bookings for your schedules.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-blue-600/15"
        >
          <Plus size={16} /> New Event
        </button>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-44 bg-white/40 border border-white/60 rounded-3xl" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-white/40 border border-white/60 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
          <CalendarDays className="text-slate-350 mx-auto mb-3" size={40} />
          <h3 className="text-base font-bold text-slate-700">No events listed</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto font-semibold">Create your first event plan to start hiring photographers, venues, and caterers.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-white/60 bg-white/40 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/30 border-b border-white/40 text-[10px] text-slate-500 uppercase tracking-wider font-bold h-12">
                <th className="px-6 py-3">Event / Project</th>
                <th className="px-6 py-3">Dates</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            {events.map(event => {
              const isExpanded = expandedEventId === event.id;
              const bookings = eventBookings[event.id] || [];
              const isBookingsLoading = bookingsLoading[event.id];

              return (
                <tbody key={event.id} className="divide-y divide-white/20 border-b border-white/20 last:border-0">
                  <tr 
                    onClick={() => handleToggleExpand(event.id)}
                    className="hover:bg-white/30 transition-colors cursor-pointer h-16"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                        {event.title}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 max-w-md font-semibold">{event.description || "No description provided."}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap">
                      {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-550 max-w-[150px] truncate">
                      {event.address ? event.address.split(',')[0] : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 border text-[9px] font-bold rounded-full uppercase tracking-wider ${getStatusStyle(event.status)}`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right shrink-0" onClick={e => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button onClick={(e) => openEditModal(event, e)} className="p-2 hover:bg-white/50 rounded-xl text-slate-400 hover:text-blue-600 transition-colors"><Edit size={14} /></button>
                        {event.status !== 'CANCELLED' && event.status !== 'CONFIRMED' && (
                          <button onClick={(e) => handleCancelEvent(event, e)} className="p-2 hover:bg-white/50 rounded-xl text-slate-400 hover:text-red-500 transition-colors"><X size={14} /></button>
                        )}
                        <button onClick={(e) => handleDeleteEvent(event.id, e)} className="p-2 hover:bg-white/50 rounded-xl text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-white/20 backdrop-blur-sm">
                      <td colSpan={5} className="px-8 py-4">
                        <div className="space-y-4">
                          {/* Inner Sub-Tabs Navigation */}
                          <div className="flex items-center gap-1.5 border-b border-white/30 pb-2">
                            <button 
                              onClick={() => setSubTab(event.id, 'services')} 
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border ${
                                (eventSubTabs[event.id] || 'services') === 'services'
                                  ? 'bg-white/60 text-blue-700 border-white/60 shadow-[0_2px_10px_rgba(0,0,0,0.01)]'
                                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/30 border-transparent'
                              }`}
                            >
                              Hired Services ({bookings.length})
                            </button>
                            <button 
                              onClick={() => setSubTab(event.id, 'timeline')} 
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border ${
                                (eventSubTabs[event.id] || 'services') === 'timeline'
                                  ? 'bg-white/60 text-blue-700 border-white/60 shadow-[0_2px_10px_rgba(0,0,0,0.01)]'
                                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/30 border-transparent'
                              }`}
                            >
                              Project Timeline
                            </button>
                            <button 
                              onClick={() => setSubTab(event.id, 'tasks')} 
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border ${
                                (eventSubTabs[event.id] || 'services') === 'tasks'
                                  ? 'bg-white/60 text-blue-700 border-white/60 shadow-[0_2px_10px_rgba(0,0,0,0.01)]'
                                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/30 border-transparent'
                              }`}
                            >
                              Tasks & Checklist ({(eventTasks[event.id] || []).filter(t => t.isCompleted).length}/{(eventTasks[event.id] || []).length})
                            </button>
                          </div>

                          {/* Sub-Tab: Services */}
                          {(eventSubTabs[event.id] || 'services') === 'services' && (
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <h4 className="text-xs font-bold text-slate-750">Booked Services (Escrow Details)</h4>
                                <span className="text-[10px] text-slate-455 font-semibold">Event ID: #{event.id}</span>
                              </div>
                              {isBookingsLoading ? (
                                <div className="flex justify-center py-4"><Loader2 className="animate-spin text-blue-600" size={18} /></div>
                              ) : bookings.length === 0 ? (
                                <p className="text-xs text-slate-400 font-medium italic">No service providers hired for this event yet.</p>
                              ) : (
                                <div className="overflow-x-auto rounded-xl border border-white/50 bg-white/30">
                                  <table className="w-full text-left border-collapse text-xs font-semibold text-slate-650">
                                    <thead>
                                      <tr className="bg-white/20 border-b border-white/30 text-[9px] text-slate-450 uppercase tracking-wider h-9">
                                        <th className="px-4 py-2">Booking ID</th>
                                        <th className="px-4 py-2">Service Name</th>
                                        <th className="px-4 py-2">Status</th>
                                        <th className="px-4 py-2 text-right">Amount</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/20">
                                      {bookings.map(b => (
                                        <tr key={b.id} className="h-10 hover:bg-white/30 transition-colors">
                                          <td className="px-4 py-2 text-slate-400">#{b.id}</td>
                                          <td className="px-4 py-2 text-slate-800 font-bold">{b.services?.name || "Service Item"}</td>
                                          <td className="px-4 py-2">
                                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-700 border border-blue-500/20 rounded text-[9px] font-bold uppercase">{b.status}</span>
                                          </td>
                                          <td className="px-4 py-2 text-right font-extrabold text-slate-850">₹{b.bookingAmount}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Sub-Tab: Timeline */}
                          {(eventSubTabs[event.id] || 'services') === 'timeline' && (
                            <div className="space-y-3 py-2">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="text-xs font-bold text-slate-750">Project Timeline Milestones</h4>
                                <span className="text-[10px] text-slate-400 font-semibold">Live Progress Track</span>
                              </div>
                              <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 -translate-y-1/2 z-0 hidden md:block" />
                                
                                {getMilestones(event, bookings).map((milestone, idx) => {
                                  const isDone = milestone.status === 'COMPLETED';
                                  const isCurrent = milestone.status === 'IN_PROGRESS';
                                  return (
                                    <div key={idx} className="relative z-10 flex flex-row md:flex-col items-center gap-3 md:text-center flex-1">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold text-xs transition-all shrink-0 ${
                                        isDone ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20' :
                                        isCurrent ? 'bg-blue-500/10 border-blue-600 text-blue-600 ring-4 ring-blue-500/10 animate-pulse' :
                                        'bg-white/20 border-white/50 text-slate-400'
                                      }`}>
                                        {isDone ? <Check size={14} /> : (idx + 1)}
                                      </div>
                                      <div className="flex-1">
                                        <h5 className={`text-xs font-bold ${
                                          isDone ? 'text-emerald-700' :
                                          isCurrent ? 'text-blue-600' :
                                          'text-slate-500'
                                        }`}>
                                          {milestone.label}
                                        </h5>
                                        <p className="text-[10px] text-slate-450 font-semibold leading-relaxed mt-0.5 max-w-[150px] md:mx-auto">
                                          {milestone.desc}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Sub-Tab: Tasks */}
                          {(eventSubTabs[event.id] || 'services') === 'tasks' && (
                            <div className="space-y-4 py-2">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-3">
                                  <div className="flex justify-between items-center mb-1">
                                    <h4 className="text-xs font-bold text-slate-750">Tasks & Checklists</h4>
                                    <span className="text-[10px] text-slate-500 font-semibold">
                                      {(eventTasks[event.id] || []).filter(t => t.isCompleted).length} / {(eventTasks[event.id] || []).length} Completed
                                    </span>
                                  </div>
                                  
                                  {(eventTasks[event.id] || []).length === 0 ? (
                                    <p className="text-xs text-slate-400 italic py-6 text-center border border-dashed border-white/40 rounded-xl bg-white/10">No tasks in your checklist. Add one on the right panel!</p>
                                  ) : (
                                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                                      {(eventTasks[event.id] || []).map(t => (
                                        <div key={t.id} className={`flex items-start justify-between gap-3 p-3 border rounded-xl transition-all ${
                                          t.isCompleted 
                                            ? 'bg-white/10 border-white/20 opacity-60 shadow-[0_4px_15px_rgba(0,0,0,0.005)]' 
                                            : 'bg-white/40 border-white/60 shadow-[0_4px_15px_rgba(0,0,0,0.01)] hover:bg-white/50'
                                        }`}>
                                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                            <input 
                                              type="checkbox" 
                                              checked={t.isCompleted} 
                                              onChange={() => handleToggleTask(event.id, t.id)}
                                              className="mt-0.5 w-4 h-4 text-blue-600 border-white/40 rounded focus:ring-blue-500 cursor-pointer bg-white/30"
                                            />
                                            <div className="flex-1 min-w-0">
                                              <h5 className={`text-xs font-bold text-slate-800 leading-snug ${t.isCompleted ? 'line-through text-slate-400' : ''}`}>{t.taskName}</h5>
                                              {t.taskDescription && <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-relaxed">{t.taskDescription}</p>}
                                              <div className="flex items-center gap-3 mt-1.5 text-[9px] text-slate-450 font-semibold">
                                                <span className="flex items-center gap-1"><CalendarDays size={10} /> Due: {t.dueDate}</span>
                                                {t.isCustom && <span className="bg-blue-500/10 text-blue-700 px-1 py-0.2 rounded border border-blue-500/25 font-bold">Custom</span>}
                                              </div>
                                            </div>
                                          </div>
                                          
                                          <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 border rounded text-[8px] font-black tracking-wider uppercase shrink-0 ${
                                              t.priority === 'HIGH' ? 'bg-red-500/10 text-red-700 border-red-550/20' :
                                              t.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-700 border-amber-550/20' :
                                              'bg-white/30 text-slate-650 border-white/50'
                                            }`}>
                                              {t.priority}
                                            </span>
                                            {t.isCustom && (
                                              <button onClick={() => handleDeleteTask(event.id, t.id)} className="p-1 hover:bg-red-500/15 rounded-lg text-slate-450 hover:text-red-650 transition-colors" title="Delete Task"><Trash2 size={13} /></button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="lg:col-span-1 bg-white/30 border border-white/50 rounded-2xl p-4 self-start shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
                                  <h4 className="text-xs font-bold text-slate-755 mb-3 flex items-center gap-1.5"><Plus size={14} className="text-blue-500" /> Create Task</h4>
                                  <form onSubmit={(e) => handleAddCustomTask(event.id, e)} className="space-y-3">
                                    <div>
                                      <label className="text-[9px] font-black text-slate-500 block uppercase mb-1">Task Title *</label>
                                      <input required name="taskName" type="text" placeholder="e.g. Schedule rehearsal call" className="w-full px-3 py-2 h-9 border border-white/40 rounded-lg text-xs font-semibold outline-none focus:border-blue-500 bg-white/40 backdrop-blur-sm focus:bg-white/60 text-slate-800 transition-all placeholder:text-slate-400" />
                                    </div>
                                    <div>
                                      <label className="text-[9px] font-black text-slate-500 block uppercase mb-1">Description</label>
                                      <textarea name="taskDescription" rows={2} placeholder="Optional details..." className="w-full px-3 py-2 border border-white/40 rounded-lg text-xs font-semibold outline-none focus:border-blue-500 bg-white/40 backdrop-blur-sm focus:bg-white/60 text-slate-800 transition-all resize-none placeholder:text-slate-400" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="text-[9px] font-black text-slate-500 block uppercase mb-1">Due Date</label>
                                        <input name="dueDate" type="date" className="w-full px-3 py-1.5 h-9 border border-white/40 rounded-lg text-xs font-semibold outline-none focus:border-blue-500 bg-white/40 backdrop-blur-sm focus:bg-white/60 text-slate-800 transition-all" />
                                      </div>
                                      <div>
                                        <label className="text-[9px] font-black text-slate-500 block uppercase mb-1">Priority</label>
                                        <select name="priority" className="w-full px-3 py-1.5 h-9 border border-white/40 rounded-lg text-xs font-semibold outline-none focus:border-blue-500 bg-white/40 backdrop-blur-sm focus:bg-white/60 text-slate-800 transition-all">
                                          <option value="LOW">Low</option>
                                          <option value="MEDIUM" selected>Medium</option>
                                          <option value="HIGH">High</option>
                                        </select>
                                      </div>
                                    </div>
                                    <button type="submit" className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 text-white rounded-lg text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-blue-600/15">Add Task</button>
                                  </form>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })}
          </table>
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto custom-scrollbar bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              {modalMode === 'create' ? <Plus className="text-blue-600" /> : <Edit className="text-blue-600" />}
              {modalMode === 'create' ? 'Create Event Plan' : 'Edit Event Details'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4 mt-2">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Event Title *</label>
              <input 
                type="text" 
                required 
                value={formData.title} 
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-white/40 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-150 transition-all bg-white/35 backdrop-blur-sm focus:bg-white/50 text-slate-850 placeholder:text-slate-400"
                placeholder="E.g., Sarah's Silver Wedding Anniversary"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Description</label>
              <textarea 
                value={formData.description} 
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-white/40 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-150 resize-none transition-all bg-white/35 backdrop-blur-sm focus:bg-white/50 text-slate-855 placeholder:text-slate-450"
                placeholder="Brief summary of requirements, dress code, theme details..."
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Address / Venue Location</label>
              <input 
                type="text" 
                value={formData.address} 
                onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-4 py-3 border border-white/40 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-150 transition-all bg-white/35 backdrop-blur-sm focus:bg-white/50 text-slate-850 placeholder:text-slate-400"
                placeholder="E.g., JW Marriott Ballroom, Juhu, Mumbai"
              />
            </div>
            <button
              type="button"
              onClick={getCurrentLocation}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/30 hover:bg-white/50 border border-white/40 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              <MapPin size={14} className="text-blue-500" /> Use Current Geolocation GPS
            </button>
            <div ref={mapRef} className="w-full h-44 rounded-xl border border-white/50 overflow-hidden relative" style={{ minHeight: '160px' }} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Start Date & Time *</label>
                <input 
                  type="datetime-local" 
                  required
                  value={formData.startDate}
                  onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-4 py-3 border border-white/40 rounded-xl text-xs font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-150 transition-all bg-white/35 backdrop-blur-sm focus:bg-white/50 text-slate-800"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">End Date & Time *</label>
                <input 
                  type="datetime-local" 
                  required
                  value={formData.endDate}
                  onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-4 py-3 border border-white/40 rounded-xl text-xs font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-150 transition-all bg-white/35 backdrop-blur-sm focus:bg-white/50 text-slate-800"
                />
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-2.5">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-white/50 bg-white/30 hover:bg-white/50 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-all">Cancel</button>
              <button type="submit" disabled={formSaving} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/15 flex items-center gap-1 disabled:opacity-70 hover:scale-[1.01] active:scale-[0.99] transition-all">
                {formSaving ? <Loader2 size={14} className="animate-spin" /> : null} Save Details
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* 3. Bookings Tab */
function BookingsTab({ customerProfile, user, isDemoMode }) {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  // Modals status
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // Dispute forms
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeType, setDisputeType] = useState('PAYMENT_ISSUE');
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);

  // Review forms
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  // Complaint forms
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [complaintLoading, setComplaintLoading] = useState(false);

  const fetchBookingsAndDisputes = async () => {
    /*
    if (isDemoMode) {
      setBookings([
        {
          id: 501,
          status: "CONFIRMED",
          startDt: "2026-11-12T18:00:00",
          endDt: "2026-11-12T23:59:00",
          bookingAmount: 25000,
          bookedAt: "2026-06-15T12:00:00",
          services: {
            id: 301,
            category: "MUSIC",
            name: "Shine & Sound DJs",
            location: "Mumbai",
            photos: ["https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=200&auto=format&fit=crop"]
          }
        },
        {
          id: 502,
          status: "PENDING",
          startDt: "2026-08-20T09:00:00",
          endDt: "2026-08-20T18:00:00",
          bookingAmount: 95000,
          bookedAt: "2026-06-20T10:30:00",
          services: {
            id: 302,
            category: "CATERING",
            name: "Gourmet Catering Services",
            location: "Pune",
            photos: ["https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=200&auto=format&fit=crop"]
          }
        },
        {
          id: 503,
          status: "COMPLETED",
          startDt: "2026-05-10T10:00:00",
          endDt: "2026-05-10T16:00:00",
          bookingAmount: 18000,
          bookedAt: "2026-04-12T14:00:00",
          services: {
            id: 303,
            category: "PHOTOGRAPHY",
            name: "Vivid Memory Studio",
            location: "Mumbai",
            photos: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=200&auto=format&fit=crop"]
          }
        }
      ]);
      setDisputes([
        {
          id: 701,
          bookingId: 503,
          status: "RESOLVED",
          reason: "Photographer arrived 2 hours late and missed the opening speeches.",
          resolutionNote: "Refund of ₹5,000 processed to customer wallet. Warning issued to vendor.",
          raisedByUserId: 1,
          createdAt: "2026-05-11T09:00:00"
        }
      ]);
      setLoading(false);
      return;
    }
    */
    if (!customerProfile?.id) return;
    try {
      setLoading(true);
      const [bookingsRes, disputesRes] = await Promise.all([
        apiClient.get(`/api/customer/bookings/${customerProfile.id}?page=0&size=100`),
        apiClient.get('/api/disputes/my')
      ]);

      setBookings(bookingsRes.data?.data?.content || bookingsRes.data?.content || []);

      let dataList = [];
      const dr = disputesRes.data;
      if (dr?.data && Array.isArray(dr.data)) dataList = dr.data;
      else if (dr?.data?.content && Array.isArray(dr.data.content)) dataList = dr.data.content;
      else if (dr?.content && Array.isArray(dr.content)) dataList = dr.content;
      else if (Array.isArray(dr)) dataList = dr;
      setDisputes(dataList);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load bookings database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingsAndDisputes();
  }, [customerProfile]);

  const handleCancelBooking = async (bookingId, currentStatus) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    if (isDemoMode) {
      setCancelLoading(true);
      setTimeout(() => {
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'CANCELLED' } : b));
        toast.success("Booking cancelled (Demo Mode)");
        setShowDetailModal(false);
        setCancelLoading(false);
      }, 500);
      return;
    }
    const isPending = currentStatus === 'PENDING';
    const endpoint = isPending 
      ? `/api/bookings/${bookingId}/cancel/before`
      : `/api/bookings/${bookingId}/cancel/after`;

    try {
      setCancelLoading(true);
      const res = await apiClient.post(endpoint);
      toast.success("Booking cancelled successfully.");
      const updated = res.data?.data || res.data;
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: updated.status } : b));
      setShowDetailModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel booking request");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleStartChat = async (serviceId) => {
    if (!serviceId) return;
    if (isDemoMode) {
      toast.success("Opening chat channel (Demo Mode simulation)...");
      return;
    }
    try {
      setChatLoading(true);
      const res = await apiClient.post('/api/chat/conversations', { serviceId });
      const conversation = res.data?.data || res.data;
      navigate(`/chats?id=${conversation.id}`);
      toast.success("Opening chat channel...");
    } catch (err) {
      toast.error("Failed to start chat session with provider");
    } finally {
      setChatLoading(false);
    }
  };

  const handleRaiseDispute = async (e) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;
    if (isDemoMode) {
      setDisputeLoading(true);
      setTimeout(() => {
        const newDispute = {
          id: Math.floor(Math.random() * 1000) + 800,
          bookingId: selectedBooking.id,
          type: disputeType,
          reason: disputeReason,
          status: 'OPEN',
          raisedByUserId: 1,
          createdAt: new Date().toISOString()
        };
        setDisputes(prev => [newDispute, ...prev]);
        toast.success("Dispute raised successfully (Demo Mode)!");
        setShowDisputeModal(false);
        setDisputeReason('');
        setDisputeLoading(false);
      }, 500);
      return;
    }
    try {
      setDisputeLoading(true);
      await apiClient.post('/api/disputes', {
        bookingId: selectedBooking.id,
        type: disputeType,
        reason: disputeReason
      });
      toast.success("Dispute raised successfully. Our admins will investigate.");
      setShowDisputeModal(false);
      setDisputeReason('');
      fetchBookingsAndDisputes();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to file dispute case");
    } finally {
      setDisputeLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    if (isDemoMode) {
      setReviewLoading(true);
      setTimeout(() => {
        toast.success("Review submitted successfully (Demo Mode)!");
        setShowReviewModal(false);
        setReviewText('');
        setReviewRating(5);
        setReviewLoading(false);
      }, 500);
      return;
    }
    try {
      setReviewLoading(true);
      await apiClient.post('/api/reviews', {
        bookingId: selectedBooking.id,
        rating: reviewRating,
        reviewText: reviewText
      });
      toast.success("Review submitted! Thank you.");
      setShowReviewModal(false);
      setReviewText('');
      setReviewRating(5);
      fetchBookingsAndDisputes();
    } catch (err) {
      toast.error("Failed to submit service feedback review");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!complaintText.trim()) return;
    if (isDemoMode) {
      setComplaintLoading(true);
      setTimeout(() => {
        toast.success("Complaint filed successfully (Demo Mode)!");
        setShowComplaintModal(false);
        setComplaintText('');
        setComplaintLoading(false);
      }, 500);
      return;
    }
    try {
      setComplaintLoading(true);
      await apiClient.post('/api/complaints', {
        bookingId: selectedBooking.id,
        raisedByUserId: user.id,
        againstUserId: 0,
        blame: "PENDING_RESOLUTION",
        description: complaintText
      });
      toast.success("Complaint filed successfully. Admin audit started.");
      setShowComplaintModal(false);
      setComplaintText('');
    } catch (err) {
      toast.error("Failed to lodge complaint report");
    } finally {
      setComplaintLoading(false);
    }
  };

  const filteredBookings = bookings.filter(b => filter === 'ALL' || b.status === filter);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-700 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      case 'REJECTED': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'PENDING': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Service Bookings</h1>
          <p className="text-xs text-gray-500 font-semibold">Monitor progress, communicate, review, or resolve disputes for hired services.</p>
        </div>

        {/* Notion Style Filter pills */}
        <div className="flex flex-wrap gap-1.5 bg-gray-150/80 p-1 rounded-xl border border-gray-200/50 backdrop-blur-md">
          {['ALL', 'PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED'].map(s => (
            <button 
              key={s} 
              onClick={() => setFilter(s)} 
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all hover:scale-[1.02] active:scale-[0.98] ${filter === s ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-44 bg-gray-50 border border-gray-150 rounded-3xl" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-gray-50/50 border border-gray-100 rounded-3xl">
          <FileText className="text-gray-300 mx-auto mb-3" size={40} />
          <h3 className="text-base font-bold text-gray-800">No bookings matching filter</h3>
          <p className="text-xs text-gray-500 mt-1">Browse vendor services inside Planit to book events catering, audio systems, or venues.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-gray-150 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b text-[10px] text-gray-500 uppercase tracking-wider font-bold h-12">
                <th className="px-6 py-3">Booking ID</th>
                <th className="px-6 py-3">Service Hired</th>
                <th className="px-6 py-3">Dates</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Cost</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-650">
              {filteredBookings.map(b => (
                <tr key={b.id} className="hover:bg-gray-50/50 transition-colors h-16 border-b border-gray-100 last:border-0">
                  <td className="px-6 py-4 text-gray-450 font-bold">#{b.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-800">{b.services?.name || "Service Item"}</div>
                    <span className="text-[9px] px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-full font-bold uppercase mt-1 inline-block">{b.services?.category || "SERVICE"}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-450 whitespace-nowrap">
                    {new Date(b.startDt).toLocaleDateString()} - {new Date(b.endDt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-gray-455 max-w-[120px] truncate">
                    {b.services?.location || 'N/A'}
                  </td>
                  <td className="px-6 py-4 font-extrabold text-gray-900 whitespace-nowrap">
                    ₹{b.bookingAmount}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 border text-[9px] font-bold rounded-full uppercase tracking-wider ${getStatusStyle(b.status)}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button 
                        onClick={() => { setSelectedBooking(b); setShowDetailModal(true); }}
                        className="p-2 bg-gray-50 border hover:bg-gray-100 text-gray-600 rounded-xl transition-all hover:scale-[1.05] active:scale-[0.95]" 
                        title="View Details"
                      >
                        <Clock size={14} />
                      </button>
                      <button 
                        onClick={() => handleStartChat(b.services?.id)} 
                        disabled={chatLoading}
                        className="p-2 bg-blue-50 border border-blue-100 hover:bg-blue-100 text-blue-600 rounded-xl transition-all hover:scale-[1.05] active:scale-[0.95]" 
                        title="Chat Vendor"
                      >
                        <MessageSquare size={14} />
                      </button>
                      {b.status === 'COMPLETED' && (
                        <button onClick={() => { setSelectedBooking(b); setShowReviewModal(true); }} className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-100 text-amber-700 text-[10px] font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]">Review</button>
                      )}
                      {(b.status === 'CONFIRMED' || b.status === 'COMPLETED') && (
                        <button onClick={() => { setSelectedBooking(b); setShowComplaintModal(true); }} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-650 text-[10px] font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]">Complain</button>
                      )}
                      {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                        <button onClick={() => handleCancelBooking(b.id, b.status)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-100 text-red-655 text-[10px] font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]">Cancel</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Booking Details Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border border-gray-200">
          <DialogHeader><DialogTitle className="text-lg font-bold text-gray-900">Booking Summary</DialogTitle></DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 mt-2">
              <div className="bg-gray-50 p-4 border rounded-2xl flex gap-3 items-center">
                <div className="w-12 h-12 bg-blue-50 border rounded-xl flex items-center justify-center font-bold text-xs text-blue-400 shrink-0 overflow-hidden">
                  {selectedBooking.services?.photos?.length > 0 ? (
                    <img src={selectedBooking.services.photos[0]} alt="Pic" className="w-full h-full object-cover" />
                  ) : "Photo"}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-xs">{selectedBooking.services?.name}</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">{selectedBooking.services?.category}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-gray-500">
                <div className="bg-gray-50/50 p-2.5 rounded-xl border">
                  <span className="text-[9px] text-gray-400 block uppercase">Booking ID</span>
                  <span className="font-bold text-gray-800"># {selectedBooking.id}</span>
                </div>
                <div className="bg-gray-50/50 p-2.5 rounded-xl border">
                  <span className="text-[9px] text-gray-400 block uppercase">Status</span>
                  <span className="font-bold text-gray-805 uppercase">{selectedBooking.status}</span>
                </div>
                <div className="bg-gray-50/50 p-2.5 rounded-xl border col-span-2">
                  <span className="text-[9px] text-gray-400 block uppercase">Date Range</span>
                  <span className="font-bold text-gray-800 block leading-tight">{new Date(selectedBooking.startDt).toLocaleString()} - {new Date(selectedBooking.endDt).toLocaleString()}</span>
                </div>
                <div className="bg-gray-50/50 p-2.5 rounded-xl border">
                  <span className="text-[9px] text-gray-400 block uppercase">Amount</span>
                  <span className="font-extrabold text-gray-800 flex items-center">₹{selectedBooking.bookingAmount}</span>
                </div>
                <div className="bg-gray-50/50 p-2.5 rounded-xl border">
                  <span className="text-[9px] text-gray-400 block uppercase">Booked At</span>
                  <span className="font-bold text-gray-800 block">{new Date(selectedBooking.bookedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {selectedBooking.cancellationReason && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-2xl border border-red-100">
                  <span className="text-[9px] font-bold block uppercase mb-1">Cancellation Reason</span>
                  {selectedBooking.cancellationReason}
                </div>
              )}

              {(() => {
                const bookingDispute = disputes.find(d => d.bookingId === selectedBooking.id);
                if (bookingDispute) {
                  return (
                    <div className="bg-rose-50 text-rose-850 text-xs p-3 rounded-2xl border border-rose-100 animate-pulse">
                      <span className="text-[9px] font-bold block uppercase mb-1">Dispute Filed ({bookingDispute.status})</span>
                      <p className="font-semibold text-gray-700">Reason: {bookingDispute.reason}</p>
                      {bookingDispute.resolutionNote && <p className="mt-1 pt-1 border-t border-rose-200">Resolution: {bookingDispute.resolutionNote}</p>}
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex gap-2.5 pt-4">
                <button onClick={() => handleStartChat(selectedBooking.services?.id)} className="flex-1 py-3 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-100 transition-all hover:scale-[1.02] active:scale-[0.98]"><MessageSquare size={14} /> Chat Vendor</button>
                {(() => {
                  const bookingDispute = disputes.find(d => d.bookingId === selectedBooking.id);
                  if (bookingDispute) return null;
                  if (selectedBooking.status === 'CONFIRMED' || selectedBooking.status === 'COMPLETED') {
                    return (
                      <button onClick={() => { setShowDetailModal(false); setShowDisputeModal(true); }} className="flex-1 py-3 bg-red-50 border border-red-100 text-red-650 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-red-100 transition-all hover:scale-[1.02] active:scale-[0.98]"><Scale size={14} /> Dispute</button>
                    );
                  }
                  if (selectedBooking.status === 'PENDING') {
                    return (
                      <button onClick={() => handleCancelBooking(selectedBooking.id, selectedBooking.status)} disabled={cancelLoading} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-all">Cancel Request</button>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Raise Dispute Modal */}
      <Dialog open={showDisputeModal} onOpenChange={setShowDisputeModal}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border border-gray-200">
          <DialogHeader><DialogTitle className="text-lg font-bold text-gray-900">File Dispute Case</DialogTitle></DialogHeader>
          <form onSubmit={handleRaiseDispute} className="space-y-4 mt-2">
            <div>
              <label className="text-[10px] font-bold text-gray-400 block uppercase mb-1">Issue Category *</label>
              <select value={disputeType} onChange={e => setDisputeType(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-150 transition-all">
                <option value="PAYMENT_ISSUE">Payment Issue</option>
                <option value="SERVICE_NOT_DELIVERED">Service Not Delivered</option>
                <option value="QUALITY_ISSUE">Quality Issue</option>
                <option value="CANCELLATION_DISPUTE">Cancellation Dispute</option>
                <option value="VENDOR_NO_SHOW">Vendor No Show</option>
                <option value="OTHER">Other / Miscellaneous</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 block uppercase mb-1">Reason Description *</label>
              <textarea required value={disputeReason} onChange={e => setDisputeReason(e.target.value)} rows={4} maxLength={1000} placeholder="Describe the dispute details and resolution expected..." className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-150 resize-none transition-all" />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setShowDisputeModal(false)} className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-650 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={disputeLoading} className="px-6 py-2.5 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1 hover:scale-[1.02] active:scale-[0.98] transition-all">
                {disputeLoading ? <Loader2 size={12} className="animate-spin" /> : null} File Dispute
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border border-gray-200">
          <DialogHeader><DialogTitle className="text-lg font-bold text-gray-900">Review Hired Service</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitReview} className="space-y-4 mt-2">
            <div className="text-center space-y-2">
              <label className="text-xs font-bold text-gray-700 block">Star Rating *</label>
              <div className="flex justify-center items-center gap-1.5">
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star} 
                    type="button" 
                    onClick={() => setReviewRating(star)} 
                    onMouseEnter={() => setReviewHoverRating(star)} 
                    onMouseLeave={() => setReviewHoverRating(0)}
                    className="text-gray-300 transition-transform active:scale-90"
                  >
                    <Star size={30} fill={star <= (reviewHoverRating || reviewRating) ? "#F59E0B" : "transparent"} className={star <= (reviewHoverRating || reviewRating) ? "text-amber-500" : "text-gray-300"} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 block uppercase mb-1">Feedback Comments *</label>
              <textarea required value={reviewText} onChange={e => setReviewText(e.target.value)} rows={4} maxLength={1000} placeholder="Write details about what went well or poorly..." className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-150 resize-none transition-all" />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setShowReviewModal(false)} className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-650 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={reviewLoading} className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all">Submit Review</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Complaint Modal */}
      <Dialog open={showComplaintModal} onOpenChange={setShowComplaintModal}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border border-gray-200">
          <DialogHeader><DialogTitle className="text-lg font-bold text-gray-900">Lodge Official Complaint</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitComplaint} className="space-y-4 mt-2">
            <div>
              <label className="text-[10px] font-bold text-gray-400 block uppercase mb-1">Complaint Description *</label>
              <textarea required value={complaintText} onChange={e => setComplaintText(e.target.value)} rows={4} placeholder="Describe the breach of contract, vendor absence, or quality issues in detail..." className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-150 resize-none transition-all" />
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button type="button" onClick={() => setShowComplaintModal(false)} className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-650 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={complaintLoading} className="px-6 py-2.5 bg-red-655 hover:bg-red-700 text-white rounded-xl text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all">Lodge Complaint</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* 4. Disputes Tab */
function DisputesTab({ user, isDemoMode }) {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [fetchingBooking, setFetchingBooking] = useState(false);

  const fetchDisputes = async () => {
    if (isDemoMode) {
      setDisputes([
        {
          id: 701,
          bookingId: 503,
          status: "RESOLVED",
          reason: "Photographer arrived 2 hours late and missed the opening speeches.",
          resolutionNote: "Refund of ₹5,000 processed to customer wallet. Warning issued to vendor.",
          raisedByUserId: 1,
          createdAt: "2026-05-11T09:00:00"
        },
        {
          id: 702,
          bookingId: 504,
          status: "OPEN",
          reason: "Caterer provided different menu options than contracted.",
          raisedByUserId: 1,
          createdAt: "2026-06-22T14:30:00"
        }
      ]);
      setLoading(false);
      return;
    }
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await apiClient.get('/api/disputes/my');
      let dataList = [];
      const dr = res.data;
      if (dr?.data && Array.isArray(dr.data)) dataList = dr.data;
      else if (dr?.data?.content && Array.isArray(dr.data.content)) dataList = dr.data.content;
      else if (dr?.content && Array.isArray(dr.content)) dataList = dr.content;
      else if (Array.isArray(dr)) dataList = dr;
      setDisputes(dataList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [user]);

  const handleViewBooking = async (bookingId) => {
    if (isDemoMode) {
      setFetchingBooking(true);
      setTimeout(() => {
        setSelectedBooking({
          id: bookingId,
          bookingAmount: 18000,
          status: "COMPLETED",
          startDt: "2026-05-10T10:00:00",
          endDt: "2026-05-10T16:00:00",
          services: {
            name: "Vivid Memory Studio",
            category: "PHOTOGRAPHY"
          }
        });
        setShowDetailModal(true);
        setFetchingBooking(false);
      }, 300);
      return;
    }
    try {
      setFetchingBooking(true);
      const res = await apiClient.get(`/api/bookings/${bookingId}`);
      setSelectedBooking(res.data?.data || res.data);
      setShowDetailModal(true);
    } catch (err) {
      toast.error("Failed to load booking information");
    } finally {
      setFetchingBooking(false);
    }
  };

  const handleStartChat = async (serviceId) => {
    if (!serviceId) return;
    if (isDemoMode) {
      toast.success("Establishing chat session (Demo Mode)...");
      return;
    }
    try {
      toast.loading("Starting chat conversation...");
      const res = await apiClient.post('/api/chat/conversations', { serviceId });
      const conversation = res.data?.data || res.data;
      navigate(`/chats?id=${conversation.id}`);
    } catch (err) {
      toast.error("Failed to establish chat session");
    }
  };

  const filteredDisputes = disputes.filter(d => filter === 'ALL' || d.status === filter);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'OPEN': return 'bg-red-100 text-red-700 border-red-200';
      case 'IN_REVIEW': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'RESOLVED': return 'bg-green-100 text-green-700 border-green-200';
      case 'CLOSED': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Disputes Center</h1>
          <p className="text-xs text-gray-500 font-semibold">Track and monitor moderations for escrow transactions and service quality issues.</p>
        </div>
        <div className="flex gap-1.5 bg-gray-150/80 p-1 border rounded-xl">
          {['ALL', 'OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all hover:scale-[1.02] active:scale-[0.98] ${filter === s ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-28 bg-gray-50 border rounded-2xl" />
        </div>
      ) : filteredDisputes.length === 0 ? (
        <div className="text-center py-16 bg-gray-50/50 border border-gray-100 rounded-3xl">
          <Scale className="text-gray-300 mx-auto mb-3" size={40} />
          <h3 className="text-base font-bold text-gray-800">No disputes found</h3>
          <p className="text-xs text-gray-500 mt-1">If there are quality discrepancies, raise a dispute case directly from your Bookings list.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDisputes.map(dispute => {
            const isRaisedByMe = String(dispute.raisedByUserId) === String(user?.id);
            return (
              <div key={dispute.id} className="bg-white border border-gray-205 rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.02)] transition-all hover:scale-[1.005] duration-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-100 mb-4">
                  <div>
                    <h3 className="font-extrabold text-gray-800 text-sm">Dispute Case #{dispute.id}</h3>
                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Raised: {dispute.createdAt ? new Date(dispute.createdAt).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-0.5 border text-[9px] font-bold rounded uppercase ${isRaisedByMe ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                      {isRaisedByMe ? 'Raised by Me' : 'Raised Against Me'}
                    </span>
                    <span className={`px-2 py-0.5 border text-[9px] font-bold rounded uppercase ${getStatusStyle(dispute.status)}`}>
                      {dispute.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1 bg-gray-50/50 p-4 border rounded-xl flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold block uppercase">Associated Hires</span>
                      <p className="text-xs font-bold text-gray-850 mt-1">Booking #{dispute.bookingId}</p>
                    </div>
                    <button onClick={() => handleViewBooking(dispute.bookingId)} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors mt-4 text-left">View Booking Details →</button>
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold block uppercase">Dispute Reason</span>
                      <p className="text-xs font-semibold text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100 mt-1">"{dispute.reason}"</p>
                    </div>
                    {dispute.resolutionNote && (
                      <div className="p-3 bg-green-50/50 border border-green-100 text-xs rounded-xl">
                        <span className="text-[9px] font-bold text-green-700 uppercase tracking-wide block">Resolution Summary</span>
                        <p className="font-semibold text-slate-700 mt-1">{dispute.resolutionNote}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Details Modal inside disputes */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border border-gray-200">
          <DialogHeader><DialogTitle className="text-lg font-bold text-gray-900">Booking Details</DialogTitle></DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 mt-2">
              <div className="bg-gray-50 p-4 border rounded-2xl flex gap-3 items-center">
                <div className="w-12 h-12 bg-blue-50 border rounded-xl flex items-center justify-center font-bold text-blue-400 shrink-0 overflow-hidden">
                  {selectedBooking.services?.photos?.length > 0 ? (
                    <img src={selectedBooking.services.photos[0]} alt="Pic" className="w-full h-full object-cover" />
                  ) : "Photo"}
                </div>
                <div>
                  <h4 className="font-bold text-gray-850 text-xs">{selectedBooking.services?.name}</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">{selectedBooking.services?.category}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-gray-500">
                <div className="bg-gray-50 p-2 rounded-lg border">
                  <span className="text-[9px] text-gray-400 block uppercase">Amount</span>
                  <span className="font-bold text-gray-800">₹{selectedBooking.bookingAmount}</span>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg border">
                  <span className="text-[9px] text-gray-400 block uppercase">Status</span>
                  <span className="font-bold text-gray-800 uppercase">{selectedBooking.status}</span>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <button onClick={() => handleStartChat(selectedBooking.services?.id)} className="flex-1 py-3 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-100 hover:scale-[1.02] active:scale-[0.98] transition-all"><MessageSquare size={14} /> Chat Vendor</button>
                <button type="button" onClick={() => setShowDetailModal(false)} className="flex-1 py-3 border rounded-xl text-xs font-bold text-gray-650 hover:bg-gray-50">Close</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* 5. Wallet Tab */
function WalletTab({ user, isDemoMode }) {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFormTab, setActiveFormTab] = useState('deposit');

  const fetchWallet = async () => {
    /*
    if (isDemoMode) {
      setWallet({ balance: 15450 });
      setLoading(false);
      return;
    }
    */
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await apiClient.get("/api/wallet");
      setWallet(res.data?.data || res.data || null);
    } catch (err) {
      if (err.response?.status !== 454 && err.response?.status !== 404) {
        toast.error("Failed to load wallet data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [user]);

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Planit Wallet</h1>
        <p className="text-xs text-slate-500 font-semibold">Store and deposit funds for instant, secure escrow bookings.</p>
      </div>

      {loading ? (
        <div className="h-44 bg-white/40 border border-white/60 backdrop-blur-md rounded-3xl animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Balance & Tabs */}
          <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.015)] relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Current Balance
                </span>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-green-500/10 text-green-700 border border-green-500/20 rounded-full text-[9px] font-black uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Active
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline text-slate-900">
                  <span className="text-4xl font-black tracking-tight">
                    ₹{wallet?.balance ? wallet.balance.toLocaleString('en-IN') : '0.00'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-450 font-bold mt-1">
                  Available for immediate hiring escrows
                </p>
              </div>
            </div>

            <div className="border-t pt-4 border-white/30">
              <div className="flex bg-white/20 p-1 rounded-xl mb-4 border border-white/20">
                <button onClick={() => setActiveFormTab('deposit')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeFormTab === 'deposit' ? 'bg-white/80 backdrop-blur-md text-blue-600 shadow-sm border border-white/30' : 'text-slate-500 hover:text-slate-800'}`}>Deposit</button>
                <button onClick={() => setActiveFormTab('withdraw')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeFormTab === 'withdraw' ? 'bg-white/80 backdrop-blur-md text-blue-600 shadow-sm border border-white/30' : 'text-slate-500 hover:text-slate-800'}`}>Withdraw</button>
              </div>

              {isDemoMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block uppercase mb-1">Amount (₹) *</label>
                    <input 
                      type="number" 
                      placeholder="Enter amount" 
                      id="demo-wallet-amount"
                      className="w-full px-4 py-3 border border-white/40 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-150 transition-all bg-white/30 backdrop-blur-sm focus:bg-white/50 text-slate-800 placeholder:text-slate-400" 
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('demo-wallet-amount');
                      const amount = parseFloat(input?.value);
                      if (!amount || amount <= 0) {
                        toast.error("Please enter a valid amount");
                        return;
                      }
                      if (activeFormTab === 'deposit') {
                        setWallet(prev => ({ balance: (prev?.balance || 0) + amount }));
                        toast.success(`Demo deposit of ₹${amount} successful!`);
                      } else {
                        if (amount > (wallet?.balance || 0)) {
                          toast.error("Insufficient balance");
                          return;
                        }
                        setWallet(prev => ({ balance: (prev?.balance || 0) - amount }));
                        toast.success(`Demo withdrawal of ₹${amount} successful!`);
                      }
                      if (input) input.value = '';
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {activeFormTab === 'deposit' ? 'Deposit Funds (Demo)' : 'Withdraw Funds (Demo)'}
                  </button>
                </div>
              ) : activeFormTab === 'deposit' ? (
                <WalletDeposit onSuccess={fetchWallet} />
              ) : (
                <WalletWithdraw onSuccess={fetchWallet} maxAmount={wallet?.balance || 0} />
              )}
            </div>
          </div>

          {/* Right: Escrow benefits details */}
          <div className="space-y-4">
            <div className="bg-blue-500/10 backdrop-blur-md border border-blue-500/20 rounded-3xl p-6 shadow-[0_8px_30px_rgba(59,130,246,0.02)] text-slate-800">
              <h3 className="font-bold text-base mb-1.5 flex items-center gap-1.5 text-blue-700"><ShieldAlert size={18} /> Razorpay Escrow Protection</h3>
              <p className="text-xs text-blue-900/80 leading-relaxed font-semibold">
                Depositing funds triggers Razorpay checkout portal safely. 
                All transaction states are encrypted, audited, and strictly held until the date of event completion to support dispute resolution smoothly.
              </p>
            </div>

            <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 text-xs text-slate-550 leading-relaxed shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
              <h4 className="font-bold text-slate-700 mb-2">Refund Policy</h4>
              If a vendor declines your hire request, or you cancel bookings within pre-cancellation policy terms, your funds return to this balance instantly. 
              Withdrawals can be transferred back to your UPI handle / Bank card within 24-48 business hours.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   VENDOR WORKSPACE TABS
   ============================================================================ */

/* 1. Vendor Overview Tab */
function VendorOverviewTab({ customerProfile, setTab, isDemoMode }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ services: 0, bookings: 0, aura: 500, balance: 0 });
  const [vendor, setVendorProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [blockedDates, setBlockedDates] = useState([]);
  const [services, setServices] = useState([]);

  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [hoveredDay, setHoveredDay] = useState(null);

  // Clamp selectedDay if it exceeds the number of days in the new month
  useEffect(() => {
    const daysInNewMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    if (selectedDay > daysInNewMonth) {
      setSelectedDay(daysInNewMonth);
    }
  }, [currentMonth, currentYear, selectedDay]);

  useEffect(() => {
    if (isDemoMode) {
      setVendorProfile({
        id: 401,
        businessName: "Elite Wedding Decors",
        category: "DECORATION",
        ownerName: "Rajesh Kumar",
        aura: 680.5,
        verificationStatus: "VERIFIED"
      });
      setStats({
        services: 3,
        bookings: 3,
        aura: 680.5,
        balance: 83000
      });
      setServices([
        {
          id: 351,
          category: "DECORATION",
          name: "Fairytale Canopy Flower Setup",
          description: "Stunning pastel themed canopy decorations using seasonal orchids and premium drapes, ideal for wedding mandates or reception backdrops.",
          price: 65000,
          location: "Mumbai",
          verificationStatus: "VERIFIED"
        },
        {
          id: 352,
          category: "DECORATION",
          name: "Minimalist Boho Haldi Decor",
          description: "Beautiful marigold drapes, dreamcatchers, and wooden benches setup for haldi and mehendi rituals.",
          price: 18000,
          location: "Mumbai",
          verificationStatus: "VERIFIED"
        },
        {
          id: 353,
          category: "DECORATION",
          name: "Modern Glass Aisle & Chandeliers",
          description: "Luxurious glass platform walking aisle equipped with warm LED spotlighting and crystal hanging chandeliers.",
          price: 120000,
          location: "Pune",
          verificationStatus: "PENDING"
        }
      ]);
      
      const b1 = new Date();
      b1.setDate(b1.getDate() + 1);
      const b2 = new Date();
      b2.setDate(b2.getDate() + 3);
      const b3 = new Date();
      b3.setDate(b3.getDate() - 2);

      setBookings([
        {
          id: 601,
          status: "PENDING",
          startDt: b1.toISOString(),
          endDt: b1.toISOString(),
          bookingAmount: 65000,
          clientName: "Aarav Sharma",
          clientEmail: "aarav@gmail.com",
          clientPhone: "+91 98765 43210",
          customerId: 101,
          services: { category: "DECORATION", name: "Fairytale Canopy Flower Setup" }
        },
        {
          id: 602,
          status: "CONFIRMED",
          startDt: b2.toISOString(),
          endDt: b2.toISOString(),
          bookingAmount: 18000,
          clientName: "Neha Patel",
          clientEmail: "neha@outlook.com",
          clientPhone: "+91 91234 56789",
          customerId: 102,
          services: { category: "DECORATION", name: "Minimalist Boho Haldi Decor" }
        },
        {
          id: 603,
          status: "CONFIRMED",
          startDt: b3.toISOString(),
          endDt: b3.toISOString(),
          bookingAmount: 25000,
          clientName: "Rajesh K.",
          clientEmail: "rajesh@gmail.com",
          clientPhone: "+91 95432 10987",
          customerId: 103,
          services: { category: "DECORATION", name: "Floral Canopy backdrop" }
        }
      ]);
      setLoading(false);
      return;
    }

    if (!customerProfile?.id) return;
    const fetchVendorOverviewStats = async () => {
      try {
        setLoading(true);
        const vendorRes = await apiClient.get(`/api/vendor/customer/${customerProfile.id}`);
        const v = vendorRes.data?.data || vendorRes.data;
        setVendorProfile(v);

        if (v?.id) {
          const [servicesRes, bookingsRes, walletRes] = await Promise.all([
            apiClient.get(`/api/vendor/services/${v.id}?page=0&size=100`),
            apiClient.get(`/api/vendor/bookings/${v.id}?page=0&size=100`),
            apiClient.get('/api/wallet').catch(() => ({ data: { balance: 0 } }))
          ]);

          const sCount = servicesRes.data?.data?.content?.length || servicesRes.data?.content?.length || 0;
          const sList = servicesRes.data?.data?.content || servicesRes.data?.content || [];
          const bList = bookingsRes.data?.data?.content || bookingsRes.data?.content || [];
          const auraScore = v.aura !== undefined && v.aura !== null ? v.aura : 500.0;
          const balanceAmount = walletRes.data?.data?.balance || walletRes.data?.balance || 0;

          setStats({
            services: sCount,
            bookings: bList.length,
            aura: auraScore,
            balance: balanceAmount
          });
          setBookings(bList);
          setServices(sList);
        }
      } catch (err) {
        console.error("Error loading vendor stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVendorOverviewStats();
  }, [customerProfile, isDemoMode]);

  // Load blocked dates when vendor details are loaded
  useEffect(() => {
    if (vendor?.id) {
      const stored = localStorage.getItem(`planit_blocked_dates_${vendor.id}`);
      if (stored) {
        try {
          setBlockedDates(JSON.parse(stored));
        } catch (e) {
          console.error("Error parsing blocked dates:", e);
        }
      } else {
        setBlockedDates([]);
      }
    }
  }, [vendor?.id]);

  const toggleBlockDate = (dateStr) => {
    if (!vendor?.id) return;
    const isCurrentlyBlocked = blockedDates.includes(dateStr);
    const nextBlocked = isCurrentlyBlocked
      ? blockedDates.filter(d => d !== dateStr)
      : [...blockedDates, dateStr];
    setBlockedDates(nextBlocked);
    localStorage.setItem(`planit_blocked_dates_${vendor.id}`, JSON.stringify(nextBlocked));
    toast.success(isCurrentlyBlocked ? "Date unblocked successfully!" : "Date blocked off successfully!");
  };

  const handleUpdateServicePrice = async (serviceId, newPrice) => {
    const serviceToUpdate = services.find(s => s.id === serviceId);
    if (!serviceToUpdate) return;

    if (isDemoMode) {
      setServices(prev => prev.map(s => s.id === serviceId ? { ...s, price: parseFloat(newPrice) } : s));
      toast.success("Service price updated (Demo Mode)");
      return;
    }

    try {
      const payload = {
        vendorId: vendor.id,
        name: serviceToUpdate.name,
        description: serviceToUpdate.description,
        price: parseFloat(newPrice),
        category: serviceToUpdate.category,
        location: serviceToUpdate.location,
        isAvailable: serviceToUpdate.isAvailable ?? true,
        availableLocations: serviceToUpdate.availableLocations || [],
        photos: serviceToUpdate.photos || []
      };

      const res = await apiClient.put(`/api/services/${serviceId}`, payload);
      const updatedService = res.data?.data || res.data;
      
      setServices(prev => prev.map(s => s.id === serviceId ? { ...s, price: updatedService.price } : s));
      toast.success("Service price updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update service price");
    }
  };

  const handleUpdateStatus = async (bookingId, action) => {
    let confirmMsg = "";
    if (action === 'ACCEPT') { confirmMsg = "Accept this customer order?"; }
    else if (action === 'REJECT') { confirmMsg = "Reject this customer request?"; }
    else if (action === 'CANCEL') { confirmMsg = "Cancel booking and trigger immediate refund to customer?"; }

    if (!window.confirm(confirmMsg)) return;

    if (isDemoMode) {
      setActionLoading(true);
      setTimeout(() => {
        const nextStatus = action === 'ACCEPT' ? 'CONFIRMED' : action === 'REJECT' ? 'REJECTED' : 'CANCELLED';
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: nextStatus } : b));
        
        // Update stats
        const targetBk = bookings.find(b => b.id === bookingId);
        setStats(prev => ({
          ...prev,
          balance: action === 'ACCEPT' ? prev.balance + targetBk.bookingAmount : prev.balance
        }));
        
        toast.success(`Booking request marked ${action.toLowerCase()}ed (Demo Mode)`);
        setActionLoading(false);
      }, 500);
      return;
    }

    let endpoint = "";
    if (action === 'ACCEPT') { endpoint = `/api/bookings/${bookingId}/accept`; }
    else if (action === 'REJECT') { endpoint = `/api/bookings/${bookingId}/reject`; }
    else if (action === 'CANCEL') { endpoint = `/api/bookings/${bookingId}/cancel/vendor`; }

    try {
      setActionLoading(true);
      const res = await apiClient.post(endpoint);
      toast.success(`Booking request marked ${action.toLowerCase()}ed.`);
      const updated = res.data?.data || res.data;
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: updated.status } : b));
      
      const walletRes = await apiClient.get('/api/wallet').catch(() => ({ data: { balance: 0 } }));
      const balanceAmount = walletRes.data?.data?.balance || walletRes.data?.balance || 0;
      setStats(prev => ({ ...prev, balance: balanceAmount }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to alter booking status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartChat = async (customerId) => {
    if (!customerId) return;
    if (isDemoMode) {
      toast.success("Opening chat channel with client (Demo Mode)...");
      return;
    }
    try {
      const res = await apiClient.post('/api/chat/conversations', { customerId });
      const conversation = res.data?.data || res.data;
      navigate(`/chats?id=${conversation.id}`);
      toast.success("Opening chat channel...");
    } catch (err) {
      toast.error("Failed to initialize conversation");
    }
  };

  const getTrustBadge = (score) => {
    if (score >= 800) {
      return <span className="px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-amber-600 rounded-full text-[9px] font-black shadow-sm">RADIANT</span>;
    } else if (score >= 500) {
      return <span className="px-2.5 py-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 text-white border-cyan-500 rounded-full text-[9px] font-black shadow-sm">LUMINOUS</span>;
    }
    return <span className="px-2.5 py-0.5 bg-gray-150 text-gray-500 border border-gray-250 rounded-full text-[9px] font-bold">FAINT</span>;
  };

  // Mini Calendar Generation
  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (m, y) => new Date(y, m, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 0) {
        setCurrentYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 11) {
        setCurrentYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const handleDayClick = (dayObj) => {
    if (!dayObj) return;
    if (dayObj.month !== currentMonth || dayObj.year !== currentYear) {
      setCurrentMonth(dayObj.month);
      setCurrentYear(dayObj.year);
    }
    setSelectedDay(dayObj.day);
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Compute days matrix: prepend previous month's end, and append next month's start to fill 42 cells
  const daysArray = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDayIndex = getFirstDayOfMonth(currentMonth, currentYear);

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevDaysInMonth = getDaysInMonth(prevMonth, prevYear);

    const arr = [];
    
    // Add trailing days of previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      arr.push({
        day: prevDaysInMonth - i,
        isCurrentMonth: false,
        month: prevMonth,
        year: prevYear
      });
    }

    // Add current month days
    for (let i = 1; i <= daysInMonth; i++) {
      arr.push({
        day: i,
        isCurrentMonth: true,
        month: currentMonth,
        year: currentYear
      });
    }

    // Add leading days of next month to fill grid
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const remaining = 42 - arr.length;
    for (let i = 1; i <= remaining; i++) {
      arr.push({
        day: i,
        isCurrentMonth: false,
        month: nextMonth,
        year: nextYear
      });
    }

    return arr;
  }, [currentMonth, currentYear]);

  // Find bookings on a day
  const getDayBookings = (dayObj) => {
    if (!dayObj) return [];
    const dateStr = `${dayObj.year}-${String(dayObj.month + 1).padStart(2, '0')}-${String(dayObj.day).padStart(2, '0')}`;
    return bookings.filter(b => b.startDt && b.startDt.substring(0, 10) === dateStr);
  };

  const getDayDetails = (dayObj) => {
    if (!dayObj) return { hasBooking: false, status: null, list: [] };
    const dayBks = getDayBookings(dayObj);
    const hasBooking = dayBks.length > 0;
    const isConfirmed = dayBks.some(b => b.status === 'CONFIRMED' || b.status === 'RESOLVED' || b.status === 'COMPLETED');
    return {
      hasBooking,
      status: isConfirmed ? 'CONFIRMED' : 'PENDING',
      list: dayBks
    };
  };

  // Appointments on selected day
  const agendaItems = useMemo(() => {
    const selectedDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    return bookings.filter(b => b.startDt && b.startDt.substring(0, 10) === selectedDateStr).map(b => ({
      id: b.id,
      time: b.startDt ? new Date(b.startDt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "All day",
      client: b.clientName || "Client User",
      service: b.services?.name || "Service Item",
      amount: b.bookingAmount,
      status: b.status,
      customerId: b.customerId,
      raw: b
    }));
  }, [selectedDay, bookings, currentMonth, currentYear]);

  // Earnings Progression Chart calculations
  const chartWidth = 520;
  const chartHeight = 160;
  const chartPadding = 35;

  const chartData = useMemo(() => {
    const finishedBookings = bookings
      .filter(b => b.status === 'CONFIRMED' || b.status === 'RESOLVED' || b.status === 'COMPLETED')
      .sort((a, b) => new Date(a.startDt) - new Date(b.startDt));
      
    if (finishedBookings.length === 0) {
      return [
        { label: "Week 1", val: stats.balance * 0.25 },
        { label: "Week 2", val: stats.balance * 0.5 },
        { label: "Week 3", val: stats.balance * 0.75 },
        { label: "Week 4", val: stats.balance }
      ];
    }
    
    let runningSum = 0;
    return finishedBookings.map((b, index) => {
      runningSum += b.bookingAmount;
      const label = b.startDt ? new Date(b.startDt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : `Gig #${index+1}`;
      return {
        label,
        val: runningSum
      };
    });
  }, [bookings, stats.balance]);

  const maxVal = Math.max(...chartData.map(d => d.val), stats.balance, 10000);

  const pointsSpend = chartData.map((d, i) => {
    const x = chartPadding + (i * (chartWidth - 2 * chartPadding)) / (chartData.length - 1 || 1);
    const y = chartHeight - chartPadding - (d.val / maxVal) * (chartHeight - 2 * chartPadding);
    return { x, y, label: d.label, val: d.val };
  });

  const getCurvePath = (points) => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`;
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const pathSpend = getCurvePath(pointsSpend);
  const areaSpend = pointsSpend.length > 0 
    ? `${pathSpend} L ${pointsSpend[pointsSpend.length - 1].x} ${chartHeight - chartPadding} L ${pointsSpend[0].x} ${chartHeight - chartPadding} Z`
    : "";

  const pendingRequests = useMemo(() => {
    return bookings.filter(b => b.status === 'PENDING');
  }, [bookings]);

  return (
    <div className="space-y-8 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Business Overview</h1>
          <p className="text-xs text-gray-400 font-semibold mt-1">Review your listed items, incoming client appointments, aura points, and wallets payouts.</p>
        </div>
        <button onClick={() => setTab('services')} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm">
          + Add New Service
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(n => <div key={n} className="h-32 bg-gray-100 rounded-3xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <OverviewStatCard title="My Services" value={stats.services} onClick={() => setTab('services')} icon={<Server className="text-blue-500" size={24} />} color="bg-blue-50/50 border-blue-100/50" />
          <OverviewStatCard title="Total Bookings" value={stats.bookings} onClick={() => setTab('vendor-bookings')} icon={<CreditCard className="text-green-500" size={24} />} color="bg-green-50/50 border-green-100/50" />
          <div className="p-6 rounded-3xl border border-white/60 bg-white/40 backdrop-blur-md flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.01)] hover:scale-[1.015] active:scale-[0.985] cursor-pointer transition-all duration-205 hover:border-amber-400/40 relative overflow-hidden" onClick={() => setTab('business-profile')}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Aura Score</span>
              {getTrustBadge(stats.aura)}
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="text-3xl font-black text-gray-800 tracking-tight">{stats.aura.toFixed(1)}</div>
              
              {/* Semicircular speedometer gauge */}
              <div className="relative w-16 h-10 shrink-0">
                <svg className="w-full h-full" viewBox="0 0 80 50">
                  <defs>
                    <linearGradient id="auraGrad" x1="0" y1="0" x2="1" y2="0">
                      {stats.aura >= 800 ? (
                        <>
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#fbbf24" />
                        </>
                      ) : stats.aura >= 500 ? (
                        <>
                          <stop offset="0%" stopColor="#22d3ee" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </>
                      ) : (
                        <>
                          <stop offset="0%" stopColor="#94a3b8" />
                          <stop offset="100%" stopColor="#64748b" />
                        </>
                      )}
                    </linearGradient>
                  </defs>
                  <path 
                    d="M 12 42 A 28 28 0 0 1 68 42" 
                    fill="none" 
                    stroke="#f1f5f9" 
                    strokeWidth="6" 
                    strokeLinecap="round" 
                  />
                  <motion.path 
                    d="M 12 42 A 28 28 0 0 1 68 42" 
                    fill="none" 
                    stroke="url(#auraGrad)" 
                    strokeWidth="6.5" 
                    strokeLinecap="round" 
                    strokeDasharray={Math.PI * 28}
                    initial={{ strokeDashoffset: Math.PI * 28 }}
                    animate={{ strokeDashoffset: Math.PI * 28 * (1 - Math.min(stats.aura, 1000) / 1000) }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </svg>
              </div>
            </div>
          </div>
          <OverviewStatCard title="Business Earnings" value={`₹${stats.balance.toLocaleString('en-IN')}`} onClick={() => setTab('business-profile')} icon={<WalletIcon className="text-blue-650" size={24} />} color="bg-blue-50/30 border-blue-100/30" />
        </div>
      )}

      {/* Account suspension alert */}
      {vendor && vendor.aura < 100 && (
        <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-md rounded-3xl p-5 flex items-start gap-4 shadow-sm hover:scale-[1.005] transition-all">
          <div className="p-2 bg-red-500/20 border border-red-500/30 rounded-2xl shadow-sm text-red-650 shrink-0">
            <ShieldAlert size={20} className="text-red-600" />
          </div>
          <div>
            <h4 className="font-extrabold text-red-800 text-sm">Business Page Suspended</h4>
            <p className="text-xs text-red-700/90 leading-relaxed font-semibold mt-1">
              Your business is currently hidden from search listings because your Aura Score ({vendor.aura.toFixed(1)}) dropped below 100.0. 
              Please resolve outstanding disputes or client complaints immediately.
            </p>
          </div>
        </div>
      )}

      {/* Main content 2-Column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Analytics Chart & Pending Requests (Col-span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Earnings Analytics progression Chart */}
          <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 relative shadow-[0_8px_30px_rgba(0,0,0,0.01)] flex flex-col justify-between">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Earnings progression</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-gray-800">₹{stats.balance.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-gray-400 font-semibold">total business revenue</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span> Revenue</span>
              </div>
            </div>

            {/* Sparkline Earnings progression SVG */}
            <div className="relative mt-2">
              {chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Activity size={24} className="text-gray-300 mb-2 animate-pulse" />
                  <p className="text-xs text-gray-400 font-semibold italic">No confirmed bookings data available to chart.</p>
                </div>
              ) : (
                <>
                  <svg className="w-full h-auto" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
                    <defs>
                      <linearGradient id="vendorGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Gridlines */}
                    <line x1={chartPadding} y1={chartPadding} x2={chartWidth - chartPadding} y2={chartPadding} stroke="rgba(226, 232, 240, 0.5)" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1={chartPadding} y1={chartPadding + (chartHeight - 2 * chartPadding) / 2} x2={chartWidth - chartPadding} y2={chartPadding + (chartHeight - 2 * chartPadding) / 2} stroke="rgba(226, 232, 240, 0.5)" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1={chartPadding} y1={chartHeight - chartPadding} x2={chartWidth - chartPadding} y2={chartHeight - chartPadding} stroke="rgba(203, 213, 225, 0.8)" strokeWidth="1.5" />
                    
                    {/* Vertical Tracker line */}
                    {hoveredPoint !== null && pointsSpend[hoveredPoint] && (
                      <line 
                        x1={pointsSpend[hoveredPoint].x} 
                        y1={chartPadding} 
                        x2={pointsSpend[hoveredPoint].x} 
                        y2={chartHeight - chartPadding} 
                        stroke="#10b981" 
                        strokeWidth="1.5" 
                        strokeDasharray="4 4" 
                        className="opacity-40"
                      />
                    )}

                    {areaSpend && <path d={areaSpend} fill="url(#vendorGrad)" />}
                    {pathSpend && <path d={pathSpend} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                    
                    {pointsSpend.map((p, idx) => (
                      <g key={idx} onMouseEnter={() => setHoveredPoint(idx)} onMouseLeave={() => setHoveredPoint(null)}>
                        {hoveredPoint === idx && (
                          <>
                            <circle cx={p.x} cy={p.y} r={8} className="fill-emerald-500/20 stroke-none animate-ping" />
                            <circle cx={p.x} cy={p.y} r={5.5} className="fill-emerald-600 stroke-white stroke-2 cursor-pointer transition-all" />
                          </>
                        )}
                        <text x={p.x} y={chartHeight - 12} textAnchor="middle" className="text-[9px] fill-gray-400 font-bold">{p.label}</text>
                        <circle cx={p.x} cy={p.y} r={16} fill="transparent" className="cursor-pointer" />
                      </g>
                    ))}

                    {/* Integrated Tooltip */}
                    {hoveredPoint !== null && pointsSpend[hoveredPoint] && (
                      <g className="transition-all duration-200">
                        <rect 
                          x={pointsSpend[hoveredPoint].x - 47} 
                          y={pointsSpend[hoveredPoint].y - 36} 
                          width="94" 
                          height="24" 
                          rx="8" 
                          fill="rgba(15, 23, 42, 0.95)" 
                          stroke="rgba(255, 255, 255, 0.15)"
                          strokeWidth="1"
                        />
                        <text 
                          x={pointsSpend[hoveredPoint].x} 
                          y={pointsSpend[hoveredPoint].y - 20} 
                          textAnchor="middle" 
                          fill="#ffffff" 
                          className="text-[9px] font-black tracking-tight"
                        >
                          ₹{pointsSpend[hoveredPoint].val.toLocaleString('en-IN')}
                        </text>
                      </g>
                    )}
                  </svg>
                </>
              )}
            </div>
          </div>

          {/* Pending Bookings Widget */}
          <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Pending client requests</h3>
              <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full font-bold">{pendingRequests.length} pending</span>
            </div>

            {pendingRequests.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-6 text-center">No outstanding client booking requests. All caught up!</p>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map(req => (
                  <div key={req.id} className="p-4 bg-white/30 hover:bg-white/50 border border-white/50 hover:border-blue-200 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-800">Booking #{req.id}</span>
                        <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 rounded px-1 py-0.2 uppercase font-extrabold">{req.services?.category}</span>
                      </div>
                      <h4 className="font-extrabold text-gray-900 text-sm mt-1">{req.services?.name}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 mt-2 text-[10px] font-semibold text-gray-500">
                        <span>Client: <span className="text-gray-800">{req.clientName}</span></span>
                        <span>Date: <span className="text-gray-800">{req.startDt ? new Date(req.startDt).toLocaleDateString() : 'N/A'}</span></span>
                        <span>Amount: <span className="text-emerald-600 font-bold">₹{req.bookingAmount.toLocaleString('en-IN')}</span></span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                      <button 
                        disabled={actionLoading}
                        onClick={() => handleUpdateStatus(req.id, 'ACCEPT')} 
                        className="flex-1 md:flex-none px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-650 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 transition-all flex items-center justify-center gap-1.5"
                      >
                        Accept
                      </button>
                      <button 
                        disabled={actionLoading}
                        onClick={() => handleUpdateStatus(req.id, 'REJECT')} 
                        className="flex-1 md:flex-none px-4 py-2 bg-white hover:bg-red-50 text-red-650 border border-red-200 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Service Catalog Price Manager Widget */}
          <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.01)]">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Service Catalog Manager</h3>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Quickly edit service listed pricing without leaving the overview.</p>
              </div>
              <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-bold">{services.length} services</span>
            </div>

            {services.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-gray-400 italic">No services listed yet.</p>
                <button onClick={() => setTab('services')} className="mt-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold border border-blue-150 hover:bg-blue-100 transition-colors">
                  Add Your First Service
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-150/40 space-y-3">
                {services.map(s => (
                  <ServiceCatalogRow key={s.id} service={s} onUpdatePrice={handleUpdateServicePrice} />
                ))}
              </div>
            )}
          </div>

          {/* Aura score mechanics widget */}
          <div className="bg-gray-50/50 border border-gray-200/50 rounded-3xl p-6 flex flex-col justify-between min-h-[175px]">
            <div>
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-1.5"><Crown size={18} className="text-blue-500" /> Aura Score Mechanics</h3>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed mt-2">
                Your Aura score dictates your marketplace search visibility ranking. 
                Confirming bookings, responding fast to chat logs, and gaining 5-star reviews increases Aura. 
                Rejecting pending requests, cancellation breaches, complaints, or disputes decreases Aura significantly.
              </p>
            </div>
            <button onClick={() => setTab('testimonials')} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 mt-4">Manage Testimonials Feed →</button>
          </div>
        </div>

        {/* Right Column: Mini Appointment Calendar & Agenda (Col-span 1) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Gig Calendar */}
          <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.015)]">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4 flex justify-between items-center">
              <div className="flex items-center gap-1">
                <button 
                  onClick={handlePrevMonth} 
                  className="p-1 hover:bg-white/60 hover:text-gray-900 rounded-lg text-gray-400 transition-colors shadow-sm border border-transparent hover:border-white/40"
                  title="Previous Month"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="min-w-[95px] text-center text-slate-700 font-bold">{monthNames[currentMonth]} {currentYear}</span>
                <button 
                  onClick={handleNextMonth} 
                  className="p-1 hover:bg-white/60 hover:text-gray-900 rounded-lg text-gray-400 transition-colors shadow-sm border border-transparent hover:border-white/40"
                  title="Next Month"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
              <span className="text-[10px] text-blue-600 cursor-pointer font-bold hover:underline" onClick={() => setTab('vendor-bookings')}>Bookings view</span>
            </h3>
            
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {weekDays.map(wd => (
                <div key={wd} className="text-gray-400 font-bold py-1">{wd}</div>
              ))}
              {daysArray.map((day, idx) => {
                const isSelected = day.day === selectedDay && day.month === currentMonth && day.year === currentYear;
                const isToday = day.day === today.getDate() && day.month === today.getMonth() && day.year === today.getFullYear();
                const dayDateStr = `${day.year}-${String(day.month + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
                const isBlocked = blockedDates.includes(dayDateStr);
                const details = getDayDetails(day);
                
                return (
                  <div 
                    key={idx} 
                    className="relative py-1 flex flex-col items-center justify-center group"
                    onMouseEnter={() => setHoveredDay(idx)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    <motion.button 
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDayClick(day)}
                      className={`w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center transition-all ${
                        isSelected ? 'bg-gradient-to-tr from-emerald-500 to-teal-650 text-white shadow-md font-black ring-2 ring-emerald-500/20' :
                        isToday ? 'border border-emerald-500 text-emerald-600 font-black bg-emerald-50/50' :
                        isBlocked ? 'diagonal-stripes-red border border-red-300 text-red-700 font-bold shadow-sm' :
                        day.isCurrentMonth ? 'text-gray-700 hover:bg-white/60' : 'text-gray-300 hover:bg-white/30'
                      }`}
                    >
                      {day.day}
                    </motion.button>

                    {/* Dot Indicators */}
                    <div className="absolute bottom-0.5 flex gap-0.5 justify-center items-center">
                      {isBlocked && (
                        <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.6)]'}`} />
                      )}
                      {details.hasBooking && (
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-white' : 
                          details.status === 'CONFIRMED' ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)]' : 'bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.6)]'
                        }`} />
                      )}
                    </div>

                    {/* Hover Card Tooltip */}
                    {hoveredDay === idx && (details.hasBooking || isBlocked) && (
                      <div className="absolute bottom-9 left-1/2 -translate-x-1/2 w-48 bg-slate-900/95 text-white text-[10px] p-2.5 rounded-xl shadow-xl z-50 pointer-events-none backdrop-blur-sm border border-white/10 space-y-1.5 transition-all duration-200">
                        <div className="font-extrabold border-b border-white/15 pb-1 text-[9px] text-slate-300 uppercase tracking-wider">
                          {monthNames[day.month].substring(0, 3)} {day.day}, {day.year}
                        </div>
                        <div className="space-y-1">
                          {isBlocked && (
                            <div className="text-[8px] text-red-400 font-black uppercase flex items-center gap-1">
                              <Ban size={8} /> Blocked Availability
                            </div>
                          )}
                          {details.hasBooking && (
                            <>
                              <div className="text-[8px] text-emerald-400 font-black uppercase">Gigs ({details.list.length})</div>
                              {details.list.map((bk, bidx) => (
                                <div key={bidx} className="truncate text-slate-200 font-semibold flex flex-col">
                                  <span className="truncate">• {bk.services?.name}</span>
                                  <span className="text-[8px] text-slate-400 pl-2">Client: {bk.clientName}</span>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Day Gig Details */}
            <div className="mt-5 pt-4 border-t border-white/40">
              {(() => {
                const selectedDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
                const isSelectedDateBlocked = blockedDates.includes(selectedDateStr);
                return (
                  <>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                      <span>Appointments • {monthNames[currentMonth]} {selectedDay}</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => toggleBlockDate(selectedDateStr)}
                          className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border transition-all flex items-center gap-1 shadow-sm ${
                            isSelectedDateBlocked 
                              ? 'bg-red-500/10 text-red-650 border-red-200/50 hover:bg-red-500/20' 
                              : 'bg-white hover:bg-slate-50 border-gray-200 text-slate-700'
                          }`}
                        >
                          <Ban size={10} /> {isSelectedDateBlocked ? 'Unblock Date' : 'Block Date'}
                        </button>
                        <span className="text-[9px] bg-white/60 text-slate-600 px-1.5 py-0.5 rounded-md font-extrabold">
                          {agendaItems.length} {agendaItems.length === 1 ? 'gig' : 'gigs'}
                        </span>
                      </div>
                    </h4>

                    {isSelectedDateBlocked && (
                      <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-2xl text-[10px] text-red-700 font-semibold flex items-center gap-1.5 mb-3 leading-relaxed">
                        <Ban size={12} className="text-red-500 shrink-0" />
                        <span>You marked this date as unavailable. Clients cannot book you.</span>
                      </div>
                    )}
                  </>
                );
              })()}

              {agendaItems.length === 0 ? (
                <p className="text-[10px] text-gray-400 italic py-2">No appointments scheduled for this day.</p>
              ) : (
                <div className="space-y-2.5">
                  {agendaItems.map((item) => (
                    <motion.div 
                      whileHover={{ x: 2 }}
                      key={item.id} 
                      className="p-2.5 bg-white/30 border border-white/40 hover:bg-white/50 rounded-2xl text-xs flex flex-col gap-2 transition-all shadow-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-gray-800">Booking #{item.id}</span>
                            <span className={`px-1.5 py-0.2 text-[6.5px] font-black rounded-full uppercase tracking-wider border ${
                              item.status === 'CONFIRMED' || item.status === 'RESOLVED' || item.status === 'COMPLETED'
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : item.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>{item.status}</span>
                          </div>
                          <h5 className="font-extrabold text-gray-900 mt-1 truncate">{item.service}</h5>
                        </div>
                        <span className="text-[8px] font-extrabold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-1.5 py-0.5 whitespace-nowrap">{item.time}</span>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-gray-500 font-semibold border-t border-dashed border-gray-150 pt-2">
                        <div>
                          Client: <span className="text-gray-800">{item.client}</span>
                        </div>
                        <div className="font-bold text-emerald-600">
                          ₹{item.amount.toLocaleString('en-IN')}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-1">
                        <button 
                          onClick={() => handleStartChat(item.customerId)} 
                          className="flex-1 py-1.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-blue-100 transition-colors"
                        >
                          <MessageSquare size={10} /> Chat Client
                        </button>
                        {item.status === 'PENDING' && (
                          <button 
                            disabled={actionLoading}
                            onClick={() => handleUpdateStatus(item.id, 'ACCEPT')} 
                            className="flex-1 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-650 text-white rounded-xl text-[10px] font-bold shadow-sm transition-all"
                          >
                            Accept
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Catalog promo link */}
          <div className="bg-gradient-to-tr from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-250/20 backdrop-blur-md rounded-3xl p-6 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.01)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -z-10" />
            <div>
              <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1">Add new services catalog 💼</h4>
              <p className="text-[10px] text-gray-450 leading-relaxed font-semibold mt-1.5">List audio setups, wedding halls, photography scopes, or catering packages. Set serving cities range.</p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setTab('services')} 
              className="mt-5 w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-650 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/10 hover:from-emerald-700 hover:to-teal-700 transition-all"
            >
              Configure Services
            </motion.button>
          </div>

        </div>

      </div>
    </div>
  );
}

/* Service Catalog Row Component for inline price quick edit */
function ServiceCatalogRow({ service, onUpdatePrice }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempPrice, setTempPrice] = useState(service.price);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTempPrice(service.price);
  }, [service.price]);

  const handleSave = async () => {
    if (isNaN(tempPrice) || parseFloat(tempPrice) <= 0) {
      toast.error("Please enter a valid price greater than 0");
      return;
    }
    setSaving(true);
    await onUpdatePrice(service.id, tempPrice);
    setSaving(false);
    setIsEditing(false);
  };

  return (
    <div className="pt-3 flex items-center justify-between gap-4 transition-all">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.2 bg-blue-50 border border-blue-100 text-blue-600 text-[8px] font-black rounded uppercase tracking-wide">
            {service.category}
          </span>
          <span className="text-[9px] text-gray-400 font-mono">#{service.id}</span>
        </div>
        <h4 className="font-extrabold text-gray-900 text-xs mt-1 truncate">{service.name}</h4>
        <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{service.description}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <div className="relative flex items-center">
              <span className="absolute left-2 text-[10px] font-black text-gray-400">₹</span>
              <input
                type="number"
                value={tempPrice}
                onChange={e => setTempPrice(e.target.value)}
                className="w-20 pl-4 pr-1 py-0.5 h-7 border border-blue-300 rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                placeholder="Price"
                min="1"
                disabled={saving}
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-sm"
              title="Save"
            >
              {saving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
            </button>
            <button
              onClick={() => {
                setTempPrice(service.price);
                setIsEditing(false);
              }}
              disabled={saving}
              className="p-1 bg-white hover:bg-gray-150 text-gray-500 rounded-lg transition-colors border border-gray-200"
              title="Cancel"
            >
              <X size={10} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gray-900">
              ₹{service.price.toLocaleString('en-IN')}
            </span>
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 hover:bg-white/60 hover:text-blue-600 rounded-lg text-gray-450 transition-all border border-transparent hover:border-white/60"
              title="Quick Edit Price"
            >
              <Edit size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* 2. Vendor Services Tab */
function ServicesTab({ customerProfile, isDemoMode }) {
  const [vendorProfile, setVendorProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({ name: '', description: '', price: '', category: '', location: '' });
  const [availableLocations, setAvailableLocations] = useState([{ city: '', state: '' }]);
  const [photos, setPhotos] = useState([]);

  // Map elements
  const [mapContainer, setMapContainer] = useState(null);
  const [mapLocations, setMapLocations] = useState([]);
  const mapRefCallback = (node) => { setMapContainer(node); };
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  const fetchVendorAndServices = async () => {
    /*
    if (isDemoMode) {
      setVendorProfile({
        id: 401,
        businessName: "Elite Wedding Decors",
        category: "DECORATION"
      });
      setServices([
        {
          id: 351,
          category: "DECORATION",
          name: "Fairytale Canopy Flower Setup",
          description: "Stunning pastel themed canopy decorations using seasonal orchids and premium drapes, ideal for wedding mandates or reception backdrops.",
          price: 65000,
          location: "Mumbai",
          verificationStatus: "VERIFIED"
        },
        {
          id: 352,
          category: "DECORATION",
          name: "Minimalist Boho Haldi Decor",
          description: "Beautiful marigold drapes, dreamcatchers, and wooden benches setup for haldi and mehendi rituals.",
          price: 18000,
          location: "Mumbai",
          verificationStatus: "VERIFIED"
        },
        {
          id: 353,
          category: "DECORATION",
          name: "Modern Glass Aisle & Chandeliers",
          description: "Luxurious glass platform walking aisle equipped with warm LED spotlighting and crystal hanging chandeliers.",
          price: 120000,
          location: "Pune",
          verificationStatus: "PENDING"
        }
      ]);
      setLoading(false);
      return;
    }
    */
    if (!customerProfile?.id) return;
    try {
      setLoading(true);
      const vendorRes = await apiClient.get(`/api/vendor/customer/${customerProfile.id}`);
      const vendor = vendorRes.data?.data || vendorRes.data;
      setVendorProfile(vendor);

      if (vendor?.id) {
        const servicesRes = await apiClient.get(`/api/vendor/services/${vendor.id}?page=0&size=100`);
        setServices(servicesRes.data?.data?.content || servicesRes.data?.content || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load vendor services catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorAndServices();
  }, [customerProfile]);

  const addLocationFromCoords = async (lat, lng) => {
    const toastId = toast.loading("Resolving coordinate details...");
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { "Accept-Language": "en", "User-Agent": "Planit-App-Geocoding" } }
      );
      if (!response.ok) throw new Error("Failed geocoding");
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        const city = addr.city || addr.town || addr.village || addr.municipality || "";
        const state = addr.state || addr.region || "";

        if (!city || !state) {
          toast.error("Could not resolve specific city name.", { id: toastId });
          return;
        }

        setAvailableLocations(prev => {
          if (prev.length === 1 && !prev[0].city && !prev[0].state) return [{ city, state }];
          if (prev.some(l => l.city.toLowerCase() === city.toLowerCase() && l.state.toLowerCase() === state.toLowerCase())) {
            toast.info("City already selected", { id: toastId });
            return prev;
          }
          return [...prev, { city, state }];
        });

        setMapLocations(prev => {
          if (prev.some(l => l.city.toLowerCase() === city.toLowerCase() && l.state.toLowerCase() === state.toLowerCase())) return prev;
          return [...prev, { lat, lng, city, state }];
        });
        toast.success(`Selected ${city}!`, { id: toastId });
      }
    } catch (err) {
      toast.error("Failed to resolve city coordinates.", { id: toastId });
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapInstance.current) mapInstance.current.setView([latitude, longitude], 10);
        await addLocationFromCoords(latitude, longitude);
      });
    }
  };

  const handleRemoveLocation = (index) => {
    const loc = availableLocations[index];
    if (availableLocations.length === 1) {
      setAvailableLocations([{ city: '', state: '' }]);
      setMapLocations([]);
    } else {
      setAvailableLocations(prev => prev.filter((_, i) => i !== index));
      setMapLocations(prev => prev.filter(m => !(m.city.toLowerCase() === loc.city.toLowerCase())));
    }
  };

  // Map initialization in add service dialog
  useEffect(() => {
    let active = true;
    if (!showAddForm || !mapContainer) return;

    import('leaflet').then((L) => {
      if (!active || !mapContainer) return;
      window.L = L.default || L;

      import('leaflet/dist/images/marker-icon.png').then((icon) => {
        import('leaflet/dist/images/marker-icon-2x.png').then((icon2x) => {
          import('leaflet/dist/images/marker-shadow.png').then((shadow) => {
            if (!active) return;
            const Leaflet = L.default || L;
            delete Leaflet.Icon.Default.prototype._getIconUrl;
            Leaflet.Icon.Default.mergeOptions({
              iconUrl: icon.default,
              iconRetinaUrl: icon2x.default,
              shadowUrl: shadow.default,
            });
          });
        });
      });

      if (!mapInstance.current) {
        const Leaflet = L.default || L;
        const map = Leaflet.map(mapContainer).setView([20.5937, 78.9629], 5);
        Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
        mapInstance.current = map;

        map.on('click', async (e) => {
          const { lat, lng } = e.latlng;
          await addLocationFromCoords(lat, lng);
        });
      }
    });

    return () => {
      active = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      setMapContainer(null);
      setMapLocations([]);
    };
  }, [showAddForm, mapContainer]);

  // Sync markers
  useEffect(() => {
    if (!mapInstance.current || !mapLocations) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const L = window.L;
    if (!L) return;

    mapLocations.forEach(loc => {
      const marker = L.marker([loc.lat, loc.lng])
        .addTo(mapInstance.current)
        .bindPopup(`<b>${loc.city}, ${loc.state}</b>`);
      markersRef.current.push(marker);
    });
  }, [mapLocations]);

  const handleAddServiceSubmit = async (e) => {
    e.preventDefault();
    if (isDemoMode) {
      setFormLoading(true);
      setTimeout(() => {
        const newService = {
          id: Math.floor(Math.random() * 1000) + 400,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category || "DECORATION",
          location: formData.location || "Mumbai",
          verificationStatus: "PENDING"
        };
        setServices(prev => [newService, ...prev]);
        toast.success("Service submitted for admin verification (Demo Mode)!");
        setShowAddForm(false);
        setFormData({ name: '', description: '', price: '', category: '', location: '' });
        setAvailableLocations([{ city: '', state: '' }]);
        setPhotos([]);
        setFormLoading(false);
      }, 500);
      return;
    }
    if (!vendorProfile?.id) return;
    try {
      setFormLoading(true);
      await apiClient.post('/api/services', {
        vendorId: vendorProfile.id,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category || vendorProfile.category,
        location: formData.location,
        availableLocations: availableLocations.filter(loc => loc.city.trim() !== '' && loc.state.trim() !== ''),
        photos: photos,
        isAvailable: true
      });
      toast.success("Service submitted for admin verification!");
      setShowAddForm(false);
      setFormData({ name: '', description: '', price: '', category: '', location: '' });
      setAvailableLocations([{ city: '', state: '' }]);
      setPhotos([]);
      fetchVendorAndServices();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit service creation request");
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED': return <span className="px-2.5 py-0.5 bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold rounded-full">ACTIVE</span>;
      case 'PENDING': return <span className="px-2.5 py-0.5 bg-yellow-50 border border-yellow-250 text-yellow-700 text-[10px] font-bold rounded-full">PENDING</span>;
      default: return <span className="px-2.5 py-0.5 bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold rounded-full">REJECTED</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">My Catalog Services</h1>
          <p className="text-xs text-gray-500 font-semibold">List and manage services offered to customers.</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm shadow-blue-600/10">
          <Plus size={16} /> Add Service
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
          {[1, 2].map(n => <div key={n} className="h-36 bg-gray-50 border rounded-2xl" />)}
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-16 bg-gray-50/50 border border-gray-100 rounded-3xl">
          <Server className="text-gray-300 mx-auto mb-3" size={40} />
          <h3 className="text-base font-bold text-gray-800">No services listed</h3>
          <p className="text-xs text-gray-500 mt-1">List your wedding decoration, planning, audio setups, or venue spaces here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider font-semibold border-b border-gray-200">
                <th className="py-3 px-4 font-semibold">Service ID</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Service Name</th>
                <th className="py-3 px-4 font-semibold">Location</th>
                <th className="py-3 px-4 font-semibold text-right">Price</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 text-xs text-gray-700">
              {services.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors h-14">
                  <td className="py-3 px-4 font-mono text-[11px] text-gray-500">#{s.id}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 bg-blue-50 border border-blue-150 text-blue-700 text-[9px] font-bold rounded uppercase">
                      {s.category}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-900 leading-normal">{s.name}</div>
                    <div className="text-[11px] text-gray-400 line-clamp-1 max-w-md mt-0.5">{s.description}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-500 font-medium">
                    {s.location ? (
                      <span className="flex items-center gap-1"><MapPin size={12} className="text-gray-400" /> {s.location}</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">
                    ₹{s.price.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {getStatusBadge(s.verificationStatus)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* List Service Dialog Form */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto custom-scrollbar bg-white rounded-3xl p-6 border border-gray-200">
          <DialogHeader><DialogTitle className="text-xl font-bold text-gray-955">Add Service to Catalog</DialogTitle></DialogHeader>
          <form onSubmit={handleAddServiceSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 block uppercase mb-1">Service Title *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 h-12 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-150 transition-all bg-white" placeholder="e.g. Wedding Stage Flower Decor" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 block uppercase mb-1">Pricing (₹) *</label>
                <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-3 h-12 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-150 transition-all bg-white" placeholder="15000" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 block uppercase mb-1">Description *</label>
              <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-150 resize-none transition-all bg-white" placeholder="Provide service coverage details..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 block uppercase mb-1">Service Category *</label>
                <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 h-12 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-150 transition-all bg-white">
                  <option value="">Select Category</option>
                  <option value="DECORATION">Decoration</option>
                  <option value="CATERING">Catering</option>
                  <option value="VENUE">Venue</option>
                  <option value="ENTERTAINMENT">Entertainment</option>
                  <option value="PHOTOGRAPHY">Photography</option>
                  <option value="MUSIC">Music</option>
                  <option value="MAKEUP">Makeup</option>
                  <option value="LOGISTICS">Logistics</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 block uppercase mb-1">Fallback Area Description</label>
                <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-3 h-12 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-150 transition-all bg-white" placeholder="e.g. Mumbai City, Juhu area" />
              </div>
            </div>

            {/* Map selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-gray-400 block uppercase">Serving Cities List *</label>
                  <button type="button" onClick={() => setAvailableLocations([...availableLocations, { city: '', state: '' }])} className="text-[10px] text-blue-600 font-bold hover:underline">+ Add Row</button>
                </div>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {availableLocations.map((loc, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input required type="text" value={loc.city} onChange={e => {
                        const arr = [...availableLocations];
                        arr[idx].city = e.target.value;
                        setAvailableLocations(arr);
                      }} placeholder="City" className="w-full px-2 py-1.5 border rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-150 transition-all bg-white" />
                      <input required type="text" value={loc.state} onChange={e => {
                        const arr = [...availableLocations];
                        arr[idx].state = e.target.value;
                        setAvailableLocations(arr);
                      }} placeholder="State" className="w-full px-2 py-1.5 border rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-150 transition-all bg-white" />
                      <button type="button" onClick={() => handleRemoveLocation(idx)} className="p-1 text-red-500 border rounded-lg hover:bg-red-55"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-gray-400 block uppercase">Select serving maps</label>
                  <button type="button" onClick={handleGetCurrentLocation} className="text-[10px] px-2 py-1 bg-blue-50 text-blue-605 border border-blue-100 rounded font-bold hover:bg-blue-100 transition-all">Pin GPS</button>
                </div>
                <div ref={mapRefCallback} className="w-full h-36 rounded-xl border border-gray-200 relative z-0" style={{ minHeight: '120px' }} />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 block uppercase mb-1">Service Photos (Uploadcare)</label>
              <div className="flex flex-wrap gap-2.5 items-center">
                {photos.map((p, i) => (
                  <div key={i} className="relative w-16 h-16 border rounded-lg overflow-hidden shrink-0">
                    <img src={p} alt="Serv" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 bg-white/80 p-0.5 rounded-full text-red-500"><XCircle size={12} /></button>
                  </div>
                ))}
                {photos.length < 5 && (
                  <FileUploaderRegular 
                    pubkey="demopublickey" 
                    multiple 
                    onChange={e => {
                      const list = e.allEntries.filter(f => f.status === 'success');
                      const urls = list.map(f => f.cdnUrl).filter(Boolean);
                      setPhotos(prev => {
                        const c = [...prev];
                        urls.forEach(u => { if (!c.includes(u)) c.push(u); });
                        return c.slice(0, 5);
                      });
                    }}
                  />
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2.5">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 border rounded-xl text-xs font-bold text-gray-650 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={formLoading} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]">
                {formLoading ? <Loader2 size={12} className="animate-spin" /> : null} Submit Service
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* 3. Vendor Bookings Tab */
function VendorBookingsTab({ customerProfile, isDemoMode }) {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [vendor, setVendorProfile] = useState(null);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const fetchVendorBookings = async () => {
    /*
    if (isDemoMode) {
      setVendorProfile({
        id: 401,
        businessName: "Elite Wedding Decors"
      });
      setBookings([
        {
          id: 601,
          status: "PENDING",
          startDt: "2026-11-12T18:00:00",
          endDt: "2026-11-12T23:59:00",
          bookingAmount: 65000,
          clientName: "Aarav Sharma",
          clientEmail: "aarav@gmail.com",
          clientPhone: "+91 98765 43210",
          services: {
            category: "DECORATION",
            name: "Fairytale Canopy Flower Setup"
          }
        },
        {
          id: 602,
          status: "CONFIRMED",
          startDt: "2026-07-05T16:00:00",
          endDt: "2026-07-05T21:00:00",
          bookingAmount: 18000,
          clientName: "Neha Patel",
          clientEmail: "neha@outlook.com",
          clientPhone: "+91 91234 56789",
          services: {
            category: "DECORATION",
            name: "Minimalist Boho Haldi Decor"
          }
        }
      ]);
      setDisputes([]);
      setLoading(false);
      return;
    }
    */
    if (!customerProfile?.id) return;
    try {
      setLoading(true);
      const vendorRes = await apiClient.get(`/api/vendor/customer/${customerProfile.id}`);
      const vProfile = vendorRes.data?.data || vendorRes.data;
      setVendorProfile(vProfile);

      if (vProfile?.id) {
        const [bookingsRes, disputesRes] = await Promise.all([
          apiClient.get(`/api/vendor/bookings/${vProfile.id}?page=0&size=100`),
          apiClient.get('/api/disputes/my')
        ]);
        setBookings(bookingsRes.data?.data?.content || bookingsRes.data?.content || []);

        let dataList = [];
        const dr = disputesRes.data;
        if (dr?.data && Array.isArray(dr.data)) dataList = dr.data;
        else if (dr?.data?.content && Array.isArray(dr.data.content)) dataList = dr.data.content;
        else if (dr?.content && Array.isArray(dr.content)) dataList = dr.content;
        else if (Array.isArray(dr)) dataList = dr;
        setDisputes(dataList);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load customer orders bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorBookings();
  }, [customerProfile]);

  const handleUpdateStatus = async (bookingId, action) => {
    let confirmMsg = "";
    if (action === 'ACCEPT') { confirmMsg = "Accept this customer order?"; }
    else if (action === 'REJECT') { confirmMsg = "Reject this customer request?"; }
    else if (action === 'CANCEL') { confirmMsg = "Cancel booking and trigger immediate refund to customer?"; }

    if (!window.confirm(confirmMsg)) return;

    if (isDemoMode) {
      setActionLoading(true);
      setTimeout(() => {
        const nextStatus = action === 'ACCEPT' ? 'CONFIRMED' : action === 'REJECT' ? 'REJECTED' : 'CANCELLED';
        setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: nextStatus } : b));
        toast.success(`Booking request marked ${action.toLowerCase()}ed (Demo Mode)`);
        setShowModal(false);
        setActionLoading(false);
      }, 500);
      return;
    }

    let endpoint = "";
    if (action === 'ACCEPT') { endpoint = `/api/bookings/${bookingId}/accept`; }
    else if (action === 'REJECT') { endpoint = `/api/bookings/${bookingId}/reject`; }
    else if (action === 'CANCEL') { endpoint = `/api/bookings/${bookingId}/cancel/vendor`; }

    try {
      setActionLoading(true);
      const res = await apiClient.post(endpoint);
      toast.success(`Booking request marked ${action.toLowerCase()}ed.`);
      const updated = res.data?.data || res.data;
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: updated.status } : b));
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to alter booking status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartChat = async (customerId) => {
    if (!customerId) return;
    if (isDemoMode) {
      toast.success("Opening chat channel with client (Demo Mode)...");
      return;
    }
    try {
      setChatLoading(true);
      const res = await apiClient.post('/api/chat/conversations', { customerId });
      const conversation = res.data?.data || res.data;
      navigate(`/chats?id=${conversation.id}`);
      toast.success("Opening chat channel...");
    } catch (err) {
      toast.error("Failed to open chat channels");
    } finally {
      setChatLoading(false);
    }
  };

  const filteredBookings = bookings.filter(b => filter === 'ALL' || b.status === filter);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'CONFIRMED':
      case 'RESOLVED':
      case 'VERIFIED':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDING':
      case 'IN_REVIEW':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'CANCELLED':
      case 'REJECTED':
      case 'OPEN':
      default:
        return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Client Appointments</h1>
          <p className="text-xs text-gray-500 font-semibold">Review, accept, reject, or cancellation refunds for customer requests.</p>
        </div>
        <div className="flex gap-1.5 bg-gray-150/80 p-1 border rounded-xl">
          {['ALL', 'PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED'].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all hover:scale-[1.02] active:scale-[0.98] ${filter === s ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2].map(n => <div key={n} className="h-32 bg-gray-50 border rounded-2xl" />)}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-gray-50/50 border border-gray-100 rounded-xl">
          <CreditCard className="text-gray-300 mx-auto mb-3" size={40} />
          <h3 className="text-base font-bold text-gray-800">No appointments found</h3>
          <p className="text-xs text-gray-500 mt-1">Pending bookings from clients will appear here once they checkout cart services.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider font-semibold border-b border-gray-200">
                <th className="py-3 px-4 font-semibold">Booking ID</th>
                <th className="py-3 px-4 font-semibold">Client</th>
                <th className="py-3 px-4 font-semibold">Service Info</th>
                <th className="py-3 px-4 font-semibold">Date Range</th>
                <th className="py-3 px-4 font-semibold text-right">Earnings</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 text-xs text-gray-700">
              {filteredBookings.map(b => (
                <tr key={b.id} className="hover:bg-gray-50/50 transition-colors h-14">
                  <td className="py-3 px-4 font-mono text-[11px] text-gray-500">#{b.id}</td>
                  <td className="py-3 px-4 font-semibold text-gray-900">
                    {b.clientName || `Customer #${b.customerId}`}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-1.5 py-0.5 bg-blue-50 border border-blue-150 text-blue-700 text-[9px] font-bold rounded uppercase mr-1.5">
                      {b.services?.category}
                    </span>
                    <span className="font-medium text-gray-800">{b.services?.name}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 font-medium">
                    {new Date(b.startDt).toLocaleDateString()} - {new Date(b.endDt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">
                    ₹{b.bookingAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 border text-[9px] font-bold rounded-full uppercase tracking-wider ${getStatusStyle(b.status)}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end items-center gap-1.5">
                      <button onClick={() => { setSelectedBooking(b); setShowModal(true); }} className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-600 transition-all" title="Details"><Clock size={13} /></button>
                      <button onClick={() => handleStartChat(b.customerId)} disabled={chatLoading} className="p-1.5 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 text-blue-600 transition-all" title="Chat Client"><MessageSquare size={13} /></button>
                      {b.status === 'PENDING' && (
                        <>
                          <button onClick={() => handleUpdateStatus(b.id, 'ACCEPT')} disabled={actionLoading} className="p-1.5 bg-green-50 border border-green-200 hover:bg-green-100 text-green-700 rounded-lg transition-all" title="Accept"><Check size={13} /></button>
                          <button onClick={() => handleUpdateStatus(b.id, 'REJECT')} disabled={actionLoading} className="p-1.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-750 rounded-lg transition-all" title="Reject"><Ban size={13} /></button>
                        </>
                      )}
                      {b.status === 'CONFIRMED' && (
                        <button onClick={() => handleUpdateStatus(b.id, 'CANCEL')} disabled={actionLoading} className="px-2 py-1 bg-red-50 border border-red-155 text-red-650 hover:bg-red-100 text-[9px] font-bold rounded-lg transition-all">Cancel/Refund</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog detail modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border border-gray-200">
          <DialogHeader><DialogTitle className="text-lg font-bold text-gray-955">Appointment details</DialogTitle></DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 mt-2">
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 text-xs font-semibold text-gray-600 space-y-2">
                <span className="text-[9px] text-blue-700 font-bold block uppercase mb-1">Customer details</span>
                <div>Name: <strong className="text-gray-800">{selectedBooking.clientName}</strong></div>
                {selectedBooking.clientEmail && <div>Email: <strong className="text-gray-800">{selectedBooking.clientEmail}</strong></div>}
                {selectedBooking.clientPhone && <div>Phone: <strong className="text-gray-800">{selectedBooking.clientPhone}</strong></div>}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-gray-500">
                <div className="bg-gray-50 p-2.5 rounded-xl border">
                  <span className="text-[9px] text-gray-400 block uppercase">Booking ID</span>
                  <span className="font-bold text-gray-800"># {selectedBooking.id}</span>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-xl border">
                  <span className="text-[9px] text-gray-400 block uppercase">Status</span>
                  <span className="font-bold text-gray-850 uppercase">{selectedBooking.status}</span>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-xl border col-span-2">
                  <span className="text-[9px] text-gray-400 block uppercase">Dates range</span>
                  <span className="font-bold text-gray-800 block">{new Date(selectedBooking.startDt).toLocaleString()} - {new Date(selectedBooking.endDt).toLocaleString()}</span>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-xl border">
                  <span className="text-[9px] text-gray-400 block uppercase">Client Paid Amount</span>
                  <span className="font-extrabold text-gray-850">₹{selectedBooking.bookingAmount}</span>
                </div>
              </div>

              {(() => {
                const bookingDispute = disputes.find(d => d.bookingId === selectedBooking.id);
                if (bookingDispute) {
                  return (
                    <div className="bg-rose-50 text-rose-800 text-xs p-3 rounded-2xl border border-rose-100">
                      <span className="text-[9px] font-bold block uppercase mb-1">Dispute active ({bookingDispute.status})</span>
                      <p className="font-semibold text-gray-700">Reason: {bookingDispute.reason}</p>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex gap-2 pt-4">
                <button onClick={() => handleStartChat(selectedBooking.customerId)} className="flex-1 py-3 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"><MessageSquare size={14} /> Chat Client</button>
                {selectedBooking.status === 'PENDING' && (
                  <>
                    <button onClick={() => handleUpdateStatus(selectedBooking.id, 'ACCEPT')} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">Accept</button>
                    <button onClick={() => handleUpdateStatus(selectedBooking.id, 'REJECT')} className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">Reject</button>
                  </>
                )}
                {selectedBooking.status === 'CONFIRMED' && (
                  <button onClick={() => handleUpdateStatus(selectedBooking.id, 'CANCEL')} className="flex-1 py-3 bg-red-600 hover:bg-red-750 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">Cancel & Refund</button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* 4. Testimonials Tab */
function TestimonialsTab({ customerProfile, isDemoMode }) {
  const [vendorProfile, setVendorProfile] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTestimonials = async () => {
    /*
    if (isDemoMode) {
      setVendorProfile({ id: 401 });
      setTestimonials([
        {
          id: 901,
          clientId: 12,
          rating: 5,
          reviewText: "Absolutely stunning canopy design! Our guests couldn't stop taking pictures. Rajesh and team were highly professional.",
          isFeatured: true,
          createdAt: "2026-05-15T10:00:00"
        },
        {
          id: 902,
          clientId: 34,
          rating: 4,
          reviewText: "Great floral arrangements for our Haldi event. Reached the venue on time.",
          isFeatured: false,
          createdAt: "2026-06-01T11:30:00"
        }
      ]);
      setLoading(false);
      return;
    }
    */
    if (!customerProfile?.id) return;
    try {
      setLoading(true);
      const vendorRes = await apiClient.get(`/api/vendor/customer/${customerProfile.id}`);
      const vendor = vendorRes.data?.data || vendorRes.data;
      setVendorProfile(vendor);

      if (vendor?.id) {
        const testimonialsRes = await apiClient.get(`/api/testimonials/vendor/${vendor.id}`);
        setTestimonials(testimonialsRes.data?.data || testimonialsRes.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, [customerProfile]);

  const handleToggleFeature = async (id) => {
    if (isDemoMode) {
      setTestimonials(prev => prev.map(t => t.id === id ? { ...t, isFeatured: !t.isFeatured } : t));
      toast.success("Testimonial featured state updated (Demo Mode)!");
      return;
    }
    try {
      await apiClient.put(`/api/testimonials/${id}/feature`);
      toast.success("Testimonial featured state updated!");
      setTestimonials(prev => prev.map(t => t.id === id ? { ...t, isFeatured: !t.isFeatured } : t));
    } catch (err) {
      toast.error("Failed to update featured testimonials status");
    }
  };

  const handleDeleteTestimonial = async (id) => {
    if (!window.confirm("Delete this review testimonial permanently?")) return;
    if (isDemoMode) {
      setTestimonials(prev => prev.filter(t => t.id !== id));
      toast.success("Testimonial review deleted (Demo Mode).");
      return;
    }
    try {
      await apiClient.delete(`/api/testimonials/${id}`);
      toast.success("Testimonial review deleted.");
      setTestimonials(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      toast.error("Failed to delete review");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Business Reviews Feed</h1>
        <p className="text-xs text-gray-500 font-semibold">Highlight glowing client review testimonials to feature them on details view pages.</p>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-24 bg-gray-50 border rounded-2xl" />
        </div>
      ) : testimonials.length === 0 ? (
        <div className="text-center py-16 bg-gray-50/50 border border-gray-100 rounded-3xl">
          <Star className="text-gray-300 mx-auto mb-3" size={40} />
          <h3 className="text-base font-bold text-gray-800">No testimonials received</h3>
          <p className="text-xs text-gray-500 mt-1">Client reviews from completed service orders will populate here automatically.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {testimonials.map(t => (
            <div key={t.id} className="bg-white border border-gray-150 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <h4 className="font-extrabold text-gray-900 text-sm">Reviewer ID #{t.clientId || 'Client'}</h4>
                  <div className="flex text-amber-500">
                    {Array.from({ length: t.rating || 5 }).map((_, idx) => (
                      <Star key={idx} size={12} fill="#F59E0B" className="text-amber-500" />
                    ))}
                  </div>
                  {t.isFeatured && (
                    <span className="px-2.5 py-0.5 bg-blue-100 border border-blue-200 text-blue-700 text-[9px] font-bold rounded-full uppercase">Featured</span>
                  )}
                </div>
                <p className="text-xs font-medium text-gray-600 leading-relaxed italic">"{t.reviewText}"</p>
                {t.createdAt && <span className="text-[10px] text-gray-400 block mt-1 font-semibold">Submitted: {new Date(t.createdAt).toLocaleDateString()}</span>}
              </div>

              <div className="flex gap-2 shrink-0 sm:self-center self-end">
                <button onClick={() => handleToggleFeature(t.id)} className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] ${t.isFeatured ? 'bg-blue-50 text-blue-700 border-blue-150' : 'bg-white hover:bg-gray-50 text-gray-600'}`}>
                  {t.isFeatured ? 'Featured' : 'Feature'}
                </button>
                <button onClick={() => handleDeleteTestimonial(t.id)} className="p-2 border rounded-xl hover:bg-red-50 text-red-500 transition-all hover:scale-105 active:scale-95"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* 5. Business Details Profile Tab */
function BusinessProfileTab({ customerProfile, refreshUser, isDemoMode }) {
  const [vendor, setVendorProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode) {
      setVendorProfile({
        id: 401,
        businessName: "Elite Wedding Decors",
        category: "DECORATION",
        ownerName: "Rajesh Kumar",
        upiAddress: "rajeshdecors@okaxis",
        aura: 680.5,
        pan: "ABCDE1234F",
        gstNumber: "27ABCDE1234F1Z5",
        verificationStatus: "VERIFIED",
        addressLine1: "Suite 405, Dynasty Business Park",
        addressLine2: "Andheri Kurla Road",
        state: "Maharashtra",
        pincode: "400059",
        description: "Premium wedding decoration, set construction, theme layouts, and flower arrangements with 8+ years of industry experience across Mumbai and Pune."
      });
      setLoading(false);
      return;
    }
    if (!customerProfile?.id) return;
    const fetchVendorProfile = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/api/vendor/customer/${customerProfile.id}`);
        setVendorProfile(res.data?.data || res.data || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVendorProfile();
  }, [customerProfile]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Business Profile</h1>
        <p className="text-xs text-gray-500 font-semibold">Verify owner credentials, tax structures, banking UPI IDs, and Aura standing details.</p>
      </div>

      {loading ? (
        <div className="h-44 bg-gray-50 border rounded-3xl animate-pulse" />
      ) : !vendor ? (
        <div className="text-center py-16 bg-gray-50 border rounded-3xl">
          <Briefcase className="text-gray-300 mx-auto mb-3" size={40} />
          <h3 className="text-base font-bold text-gray-800">Business registration incomplete</h3>
          <p className="text-xs text-gray-500 mt-1">Please head to vendor onboarding page to establish verified listings rights.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.02)] space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 flex items-center justify-center text-white text-2xl font-black shadow-md shadow-blue-600/15 overflow-hidden">
              {vendor.profileImageUrl ? (
                <img src={vendor.profileImageUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : vendor.businessName?.charAt(0)}
            </div>
            <div>
              <h3 className="font-extrabold text-gray-955 text-lg leading-tight">{vendor.businessName}</h3>
              <p className="text-xs text-blue-600 font-bold uppercase mt-1">{vendor.category}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t text-xs font-semibold text-gray-500">
            <div>
              <span className="text-[10px] text-gray-400 block uppercase font-bold mb-0.5">Owner name</span>
              <span className="text-gray-850 font-bold text-sm block">{vendor.ownerName}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block uppercase font-bold mb-0.5">UPI Payout handles</span>
              <span className="text-gray-850 font-bold text-sm block">{vendor.upiAddress || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block uppercase font-bold mb-0.5">Aura Score</span>
              <span className="text-gray-850 font-bold text-sm block">{vendor.aura?.toFixed(1) || '500.0'}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block uppercase font-bold mb-0.5">PAN Identification</span>
              <span className="text-gray-850 font-bold text-sm block uppercase">{vendor.pan}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block uppercase font-bold mb-0.5">GST Identification</span>
              <span className="text-gray-850 font-bold text-sm block uppercase">{vendor.gstNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 block uppercase font-bold mb-0.5">Verification status</span>
              <span className={`inline-block font-bold text-[10px] uppercase rounded-full px-2.5 py-0.5 border mt-0.5 ${vendor.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                {vendor.verificationStatus}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] text-gray-400 block uppercase font-bold mb-0.5">Physical office address</span>
              <span className="text-gray-800 text-xs block leading-relaxed">{vendor.addressLine1}, {vendor.addressLine2 ? `${vendor.addressLine2}, ` : ''}{vendor.state} - {vendor.pincode}</span>
            </div>
          </div>

          {vendor.description && (
            <div className="pt-6 border-t">
              <span className="text-[10px] text-gray-400 block uppercase font-bold mb-1.5">Business profile description</span>
              <p className="text-xs text-gray-650 leading-relaxed font-semibold">{vendor.description}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   ADMIN WORKSPACE TABS
   ============================================================================ */

/* 1. Admin Overview Tab */
function AdminOverviewTab({ setTab }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Admin Console</h1>
        <p className="text-sm text-gray-500 font-semibold mt-1">Review validation approvals list queue, settle dispute conflicts, or inspect aura score logs.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <OverviewStatCard title="Verify Customers" value="Verification" onClick={() => setTab('admin-customers')} icon={<User className="text-blue-500" size={24} />} color="bg-blue-50/50 backdrop-blur-md border-blue-200/40" />
        <OverviewStatCard title="Verify Vendors" value="Applications" onClick={() => setTab('admin-vendors')} icon={<Briefcase className="text-green-500" size={24} />} color="bg-green-50/50 backdrop-blur-md border-green-200/40" />
        <OverviewStatCard title="Verify Services" value="Services Listings" onClick={() => setTab('admin-services')} icon={<Server className="text-sky-500" size={24} />} color="bg-sky-50/50 backdrop-blur-md border-sky-200/40" />
        <OverviewStatCard title="Platform Disputes" value="Disputes Center" onClick={() => setTab('admin-disputes')} icon={<Scale className="text-rose-500" size={24} />} color="bg-rose-50/50 backdrop-blur-md border-rose-200/40" />
        <OverviewStatCard title="User Complaints" value="Complaints Panel" onClick={() => setTab('admin-complaints')} icon={<ShieldAlert className="text-amber-500" size={24} />} color="bg-amber-50/50 backdrop-blur-md border-amber-200/40" />
        <OverviewStatCard title="Aura Scores Logs" value="Audit Trails" onClick={() => setTab('admin-aura-logs')} icon={<FileText className="text-blue-500" size={24} />} color="bg-blue-50/50 backdrop-blur-md border-blue-200/40" />
      </div>
    </div>
  );
}

/* 2. Admin Approvals Tab (Customers, Vendors, Services) */
function AdminApprovalsTab({ type, activeTab, isDemoMode }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const fetchApprovalsData = async () => {
    /*
    if (isDemoMode) {
      const mockApprovals = {
        customer: [
          { id: 801, firstName: "Karan", lastName: "Mehra", phoneNumber: "+91 99999 88888", aadharUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop" },
          { id: 802, firstName: "Priya", lastName: "Kapoor", phoneNumber: "+91 88888 77777", aadharUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=200&auto=format&fit=crop" }
        ],
        vendor: [
          { id: 803, businessName: "Spicy Treats Catering", category: "CATERING", description: "Providing authentic North Indian and wedding buffet menus with live cooking counters.", gstNumber: "27GHIJK5678L1Z9", pan: "GHIJK5678L", state: "Gujarat", phoneNumber: "+91 77777 66666" }
        ],
        service: [
          { id: 804, name: "Luxury Mercedes Groom Entry Car", category: "LOGISTICS", description: "Chauffeur driven white Mercedes S-Class for groom reception entrance.", price: 25000, location: "Delhi NCR" }
        ]
      };
      setItems(mockApprovals[type] || []);
      setLoading(false);
      return;
    }
    */
    try {
      setLoading(true);
      const res = await apiClient.get(`/api/admin/requests/${type}`);
      setItems(Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
    } catch (err) {
      toast.error(`Failed to fetch pending ${type} request details`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovalsData();
  }, [type, activeTab]);

  const handleAction = async (action, id) => {
    if (isDemoMode) {
      setActionId(id);
      setTimeout(() => {
        toast.success(`${type} request marked ${action}d successfully (Demo Mode)`);
        setItems(prev => prev.filter(item => item.id !== id));
        setActionId(null);
      }, 500);
      return;
    }
    try {
      setActionId(id);
      await apiClient.post(`/api/admin/requests/${type}/${action}/${id}`);
      toast.success(`${type} request marked ${action}d successfully`);
      fetchApprovalsData();
    } catch (err) {
      toast.error(`Failed to mark ${action} request`);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight uppercase">{type} Approvals Queue</h1>
        <p className="text-xs text-gray-500 font-semibold">Audit submitted verification credentials before authorizing marketplace listing privileges.</p>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-32 bg-gray-50 border rounded-2xl" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-gray-50/50 border border-gray-150 rounded-xl">
          <CheckCircle className="text-gray-300 mx-auto mb-3" size={40} />
          <h3 className="text-base font-bold text-gray-800">Clear queue!</h3>
          <p className="text-xs text-gray-500 mt-1 font-medium font-sans">All validation requests have been processed successfully.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider font-semibold border-b border-gray-200">
                <th className="py-3 px-4 font-semibold">ID</th>
                {type === 'customer' && (
                  <>
                    <th className="py-3 px-4 font-semibold">Customer Name</th>
                    <th className="py-3 px-4 font-semibold">Phone Number</th>
                    <th className="py-3 px-4 font-semibold">Verification Document</th>
                  </>
                )}
                {type === 'vendor' && (
                  <>
                    <th className="py-3 px-4 font-semibold">Business Details</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Identifiers</th>
                    <th className="py-3 px-4 font-semibold">Contact & State</th>
                  </>
                )}
                {type === 'service' && (
                  <>
                    <th className="py-3 px-4 font-semibold">Service Details</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Location</th>
                    <th className="py-3 px-4 font-semibold text-right">Price</th>
                  </>
                )}
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 text-xs text-gray-700">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors h-14">
                  <td className="py-3 px-4 font-mono text-[11px] text-gray-500">#{item.id}</td>

                  {type === 'customer' && (
                    <>
                      <td className="py-3 px-4 font-semibold text-gray-900">{item.firstName} {item.lastName}</td>
                      <td className="py-3 px-4 font-medium text-gray-500">{item.phoneNumber}</td>
                      <td className="py-3 px-4">
                        {item.aadharUrl ? (
                          <button
                            onClick={() => window.open(item.aadharUrl, '_blank')}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                          >
                            <FileText size={12} /> View Document
                          </button>
                        ) : (
                          <span className="text-gray-300">No Document</span>
                        )}
                      </td>
                    </>
                  )}

                  {type === 'vendor' && (
                    <>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-gray-900 leading-normal">{item.businessName}</div>
                        <div className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{item.description}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 bg-blue-50 border border-blue-150 text-blue-700 text-[9px] font-bold rounded uppercase">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-800"><span className="text-gray-450 text-[10px] uppercase font-bold mr-1">GST:</span> {item.gstNumber || 'N/A'}</div>
                        <div className="font-medium text-gray-800"><span className="text-gray-455 text-[10px] uppercase font-bold mr-1">PAN:</span> {item.pan}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-500">
                        <div>{item.phoneNumber}</div>
                        <div className="text-[11px] text-gray-400">{item.state}</div>
                      </td>
                    </>
                  )}

                  {type === 'service' && (
                    <>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-gray-900 leading-normal">{item.name}</div>
                        <div className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{item.description}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 bg-blue-50 border border-blue-150 text-blue-700 text-[9px] font-bold rounded uppercase">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 font-medium">{item.location || 'N/A'}</td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900">₹{item.price?.toLocaleString('en-IN')}</td>
                    </>
                  )}

                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end items-center gap-1.5">
                      <button 
                        onClick={() => handleAction('approve', item.id)} 
                        disabled={actionId === item.id}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition-all"
                      >
                        {actionId === item.id ? <Loader2 size={10} className="animate-spin" /> : null} Approve
                      </button>
                      <button 
                        onClick={() => handleAction('reject', item.id)} 
                        disabled={actionId === item.id}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-red-100 transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* 3. Admin Disputes Panel Tab */
function AdminDisputesTab({ isDemoMode }) {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const [selectedDispute, setSelectedDispute] = useState(null);
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('OPEN');
  const [resolutionNote, setResolutionNote] = useState('');

  const fetchDisputes = async () => {
    /*
    if (isDemoMode) {
      setDisputes([
        {
          id: 702,
          bookingId: 504,
          status: "OPEN",
          reason: "Caterer provided different menu options than contracted.",
          raisedByUserId: 12,
          againstUserId: 45,
          resolutionNote: ""
        },
        {
          id: 703,
          bookingId: 505,
          status: "IN_REVIEW",
          reason: "DJ equipment failed halfway through sangeet event.",
          raisedByUserId: 22,
          againstUserId: 88,
          resolutionNote: "Contacted DJ provider for service credit receipt."
        }
      ]);
      setLoading(false);
      return;
    }
    */
    try {
      setLoading(true);
      const res = await apiClient.get('/api/admin/disputes');
      let dataList = [];
      const dr = res.data;
      if (dr?.data?.content && Array.isArray(dr.data.content)) dataList = dr.data.content;
      else if (dr?.data && Array.isArray(dr.data)) dataList = dr.data;
      else if (dr?.content && Array.isArray(dr.content)) dataList = dr.content;
      else if (Array.isArray(dr)) dataList = dr;
      setDisputes(dataList);
    } catch (err) {
      toast.error("Failed to load disputes moderated queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolveDispute = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;
    if (isDemoMode) {
      setActionId(selectedDispute.id);
      setTimeout(() => {
        toast.success("Dispute status updated successfully (Demo Mode)");
        setDisputes(prev => prev.map(d => d.id === selectedDispute.id ? { ...d, status: newStatus, resolutionNote } : d));
        setIsResolutionModalOpen(false);
        setSelectedDispute(null);
        setActionId(null);
      }, 500);
      return;
    }
    try {
      setActionId(selectedDispute.id);
      await apiClient.patch(`/api/admin/disputes/${selectedDispute.id}/status`, {
        newStatus,
        resolutionNote
      });
      toast.success("Dispute status updated successfully");
      setIsResolutionModalOpen(false);
      setSelectedDispute(null);
      fetchDisputes();
    } catch (err) {
      toast.error("Failed to update dispute status");
    } finally {
      setActionId(null);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'OPEN': return 'bg-red-100 text-red-700 border-red-200';
      case 'IN_REVIEW': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'RESOLVED': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Platform Disputes</h1>
        <p className="text-xs text-gray-500 font-semibold">Moderate, update statuses, or release refunds for escrow disputations raised by users.</p>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse"><div className="h-32 bg-gray-50 border rounded-2xl" /></div>
      ) : disputes.length === 0 ? (
        <div className="text-center py-16 bg-gray-50/50 border border-gray-150 rounded-3xl">
          <Scale className="text-gray-300 mx-auto mb-3" size={40} />
          <h3 className="text-base font-bold text-gray-800">Clear queue!</h3>
          <p className="text-xs text-gray-500 mt-1">No dispute mediation cases pending action.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider font-semibold border-b border-gray-200">
                <th className="py-3.5 px-4 font-semibold">Dispute ID</th>
                <th className="py-3.5 px-4 font-semibold">Booking ID</th>
                <th className="py-3.5 px-4 font-semibold">Conflict Reason</th>
                <th className="py-3.5 px-4 font-semibold">Involved Parties</th>
                <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 text-xs text-gray-700">
              {disputes.map(d => (
                <tr key={d.id} className="hover:bg-gray-50/50 transition-colors h-14">
                  <td className="py-3 px-4 font-mono text-[11px] text-gray-500">#{d.id}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-gray-500">#{d.bookingId}</td>
                  <td className="py-3 px-4 max-w-sm">
                    <div className="text-gray-900 leading-normal line-clamp-2">"{d.reason}"</div>
                    {d.resolutionNote && (
                      <div className="text-[10px] text-blue-600 font-semibold mt-1 flex items-center gap-1">
                        <CheckCircle size={10} /> Note: {d.resolutionNote}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-500 font-sans">
                    <div>Raised By: <span className="font-semibold text-gray-800">User #{d.raisedByUserId}</span></div>
                    <div>Against: <span className="font-semibold text-gray-800">User #{d.againstUserId}</span></div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 border text-[9px] font-bold rounded-full uppercase tracking-wider ${getStatusStyle(d.status)}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button 
                      onClick={() => {
                        setSelectedDispute(d);
                        setNewStatus(d.status);
                        setResolutionNote(d.resolutionNote || '');
                        setIsResolutionModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition-all"
                    >
                      <Settings size={12} /> Settle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Settle Dispute Dialog */}
      <Dialog open={isResolutionModalOpen} onOpenChange={setIsResolutionModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border border-gray-200">
          <DialogHeader><DialogTitle className="text-lg font-bold text-gray-900">Moderate dispute status</DialogTitle></DialogHeader>
          <form onSubmit={handleResolveDispute} className="space-y-4 mt-2">
            <div>
              <label className="text-[13px] font-medium text-gray-700 block uppercase mb-2">Set status</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-full h-12 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-150 transition-all bg-white">
                <option value="OPEN">OPEN</option>
                <option value="IN_REVIEW">IN REVIEW</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
            <div>
              <label className="text-[13px] font-medium text-gray-700 block uppercase mb-2">Resolution Summary Note *</label>
              <textarea required value={resolutionNote} onChange={e => setResolutionNote(e.target.value)} rows={4} placeholder="Summarize mediation details, blame details, or actions taken..." className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-150 transition-all resize-none" />
            </div>
            <div className="pt-2 flex justify-end gap-2.5">
              <button type="button" onClick={() => setIsResolutionModalOpen(false)} className="px-6 py-2.5 border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl text-xs font-bold bg-white transition-all hover:scale-[1.02] active:scale-[0.98]">Cancel</button>
              <button type="submit" disabled={actionId} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]">Save Resolution</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* 4. Admin Complaints Panel Tab */
function AdminComplaintsTab({ isDemoMode }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [complaintBlame, setComplaintBlame] = useState('VENDOR_FAULT'); // VENDOR_FAULT, CUSTOMER_FAULT, SYSTEM_FAULT, UNDETERMINED
  const [dismissMalicious, setDismissMalicious] = useState(false);

  const fetchComplaints = async () => {
    /*
    if (isDemoMode) {
      setComplaints([
        {
          id: 1,
          bookingId: 201,
          description: "Vendor didn't show up on time for sound check and setup.",
          raisedByUserId: 1,
          againstUserId: 401,
          isAgainstUserRepeatOffender: false,
          againstUserResolvedComplaintsCount: 0,
          status: 'OPEN'
        },
        {
          id: 2,
          bookingId: 202,
          description: "Catering food quality was poor and service staff was rude.",
          raisedByUserId: 2,
          againstUserId: 402,
          isAgainstUserRepeatOffender: true,
          againstUserResolvedComplaintsCount: 3,
          status: 'RESOLVED'
        }
      ]);
      setLoading(false);
      return;
    }
    */
    try {
      setLoading(true);
      const res = await apiClient.get('/api/admin/complaints');
      setComplaints(Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
    } catch (err) {
      toast.error("Failed to load complaints moderated queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleResolveComplaintSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    if (isDemoMode) {
      setActionId(selectedComplaint.id);
      setTimeout(() => {
        toast.success("Complaint resolved successfully and Aura updated (Demo Mode).");
        setComplaints(prev => prev.map(c => c.id === selectedComplaint.id ? { ...c, status: 'RESOLVED' } : c));
        setIsComplaintModalOpen(false);
        setSelectedComplaint(null);
        setActionId(null);
      }, 500);
      return;
    }
    try {
      setActionId(selectedComplaint.id);
      await apiClient.post(`/api/admin/complaints/${selectedComplaint.id}/resolve?blame=${complaintBlame}`);
      toast.success("Complaint resolved successfully and Aura updated.");
      setIsComplaintModalOpen(false);
      setSelectedComplaint(null);
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resolve complaint");
    } finally {
      setActionId(null);
    }
  };

  const handleDismissComplaint = async (complaintId, malicious) => {
    if (isDemoMode) {
      setActionId(complaintId);
      setTimeout(() => {
        toast.success(`Complaint dismissed successfully ${malicious ? 'as malicious' : ''} (Demo Mode)`);
        setComplaints(prev => prev.filter(c => c.id !== complaintId));
        setIsComplaintModalOpen(false);
        setSelectedComplaint(null);
        setActionId(null);
      }, 500);
      return;
    }
    try {
      setActionId(complaintId);
      await apiClient.post(`/api/admin/complaints/${complaintId}/dismiss?malicious=${malicious}`);
      toast.success(`Complaint dismissed successfully ${malicious ? 'as malicious' : ''}`);
      setIsComplaintModalOpen(false);
      setSelectedComplaint(null);
      fetchComplaints();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to dismiss complaint");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">User Complaints Panel</h1>
        <p className="text-xs text-gray-500 font-semibold">Review official reports filed against providers, assign blame points, and trigger automatic Aura deductions.</p>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse"><div className="h-32 bg-gray-50 border rounded-2xl" /></div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-16 bg-gray-50/50 border border-gray-150 rounded-3xl">
          <ShieldAlert className="text-gray-300 mx-auto mb-3" size={40} />
          <h3 className="text-base font-bold text-gray-800">Clear queue!</h3>
          <p className="text-xs text-gray-500 mt-1">No pending customer complaint logs raised.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider font-semibold border-b border-gray-200">
                <th className="py-3.5 px-4 font-semibold">Complaint ID</th>
                <th className="py-3.5 px-4 font-semibold">Booking ID</th>
                <th className="py-3.5 px-4 font-semibold">Description</th>
                <th className="py-3.5 px-4 font-semibold">Involved Parties</th>
                <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 text-xs text-gray-700">
              {complaints.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors h-14">
                  <td className="py-3 px-4 font-mono text-[11px] text-gray-500">#{c.id}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-gray-500">#{c.bookingId}</td>
                  <td className="py-3 px-4 max-w-sm">
                    <div className="text-gray-900 leading-normal line-clamp-2">"{c.description}"</div>
                    {c.isAgainstUserRepeatOffender && (
                      <div className="text-[10px] text-red-500 font-extrabold tracking-wide mt-1">
                        ⚠️ REPEAT OFFENDER ({c.againstUserResolvedComplaintsCount} cases)
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-500 font-sans">
                    <div>Raised By: <span className="font-semibold text-gray-800">User #{c.raisedByUserId}</span></div>
                    <div>Against: <span className="font-semibold text-gray-800">User #{c.againstUserId}</span></div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 border text-[9px] font-bold rounded-full uppercase tracking-wider ${c.status === 'OPEN' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {c.status === 'OPEN' ? (
                      <button 
                        onClick={() => {
                          setSelectedComplaint(c);
                          setComplaintBlame('VENDOR_FAULT');
                          setIsComplaintModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition-all"
                      >
                        <ShieldAlert size={12} /> Resolve
                      </button>
                    ) : (
                      <span className="text-gray-400 font-bold">Resolved</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Settle Complaint Dialog */}
      <Dialog open={isComplaintModalOpen} onOpenChange={setIsComplaintModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border border-gray-200">
          <DialogHeader><DialogTitle className="text-lg font-bold text-gray-955">Resolve Complaint Report</DialogTitle></DialogHeader>
          <form onSubmit={handleResolveComplaintSubmit} className="space-y-4 mt-2">
            <div>
              <label className="text-[13px] font-medium text-gray-700 block uppercase mb-2">Assign Blame Party</label>
              <select value={complaintBlame} onChange={e => setComplaintBlame(e.target.value)} className="w-full h-12 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-150 transition-all bg-white">
                <option value="VENDOR_FAULT">Vendor Fault (Deduct Vendor Aura)</option>
                <option value="CUSTOMER_FAULT">Customer Fault (Deduct Customer Aura)</option>
                <option value="SYSTEM_FAULT">System Fault</option>
                <option value="UNDETERMINED">Undetermined</option>
              </select>
            </div>
            <div className="flex gap-2.5 pt-4">
              <button type="submit" disabled={actionId} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]">Submit Resolution</button>
              <button type="button" onClick={() => handleDismissComplaint(selectedComplaint.id, dismissMalicious)} disabled={actionId} className="flex-1 py-3 border-2 border-gray-200 hover:border-gray-300 text-gray-750 rounded-xl text-xs font-bold bg-white transition-all hover:scale-[1.02] active:scale-[0.98]">Dismiss Complaint</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* 5. Admin Aura Logs Audit Trail Tab */
function AdminAuraLogsTab({ isDemoMode }) {
  const [auditTrail, setAuditTrail] = useState([]);
  const [searchUserId, setSearchUserId] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAuraLogs = async () => {
    /*
    if (isDemoMode) {
      setLoading(true);
      setTimeout(() => {
        const mockLogs = [
          {
            id: 1,
            userId: 401,
            actionRole: 'VENDOR',
            amount: 50.0,
            previousAura: 630.5,
            newAura: 680.5,
            ruleApplied: 'VERIFIED_VENDOR_BONUS',
            description: 'Bonus points awarded for submitting government-approved GST/PAN documents.',
            createdAt: new Date().toISOString()
          },
          {
            id: 2,
            userId: 1,
            actionRole: 'CLIENT',
            amount: 15.5,
            previousAura: 500.0,
            newAura: 515.5,
            ruleApplied: 'BOOKING_COMPLETED_SUCCESS',
            description: 'Earned aura for successfully finishing event sangeet ceremony booking.',
            createdAt: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 3,
            userId: 402,
            actionRole: 'VENDOR',
            amount: -100.0,
            previousAura: 500.0,
            newAura: 400.0,
            ruleApplied: 'COMPLAINT_UPHELD_DEDUCTION',
            description: 'Aura deducted as blame was assigned to vendor for service failure report.',
            createdAt: new Date(Date.now() - 7200000).toISOString()
          }
        ];
        if (searchUserId.trim()) {
          setAuditTrail(mockLogs.filter(tx => tx.userId.toString() === searchUserId.trim()));
        } else {
          setAuditTrail(mockLogs);
        }
        setLoading(false);
      }, 300);
      return;
    }
    */
    try {
      setLoading(true);
      const url = searchUserId.trim() 
        ? `/api/admin/aura/user/${searchUserId.trim()}`
        : '/api/admin/aura/audit-trail';
      const res = await apiClient.get(url);
      setAuditTrail(Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []));
    } catch (err) {
      toast.error("Failed to load Aura log databases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuraLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight font-sans">Aura Logs audit</h1>
        <p className="text-xs text-gray-500 font-semibold">Inspect credit/debit logs of users Aura ratings transactions history.</p>
      </div>

      <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row gap-3">
        <input 
          type="number" 
          placeholder="Filter logs by User ID..." 
          value={searchUserId} 
          onChange={e => setSearchUserId(e.target.value)} 
          className="flex-1 h-12 px-4 py-3 border border-gray-200 rounded-xl text-xs font-semibold outline-none bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-150 transition-all"
        />
        <div className="flex gap-2 shrink-0">
          <button onClick={fetchAuraLogs} className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]">Search</button>
          <button onClick={() => { setSearchUserId(''); setTimeout(fetchAuraLogs, 100); }} className="h-12 px-6 border-2 border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl text-xs font-bold bg-white transition-all hover:scale-[1.02] active:scale-[0.98]">Clear</button>
        </div>
      </div>

      {loading ? (
        <div className="h-44 bg-gray-50 border border-gray-200 rounded-xl animate-pulse" />
      ) : auditTrail.length === 0 ? (
        <p className="text-xs text-gray-400 font-semibold italic text-center py-10">No aura records matching filter.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider font-semibold border-b border-gray-200">
                <th className="py-3.5 px-6 font-semibold">ID</th>
                <th className="py-3.5 px-6 font-semibold">User</th>
                <th className="py-3.5 px-6 font-semibold">Delta</th>
                <th className="py-3.5 px-6 font-semibold">Previous → New</th>
                <th className="py-3.5 px-6 font-semibold">Reason Rule</th>
                <th className="py-3.5 px-6 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 text-xs text-gray-700">
              {auditTrail.map(tx => (
                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors h-14 border-b border-gray-100 last:border-0">
                  <td className="px-6 py-4 text-gray-400 font-bold">#{tx.id}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-800">User #{tx.userId}</span>
                    <span className="ml-1.5 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[9px] border font-bold">{tx.actionRole}</span>
                  </td>
                  <td className={`px-6 py-4 font-extrabold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-650'}`}>
                    {tx.amount >= 0 ? `+${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-gray-450">{tx.previousAura?.toFixed(1) || '500.0'} → {tx.newAura?.toFixed(1) || '500.0'}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-800">{tx.ruleApplied}</div>
                    <div className="text-[10px] text-gray-450 mt-0.5 leading-normal">{tx.description}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-450 whitespace-nowrap">{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
