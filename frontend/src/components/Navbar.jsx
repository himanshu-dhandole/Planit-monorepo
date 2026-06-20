import React, { useState, useContext, useRef } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CartContext } from "../context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
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
  Wallet,
  MessageSquare,
  LogOut,
  ShoppingBag,
  CalendarCheck,
  Menu,
  X,
  LayoutGrid,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";

function DropdownItem({
  icon,
  title,
  desc,
  to = "#",
  onClick,
  disabled = false,
}) {
  if (disabled) {
    return (
      <div className="flex flex-col gap-1 p-5 rounded-2xl bg-white/20 border border-white/10 cursor-not-allowed opacity-50 block">
        <div className="flex items-center gap-2 text-gray-500 font-semibold mb-1">
          <span className="text-gray-400">{icon}</span>
          {title}
        </div>
        <div className="text-xs text-gray-400 leading-relaxed">{desc}</div>
      </div>
    );
  }

  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex flex-col gap-1 p-5 rounded-2xl bg-white/40 hover:bg-white/80 border border-white/20 cursor-pointer transition-all duration-200 group block"
    >
      <div className="flex items-center gap-2 text-gray-900 font-semibold mb-1">
        <span className="text-gray-600 group-hover:text-black transition-colors">
          {icon}
        </span>
        {title}
      </div>
      <div className="text-xs text-gray-500 leading-relaxed">{desc}</div>
    </Link>
  );
}

function DropdownItemSmall({ icon, title, to = "#", onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 p-4 rounded-2xl bg-white/40 hover:bg-white/80 border border-white/20 cursor-pointer transition-all duration-200 group block"
    >
      <span className="text-gray-600 group-hover:text-black transition-colors">
        {icon}
      </span>
      <span className="text-sm font-semibold text-gray-800 group-hover:text-black">
        {title}
      </span>
    </Link>
  );
}

function DeveloperItem({ imageUrl, title, githubUrl, onClick }) {
  return (
    <a
      href={githubUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-2xl bg-white/40 hover:bg-white/80 border border-white/20 cursor-pointer transition-all duration-200 group"
    >
      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 border border-white/60 shadow-sm flex-shrink-0">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      <span className="text-sm font-semibold text-gray-800 group-hover:text-black">
        {title}
      </span>
    </a>
  );
}

export default function Navbar() {
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, customerProfile, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const timeoutRef = useRef(null);

  const roles = user?.roles
    ? Array.isArray(user.roles)
      ? user.roles
      : [user.roles]
    : [];
  const isVendor = roles.some(
    (role) => role === "VENDOR" || role === "ROLE_VENDOR",
  );
  const isAdmin = roles.some(
    (role) => role === "ADMIN" || role === "ROLE_ADMIN",
  );

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
    { name: "Dashboards", hasDropdown: true, path: "#" },
    { name: "Services", hasDropdown: false, path: "/services" },
    { name: "Vendors", hasDropdown: false, path: "/vendors" },
    { name: "Messages", hasDropdown: false, path: "/chats" },
    { name: "Aura", hasDropdown: false, path: "#" },
  ];

  return (
    <div className="fixed top-4 left-0 w-full z-50 flex justify-center px-4">
      <div className="relative">
        {/* Main Navbar Pill */}
        <div className="bg-white/50 backdrop-blur-xl border border-white/40 shadow-sm rounded-full px-4 md:px-6 py-2.5 md:py-3 flex items-center gap-3 md:gap-8 text-sm font-medium text-gray-800 transition-all">
          <Link
            to="/"
            className="font-serif text-xl md:text-2xl font-black tracking-tighter hover:opacity-80 transition-opacity"
          >
            PLANIT
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isHovered = hoveredItem === item.name;
              const isDimmed =
                hoveredItem !== null && hoveredItem !== item.name;

              const content = (
                <span
                  className={`cursor-pointer transition-all duration-300 py-2 ${
                    isHovered
                      ? "text-black"
                      : isDimmed
                        ? "text-gray-400 opacity-60"
                        : "text-gray-700 hover:text-black"
                  }`}
                  onMouseEnter={() => handleMouseEnter(item.name)}
                  onMouseLeave={handleMouseLeave}
                >
                  {item.name}
                </span>
              );

              return item.path ? (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setHoveredItem(null)}
                >
                  {content}
                </Link>
              ) : (
                <div key={item.name}>{content}</div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 md:gap-4 ml-2 md:ml-4">
            {user && (
              <Link
                to="/cart"
                className="relative p-2 text-gray-700 hover:text-indigo-600 transition-all transform hover:scale-105 active:scale-95"
                title="Event Checkout"
              >
                <CalendarCheck size={20} />
                {cart && cart.length > 0 && (
                  <span className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center border border-white">
                    {cart.length}
                  </span>
                )}
              </Link>
            )}

            {user ? (
              <div
                className="relative flex items-center gap-2 cursor-pointer py-2"
                onMouseEnter={() => handleMouseEnter("Profile")}
                onMouseLeave={handleMouseLeave}
              >
                <span
                  className={`font-semibold transition-colors duration-300 hidden sm:block ${hoveredItem === "Profile" ? "text-black" : "text-gray-800"}`}
                >
                  Hi {customerProfile?.firstName || user.email.split("@")[0]}!
                </span>
                <div
                  className={`w-9 h-9 rounded-full bg-gray-100 overflow-hidden border-2 shadow-sm flex items-center justify-center transition-all duration-300 ${hoveredItem === "Profile" ? "border-gray-300" : "border-white"}`}
                >
                  {customerProfile?.profilePictureUrl ? (
                    <img
                      src={customerProfile.profilePictureUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={18} className="text-gray-400" />
                  )}
                </div>
              </div>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="cursor-pointer text-gray-500 hover:text-black transition-colors hidden sm:block border border-gray-300/50 rounded-full px-4 py-1.5 hover:bg-white/50"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="bg-[#0A0A0A] text-white px-4 md:px-5 py-2 rounded-full hover:bg-gray-800 transition-colors shadow-md text-xs sm:text-sm whitespace-nowrap"
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Hamburger Button for Mobile (Shadcn Drawer) */}
            <Drawer direction="right" open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <DrawerTrigger asChild>
                <button
                  className="md:hidden p-2 text-gray-700 hover:text-black transition-colors rounded-full hover:bg-white/50 flex-shrink-0"
                >
                  <Menu size={22} />
                </button>
              </DrawerTrigger>
              <DrawerContent className="w-[300px] sm:w-[350px] bg-white/90 backdrop-blur-xl border-white/40 overflow-y-auto z-[100] custom-scrollbar">
                <DrawerHeader className="mb-6 mt-4">
                  <DrawerTitle className="text-left font-serif text-2xl font-black tracking-tighter">PLANIT</DrawerTitle>
                </DrawerHeader>
                <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  !item.hasDropdown ? (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block p-3 text-gray-800 hover:bg-white/60 hover:text-black rounded-xl font-semibold transition-all"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <div key={item.name} className="flex flex-col gap-1 mb-2">
                      <div className="p-3 text-gray-400 font-bold text-xs uppercase tracking-wider">
                        {item.name}
                      </div>
                      {item.name === "Dashboards" && (
                        <div className="grid grid-cols-1 gap-1">
                          <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/60 transition-all text-gray-700 font-medium"><User size={18}/> User Profile</Link>
                          <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/60 transition-all text-gray-700 font-medium"><LayoutGrid size={18}/> Console Workspace</Link>
                          <Link to="/disputes" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/60 transition-all text-gray-700 font-medium"><AlertCircle size={18}/> Disputes Center</Link>
                          <Link to="/support" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/60 transition-all text-gray-700 font-medium"><HelpCircle size={18}/> Support Help</Link>
                        </div>
                      )}
                    </div>
                  )
                ))}
                {user ? (
                  <>
                    <div className="p-3 mt-2 text-gray-400 font-bold text-xs uppercase tracking-wider border-t border-gray-200">
                      Account
                    </div>
                    <Link to="/wallet" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/60 transition-all text-gray-700 font-medium"><Wallet size={18}/> Wallet</Link>
                    <button 
                      onClick={() => { setMobileMenuOpen(false); setShowSignOutModal(true); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50/50 transition-all text-red-500 font-medium"
                    >
                      <LogOut size={18}/> Sign Out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-200 sm:hidden">
                    <Link to="/signin" onClick={() => setMobileMenuOpen(false)} className="w-full py-3 px-4 text-center text-gray-700 font-semibold border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors">Log in</Link>
                  </div>
                )}
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        </div>

        {/* Mega Menu Dropdown */}
        <AnimatePresence>
          {hoveredItem === "Dashboards" && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="hidden md:block absolute top-full left-0 mt-2 w-[800px] bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] rounded-3xl p-3 origin-top"
              onMouseEnter={() => handleMouseEnter("Dashboards")}
              onMouseLeave={handleMouseLeave}
            >
              <div className="flex gap-2">
                {/* Left Column (Main Features) */}
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <DropdownItem
                    icon={<User size={20} />}
                    title="User Profile"
                    desc="Manage your personal profile"
                    to="/profile"
                    onClick={() => setHoveredItem(null)}
                  />
                  <DropdownItem
                    icon={<LayoutGrid size={20} />}
                    title="Console Workspace"
                    desc="Access events, tasks, bookings, and wallet"
                    to="/dashboard"
                    onClick={() => setHoveredItem(null)}
                  />
                  <DropdownItem
                    icon={<AlertCircle size={20} />}
                    title="Disputes Center"
                    desc="File and track service disputes"
                    to="/disputes"
                    onClick={() => setHoveredItem(null)}
                  />
                  <DropdownItem
                    icon={<HelpCircle size={20} />}
                    title="Support Help"
                    desc="Get customer support and help"
                    to="/support"
                    onClick={() => setHoveredItem(null)}
                  />
                </div>

                {/* Right Column (Secondary Links) */}
                <div className="w-64 flex flex-col gap-1 pl-2">
                  <div className="px-3 mb-1 mt-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Developers
                    </p>
                  </div>
                  <DeveloperItem
                    imageUrl="https://avatars.githubusercontent.com/u/146882119?v=4"
                    title="Himanshu Dhandole"
                    githubUrl="https://github.com/himanshu-dhandole"
                    onClick={() => setHoveredItem(null)}
                  />
                  <DeveloperItem
                    imageUrl="https://avatars.githubusercontent.com/u/166782723?v=4"
                    title="Arpit Satpute"
                    githubUrl="https://github.com/arpitSatpute"
                    onClick={() => setHoveredItem(null)}
                  />
                  <DeveloperItem
                    imageUrl="https://avatars.githubusercontent.com/u/118983705?v=4"
                    title="Yash Zade"
                    githubUrl="https://github.com/yash-zade"
                    onClick={() => setHoveredItem(null)}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {hoveredItem === "Profile" && user && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="hidden md:block absolute top-full right-0 mt-2 w-[500px] bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] rounded-3xl p-3 origin-top-right"
              onMouseEnter={() => handleMouseEnter("Profile")}
              onMouseLeave={handleMouseLeave}
            >
              <div className="mb-2 px-4 py-3 bg-white/40 rounded-2xl border border-white/20 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {customerProfile
                      ? `${customerProfile.firstName} ${customerProfile.lastName || ""}`
                      : "User"}
                  </p>
                  <p className="text-xs text-gray-600">{user.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <DropdownItem
                  icon={<User size={20} />}
                  title="Profile"
                  desc="Manage your personal profile"
                  to="/profile"
                  onClick={() => setHoveredItem(null)}
                />
                <DropdownItem
                  icon={<CreditCard size={20} />}
                  title="Wallet"
                  desc="Manage your funds and payments"
                  to="/wallet"
                  onClick={() => setHoveredItem(null)}
                />
                <DropdownItem
                  icon={<MessageSquare size={20} />}
                  title="Chats"
                  desc="Chat with your vendors"
                  to="/chats"
                  onClick={() => setHoveredItem(null)}
                />
                <DropdownItem
                  icon={<HelpCircle size={20} />}
                  title="Raise a complaint"
                  desc="Get help and support"
                  to="/support"
                  onClick={() => setHoveredItem(null)}
                />

                <div
                  onClick={() => {
                    setHoveredItem(null);
                    setShowSignOutModal(true);
                  }}
                  className="flex flex-col gap-1 p-5 rounded-2xl bg-white/40 hover:bg-red-50/50 border border-white/20 cursor-pointer transition-all duration-200 group block"
                >
                  <div className="flex items-center gap-2 text-red-500 font-semibold mb-1">
                    <span className="text-red-500 group-hover:text-red-600 transition-colors">
                      <LogOut size={20} />
                    </span>
                    Sign out
                  </div>
                  <div className="text-xs text-red-400 leading-relaxed">
                    Log out of your account
                  </div>
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
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-2 font-serif tracking-tight">
                Sign Out
              </h3>
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
