import React, { useState, useEffect } from 'react';
import {
  Gift, CheckCircle2, Clock, Calendar, AlertCircle,
  Zap, TrendingUp, BarChart3, Activity, Loader2,
  Users, Coins, TrendingDown, ArrowRight, RefreshCw, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import CustomerHeader from '../components/CustomerHeader';
import API_BASE_URL from '../config';

const CashbackPlan = () => {
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'cashback' | 'referral'
  const [countdown, setCountdown] = useState('--h --m --s');

  const navigate = useNavigate();
  const user     = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!user.id) { navigate('/login'); return; }
    fetchData();

    // Auto-refresh every 30 seconds
    const iv = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(iv);
  }, []);

  // Real-time countdown timer
  useEffect(() => {
    if (!data?.stats?.next_payout_ts) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = data.stats.next_payout_ts - now;

      if (distance < 0) {
        setCountdown('Processing...');
        return;
      }

      const days    = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours   = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      const dayStr = days > 0 ? `${days}d ` : '';
      setCountdown(`${dayStr}${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [data]);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/customer/cashback_plan.php?user_id=${user.id}`);
      if (res.data.status === 'success') setData(res.data.data);
    } catch (err) {
      console.error('Failed to load cashback plan', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center text-amber-600">
      <div className="flex flex-col items-center gap-6">
        <Loader2 className="animate-spin" size={60} strokeWidth={3} />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse italic">Loading Cashback Plan...</p>
      </div>
    </div>
  );

  const stats        = data?.stats || {};
  const activeCycle  = data?.active_cycle;
  const transactions = data?.transactions || [];

  const filteredTx = transactions.filter(t => {
    if (activeFilter === 'cashback') return t.category === 'cashback' || t.category === 'payout';
    if (activeFilter === 'referral') return t.category === 'referral';
    return true;
  });

  const progressPct = activeCycle?.days_completed ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 flex font-inter text-slate-900 overflow-x-hidden selection:bg-amber-100 selection:text-amber-900">
      <Sidebar showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className="ml-0 lg:ml-72 min-h-screen relative w-full">
        <CustomerHeader setShowMobileMenu={setShowMobileMenu} activeTab="Asset Performance" />

        <main className="p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 w-full max-w-[1500px] space-y-8 md:space-y-12 pb-32 lg:pb-16">

          {/* Header */}
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Cashback Plan</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">My Cashback</h1>
              <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2 italic">1% daily payout from your investment — tracked live</p>
            </div>
            <button
              type="button"
              onClick={() => fetchData(true)}
              className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:border-amber-500 hover:text-amber-600 transition-all shadow-sm"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </motion.div>

          {/* ── STAT CARDS ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

            {/* Total Invested */}
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0 }}
              className="bg-slate-900 p-5 sm:p-7 rounded-[2rem] shadow-xl group relative overflow-hidden col-span-1"
            >
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700"><TrendingUp size={80} /></div>
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4"><TrendingUp size={18} className="text-amber-500" /></div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Total Invested</p>
              <h3 className="text-xl md:text-2xl font-black text-white italic tracking-tighter">₹{parseFloat(stats.total_invested || 0).toLocaleString()}</h3>
              <p className="text-[8px] text-amber-500/60 font-black uppercase mt-2 italic">{activeCycle?.product_name || 'Gold Investment'}</p>
            </motion.div>

            {/* Daily Payout */}
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
              className="bg-white border border-slate-200/60 p-5 sm:p-7 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-slate-900 transition-all duration-500"><Zap size={18} className="text-emerald-600 group-hover:text-amber-500 transition-colors duration-500" /></div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Daily Payout</p>
              <h3 className="text-xl md:text-2xl font-black text-emerald-600 italic tracking-tighter">₹{parseFloat(stats.total_daily_payout || 0).toLocaleString()}</h3>
              <p className="text-[8px] text-slate-300 font-black uppercase mt-2 italic">Per day (1%)</p>
            </motion.div>

            {/* Total Earned */}
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
              className="bg-white border border-slate-200/60 p-5 sm:p-7 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-slate-900 transition-all duration-500"><Gift size={18} className="text-amber-600 group-hover:text-amber-500 transition-colors duration-500" /></div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Total Earned</p>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 italic tracking-tighter">₹{parseFloat(stats.total_earned || 0).toLocaleString()}</h3>
              <p className="text-[8px] text-slate-300 font-black uppercase mt-2 italic">{stats.cashback_percentage || 0}% of investment</p>
            </motion.div>

            {/* Today Earned */}
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
              className="bg-white border border-slate-200/60 p-5 sm:p-7 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-slate-900 transition-all duration-500"><Coins size={18} className="text-blue-600 group-hover:text-amber-500 transition-colors duration-500" /></div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Today's Earning</p>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 italic tracking-tighter">₹{parseFloat(stats.today_earned || 0).toLocaleString()}</h3>
              <p className="text-[8px] text-slate-300 font-black uppercase mt-2 italic">Credited today</p>
            </motion.div>
          </div>

          {/* ── PROGRESS + NEXT PAYOUT ─────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

            {/* Cycle Progress Card */}
            <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
              className="lg:col-span-2 bg-white border border-slate-200/60 rounded-[2.5rem] p-8 md:p-12 shadow-sm"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase italic tracking-tight">Cycle Progress</h3>
                  {activeCycle?.product_name && (
                    <p className="text-[9px] text-amber-600 font-black uppercase tracking-widest mt-1 italic">
                      {activeCycle.product_name} · {parseFloat(activeCycle.weight || 0).toFixed(3)} Grams
                    </p>
                  )}
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                  activeCycle?.status === 'active'    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  activeCycle?.status === 'pending'   ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' :
                  activeCycle?.status === 'completed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                  'bg-slate-50 text-slate-400 border-slate-200'
                }`}>
                  {activeCycle?.status === 'active'    ? '● Active' :
                   activeCycle?.status === 'pending'   ? '⏳ Pending Approval' :
                   activeCycle?.status === 'completed' ? '✓ Completed' : 'No Plan'}
                </div>
              </div>

              {/* Big progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">
                  <span>Days Completed</span>
                  <span className="text-amber-600">{progressPct} / 100</span>
                </div>
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                  {activeCycle?.status === 'pending' ? (
                    <div className="h-full w-full bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 rounded-full animate-pulse" />
                  ) : (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${activeCycle?.status === 'completed' ? 100 : progressPct}%` }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                      className={`h-full rounded-full relative ${activeCycle?.status === 'completed' ? 'bg-blue-500' : 'bg-slate-900'}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                    </motion.div>
                  )}
                </div>
                <div className="flex justify-between text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1.5">
                  <span>Day 0</span>
                  <span>Day 100</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100 mt-6">
                <div className="text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Remaining</p>
                  <p className="text-lg font-black text-rose-600 italic tracking-tighter">₹{parseFloat(activeCycle?.remaining_value ?? stats.total_invested ?? 0).toLocaleString()}</p>
                </div>
                <div className="text-center border-x border-slate-100">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Days Left</p>
                  <p className="text-lg font-black text-slate-900 italic tracking-tighter">{activeCycle?.days_remaining ?? 100}</p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Referral Income</p>
                  <p className="text-lg font-black text-amber-600 italic tracking-tighter">₹{parseFloat(stats.referral_earned || 0).toLocaleString()}</p>
                </div>
              </div>
            </motion.div>

            {/* Next Payout + Info */}
            <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
              className="bg-slate-900 text-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 transition-transform duration-1000"><Clock size={200} /></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/20"><Clock size={24} className="text-amber-500" /></div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Next Payout In</p>
                <h3 className="text-3xl font-black text-white italic tracking-tighter mb-2">{countdown}</h3>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest italic">Weekdays only • 09:00 AM</p>
              </div>
              <div className="relative z-10 mt-8 space-y-3">
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                  <Star size={14} className="text-amber-500 shrink-0" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">1% of invested amount credited daily</p>
                </div>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                  <Calendar size={14} className="text-blue-400 shrink-0" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">No payouts on weekends & holidays</p>
                </div>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                  <TrendingDown size={14} className="text-rose-400 shrink-0" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Cycle closes when 100% is earned</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── TRANSACTION HISTORY ───────────────────────────────── */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            className="bg-white border border-slate-200/60 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm overflow-hidden"
          >
            <div className="p-8 md:p-12 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-amber-500 shadow-lg"><Activity size={20} /></div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tighter uppercase italic">Cashback History</h3>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest italic">{filteredTx.length} entries found</p>
                </div>
              </div>
              {/* Filter tabs */}
              <div className="flex gap-2">
                {['all', 'cashback', 'referral'].map(f => (
                  <button key={f} type="button" onClick={() => setActiveFilter(f)}
                    className={`px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${
                      activeFilter === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-amber-400 hover:text-amber-600'
                    }`}
                  >{f}</button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[500px]">
                <thead>
                  <tr className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 border-b border-slate-100 italic">
                    <th className="px-8 md:px-12 py-5">Date</th>
                    <th className="px-8 md:px-12 py-5">Type</th>
                    <th className="px-8 md:px-12 py-5">Description</th>
                    <th className="px-8 md:px-12 py-5 text-right">Amount</th>
                    <th className="px-8 md:px-12 py-5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTx.length > 0 ? filteredTx.map((tx, idx) => {
                    const date      = new Date(tx.created_at);
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                    const isCashback= tx.category === 'cashback';

                    return (
                      <motion.tr key={idx}
                        initial={{ opacity:0 }} whileInView={{ opacity:1 }}
                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group/row"
                      >
                        <td className="px-8 md:px-12 py-5 text-[10px] font-black text-slate-900 italic">
                          {date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          <p className="text-[8px] text-slate-300 font-black uppercase mt-0.5">{date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="px-8 md:px-12 py-5">
                          <span className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                            isCashback ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                          }`}>
                            {isCashback ? '🎁 Cashback' : '👥 Referral'}
                          </span>
                        </td>
                        <td className="px-8 md:px-12 py-5 text-[9px] font-black text-slate-500 italic max-w-[200px] truncate">{tx.description}</td>
                        <td className="px-8 md:px-12 py-5 text-right">
                          <span className="text-base md:text-lg font-black text-emerald-600 italic tracking-tighter group-hover/row:text-amber-600 transition-colors">
                            +₹{parseFloat(tx.amount).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-8 md:px-12 py-5 text-center">
                          <div className={`inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest ${tx.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {tx.status === 'completed' ? <CheckCircle2 size={13} strokeWidth={3} /> : <Clock size={13} />}
                            {tx.status}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-4 text-slate-300">
                          <Activity size={48} className="opacity-30" />
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] italic text-slate-400">No {activeFilter !== 'all' ? activeFilter : ''} transactions yet</p>
                          {activeCycle?.status === 'pending' && (
                            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest italic animate-pulse">Awaiting admin approval to start payouts</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

        </main>
      </div>
    </div>
  );
};

export default CashbackPlan;
