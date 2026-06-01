import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, CheckCircle2, 
  Clock, AlertCircle, Calendar, Filter, Download, 
  Search, RefreshCw, Loader2, FileText, ChevronRight,
  ArrowUpRight, PieChart, Activity, Globe, Landmark, Play,
  Wallet, ShoppingBag, Users, Zap, Award, BarChart3, XCircle
} from 'lucide-react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import API_BASE_URL from '../config';
import { humanAssetType, humanRole, humanStatus } from '../utils/humanLabels';

const AdminReports = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState({ summary: {}, cycles_summary: {}, chart: [], history: [], cycles: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' or 'cycles'
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [dateFilter, setDateFilter] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [platformSettings, setPlatformSettings] = useState({ gold_base_price: '7850' });
  const [liveGoldRate, setLiveGoldRate] = useState(7850);

  const [adminData] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return { 
        name: u.name || 'Super Admin', 
        email: u.email || 'admin@makkalgold.com',
        role: humanRole(u.role || 'admin') 
      };
    } catch { return { name: 'Super Admin', email: 'admin@makkalgold.com', role: 'Administrator' }; }
  });

  const reportConfig = {
    cashback: { label: 'Cashback Reports', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
    withdrawal: { label: 'Withdrawal Reports', icon: Landmark, color: 'text-rose-600', bg: 'bg-rose-50' },
    transaction: { label: 'Transaction Reports', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
    investment: { label: 'Investment Reports', icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    referral: { label: 'Referral Reports', icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' },
    payout: { label: 'Payout Reports', icon: DollarSign, color: 'text-amber-700', bg: 'bg-amber-100' },
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'active':
      case 'completed':
      case 'approved':
      case 'verified':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'pending':
      case 'legal_review':
      case 'in_resolution':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'failed':
      case 'rejected':
      case 'cancelled':
      case 'closed':
        return 'bg-rose-50 text-rose-600 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const currentConfig = reportConfig[type] || reportConfig.transaction;

  useEffect(() => {
    fetchData();
    
    // Real-time Data Sync (every 30 seconds)
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [type]);

  useEffect(() => {
    // Initial Market Sync
    syncMarketRate();
    
    // Auto Market Sync (every 10 minutes)
    const marketSyncInterval = setInterval(() => {
      syncMarketRate();
    }, 600000);

    return () => clearInterval(marketSyncInterval);
  }, []);

  useEffect(() => {
    // Simulated Live Market Fluctuation
    const marketInterval = setInterval(() => {
      const base = parseFloat(platformSettings.gold_base_price || 7850);
      const fluctuation = (Math.random() - 0.5) * 5; // +/- 2.5 rupees
      setLiveGoldRate(base + fluctuation);
    }, 5000);

    return () => clearInterval(marketInterval);
  }, [platformSettings.gold_base_price]);

  useEffect(() => {
    setLiveGoldRate(parseFloat(platformSettings.gold_base_price || 7850));
  }, [platformSettings.gold_base_price]);

  const syncMarketRate = async () => {
    try {
      await axios.get(`${API_BASE_URL}/admin/sync_market_rate.php`);
      // No need to set state here, fetchData will pick it up on next interval
      // or we can call fetchData(true)
      fetchData(true);
    } catch (err) {
      console.error("Market sync failed", err);
    }
  };

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const [reportRes, settingsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/reports.php?type=${type}`),
        axios.get(`${API_BASE_URL}/admin/settings.php`)
      ]);
      
      if (reportRes.data.status === 'success') {
        setData(reportRes.data.data);
      }
      if (settingsRes.data.status === 'success') {
        setPlatformSettings(settingsRes.data.data);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to fetch reports", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredHistory = data.history.filter(p => {
    const name = p.user_name || '';
    const email = p.user_email || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || (p.status && p.status.toLowerCase() === statusFilter.toLowerCase());
    return matchesSearch && matchesStatus;
  });

  const filteredCycles = (data.cycles || []).filter(c => {
    const name = c.user_name || '';
    const email = c.user_email || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || (c.status && c.status.toLowerCase() === statusFilter.toLowerCase());
    return matchesSearch && matchesStatus;
  });

  const exportData = () => {
    const exportList = activeTab === 'cycles' ? filteredCycles : filteredHistory;
    if (exportList.length === 0) return alert("No data to export");
    const headers = Object.keys(exportList[0]).join(",");
    const rows = exportList.map(row => Object.values(row).join(",")).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `VAMANAN_${type.toUpperCase()}_${activeTab.toUpperCase()}_REPORT.csv`);
    link.click();
  };

  const TrendChart = ({ data, color = "#f59e0b" }) => {
    if (!data || data.length < 2) return <div className="h-full flex items-center justify-center opacity-20"><Activity size={40} className="animate-pulse" /></div>;
    
    // Support both total_amount (currency) and count (numeric)
    const getValue = (d) => parseFloat(d.total_amount !== undefined ? d.total_amount : d.count || 0);
    
    const max = Math.max(...data.map(d => getValue(d))) || 1;
    const min = Math.min(...data.map(d => getValue(d))) || 0;
    
    const pointsArr = data.map((d, i) => ({
      x: (i / (data.length - 1)) * 100,
      y: 100 - ((getValue(d) - (min * 0.9)) / (max - (min * 0.9) || 1)) * 90
    }));
    const linePoints = pointsArr.map(p => `${p.x},${p.y}`).join(' ');
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full preserve-3d">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`M 0 100 L ${linePoints} L 100 100 Z`} fill="url(#grad)" />
        <polyline points={linePoints} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#fafafa] font-inter">
      <Sidebar 
        showMobileMenu={showMobileMenu} 
        setShowMobileMenu={setShowMobileMenu} 
      />
      
      <main className="flex-1 lg:ml-72 p-4 md:p-12 pb-24 min-w-0">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <Header 
            setShowMobileMenu={setShowMobileMenu}
            activeTab="fiscal_reports"
            adminData={adminData}
            setShowAdminModal={setShowAdminModal}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            platformSettings={{ ...platformSettings, gold_base_price: liveGoldRate.toFixed(2) }}
          />

          {/* Institutional Title Node */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
            <div className="relative">
              <div className="absolute -left-10 top-0 w-24 h-24 bg-amber-500/10 blur-3xl rounded-full"></div>
              <div className="flex items-center gap-3 mb-6 relative z-10">
                 <div className="w-10 h-1 bg-amber-500 rounded-full"></div>
                 <span className="text-[11px] font-black uppercase tracking-[0.4em] text-amber-600 italic">Analytical Command Node</span>
              </div>
              <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter uppercase italic leading-[0.8] mb-6 relative z-10">
                {currentConfig.label.split(' ')[0]} <br/>
                <span className="text-amber-500">{currentConfig.label.split(' ')[1]}</span>
              </h1>
              <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-transparent mb-6"></div>
              <p className="text-[12px] text-slate-400 font-black uppercase tracking-[0.3em] italic">High-Fidelity Fiscal Intelligence & Asset Oversight</p>
            </div>
            <div className="flex flex-col items-end gap-3">
               <div className="flex gap-4">
                  <button onClick={() => fetchData(true)} className="bg-white border-2 border-amber-500/20 px-10 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-widest text-amber-600 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all shadow-xl shadow-amber-500/10 flex items-center gap-4 group">
                     <RefreshCw size={18} className={`${refreshing ? 'animate-spin' : ''} group-hover:rotate-180 transition-transform duration-700`} /> REFRESH PROTOCOL
                  </button>
               </div>
               <div className="flex items-center gap-2 px-6">
                  <Clock size={10} className="text-slate-400" />
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Last Sync: {lastUpdated.toLocaleTimeString()}</span>
               </div>
            </div>
          </div>

          {/* Analytics Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[3rem] p-10 relative overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-500">
               <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] -mr-40 -mt-40"></div>
               <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-12">
                     <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">{type === 'referral' ? 'Financial Inflection' : 'Transmission Velocity'}</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{type === 'referral' ? 'Daily Referral Yield Progression' : 'Temporal Yield Analysis (15D Cycle)'}</p>
                     </div>
                     <div className="flex items-center gap-3 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 relative group overflow-hidden">
                        <div className="absolute inset-0 bg-amber-500/10 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></div>
                        <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest relative z-10">Live Node Active</span>
                     </div>
                  </div>
                  <div className="h-64 mb-10">
                     <TrendChart data={data.chart} color={currentConfig.color.includes('amber') ? '#d97706' : currentConfig.color.includes('rose') ? '#e11d48' : '#2563eb'} />
                  </div>
                  <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-100">
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Aggregate Value</p>
                        <p className="text-2xl font-black text-slate-900 italic tracking-tighter">₹{parseFloat(data.summary.total || 0).toLocaleString()}</p>
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{type === 'referral' ? 'Active Earners' : 'Node Count'}</p>
                        <p className="text-2xl font-black text-slate-900 italic tracking-tighter">{type === 'referral' ? data.summary.unique_earners : data.summary.count || 0}</p>
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Protocol Status</p>
                        <p className="text-2xl font-black text-amber-600 italic tracking-tighter">OPTIMAL</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex flex-col gap-6">
               <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-amber-500/20 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                  <div className="relative z-10">
                     <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                        <TrendingUp size={24} />
                     </div>
                     <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80 italic">{type === 'referral' ? 'Network Reach' : 'Market Efficiency'}</p>
                     <h3 className="text-4xl font-black italic tracking-tighter leading-none mb-4">{type === 'referral' ? (data.summary.total_network || 0) + ' Nodes' : data.summary.efficiency || '99.2%'}</h3>
                     <div className="pt-4 border-t border-white/20 flex items-center gap-2">
                        <ArrowUpRight size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Institutional Grade</span>
                     </div>
                  </div>
               </div>

               <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 text-slate-900 flex-1 relative overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-500">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 text-amber-600 group-hover:bg-slate-900 group-hover:text-amber-500 transition-all duration-500">
                     {type === 'referral' ? <Award size={24} /> : <Globe size={24} />}
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">{type === 'referral' ? 'Referral Velocity' : 'Global Operations'}</p>
                  <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-6 text-slate-900">{type === 'referral' ? (data.summary.count || 0) + ' Transmissions' : (data.summary.registry_count || 0) + ' Node Registry'}</h3>
                  <button onClick={exportData} className="w-full bg-slate-900 hover:bg-amber-600 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg">
                     <Download size={16} /> EXPORT LEDGER
                  </button>
               </div>
            </div>
          </div>

          {/* Specialized Cashback Analytics */}
          {type === 'cashback' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                   { 
                     label: 'Daily Cashback', 
                     val: data.summary?.daily_amount || 0, 
                     icon: Zap, 
                     color: 'amber', 
                     sub: 'Today\'s Live Yields', 
                     isCurrency: true 
                   },
                   { 
                     label: 'Pending Cashback', 
                     val: data.summary?.pending_amount || 0, 
                     icon: Clock, 
                     color: 'rose', 
                     sub: 'Awaiting Validation', 
                     isCurrency: true 
                   },
                   { 
                     label: 'Completed Cycles', 
                     val: data.cycles_summary?.completed_cycles || 0, 
                     icon: CheckCircle2, 
                     color: 'emerald', 
                     sub: 'Successfully Closed', 
                     isCurrency: false 
                   },
                   { 
                     label: 'Total Payout', 
                     val: data.summary?.total_amount || 0, 
                     icon: Award, 
                     color: 'amber', 
                     sub: 'Lifetime Distribution', 
                     isCurrency: true 
                   }
                 ].map((card, idx) => (
                   <motion.div 
                     key={idx}
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ delay: idx * 0.1 }}
                     className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl group relative overflow-hidden"
                   >
                      <div className="absolute top-0 right-0 p-4">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
                          <span className="text-[7px] font-black text-amber-500 uppercase tracking-widest">Market Live</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-5 mb-6">
                         <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-all duration-500 shadow-lg shadow-amber-500/5">
                            <card.icon size={24} />
                         </div>
                         <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{card.label}</p>
                            <p className="text-[8px] font-bold text-slate-600 uppercase mt-0.5 truncate">{card.sub}</p>
                         </div>
                      </div>
                      
                      <div className="flex items-baseline gap-2">
                        {card.isCurrency && <span className="text-2xl font-black text-amber-500/40 italic">₹</span>}
                        <h3 className="text-4xl font-black italic tracking-tighter text-white">
                          <motion.span
                            key={card.val}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                          >
                            {parseFloat(card.val).toLocaleString()}
                          </motion.span>
                        </h3>
                      </div>
                      
                      {/* Interactive Progress Line */}
                      <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '70%' }}
                          transition={{ duration: 1.5, delay: 0.5 }}
                          className="h-full bg-gradient-to-r from-amber-600 to-amber-400"
                        />
                      </div>

                      {/* Premium Decorative Glow */}
                      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-[60px] group-hover:bg-amber-500/20 transition-all duration-1000"></div>
                   </motion.div>
                 ))}
              </div>

              {/* Secondary Cashback Matrix (Active/Completed Cycles) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-center mb-8">
                       <div>
                          <h4 className="text-lg font-black italic tracking-tighter text-slate-900 uppercase">Active Yield Protocol</h4>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Ongoing Cashback Cycles</p>
                       </div>
                       <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                          <Zap size={24} className="animate-pulse" />
                       </div>
                    </div>
                    <div className="flex items-end gap-4">
                       <h3 className="text-5xl font-black italic tracking-tighter text-slate-900">{data.cycles_summary?.active_cycles || 0}</h3>
                       <div className="mb-2">
                          <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5 shadow-sm">
                             <Activity size={12} /> Live Processing
                          </span>
                       </div>
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-4">
                       <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Daily Liability</p>
                          <p className="text-lg font-black italic text-slate-900 mt-1">₹{parseFloat(data.cycles_summary?.daily_liability || 0).toLocaleString()}</p>
                       </div>
                       <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pending Verification</p>
                          <p className="text-lg font-black italic text-slate-900 mt-1">{data.cycles_summary?.pending_cycles || 0} Cycles</p>
                       </div>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                 </div>

                 <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden border border-white/5 group">
                    <div className="flex justify-between items-center mb-8">
                       <div>
                          <h4 className="text-lg font-black italic tracking-tighter text-amber-500 uppercase">Protocol Completion</h4>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">Successfully Closed Cycles</p>
                       </div>
                       <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-amber-500 border border-white/10 group-hover:bg-amber-500 group-hover:text-black transition-all">
                          <CheckCircle2 size={24} />
                       </div>
                    </div>
                    <div className="flex items-end gap-4">
                       <h3 className="text-5xl font-black italic tracking-tighter text-white">{data.cycles_summary?.completed_cycles || 0}</h3>
                       <div className="mb-2">
                          <span className="bg-white/5 text-amber-500 text-[10px] font-black px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5 shadow-sm">
                             <Award size={12} /> Mission Success
                          </span>
                       </div>
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-4">
                       <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Success Rate</p>
                          <p className="text-lg font-black italic text-white mt-1">99.8%</p>
                       </div>
                       <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Average Payout</p>
                          <p className="text-lg font-black italic text-white mt-1">₹{data.cycles_summary?.completed_cycles > 0 ? (data.summary?.success_amount / data.cycles_summary?.completed_cycles).toFixed(2) : '0'}</p>
                       </div>
                    </div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mb-16 group-hover:bg-amber-500/20 transition-all duration-1000"></div>
                 </div>
              </div>
            </div>
          )}
          {type === 'withdrawal' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                   { 
                     label: 'Pending Payouts', 
                     val: data.summary?.pending_amount || 0, 
                     count: data.summary?.pending_count || 0,
                     icon: Clock, 
                     color: 'rose', 
                     sub: 'Awaiting Verification', 
                     isCurrency: true 
                   },
                   { 
                     label: 'Approved Payouts', 
                     val: data.summary?.approved_amount || 0, 
                     icon: CheckCircle2, 
                     color: 'emerald', 
                     sub: 'Successfully Dispatched', 
                     isCurrency: true 
                   },
                   { 
                     label: 'Rejected Protocol', 
                     val: data.summary?.rejected_amount || 0, 
                     icon: XCircle, 
                     color: 'slate', 
                     sub: 'Failed/Denied Requests', 
                     isCurrency: true 
                   },
                   { 
                     label: 'Total Volume', 
                     val: data.summary?.total_amount || 0, 
                     icon: BarChart3, 
                     color: 'amber', 
                     sub: 'Lifetime Liquidity', 
                     isCurrency: true 
                   }
                 ].map((card, idx) => (
                   <motion.div 
                     key={idx}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: idx * 0.1 }}
                     className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl group relative overflow-hidden"
                   >
                      <div className="absolute top-0 right-0 p-4">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                          <div className={`w-1.5 h-1.5 rounded-full ${card.count > 0 ? 'bg-rose-500 animate-ping' : 'bg-amber-500'} shadow-[0_0_8px_rgba(245,158,11,0.8)]`}></div>
                          <span className="text-[7px] font-black text-white/40 uppercase tracking-widest">{card.count > 0 ? `${card.count} Alert` : 'Live Node'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-5 mb-6">
                         <div className={`w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-all duration-500 shadow-lg shadow-amber-500/5`}>
                            <card.icon size={24} />
                         </div>
                         <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{card.label}</p>
                            <p className="text-[8px] font-bold text-slate-600 uppercase mt-0.5 truncate">{card.sub}</p>
                         </div>
                      </div>
                      
                      <div className="flex items-baseline gap-2">
                        {card.isCurrency && <span className="text-2xl font-black text-amber-500/40 italic">₹</span>}
                        <h3 className="text-4xl font-black italic tracking-tighter text-white">
                          <motion.span
                            key={card.val}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                          >
                            {parseFloat(card.val || 0).toLocaleString()}
                          </motion.span>
                        </h3>
                      </div>
                      
                      {/* Background decoration */}
                      <div className={`absolute -bottom-10 -right-10 w-32 h-32 bg-amber-500/5 rounded-full blur-[60px] group-hover:bg-amber-500/10 transition-all duration-1000`}></div>
                   </motion.div>
                 ))}
              </div>

              {/* Liquidity Analytics Chart */}
              <div className="bg-white border border-slate-200 rounded-[3.5rem] p-10 shadow-sm relative overflow-hidden group min-h-[450px]">
                 <div className="flex justify-between items-center mb-10">
                    <div>
                       <h4 className="text-xl font-black italic tracking-tighter text-slate-900 uppercase">Liquidity Outflow Matrix</h4>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Rolling 15-Day Withdrawal Analytics</p>
                    </div>
                    <div className="flex gap-4">
                       <div className="flex flex-col items-end">
                          <span className="text-sm font-black italic text-slate-900">₹{parseFloat(data.summary?.total_amount || 0).toLocaleString()}</span>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Gross Outflow</span>
                       </div>
                       <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-amber-500">
                          <Activity size={24} className="animate-pulse" />
                       </div>
                    </div>
                 </div>

                 {/* High-End Analytics SVG Chart */}
                 <div className="h-64 w-full relative mt-10">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
                       <defs>
                          <linearGradient id="withdrawGradient" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                             <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                          </linearGradient>
                       </defs>
                       
                       {data.chart && data.chart.length > 1 && (() => {
                         const max = Math.max(...data.chart.map(x => parseFloat(x.total_amount || 0))) || 1;
                         const step = 600 / (data.chart.length - 1);
                         const points = data.chart.map((h, i) => ({
                            x: i * step,
                            y: 180 - (parseFloat(h.total_amount || 0) / max) * 160
                         }));

                         let d = `M ${points[0].x},${points[0].y}`;
                         for (let i = 0; i < points.length - 1; i++) {
                            const cp1x = points[i].x + (points[i+1].x - points[i].x) / 2;
                            const cp1y = points[i].y;
                            const cp2x = points[i].x + (points[i+1].x - points[i].x) / 2;
                            const cp2y = points[i+1].y;
                            d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${points[i+1].x},${points[i+1].y}`;
                         }

                         return (
                           <>
                              <motion.path 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
                                d={`${d} L 600,200 L 0,200 Z`}
                                fill="url(#withdrawGradient)"
                              />
                              <motion.path 
                                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, ease: "easeInOut" }}
                                d={d}
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="4"
                                strokeLinecap="round"
                                className="drop-shadow-2xl"
                              />
                              {points.map((p, i) => (
                                <motion.g key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 + 1 }}>
                                   <circle cx={p.x} cy={p.y} r="5" fill="#fff" stroke="#f59e0b" strokeWidth="3" />
                                </motion.g>
                              ))}
                           </>
                         );
                       })()}
                    </svg>
                    <div className="flex justify-between mt-8 border-t border-slate-100 pt-6">
                       {data.chart?.map((h, i) => (
                          <span key={i} className="text-[8px] font-black text-slate-400 uppercase italic tracking-widest">{h.date.split('-').slice(1).join('/')}</span>
                       ))}
                    </div>
                 </div>
              </div>
            </div>
          )}
          {type === 'payout' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                   { 
                     label: 'Total Payouts', 
                     val: data.summary?.total_amount || 0, 
                     icon: Wallet, 
                     color: 'amber', 
                     sub: 'Gross Disbursement', 
                     isCurrency: true 
                   },
                   { 
                     label: 'Successful Transfers', 
                     val: data.summary?.success_amount || 0, 
                     icon: CheckCircle2, 
                     color: 'emerald', 
                     sub: 'Completed Protocols', 
                     isCurrency: true 
                   },
                   { 
                     label: 'Failed Protocols', 
                     val: data.summary?.failed_amount || 0, 
                     icon: XCircle, 
                     color: 'rose', 
                     sub: 'Needs Attention', 
                     isCurrency: true 
                   },
                   { 
                     label: 'Pending Payouts', 
                     val: data.summary?.pending_amount || 0, 
                     count: data.summary?.pending_count || 0,
                     icon: Clock, 
                     color: 'amber', 
                     sub: 'Awaiting Transmission', 
                     isCurrency: true 
                   }
                 ].map((card, idx) => (
                   <motion.div 
                     key={idx}
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ delay: idx * 0.1 }}
                     className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl group relative overflow-hidden"
                   >
                      <div className="absolute top-0 right-0 p-4">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                          <div className={`w-1.5 h-1.5 rounded-full ${card.count > 0 ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'} shadow-[0_0_8px_rgba(245,158,11,0.8)]`}></div>
                          <span className="text-[7px] font-black text-white/40 uppercase tracking-widest">{card.count > 0 ? `${card.count} Pending` : 'System Ready'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-5 mb-6">
                         <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-all duration-500 shadow-lg shadow-amber-500/5">
                            <card.icon size={24} />
                         </div>
                         <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{card.label}</p>
                            <p className="text-[8px] font-bold text-slate-600 uppercase mt-0.5 truncate">{card.sub}</p>
                         </div>
                      </div>
                      
                      <div className="flex items-baseline gap-2">
                        {card.isCurrency && <span className="text-2xl font-black text-amber-500/40 italic">₹</span>}
                        <h3 className="text-4xl font-black italic tracking-tighter text-white">
                          <motion.span
                            key={card.val}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                          >
                            {parseFloat(card.val || 0).toLocaleString()}
                          </motion.span>
                        </h3>
                      </div>
                      
                      {/* Decorative background glow */}
                      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-500/5 rounded-full blur-[60px] group-hover:bg-amber-500/20 transition-all duration-1000"></div>
                   </motion.div>
                 ))}
              </div>

              {/* Payout Velocity Chart */}
              <div className="bg-white border border-slate-200 rounded-[3.5rem] p-10 shadow-sm relative overflow-hidden group">
                 <div className="flex justify-between items-center mb-10">
                    <div>
                       <h4 className="text-xl font-black italic tracking-tighter text-slate-900 uppercase">Payout Velocity Matrix</h4>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Institutional Disbursement Trends</p>
                    </div>
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-amber-500 shadow-xl">
                       <BarChart3 size={24} className="animate-pulse" />
                    </div>
                 </div>
                 
                 <div className="h-64 w-full relative mt-10">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
                       <defs>
                          <linearGradient id="payoutGradient" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                             <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                          </linearGradient>
                       </defs>
                       
                       {data.chart && data.chart.length > 1 && (() => {
                         const max = Math.max(...data.chart.map(x => parseFloat(x.total_amount || 0))) || 1;
                         const step = 600 / (data.chart.length - 1);
                         const points = data.chart.map((h, i) => ({
                            x: i * step,
                            y: 180 - (parseFloat(h.total_amount || 0) / max) * 160
                         }));

                         let d = `M ${points[0].x},${points[0].y}`;
                         for (let i = 0; i < points.length - 1; i++) {
                            const cp1x = points[i].x + (points[i+1].x - points[i].x) / 2;
                            const cp1y = points[i].y;
                            const cp2x = points[i].x + (points[i+1].x - points[i].x) / 2;
                            const cp2y = points[i+1].y;
                            d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${points[i+1].x},${points[i+1].y}`;
                         }

                         return (
                           <>
                              <motion.path 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
                                d={`${d} L 600,200 L 0,200 Z`}
                                fill="url(#payoutGradient)"
                              />
                              <motion.path 
                                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, ease: "easeInOut" }}
                                d={d}
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="4"
                                strokeLinecap="round"
                              />
                           </>
                         );
                       })()}
                    </svg>
                    <div className="flex justify-between mt-8 border-t border-slate-100 pt-6">
                       {data.chart?.map((h, i) => (
                          <span key={i} className="text-[8px] font-black text-slate-400 uppercase italic tracking-widest">{h.date.split('-').slice(1).join('/')}</span>
                       ))}
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* Specialized Referral Analytics */}
          {type === 'referral' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-sm hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-10">
                     <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Elite Referrers</h3>
                     <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 border border-purple-100"><Award size={20} /></div>
                  </div>
                  <div className="space-y-6">
                     {(data.top_referrers || []).map((ref, idx) => (
                        <div key={idx} className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white transition-all group">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-amber-500 font-black italic shadow-lg group-hover:scale-110 transition-transform">{idx + 1}</div>
                              <div>
                                 <p className="text-sm font-black text-slate-900 uppercase italic leading-tight">{ref.name}</p>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">{ref.referrals_count} Conversions</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-lg font-black text-slate-900 italic tracking-tighter">₹{parseFloat(ref.total_earned).toLocaleString()}</p>
                              <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-1 italic">Protocol Yield</p>
                           </div>
                        </div>
                     ))}
                     {(!data.top_referrers || data.top_referrers.length === 0) && <p className="text-center py-10 text-[10px] font-black uppercase tracking-widest text-slate-300 italic">No elite referrers detected in current cycle</p>}
                  </div>
               </motion.div>

               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900 border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute -right-20 -bottom-20 opacity-5 group-hover:scale-110 transition-transform duration-1000"><PieChart size={400} /></div>
                  <div className="relative z-10 h-full flex flex-col">
                     <div className="flex items-center justify-between mb-12">
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Network Growth Velocity</h3>
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-amber-500 border border-white/10"><TrendingUp size={20} /></div>
                     </div>
                     <div className="flex-1 min-h-[250px] mb-10">
                        <TrendChart data={data.growth_chart || []} color="#f59e0b" />
                     </div>
                     <div className="p-8 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-4">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Growth Statistics</p>
                           <span className="text-[9px] font-black text-amber-500 uppercase italic">Real-time Node Discovery</span>
                        </div>
                        <p className="text-sm text-slate-300 font-bold leading-relaxed italic">Platform referral network is expanding at a controlled institutional rate. Verification protocols are active on all new referral nodes.</p>
                     </div>
                  </div>
               </motion.div>
            </div>
          )}

          {/* History Ledger */}
          <div className="bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500">
             <div className="p-10 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${currentConfig.bg} ${currentConfig.color}`}>
                      <currentConfig.icon size={28} />
                   </div>
                   <div>
                      <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Protocol History</h3>
                      <div className="flex items-center gap-4 mt-1">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Immutable Transaction Registry</p>
                         {type === 'cashback' && (
                           <div className="flex gap-2 ml-4">
                             <button 
                               onClick={() => setActiveTab('transactions')}
                               className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'transactions' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                             >
                               Transactions
                             </button>
                             <button 
                               onClick={() => setActiveTab('cycles')}
                               className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'cycles' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                             >
                               Cycles
                             </button>
                           </div>
                         )}
                      </div>
                   </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                   <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-600 transition-colors" size={16} />
                      <input 
                        type="text" 
                        placeholder="Search Identity..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-6 text-[10px] font-black uppercase italic outline-none focus:border-amber-500/50 w-64 text-slate-900 transition-all shadow-inner"
                      />
                   </div>
                   <div className="relative">
                      <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-10 text-[10px] font-black uppercase italic outline-none focus:border-amber-500/50 text-slate-900 appearance-none cursor-pointer shadow-inner"
                      >
                         <option value="All">All Nodes</option>
                         <option value="success">Success</option>
                         <option value="pending">Pending</option>
                         <option value="failed">Failed</option>
                      </select>
                   </div>
                </div>
             </div>

             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                         <th className="py-8 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Entity Node</th>
                         <th className="py-8 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Protocol Ref</th>
                         <th className="py-8 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Value (₹)</th>
                         <th className="py-8 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Status</th>
                         <th className="py-8 px-10 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-right">Timestamp</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                       {loading ? (
                          <tr>
                             <td colSpan="5" className="py-32 text-center">
                                <div className="flex flex-col items-center gap-6">
                                   <Loader2 size={48} className="text-amber-600 animate-spin" />
                                   <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 animate-pulse">Syncing Registry...</p>
                                </div>
                             </td>
                          </tr>
                       ) : (activeTab === 'cycles' ? filteredCycles : filteredHistory).length > 0 ? (
                          (activeTab === 'cycles' ? filteredCycles : filteredHistory).map((row, i) => (
                             <tr key={i} className="hover:bg-amber-50/30 transition-all group">
                                <td className="py-8 px-10">
                                   <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black italic group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">{row.user_name?.[0] || 'N'}</div>
                                      <div className="flex flex-col">
                                         <p className="text-sm font-black text-slate-900 uppercase italic tracking-tighter leading-tight">{row.user_name}</p>
                                         <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">{row.user_email}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="py-8 px-10">
                                   <div className="flex flex-col">
                                      <p className="text-xs font-black text-slate-500 tracking-widest uppercase italic">{row.transaction_id || row.agreement_id || `#ID-${row.id}`}</p>
                                      {activeTab === 'cycles' && (
                                         <p className="text-[9px] font-bold text-amber-600 mt-1 uppercase tracking-tighter">{humanAssetType(row.asset_type)} ({row.weight}g)</p>
                                      )}
                                   </div>
                                </td>
                                <td className="py-8 px-10">
                                   <div className="flex flex-col">
                                      <p className="text-lg font-black text-slate-900 italic tracking-tighter">₹{parseFloat(row.amount || row.total_value || 0).toLocaleString()}</p>
                                      {activeTab === 'cycles' && (
                                         <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">Daily: ₹{parseFloat(row.daily_payout).toLocaleString()}</p>
                                      )}
                                   </div>
                                </td>
                                <td className="py-8 px-10">
                                   <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest italic border ${getStatusColor(row.status)}`}>
                                      {humanStatus(row.status || 'active')}
                                   </span>
                                </td>
                                <td className="py-8 px-10 text-right">
                                   <p className="text-[10px] font-black text-slate-500 uppercase italic tracking-widest">{new Date(row.created_at).toLocaleDateString()}</p>
                                   <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 tracking-widest">{new Date(row.created_at).toLocaleTimeString()}</p>
                                </td>
                             </tr>
                          ))
                       ) : (
                          <tr>
                             <td colSpan="5" className="py-32 text-center">
                                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300 italic">No Registry Entries Found</p>
                             </td>
                          </tr>
                       )}
                    </tbody>
                </table>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminReports;
