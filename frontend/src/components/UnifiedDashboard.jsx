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
  ChevronLeft, ChevronRight, Bell, Sparkles
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
              {sidebarExpanded && <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-3">Planning Core</span>}
              <SidebarNavItem active={activeTab === 'overview'} expanded={sidebarExpanded} icon={<LayoutGrid size={18} />} label="Home" onClick={() => handleSetTab('overview')} />
              <SidebarNavItem active={activeTab === 'events'} expanded={sidebarExpanded} icon={<CalendarDays size={18} />} label="My Events" onClick={() => handleSetTab('events')} />
              <SidebarNavItem active={activeTab === 'timeline'} expanded={sidebarExpanded} icon={<Map size={18} />} label="Timeline" onClick={() => handleSetTab('timeline')} />
              <SidebarNavItem active={activeTab === 'tasks'} expanded={sidebarExpanded} icon={<CheckCircle size={18} />} label="Tasks" onClick={() => handleSetTab('tasks')} />

              {sidebarExpanded && <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4 mb-1.5 px-3">Vendors & Budget</span>}
              <SidebarNavItem active={activeTab === 'vendors'} expanded={sidebarExpanded} icon={<Users size={18} />} label="Vendors" onClick={() => handleSetTab('vendors')} />
              <SidebarNavItem active={activeTab === 'bookings'} expanded={sidebarExpanded} icon={<FileText size={18} />} label="Bookings" onClick={() => handleSetTab('bookings')} />
              <SidebarNavItem active={activeTab === 'budget'} expanded={sidebarExpanded} icon={<IndianRupee size={18} />} label="Budget" onClick={() => handleSetTab('budget')} />

              {sidebarExpanded && <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4 mb-1.5 px-3">Collaboration</span>}
              <SidebarNavItem active={activeTab === 'messages'} expanded={sidebarExpanded} icon={<MessageSquare size={18} />} label="Messages" onClick={() => handleSetTab('messages')} />
              <SidebarNavItem active={activeTab === 'documents'} expanded={sidebarExpanded} icon={<Briefcase size={18} />} label="Documents" onClick={() => handleSetTab('documents')} />
              <SidebarNavItem active={activeTab === 'analytics'} expanded={sidebarExpanded} icon={<Activity size={18} />} label="Analytics" onClick={() => handleSetTab('analytics')} />

              {sidebarExpanded && <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4 mb-1.5 px-3">Platform</span>}
              <SidebarNavItem active={activeTab === 'cancellation'} expanded={sidebarExpanded} icon={<ShieldAlert size={18} />} label="Cancellation Center" onClick={() => handleSetTab('cancellation')} highlighted={true} />
              <SidebarNavItem active={activeTab === 'notifications'} expanded={sidebarExpanded} icon={<Bell size={18} />} label="Notifications" onClick={() => handleSetTab('notifications')} />
              <SidebarNavItem active={activeTab === 'settings'} expanded={sidebarExpanded} icon={<Settings size={18} />} label="Settings" onClick={() => handleSetTab('settings')} />
            </>
          )}

          {/* Vendor Workspace Sidebar */}
          {workspaceMode === 'vendor' && (
            <>
              {sidebarExpanded && <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">Business Core</span>}
              <SidebarNavItem active={activeTab === 'overview'} expanded={sidebarExpanded} icon={<Activity size={18} />} label="Dashboard" onClick={() => handleSetTab('overview')} />
              <SidebarNavItem active={activeTab === 'vendor-bookings'} expanded={sidebarExpanded} icon={<CreditCard size={18} />} label="Bookings" onClick={() => handleSetTab('vendor-bookings')} />
              <SidebarNavItem active={activeTab === 'services'} expanded={sidebarExpanded} icon={<Server size={18} />} label="Services" onClick={() => handleSetTab('services')} />
              <SidebarNavItem active={activeTab === 'calendar'} expanded={sidebarExpanded} icon={<CalendarDays size={18} />} label="Calendar" onClick={() => handleSetTab('calendar')} />

              {sidebarExpanded && <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-4 mb-2 px-3">Finance & Growth</span>}
              <SidebarNavItem active={activeTab === 'earnings'} expanded={sidebarExpanded} icon={<IndianRupee size={18} />} label="Earnings" onClick={() => handleSetTab('earnings')} />
              <SidebarNavItem active={activeTab === 'customers'} expanded={sidebarExpanded} icon={<Users size={18} />} label="Customers" onClick={() => handleSetTab('customers')} />
              <SidebarNavItem active={activeTab === 'analytics'} expanded={sidebarExpanded} icon={<Activity size={18} />} label="Analytics" onClick={() => handleSetTab('analytics')} />

              {sidebarExpanded && <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-4 mb-2 px-3">Collaboration</span>}
              <SidebarNavItem active={activeTab === 'messages'} expanded={sidebarExpanded} icon={<MessageSquare size={18} />} label="Messages" onClick={() => handleSetTab('messages')} />
              <SidebarNavItem active={activeTab === 'reviews'} expanded={sidebarExpanded} icon={<Star size={18} />} label="Reviews" onClick={() => handleSetTab('reviews')} />
              <SidebarNavItem active={activeTab === 'documents'} expanded={sidebarExpanded} icon={<FileText size={18} />} label="Documents" onClick={() => handleSetTab('documents')} />

              {sidebarExpanded && <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-4 mb-2 px-3">Preferences</span>}
              <SidebarNavItem active={activeTab === 'availability'} expanded={sidebarExpanded} icon={<Clock size={18} />} label="Availability" onClick={() => handleSetTab('availability')} />
              <SidebarNavItem active={activeTab === 'settings'} expanded={sidebarExpanded} icon={<Settings size={18} />} label="Settings" onClick={() => handleSetTab('settings')} />
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
                    {activeTab === 'timeline' && <TimelineTab isDemoMode={isDemoMode} />}
                    {activeTab === 'tasks' && <KanbanTasksTab isDemoMode={isDemoMode} />}
                    {activeTab === 'vendors' && <VendorsMarketplaceTab isDemoMode={isDemoMode} setTab={handleSetTab} />}
                    {activeTab === 'bookings' && <BookingsTab customerProfile={displayProfile} user={displayUser} isDemoMode={isDemoMode} />}
                    {activeTab === 'budget' && <BudgetCenterTab isDemoMode={isDemoMode} />}
                    {activeTab === 'messages' && <MessagesHubTab isDemoMode={isDemoMode} />}
                    {activeTab === 'documents' && <DocumentVaultTab isDemoMode={isDemoMode} />}
                    {activeTab === 'analytics' && <AnalyticsMinimalTab isDemoMode={isDemoMode} />}
                    {activeTab === 'cancellation' && <CancellationCenterTab isDemoMode={isDemoMode} />}
                    {activeTab === 'notifications' && <NotificationsInboxTab isDemoMode={isDemoMode} />}
                    {activeTab === 'settings' && (
                      <div className="space-y-8">
                        <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm">
                          <h2 className="text-xl font-bold text-gray-900 mb-2">Workspace Settings</h2>
                          <p className="text-xs text-gray-500 font-semibold mb-6">Manage your payment cards, wallet disbursements, and profile preferences.</p>
                          <WalletTab user={displayUser} isDemoMode={isDemoMode} />
                        </div>
                        <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm">
                          <h3 className="text-sm font-bold text-gray-800 mb-4">Disputes & Incident Logs</h3>
                          <DisputesTab user={displayUser} isDemoMode={isDemoMode} />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {workspaceMode === 'vendor' && (
                  <>
                    {activeTab === 'overview' && <VendorOverviewTab customerProfile={displayProfile} setTab={handleSetTab} isDemoMode={isDemoMode} />}
                    {activeTab === 'services' && <VendorServicesTab customerProfile={displayProfile} setTab={handleSetTab} isDemoMode={isDemoMode} />}
                    {activeTab === 'vendor-bookings' && <VendorBookingsTab customerProfile={displayProfile} setTab={handleSetTab} isDemoMode={isDemoMode} />}
                    {activeTab === 'calendar' && <VendorCalendarTab setTab={handleSetTab} isDemoMode={isDemoMode} />}
                    {activeTab === 'earnings' && <VendorEarningsTab setTab={handleSetTab} isDemoMode={isDemoMode} />}
                    {activeTab === 'customers' && <VendorCustomersTab setTab={handleSetTab} isDemoMode={isDemoMode} />}
                    {activeTab === 'messages' && <VendorMessagesTab setTab={handleSetTab} isDemoMode={isDemoMode} />}
                    {activeTab === 'reviews' && <VendorReviewsTab setTab={handleSetTab} isDemoMode={isDemoMode} />}
                    {activeTab === 'documents' && <VendorDocumentsTab setTab={handleSetTab} isDemoMode={isDemoMode} />}
                    {activeTab === 'analytics' && <VendorAnalyticsTab setTab={handleSetTab} isDemoMode={isDemoMode} />}
                    {activeTab === 'availability' && <VendorAvailabilityTab setTab={handleSetTab} isDemoMode={isDemoMode} />}
                    {activeTab === 'settings' && <VendorSettingsTab customerProfile={displayProfile} refreshUser={refreshUser} setTab={handleSetTab} isDemoMode={isDemoMode} />}
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

      <FloatingAICopilot isDemoMode={isDemoMode} workspaceMode={workspaceMode} />
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
function SidebarNavItem({ active, expanded, icon, label, onClick, highlighted = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 relative hover:scale-[1.01] active:scale-[0.99] ${
        active 
          ? highlighted
            ? 'text-rose-800 font-bold bg-rose-100/40 border border-rose-200 shadow-sm'
            : 'text-blue-750 font-bold' 
          : highlighted
            ? 'text-rose-700 bg-rose-50/20 border border-rose-100/30 hover:bg-rose-100/30 hover:border-rose-200 hover:text-rose-800 glow-shadow-rose'
            : 'text-slate-650 hover:bg-white/25 hover:text-slate-900'
      }`}
    >
      {active && !highlighted && (
        <motion.div 
          layoutId="activeSidebarTab"
          className="absolute inset-0 bg-white/60 backdrop-blur-md border border-white/80 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.02)]"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <span className={`relative z-10 transition-colors ${active ? highlighted ? 'text-rose-600' : 'text-blue-600' : highlighted ? 'text-rose-500' : 'text-slate-400'}`}>{icon}</span>
      {expanded && <span className="relative z-10 truncate">{label}</span>}
      {expanded && highlighted && (
        <span className="relative z-10 ml-auto px-1.5 py-0.5 bg-rose-500 text-white rounded-md text-[8px] font-black uppercase tracking-wider animate-pulse shadow-sm">USP</span>
      )}
      {active && expanded && !highlighted && (
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
   ===========================================================/* 1. Client Overview Tab */
function ClientOverviewTab({ customerProfile, setTab, isDemoMode }) {
  const [stats, setStats] = useState({ events: 0, bookings: 0, disputes: 0, wallet: 0 });
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventTasks, setEventTasks] = useState({});
  const [activeEventId, setActiveEventId] = useState(null);
  const [eventBudgets, setEventBudgets] = useState({});
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [newBudgetLimit, setNewBudgetLimit] = useState("");

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
      setStats({
        events: 3,
        bookings: 3,
        disputes: 1,
        wallet: 15450
      });
      setEvents([
        { id: 101, title: "Anjali's Sangeet Ceremony", startDate: "2026-11-12T18:00:00", status: "CONFIRMED", budget: 300000, category: "SANGEET" },
        { id: 102, title: "Corporate Product Launch 2026", startDate: "2026-08-20T09:00:00", status: "PENDING_BOOKING", budget: 500000, category: "CORPORATE" },
        { id: 103, title: "Outdoor Birthday Bash", startDate: "2026-07-05T16:00:00", status: "DRAFT", budget: 100000, category: "BIRTHDAY" }
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
          tasks = JSON.parse(stored);
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

  // Sync state on Copilot storage update
  useEffect(() => {
    const handleStorageUpdate = () => {
      const budgets = {};
      events.forEach(e => {
        const stored = localStorage.getItem(`planit_budget_${e.id}`);
        budgets[e.id] = stored ? parseFloat(stored) : (e.budget || 200000);
      });
      setEventBudgets(budgets);

      const newEventTasks = {};
      events.forEach(event => {
        const stored = localStorage.getItem(`planit_tasks_${event.id}`);
        let tasks = [];
        if (stored) {
          try {
            tasks = JSON.parse(stored);
          } catch (e) {}
        }
        newEventTasks[event.id] = tasks;
      });
      setEventTasks(newEventTasks);
    };

    window.addEventListener('planit_storage_update', handleStorageUpdate);
    return () => window.removeEventListener('planit_storage_update', handleStorageUpdate);
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

  const countdownDays = useMemo(() => {
    if (!activeEvent) return 0;
    const target = new Date(activeEvent.startDate);
    const diff = target.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [activeEvent, today]);

  // Event health calculation
  const healthScore = useMemo(() => {
    if (!activeEvent) return 100;
    let score = 100;
    
    // Budget health (if over budget, deduct points)
    if (totalSpend > totalBudget) {
      score -= 20;
    } else if (totalSpend > totalBudget * 0.9) {
      score -= 10;
    }
    
    // Task completion health
    const taskRatio = activeTasks.length > 0 ? (activeTasks.filter(t => t.isCompleted).length / activeTasks.length) : 1;
    if (taskRatio < 0.25) score -= 15;
    else if (taskRatio < 0.5) score -= 10;
    else if (taskRatio < 0.75) score -= 5;

    // Vendor status health (check confirmed bookings vs total bookings)
    const pendingBookings = activeBookings.filter(b => b.status === 'PENDING').length;
    if (pendingBookings > 0) score -= (pendingBookings * 5);

    return Math.max(10, score);
  }, [activeEvent, activeTasks, activeBookings, totalSpend, totalBudget]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Compute days matrix
  const daysArray = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevDaysInMonth = new Date(prevYear, prevMonth + 1, 0).getDate();

    const arr = [];
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      arr.push({ day: prevDaysInMonth - i, isCurrentMonth: false, month: prevMonth, year: prevYear });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      arr.push({ day: i, isCurrentMonth: true, month: currentMonth, year: currentYear });
    }
    const remaining = 42 - arr.length;
    for (let i = 1; i <= remaining; i++) {
      arr.push({ day: i, isCurrentMonth: false, month: currentMonth === 11 ? 0 : currentMonth + 1, year: currentMonth === 11 ? currentYear + 1 : currentYear });
    }
    return arr;
  }, [currentMonth, currentYear]);

  // Combined events & tasks agenda scan
  const getDayAgendaPreview = (dayObj) => {
    if (!dayObj) return { events: [], tasks: [] };
    const dateStr = `${dayObj.year}-${String(dayObj.month + 1).padStart(2, '0')}-${String(dayObj.day).padStart(2, '0')}`;
    const filteredEvents = activeEvent && activeEvent.startDate.substring(0, 10) === dateStr ? [activeEvent] : [];
    const dayTasks = activeTasks.filter(t => t.dueDate === dateStr);
    return { events: filteredEvents, tasks: dayTasks };
  };

  const getDayDetails = (dayObj) => {
    if (!dayObj) return { hasEvent: false, hasTask: false, eventStatus: null, eventsList: [], tasksList: [] };
    const { events: dayEvents, tasks: dayTasks } = getDayAgendaPreview(dayObj);
    return {
      hasEvent: dayEvents.length > 0,
      hasTask: dayTasks.length > 0,
      eventStatus: dayEvents.length > 0 ? (dayEvents[0].status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING') : null,
      eventsList: dayEvents,
      tasksList: dayTasks
    };
  };

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
    setSelectedDay(dayObj.day);
    if (dayObj.month !== currentMonth) {
      setCurrentMonth(dayObj.month);
      setCurrentYear(dayObj.year);
    }
  };

  const agendaItems = useMemo(() => {
    const selectedDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    const dayEvents = events.filter(ev => ev.id === activeEventId && ev.startDate.substring(0, 10) === selectedDateStr).map(ev => ({
      id: ev.id,
      type: 'event',
      time: new Date(ev.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: ev.title,
      desc: ev.address ? ev.address.split(',')[0] : "Venue Schedule",
      status: ev.status
    }));
    const dayTasks = activeTasks.filter(t => t.dueDate === selectedDateStr).map(t => ({
      id: t.id,
      type: 'task',
      time: "Due",
      title: t.taskName,
      desc: t.taskDescription || "Milestone Action Checklist",
      priority: t.priority,
      isCompleted: t.isCompleted
    }));
    return [...dayEvents, ...dayTasks];
  }, [selectedDay, events, activeTasks, currentMonth, currentYear, activeEventId]);

  return (
    <div className="space-y-8 font-sans">
      {/* OS Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-150/40 pb-4">
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Workspace Console</span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            Welcome Back, {customerProfile?.firstName || 'Planner'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {events.length > 0 && (
            <div className="flex items-center gap-2 bg-white/40 border border-white/60 px-3 py-1.5 rounded-xl shadow-sm">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Project:</span>
              <select 
                value={activeEventId || ""} 
                onChange={(e) => setActiveEventId(parseFloat(e.target.value))}
                className="bg-transparent border-0 text-xs font-bold text-gray-800 focus:ring-0 cursor-pointer pr-8 py-0"
              >
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>
          )}
          <button onClick={() => setTab('events')} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-xl text-xs font-extrabold transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md shadow-blue-500/10">
            + New Event
          </button>
        </div>
      </div>

      {loading || !activeEvent ? (
        <div className="h-64 bg-white/40 border border-white/60 rounded-3xl animate-pulse flex items-center justify-center text-xs text-gray-400">
          Loading Active Event Operating Console...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Column (Col-span 8) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 1. Hero Event Card */}
            <div className="bg-gradient-to-tr from-slate-900 via-slate-950 to-indigo-950 text-white rounded-3xl p-8 relative overflow-hidden shadow-xl border border-white/5">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -z-10" />
              <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl -z-10" />
              
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                  <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] font-black tracking-widest rounded-full uppercase">
                    {activeEvent.category || 'EVENT'} • ACTIVE OS WORKSPACE
                  </span>
                  <h2 className="text-2xl md:text-3xl font-extrabold mt-3 tracking-tight">{activeEvent.title}</h2>
                  <p className="text-slate-400 text-xs mt-1.5 font-medium">
                    Scheduled on {new Date(activeEvent.startDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                
                {/* Countdown */}
                <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl px-5 py-3 text-center shrink-0">
                  <div className="text-3xl font-black tracking-tight text-white">{countdownDays}</div>
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">days left</div>
                </div>
              </div>

              {/* Stats metrics inside one card */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-white/10 text-xs font-semibold text-slate-300">
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Project Progress</span>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${getEventProgress(activeEvent.id)}%` }} />
                    </div>
                    <span className="font-extrabold text-white text-[11px]">{getEventProgress(activeEvent.id)}%</span>
                  </div>
                </div>

                <div onClick={() => { setNewBudgetLimit(totalBudget.toString()); setShowBudgetModal(true); }} className="cursor-pointer hover:bg-white/5 p-1 rounded-xl transition-all" title="Click to update budget limit">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Budget Consumption ✏️</span>
                  <span className="text-white text-sm font-extrabold block mt-1">
                    ₹{totalSpend.toLocaleString('en-IN')} <span className="text-[10px] text-slate-450 font-normal">/ ₹{totalBudget.toLocaleString('en-IN')}</span>
                  </span>
                </div>

                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Tasks Ratio</span>
                  <span className="text-white text-sm font-extrabold block mt-1">
                    {activeTasks.filter(t => t.isCompleted).length} <span className="text-[10px] text-slate-450 font-normal">/ {activeTasks.length} Completed</span>
                  </span>
                </div>

                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Hired Gigs</span>
                  <span className="text-white text-sm font-extrabold block mt-1">
                    {activeBookings.filter(b => b.status === 'CONFIRMED').length} Confirmed <span className="text-[10px] text-slate-450 font-normal">({activeBookings.filter(b => b.status === 'PENDING').length} Pending)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Smart Action Center */}
            <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm">
              <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest mb-4">Smart Action Center</h3>
              <div className="space-y-3">
                {/* Photographer Pay */}
                <SmartActionRow 
                  priority="HIGH" 
                  category="PAYMENTS" 
                  title="Photographer deposit payment of ₹25,000 due tomorrow" 
                  actionLabel="Disburse Now" 
                  onClick={() => setTab('settings')} 
                />
                {/* Catering Awaiting */}
                <SmartActionRow 
                  priority="MEDIUM" 
                  category="APPROVALS" 
                  title="Gourmet Catering menu items pending client review selection" 
                  actionLabel="Verify Menu" 
                  onClick={() => setTab('bookings')} 
                />
                {/* Weather Warning */}
                {countdownDays <= 150 && (
                  <SmartActionRow 
                    priority="HIGH" 
                    category="WEATHER" 
                    title="Rain predicted (58% risk) for November 12 event date" 
                    actionLabel="Mitigate Risk" 
                    onClick={() => setTab('cancellation')} 
                  />
                )}
                {/* Custom Task Addition */}
                <SmartActionRow 
                  priority="LOW" 
                  category="CHECKLIST" 
                  title="Task checklist is incomplete. Build custom stage timeline priorities." 
                  actionLabel="Open Tasks" 
                  onClick={() => setTab('tasks')} 
                />
              </div>
            </div>

            {/* 3. Signature Event Health Score Component */}
            <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xs font-black text-slate-455 uppercase tracking-widest">Event Health Index</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Signature diagnostic of event coordination and readiness.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-505">Overall Rating:</span>
                  <span className={`px-2.5 py-0.5 text-white text-[10px] font-black rounded-full shadow-sm ${
                    healthScore >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-650' :
                    healthScore >= 50 ? 'bg-gradient-to-r from-amber-500 to-yellow-500' : 'bg-red-500'
                  }`}>
                    {healthScore >= 80 ? 'STABLE' : healthScore >= 50 ? 'WARNING' : 'CRITICAL'} ({healthScore}/100)
                  </span>
                </div>
              </div>

              {/* Health Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <HealthItem label="Budget Health" score={totalSpend > totalBudget ? 40 : 95} desc={totalSpend > totalBudget ? "Budget Over-spent!" : "Within constraints"} />
                <HealthItem label="Task Readiness" score={activeTasks.length > 0 ? Math.round((activeTasks.filter(t => t.isCompleted).length / activeTasks.length) * 100) : 100} desc="Milestones check" />
                <HealthItem label="Vendor Readiness" score={activeBookings.length > 0 ? Math.round((activeBookings.filter(b => b.status === 'CONFIRMED').length / activeBookings.length) * 100) : 100} desc="Hires confirmation" />
                <HealthItem label="Escrow Payments" score={stats.wallet > 10000 ? 98 : 60} desc="Funds reservation" />
                <HealthItem label="Timeline Slippage" score={92} desc="On track scheduling" />
                <HealthItem label="Weather Risk" score={countdownDays <= 150 ? 55 : 98} desc={countdownDays <= 150 ? "58% Rain Probability" : "Clear Sky forecast"} />
              </div>
            </div>

          </div>

          {/* Right Sidebar Column (Col-span 4) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Merged smart calendar / scheduling widget */}
            <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm">
              <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest mb-4 flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <button onClick={handlePrevMonth} className="p-1 hover:bg-white/60 hover:text-gray-900 rounded-lg text-gray-400 transition-colors">
                    <ChevronLeft size={14} />
                  </button>
                  <span className="min-w-[95px] text-center text-slate-700 font-bold">{monthNames[currentMonth]} {currentYear}</span>
                  <button onClick={handleNextMonth} className="p-1 hover:bg-white/60 hover:text-gray-900 rounded-lg text-gray-400 transition-colors">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </h3>

              {/* Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {weekDays.map(wd => (
                  <div key={wd} className="text-slate-450 font-bold py-1 text-[10px]">{wd}</div>
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

                      {/* Dots */}
                      <div className="absolute bottom-0.5 flex gap-0.5 justify-center items-center">
                        {details.hasEvent && (
                          <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500 shadow-sm'}`} />
                        )}
                        {details.hasTask && (
                          <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500 shadow-sm'}`} />
                        )}
                      </div>

                      {/* Tooltip */}
                      {hoveredDay === idx && (details.hasEvent || details.hasTask) && (
                        <div className="absolute bottom-9 left-1/2 -translate-x-1/2 w-48 bg-slate-900 text-white text-[10px] p-2.5 rounded-xl shadow-xl z-50 pointer-events-none backdrop-blur-sm border border-white/10 space-y-1">
                          <div className="font-extrabold border-b border-white/15 pb-1 text-[9px] text-slate-350">
                            {monthNames[day.month].substring(0, 3)} {day.day}, {day.year}
                          </div>
                          {details.eventsList.length > 0 && (
                            <div className="truncate font-semibold text-slate-200">• {details.eventsList[0].title}</div>
                          )}
                          {details.tasksList.length > 0 && (
                            <div className="truncate text-slate-300">• {details.tasksList[0].taskName}</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Day schedules agenda details */}
              <div className="mt-5 pt-4 border-t border-gray-150/40">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Schedule • {monthNames[currentMonth]} {selectedDay}
                </h4>
                {agendaItems.length === 0 ? (
                  <p className="text-[10px] text-gray-400 italic py-2">No schedules or payments due today.</p>
                ) : (
                  <div className="space-y-2.5">
                    {agendaItems.map((item, idindex) => (
                      <div key={idindex} className="p-2.5 bg-white/40 border border-white/50 rounded-2xl text-xs flex justify-between items-center gap-2">
                        <div>
                          <h5 className="font-bold text-gray-800">{item.title}</h5>
                          <p className="text-[9px] text-gray-450 mt-0.5">{item.desc}</p>
                        </div>
                        <span className={`px-2 py-0.5 text-[8px] font-black rounded uppercase ${
                          item.type === 'event' ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          {item.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Quick Promo box */}
            <div className="bg-gradient-to-tr from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-250/20 backdrop-blur-md rounded-3xl p-6 relative overflow-hidden">
              <h4 className="text-xs font-bold text-gray-800">Book Escrow Vendors 💼</h4>
              <p className="text-[10px] text-gray-450 mt-1.5">Hire wedding halls, DJs, sound setups, and caterers with 100% cancellation protection.</p>
              <button onClick={() => setTab('vendors')} className="mt-4 w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all hover:scale-[1.01]">
                Launch Marketplace
              </button>
            </div>

          </div>

        </div>
      )}

      {/* Budget Edit Modal Dialog */}
      <Dialog open={showBudgetModal} onOpenChange={setShowBudgetModal}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border border-gray-250 shadow-xl z-50">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">Update Event Budget Limit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Budget Limit (₹) *</label>
              <input 
                type="number" 
                value={newBudgetLimit} 
                onChange={e => setNewBudgetLimit(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-150 bg-white text-slate-850"
                placeholder="e.g. 500000"
              />
            </div>
            <div className="pt-2 flex justify-end gap-2.5">
              <button type="button" onClick={() => setShowBudgetModal(false)} className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-slate-700 rounded-xl text-xs font-bold transition-all">Cancel</button>
              <button 
                type="button" 
                onClick={() => handleUpdateBudget(newBudgetLimit)}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/15 transition-all"
              >
                Save Budget
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* Custom UI Subcomponents */
function SmartActionRow({ priority, category, title, actionLabel, onClick }) {
  return (
    <div className="p-3.5 bg-white/30 border border-white/50 hover:border-blue-200 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-all">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
          priority === 'HIGH' ? 'bg-red-50 text-red-700 border border-red-200' :
          priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-650 border border-slate-200'
        }`}>
          {priority}
        </span>
        <span className="text-[8px] bg-blue-50 text-blue-600 font-black rounded px-1.5 py-0.5 uppercase tracking-widest">{category}</span>
        <p className="text-xs font-extrabold text-slate-800 truncate" title={title}>{title}</p>
      </div>
      <button onClick={onClick} className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-[10px] font-bold shadow-sm whitespace-nowrap self-end md:self-auto">
        {actionLabel}
      </button>
    </div>
  );
}

function HealthItem({ label, score, desc }) {
  return (
    <div className="p-4 bg-white/20 border border-white/40 rounded-2xl flex flex-col justify-between shadow-sm">
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest">{label}</span>
        <span className={`text-xs font-black ${
          score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-505' : 'text-red-500'
        }`}>{score}%</span>
      </div>
      
      {/* progress bar */}
      <div className="w-full bg-slate-100 h-1 rounded-full mt-3 overflow-hidden">
        <div className={`h-full rounded-full ${
          score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'
        }`} style={{ width: `${score}%` }} />
      </div>
      
      <span className="text-[8px] text-slate-450 font-semibold mt-2 truncate block">{desc}</span>
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
   VENDOR OPERATING SYSTEM: BUSINESS CONTROL CENTER
   ============================================================================ */

/* 1. Vendor Overview Tab (Dashboard) */
function VendorOverviewTab({ customerProfile, setTab, isDemoMode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [pauseBookings, setPauseBookings] = useState(false);

  // Simulated DB state
  const vendor = {
    name: "Elite Wedding Decors",
    category: "DECORATION",
    todayRevenue: 65000,
    monthlyRevenue: 340000,
    upcomingBookings: 8,
    avgRating: 4.8,
    reviewsCount: 142,
    trustScore: 98,
    responseRate: 99,
    profileCompletion: 92,
  };

  const smartActions = [
    { id: 1, priority: "URGENT", category: "REQUESTS", title: "New booking request from Aarav Sharma (₹65,000)", action: "Confirm Order", resolve: () => setTab("vendor-bookings") },
    { id: 2, priority: "HIGH", category: "MESSAGES", title: "Neha Patel unanswered for 4 hours", action: "Open Chat", resolve: () => setTab("messages") },
    { id: 3, priority: "MEDIUM", category: "INVENTORY", title: "Low availability warning for Canopy Setup on Aug 15", action: "Add Slots", resolve: () => setTab("availability") },
    { id: 4, priority: "LOW", category: "COMPLETION", title: "Verify GST certification to increase Trust Score", action: "Upload GST", resolve: () => setTab("documents") }
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* OS Header */}
      <div className="flex justify-between items-center border-b border-gray-150/40 pb-4">
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Control Center</span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab("services")} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all hover:scale-[1.01]">
            + Add Service
          </button>
        </div>
      </div>

      {/* Hero Business Card */}
      <div className="bg-gradient-to-tr from-slate-900 via-slate-950 to-indigo-950 text-white rounded-3xl p-8 relative overflow-hidden shadow-xl border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="space-y-4">
            <div>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-black tracking-widest rounded-full uppercase">
                {vendor.category} • {isOnline ? "ONLINE" : "PAUSED"}
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight mt-3">{vendor.name}</h2>
              <p className="text-slate-400 text-xs mt-1.5 font-semibold">Welcome back, Rajesh. Your business is performing at its peak.</p>
            </div>
            
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-300">
              <div>
                <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Today's Revenue</span>
                <span className="text-white text-base font-extrabold">₹{vendor.todayRevenue.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-l border-white/10 pl-4">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Monthly Spend</span>
                <span className="text-white text-base font-extrabold">₹{vendor.monthlyRevenue.toLocaleString('en-IN')}</span>
              </div>
              <div className="border-l border-white/10 pl-4">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Trust Rating</span>
                <span className="text-white text-base font-extrabold">⭐ {vendor.avgRating} ({vendor.reviewsCount})</span>
              </div>
              <div className="border-l border-white/10 pl-4">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Aura score</span>
                <span className="text-white text-base font-extrabold">{vendor.trustScore}%</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 space-y-3 shrink-0 w-full lg:w-64 text-xs font-bold">
            <div className="flex justify-between items-center text-slate-350">
              <span>Status Availability</span>
              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {isOnline ? 'Active' : 'Offline'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button onClick={() => { setIsOnline(!isOnline); toast.success(isOnline ? "Status: Offline" : "Status: Online"); }} className="py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-center transition-all">
                {isOnline ? "Go Offline" : "Go Online"}
              </button>
              <button onClick={() => { setPauseBookings(!pauseBookings); toast.success(pauseBookings ? "Bookings Resumed" : "Bookings Paused"); }} className="py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-center transition-all">
                {pauseBookings ? "Resume" : "Pause"}
              </button>
            </div>
            <button onClick={() => setTab("settings")} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-center shadow-md shadow-blue-500/10 transition-all">
              Edit Business Details
            </button>
          </div>
        </div>
      </div>

      {/* Smart Action Center */}
      <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm">
        <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest mb-4">Smart Action Center</h3>
        <div className="space-y-3">
          {smartActions.map(act => (
            <div key={act.id} className="p-3.5 bg-white/30 border border-white/50 hover:border-blue-200 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                  act.priority === 'URGENT' ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' :
                  act.priority === 'HIGH' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-650 border border-slate-200'
                }`}>
                  {act.priority}
                </span>
                <span className="text-[8px] bg-blue-50 text-blue-600 font-black rounded px-1.5 py-0.5 uppercase tracking-widest">{act.category}</span>
                <p className="text-xs font-extrabold text-slate-800 truncate">{act.title}</p>
              </div>
              <button onClick={act.resolve} className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold shadow-sm whitespace-nowrap self-end md:self-auto transition-all">
                {act.action}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Performance grid metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Response Velocity</span>
          <div className="text-2xl font-black text-slate-800 tracking-tight mt-4">8.5 min</div>
          <span className="text-[8px] text-emerald-600 font-extrabold mt-2 block">✓ 99% within 10 minutes</span>
        </div>
        <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Profile Completeness</span>
          <div className="text-2xl font-black text-slate-800 tracking-tight mt-4">{vendor.profileCompletion}%</div>
          <span className="text-[8px] text-slate-400 font-bold mt-2 block">Add certificates to hit 100%</span>
        </div>
        <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">On-Time Arrival Rate</span>
          <div className="text-2xl font-black text-slate-800 tracking-tight mt-4">100%</div>
          <span className="text-[8px] text-emerald-600 font-extrabold mt-2 block">✓ Perfect attendance record</span>
        </div>
      </div>
    </div>
  );
}

/* 2. Vendor Bookings Tab */
function VendorBookingsTab({ customerProfile, setTab, isDemoMode }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("ALL");
  const [bookings, setBookings] = useState([]);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBookings = async () => {
    if (isDemoMode) {
      setVendorProfile({ id: 401, businessName: "Elite Wedding Decors" });
      setBookings([
        { id: 601, clientName: "Aarav Sharma", customerId: 10, type: "Wedding Reception", startDt: "2026-11-12T18:00:00", endDt: "2026-11-12T23:59:00", bookingAmount: 65000, services: { category: "DECORATION", name: "Fairytale Canopy Flower Setup" }, status: "PENDING", payment: "IN_ESCROW" },
        { id: 602, clientName: "Neha Patel", customerId: 11, type: "Haldi Ceremony", startDt: "2026-08-15T10:00:00", endDt: "2026-08-15T16:00:00", bookingAmount: 18000, services: { category: "DECORATION", name: "Minimalist Boho Haldi Decor" }, status: "CONFIRMED", payment: "IN_ESCROW" },
        { id: 603, clientName: "Rajesh Kapoor", customerId: 12, type: "Sangeet Ceremony", startDt: "2026-07-05T17:00:00", endDt: "2026-07-05T22:00:00", bookingAmount: 120000, services: { category: "DECORATION", name: "Modern Glass Aisle & Chandeliers" }, status: "CONFIRMED", payment: "DISBURSED" }
      ]);
      setLoading(false);
      return;
    }

    if (!customerProfile?.id) return;
    try {
      setLoading(true);
      const vendorRes = await apiClient.get(`/api/vendor/customer/${customerProfile.id}`);
      const vProfile = vendorRes.data?.data || vendorRes.data;
      setVendorProfile(vProfile);

      if (vProfile?.id) {
        const bookingsRes = await apiClient.get(`/api/vendor/bookings/${vProfile.id}?page=0&size=100`);
        const dataList = bookingsRes.data?.data?.content || bookingsRes.data?.content || [];
        setBookings(dataList);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load vendor bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [customerProfile]);

  const handleUpdateStatus = async (bookingId, action) => {
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
    if (action === 'ACCEPT') endpoint = `/api/bookings/${bookingId}/accept`;
    else if (action === 'REJECT') endpoint = `/api/bookings/${bookingId}/reject`;
    else if (action === 'CANCEL') endpoint = `/api/bookings/${bookingId}/cancel/vendor`;

    try {
      setActionLoading(true);
      const res = await apiClient.post(endpoint);
      const updated = res.data?.data || res.data;
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: updated.status } : b));
      toast.success(`Booking marked ${action.toLowerCase()}ed.`);
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to alter booking status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    if (!newDate) return;
    setBookings(prev => prev.map(b => b.id === selectedBooking.id ? { ...b, startDt: newDate + "T10:00:00" } : b));
    toast.success(`Rescheduled booking to ${newDate}`);
    setShowReschedule(false);
  };

  const handleStartChat = async (customerId) => {
    if (isDemoMode) {
      toast.success("Opening chat channel (Demo Mode)...");
      if (setTab) setTab("messages");
      return;
    }
    try {
      const res = await apiClient.post('/api/chat/conversations', { customerId });
      const conv = res.data?.data || res.data;
      navigate(`/chats?id=${conv.id}`);
    } catch (err) {
      toast.error("Failed to open chat conversation");
    }
  };

  const filtered = filter === "ALL" ? bookings : bookings.filter(b => b.status === filter);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Control</span>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">Booking Center</h1>
        </div>
        <div className="flex gap-1.5 bg-white/40 p-1 rounded-xl border border-white/60">
          {["ALL", "PENDING", "CONFIRMED", "CANCELLED"].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${filter === s ? 'bg-white text-blue-600 shadow-sm border border-white/10' : 'text-slate-500 hover:text-slate-800'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2].map(n => <div key={n} className="h-44 bg-gray-50 rounded-3xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white/40 border border-white/60 rounded-3xl">
          <CreditCard className="text-slate-300 mx-auto mb-3" size={40} />
          <h3 className="text-base font-bold text-slate-800">No bookings found</h3>
          <p className="text-xs text-slate-500 mt-1">Bookings matching this filter will populate here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(b => (
            <div key={b.id} className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm hover:scale-[1.01] transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-start">
                  <span className={`px-2 py-0.5 border rounded-full text-[8px] font-black uppercase tracking-wider ${
                    b.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    b.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {b.status}
                  </span>
                  <span className="text-sm font-black text-slate-900">₹{b.bookingAmount.toLocaleString('en-IN')}</span>
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm mt-3">{b.services?.name || b.pkg}</h3>
                <p className="text-slate-500 text-[11px] mt-1 font-semibold">{b.clientName} • {b.type}</p>
                <div className="text-[10px] text-slate-500 mt-3 space-y-1 bg-white/30 p-2.5 rounded-xl border border-white/20">
                  <div>📅 Date: <strong className="text-slate-700">{new Date(b.startDt).toLocaleDateString()}</strong></div>
                  <div className="truncate">📍 Location: <strong className="text-slate-700">{b.location || 'Mumbai, IN'}</strong></div>
                  <div>💳 Escrow Payout: <strong className="text-slate-700">{b.payment?.replace(/_/g, ' ') || 'SECURED'}</strong></div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2">
                <button onClick={() => { setSelectedBooking(b); setShowModal(true); }} className="flex-1 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-[10px] font-bold transition-all">Details</button>
                <button onClick={() => handleStartChat(b.customerId)} className="px-3 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold hover:bg-blue-100 transition-all">Chat</button>
                {b.status === "PENDING" && (
                  <>
                    <button onClick={() => handleUpdateStatus(b.id, 'ACCEPT')} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold transition-all">Accept</button>
                    <button onClick={() => handleUpdateStatus(b.id, 'REJECT')} className="px-3 py-2 bg-rose-50 text-rose-700 rounded-xl text-[10px] font-bold hover:bg-rose-100 transition-all">Reject</button>
                  </>
                )}
                {b.status === "CONFIRMED" && (
                  <>
                    <button onClick={() => { setSelectedBooking(b); setNewDate(b.startDt.substring(0, 10)); setShowReschedule(true); }} className="px-2.5 py-2 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-bold hover:bg-slate-200 transition-all">Reschedule</button>
                    <button onClick={() => handleUpdateStatus(b.id, 'CANCEL')} className="px-2.5 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-bold hover:bg-rose-100 transition-all">Cancel</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border border-gray-200">
          <DialogHeader><DialogTitle className="text-base font-bold text-gray-900">Booking Summary</DialogTitle></DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 text-xs font-semibold text-gray-600">
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 space-y-1">
                <span className="text-[8px] text-blue-700 font-black uppercase tracking-wider block">Customer Details</span>
                <div>Name: <strong className="text-gray-800">{selectedBooking.clientName}</strong></div>
                {selectedBooking.clientEmail && <div>Email: <strong className="text-gray-850">{selectedBooking.clientEmail}</strong></div>}
                {selectedBooking.clientPhone && <div>Phone: <strong className="text-gray-850">{selectedBooking.clientPhone}</strong></div>}
              </div>
              <div className="grid grid-cols-2 gap-3 text-slate-500">
                <div className="bg-gray-50/50 p-2.5 border rounded-xl">
                  <span className="text-[8px] block uppercase">Booking ID</span>
                  <span className="text-gray-800 font-extrabold">#{selectedBooking.id}</span>
                </div>
                <div className="bg-gray-50/50 p-2.5 border rounded-xl">
                  <span className="text-[8px] block uppercase">Escrow Standing</span>
                  <span className="text-gray-800 font-extrabold uppercase">{selectedBooking.payment}</span>
                </div>
                <div className="bg-gray-50/50 p-2.5 border rounded-xl col-span-2">
                  <span className="text-[8px] block uppercase">Timings Slot</span>
                  <span className="text-gray-800 font-bold block">{new Date(selectedBooking.startDt).toLocaleString()} - {new Date(selectedBooking.endDt).toLocaleString()}</span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setShowModal(false); handleStartChat(selectedBooking.customerId); }} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-500/10">Chat Customer</button>
                <button onClick={() => setShowModal(false)} className="px-4 py-2.5 bg-gray-100 rounded-xl text-gray-700 font-bold">Close</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={showReschedule} onOpenChange={setShowReschedule}>
        <DialogContent className="sm:max-w-sm bg-white rounded-3xl p-6 border border-gray-250">
          <DialogHeader><DialogTitle className="text-sm font-bold text-gray-900">Reschedule Booking</DialogTitle></DialogHeader>
          <form onSubmit={handleRescheduleSubmit} className="space-y-4">
            <div>
              <label className="text-[9px] font-bold text-gray-400 block uppercase mb-1">Proposed New Date</label>
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} required className="w-full px-4 py-2 border rounded-xl text-sm" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs">Confirm Date</button>
              <button type="button" onClick={() => setShowReschedule(false)} className="px-4 py-2.5 bg-gray-100 rounded-xl text-xs text-gray-700 font-bold">Cancel</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* 3. Vendor Services Tab */
function VendorServicesTab({ customerProfile, setTab, isDemoMode }) {
  const [services, setServices] = useState([]);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [tempPrice, setTempPrice] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  
  const [formData, setFormData] = useState({ name: "", description: "", price: "", category: "", location: "" });
  const [availableLocations, setAvailableLocations] = useState([{ city: "", state: "" }]);
  const [mapContainer, setMapContainer] = useState(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  const mapRefCallback = (el) => {
    if (el) setMapContainer(el);
  };

  const fetchServices = async () => {
    if (isDemoMode) {
      setVendorProfile({ id: 401, businessName: "Elite Wedding Decors", category: "DECORATION" });
      setServices([
        { id: 1, name: "Fairytale Canopy Flower Setup", category: "DECORATION", price: 65000, bookings: 42, popularity: 98, status: "ONLINE", image: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80&w=300&auto=format&fit=crop" },
        { id: 2, name: "Minimalist Boho Haldi Decor", category: "DECORATION", price: 18000, bookings: 28, popularity: 88, status: "ONLINE", image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=300&auto=format&fit=crop" },
        { id: 3, name: "Modern Glass Aisle & Chandeliers", category: "DECORATION", price: 120000, bookings: 12, popularity: 92, status: "PAUSED", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300&auto=format&fit=crop" }
      ]);
      setLoading(false);
      return;
    }

    if (!customerProfile?.id) return;
    try {
      setLoading(true);
      const vendorRes = await apiClient.get(`/api/vendor/customer/${customerProfile.id}`);
      const vendor = vendorRes.data?.data || vendorRes.data;
      setVendorProfile(vendor);

      if (vendor?.id) {
        const servicesRes = await apiClient.get(`/api/vendor/services/${vendor.id}?page=0&size=100`);
        const content = servicesRes.data?.data?.content || servicesRes.data?.content || [];
        // Map backend properties to unified frontend structure
        const mapped = content.map(s => ({
          ...s,
          bookings: s.bookingsCount || Math.floor(Math.random() * 30) + 5,
          popularity: s.popularityScore || Math.floor(Math.random() * 20) + 80,
          status: s.isAvailable === false ? "PAUSED" : "ONLINE",
          image: s.photos?.[0] || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=300&auto=format&fit=crop"
        }));
        setServices(mapped);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load catalog services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [customerProfile]);

  const handleToggleStatus = (id) => {
    setServices(services.map(s => s.id === id ? { ...s, status: s.status === 'ONLINE' ? 'PAUSED' : 'ONLINE' } : s));
    toast.success("Service availability status updated.");
  };

  const handleDuplicate = (s) => {
    const dup = { ...s, id: Date.now(), name: `${s.name} (Copy)` };
    setServices([...services, dup]);
    toast.success("Catalog item duplicated.");
  };

  const handleDelete = (id) => {
    setServices(services.filter(s => s.id !== id));
    toast.success("Service catalog item deleted.");
  };

  const handleSavePrice = (id) => {
    const pr = parseFloat(tempPrice);
    if (isNaN(pr) || pr <= 0) return;
    setServices(services.map(s => s.id === id ? { ...s, price: pr } : s));
    setEditingId(null);
    toast.success("Price updated successfully!");
  };

  const handleAddServiceSubmit = async (e) => {
    e.preventDefault();
    if (isDemoMode) {
      setFormLoading(true);
      setTimeout(() => {
        const newService = {
          id: Date.now(),
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category || "DECORATION",
          location: formData.location || "Mumbai",
          bookings: 0,
          popularity: 90,
          status: "ONLINE",
          image: photos[0] || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=300&auto=format&fit=crop"
        };
        setServices([newService, ...services]);
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
      toast.success("Service submitted for verification!");
      setShowAddForm(false);
      setFormData({ name: '', description: '', price: '', category: '', location: '' });
      setAvailableLocations([{ city: '', state: '' }]);
      setPhotos([]);
      fetchServices();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit service creation request");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center border-b border-gray-150/40 pb-4">
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Catalog</span>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">Listed Gigs</h1>
        </div>
        <button onClick={() => setShowAddForm(true)} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 hover:scale-[1.01] transition-all">
          + Add New Service
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(n => <div key={n} className="h-56 bg-gray-50 rounded-3xl" />)}
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-16 bg-white/40 border border-white/60 rounded-3xl">
          <Server className="text-slate-350 mx-auto mb-3" size={40} />
          <h3 className="text-base font-bold text-slate-800">No services listed yet</h3>
          <p className="text-xs text-slate-500 mt-1">Start by adding your first catalog service gig above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(s => (
            <div key={s.id} className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-all">
              <div>
                <div className="h-40 relative">
                  <img src={s.image} alt={s.name} className="w-full h-full object-cover" />
                  <span className={`absolute top-3.5 left-3.5 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                    s.status === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400 backdrop-blur-md border border-emerald-500/30' : 'bg-rose-500/20 text-rose-450 backdrop-blur-md border border-rose-500/30'
                  }`}>
                    {s.status}
                  </span>
                  <span className="absolute top-3.5 right-3.5 px-2 py-0.5 bg-slate-900/70 backdrop-blur-md text-white text-[7px] font-black rounded-full uppercase tracking-widest">
                    SCORE: {s.popularity}%
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <span className="text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.2 rounded border border-blue-100 font-black uppercase tracking-widest">{s.category}</span>
                    <h3 className="font-extrabold text-slate-800 text-sm mt-2 leading-tight h-10 line-clamp-2">{s.name}</h3>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold border-t border-white/20 pt-3">
                    <span>Booked: <strong>{s.bookings} times</strong></span>
                    {editingId === s.id ? (
                      <div className="flex items-center gap-1">
                        <input type="number" value={tempPrice} onChange={e => setTempPrice(e.target.value)} className="w-16 pl-2 h-7 border rounded bg-white text-slate-850 outline-none" />
                        <button onClick={() => handleSavePrice(s.id)} className="p-1 bg-emerald-500 text-white rounded"><Check size={10} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-900 font-black text-xs">₹{s.price.toLocaleString('en-IN')}</span>
                        <button onClick={() => { setTempPrice(s.price.toString()); setEditingId(s.id); }} className="p-1 hover:bg-white text-slate-455 hover:text-blue-650 rounded border border-slate-100" title="Edit Price"><Edit size={10} /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 flex gap-2">
                <button onClick={() => handleToggleStatus(s.id)} className="flex-1 py-2 border hover:bg-white text-slate-700 rounded-xl text-[10px] font-bold transition-all">
                  {s.status === 'ONLINE' ? 'Pause' : 'Activate'}
                </button>
                <button onClick={() => handleDuplicate(s)} className="px-3 py-2 bg-white border text-slate-700 rounded-xl text-[10px] font-bold transition-all" title="Duplicate">
                  ⚡ Copy
                </button>
                <button onClick={() => handleDelete(s.id)} className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-650 rounded-xl border border-rose-100" title="Delete">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto bg-white rounded-3xl p-6 border border-gray-200 custom-scrollbar">
          <DialogHeader><DialogTitle className="text-lg font-bold text-gray-900">List New Service Gig</DialogTitle></DialogHeader>
          <form onSubmit={handleAddServiceSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-bold text-gray-400 block uppercase mb-1">Service Title *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 h-10 border rounded-xl text-xs" placeholder="Wedding Canopy Stage Decor" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-gray-400 block uppercase mb-1">Price (₹) *</label>
                <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-3 py-2 h-10 border rounded-xl text-xs" placeholder="65000" />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-bold text-gray-400 block uppercase mb-1">Description *</label>
              <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-3 py-2 border rounded-xl text-xs resize-none" placeholder="Provide service inclusions, duration, dimensions..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-bold text-gray-400 block uppercase mb-1">Category *</label>
                <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 h-10 border rounded-xl text-xs">
                  <option value="">Select Category</option>
                  <option value="DECORATION">Decoration</option>
                  <option value="CATERING">Catering</option>
                  <option value="VENUE">Venue</option>
                  <option value="PHOTOGRAPHY">Photography</option>
                  <option value="MUSIC">Music & Sound</option>
                  <option value="MAKEUP">Makeup Artist</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-bold text-gray-400 block uppercase mb-1">Base Location</label>
                <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-3 py-2 h-10 border rounded-xl text-xs" placeholder="Mumbai, Juhu" />
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-2 border-t">
              <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 border rounded-xl text-xs text-gray-650 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={formLoading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold">
                {formLoading ? "Listing..." : "Submit Service"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* 4. Vendor Calendar Tab */
function VendorCalendarTab({ setTab, isDemoMode }) {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [blockedDates, setBlockedDates] = useState(["2026-07-15", "2026-08-01"]);
  const [vacationMode, setVacationMode] = useState(false);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Mock Calendar events matching active bookings
  const calendarBookings = [
    { date: "2026-07-05", client: "Rajesh Kapoor", pkg: "Modern Glass Aisle Decor", status: "CONFIRMED", amount: 120000 },
    { date: "2026-08-15", client: "Neha Patel", pkg: "Haldi Flower Setup", status: "CONFIRMED", amount: 18000 },
    { date: "2026-11-12", client: "Aarav Sharma", pkg: "Fairytale Canopy Setup", status: "PENDING", amount: 65000 }
  ];

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 0) { setCurrentYear(y => y - 1); return 11; }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 11) { setCurrentYear(y => y + 1); return 0; }
      return prev + 1;
    });
  };

  const daysArray = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const arr = [];
    // Previous month cells
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      arr.push({ day: new Date(currentYear, currentMonth, 0).getDate() - i, isCurrent: false, month: currentMonth === 0 ? 11 : currentMonth - 1, year: currentMonth === 0 ? currentYear - 1 : currentYear });
    }
    // Current month cells
    for (let i = 1; i <= daysInMonth; i++) {
      arr.push({ day: i, isCurrent: true, month: currentMonth, year: currentYear });
    }
    // Next month cells
    const remaining = 42 - arr.length;
    for (let i = 1; i <= remaining; i++) {
      arr.push({ day: i, isCurrent: false, month: currentMonth === 11 ? 0 : currentMonth + 1, year: currentMonth === 11 ? currentYear + 1 : currentYear });
    }
    return arr;
  }, [currentMonth, currentYear]);

  const handleToggleBlock = (dayObj) => {
    const dateStr = `${dayObj.year}-${String(dayObj.month + 1).padStart(2, '0')}-${String(dayObj.day).padStart(2, '0')}`;
    setBlockedDates(prev =>
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    );
    toast.success(`Date ${dateStr} status updated`);
  };

  // Find events on selected date
  const selectedDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  const dayBookings = calendarBookings.filter(b => b.date === selectedDateStr);
  const isDateBlocked = blockedDates.includes(selectedDateStr) || vacationMode;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Availability Scheduler</span>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">Calendar Control</h1>
        </div>
        <div className="flex items-center gap-3 bg-white/40 border border-white/60 p-2.5 rounded-2xl shrink-0">
          <span className="text-xs font-bold text-slate-600">🌴 Vacation Mode</span>
          <button 
            type="button" 
            onClick={() => { setVacationMode(!vacationMode); toast.success(vacationMode ? "Vacation mode deactivated" : "Vacation mode activated. Booking disabled."); }}
            className={`w-10 h-6 rounded-full transition-all relative flex items-center p-0.5 ${vacationMode ? 'bg-red-500' : 'bg-slate-200'}`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-all transform ${vacationMode ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Core grid */}
        <div className="lg:col-span-2 bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-extrabold text-slate-800 text-base">{monthNames[currentMonth]} {currentYear}</h2>
            <div className="flex gap-1.5">
              <button onClick={handlePrevMonth} className="p-2 bg-white border border-slate-100 hover:bg-slate-50 text-slate-700 rounded-xl transition-all"><ChevronLeft size={14} /></button>
              <button onClick={handleNextMonth} className="p-2 bg-white border border-slate-100 hover:bg-slate-50 text-slate-700 rounded-xl transition-all"><ChevronRight size={14} /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2.5 mb-2.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {weekDays.map(w => <div key={w}>{w}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {daysArray.map((cell, idx) => {
              const cellDateStr = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
              const hasBooking = calendarBookings.find(b => b.date === cellDateStr);
              const isBlocked = blockedDates.includes(cellDateStr) || vacationMode;
              const isSelected = cell.isCurrent && cell.day === selectedDay;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (cell.isCurrent) setSelectedDay(cell.day);
                  }}
                  onDoubleClick={() => handleToggleBlock(cell)}
                  className={`h-16 rounded-2xl flex flex-col justify-between p-2.5 transition-all text-left relative overflow-hidden group ${
                    !cell.isCurrent ? 'opacity-30' : ''
                  } ${
                    isSelected ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' : 'bg-white/50 hover:bg-white border border-white/40'
                  }`}
                >
                  <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-700'}`}>{cell.day}</span>
                  <div className="flex gap-1 items-center justify-end mt-2">
                    {hasBooking && (
                      <span className={`w-2 h-2 rounded-full ${
                        hasBooking.status === 'CONFIRMED' ? 'bg-emerald-500' : 'bg-amber-400'
                      }`} title={hasBooking.pkg} />
                    )}
                    {isBlocked && (
                      <span className="w-2 h-2 rounded-full bg-rose-505 bg-red-400" title="Blocked" />
                    )}
                  </div>
                  {isBlocked && (
                    <div className="absolute inset-0 bg-red-500/5 pointer-events-none border-b-2 border-red-500/20" />
                  )}
                </button>
              );
            })}
          </div>
          <span className="text-[9px] font-bold text-slate-450 block mt-4">💡 Tip: Double-click any date cell to block/unblock slots availability.</span>
        </div>

        {/* Selected date agenda details */}
        <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="border-b pb-3.5 mb-4">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Selected Day Agenda</span>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight mt-1">{selectedDay} {monthNames[currentMonth]}</h2>
              <span className="text-[10px] text-slate-500 font-semibold block mt-1.5">
                Status: <strong className={isDateBlocked ? 'text-red-500' : 'text-emerald-500'}>{isDateBlocked ? 'Blocked (Unavailable)' : 'Open (Available)'}</strong>
              </span>
            </div>

            {dayBookings.length === 0 ? (
              <div className="py-12 text-center">
                <Calendar className="text-slate-300 mx-auto mb-3" size={32} />
                <h4 className="text-xs font-bold text-slate-700">No events scheduled</h4>
                <p className="text-[10px] text-slate-455 mt-1 leading-relaxed">There are no client bookings scheduled for this date.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dayBookings.map((b, i) => (
                  <div key={i} className="bg-white border rounded-2xl p-4 space-y-2.5">
                    <div className="flex justify-between items-start">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        b.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>{b.status}</span>
                      <span className="text-xs font-extrabold text-slate-850">₹{b.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs">{b.pkg}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Client: {b.client}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-4 border-t">
            <button 
              onClick={() => handleToggleBlock({ year: currentYear, month: currentMonth, day: selectedDay })}
              className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              {isDateBlocked ? "Unblock Availability" : "Block Selected Date"}
            </button>
            <button onClick={() => { if (setTab) setTab("vendor-bookings"); }} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 transition-all">
              Go To Bookings Tab
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 5. Vendor Earnings Center */
function VendorEarningsTab({ isDemoMode }) {
  const earningsData = {
    today: 65000,
    weekly: 83000,
    monthly: 340000,
    pending: 110000,
    completedPayouts: 230000,
    upcomingSettlements: 65050,
    topService: "Fairytale Canopy Flower Setup",
    taxPan: "ABCDE1234F",
    taxGstin: "27ABCDE1234F1Z5"
  };

  const serviceBreakdown = [
    { name: "Fairytale Canopy Flower Setup", share: 65, amount: 221000 },
    { name: "Minimalist Boho Haldi Decor", share: 20, amount: 68000 },
    { name: "Modern Glass Aisle & Chandeliers", share: 15, amount: 51000 }
  ];

  const payouts = [
    { id: "TXN-8821", date: "2026-06-25", amount: 65000, status: "COMPLETED", bank: "HDFC Bank (**** 8129)" },
    { id: "TXN-8819", date: "2026-06-18", amount: 18000, status: "COMPLETED", bank: "HDFC Bank (**** 8129)" },
    { id: "TXN-8799", date: "2026-06-05", amount: 120000, status: "COMPLETED", bank: "HDFC Bank (**** 8129)" }
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Control</span>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">Earnings Center</h1>
        </div>
        <span className="text-xs font-bold text-slate-500">Stripe Account: Connected</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Today's Earnings", value: `₹${earningsData.today.toLocaleString('en-IN')}`, desc: "Active today", bg: "bg-blue-600 text-white shadow-blue-500/10" },
          { label: "Weekly Earnings", value: `₹${earningsData.weekly.toLocaleString('en-IN')}`, desc: "Past 7 days", bg: "bg-white/40 text-slate-800 border" },
          { label: "Monthly Earnings", value: `₹${earningsData.monthly.toLocaleString('en-IN')}`, desc: "June performance", bg: "bg-white/40 text-slate-800 border" },
          { label: "Pending Payments", value: `₹${earningsData.pending.toLocaleString('en-IN')}`, desc: "Held in escrow", bg: "bg-amber-50 text-amber-700 border border-amber-250" },
          { label: "Completed Payouts", value: `₹${earningsData.completedPayouts.toLocaleString('en-IN')}`, desc: "Disbursed to bank", bg: "bg-white/40 text-slate-800 border" },
          { label: "Next Settlement", value: `₹${earningsData.upcomingSettlements.toLocaleString('en-IN')}`, desc: "ETA: June 30", bg: "bg-emerald-50 text-emerald-700 border border-emerald-250" }
        ].map((c, i) => (
          <div key={i} className={`p-4 rounded-2xl shadow-sm flex flex-col justify-between h-28 ${c.bg}`}>
            <span className="text-[9px] font-black uppercase tracking-wider opacity-80">{c.label}</span>
            <div>
              <div className="text-base font-black tracking-tight">{c.value}</div>
              <span className="text-[8px] font-bold block mt-1 opacity-60">{c.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest mb-4">Revenue Trend (Weekly)</h3>
            <div className="h-44 w-full relative flex items-end">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M 0,25 C 20,22 40,8 60,12 C 80,18 100,5 120,5 L 100,30 L 0,30 Z" fill="url(#chartGrad)" />
                <path d="M 0,25 C 20,22 40,8 60,12 C 80,18 100,5 120,5" fill="none" stroke="#2563EB" strokeWidth="1.2" />
              </svg>
            </div>
          </div>
          <div className="flex justify-between items-center text-[9px] font-black text-slate-400 mt-2 px-1">
            <span>WK 22</span>
            <span>WK 23</span>
            <span>WK 24</span>
            <span>WK 25</span>
            <span>TODAY</span>
          </div>
        </div>

        <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest">Share by Gig</h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">Top performing: <strong className="text-slate-700">{earningsData.topService}</strong></p>
          </div>
          <div className="space-y-3">
            {serviceBreakdown.map((s, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-750">
                  <span className="truncate max-w-[150px]">{s.name}</span>
                  <span>{s.share}% (₹{s.amount.toLocaleString('en-IN')})</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${s.share}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm">
          <h3 className="text-xs font-black text-slate-455 uppercase tracking-widest mb-4">Payouts Ledger</h3>
          <div className="space-y-2.5">
            {payouts.map(p => (
              <div key={p.id} className="p-3 bg-white/50 border border-slate-100 rounded-2xl flex justify-between items-center text-xs">
                <div>
                  <span className="font-mono text-slate-500 text-[10px] block">{p.id} • {p.date}</span>
                  <span className="font-bold text-slate-700 block mt-0.5">{p.bank}</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900 block">₹{p.amount.toLocaleString('en-IN')}</span>
                  <span className="text-[9px] text-emerald-600 font-black tracking-wide block uppercase mt-0.5">{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest mb-3">GST & Tax Summary</h3>
            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">Verify compliance statuses to ensure seamless bank payouts and avoid tax settlements holds.</p>
          </div>
          <div className="space-y-2 text-xs pt-4 border-t border-white/20">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-400">PAN ID</span>
              <span className="text-slate-800 font-bold uppercase">{earningsData.taxPan}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-slate-400">GSTIN</span>
              <span className="text-slate-800 font-bold uppercase">{earningsData.taxGstin}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-slate-400">Status</span>
              <span className="text-emerald-600 font-black uppercase text-[10px]">Verified Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 6. Vendor Customers Tab */
function VendorCustomersTab({ isDemoMode }) {
  const [customers, setCustomers] = useState([
    { name: "Aarav Sharma", events: 3, spend: 185000, rating: 5, favorite: "Fairytale Canopy Flower Setup", photo: "AS" },
    { name: "Neha Patel", events: 2, spend: 36000, rating: 4.8, favorite: "Minimalist Boho Haldi Decor", photo: "NP" },
    { name: "Rajesh Kapoor", events: 1, spend: 120000, rating: 5, favorite: "Modern Glass Aisle & Chandeliers", photo: "RK" }
  ]);

  const handleQuickActions = (client, action) => {
    toast.success(`${action} action triggered for ${client}`);
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CRM Directory</span>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">My Customers</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((c, idx) => (
          <div key={idx} className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-all space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center font-black text-base shadow-md shadow-indigo-500/10">
                {c.photo}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-base leading-tight">{c.name}</h3>
                <span className="text-[9px] font-bold text-indigo-650 block uppercase mt-0.5">⭐ {c.rating} Rating given</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 space-y-1 border-t border-white/20 pt-3">
              <div className="flex justify-between"><span>Completed Events:</span> <strong className="text-slate-700">{c.events}</strong></div>
              <div className="flex justify-between"><span>Total Billing:</span> <strong className="text-slate-900">₹{c.spend.toLocaleString('en-IN')}</strong></div>
              <div className="flex justify-between items-center">
                <span>Fav Service:</span> 
                <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[8px] font-bold rounded truncate max-w-[120px]">{c.favorite}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20 text-[10px] font-bold">
              <button onClick={() => handleQuickActions(c.name, "Chat")} className="py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-center">Chat</button>
              <button onClick={() => handleQuickActions(c.name, "Call")} className="py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-center">Call Client</button>
              <button onClick={() => handleQuickActions(c.name, "Invoice")} className="py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-center col-span-2">Send Custom Invoice</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 7. Vendor Messages Tab */
function VendorMessagesTab({ setTab, isDemoMode }) {
  const [conversations, setConversations] = useState([
    { id: 1, name: "Aarav Sharma", role: "Client", lastMsg: "Please confirm timings for the canopy flow.", unread: true, pinned: true },
    { id: 2, name: "Neha Patel", role: "Client", lastMsg: "The floral arrangements were beautiful. Thank you!", unread: false, pinned: false },
    { id: 3, name: "Platform Admin Support", role: "Admin", lastMsg: "PAN document verified successfully.", unread: false, pinned: true }
  ]);
  const [selectedId, setSelectedId] = useState(1);
  const [msgInput, setMsgInput] = useState("");
  const [messages, setMessages] = useState([
    { sender: "client", text: "Hello, regarding the booking on Aug 15: is flowers prep included?", time: "10:15 AM" },
    { sender: "vendor", text: "Yes Aarav, the florist drapes, orchids, and setups are fully included in the catalog price.", time: "10:20 AM" },
    { sender: "client", text: "Perfect! Please confirm timings for the canopy flow.", time: "10:22 AM" }
  ]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    setMessages([...messages, { sender: "vendor", text: msgInput, time: "Just Now" }]);
    setMsgInput("");
    toast.success("Message sent");
  };

  const selectedConv = conversations.find(c => c.id === selectedId);

  return (
    <div className="bg-white/45 backdrop-blur-md border border-white/60 rounded-3xl overflow-hidden shadow-sm h-[500px] flex font-sans">
      <div className="w-56 border-r border-slate-150 flex flex-col justify-between shrink-0 bg-white/20">
        <div className="p-4 border-b">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Conversations</span>
          <h2 className="text-base font-bold text-slate-800 tracking-tight mt-0.5">Inbox</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`w-full p-3 rounded-2xl text-left transition-all text-xs relative flex flex-col gap-1 ${
                c.id === selectedId ? 'bg-white shadow-sm border border-slate-100 text-slate-900' : 'text-slate-500 hover:bg-white/40'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="font-extrabold text-slate-800">{c.name}</span>
                <span className="text-[8px] bg-slate-100 px-1 py-0.2 rounded border font-black uppercase text-slate-500">{c.role}</span>
              </div>
              <p className="text-[10px] truncate w-full opacity-80">{c.lastMsg}</p>
              {c.unread && <span className="absolute top-3 right-3 w-1.5 h-1.5 bg-blue-600 rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between bg-white/10 h-full">
        <div className="p-4 border-b bg-white/40 flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">{selectedConv?.name}</h3>
            <p className="text-[9px] text-slate-455 font-bold uppercase tracking-wider">{selectedConv?.role} Chat Channel</p>
          </div>
          <span className="px-2 py-0.5 bg-emerald-105 text-emerald-700 text-[8px] rounded border border-emerald-200 font-black uppercase">Secure Escrow Shield</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === 'vendor' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-2xl max-w-[75%] leading-relaxed text-xs font-semibold shadow-[0_2px_10px_rgba(0,0,0,0.01)] ${
                m.sender === 'vendor' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border text-slate-700 rounded-tl-none'
              }`}>
                <p>{m.text}</p>
                <span className={`text-[8px] block mt-1.5 opacity-60 text-right ${m.sender === 'vendor' ? 'text-white' : 'text-slate-400'}`}>{m.time}</span>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="p-4 border-t bg-white/40 flex gap-2">
          <input
            type="text"
            value={msgInput}
            onChange={e => setMsgInput(e.target.value)}
            placeholder="Type your message, attach files..."
            className="flex-1 px-4 py-2 border rounded-xl text-xs outline-none bg-white text-slate-800 focus:border-blue-500"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all font-sans">Send</button>
        </form>
      </div>
    </div>
  );
}

/* 8. Airbnb-style Reviews Center */
function VendorReviewsTab({ isDemoMode }) {
  const [reviews, setReviews] = useState([
    { id: 901, client: "Aarav Sharma", rating: 5, date: "2026-06-15", comment: "Absolutely stunning canopy design! Rajesh and the team were highly professional and completed it on time.", reply: "", sentiment: "POSITIVE" },
    { id: 902, client: "Neha Patel", rating: 4.8, date: "2026-06-01", comment: "Beautiful orchids flower layouts for Haldi, loved the color harmony. Recommended!", reply: "", sentiment: "POSITIVE" }
  ]);
  const [replyInputs, setReplyInputs] = useState({});

  const handleAIResponse = (id, clientName, comment) => {
    const text = `Hi ${clientName.split(' ')[0]}, thank you so much for your kind words! We loved decorating your event and are thrilled you liked the setup. Looking forward to working with you again! - Rajesh`;
    setReplyInputs({ ...replyInputs, [id]: text });
    toast.success("AI reply suggested!");
  };

  const handlePostReply = (id) => {
    const txt = replyInputs[id];
    if (!txt?.trim()) return;
    setReviews(reviews.map(r => r.id === id ? { ...r, reply: txt } : r));
    setReplyInputs({ ...replyInputs, [id]: "" });
    toast.success("Reply posted successfully!");
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-150/40 pb-4 gap-3">
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Airbnb Aesthetic</span>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">Reviews Feed</h1>
        </div>
        <div className="flex gap-4 text-xs font-bold text-slate-655 shrink-0">
          <div>Avg Rating: <strong className="text-slate-800">⭐ 4.9</strong></div>
          <div className="border-l pl-4">Trust Score: <strong className="text-indigo-650">98%</strong></div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-[9px] font-black text-slate-500 uppercase tracking-wider">
        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full">✓ 98% Love Punctuality</span>
        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full">✓ 95% High Quality Setup</span>
        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full">⚠️ Avg Response: 8m</span>
      </div>

      <div className="space-y-4">
        {reviews.map(r => (
          <div key={r.id} className="bg-white/40 border border-white/60 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">{r.client}</h4>
                <span className="text-[9px] text-slate-400 block mt-0.5">Reviewed: {r.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900">⭐ {r.rating}</span>
                <span className="text-[8px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold px-1.5 py-0.2 rounded uppercase tracking-wider">Positive Sentiment</span>
              </div>
            </div>

            <p className="text-xs font-medium text-slate-650 italic leading-relaxed font-sans">"{r.comment}"</p>

            {r.reply && (
              <div className="bg-blue-50/50 p-4 border border-blue-100/50 rounded-2xl ml-4 space-y-1">
                <span className="text-[8px] text-blue-600 font-black uppercase tracking-widest block">My Response</span>
                <p className="text-xs font-semibold text-slate-700">{r.reply}</p>
              </div>
            )}

            {!r.reply && (
              <div className="space-y-3 pt-3 border-t border-white/20">
                <textarea
                  value={replyInputs[r.id] || ""}
                  onChange={e => setReplyInputs({ ...replyInputs, [r.id]: e.target.value })}
                  placeholder="Draft response to this customer review..."
                  rows={2}
                  className="w-full p-3 border rounded-xl text-xs bg-white text-slate-850 outline-none"
                />
                <div className="flex justify-end gap-2 text-[10px] font-bold">
                  <button onClick={() => handleAIResponse(r.id, r.client, r.comment)} className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-xl shadow-sm flex items-center gap-1">✨ AI Draft Suggestion</button>
                  <button onClick={() => handlePostReply(r.id)} className="px-4 py-2 bg-white border text-slate-705 rounded-xl hover:bg-slate-50">Post Reply</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* 9. Documents Vault Tab */
function VendorDocumentsTab({ isDemoMode }) {
  const [docs, setDocs] = useState([
    { name: "Business License Certificate", type: "PDF", size: "2.4 MB", status: "VERIFIED" },
    { name: "PAN Verification Card Document", type: "PDF", size: "1.1 MB", status: "VERIFIED" },
    { name: "GSTIN Tax Alignment Certificate", type: "PDF", size: "3.2 MB", status: "VERIFIED" },
    { name: "Corporate Office Rent Agreement", type: "PDF", size: "4.5 MB", status: "PENDING" }
  ]);

  const handleUpload = () => {
    toast.success("Document file picker triggered");
  };

  const handleDownload = (name) => {
    toast.success(`Downloading file: ${name}`);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center border-b border-gray-150/40 pb-4">
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vault Security</span>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">Documents Vault</h1>
        </div>
        <button onClick={handleUpload} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs">Upload Document</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {docs.map((d, idx) => (
          <div key={idx} className="bg-white/40 border border-white/60 rounded-3xl p-5 shadow-sm flex justify-between items-center hover:scale-[1.01] transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black text-xs">
                {d.type}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm leading-tight">{d.name}</h3>
                <span className="text-[9px] text-slate-400 font-bold block mt-1">{d.size} • Status: <strong className={d.status === 'VERIFIED' ? 'text-emerald-600' : 'text-amber-500'}>{d.status}</strong></span>
              </div>
            </div>
            <button onClick={() => handleDownload(d.name)} className="p-2 border border-slate-100 rounded-xl hover:bg-white text-slate-500 hover:text-blue-600 transition-all font-sans" title="Download">
              <FileText size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 10. Vendor Analytics Tab */
function VendorAnalyticsTab({ isDemoMode }) {
  return (
    <div className="space-y-6 font-sans">
      <div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Intelligence</span>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">Performance Analytics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Revenue Growth", val: "+18.4%", desc: "vs past month performance" },
          { label: "Booking Conversion", val: "86.2%", desc: "conversions from profile view" },
          { label: "Cancellation Rate", val: "1.2%", desc: "industry average 5%" },
          { label: "Repeat Clients", val: "44.5%", desc: "rebooked past 12 months" }
        ].map((a, i) => (
          <div key={i} className="bg-white/40 border border-white/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-32">
            <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest">{a.label}</span>
            <div>
              <div className="text-2xl font-black text-slate-800 tracking-tight mt-3">{a.val}</div>
              <span className="text-[8px] font-bold text-slate-400 block mt-1">{a.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white/40 border border-white/60 rounded-3xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest">Local Juhu Market Standing</h3>
          <p className="text-[10px] text-slate-500 font-semibold mt-1">Planit rating percentile matches: <strong className="text-indigo-650">Top 3 Decorators</strong></p>
        </div>
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full" style={{ width: "92%" }} />
        </div>
      </div>
    </div>
  );
}

/* 11. Availability Buffers Tab */
function VendorAvailabilityTab({ isDemoMode }) {
  const [buffer, setBuffer] = useState("1");
  const [concurrency, setConcurrency] = useState("2");
  const [timings, setTimings] = useState([
    { day: "Monday", open: true, hours: "9:00 AM - 6:00 PM" },
    { day: "Tuesday", open: true, hours: "9:00 AM - 6:00 PM" },
    { day: "Wednesday", open: true, hours: "9:00 AM - 6:00 PM" },
    { day: "Thursday", open: true, hours: "9:00 AM - 6:00 PM" },
    { day: "Friday", open: true, hours: "9:00 AM - 6:00 PM" },
    { day: "Saturday", open: true, hours: "8:00 AM - 8:00 PM" },
    { day: "Sunday", open: false, hours: "Closed" }
  ]);

  const handleToggleDay = (idx) => {
    setTimings(timings.map((t, i) => i === idx ? { ...t, open: !t.open, hours: t.open ? "Closed" : "9:00 AM - 6:00 PM" } : t));
  };

  const handleSave = () => {
    toast.success("Buffer and concurrent settings saved");
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preference Settings</span>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">Availability Configs</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/40 border border-white/60 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest border-b pb-2">Operational Limits</h3>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Preparation buffer between events</label>
              <select value={buffer} onChange={e => setBuffer(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-white text-xs text-slate-800 outline-none">
                <option value="0">No Buffer (Back-to-back)</option>
                <option value="1">1 Day Buffer (Recommended)</option>
                <option value="2">2 Days Buffer (Complex Setups)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Max concurrent active bookings</label>
              <select value={concurrency} onChange={e => setConcurrency(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-white text-xs text-slate-800 outline-none">
                <option value="1">1 Event per day maximum</option>
                <option value="2">2 Concurrent events maximum</option>
                <option value="3">3 Concurrent events maximum</option>
              </select>
            </div>
          </div>
          <button onClick={handleSave} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs mt-4 font-sans">Save Configuration</button>
        </div>

        <div className="bg-white/40 border border-white/60 rounded-3xl p-6 shadow-sm space-y-3">
          <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest border-b pb-2">Weekly Business Hours</h3>
          <div className="space-y-2 text-xs font-semibold">
            {timings.map((t, idx) => (
              <div key={idx} className="flex justify-between items-center py-0.5">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={t.open} onChange={() => handleToggleDay(idx)} className="rounded text-blue-605 focus:ring-0" />
                  <span className={t.open ? 'text-slate-800' : 'text-slate-400'}>{t.day}</span>
                </div>
                <span className={t.open ? 'text-slate-700 font-bold' : 'text-slate-400'}>{t.hours}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* 12. Business Settings & Profile Tab */
function VendorSettingsTab({ customerProfile, refreshUser, isDemoMode }) {
  const [vendor, setVendorProfile] = useState({
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

  const handleImproveTrustClick = () => {
    toast.info("Upload GST/PAN verification file to gain Trust index credentials +15%");
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    toast.success("Business profile saved successfully!");
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Administration Control</span>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">Business Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/40 border border-white/60 rounded-3xl p-6 shadow-sm">
          <h3 className="text-xs font-black text-slate-455 uppercase tracking-widest border-b pb-3 mb-4">Registration Details</h3>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-bold text-gray-400 block uppercase mb-1">Business Brand Name</label>
                <input type="text" value={vendor.businessName} onChange={e => setVendorProfile({...vendor, businessName: e.target.value})} className="w-full px-3 py-2 h-10 border rounded-xl bg-white text-slate-800 text-xs font-semibold outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-gray-400 block uppercase mb-1">Owner / Manager Name</label>
                <input type="text" value={vendor.ownerName} onChange={e => setVendorProfile({...vendor, ownerName: e.target.value})} className="w-full px-3 py-2 h-10 border rounded-xl bg-white text-slate-800 text-xs font-semibold outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-bold text-gray-400 block uppercase mb-1">UPI Handle ID (Payouts)</label>
                <input type="text" value={vendor.upiAddress} onChange={e => setVendorProfile({...vendor, upiAddress: e.target.value})} className="w-full px-3 py-2 h-10 border rounded-xl bg-white text-slate-800 text-xs font-semibold outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-[9px] font-bold text-gray-400 block uppercase mb-1">Operational Category</label>
                <span className="w-full px-3 py-2 h-10 border rounded-xl bg-slate-100/50 text-slate-500 text-xs font-semibold flex items-center">{vendor.category}</span>
              </div>
            </div>
            <div>
              <label className="text-[9px] font-bold text-gray-400 block uppercase mb-1">Company Address</label>
              <input type="text" value={vendor.addressLine1} onChange={e => setVendorProfile({...vendor, addressLine1: e.target.value})} className="w-full px-3 py-2 h-10 border rounded-xl bg-white text-slate-800 text-xs font-semibold mb-2 outline-none focus:border-blue-500" />
              <div className="grid grid-cols-3 gap-2">
                <input type="text" value={vendor.addressLine2} onChange={e => setVendorProfile({...vendor, addressLine2: e.target.value})} className="px-3 py-2 h-10 border rounded-xl bg-white text-slate-800 text-xs font-semibold outline-none focus:border-blue-500" placeholder="Locality" />
                <input type="text" value={vendor.state} onChange={e => setVendorProfile({...vendor, state: e.target.value})} className="px-3 py-2 h-10 border rounded-xl bg-white text-slate-800 text-xs font-semibold outline-none focus:border-blue-500" placeholder="State" />
                <input type="text" value={vendor.pincode} onChange={e => setVendorProfile({...vendor, pincode: e.target.value})} className="px-3 py-2 h-10 border rounded-xl bg-white text-slate-800 text-xs font-semibold outline-none focus:border-blue-500" placeholder="Pincode" />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-bold text-gray-400 block uppercase mb-1">Corporate Bio description</label>
              <textarea value={vendor.description} onChange={e => setVendorProfile({...vendor, description: e.target.value})} rows={3} className="w-full p-3 border rounded-xl bg-white text-slate-850 text-xs resize-none outline-none focus:border-blue-500" />
            </div>
            <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs mt-2 font-sans">Save Profile Updates</button>
          </form>
        </div>

        <div className="bg-white/40 border border-white/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest border-b pb-3 mb-4">Trust Score Breakdown</h3>
            <div className="text-center py-6">
              <span className="text-5xl font-black text-blue-650 block">98%</span>
              <span className="text-[9px] font-black text-emerald-600 tracking-wider uppercase block mt-2">Elite Verified Business</span>
            </div>
            <div className="space-y-3.5 text-xs pt-4 border-t">
              <div className="flex justify-between items-center">
                <span>GST Document Verification</span>
                <span className="text-emerald-600 font-extrabold uppercase text-[10px]">Verified (+15%)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>On-Time Arrival History</span>
                <span className="text-emerald-600 font-extrabold uppercase text-[10px]">100% (+20%)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Avg Response Velocity</span>
                <span className="text-emerald-600 font-extrabold uppercase text-[10px]">99% (+20%)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Completion Status History</span>
                <span className="text-emerald-600 font-extrabold uppercase text-[10px]">98% (+20%)</span>
              </div>
            </div>
          </div>
          <button onClick={handleImproveTrustClick} className="w-full py-2.5 bg-white border hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all">Improve Trust Score</button>
        </div>
      </div>
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

/* ============================================================================
   EVENT OS TABS: TIMELINE, KANBAN TASKS, VENDORS
   ============================================================================ */

/* 1. TimelineTab */
export function TimelineTab({ isDemoMode }) {
  const [activeEventId, setActiveEventId] = useState(101);
  const [milestones, setMilestones] = useState([
    { id: 'm1', label: 'Venue Booking', desc: 'Secure main reception & event hall.', status: 'COMPLETED', date: '2026-07-10', vendor: 'Grand Hyatt' },
    { id: 'm2', label: 'Floral & Decor', desc: 'Confirm theme design & color palettes.', status: 'IN_PROGRESS', date: '2026-08-15', vendor: 'Royal Decorators' },
    { id: 'm3', label: 'Catering Menu Lock', desc: 'Finalize main course & appetizer list.', status: 'PENDING', date: '2026-09-05', vendor: 'Pending Selection' },
    { id: 'm4', label: 'AV & Sound Systems', desc: 'Lock DJs & stage lighting systems.', status: 'PENDING', date: '2026-10-12', vendor: 'Shine & Sound DJs' },
    { id: 'm5', label: 'Event Execution', desc: 'Main ceremony & live production.', status: 'PENDING', date: '2026-11-12', vendor: 'All Services' }
  ]);
  const [selectedMilestone, setSelectedMilestone] = useState(milestones[1]);

  const handleStatusChange = (id, newStatus) => {
    const updated = milestones.map(m => m.id === id ? { ...m, status: newStatus } : m);
    setMilestones(updated);
    const updatedSelected = updated.find(m => m.id === selectedMilestone.id);
    if (updatedSelected) setSelectedMilestone(updatedSelected);
    toast.success(`Milestone status updated to ${newStatus}`);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workspace Core</span>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">Interactive Milestone Timeline</h1>
        </div>
        <button onClick={() => toast.success("Timeline configuration locked.")} className="px-3.5 py-2 bg-white/40 border border-white/60 hover:bg-white/60 text-slate-800 rounded-xl text-xs font-bold shadow-sm transition-all">
          Lock Schedule
        </button>
      </div>

      {/* Horizontal Milestone Tracker */}
      <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-8 shadow-sm">
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gray-200 -translate-y-1/2 z-0 hidden md:block" />
          
          {milestones.map((m, idx) => {
            const isCompleted = m.status === 'COMPLETED';
            const isInProgress = m.status === 'IN_PROGRESS';
            const isSelected = selectedMilestone.id === m.id;

            return (
              <div 
                key={m.id} 
                onClick={() => setSelectedMilestone(m)}
                className={`relative z-10 flex flex-row md:flex-col items-center gap-3 md:text-center flex-1 cursor-pointer group p-2 rounded-2xl hover:bg-white/20 transition-all ${isSelected ? 'ring-2 ring-blue-500/10' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border font-bold text-xs transition-all duration-300 ${
                  isCompleted ? 'bg-gradient-to-tr from-emerald-500 to-teal-650 text-white shadow-md shadow-emerald-500/10 border-emerald-500' :
                  isInProgress ? 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-500/15 animate-pulse' :
                  'bg-white/65 border-white/80 text-slate-400'
                }`}>
                  {isCompleted ? <Check size={16} /> : (idx + 1)}
                </div>
                <div className="flex-1">
                  <h3 className={`text-xs font-black tracking-tight ${isCompleted ? 'text-emerald-700' : isInProgress ? 'text-blue-600' : 'text-slate-650'}`}>
                    {m.label}
                  </h3>
                  <p className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">{m.date}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Milestone Detail Pane */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-white/30 pb-3">
            <div>
              <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                selectedMilestone.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                selectedMilestone.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                'bg-slate-50 text-slate-500 border border-slate-200'
              }`}>
                {selectedMilestone.status}
              </span>
              <h2 className="text-lg font-black text-slate-800 mt-2">{selectedMilestone.label}</h2>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => handleStatusChange(selectedMilestone.id, 'COMPLETED')} className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-bold border border-emerald-200">
                Mark Done
              </button>
              <button onClick={() => handleStatusChange(selectedMilestone.id, 'IN_PROGRESS')} className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-[10px] font-bold border border-blue-200">
                Start Now
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
            <div>
              <span className="text-[9px] text-slate-450 uppercase tracking-widest block font-black">Target Date</span>
              <p className="text-slate-800 font-extrabold mt-1">{selectedMilestone.date}</p>
            </div>
            <div>
              <span className="text-[9px] text-slate-450 uppercase tracking-widest block font-black">Hired Provider</span>
              <p className="text-slate-800 font-extrabold mt-1">{selectedMilestone.vendor}</p>
            </div>
            <div className="col-span-2 pt-2">
              <span className="text-[9px] text-slate-450 uppercase tracking-widest block font-black">Milestone Objective</span>
              <p className="text-slate-655 leading-relaxed mt-1">{selectedMilestone.desc}</p>
            </div>
          </div>
        </div>

        {/* Next Recommendation Panel */}
        <div className="bg-gradient-to-tr from-slate-900 via-slate-950 to-indigo-950 text-white rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[8px] font-black tracking-widest rounded-full uppercase">
              AI Action Helper
            </span>
            <h3 className="text-sm font-extrabold mt-4">Next Suggested Action</h3>
            <p className="text-xs text-slate-350 mt-2 leading-relaxed">
              To close the <strong>Floral & Decor</strong> milestone, disburse the advance payment check of ₹45,000 to Royal Decorators.
            </p>
          </div>
          <button onClick={() => toast.success("Disbursement request routed to settings.")} className="mt-6 w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.01]">
            Disburse Funds Now
          </button>
        </div>
      </div>
    </div>
  );
}

/* 2. KanbanTasksTab */
export function KanbanTasksTab({ isDemoMode }) {
  const [tasks, setTasks] = useState([
    { id: 't1', title: 'Arrange groom entry car', desc: 'Secure luxury vehicle for entry.', status: 'TODO', priority: 'HIGH', date: '2026-08-01' },
    { id: 't2', title: 'Finalize buffet appetizers', desc: 'Choose 3 veg and 3 non-veg starters.', status: 'IN_PROGRESS', priority: 'MEDIUM', date: '2026-09-02' },
    { id: 't3', title: 'Secure main banquet hall', desc: 'Pay 25% deposit for Grand Hyatt.', status: 'DONE', priority: 'HIGH', date: '2026-07-05' },
    { id: 't4', title: 'Approve DJ playlist', desc: 'Add classic dance tracks.', status: 'TODO', priority: 'LOW', date: '2026-10-10' }
  ]);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newStatus, setNewStatus] = useState('TODO');

  const moveTask = (id, newStatus) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    toast.success(`Task status updated!`);
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newTask = {
      id: 'task_' + Date.now(),
      title: newTitle,
      desc: newDesc,
      status: newStatus,
      priority: newPriority,
      date: new Date().toISOString().substring(0, 10)
    };
    setTasks([...tasks, newTask]);
    setNewTitle('');
    setNewDesc('');
    setShowNewTaskForm(false);
    toast.success("Task added to board.");
  };

  const renderColumn = (colStatus, colName, accentColor) => {
    const colTasks = tasks.filter(t => t.status === colStatus);
    return (
      <div className="flex-1 bg-white/20 border border-white/40 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${accentColor}`} />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">{colName}</h3>
            <span className="text-[10px] bg-white/50 text-slate-650 px-2 py-0.5 rounded-md font-extrabold">{colTasks.length}</span>
          </div>
          <button onClick={() => { setNewStatus(colStatus); setShowNewTaskForm(true); }} className="p-1 hover:bg-white/60 text-slate-400 hover:text-slate-800 rounded-lg transition-colors">
            <Plus size={14} />
          </button>
        </div>

        <div className="space-y-3 min-h-[300px] overflow-y-auto custom-scrollbar">
          {colTasks.length === 0 ? (
            <div className="text-center py-10 text-[10px] text-slate-400 italic">No tasks here</div>
          ) : (
            colTasks.map(t => (
              <div key={t.id} className="bg-white/45 backdrop-blur-sm border border-white/60 rounded-2xl p-4 shadow-sm hover:scale-[1.01] transition-all space-y-3 relative group">
                <div className="flex justify-between items-start">
                  <span className={`px-2 py-0.5 border rounded text-[8px] font-black tracking-wider uppercase ${
                    t.priority === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' :
                    t.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-705 border-amber-200' :
                    'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    {t.priority}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {colStatus !== 'TODO' && (
                      <button onClick={() => moveTask(t.id, colStatus === 'IN_PROGRESS' ? 'TODO' : 'IN_PROGRESS')} className="p-1 hover:bg-white text-slate-500 rounded text-[9px] font-black">←</button>
                    )}
                    {colStatus !== 'DONE' && (
                      <button onClick={() => moveTask(t.id, colStatus === 'TODO' ? 'IN_PROGRESS' : 'DONE')} className="p-1 hover:bg-white text-slate-500 rounded text-[9px] font-black">→</button>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-850">{t.title}</h4>
                  <p className="text-[10px] text-slate-505 mt-1 font-semibold leading-relaxed">{t.desc}</p>
                </div>

                <div className="text-[9px] text-slate-400 font-extrabold flex items-center gap-1">
                  <Clock size={10} /> Due: {t.date}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workspace Core</span>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">Notion Kanban Tasks</h1>
        </div>
        <button onClick={() => setShowNewTaskForm(true)} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all">
          + Add Task
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {renderColumn('TODO', 'To Do', 'bg-red-400')}
        {renderColumn('IN_PROGRESS', 'In Progress', 'bg-blue-400')}
        {renderColumn('DONE', 'Completed', 'bg-emerald-400')}
      </div>

      {/* Task Creation Dialog */}
      <Dialog open={showNewTaskForm} onOpenChange={setShowNewTaskForm}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 border border-gray-250 shadow-xl z-50">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">Add Task Card</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4 mt-2">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Task Title *</label>
              <input 
                required 
                type="text" 
                value={newTitle} 
                onChange={e => setNewTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-white text-slate-850"
                placeholder="e.g. Call caterer for menu adjustment"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Description</label>
              <textarea 
                value={newDesc} 
                onChange={e => setNewDesc(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 bg-white text-slate-850 resize-none"
                placeholder="Optional details..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Priority</label>
                <select value={newPriority} onChange={e => setNewPriority(e.target.value)} className="w-full px-3 py-2.5 h-11 border border-gray-200 rounded-xl text-xs font-semibold bg-white outline-none focus:border-blue-500">
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Column</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-full px-3 py-2.5 h-11 border border-gray-200 rounded-xl text-xs font-semibold bg-white outline-none focus:border-blue-500">
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Completed</option>
                </select>
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2.5">
              <button type="button" onClick={() => setShowNewTaskForm(false)} className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-slate-700 rounded-xl text-xs font-bold transition-all">Cancel</button>
              <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-xl text-xs font-bold shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all">Save Card</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* 3. VendorsMarketplaceTab */
export function VendorsMarketplaceTab({ isDemoMode, setTab }) {
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [compareList, setCompareList] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const vendors = [
    { id: 'v1', name: 'Grand Hyatt Ballrooms', category: 'VENUE', price: 250000, trust: 99, response: '5m', image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=600&auto=format&fit=crop', rating: 4.9, reviews: 142 },
    { id: 'v2', name: 'Royal Flower Decorators', category: 'DECORATION', price: 45000, trust: 95, response: '12m', image: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80&w=600&auto=format&fit=crop', rating: 4.7, reviews: 88 },
    { id: 'v3', name: 'Gourmet Catering Services', category: 'CATERING', price: 95000, trust: 98, response: '10m', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=600&auto=format&fit=crop', rating: 4.8, reviews: 120 },
    { id: 'v4', name: 'Shine & Sound DJs', category: 'MUSIC', price: 25000, trust: 96, response: '8m', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop', rating: 4.6, reviews: 64 },
    { id: 'v5', name: 'Vivid Memory Studio', category: 'PHOTOGRAPHY', price: 60000, trust: 97, response: '15m', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600&auto=format&fit=crop', rating: 4.8, reviews: 93 },
    { id: 'v6', name: 'Luxury Mercedes Logistics', category: 'LOGISTICS', price: 30000, trust: 94, response: '20m', image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=600&auto=format&fit=crop', rating: 4.5, reviews: 31 }
  ];

  const filteredVendors = categoryFilter === 'ALL' ? vendors : vendors.filter(v => v.category === categoryFilter);

  const toggleCompare = (v) => {
    if (compareList.some(item => item.id === v.id)) {
      setCompareList(compareList.filter(item => item.id !== v.id));
    } else {
      if (compareList.length >= 3) {
        toast.warning("You can compare up to 3 vendors at a time.");
        return;
      }
      setCompareList([...compareList, v]);
    }
  };

  const handleInstantBook = (v) => {
    toast.success(`Booking request submitted for ${v.name}! Secured via Escrow Protection.`);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Escrow Marketplace</span>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">Airbnb-style Vendor Space</h1>
        </div>

        <div className="flex flex-wrap gap-1 bg-white/40 p-1 rounded-xl border border-white/60 shadow-sm">
          {['ALL', 'VENUE', 'CATERING', 'DECORATION', 'MUSIC', 'PHOTOGRAPHY', 'LOGISTICS'].map(cat => (
            <button 
              key={cat} 
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${categoryFilter === cat ? 'bg-white text-blue-600 shadow-sm border border-white/10' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Compare Floating Bar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white backdrop-blur-md px-6 py-4 rounded-3xl shadow-2xl z-50 flex items-center gap-6 border border-white/15">
          <div className="text-xs font-semibold">
            Comparing <span className="font-extrabold text-blue-400">{compareList.length}</span> / 3 service providers
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCompareModal(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20">
              Compare Side-by-Side
            </button>
            <button onClick={() => setCompareList([])} className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all">
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVendors.map(v => {
          const isSelected = compareList.some(item => item.id === v.id);
          return (
            <div key={v.id} className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl overflow-hidden shadow-sm hover:scale-[1.015] transition-all flex flex-col justify-between">
              <div>
                <div className="h-44 relative overflow-hidden group">
                  <img src={v.image} alt={v.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <span className="absolute top-3.5 left-3.5 px-2 py-0.5 bg-slate-900/80 text-white text-[8px] font-black uppercase tracking-widest rounded-md backdrop-blur-sm">
                    {v.category}
                  </span>
                  <div className="absolute top-3.5 right-3.5 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                    ⭐ {v.rating} <span className="text-[7px] text-emerald-100 font-normal font-sans">({v.reviews})</span>
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <h3 className="text-sm font-black text-slate-800 leading-tight">{v.name}</h3>
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-550">
                    <span className="flex items-center gap-1 text-[10px]"><Sparkles size={11} className="text-amber-505" /> Trust Score: <strong className="text-slate-700">{v.trust}%</strong></span>
                    <span className="text-[10px]">Response: <strong className="text-slate-700">{v.response}</strong></span>
                  </div>
                  <div className="pt-2 border-t border-white/30 flex justify-between items-center">
                    <div>
                      <span className="text-[8px] text-slate-400 uppercase tracking-widest block font-black">Base Estimate</span>
                      <span className="text-sm font-extrabold text-slate-900">₹{v.price.toLocaleString('en-IN')}</span>
                    </div>
                    <button 
                      onClick={() => toggleCompare(v)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${
                        isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-705 border-slate-200'
                      }`}
                    >
                      {isSelected ? '✓ Added' : 'Compare'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-5 flex gap-2">
                <button onClick={() => handleInstantBook(v)} className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]">
                  Secure Escrow Hire
                </button>
                <button onClick={() => setTab('messages')} className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-250 text-slate-700 rounded-xl text-xs font-semibold transition-all">
                  Chat
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compare Side-by-Side Dialog Modal */}
      <Dialog open={showCompareModal} onOpenChange={setShowCompareModal}>
        <DialogContent className="sm:max-w-3xl bg-white rounded-3xl p-6 border border-gray-250 shadow-2xl z-50">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">Compare Service Providers</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-6 mt-4">
            {compareList.map(v => (
              <div key={v.id} className="border border-gray-150 rounded-2xl p-4 space-y-4 bg-gray-50/50">
                <div className="h-28 rounded-lg overflow-hidden">
                  <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-[8px] bg-slate-900 text-white px-2 py-0.5 rounded font-black tracking-widest uppercase">{v.category}</span>
                  <h3 className="text-xs font-black text-slate-800 mt-2 leading-tight h-8">{v.name}</h3>
                </div>
                <div className="space-y-1.5 text-[10px] font-semibold text-slate-650 border-t pt-3">
                  <div className="flex justify-between"><span>Base Rate:</span> <strong className="text-slate-900">₹{v.price.toLocaleString('en-IN')}</strong></div>
                  <div className="flex justify-between"><span>Trust Rating:</span> <strong className="text-emerald-600">⭐ {v.rating} ({v.reviews})</strong></div>
                  <div className="flex justify-between"><span>Aura Score:</span> <strong className="text-slate-900">{v.trust}%</strong></div>
                  <div className="flex justify-between"><span>Response:</span> <strong className="text-slate-900">{v.response}</strong></div>
                </div>
                <button onClick={() => { handleInstantBook(v); setShowCompareModal(false); }} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm">
                  Instant Hire
                </button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============================================================================
   EVENT OS TABS: BUDGET, MESSAGES, DOCUMENTS, ANALYTICS
   ============================================================================ */

/* 4. BudgetCenterTab */
export function BudgetCenterTab({ isDemoMode }) {
  const [totalBudget, setTotalBudget] = useState(300000);
  const [expenses, setExpenses] = useState([
    { id: 1, name: 'Venue Advance Payment', amount: 125000, category: 'VENUE', date: '2026-06-10' },
    { id: 2, name: 'Floral Advance Deposit', amount: 20000, category: 'DECORATION', date: '2026-06-15' },
    { id: 3, name: 'DJ Sound Equipment Lock', amount: 15000, category: 'MUSIC', date: '2026-06-20' }
  ]);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('CATERING');

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = totalBudget - totalSpent;
  const progressPercent = Math.min(100, Math.round((totalSpent / totalBudget) * 100));

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newAmount) return;
    const amountVal = parseFloat(newAmount);
    if (isNaN(amountVal) || amountVal <= 0) return;
    
    const newExpense = {
      id: Date.now(),
      name: newName,
      amount: amountVal,
      category: newCategory,
      date: new Date().toISOString().substring(0, 10)
    };
    setExpenses([...expenses, newExpense]);
    setNewName('');
    setNewAmount('');
    toast.success("Expense ledger updated successfully.");
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workspace Finances</span>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">Stripe-style Budget Center</h1>
        </div>
        <div className="flex gap-2">
          <input 
            type="number" 
            value={totalBudget} 
            onChange={e => setTotalBudget(Number(e.target.value))} 
            className="w-32 px-3 py-1.5 border border-white/60 rounded-xl text-xs font-bold outline-none bg-white/40 focus:bg-white text-slate-800" 
            title="Edit Total Budget"
          />
          <button onClick={() => toast.success("Budget limit locked.")} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-xl text-xs font-bold shadow-sm">
            Save Limit
          </button>
        </div>
      </div>

      {/* Financial Health Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <span className="text-[9px] font-black text-slate-455 uppercase tracking-widest block">Total Budget Cap</span>
          <div className="text-2xl font-black text-slate-800 tracking-tight mt-4">₹{totalBudget.toLocaleString('en-IN')}</div>
          <span className="text-[9px] text-slate-400 font-bold block mt-2">Maximum spending parameters</span>
        </div>
        <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Accumulated Spend</span>
          <div className="text-2xl font-black text-slate-800 tracking-tight mt-4">₹{totalSpent.toLocaleString('en-IN')}</div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-slate-200 h-1 rounded-full overflow-hidden">
              <div className="bg-indigo-50 h-full rounded-full" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="text-[10px] text-slate-500 font-extrabold">{progressPercent}%</span>
          </div>
        </div>
        <div className={`backdrop-blur-md border rounded-3xl p-6 shadow-sm flex flex-col justify-between ${remaining >= 0 ? 'bg-emerald-50/20 border-emerald-250/30 text-emerald-850' : 'bg-red-50/20 border-red-250/30 text-red-850'}`}>
          <span className="text-[9px] font-black uppercase tracking-widest block opacity-75">Remaining Capital</span>
          <div className="text-2xl font-black tracking-tight mt-4">₹{remaining.toLocaleString('en-IN')}</div>
          <span className="text-[9px] font-bold block mt-2">{remaining >= 0 ? '✓ Within safety limits' : '⚠️ Budget limits breached!'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Expense Ledger */}
        <div className="lg:col-span-2 bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest">Transaction Ledger</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold text-slate-655">
              <thead>
                <tr className="bg-white/20 border-b border-white/30 text-[9px] text-slate-450 uppercase tracking-wider h-9">
                  <th className="px-4 py-2">Transaction Details</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {expenses.map(e => (
                  <tr key={e.id} className="h-12 hover:bg-white/30 transition-colors">
                    <td className="px-4 py-2 text-slate-800 font-bold">{e.name}</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-0.5 bg-blue-50 border border-blue-150 text-blue-700 text-[9px] font-bold rounded uppercase">{e.category}</span>
                    </td>
                    <td className="px-4 py-2 text-slate-450">{e.date}</td>
                    <td className="px-4 py-2 text-right font-extrabold text-slate-850">₹{e.amount.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ledger entry */}
        <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest flex items-center gap-1.5"><Plus size={14} className="text-blue-500" /> Log Transaction</h3>
          <form onSubmit={handleAddExpense} className="space-y-3.5">
            <div>
              <label className="text-[9px] font-black text-slate-500 block uppercase mb-1">Details *</label>
              <input required type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Stage lighting setup fee" className="w-full px-3 py-2 border border-white/40 rounded-lg text-xs font-semibold bg-white/40 backdrop-blur-sm focus:bg-white focus:border-blue-500 text-slate-800" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-500 block uppercase mb-1">Estimate (₹) *</label>
              <input required type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="e.g. 15000" className="w-full px-3 py-2 border border-white/40 rounded-lg text-xs font-semibold bg-white/40 backdrop-blur-sm focus:bg-white focus:border-blue-500 text-slate-800" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-500 block uppercase mb-1">Category</label>
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full px-3 py-2.5 border border-white/40 rounded-lg text-xs font-semibold bg-white focus:border-blue-500">
                <option value="VENUE">VENUE</option>
                <option value="CATERING">CATERING</option>
                <option value="DECORATION">DECORATION</option>
                <option value="MUSIC">MUSIC</option>
                <option value="PHOTOGRAPHY">PHOTOGRAPHY</option>
                <option value="LOGISTICS">LOGISTICS</option>
              </select>
            </div>
            <button type="submit" className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-655 text-white rounded-lg text-xs font-bold transition-all shadow-sm hover:scale-[1.01]">
              Add to Ledger
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* 5. MessagesHubTab */
export function MessagesHubTab({ isDemoMode }) {
  const [conversations, setConversations] = useState([
    { id: 1, name: 'Grand Hyatt Ballrooms', lastMessage: 'Menu verification sheet is locked.', time: '14:32', type: 'vendor', avatar: '🏢' },
    { id: 2, name: 'Shine & Sound DJs', lastMessage: 'Is the outdoor audio console approved?', time: '11:15', type: 'vendor', avatar: '🎧' },
    { id: 3, name: 'Platform Dispute Center', lastMessage: 'Dispute resolved. Refund sent.', time: 'Yesterday', type: 'dispute', avatar: '🛡️' }
  ]);
  const [activeConv, setActiveConv] = useState(conversations[0]);
  const [messages, setMessages] = useState({
    1: [
      { id: 101, sender: 'vendor', text: 'Hi Karan, the venue setup details look complete. Please verify the food stalls arrangement.', time: '14:28' },
      { id: 102, sender: 'client', text: 'Looks great! I checked the spreadsheet.', time: '14:30' },
      { id: 103, sender: 'vendor', text: 'Awesome, menu verification sheet is locked.', time: '14:32' }
    ],
    2: [
      { id: 201, sender: 'vendor', text: 'Do we have backup generator setup?', time: '11:10' },
      { id: 202, sender: 'vendor', text: 'Is the outdoor audio console approved?', time: '11:15' }
    ],
    3: [
      { id: 301, sender: 'system', text: 'Incident log dispute #701 initiated.', time: '09:00' },
      { id: 302, sender: 'admin', text: 'We reviewed the cancellation logs and processed the full deposit back to your wallet.', time: '16:00' },
      { id: 303, sender: 'system', text: 'Dispute resolved. Refund sent.', time: '16:05' }
    ]
  });
  const [inputVal, setInputVal] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'client',
      text: inputVal,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => ({
      ...prev,
      [activeConv.id]: [...(prev[activeConv.id] || []), newMsg]
    }));

    setConversations(conversations.map(c => 
      c.id === activeConv.id ? { ...c, lastMessage: inputVal, time: 'Just Now' } : c
    ));

    setInputVal('');
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Collaboration</span>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">Pinned Messages Hub</h1>
      </div>

      <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl overflow-hidden shadow-sm h-[500px] flex">
        {/* Message Threads Sidebar */}
        <div className="w-80 border-r border-white/30 flex flex-col">
          <div className="p-4 border-b border-white/30">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Channels</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-white/20">
            {conversations.map(c => {
              const isSelected = c.id === activeConv.id;
              return (
                <div 
                  key={c.id} 
                  onClick={() => setActiveConv(c)}
                  className={`p-4 cursor-pointer hover:bg-white/30 transition-all ${isSelected ? 'bg-white/60' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/70 shadow-sm flex items-center justify-center text-lg">{c.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h4 className="text-xs font-black text-slate-800 truncate">{c.name}</h4>
                        <span className="text-[8px] text-slate-400 font-extrabold">{c.time}</span>
                      </div>
                      <p className="text-[10px] text-slate-505 truncate font-semibold mt-0.5">{c.lastMessage}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 flex flex-col justify-between bg-white/10 relative">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/30 bg-white/30 flex justify-between items-center backdrop-blur-sm">
            <h4 className="text-xs font-black text-slate-800">{activeConv.name}</h4>
            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-700 border border-blue-500/25 rounded text-[8px] font-black uppercase tracking-wider">Escrow Secure Chat</span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
            {(messages[activeConv.id] || []).map(m => {
              const isClient = m.sender === 'client';
              const isSystem = m.sender === 'system';

              if (isSystem) {
                return (
                  <div key={m.id} className="flex justify-center">
                    <span className="px-3 py-1 bg-slate-900/10 text-slate-650 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-900/10">{m.text}</span>
                  </div>
                );
              }

              return (
                <div key={m.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl p-3.5 shadow-sm text-xs font-semibold ${
                    isClient 
                      ? 'bg-gradient-to-tr from-blue-600 to-indigo-650 text-white rounded-tr-none' 
                      : 'bg-white border border-white/80 text-slate-800 rounded-tl-none'
                  }`}>
                    <p className="leading-relaxed">{m.text}</p>
                    <span className={`block text-[7px] text-right mt-1.5 ${isClient ? 'text-blue-200' : 'text-slate-400'}`}>{m.time}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white/30 border-t border-white/30 flex gap-2 backdrop-blur-sm">
            <input 
              type="text" 
              value={inputVal} 
              onChange={e => setInputVal(e.target.value)} 
              placeholder="Type your message securely..." 
              className="flex-1 px-4 py-2.5 h-10 border border-white/40 focus:border-blue-500 rounded-xl text-xs font-semibold outline-none bg-white/40 focus:bg-white text-slate-800 transition-all"
            />
            <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-655 text-white rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-[1.01]">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* 6. DocumentVaultTab */
export function DocumentVaultTab({ isDemoMode }) {
  const [docs, setDocs] = useState([
    { id: 1, name: 'Photographer_Contract_Vivid.pdf', size: '1.2 MB', date: '2026-06-15', category: 'CONTRACTS' },
    { id: 2, name: 'Main_Hyatt_Banquet_Advance_Receipt.pdf', size: '840 KB', date: '2026-06-10', category: 'INVOICES' },
    { id: 3, name: 'Sangeet_Guestlist_Sheet.xlsx', size: '320 KB', date: '2026-06-20', category: 'GUEST_LISTS' }
  ]);
  const [guests, setGuests] = useState([
    { id: 1, name: 'Rohan Sharma', rsvp: 'CONFIRMED', table: 'Table 1', food: 'Veg' },
    { id: 2, name: 'Sneha Patel', rsvp: 'CONFIRMED', table: 'Table 2', food: 'Non-Veg' },
    { id: 3, name: 'Amit Verma', rsvp: 'PENDING', table: 'Table 1', food: 'Veg' }
  ]);

  const handleUpload = (e) => {
    e.preventDefault();
    const newDoc = {
      id: Date.now(),
      name: 'User_Uploaded_Invoice_' + Date.now().toString().slice(-4) + '.pdf',
      size: '480 KB',
      date: new Date().toISOString().substring(0, 10),
      category: 'INVOICES'
    };
    setDocs([...docs, newDoc]);
    toast.success("Document uploaded securely to platform vault.");
  };

  const handleRsvpChange = (id, newRsvp) => {
    setGuests(guests.map(g => g.id === id ? { ...g, rsvp: newRsvp } : g));
    toast.success("RSVP status updated.");
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Secure Storage</span>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">Asset Document Vault</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Document List */}
        <div className="lg:col-span-2 bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-white/30 pb-3">
            <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest">Saved Attachments</h3>
            <button onClick={handleUpload} className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-xl text-[10px] font-bold shadow-sm">
              + Upload Asset
            </button>
          </div>

          <div className="space-y-2">
            {docs.map(doc => (
              <div key={doc.id} className="p-3.5 bg-white/30 hover:bg-white/50 border border-white/50 rounded-2xl flex justify-between items-center gap-3 transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/50 flex items-center justify-center text-xs text-blue-600">📁</span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-extrabold text-slate-800 truncate" title={doc.name}>{doc.name}</h4>
                    <span className="text-[9px] text-slate-400 font-bold block mt-0.5">{doc.size} • Uploaded {doc.date}</span>
                  </div>
                </div>
                <button onClick={() => toast.success(`Downloading ${doc.name}...`)} className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-[10px] font-bold shadow-sm whitespace-nowrap">
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Live Guest List Manager */}
        <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-455 uppercase tracking-widest">RSVP Guest Tracker</h3>
          <div className="space-y-3">
            {guests.map(g => (
              <div key={g.id} className="p-3 bg-white/20 border border-white/40 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <strong className="text-slate-850 font-black">{g.name}</strong>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                    g.rsvp === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-705'
                  }`}>{g.rsvp}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-450 font-bold">
                  <span>Preference: <strong className="text-slate-700">{g.food}</strong></span>
                  <span>{g.table}</span>
                </div>
                <div className="flex gap-1 pt-1.5 border-t border-white/10">
                  <button onClick={() => handleRsvpChange(g.id, 'CONFIRMED')} className="px-2 py-1 bg-white border text-[8px] font-bold rounded-lg text-slate-800">Confirm</button>
                  <button onClick={() => handleRsvpChange(g.id, 'PENDING')} className="px-2 py-1 bg-white border text-[8px] font-bold rounded-lg text-slate-855">Pending</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* 7. AnalyticsMinimalTab */
export function AnalyticsMinimalTab({ isDemoMode }) {
  return (
    <div className="space-y-6 font-sans">
      <div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workspace Diagnostics</span>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">Executive Decision Analytics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm">
          <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Coordination Aura</span>
          <div className="text-3xl font-black text-slate-800 tracking-tight mt-4">98%</div>
          <span className="text-[8px] text-emerald-600 font-extrabold mt-1 block">Excellent status reliability</span>
        </div>
        <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm">
          <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Response Velocity</span>
          <div className="text-3xl font-black text-slate-800 tracking-tight mt-4">8.5 min</div>
          <span className="text-[8px] text-emerald-600 font-extrabold mt-1 block">Quick vendor turnaround</span>
        </div>
        <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm">
          <span className="text-[9px] font-black text-slate-455 uppercase tracking-widest block">Escrow Protected</span>
          <div className="text-3xl font-black text-slate-800 tracking-tight mt-4">100%</div>
          <span className="text-[8px] text-slate-400 font-bold mt-1 block">Security collateral secured</span>
        </div>
        <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm">
          <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block">Task Velocity</span>
          <div className="text-3xl font-black text-slate-800 tracking-tight mt-4">1.2 / day</div>
          <span className="text-[8px] text-emerald-600 font-extrabold mt-1 block">Ahead of target timeline</span>
        </div>
      </div>

      {/* Mini Diagnostic graph mockup */}
      <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 shadow-sm">
        <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest mb-6">Readiness score trajectory</h3>
        <div className="w-full h-32 relative bg-white/20 border border-white/40 rounded-2xl overflow-hidden flex items-end">
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <path d="M 0 80 Q 25 70, 50 45 T 100 20" fill="none" stroke="rgba(37,99,235,0.7)" strokeWidth="2.5" />
            <path d="M 0 80 Q 25 70, 50 45 T 100 20 L 100 100 L 0 100 Z" fill="rgba(37,99,235,0.06)" />
          </svg>
          <div className="absolute inset-x-0 bottom-2 px-4 flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
            <span>May 1</span>
            <span>June 1</span>
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   EVENT OS TABS: CANCELLATION CENTER, NOTIFICATIONS, FLOATING AI COPILOT
   ============================================================================ */

/* 8. CancellationCenterTab */
export function CancellationCenterTab({ isDemoMode }) {
  const [incidents, setIncidents] = useState([
    {
      id: 'inc_101',
      title: 'Sound System Provider Cancellation',
      vendor: 'Shine & Sound DJs',
      amount: 25000,
      status: 'RECOVERY_IN_PROGRESS',
      date: '2026-06-26',
      refundStatus: 'REFUNDED_TO_ESCROW',
      replacements: [
        { id: 'rep_1', name: 'Bass Drop DJs', price: 23000, trust: 98, rating: 4.8 },
        { id: 'rep_2', name: 'Sonic Blast AV', price: 26000, trust: 96, rating: 4.7 }
      ]
    }
  ]);

  const handleSimulateCancellation = () => {
    const newIncident = {
      id: 'inc_' + Date.now(),
      title: 'Caterer Emergency Cancellation',
      vendor: 'Gourmet Catering Services',
      amount: 95000,
      status: 'RECOVERY_IN_PROGRESS',
      date: new Date().toISOString().substring(0, 10),
      refundStatus: 'REFUNDED_TO_ESCROW',
      replacements: [
        { id: 'rep_3', name: 'Grand Feast Caterers', price: 90000, trust: 97, rating: 4.9 },
        { id: 'rep_4', name: 'Royal Buffet Co.', price: 98000, trust: 95, rating: 4.6 }
      ]
    };
    setIncidents([newIncident, ...incidents]);
    toast.error("Emergency Simulated: Gourmet Catering has cancelled. Automated recovery initiated.");
  };

  const handleBookReplacement = (incidentId, rep) => {
    setIncidents(incidents.map(inc => 
      inc.id === incidentId 
        ? { ...inc, status: 'RESOLVED', vendor: rep.name, amount: rep.price, replacements: [] }
        : inc
    ));
    toast.success(`Successfully booked replacement: ${rep.name}! Funds transferred via Escrow Wallet.`);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest animate-pulse">PlanIt USP System</span>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">Cancellation & Recovery Center</h1>
        </div>
        <button 
          onClick={handleSimulateCancellation} 
          className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-655 hover:from-rose-700 hover:to-red-750 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/10 transition-all hover:scale-[1.01] active:scale-[0.99]"
        >
          Simulate Emergency Cancellation
        </button>
      </div>

      <div className="space-y-6">
        {incidents.length === 0 ? (
          <div className="text-center py-16 bg-white/40 border border-white/60 rounded-3xl">
            <ShieldAlert className="text-slate-350 mx-auto mb-3" size={40} />
            <h3 className="text-base font-bold text-slate-700">All Operations Nominal</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto font-semibold">No vendor cancellations or disputes logged in this event space.</p>
          </div>
        ) : (
          incidents.map(inc => {
            const isResolved = inc.status === 'RESOLVED';
            return (
              <div 
                key={inc.id} 
                className={`border rounded-3xl p-6 shadow-sm space-y-6 transition-all ${
                  isResolved 
                    ? 'bg-emerald-50/20 border-emerald-200/50' 
                    : 'bg-white/40 backdrop-blur-md border-rose-200/60 shadow-[0_0_15px_rgba(239,68,68,0.05)]'
                }`}
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/30 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 border rounded text-[8px] font-black uppercase tracking-wider ${
                        isResolved ? 'bg-emerald-50 text-emerald-705 border-emerald-250' : 'bg-red-50 text-red-750 border-red-250 animate-pulse'
                      }`}>
                        {inc.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-slate-455 font-bold uppercase">Incident ID: #{inc.id}</span>
                    </div>
                    <h3 className="text-base font-black text-slate-805 mt-2">{inc.title}</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-1">
                      Cancelled Vendor: <strong className="text-slate-700">{inc.vendor}</strong> • Impact Estimate: ₹{inc.amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="text-xs text-slate-450 font-bold uppercase tracking-wider text-right">
                    Date: {inc.date}
                  </div>
                </div>

                {/* Recover Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Escrow Refund Status */}
                  <div className="bg-white/30 border border-white/50 rounded-2xl p-4 space-y-3">
                    <h4 className="text-[10px] font-black text-slate-450 uppercase tracking-widest">Escrow Safety Check</h4>
                    <div className="space-y-2 text-xs font-semibold">
                      <div className="flex justify-between">
                        <span>Original Escrow Hold:</span>
                        <strong className="text-slate-800">₹{inc.amount.toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Collateral Refund Status:</span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-750 rounded text-[9px] font-black border border-emerald-200">
                          {inc.refundStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-450 leading-relaxed font-semibold pt-1 border-t">
                        ✓ Collateral funds have been returned to your Escrow balance. No financial losses incurred.
                      </p>
                    </div>
                  </div>

                  {/* Right Column: AI Auto Replacements */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-450 uppercase tracking-widest">AI Matching Replacements</h4>
                    {isResolved ? (
                      <div className="p-4 bg-emerald-50/20 border border-emerald-200/50 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                        <span>✓ Incident Resolved. Replacement vendor locked.</span>
                      </div>
                    ) : inc.replacements.length === 0 ? (
                      <p className="text-xs text-slate-455 italic">Searching database...</p>
                    ) : (
                      <div className="space-y-2">
                        {inc.replacements.map(rep => (
                          <div key={rep.id} className="p-3 bg-white/50 border border-white/70 rounded-xl flex justify-between items-center gap-3 hover:bg-white/60 transition-all">
                            <div>
                              <h5 className="text-xs font-bold text-slate-800">{rep.name}</h5>
                              <div className="flex gap-2.5 text-[9px] text-slate-400 mt-1 font-bold">
                                <span>⭐ {rep.rating}</span>
                                <span>Trust: {rep.trust}%</span>
                                <span>Rate: ₹{rep.price.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleBookReplacement(inc.id, rep)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all"
                            >
                              Instant Hire
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* 9. NotificationsInboxTab */
export function NotificationsInboxTab({ isDemoMode }) {
  const [activeSubTab, setActiveSubTab] = useState('ALL');
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Dispute Case #701 Closed', text: 'Admins resolved the dispute in your favor. Refund of ₹5,000 processed.', priority: 'URGENT', date: 'Just Now', read: false },
    { id: 2, title: 'Gourmet Catering Menu due', text: 'Please review and select menu starters by tomorrow.', priority: 'IMPORTANT', date: '3 hours ago', read: false },
    { id: 3, title: 'Invoice Uploaded', text: 'Royal Flower Decorators uploaded invoice #IV-992.', priority: 'GENERAL', date: '1 day ago', read: true }
  ]);

  const handleMarkRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    toast.success("Notification marked as read.");
  };

  const handleClearAll = () => {
    setNotifications([]);
    toast.success("Inbox cleared.");
  };

  const filtered = notifications.filter(n => {
    if (activeSubTab === 'ALL') return true;
    if (activeSubTab === 'URGENT') return n.priority === 'URGENT';
    return n.read === false;
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform Mailbox</span>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">Inbox Notifications</h1>
        </div>
        {notifications.length > 0 && (
          <button onClick={handleClearAll} className="px-3.5 py-2 border border-white/60 bg-white/40 hover:bg-white/60 text-slate-700 rounded-xl text-xs font-bold transition-all">
            Clear Inbox
          </button>
        )}
      </div>

      {/* Notion style pills */}
      <div className="flex gap-1.5 bg-white/40 p-1 rounded-xl border border-white/60 w-fit">
        {['ALL', 'URGENT', 'UNREAD'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveSubTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${activeSubTab === tab ? 'bg-white text-blue-600 shadow-sm border border-white/10' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-455 italic py-10 text-center">Inbox is empty.</p>
        ) : (
          filtered.map(n => (
            <div 
              key={n.id} 
              className={`p-4 border rounded-2xl flex justify-between items-start gap-4 transition-all ${
                n.read 
                  ? 'bg-white/10 border-white/20 opacity-60' 
                  : 'bg-white/45 backdrop-blur-sm border-white/60 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  n.priority === 'URGENT' ? 'bg-red-500 animate-ping' :
                  n.priority === 'IMPORTANT' ? 'bg-amber-500' : 'bg-blue-400'
                }`} />
                <div>
                  <h4 className="text-xs font-black text-slate-805">{n.title}</h4>
                  <p className="text-[10px] text-slate-505 mt-1 font-semibold leading-relaxed">{n.text}</p>
                  <span className="text-[8px] text-slate-400 font-bold block mt-1.5">{n.date}</span>
                </div>
              </div>
              {!n.read && (
                <button onClick={() => handleMarkRead(n.id)} className="px-2.5 py-1 bg-white border border-slate-200 text-[8px] font-bold rounded-lg text-slate-800 whitespace-nowrap">
                  Mark Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* 10. FloatingAICopilot */
export function FloatingAICopilot({ isDemoMode, workspaceMode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  
  const welcomeText = useMemo(() => {
    if (workspaceMode === 'vendor') {
      return 'Hi! I am your AI Business Assistant. Ask me: "suggest pricing", "generate description", or "estimate monthly income" to optimize your workspace.';
    }
    return 'Hi! I am your Event OS Copilot. Type commands like: "add task Book Caterer" or "set budget 400000" to modify your plan.';
  }, [workspaceMode]);

  const [chatHistory, setChatHistory] = useState([
    { sender: 'copilot', text: welcomeText }
  ]);

  useEffect(() => {
    setChatHistory([{ sender: 'copilot', text: welcomeText }]);
  }, [welcomeText]);

  const handleCommandSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userCmd = inputVal.trim();
    const newUserMsg = { sender: 'user', text: userCmd };
    setChatHistory(prev => [...prev, newUserMsg]);
    setInputVal('');

    setTimeout(() => {
      let responseText = "";
      const lower = userCmd.toLowerCase();
      
      if (workspaceMode === 'vendor') {
        if (lower.includes('suggest pricing') || lower.includes('pricing')) {
          responseText = "💡 AI Price Optimizer:\nBased on current demand in Mumbai, we recommend raising 'Fairytale Canopy Flower Setup' price to ₹68,000 (+4.6%) due to peak booking trends for November. Would you like to lock this rate?";
        } else if (lower.includes('description') || lower.includes('generate')) {
          responseText = "✍️ AI Copywriter:\n'Elite drape structures combined with seasonal pastel orchids, custom LED warm spot fixtures, and custom glass stage setup. Ideal for luxury wedding mandates.' Description copied to draft.";
        } else if (lower.includes('income') || lower.includes('estimate') || lower.includes('revenue')) {
          responseText = "📊 Revenue Analytics:\nBased on 3 confirmed upcoming events and average spend of ₹67,000, your estimated payout settlements for next month is ₹201,000 (after Stripe processing fees).";
        } else if (lower.includes('optimize') || lower.includes('calendar')) {
          responseText = "📅 Calendar Optimizer:\nWe identified a 1-day conflict on Aug 15. Automatically applied preparation buffer slot and set concurrent bookings cap to 2 to prevent listing overbooking.";
        } else {
          responseText = "I can assist you with business actions. Type: 'suggest pricing', 'generate description', 'optimize calendar', or 'estimate monthly income'.";
        }
      } else {
        responseText = "Sorry, I didn't recognize that command. Try typing 'add task [Name]' or 'set budget [Number]'.";
        if (lower.startsWith('add task')) {
          const taskName = userCmd.substring(8).trim();
          if (taskName) {
            const stored = localStorage.getItem('planit_tasks_101') || '[]';
            let list = [];
            try { list = JSON.parse(stored); } catch(e) {}
            const newTask = {
              id: 'copilot_' + Date.now(),
              taskName,
              taskDescription: 'Added via AI Copilot command action.',
              dueDate: new Date().toISOString().substring(0,10),
              priority: 'MEDIUM',
              isCompleted: false,
              isCustom: true
            };
            localStorage.setItem('planit_tasks_101', JSON.stringify([newTask, ...list]));
            window.dispatchEvent(new Event('planit_storage_update'));
            responseText = `✓ Task card added to your active event: "${taskName}"`;
          }
        } else if (lower.includes('budget')) {
          const match = lower.match(/\d+/);
          if (match) {
            const number = parseFloat(match[0]);
            localStorage.setItem('planit_budget_101', number);
            window.dispatchEvent(new Event('planit_storage_update'));
            responseText = `✓ Event budget limit updated to ₹${number.toLocaleString('en-IN')}`;
          }
        }
      }

      setChatHistory(prev => [...prev, { sender: 'copilot', text: responseText }]);
    }, 450);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Sparkle Pill */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-650 text-white rounded-full flex items-center gap-2 shadow-2xl hover:scale-105 active:scale-95 transition-all font-extrabold text-xs"
      >
        <Sparkles size={14} className="animate-pulse" />
        {isOpen ? (workspaceMode === 'vendor' ? 'Close Assistant' : 'Close Copilot') : (workspaceMode === 'vendor' ? 'AI Assistant' : 'Ask Copilot')}
      </button>

      {/* Sliding Dialog Card */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-80 bg-white rounded-3xl border border-gray-200 shadow-2xl p-4 flex flex-col justify-between gap-3 h-96">
          <div className="flex justify-between items-center border-b pb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={11} className="text-blue-500" /> {workspaceMode === 'vendor' ? 'Business AI Assistant' : 'Platform AI Copilot'}
            </span>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-700">
              <X size={14} />
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs font-semibold custom-scrollbar">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.01)] leading-relaxed max-w-[85%] whitespace-pre-line ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-gray-50 border text-slate-700 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Prompt Form */}
          <form onSubmit={handleCommandSubmit} className="flex gap-1.5 border-t pt-2.5">
            <input 
              type="text" 
              value={inputVal} 
              onChange={e => setInputVal(e.target.value)} 
              placeholder={workspaceMode === 'vendor' ? "Ask AI Assistant..." : "Command action details..."} 
              className="flex-1 px-3 py-1.5 h-9 border border-gray-200 focus:border-blue-500 rounded-xl text-xs outline-none text-slate-800 bg-gray-50"
            />
            <button type="submit" className="px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all">
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
