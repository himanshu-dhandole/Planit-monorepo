import React from 'react';
import { Apple } from 'lucide-react';

export default function Footer() {
  return (
      
      <div className="w-full bg-[#0F0F0F] text-gray-400 rounded-t-[2rem] px-8 pt-20 pb-10">
        <div className="max-w-6xl mx-auto">
          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
            
            {/* PLATFORM */}
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-6">Platform</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Product Releases</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors ml-4 block mt-2">Vendor Directory</a></li>
                <li><a href="#" className="hover:text-white transition-colors ml-4 block">Equipment Rentals</a></li>
                <li><a href="#" className="hover:text-white transition-colors ml-4 block">Venue Booking</a></li>
                <li><a href="#" className="hover:text-white transition-colors ml-4 block">Payments</a></li>
                <li><a href="#" className="hover:text-white transition-colors mt-4 block">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors ml-4 block mt-2">Enterprise Plan</a></li>
              </ul>
            </div>

            {/* COMMUNITY */}
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-6">Community</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Slack</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Reddit Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors mb-4 block">X / Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Learn</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Getting Started Guide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Template Gallery</a></li>
              </ul>
            </div>

            {/* SUPPORT */}
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-6">Support</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Trust & Safety</a></li>
              </ul>
            </div>

            {/* COMPANY */}
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-6">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Partner Program</a></li>
                <li><a href="#" className="hover:text-white transition-colors mb-4 block">Media</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Legal</a></li>
                <li><a href="#" className="hover:text-white transition-colors ml-4 block mt-2">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors ml-4 block">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors ml-4 block">Security</a></li>
              </ul>
            </div>

            {/* DOWNLOAD */}
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-6">Download</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Planit for iPhone</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Planit for iPad</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Planit for Mac</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Planit for Windows</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Planit for Android</a></li>
              </ul>
            </div>

          </div>

          {/* Bottom Row */}
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <div>© 2026 Planit Technologies, Inc. All rights reserved.</div>
            
            <div className="flex items-center gap-6">
              <span className="hover:text-white cursor-pointer transition-colors">English</span>
              <div className="flex items-center gap-4 font-medium">
                <a href="#" className="hover:text-white transition-colors">Instagram</a>
                <a href="#" className="hover:text-white transition-colors">YouTube</a>
                <a href="#" className="hover:text-white transition-colors">X</a>
                <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
