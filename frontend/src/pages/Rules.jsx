import React, { useState } from 'react';
import { 
  Gift, Users, AlertTriangle, CheckCircle2, Info, Menu, ShieldCheck, Zap, Landmark, Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MobileHeader from '../components/MobileHeader';

const RulesPage = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex font-inter text-slate-900 overflow-x-hidden selection:bg-amber-100 selection:text-amber-900">
      <Sidebar 
        showMobileMenu={showMobileMenu} 
        setShowMobileMenu={setShowMobileMenu} 
      />

      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen w-full">
         <MobileHeader setShowMobileMenu={setShowMobileMenu} />

        <main className="p-4 sm:p-8 md:p-12 lg:p-16 max-w-5xl mx-auto w-full space-y-8 md:space-y-12 pb-32">
          
          <div className="mb-8 md:mb-12">
              <div className="flex items-center gap-3 mb-3 md:mb-4">
                 <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                 <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">How It Works</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Rules</h2>
              <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2 md:mt-3 italic">How our cashback and referral program works</p>
          </div>

          {/* Cashback System Card */}
          <div className="bg-white border border-slate-200/60 p-6 md:p-14 rounded-[2rem] md:rounded-[3.5rem] shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000"><Zap size={200} /></div>
             <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-12 relative z-10">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-900 text-amber-500 rounded-xl md:rounded-[1.5rem] flex items-center justify-center shadow-xl">
                   <Gift size={24} md:size={28} strokeWidth={1.5} />
                </div>
                <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-tight">How You Earn</h2>
             </div>

             <div className="grid gap-8 md:gap-10 relative z-10">
                <div className="flex items-start gap-4 md:gap-6 group/item">
                   <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-50 rounded-lg md:rounded-xl flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-100 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all">
                      <CheckCircle2 size={18} md:size={20} strokeWidth={2.5} />
                   </div>
                   <div>
                      <h4 className="text-[10px] md:text-[11px] font-black text-slate-900 mb-1 md:mb-2 uppercase tracking-widest italic">1% Daily Cashback</h4>
                      <p className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-tight leading-relaxed italic">Earn 1% cashback every day on the gold you buy.</p>
                   </div>
                </div>

                <div className="flex items-start gap-4 md:gap-6 group/item">
                   <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-50 rounded-lg md:rounded-xl flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-100 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all">
                      <CheckCircle2 size={18} md:size={20} strokeWidth={2.5} />
                   </div>
                   <div>
                      <h4 className="text-[10px] md:text-[11px] font-black text-slate-900 mb-1 md:mb-2 uppercase tracking-widest italic">Up to 100 Days</h4>
                      <p className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-tight leading-relaxed italic">You earn daily for up to 100 days, or until you reach 100% of your purchase amount.</p>
                   </div>
                </div>

                <div className="flex items-start gap-4 md:gap-6 group/item">
                   <div className="w-8 h-8 md:w-10 md:h-10 bg-amber-50 rounded-lg md:rounded-xl flex items-center justify-center text-amber-500 shrink-0 border border-amber-100 group-hover/item:bg-amber-500 group-hover/item:text-white transition-all">
                      <Info size={18} md:size={20} strokeWidth={2.5} />
                   </div>
                   <div>
                      <h4 className="text-[10px] md:text-[11px] font-black text-slate-900 mb-1 md:mb-2 uppercase tracking-widest italic">Starts in 24 Hours</h4>
                      <p className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-tight leading-relaxed italic">Your daily earnings start 24 hours after your purchase is confirmed.</p>
                   </div>
                </div>

                <div className="flex items-start gap-4 md:gap-6 group/item">
                   <div className="w-8 h-8 md:w-10 md:h-10 bg-rose-50 rounded-lg md:rounded-xl flex items-center justify-center text-rose-500 shrink-0 border border-rose-100 group-hover/item:bg-rose-500 group-hover/item:text-white transition-all">
                      <AlertTriangle size={18} md:size={20} strokeWidth={2.5} />
                   </div>
                   <div>
                      <h4 className="text-[10px] md:text-[11px] font-black text-slate-900 mb-1 md:mb-2 uppercase tracking-widest italic">Earnings Limit</h4>
                      <p className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-tight leading-relaxed italic">Daily earnings stop automatically once you reach 100% of your purchase amount.</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Referral System Card */}
          <div className="bg-white border border-slate-200/60 p-6 md:p-14 rounded-[2rem] md:rounded-[3.5rem] shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000"><Users size={200} /></div>
             <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-12 relative z-10">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-900 text-amber-500 rounded-xl md:rounded-[1.5rem] flex items-center justify-center shadow-xl">
                   <Users size={24} md:size={28} strokeWidth={1.5} />
                </div>
                <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-tight">Referral Program</h2>
             </div>

             <div className="grid gap-8 md:gap-10 relative z-10">
                <div className="flex items-start gap-4 md:gap-6 group/item">
                   <div className="w-8 h-8 md:w-10 md:h-10 bg-amber-50 rounded-lg md:rounded-xl flex items-center justify-center text-amber-500 shrink-0 border border-amber-100 group-hover/item:bg-amber-500 group-hover/item:text-white transition-all">
                      <ShieldCheck size={18} md:size={20} strokeWidth={2.5} />
                   </div>
                   <div>
                      <h4 className="text-[10px] md:text-[11px] font-black text-slate-900 mb-1 md:mb-2 uppercase tracking-widest italic">Eligibility</h4>
                      <p className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-tight leading-relaxed italic">You need 10 direct referrals who have made a purchase to unlock referral commissions.</p>
                   </div>
                </div>

                <div className="flex items-start gap-4 md:gap-6 group/item">
                   <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-50 rounded-lg md:rounded-xl flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-100 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all">
                      <CheckCircle2 size={18} md:size={20} strokeWidth={2.5} />
                   </div>
                   <div>
                      <h4 className="text-[10px] md:text-[11px] font-black text-slate-900 mb-4 uppercase tracking-widest italic">5-Level Commission</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                         {[
                           { l: "L1", v: "0.20%" },
                           { l: "L2", v: "0.10%" },
                           { l: "L3", v: "0.10%" },
                           { l: "L4", v: "0.05%" },
                           { l: "L5", v: "0.05%" }
                         ].map((tier, i) => (
                           <div key={i} className="p-3 md:p-4 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl text-center group/tier hover:bg-slate-900 transition-all">
                              <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase mb-1 group-hover/tier:text-amber-500">{tier.l}</p>
                              <p className="text-xs md:text-sm font-black text-slate-900 group-hover/tier:text-white italic">{tier.v}</p>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Important Directives Card */}
          <div className="bg-slate-900 p-8 md:p-14 rounded-[2rem] md:rounded-[3.5rem] shadow-2xl relative overflow-hidden border border-white/5">
             <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000"><ShieldCheck size={200} /></div>
             <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-10 relative z-10">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-amber-500 text-slate-900 rounded-xl md:rounded-[1.2rem] flex items-center justify-center shadow-lg">
                   <ShieldCheck size={24} md:size={28} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase italic leading-tight">Directives</h3>
             </div>
             
             <ul className="space-y-4 md:space-y-6 relative z-10">
                {[
                  "KYC verification is required before you can use all features.",
                  "You can sell your gold back to us anytime.",
                  "Any fraudulent activity will result in account termination.",
                  "Only share your own referral code.",
                  "All your earnings are credited to your wallet."
                ].map((note, i) => (
                  <li key={i} className="flex items-center gap-4 md:gap-6 text-[9px] md:text-[11px] text-slate-400 font-black uppercase tracking-widest italic">
                     <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-amber-500 rounded-full shrink-0"></div>
                     {note}
                  </li>
                ))}
             </ul>
          </div>

          {/* Realization Matrix Example */}
          <div className="bg-white border border-slate-200/60 p-6 md:p-14 rounded-[2rem] md:rounded-[3.5rem] shadow-sm">
             <div className="flex items-center gap-3 md:gap-4 mb-8 md:mb-10">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-amber-500 shadow-lg"><Landmark size={18} md:size={20} /></div>
                <h3 className="text-base md:text-lg font-black text-slate-900 tracking-tighter uppercase italic">Example</h3>
             </div>
             
             <div className="grid gap-4 md:gap-6">
                {[
                  { label: "Your Purchase", value: "₹50,000", hl: false },
                  { label: "Daily Cashback (1%)", value: "₹500 / day", hl: true },
                  { label: "Duration", value: "100 days", hl: false },
                  { label: "Total Earnings", value: "₹50,000 (100%)", hl: true }
                ].map((row, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 md:py-6 border-b border-slate-50 last:border-0">
                    <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-1 md:mb-0">{row.label}</span>
                    <span className={`text-sm md:text-base font-black italic tracking-tight ${row.hl ? 'text-amber-600' : 'text-slate-900'}`}>{row.value}</span>
                  </div>
                ))}
             </div>
             
             <div className="mt-8 md:mt-12 p-6 md:p-8 bg-emerald-50 border border-emerald-100 rounded-2xl md:rounded-[2rem] flex items-center gap-4 md:gap-6">
                <Zap className="text-emerald-500 shrink-0" size={20} md:size={24} strokeWidth={2.5} />
                <p className="text-emerald-700 text-[9px] md:text-[10px] font-black uppercase tracking-widest italic leading-relaxed">Activation of 10 qualified nodes enables auxiliary commissions beyond diurnal yields.</p>
             </div>
          </div>
          
        </main>
      </div>
    </div>
  );
};

export default RulesPage;
