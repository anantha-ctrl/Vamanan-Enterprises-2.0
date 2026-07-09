import React, { useState, useEffect } from 'react';
import {
  Copy, Users, User, Share2, Network, TrendingUp, ShieldCheck,
  CheckCircle2, Loader2, Globe, Zap, XCircle, RefreshCw,
  ArrowRight, Gift, Clock, Star, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import CustomerHeader from '../components/CustomerHeader';
import RecencyGenealogyTree from '../components/RecencyGenealogyTree';
import { motion, AnimatePresence } from 'framer-motion';
import API_BASE_URL from '../config';

const LEVEL_STYLES = [
  { bg: 'bg-blue-900', text: 'text-white', ring: 'border-blue-800', label: 'bg-amber-500 text-blue-900' },
  { bg: 'bg-blue-800', text: 'text-white', ring: 'border-slate-700', label: 'bg-blue-500 text-white' },
  { bg: 'bg-slate-700', text: 'text-white', ring: 'border-slate-600', label: 'bg-amber-600 text-white' },
  { bg: 'bg-slate-600', text: 'text-white', ring: 'border-slate-500', label: 'bg-blue-400 text-blue-900' },
  { bg: 'bg-slate-500', text: 'text-white', ring: 'border-slate-400', label: 'bg-amber-400 text-blue-900' },
];

// Colours + descriptions for the "Referral Earnings Structure" diagram (matches reference image)
const STRUCTURE_LEVELS = [
  { color: '#D4AF37', desc: 'Direct referrals you bring in' },
  { color: '#B8860B', desc: 'Referrals made by your Level 1 network' },
  { color: '#0B2545', desc: 'Referrals made by your Level 2 network' },
  { color: '#2563EB', desc: 'Referrals made by your Level 3 network' },
  { color: '#60A5FA', desc: 'Referrals made by your Level 4 network' },
];

const Referrals = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState(null);
  const [genealogy, setGenealogy] = useState([]);
  const [loadingGenealogy, setLoadingGenealogy] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!user.id) { navigate('/login'); return; }
    fetchReferrals();
    fetchGenealogy();
    const iv = setInterval(() => {
      fetchReferrals(true);
      fetchGenealogy(true);
    }, 10000); // poll every 10s for near real-time level updates
    return () => clearInterval(iv);
  }, []);

  const fetchGenealogy = async (silent = false) => {
    if (!silent) setLoadingGenealogy(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/customer/get_genealogy.php?user_id=${user.id}`);
      // Prefer the nested hierarchy (org-chart); fall back to flat list for older API.
      if (res.data.status === 'success') setGenealogy(res.data.tree ?? res.data.data);
    } catch (err) { console.error('Failed to fetch genealogy', err); }
    finally { setLoadingGenealogy(false); }
  };

  const fetchReferrals = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/customer/referrals.php?user_id=${user.id}`);
      if (res.data.status === 'success') setData(res.data.data);
    } catch (err) { console.error('Failed to fetch referrals', err); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }).catch(() => {
        fallbackCopyText(text);
      });
    } else {
      fallbackCopyText(text);
    }
  };

  const fallbackCopyText = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Fallback copy failed', err);
    }
    document.body.removeChild(textArea);
  };

  const copyLink = () => {
    if (!data?.referral_code) {
      alert("Data is still loading. Please wait...");
      return;
    }
    const link = `${window.location.origin}/register?ref=${data.referral_code}`;
    copyToClipboard(link);
  };

  const shareWhatsApp = () => {
    if (!data?.referral_code) {
      alert("Data is still loading. Please wait...");
      return;
    }
    const link = `${window.location.origin}/register?ref=${data.referral_code}`;
    const msg = `🏆 *Vamanan Enterprises V | Earn Daily Rewards*\n\nJoin Vamanan Enterprises V and earn *1% Daily Cashback* on gold.\n\n✅ *Referral Code:* ${data.referral_code}\n✅ *Join Link:* ${link}\n\n_Start your journey today!_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center text-amber-600">
      <div className="flex flex-col items-center gap-6">
        <Loader2 className="animate-spin" size={60} strokeWidth={3} />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse italic">Loading Referral Network...</p>
      </div>
    </div>
  );

  const directReferrals = data?.direct_referrals || [];
  const levels = data?.levels || [];
  const totalNodes = levels.reduce((s, l) => s + l.count, 0);
  const progress = data?.progress || 0;
  const eligible = data?.eligible || false;
  const totalEarnings = data?.total_network_earnings || 0;
  const todayEarnings = data?.today_earnings || 0;
  const history = data?.history || [];
  const dailyCashbackRate = data?.daily_cashback_rate || '1%';

  return (
    <div className="min-h-screen bg-slate-50 flex font-inter text-blue-900 overflow-x-hidden selection:bg-amber-100 selection:text-amber-900">
      <Sidebar showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className="ml-0 lg:ml-72 min-h-screen relative">
        <CustomerHeader setShowMobileMenu={setShowMobileMenu} activeTab="Referral Network" />

        <main className="p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 w-full max-w-[1500px] space-y-8 md:space-y-12 pb-32 lg:pb-16">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
          >
            <div>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-blue-900 tracking-tighter uppercase italic leading-none">Referral Network</h1>
              <p className="text-[9px] md:text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] mt-3 italic">Your referral network & earnings</p>
            </div>
            {/* <button type="button" onClick={() => fetchReferrals(true)}
              className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:border-amber-500 hover:text-amber-600 transition-all shadow-sm"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
            </button> */}
          </motion.div>

          {/* ── TOP REFERRAL CODE HERO ──────────────────────────── */}
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200/60 p-8 md:p-14 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-10 text-slate-100 opacity-60 group-hover:scale-110 transition-transform duration-1000"><Network size={280} /></div>

            <div className="relative z-10 flex flex-col xl:flex-row xl:items-center gap-12 xl:gap-24">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-6">
                  <Star size={10} className="text-amber-600" />
                  <p className="text-[8px] font-black text-amber-700 uppercase tracking-widest italic">Member</p>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 italic">Your Referral Code</p>
                <div className="relative inline-block mb-8 group/code w-full">
                  <h2
                    onClick={copyLink}
                    className="text-4xl sm:text-6xl md:text-9xl font-black text-blue-900 tracking-tighter italic uppercase leading-none cursor-pointer hover:text-amber-500 transition-colors duration-500 select-none break-all"
                  >
                    <span className="text-amber-500">{data?.referral_code?.slice(0, 3)}</span>
                    {data?.referral_code?.slice(3)}
                  </h2>
                  <div className="absolute -bottom-4 left-0 w-full h-1 bg-amber-500 transform scale-x-0 group-hover/code:scale-x-100 transition-transform duration-700 origin-left hidden sm:block" />
                </div>
                <div className="flex flex-col sm:flex-row flex-wrap gap-4 md:gap-5">
                  <button type="button" onClick={copyLink}
                    className={`group flex items-center justify-center gap-4 px-6 sm:px-10 py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95 italic w-full sm:w-auto ${copied ? 'bg-amber-500 text-white shadow-amber-500/30' : 'bg-blue-900 text-white hover:bg-blue-800 shadow-blue-900/30'}`}
                  >
                    <Copy size={16} className={copied ? '' : 'group-hover:rotate-12 transition-transform'} />
                    {copied ? 'Link Copied!' : 'Copy Link'}
                  </button>
                  <button type="button" onClick={shareWhatsApp}
                    className="group flex items-center justify-center gap-4 px-6 sm:px-10 py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] text-[10px] sm:text-[11px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-500 hover:text-white transition-all shadow-xl active:scale-95 italic w-full sm:w-auto"
                  >
                    <Share2 size={16} className="group-hover:scale-110 transition-transform" /> WhatsApp
                  </button>
                </div>
              </div>

              <div className="xl:w-[400px] bg-slate-50/50 border border-slate-100 p-6 sm:p-8 md:p-12 rounded-[2rem] sm:rounded-[3rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><TrendingUp size={150} /></div>
                <div className="relative z-10 space-y-8 sm:space-y-10">
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Total Network Earnings</p>
                    <h3 className="text-3xl sm:text-4xl md:text-6xl font-black text-blue-900 italic tracking-tighter leading-none">₹{parseFloat(totalEarnings).toLocaleString()}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:gap-8">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Today</p>
                      <h3 className="text-xl sm:text-2xl font-black text-amber-600 italic tracking-tighter leading-none">+₹{parseFloat(todayEarnings).toLocaleString()}</h3>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Members</p>
                      <h3 className="text-xl sm:text-2xl font-black text-blue-600 italic tracking-tighter leading-none">{totalNodes}</h3>
                    </div>
                  </div>
                  <div className="pt-8 border-t border-slate-200">
                    <div className="flex justify-between items-end mb-3">
                      <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest italic">Total Earnings Limit</p>
                      <p className="text-[11px] font-black text-amber-600 italic">{(data?.user_investment > 0 ? (totalEarnings / data.user_investment * 100).toFixed(1) : 0)}% / 100%</p>
                    </div>
                    <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-slate-100 shadow-inner p-0.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (data?.user_investment > 0 ? (totalEarnings / data.user_investment * 100) : 0))}%` }}
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                      </motion.div>
                    </div>
                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-3 italic leading-relaxed">
                      Your total earnings (cashback + referral) are capped at 100% of your purchase amount. Once you reach it, the plan is complete.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── STAT CARDS (2×2) ────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: 'Direct Referrals', value: directReferrals.length, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Network Depth', value: `${levels.filter(l => l.count > 0).length}/5 Levels`, icon: Network, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Network Strength', value: `${totalNodes} Members`, icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Total Earnings', value: `₹${parseFloat(totalEarnings).toLocaleString()}`, icon: Gift, color: 'text-blue-600', bg: 'bg-blue-50' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-white border border-slate-200/60 p-5 sm:p-6 rounded-[1.8rem] sm:rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col justify-between min-h-[140px] sm:min-h-[160px]"
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${s.bg} rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-900 transition-all duration-500`}>
                  <s.icon size={18} className={`${s.color} group-hover:text-amber-500 transition-colors duration-500`} />
                </div>
                <div>
                  <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">{s.label}</p>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-black text-blue-900 italic tracking-tighter">{s.value}</h3>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── REFERRAL EARNINGS STRUCTURE (5 LEVELS DEEP) ─────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200/60 rounded-[2.5rem] shadow-sm overflow-hidden"
          >
            <div className="p-8 md:p-12 pb-6">
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-blue-900 tracking-tighter italic uppercase leading-none">Referral Earnings Structure</h2>
              <p className="text-[10px] md:text-xs text-slate-400 font-black uppercase tracking-[0.15em] mt-3 italic">Earn additional income by growing your network — 5 levels deep</p>
            </div>

            <div className="px-4 sm:px-8 md:px-12 pb-10 flex flex-col items-stretch">
              {/* YOU node */}
              <div className="flex justify-center">
                <div className="w-full max-w-md bg-blue-900 rounded-2xl px-8 py-5 text-center shadow-xl">
                  <p className="text-amber-400 font-black uppercase tracking-widest text-sm italic">You</p>
                  <p className="text-amber-400 font-black uppercase tracking-wide text-base sm:text-lg italic mt-1">{dailyCashbackRate} Daily Cashback</p>
                </div>
              </div>

              {/* connector */}
              <div className="flex justify-center">
                <div className="w-1.5 h-6 bg-amber-500" />
              </div>

              {/* Cascading level bars */}
              <div className="space-y-2.5">
                {STRUCTURE_LEVELS.map((s, idx) => {
                  const lvl = levels[idx] || {};
                  const rate = lvl.commission || '—';
                  const indent = idx * 3; // staggered cascade like the reference image
                  return (
                    <motion.div key={idx}
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }}
                      className="rounded-xl shadow-lg flex items-center gap-3 sm:gap-6 px-5 sm:px-8 py-4 sm:py-5"
                      style={{ backgroundColor: s.color, marginLeft: `${indent}%`, marginRight: `${(4 - idx) * 1.5}%` }}
                    >
                      <span className="text-white font-black uppercase italic tracking-wider text-xs sm:text-sm shrink-0 w-16 sm:w-20">Level {idx + 1}</span>
                      <span className="text-white font-black italic text-xl sm:text-3xl leading-none shrink-0 w-24 sm:w-32">
                        {rate}<span className="text-sm sm:text-lg font-bold"> / day</span>
                      </span>
                      <span className="text-white/90 font-semibold text-[10px] sm:text-sm italic leading-tight flex-1">{s.desc}</span>
                      <span className="hidden md:flex flex-col items-end shrink-0">
                        <span className="text-white/60 font-black uppercase tracking-widest text-[8px] italic">Members</span>
                        <span className="text-white font-black italic text-lg leading-none">{lvl.count ?? 0}</span>
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* TOTAL POTENTIAL banner */}
              <div className="mt-6 bg-blue-900 rounded-xl px-5 sm:px-8 py-5 text-center">
                <p className="text-amber-400 font-black uppercase tracking-wide text-[11px] sm:text-base italic leading-relaxed">
                  Total Potential: {dailyCashbackRate} (own)
                  {levels.map((l, i) => <span key={i}> + {l.commission}</span>)}
                  {' '}daily earnings at full 5-level network
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── ELIGIBILITY PROGRESS ────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200/60 p-8 md:p-12 rounded-[2.5rem] shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12"><Users size={200} /></div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-900 rounded-2xl flex items-center justify-center text-amber-500 shadow-xl"><ShieldCheck size={24} /></div>
                <div>
                  <h3 className="text-base font-black text-blue-900 uppercase italic tracking-tight">Referral Commission Rules</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic mt-1 leading-relaxed max-w-xl">
                    You earn referral commission from your first 10 direct members. After 10 members, referral commission stops, but your own daily cashback continues until you reach the 100% limit.
                  </p>
                </div>
              </div>
              <div className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border italic transition-all ${progress >= 10 ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                {progress >= 10 ? (
                  <><AlertCircle size={14} strokeWidth={3} /> Commission Cap Reached</>
                ) : (
                  <><CheckCircle2 size={14} strokeWidth={3} /> Active</>
                )}
              </div>
            </div>

            <div className="relative z-10">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3 italic">
                <span>Direct Line Progress</span>
                <span className={progress >= 10 ? 'text-blue-600' : 'text-amber-600'}>
                  {progress} / 10 Eligible Direct Lines
                </span>
              </div>
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner p-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((progress / 10) * 100, 100)}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  className={`h-full rounded-full relative transition-colors duration-700 ${progress >= 10 ? 'bg-blue-500' : 'bg-blue-900'}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
                </motion.div>
              </div>
              <div className="flex gap-3 flex-wrap mt-5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className={`w-8 h-2 rounded-full transition-all duration-700 ${i < progress ? (progress >= 10 ? 'bg-blue-500' : 'bg-blue-900') : 'bg-slate-100'}`} />
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── 5-LEVEL MATRIX ──────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200/60 rounded-[2.5rem] shadow-sm overflow-hidden"
          >
            <div className="p-8 md:p-12 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
              <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center text-amber-500 shadow-lg"><TrendingUp size={20} /></div>
              <div>
                <h3 className="text-sm font-black text-blue-900 uppercase italic tracking-tight">5-Level Referral Commission</h3>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest italic">Expand deeper to earn from your network's investments</p>
              </div>
            </div>

            <div className="flex flex-col">
              {levels.map((lvl, idx) => {
                const style = LEVEL_STYLES[idx];
                const isOpen = expandedLevel === lvl.level;
                const hasUsers = lvl.users?.length > 0;

                return (
                  <div key={lvl.level} className="border-b border-slate-50 last:border-0">
                    <div
                      className="p-6 md:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-all cursor-pointer group"
                      onClick={() => hasUsers && setExpandedLevel(isOpen ? null : lvl.level)}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 ${style.bg} rounded-2xl flex items-center justify-center text-white font-black text-[10px] shadow-xl group-hover:scale-110 transition-transform italic`}>
                          L{lvl.level}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-black text-blue-900 uppercase italic tracking-tight">Level {lvl.level}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${style.label}`}>{lvl.commission}</span>
                          </div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{lvl.count} / {lvl.level * 2} MEMBERS IN NETWORK</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-8 sm:pr-4">
                        <div className="text-left sm:text-right">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Earned</p>
                          <p className="text-lg font-black text-amber-600 italic tracking-tighter">₹{parseFloat(lvl.earnings).toLocaleString()}</p>
                        </div>
                        {hasUsers && (
                          <div className="text-slate-400">
                            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expandable user list */}
                    <AnimatePresence>
                      {isOpen && hasUsers && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden bg-slate-50/50 border-t border-slate-100"
                        >
                          <div className="px-8 md:px-12 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {lvl.users.map((u, i) => (
                              <div key={i} className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-3 shadow-sm">
                                <div className={`w-8 h-8 ${style.bg} rounded-xl flex items-center justify-center text-white font-black text-[9px]`}>
                                  {u.name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] font-black text-blue-900 uppercase italic truncate">{u.name}</p>
                                  <p className="text-[8px] text-amber-600 font-black uppercase tracking-widest truncate">{u.customer_id || `VEV${String(u.id).padStart(3, '0')}`}</p>
                                  <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">{new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* ── DIRECT REFERRAL TREE ────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200/60 rounded-[2.5rem] p-8 md:p-14 relative overflow-hidden group shadow-sm"
          >
            <div className="absolute -right-16 -bottom-16 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000"><Globe size={300} /></div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-900 rounded-2xl flex items-center justify-center text-amber-500 shadow-xl"><Users size={24} /></div>
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-blue-900">Direct Members (Level 1)</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">{directReferrals.length} active institutional direct members</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 italic bg-slate-50 px-5 py-2 rounded-2xl border border-slate-100">
                <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_#f59e0b]"></div>
                {totalNodes} Total Network Members
              </div>
            </div>

            {/* Root node */}
            <div className="relative z-10 mb-10">
              <div className="inline-flex items-center gap-4 bg-blue-900 text-white rounded-[2rem] px-8 py-5 shadow-2xl">
                <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_15px_#f59e0b] animate-pulse"></div>
                <div>
                  <p className="text-sm font-black italic uppercase tracking-tight">{user.name || 'You'}</p>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">You (Top of network)</p>
                </div>
              </div>
            </div>

            {/* Level 1 children */}
            <div className="relative z-10 ml-3 sm:ml-6 md:ml-12 pl-3 sm:pl-6 md:pl-12 border-l-2 border-slate-100 space-y-4 sm:space-y-6">
              {directReferrals.length > 0 ? directReferrals.map((ref, idx) => (
                <motion.div key={idx}
                  initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: idx * 0.06 }}
                  className="relative bg-slate-50 border border-slate-100 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 hover:bg-white hover:shadow-xl hover:border-amber-500/20 transition-all group/node"
                >
                  <div className="absolute -left-[14px] sm:-left-[26px] md:-left-[50px] top-10 sm:top-1/2 w-3 sm:w-6 md:w-12 border-t-2 border-slate-100 group-hover/node:border-amber-500/30 transition-colors" />
                  <div className="flex items-center gap-3 sm:gap-5">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center text-blue-900 border border-slate-100 shadow-sm group-hover/node:bg-blue-900 group-hover/node:text-amber-500 transition-all duration-500">
                      <User size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-black italic uppercase tracking-tight text-blue-900 group-hover/node:text-amber-600 transition-colors truncate">{ref.name}</p>
                      <p className="text-[8px] sm:text-[10px] text-amber-600 font-black uppercase tracking-widest mt-0.5 italic truncate">{ref.customer_id || `VEV${String(ref.id).padStart(3, '0')}`}</p>
                      <p className="text-[8px] sm:text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Joined: {new Date(ref.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right shrink-0 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <p className="text-[8px] sm:text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1 italic">Investment</p>
                    <p className={`text-base sm:text-lg font-black italic ${parseFloat(ref.invested) > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {parseFloat(ref.invested) > 0 ? `₹${parseFloat(ref.invested).toLocaleString()}` : '0.00'}
                    </p>
                  </div>
                </motion.div>
              )) : (
                <div className="text-[9px] sm:text-[10px] font-black text-slate-400 italic py-16 px-6 sm:py-20 sm:px-10 uppercase tracking-widest bg-slate-50 rounded-[2rem] sm:rounded-[2.5rem] border border-dashed border-slate-200 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-slate-200 shadow-sm"><Users size={24} /></div>
                  No members found. Expand your network.
                </div>
              )}
            </div>
          </motion.div>

          {/* ── GENEALOGY TREE (TREE VIEW) ─────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200/60 p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] shadow-sm relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-12 text-slate-50 opacity-40 group-hover:scale-110 transition-transform duration-1000 rotate-12"><Globe size={300} /></div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-blue-900 rounded-[1.8rem] flex items-center justify-center text-amber-500 shadow-2xl border border-white/10"><Network size={24} /></div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-black text-blue-900 uppercase italic tracking-tighter leading-none">Your Referral Tree</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 italic">A view of your 5-level referral network</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest text-amber-600 italic">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_#f59e0b]"></div>
                Live Updates
              </div>
            </div>

            <div className="relative z-10 bg-slate-50/50 rounded-[2rem] border border-slate-100 p-2 min-h-[500px]">
              <RecencyGenealogyTree data={genealogy} loading={loadingGenealogy} />
            </div>

            <div className="mt-8 flex justify-center relative z-10">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] italic">Your referral network</p>
            </div>
          </motion.div>

          {/* ── EARNINGS HISTORY ────────────────────────────────── */}
          {history.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200/60 rounded-[2.5rem] shadow-sm overflow-hidden"
            >
              <div className="p-8 md:p-12 border-b border-slate-100 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center text-amber-500"><Gift size={20} /></div>
                <div>
                  <h3 className="text-sm font-black text-blue-900 uppercase italic tracking-tight">Referral Earnings History</h3>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest italic">{history.length} transactions</p>
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between px-8 md:px-12 py-5 hover:bg-slate-50/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600"><Gift size={16} /></div>
                      <div>
                        <p className="text-[10px] font-black text-blue-900 uppercase italic">{h.description}</p>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{new Date(h.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <p className="text-base font-black text-amber-600 italic tracking-tighter group-hover:text-amber-600 transition-colors">
                      +₹{parseFloat(h.amount).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </main>
      </div>
    </div>
  );
};

export default Referrals;
