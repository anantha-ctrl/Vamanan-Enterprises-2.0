import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Search, History, CreditCard, ArrowLeft, Loader2, 
  Users, Bell, Menu, X, Filter, ChevronRight, Activity, MessageCircle, ShieldAlert, Zap, LifeBuoy, ShieldCheck, Megaphone
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

import API_BASE_URL from '../config';
import { hasPermission } from '../utils/accessControl';

const StaffDashboard = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : {};
  const role = user.role || 'customer';

  const isTabAllowed = (tabId) => {
    return hasPermission(user, tabId);
  };

  const [data, setData] = useState({ activityLog: [], newCustomers: [], totalSupportTickets: 0 });
  const [loading, setLoading] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStaffData();
    const interval = setInterval(() => fetchStaffData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStaffData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/staff/stats.php`);
      if (response.data.status === 'success') {
        setData(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch staff data");
    } finally {
      setLoading(false);
    }
  };

  // Redirect if current tab is not allowed
  useEffect(() => {
    if (!loading && !isTabAllowed(activeTab)) {
      setActiveTab('overview');
    }
  }, [activeTab, loading]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center text-amber-600">
      <div className="flex flex-col items-center gap-6">
        <Loader2 className="animate-spin" size={60} strokeWidth={3} />
        <p className="text-[10px] font-black animate-pulse uppercase tracking-[0.4em] italic">Loading support dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-inter text-blue-900 overflow-x-hidden selection:bg-amber-100 selection:text-amber-900">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        showMobileMenu={showMobileMenu} 
        setShowMobileMenu={setShowMobileMenu} 
      />

      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen w-full">
        {/* Institutional Header */}
        <header className="bg-white border-b border-slate-100 px-8 py-6 flex justify-between items-center sticky top-0 z-50 shadow-sm backdrop-blur-md bg-white/90">
          <div className="flex items-center gap-4">
             <div className="lg:hidden w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center p-1.5 shadow-lg mr-2">
                <img src="/vamanan-logo.png" alt="Logo" className="w-full h-full object-contain" />
             </div>
             <h1 className="text-lg font-black tracking-tighter text-blue-900 uppercase italic leading-none">
               Support <span className="text-amber-600">Terminal</span>
             </h1>
          </div>
          <div className="flex items-center gap-6">
             <div className="hidden md:flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Support Desk Active</span>
             </div>
             <button onClick={() => setShowMobileMenu(true)} className="lg:hidden p-3 bg-slate-50 border border-slate-200 rounded-xl text-blue-900 active:scale-95 transition-all">
               <Menu size={20} />
             </button>
             <div className="hidden md:flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-900 text-amber-500 rounded-xl flex items-center justify-center font-black italic shadow-lg border border-white/5">
                   S
                </div>
             </div>
          </div>
        </header>

        <main className="p-6 md:p-12 lg:p-16 max-w-7xl mx-auto w-full space-y-12 pb-32 lg:pb-16">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Support Infrastructure</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-blue-900 tracking-tighter uppercase italic leading-none">Command Center</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-3 italic">Monitor customer activity and resolve support requests</p>
            </div>
            <div className="relative group w-full md:w-80">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Audit Entities..." 
                className="w-full bg-white border border-slate-200 rounded-[1.5rem] py-4 pl-14 pr-8 text-[11px] font-black uppercase tracking-widest italic outline-none focus:border-amber-500 transition-all shadow-sm" 
              />
            </div>
          </motion.div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-12">
                 {/* Activity Ledger */}
                 <motion.div 
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="bg-white border border-slate-200/60 p-10 md:p-16 rounded-[4rem] shadow-sm relative overflow-hidden"
                 >
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><History size={150} /></div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 mb-16 relative z-10">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center text-amber-500 shadow-lg"><Activity size={20} /></div>
                          <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.3em] italic">Network Ledger</h3>
                       </div>
                       <button className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-blue-900 transition italic border-b border-slate-200 pb-1">Export Records</button>
                    </div>
                    
                    <div className="space-y-6 relative z-10">
                       {data.activityLog?.length > 0 ? data.activityLog.map((log, i) => (
                         <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-8 bg-slate-50 rounded-[2.5rem] border border-transparent hover:border-slate-200 hover:bg-white transition-all group shadow-sm gap-6 sm:gap-4">
                            <div className="flex items-center gap-6">
                               <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center shadow-lg border border-white/5 transition-transform group-hover:scale-110 duration-500 ${log.type === 'credit' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                  <CreditCard size={24} strokeWidth={1.5} />
                               </div>
                               <div>
                                  <p className="text-sm font-black text-blue-900 uppercase italic tracking-tight mb-1">{log.name}</p>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">{log.action}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic mb-2">{log.created_at}</p>
                               <p className={`text-xl font-black italic tracking-tighter ${log.type === 'credit' ? 'text-amber-600' : 'text-blue-600'}`}>
                                  {log.type === 'credit' ? '+' : '-'} ₹{parseFloat(log.amount).toLocaleString()}
                               </p>
                            </div>
                         </div>
                       )) : (
                         <div className="py-32 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center gap-8 shadow-inner">
                            <Activity size={60} className="text-slate-100" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">No diurnal logs detected for this session</p>
                         </div>
                       )}
                    </div>
                 </motion.div>
              </div>

              <div className="space-y-12">
                 {/* Support Status Matrix */}
                 <motion.div 
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="bg-blue-900 text-white p-12 md:p-16 rounded-[4rem] shadow-2xl relative overflow-hidden group border border-white/5"
                 >
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000"><LifeBuoy size={180} /></div>
                    <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4 italic relative z-10">Pending Inquiries</p>
                    <h3 className="text-6xl md:text-8xl font-black mb-10 italic tracking-tighter relative z-10 leading-none">{data.totalSupportTickets || 0}</h3>
                    <p className="text-[11px] text-slate-400 mb-12 leading-relaxed font-black uppercase tracking-widest italic relative z-10">Customers waiting for help. Target response time: 120 minutes.</p>
                    <button 
                      onClick={() => setActiveTab('tickets')}
                      className="w-full bg-white text-blue-900 py-6 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-amber-600 hover:text-white transition-all shadow-xl italic relative z-10"
                    >
                       Open Ticketing Bridge
                    </button>
                 </motion.div>

                 {/* New Entity Registrations */}
                 <motion.div 
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.1 }}
                   className="bg-white border border-slate-200/60 p-10 rounded-[3.5rem] shadow-sm overflow-hidden"
                 >
                    <div className="flex items-center gap-4 mb-12">
                       <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center text-amber-500 shadow-lg"><Users size={20} /></div>
                       <h4 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.3em] italic">Recent Onboarding</h4>
                    </div>
                    <div className="space-y-6">
                       {data.newCustomers?.map((customer, i) => (
                          <div key={i} className="flex items-center gap-6 p-6 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 cursor-pointer group shadow-sm">
                             <div className="w-12 h-12 bg-blue-900 text-white rounded-xl flex items-center justify-center font-black italic text-sm group-hover:bg-amber-500 group-hover:text-blue-900 transition-colors">{customer.name[0]}</div>
                             <div className="overflow-hidden min-w-0">
                                <p className="font-black text-sm text-blue-900 uppercase italic tracking-tight truncate mb-1">{customer.name}</p>
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest italic truncate">{customer.email}</p>
                             </div>
                             <ChevronRight size={18} className="text-slate-200 ml-auto group-hover:text-amber-500 transition-colors" />
                          </div>
                       ))}
                    </div>
                 </motion.div>
              </div>
            </div>
          )}

          {activeTab === 'kyc' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200/60 p-10 md:p-16 rounded-[4rem] shadow-sm">
               <div className="flex items-center gap-4 mb-16">
                  <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center text-amber-500 shadow-lg"><ShieldCheck size={20} /></div>
                  <h3 className="text-2xl font-black text-blue-900 uppercase italic tracking-tighter">Customer Verification Queue</h3>
               </div>
               <div className="space-y-8">
                  <div className="py-32 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center gap-8 shadow-inner">
                     <ShieldCheck size={60} className="text-slate-100" />
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Refer to manager for identity approval</p>
                     <p className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">Access restricted to authorized staff</p>
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'tickets' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200/60 p-10 md:p-16 rounded-[4rem] shadow-sm">
               <div className="flex items-center gap-4 mb-16">
                  <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center text-amber-500 shadow-lg"><Megaphone size={20} /></div>
                  <h3 className="text-2xl font-black text-blue-900 uppercase italic tracking-tighter">Support Communication Hub</h3>
               </div>
               <div className="space-y-8">
                  <div className="py-32 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center gap-8 shadow-inner">
                     <MessageCircle size={60} className="text-slate-100" />
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Global Dispatch Terminal Initializing...</p>
                     <p className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">Awaiting Diurnal Synchronization</p>
                  </div>
               </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StaffDashboard;

