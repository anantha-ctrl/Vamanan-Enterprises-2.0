import React from 'react';
import { Menu, Search, Activity, ExternalLink } from 'lucide-react';
import { humanRole, humanize } from '../utils/humanLabels';

const Header = ({ 
  setShowMobileMenu, 
  activeTab, 
  adminData, 
  setShowAdminModal, 
  searchTerm, 
  setSearchTerm, 
  platformSettings 
}) => {
  const tabLabel = activeTab === 'overview' 
    ? 'Dashboard Overview' 
    : humanize(activeTab);

  return (
    <header className="flex flex-col gap-4 md:gap-6 mb-6 md:mb-10">
      {/* Top Row: Hamburger + Title + Profile */}
      <div className="flex justify-between items-center w-full gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button 
            onClick={() => setShowMobileMenu(true)} 
            className="lg:hidden shrink-0 p-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 md:w-20 md:h-20 bg-blue-900 rounded-2xl md:rounded-3xl flex items-center justify-center overflow-hidden p-2 shadow-lg border border-white/10 shrink-0">
              <img src="/vamanan-logo.png" alt="Vamanan Enterprises V" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-500 font-black uppercase tracking-[0.3em] mb-1">
                <span>Vamanan Enterprises V</span>
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></div>
                <span className="text-amber-600 truncate">{humanize(activeTab)}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black capitalize tracking-tighter text-blue-900 leading-[1.1] pb-1 truncate">
                {tabLabel}
              </h2>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{humanRole(adminData.role)}</span>
            <span className="text-xs font-black text-blue-900">{adminData.name}</span>
          </div>
          <button 
            onClick={() => setShowAdminModal(true)}
            className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-tr from-amber-600 to-amber-500 rounded-xl md:rounded-2xl flex items-center justify-center text-white font-black text-base md:text-lg shadow-lg shadow-amber-500/20 hover:scale-110 transition-transform cursor-pointer"
          >
            {adminData.name ? adminData.name[0].toUpperCase() : 'A'}
          </button>
        </div>
      </div>

      {/* Bottom Row: Search & Market Status */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <div className="relative group flex-1">
          <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-600 transition-colors pointer-events-none" size={16} />
          <input 
            type="text" 
            placeholder="Search users, orders, assets..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl md:rounded-2xl py-3 md:py-4 pl-10 md:pl-14 pr-6 text-sm outline-none focus:border-amber-600 transition-all focus:bg-white text-blue-900 shadow-sm"
          />
        </div>

      </div>
    </header>
  );
};

export default Header;
