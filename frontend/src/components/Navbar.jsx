import React, { useState, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarDays,
  User,
  Box,
  CreditCard,
  Sparkles,
  Users,
  HelpCircle,
  FileText,
  AlertCircle,
  Wallet
} from 'lucide-react';

function DropdownItem({ icon, title, desc }) {
  return (
    <div className="flex flex-col gap-1 p-5 rounded-2xl bg-white/40 hover:bg-white/80 border border-white/20 cursor-pointer transition-all duration-200 group">
      <div className="flex items-center gap-2 text-gray-900 font-semibold mb-1">
        <span className="text-gray-600 group-hover:text-black transition-colors">{icon}</span>
        {title}
      </div>
      <div className="text-xs text-gray-500 leading-relaxed">{desc}</div>
    </div>
  );
}

function DropdownItemSmall({ icon, title }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/40 hover:bg-white/80 border border-white/20 cursor-pointer transition-all duration-200 group">
      <span className="text-gray-600 group-hover:text-black transition-colors">{icon}</span>
      <span className="text-sm font-semibold text-gray-800 group-hover:text-black">{title}</span>
    </div>
  );
}

export default function Navbar() {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const { user, customerProfile, logout } = useContext(AuthContext);
  const timeoutRef = useRef(null);

  const handleMouseEnter = (item) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHoveredItem(item);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
    }, 150);
  };

  const navItems = [
    { name: 'Product', hasDropdown: true },
    { name: 'Vendors', hasDropdown: false },
    { name: 'Community', hasDropdown: false },
    { name: 'Pricing', hasDropdown: false },
    { name: 'Learn', hasDropdown: false },
    { name: 'Download', hasDropdown: false }
  ];

  return (
    <div className="fixed top-4 left-0 w-full z-50 flex justify-center px-4">
      <div className="relative">
        {/* Main Navbar Pill */}
        <div className="bg-white/50 backdrop-blur-xl border border-white/40 shadow-sm rounded-full px-6 py-3 flex items-center gap-8 text-sm font-medium text-gray-800 transition-all">
          <div className="font-serif text-2xl font-black tracking-tighter">PLANIT</div>
          
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isHovered = hoveredItem === item.name;
              const isDimmed = hoveredItem !== null && hoveredItem !== item.name;

              return (
                <span
                  key={item.name}
                  className={`cursor-pointer transition-all duration-300 py-2 ${
                    isHovered 
                      ? 'text-black' 
                      : isDimmed 
                        ? 'text-gray-400 opacity-60' 
                        : 'text-gray-700 hover:text-black'
                  }`}
                  onMouseEnter={() => handleMouseEnter(item.name)}
                  onMouseLeave={handleMouseLeave}
                >
                  {item.name}
                </span>
              );
            })}
          </div>

          <div className="flex items-center gap-4 ml-4">
            {user ? (
              <div className="relative group flex items-center gap-2 cursor-pointer py-2">
                <span className="font-semibold text-gray-800 hidden sm:block">
                  Hi {customerProfile?.firstName || user.email.split('@')[0]}!
                </span>
                <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center">
                  {customerProfile?.profilePictureUrl ? (
                    <img src={customerProfile.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={18} className="text-gray-400" />
                  )}
                </div>
                
                {/* Dropdown Menu */}
                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-100 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 origin-top-right">
                  <div className="px-4 py-3 border-b border-gray-50 mb-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{customerProfile ? `${customerProfile.firstName} ${customerProfile.lastName || ''}` : 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black font-medium transition-colors">
                    <User size={16} /> My Profile
                  </Link>
                  <Link to="/wallet" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black font-medium transition-colors">
                    <Wallet size={16} /> Wallet
                  </Link>
                  <button onClick={() => setShowSignOutModal(true)} className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors">
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link to="/signin" className="cursor-pointer text-gray-500 hover:text-black transition-colors hidden sm:block border border-gray-300/50 rounded-full px-4 py-1.5 hover:bg-white/50">Log in</Link>
                <Link to="/signup" className="bg-[#0A0A0A] text-white px-5 py-2 rounded-full hover:bg-gray-800 transition-colors shadow-md">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mega Menu Dropdown */}
        <AnimatePresence>
          {hoveredItem === 'Product' && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute top-full left-0 mt-2 w-[800px] bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] rounded-3xl p-3 origin-top"
              onMouseEnter={() => handleMouseEnter('Product')}
              onMouseLeave={handleMouseLeave}
            >
              <div className="flex gap-2">
                {/* Left Column (Main Features) */}
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <DropdownItem icon={<CalendarDays size={20} />} title="Events" desc="Organize your perfect day" />
                  <DropdownItem icon={<User size={20} />} title="Vendors" desc="Find top professionals" />
                  <DropdownItem icon={<Box size={20} />} title="Rentals" desc="Equipment for any need" />
                  <DropdownItem icon={<CreditCard size={20} />} title="Payments" desc="Secure and easy transactions" />
                </div>
                
                {/* Right Column (Secondary Links) */}
                <div className="w-64 flex flex-col gap-1 pl-2">
                  <DropdownItemSmall icon={<Sparkles size={16} />} title="What's New" />
                  <DropdownItemSmall icon={<Sparkles size={16} />} title="Imagine" />
                  <DropdownItemSmall icon={<HelpCircle size={16} />} title="Help and Support" />
                  <DropdownItemSmall icon={<FileText size={16} />} title="Blog" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sign Out Confirmation Modal */}
      <AnimatePresence>
        {showSignOutModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setShowSignOutModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-[2rem] p-8 md:p-10"
            >
              <div className="w-14 h-14 bg-red-50/80 rounded-full flex items-center justify-center mb-6 mx-auto shadow-sm border border-red-100">
                <AlertCircle className="text-red-500" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-2 font-serif tracking-tight">Sign Out</h3>
              <p className="text-center text-gray-500 text-sm mb-8 font-medium">
                Are you sure you want to sign out of your account?
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowSignOutModal(false)}
                  className="flex-1 py-3.5 px-4 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-xl transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setShowSignOutModal(false);
                    logout();
                  }}
                  className="flex-1 py-3.5 px-4 bg-[#111111] hover:bg-black text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
