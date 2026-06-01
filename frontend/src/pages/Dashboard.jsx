import React, { useState, useEffect } from 'react';
import { 
  Wallet, TrendingUp, Users, ArrowRight, Bell, LogOut, X, 
  Loader2, CheckCircle2, AlertTriangle, ShieldCheck, ShoppingBag, 
  Calendar, FileText, ChevronRight, Search, Menu, Award,
  History, Clock, AlertCircle, RefreshCw, ShoppingCart, 
  MessageCircle, Star, Package, CreditCard, ChevronDown, 
  LayoutGrid, Zap, Percent, HelpCircle, Edit, Trash2, Globe, TrendingDown, Network, Copy, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import CustomerHeader from '../components/CustomerHeader';
import API_BASE_URL from '../config';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}') || {};

  useEffect(() => {
    if (!user || !user.id) {
      navigate('/login');
      return;
    }

    // Role-based institutional redirection
    if (user.role === 'admin') { navigate('/admin'); return; }
    if (user.role === 'manager') { navigate('/manager'); return; }
    if (user.role === 'staff') { navigate('/staff'); return; }
    if (user.role === 'advocate') { navigate('/advocate'); return; }

    fetchDashboardData();

    const pollInterval = setInterval(() => {
      fetchDashboardData(true);
    }, 30000);

    return () => clearInterval(pollInterval);
  }, []);

  const fetchDashboardData = async (isSilent = false) => {
    if (isSilent) setRefreshing(true);
    try {
      if (!isSilent) setError(null);
      const dbRes = await axios.get(`${API_BASE_URL}/customer/dashboard.php?user_id=${user?.id}`);
      if (dbRes.data.status === 'success') {
        setData(dbRes.data.data);
      } else {
        setError(dbRes.data.message || "Failed to load dashboard data");
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
      setError("Network error: Could not connect to the server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center text-amber-600">
      <div className="flex flex-col items-center gap-6">
        <Loader2 className="animate-spin" size={60} strokeWidth={3} />
        <p className="text-[10px] font-black animate-pulse uppercase tracking-[0.4em] italic">Synchronizing Portal...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-inter text-slate-900 overflow-x-hidden selection:bg-amber-100 selection:text-amber-900 relative">
      <Sidebar 
        showMobileMenu={showMobileMenu} 
        setShowMobileMenu={setShowMobileMenu} 
      />

      <div className="ml-0 lg:ml-72 min-h-screen relative">
         <CustomerHeader setShowMobileMenu={setShowMobileMenu} activeTab="Dashboard" />

        <main className="p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 w-full max-w-[1500px] space-y-8 md:space-y-12 pb-32 lg:pb-16">
           {/* High-End Header */}
           <motion.div 
             initial={{ opacity: 0, y: -20 }}
             animate={{ opacity: 1, y: 0 }}
             className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
           >
              <div className="max-w-2xl">
                 <div className="flex items-center gap-3 mb-3 md:mb-4">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Active Session</span>
                 </div>
                 <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Dashboard</h1>
                 <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2 md:mt-4 italic">Welcome back, {user.name} • User ID {user.id}</p>
              </div>
               <div className="flex items-center gap-3 w-full lg:w-auto">
                  <button type="button" onClick={() => fetchDashboardData(true)}
                    className="bg-white border border-slate-200 px-5 py-5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:border-amber-500 hover:text-amber-600 transition-all shadow-sm"
                  ><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /></button>
                  <button onClick={() => navigate('/shop')} className="flex-1 lg:flex-none bg-slate-900 text-white px-8 md:px-12 py-5 rounded-2xl md:rounded-[2rem] text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] hover:bg-amber-600 transition-all shadow-2xl active:scale-95 italic group flex items-center justify-center gap-3">
                     Invest Now <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                  </button>
               </div>
           </motion.div>

           {/* Core Metrics Grid — 4 custom tiles */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">

              {/* Tile 1 — Total Invested Amount */}
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0 }}
                className="bg-slate-900 p-6 sm:p-8 lg:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl hover:shadow-amber-900/20 hover:-translate-y-2 transition-all group relative overflow-hidden"
              >
                <div className="absolute -right-8 -bottom-8 text-white/5 group-hover:scale-110 transition-transform duration-700"><TrendingUp size={100} /></div>
                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-amber-500/20 transition-all">
                  <TrendingUp className="text-amber-500" size={22} />
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Total Investment</p>
                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter italic">
                  ₹{parseFloat(data?.active_cycle?.total_value || 0).toLocaleString()}
                </h3>
                <p className="text-[8px] font-bold text-amber-500/60 uppercase tracking-widest mt-3 italic">
                  {data?.active_cycle?.product_name || 'Your Purchase'} · {parseFloat(data?.active_cycle?.weight || 0).toFixed(3)}g
                </p>
              </motion.div>

              {/* Tile 2 — Gold Cashback (Total Earned) */}
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
                className="bg-white p-6 sm:p-8 lg:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-200/60 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group"
              >
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-slate-900 transition-all duration-500">
                  <Award className="text-amber-600" size={22} />
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Gold Cashback</p>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter italic">
                  ₹{parseFloat(data?.active_cycle?.total_earned || 0).toLocaleString()}
                </h3>
                <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mt-3 italic flex items-center gap-2">
                   <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span> Total Realized
                </p>
              </motion.div>

              {/* Tile 3 — Daily Cashback (Today's Earning) */}
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
                className="bg-white p-6 sm:p-8 lg:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-200/60 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group"
              >
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-slate-900 transition-all duration-500">
                  <Zap className="text-emerald-600" size={22} />
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Daily Cashback</p>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter italic">
                  ₹{parseFloat(data?.active_cycle?.today_earning || 0).toLocaleString()}
                </h3>
                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-3 italic">
                   Today's Earnings
                </p>
              </motion.div>

              {/* Tile 4 — Referral Earnings */}
               <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
                 className="bg-white p-6 sm:p-8 lg:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-200/60 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group"
               >
                 <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-slate-900 transition-all duration-500">
                   <Network className="text-blue-600" size={22} />
                 </div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Network Commissions</p>
                 <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter italic">
                   ₹{parseFloat(data?.active_cycle?.total_referral_earned || 0).toLocaleString()}
                 </h3>
                 <p className="text-[8px] font-bold text-blue-500 uppercase tracking-widest mt-3 italic flex items-center gap-2">
                    <span className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></span> Earnings from 5 referral levels
                 </p>
               </motion.div>

              {/* Tile 5 — Remaining Amount (decreasing) */}
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
                className={`p-6 sm:p-8 lg:p-10 rounded-[2rem] md:rounded-[3rem] border shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group ${data?.active_cycle?.is_closing_soon ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200/60'}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-slate-900 transition-all duration-500 ${data?.active_cycle?.is_closing_soon ? 'bg-rose-100' : 'bg-slate-50'}`}>
                  <TrendingDown className={data?.active_cycle?.is_closing_soon ? 'text-rose-500' : 'text-amber-600'} size={22} />
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Remaining Amount</p>
                <h3 className={`text-2xl md:text-3xl font-black tracking-tighter italic ${data?.active_cycle?.is_closing_soon ? 'text-rose-600' : 'text-slate-900'}`}>
                  ₹{parseFloat(data?.active_cycle?.remaining_value ?? data?.active_cycle?.total_value ?? 0).toLocaleString()}
                </h3>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${data?.active_cycle?.cashback_percentage || 0}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className={`h-full rounded-full ${data?.active_cycle?.is_closing_soon ? 'bg-rose-500' : 'bg-amber-400'}`}
                  />
                </div>
              </motion.div>

              {/* Tile 5 — Days Progress */}
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
                className="bg-white p-6 sm:p-8 lg:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-200/60 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group"
              >
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-slate-900 transition-all duration-500">
                  <Calendar className="text-blue-600 group-hover:text-amber-500 transition-colors duration-500" size={22} />
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Days Progress</p>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter italic">
                  {data?.active_cycle?.days_completed || 0}
                  <span className="text-slate-300 text-lg"> / 100</span>
                </h3>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${data?.active_cycle?.days_completed || 0}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="h-full bg-slate-900 rounded-full"
                  />
                </div>
              </motion.div>

              {/* Tile 6 — Wallet Balance (real-time) */}
              <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
                className="bg-white p-6 sm:p-8 lg:p-10 rounded-[2rem] md:rounded-[3rem] border border-slate-200/60 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group cursor-pointer"
                onClick={() => navigate('/wallet')}
              >
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-slate-900 transition-all duration-500">
                  <Wallet className="text-slate-900 group-hover:text-amber-500 transition-colors duration-500" size={22} />
                </div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Wallet Balance</p>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[8px] text-emerald-500 font-black uppercase tracking-widest">Live</span>
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter italic">
                  ₹{parseFloat(data?.balance || 0).toLocaleString()}
                </h3>
                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-3 italic group-hover:text-amber-600 transition-colors">
                  Tap to manage → withdraw
                </p>
              </motion.div>

           </div>


           {/* Institutional Analytics Section */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-2 bg-white p-6 sm:p-10 lg:p-14 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-200/60 shadow-sm flex flex-col"
              >
                 <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-10 md:mb-12">
                    <div>
                       <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Investment Progress</h3>
                       {data?.active_cycle?.product_name && (
                         <p className="text-[9px] md:text-[10px] text-amber-600 font-black uppercase tracking-widest mt-1 italic">
                           {data.active_cycle.product_name} · {parseFloat(data.active_cycle.weight || 0).toFixed(3)} Grams
                         </p>
                       )}
                       <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">Real-time tracking of your active investments</p>
                    </div>
                    <div className={`px-5 md:px-6 py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm italic ${
                      data?.active_cycle?.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      data?.active_cycle?.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      data?.active_cycle?.status === 'completed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      'bg-slate-50 text-slate-400 border-slate-200'
                    }`}>
                       {data?.active_cycle?.status === 'active' ? '● Active' :
                        data?.active_cycle?.status === 'pending' ? '⏳ Pending Approval' :
                        data?.active_cycle?.status === 'completed' ? '✓ Completed' : 'No Plan'}
                    </div>
                 </div>
                 
                 <div className="space-y-10 md:space-y-12">
                    {/* Progress Bar — status-aware */}
                    <div>
                       <div className="flex justify-between text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 md:mb-4 italic">
                          <span>Cycle Progress</span>
                          {data?.active_cycle?.status === 'pending' ? (
                            <span className="text-amber-500 flex items-center gap-1.5 animate-pulse">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full inline-block"></span>
                              Awaiting Admin Approval
                            </span>
                          ) : data?.active_cycle?.status === 'completed' ? (
                            <span className="text-blue-600">✓ 100 / 100 Days Complete</span>
                          ) : (
                            <span className="text-emerald-600">{data?.active_cycle?.days_completed || 0} / 100 Days</span>
                          )}
                       </div>

                       {/* Progress bar changes based on status */}
                       <div className="w-full h-3 md:h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                          {data?.active_cycle?.status === 'pending' ? (
                            /* Animated stripes for pending */
                            <div className="h-full w-full bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 animate-pulse rounded-full"
                              style={{ backgroundSize: '200% 100%', animation: 'pulse 1.5s ease-in-out infinite' }}
                            />
                          ) : (
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: data?.active_cycle?.status === 'completed' ? '100%' : `${data?.active_cycle?.days_completed || 0}%` }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              className={`h-full rounded-full relative ${
                                data?.active_cycle?.status === 'completed' ? 'bg-blue-500' : 'bg-slate-900'
                              }`}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
                            </motion.div>
                          )}
                       </div>

                       <div className="flex justify-between mt-2 text-[8px] font-black uppercase tracking-widest">
                         <span className="text-slate-300">Day 0</span>
                         {data?.active_cycle?.status === 'pending' && (
                           <span className="text-amber-500 italic">Pending admin review — updates within 30s of approval</span>
                         )}
                         <span className="text-slate-300">Day 100</span>
                       </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-8 md:pt-10 border-t border-slate-100">
                       <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-xl md:rounded-2xl flex items-center justify-center text-amber-500 shadow-sm shrink-0"><Calendar size={18} /></div>
                          <div>
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 italic">Days Done</p>
                             <p className="text-xs md:text-sm font-black text-slate-900 italic">{data?.active_cycle?.days_completed || 0} <span className="text-slate-300">/ 100</span></p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-xl md:rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0"><Zap size={18} /></div>
                          <div>
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 italic">Daily Payout</p>
                             <p className="text-xs md:text-sm font-black text-emerald-600 italic">₹{parseFloat(data?.active_cycle?.daily_payout || 0).toLocaleString()}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-xl md:rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shrink-0"><Clock size={18} /></div>
                          <div>
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 italic">Days Left</p>
                             <p className="text-xs md:text-sm font-black text-slate-900 italic">{data?.active_cycle?.days_remaining ?? 100} Days</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3 md:gap-4">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-xl md:rounded-2xl flex items-center justify-center text-amber-600 shadow-sm shrink-0"><TrendingUp size={18} /></div>
                          <div>
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 italic">Daily Rate</p>
                             <p className="text-xs md:text-sm font-black text-slate-900 italic">{data?.active_cycle?.daily_rate || 1}%</p>
                          </div>
                       </div>
                    </div>

                    {/* Active Plans Badge */}
                    {(data?.active_cycle?.active_plans_count || 0) > 0 && (
                      <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
                          {data.active_cycle.active_plans_count} Active Investment {data.active_cycle.active_plans_count > 1 ? 'Plans' : 'Plan'} Running
                        </span>
                      </div>
                    )}
                 </div>
              </motion.div>

              {/* Network Expansion — real referral link */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-slate-900 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group border border-white/5"
              >
                 <div className="absolute -right-20 -bottom-20 text-white/5 group-hover:scale-110 transition-transform duration-1000"><Globe size={250} /></div>
                 
                 <div className="relative z-10">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-6 lg:mb-10 border border-white/5 shadow-inner"><Users size={24} className="text-amber-500" /></div>
                    <h4 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase italic tracking-tighter mb-4 leading-none">Network Expansion</h4>
                    <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-6 max-w-[280px]">Accelerate your capital growth by onboarding new investors into your institutional matrix.</p>
                    
                    {/* Live referral stats from Database */}
                    <div className="flex items-center gap-3 mb-8">
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-2 text-center min-w-[100px]">
                        <p className="text-2xl font-black text-amber-400 italic">{data?.referrals_count || 0}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Referrals</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-center min-w-[120px]">
                        <p className="text-2xl font-black text-white italic">₹{parseFloat(data?.active_cycle?.total_referral_earned || 0).toLocaleString()}</p>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Earned</p>
                      </div>
                    </div>
                 </div>

                 <div className="relative z-10 space-y-3">
                   {/* Referral code display */}
                   {data?.referral_code && (
                     <div className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 flex items-center justify-between group/code hover:bg-white/10 transition-all cursor-pointer" onClick={() => {
                        const refCode = data?.referral_code;
                        const refLink = `${window.location.origin}/register?ref=${refCode}`;
                        navigator.clipboard.writeText(refLink);
                        alert("Referral link copied!");
                     }}>
                       <div>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] italic block mb-1">Your Referral Code</span>
                        <span className="text-base font-black text-amber-400 italic tracking-[0.2em]">{data.referral_code}</span>
                       </div>
                       <Copy size={16} className="text-slate-500 group-hover/code:text-amber-400 transition-colors" />
                     </div>
                   )}
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button 
                      onClick={() => navigate('/referrals')}
                      className="w-full bg-slate-800 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[9px] hover:bg-slate-700 transition-all border border-white/5 flex items-center justify-center gap-2 italic"
                    >
                        <Network size={14} className="text-amber-500" /> View Network
                    </button>
                    <button 
                      onClick={() => {
                        const refCode = data?.referral_code || user.id;
                        const refLink = `${window.location.origin}/register?ref=${refCode}`;
                        navigator.clipboard.writeText(refLink);
                        alert("Referral link copied to clipboard!");
                      }}
                      className="w-full bg-white text-slate-900 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[9px] hover:bg-amber-500 hover:text-white transition-all shadow-xl active:scale-95 italic flex items-center justify-center gap-2"
                    >
                        <Share2 size={14} /> Copy Link
                    </button>
                   </div>
                 </div>
              </motion.div>
           </div>


           {/* Security Warning Section */}
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-amber-50 border border-amber-200 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] flex flex-col md:flex-row items-center gap-6 md:gap-8 shadow-sm"
           >
              <div className="w-12 h-12 md:w-16 md:h-16 bg-amber-500 rounded-2xl md:rounded-3xl flex items-center justify-center text-white shadow-lg shrink-0"><AlertCircle size={24} md:size={32} /></div>
              <div className="text-center md:text-left">
                 <h4 className="text-base md:text-lg font-black text-amber-900 uppercase italic tracking-tight mb-1 md:mb-2">Important Notice</h4>
                 <p className="text-[9px] md:text-[10px] text-amber-800/70 font-bold leading-relaxed uppercase tracking-tight">You earn 1% daily rewards, paid every day. Total rewards are capped at 100% of your purchase amount.</p>
              </div>
           </motion.div>

           {/* Shortcut Actions */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <button 
                onClick={() => navigate('/shop')} 
                className="bg-white border border-slate-200 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] flex flex-col items-center justify-center group hover:border-amber-500 transition-all shadow-sm hover:shadow-2xl"
              >
                 <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-900 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center text-amber-500 mb-6 md:mb-8 group-hover:scale-110 transition-transform duration-500 shadow-xl"><TrendingUp size={32} md:size={40} strokeWidth={2.5} /></div>
                 <h4 className="text-lg md:text-xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">Acquire Gold</h4>
                 <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest italic text-center">Scale your institutional portfolio</p>
              </button>
              
              <button 
                onClick={() => navigate('/wallet')} 
                className="bg-white border border-slate-200 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] flex flex-col items-center justify-center group hover:border-slate-900 transition-all shadow-sm hover:shadow-2xl"
              >
                 <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center text-slate-400 mb-6 md:mb-8 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-xl"><CreditCard size={32} md:size={40} strokeWidth={2.5} /></div>
                 <h4 className="text-lg md:text-xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">Wallet Operations</h4>
                 <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest italic text-center">Manage withdrawals and terminal history</p>
              </button>
           </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
