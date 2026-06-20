import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/planit-logo-removebg-preview.png";

function FooterDeveloperItem({ imageUrl, title, githubUrl }) {
  return (
    <a
      href={githubUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/10 transition-all duration-200 group w-full"
    >
      <div className="w-7 h-7 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-150 transition-transform duration-200"
        />
      </div>
      <span className="text-[13px] font-medium text-[#A1A1AA] group-hover:text-white transition-colors">
        {title}
      </span>
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="w-full bg-[#050505] text-[#A1A1AA] pt-16 md:pt-20 pb-10 border-t border-white/5 font-sans rounded-t-[2rem] md:rounded-t-[2.5rem] mt-[-2rem] md:mt-[-2.5rem] relative z-10">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-16 lg:mb-24">
          {/* Left Section - Logo, Text, Badges */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <Link
              to="/"
              className="flex items-center gap-3.5 mb-6 group hover:opacity-90 transition-opacity"
            >
              <img
                src={logo}
                alt="Planit Logo"
                className="h-[72px] w-auto opacity-90 transition-transform group-hover:scale-105"
              />
              <span className="font-serif text-2xl font-black tracking-tighter text-white">
                PLANIT
              </span>
            </Link>

            <p className="text-[#A1A1AA] text-[15px] leading-relaxed mb-8 max-w-sm">
              AI assistant designed to streamline your digital workflows and
              handle mundane tasks, so you can focus on what truly matters
            </p>

            {/* Badges */}
            {/* <div className="flex items-center flex-wrap gap-4">
              <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center text-[8px] font-bold text-gray-400 tracking-wider">
                <span className="opacity-80">AICPA</span>
                <span className="text-white mt-0.5">SOC 2</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center text-[7px] font-bold text-gray-400 text-center leading-tight tracking-wider">
                <span className="text-white mb-0.5">HIPAA</span>
                <span className="opacity-80 scale-90">COMPLIANT</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center text-[9px] font-bold text-gray-400">
                <span className="opacity-80 leading-none mb-0.5 tracking-[2px]">
                  ***
                </span>
                <span className="text-white">GDPR</span>
              </div>
            </div> */}
          </div>

          {/* Right Section - Links */}
          <div className="lg:col-span-7 lg:pl-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
              {/* Column 1 - Explore */}
              <div>
                <h4 className="text-white text-[15px] font-bold mb-6">
                  Explore
                </h4>
                <ul className="space-y-4 text-[15px] text-[#A1A1AA]">
                  <li>
                    <Link
                      to="/about"
                      className="hover:text-white transition-colors"
                    >
                      About
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/services"
                      className="hover:text-white transition-colors"
                    >
                      Services
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/vendors"
                      className="hover:text-white transition-colors"
                    >
                      Vendors
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/chats"
                      className="hover:text-white transition-colors"
                    >
                      Messages
                    </Link>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white transition-colors">
                      Aura
                    </a>
                  </li>
                </ul>
              </div>

              {/* Column 2 - Dashboards */}
              <div>
                <h4 className="text-white text-[15px] font-bold mb-6">
                  Dashboards
                </h4>
                <ul className="space-y-4 text-[15px] text-[#A1A1AA]">
                  <li>
                    <Link
                      to="/profile"
                      className="hover:text-white transition-colors"
                    >
                      User Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/vendor-dashboard"
                      className="hover:text-white transition-colors"
                    >
                      Vendor Dashboard
                    </Link>
                  </li>

                  <li>
                    <Link
                      to="/admin"
                      className="hover:text-white transition-colors"
                    >
                      Admin Dashboard
                    </Link>
                  </li>

                  <li>
                    <Link
                      to="/disputes"
                      className="hover:text-white transition-colors"
                    >
                      Disputes Center
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/support"
                      className="hover:text-white transition-colors"
                    >
                      Support Help
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Column 3 - Developers */}
              <div>
                <h4 className="text-white text-[15px] font-bold mb-6">
                  Developers
                </h4>
                <div className="flex flex-col gap-3">
                  <FooterDeveloperItem
                    imageUrl="https://avatars.githubusercontent.com/u/146882119?v=4"
                    title="Himanshu Dhandole"
                    githubUrl="https://github.com/himanshu-dhandole"
                  />
                  <FooterDeveloperItem
                    imageUrl="https://avatars.githubusercontent.com/u/166782723?v=4"
                    title="Arpit Satpute"
                    githubUrl="https://github.com/arpitSatpute"
                  />
                  <FooterDeveloperItem
                    imageUrl="https://avatars.githubusercontent.com/u/118983705?v=4"
                    title="Yash Zade"
                    githubUrl="https://github.com/yash-zade"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-[13px] text-[#A1A1AA]">
          <div>© 2026 Planit Technologies, Inc. All rights reserved.</div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full md:w-auto">
            <span className="hover:text-white cursor-pointer transition-colors">
              English
            </span>
            <div className="flex items-center flex-wrap gap-x-5 gap-y-2 font-medium">
              <a href="#" className="hover:text-white transition-colors">
                Instagram
              </a>
              <a href="#" className="hover:text-white transition-colors">
                YouTube
              </a>
              <a href="#" className="hover:text-white transition-colors">
                X
              </a>
              <a href="#" className="hover:text-white transition-colors">
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
