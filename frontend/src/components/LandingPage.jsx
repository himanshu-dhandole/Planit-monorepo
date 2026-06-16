import React from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Search, 
  Bell, 
  FileText, 
  CheckSquare, 
  Calendar, 
  Book, 
  Lightbulb, 
  Folder,
  LayoutGrid,
  Menu,
  MoreHorizontal,
  ArrowDownUp
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex-1 bg-gradient-to-b from-[#CBE4F9] to-[#E3F2FC] relative overflow-hidden font-sans w-full">
      {/* Noise Overlay */}
      <div className="absolute inset-0 bg-noise pointer-events-none z-0"></div>

      {/* Abstract Background Shapes (Thin Lines & Clouds) */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        {/* Abstract Clouds */}
        <div className="absolute top-32 left-10 w-48 h-16 bg-white/40 blur-2xl rounded-full"></div>
        <div className="absolute top-48 right-20 w-64 h-24 bg-white/50 blur-3xl rounded-full"></div>
        <div className="absolute top-96 left-1/4 w-72 h-32 bg-white/30 blur-3xl rounded-full"></div>
        
        {/* Subtle Line Art */}
        <svg className="absolute top-32 left-1/4 opacity-20" width="800" height="400" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="400" cy="200" r="199.5" stroke="#1A1A1A" strokeWidth="1"/>
          <path d="M400 0 L400 400 M0 200 L800 200" stroke="#1A1A1A" strokeWidth="1"/>
          <path d="M200 200 L200 100 L400 100 M600 200 L600 300 L400 300" stroke="#1A1A1A" strokeWidth="1"/>
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center pt-32 pb-64 px-4 sm:px-6 lg:px-8">
        
        {/* Hero Text */}
        <div className="text-center max-w-4xl mx-auto mb-10">
          <h1 className="font-serif text-[4rem] sm:text-[5rem] lg:text-[5rem] leading-[1.05] tracking-tight text-[#111111]">
            Your all-in-one platform <br className="hidden sm:block" />
            for flawless events
          </h1>
        </div>

        {/* CTA Button */}
        <button className="bg-white/80 backdrop-blur-md hover:bg-white text-black font-medium text-lg px-8 py-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all transform hover:scale-105 flex items-center gap-2 mb-20 border border-white/40">
          Get Started with Planit
        </button>

        {/* Multi-layered Torn Paper & App Mockup Area */}
        <div className="relative w-full max-w-6xl mt-12 mx-auto perspective-1000">
          
          {/* Decorative Torn Paper Layers Behind Mockup */}
          <div className="absolute -top-32 left-0 w-full h-96 -z-10 select-none pointer-events-none">
            {/* Blue Paint Splash */}
            <svg className="absolute -left-10 top-10 w-96 h-96 text-[#8BA4F9] opacity-90" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" d="M45.7,-76.4C58.9,-69.3,69.1,-55.3,77.5,-40.7C85.9,-26.1,92.5,-11,90.4,3C88.3,17,77.5,30,66.8,42.1C56.1,54.2,45.5,65.4,32.2,72.4C18.9,79.4,2.9,82.2,-12.3,80.1C-27.5,78,-41.9,71,-54.6,61.1C-67.3,51.2,-78.3,38.4,-84.5,23.3C-90.7,8.2,-92.1,-9.3,-86.3,-24.5C-80.5,-39.7,-67.5,-52.6,-53.4,-59.8C-39.3,-67,-24.1,-68.5,-8.3,-65.4C7.5,-62.3,15,-54.6,45.7,-76.4Z" transform="translate(100 100) scale(1.1)" />
            </svg>
            
            {/* White Torn Paper */}
            <svg className="absolute right-32 top-20 w-[40rem] h-64 text-white drop-shadow-md" preserveAspectRatio="none" viewBox="0 0 1000 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,200 L0,50 C100,60 150,20 200,40 C250,60 300,10 350,30 C400,50 450,0 500,20 C550,40 600,10 650,30 C700,50 750,10 800,40 C850,70 900,30 950,50 C980,60 1000,40 1000,40 L1000,200 Z" fill="currentColor"/>
            </svg>

            {/* Black Torn Paper Fragment */}
            <svg className="absolute right-20 top-40 w-[20rem] h-32 text-[#1c1c1c]" preserveAspectRatio="none" viewBox="0 0 500 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,100 L0,20 C50,10 80,40 120,20 C160,0 200,30 250,10 C300,-10 350,20 400,10 C450,0 480,30 500,20 L500,100 Z" fill="currentColor"/>
            </svg>

            {/* Yellow Notebook Paper */}
            <div className="absolute -right-10 top-48 w-96 h-[30rem] bg-[#FFF2B2] rotate-12 rounded-lg shadow-lg border-l-[3px] border-[#FF8A8A] overflow-hidden">
               {/* Notebook Lines */}
               <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(transparent 95%, #E5DFBA 95%)', backgroundSize: '100% 24px' }}></div>
            </div>
          </div>

          {/* Application Mockup */}
          <div className="bg-[#FAF9F8] rounded-[1.25rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15),0_10px_30px_-5px_rgba(0,0,0,0.1)] border border-white/60 overflow-hidden flex flex-col transform rotate-[-0.5deg] z-20 relative min-h-[600px]">
            
            {/* Top Window Bar */}
            <div className="h-14 flex items-center px-4 bg-[#F5F4F3] border-b border-gray-200/60 sticky top-0 z-30">
              {/* Traffic Lights */}
              <div className="flex gap-2 w-1/4">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]"></div>
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]"></div>
              </div>
              
              {/* Breadcrumb / Navigation */}
              <div className="flex-1 flex justify-center items-center gap-2">
                <div className="flex items-center gap-1 text-gray-400">
                  <ChevronLeft size={18} />
                  <ChevronRight size={18} />
                </div>
                <div className="flex items-center bg-white px-3 py-1.5 rounded-md shadow-sm border border-gray-100 text-sm font-medium text-gray-700">
                  <FileText size={14} className="mr-2 text-gray-400" />
                  Dashboard
                </div>
                <div className="text-gray-400 ml-2">
                  <Plus size={18} />
                </div>
              </div>
              
              {/* Right Tools */}
              <div className="w-1/4 flex justify-end items-center gap-4 text-gray-500">
                <Search size={18} className="hover:text-gray-800 cursor-pointer transition-colors" />
                <Bell size={18} className="hover:text-gray-800 cursor-pointer transition-colors" />
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  C
                </div>
              </div>
            </div>

            {/* App Body */}
            <div className="flex flex-1 overflow-hidden">
              
              {/* Sidebar */}
              <div className="w-64 bg-[#F5F4F3] border-r border-gray-200/60 flex flex-col py-4 hidden md:flex">
                <div className="px-4 mb-6">
                  <button className="w-full flex items-center gap-2 text-gray-700 hover:bg-gray-200/50 px-2 py-1.5 rounded-md transition-colors text-sm font-medium">
                    <Plus size={16} className="text-gray-400" /> New Event
                  </button>
                </div>
                
                <div className="px-4 mb-6">
                  <div className="flex items-center gap-2 bg-white px-2 py-2 rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow">
                    <div className="w-6 h-6 rounded bg-gradient-to-tr from-yellow-300 to-orange-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      S
                    </div>
                    <span className="text-sm font-semibold text-gray-800 flex-1">Sarah's Wedding</span>
                    <div className="flex -space-x-1">
                      <div className="w-5 h-5 rounded-full bg-blue-100 border border-white z-10"></div>
                      <div className="w-5 h-5 rounded-full bg-pink-100 border border-white"></div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2">
                  <nav className="space-y-0.5">
                    <SidebarItem icon={<FileText size={16} />} label="Dashboard" active />
                    <SidebarItem icon={<CheckSquare size={16} />} label="Bookings" />
                    <SidebarItem icon={<Calendar size={16} />} label="Calendar" />
                  </nav>

                  <div className="mt-6">
                    <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Vendors</h3>
                    <nav className="space-y-0.5">
                      <SidebarItem icon={<Book size={16} />} label="Caterers" />
                      <SidebarItem icon={<Lightbulb size={16} />} label="Venues" />
                    </nav>
                  </div>

                  <div className="mt-6">
                    <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Rentals</h3>
                    <nav className="space-y-0.5">
                      <SidebarItem icon={<Folder size={16} />} label="Equipment" />
                      <SidebarItem icon={<Folder size={16} />} label="Services" />
                    </nav>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 bg-white p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                      <Plus size={24} className="text-gray-300" />
                      Dashboard
                    </h2>
                    <div className="flex items-center gap-3 text-gray-400">
                      <LayoutGrid size={20} className="hover:text-gray-700 cursor-pointer" />
                      <Menu size={20} className="hover:text-gray-700 cursor-pointer" />
                      <MoreHorizontal size={20} className="hover:text-gray-700 cursor-pointer" />
                      <ArrowDownUp size={18} className="hover:text-gray-700 cursor-pointer ml-2" />
                    </div>
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Card 1: Recent Messages */}
                    <Card bgColor="bg-[#FFF0F3]" borderColor="border-[#FFE3E8]">
                      <h3 className="font-semibold text-gray-800 mb-4">Recent Messages</h3>
                      <div className="space-y-3">
                        <div className="bg-[#FF91A4] text-white p-3 rounded-lg text-sm shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer">
                          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                          <p className="font-medium">Catering Inquiry</p>
                          <p className="text-xs text-white/80">Taste of Italy</p>
                        </div>
                        <p className="text-xs text-gray-500 italic leading-relaxed px-1">
                          "We can accommodate the vegan menu requests for 50 guests."
                        </p>
                        <div className="bg-[#95D5B2] text-white p-3 rounded-lg text-sm shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer">
                          <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                          <p className="font-medium">Equipment Rental</p>
                          <p className="text-xs text-white/80">Pro AV Solutions</p>
                        </div>
                      </div>
                    </Card>

                    {/* Card 2: Event Schedule */}
                    <Card bgColor="bg-white" borderColor="border-gray-100" shadow="shadow-sm">
                      <h3 className="font-semibold text-gray-800 mb-4">Event Schedule</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Morning Setup</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <div className="w-4 h-4 rounded border border-gray-300"></div> Vendor Arrival (8 AM)
                          </div>
                        </div>
                        <div className="w-full flex justify-center py-2 opacity-30">
                          <svg width="40" height="10" viewBox="0 0 40 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 5 Q 10 1 20 5 T 39 5" stroke="#1A1A1A" strokeWidth="1" fill="none"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Main Event</p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <div className="w-4 h-4 rounded border border-gray-300"></div> Guests Arrive (4 PM)
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <div className="w-4 h-4 rounded border border-gray-300"></div> Dinner Service (6 PM)
                            </div>
                          </div>
                        </div>
                        <div className="w-full flex justify-center py-2 opacity-30">
                          <svg width="40" height="10" viewBox="0 0 40 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 5 Q 10 9 20 5 T 39 5" stroke="#1A1A1A" strokeWidth="1" fill="none"/>
                          </svg>
                        </div>
                      </div>
                    </Card>

                    {/* Card 3: New Vendor Request */}
                    <Card bgColor="bg-[#FEF9D9]" borderColor="border-[#FBEBB5]">
                      <h3 className="font-semibold text-gray-800 mb-4">New Vendor Request</h3>
                      <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
                        <p className="font-medium text-xs text-gray-500 mb-1">Status: Pending Approval</p>
                        <p className="text-xs">A new vendor has applied to join the marketplace and offer peer-to-peer equipment rentals.</p>
                        
                        <div className="pt-2">
                          <p className="font-semibold text-gray-800 mb-1">Vendor Details</p>
                          <p className="text-xs">Name: DJ Sparkle<br/>Service: Audio Equipment Rental<br/>Location: Downtown Area</p>
                        </div>
                      </div>
                    </Card>

                    {/* Card 4: Event Tasks */}
                    <Card bgColor="bg-[#E6F4EA]" borderColor="border-[#CEEAD6]">
                      <h3 className="font-semibold text-gray-800 mb-4">Event Tasks</h3>
                      <div className="space-y-4">
                        <ol className="text-xs text-gray-700 space-y-2 list-decimal list-inside pl-1">
                          <li>Finalize Guest List</li>
                          <li>Confirm Venue Booking</li>
                          <li>Send Invitations</li>
                          <li>Review Menu Tasting</li>
                        </ol>

                        <div className="pt-4 border-t border-green-200/50">
                          <p className="font-medium text-gray-800 text-sm mb-2">Priority</p>
                          <div className="space-y-2">
                            <div className="flex gap-2 text-xs text-gray-600">
                              <div className="w-3.5 h-3.5 rounded-sm border border-green-400 bg-white mt-0.5 shrink-0"></div> 
                              Pay venue deposit
                            </div>
                            <div className="flex gap-2 text-xs text-gray-600">
                              <div className="w-3.5 h-3.5 rounded-sm border border-green-400 bg-white mt-0.5 shrink-0"></div> 
                              Approve catering quote
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>

                  </div>
                </div>
              </div>
            </div>
          </div>

          
        </div>

      </div>
    </div>
  );
}

// Helper Components

function SidebarItem({ icon, label, active = false }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-1.5 rounded-md cursor-pointer text-sm font-medium transition-colors ${
      active 
        ? 'bg-white text-gray-900 shadow-sm border border-gray-100' 
        : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'
    }`}>
      <span className={active ? 'text-gray-500' : 'text-gray-400'}>{icon}</span>
      {label}
    </div>
  );
}

function Card({ children, bgColor = "bg-white", borderColor = "border-transparent", shadow = "" }) {
  return (
    <div className={`${bgColor} border ${borderColor} rounded-2xl p-5 ${shadow} hover:-translate-y-1 transition-transform duration-300 cursor-pointer`}>
      {children}
    </div>
  );
}
