import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  CalendarDays,
  User,
  Box,
  CreditCard,
  Sparkles,
  Users,
  HelpCircle,
  FileText
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
  const [isFeaturesHovered, setIsFeaturesHovered] = useState(false);
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="fixed top-4 left-0 w-full z-50 flex justify-center px-4">
      <div 
        className="relative"
        onMouseEnter={() => setIsFeaturesHovered(true)}
        onMouseLeave={() => setIsFeaturesHovered(false)}
      >
        {/* Main Navbar Pill */}
        <div className="bg-white/50 backdrop-blur-xl border border-white/40 shadow-sm rounded-full px-6 py-3 flex items-center gap-8 text-sm font-medium text-gray-800 transition-all">
          <div className="font-serif text-2xl font-black tracking-tighter">PLANIT</div>
          
          <div className="hidden md:flex items-center gap-6">
            <span className={`cursor-pointer transition-colors py-2 ${isFeaturesHovered ? 'text-black' : 'text-gray-700 hover:text-black'}`}>Features</span>
            <span className="cursor-pointer text-gray-500 hover:text-black transition-colors py-2">Vendors</span>
            <span className="cursor-pointer text-gray-500 hover:text-black transition-colors py-2">Community</span>
            <span className="cursor-pointer text-gray-500 hover:text-black transition-colors py-2">Pricing</span>
            <span className="cursor-pointer text-gray-500 hover:text-black transition-colors py-2">Learn</span>
            <span className="cursor-pointer text-gray-500 hover:text-black transition-colors py-2">Download</span>
          </div>

          <div className="flex items-center gap-4 ml-4">
            {user ? (
              <>
                <Link to="/profile" className="font-semibold text-gray-800 hover:text-black truncate max-w-[120px]">{user.email}</Link>
                <button onClick={logout} className="bg-red-50 text-red-600 px-5 py-2 rounded-full hover:bg-red-100 transition-colors shadow-sm font-medium text-sm">
                  Sign Out
                </button>
              </>
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
        <div 
          className={`absolute top-full left-0 mt-2 w-[800px] bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] rounded-3xl p-3 transition-all duration-300 origin-top ${
            isFeaturesHovered ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'
          }`}
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
        </div>
      </div>
    </div>
  );
}
