import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, Search, Filter, ChevronRight, UserCircle, 
  ArrowUpRight, ArrowDownLeft, RefreshCw, Loader2, 
  ShieldCheck, ShieldAlert, CreditCard, History, 
  MoreVertical, TrendingUp, DollarSign, Calendar
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config';
import { humanKycStatus, humanRole } from '../utils/humanLabels';

const WalletListAdmin = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/wallets.php`);
      if (res.data.status === 'success') {
        setWallets(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch wallets", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredWallets = wallets.filter(w => {
    const matchesSearch = 
      w.user_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      w.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'active_investors') return matchesSearch && parseInt(w.active_cycles) > 0;
    if (filterStatus === 'verified') return matchesSearch && w.kyc_status === 'verified';
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex font-inter text-blue-900 overflow-x-hidden selection:bg-amber-100 selection:text-amber-900">
      <Sidebar showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className="ml-0 lg:ml-72 min-h-screen relative w-full">
        {/* Using a generic header style if AdminHeader doesn't exist */}
        <div className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <button onClick={() => setShowMobileMenu(true)} className="lg:hidden w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200"><Wallet size={20}/></button>
                <div>
                    <h1 className="text-xl font-black uppercase italic tracking-tighter text-blue-900 leading-none">Wallet List</h1>
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1 italic leading-none">Wallet Balance Control</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={fetchWallets} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 hover:text-amber-600 transition-colors">
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>
        </div>

        <main className="p-6 md:p-10 w-full max-w-[1600px] space-y-10 pb-32">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <h2 className="text-4xl md:text-6xl font-black text-blue-900 tracking-tighter uppercase italic leading-none">Investor Wallets</h2>
              <p className="text-[10px] md:text-[12px] text-slate-400 font-black uppercase tracking-[0.3em] mt-4 italic">Management portal for capital flows and network yields</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Search Identity or Protocol..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-[2rem] py-4 pl-14 pr-6 text-sm font-black uppercase italic outline-none focus:border-amber-500 shadow-sm transition-all"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full sm:w-auto bg-white border border-slate-200 rounded-[2rem] py-4 px-6 sm:px-8 text-[10px] font-black uppercase tracking-widest italic outline-none focus:border-amber-500 shadow-sm"
              >
                <option value="all">Global Ledger</option>
                <option value="active_investors">Active Nodes Only</option>
                <option value="verified">Verified Identity</option>
              </select>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Managed Capital', value: wallets.reduce((s,w) => s + parseFloat(w.balance), 0), icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Total Yield Dispatched', value: wallets.reduce((s,w) => s + parseFloat(w.total_earned), 0), icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Active Institutional Nodes', value: wallets.reduce((s,w) => s + (parseInt(w.active_cycles) > 0 ? 1 : 0), 0), icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Total Outflow (Liquidation)', value: wallets.reduce((s,w) => s + parseFloat(w.total_withdrawn), 0), icon: ArrowUpRight, color: 'text-blue-600', bg: 'bg-blue-50' },
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all min-w-0"
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 ${stat.bg} rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-blue-900 transition-all duration-500`}>
                  <stat.icon size={20} className={`${stat.color} group-hover:text-amber-500 transition-colors`} />
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">{stat.label}</p>
                <h3 className="text-xl sm:text-2xl font-black text-blue-900 italic tracking-tighter break-words leading-tight">
                  {typeof stat.value === 'number' && stat.label.includes('Capital') ? `₹${stat.value.toLocaleString()}` : 
                   typeof stat.value === 'number' && stat.label.includes('Yield') ? `₹${stat.value.toLocaleString()}` : 
                   typeof stat.value === 'number' && stat.label.includes('Outflow') ? `₹${stat.value.toLocaleString()}` : 
                   stat.value}
                </h3>
              </motion.div>
            ))}
          </div>

          {/* Wallets Table */}
          <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-10 text-slate-50 opacity-10 group-hover:scale-110 transition-transform duration-1000"><Wallet size={300} /></div>
            
            <div className="overflow-x-auto relative z-10">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="py-8 px-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 italic">Customer</th>
                    <th className="py-8 px-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 text-right italic">Wallet Balance</th>
                    <th className="py-8 px-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 text-center italic">Active Purchases</th>
                    <th className="py-8 px-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 text-right italic">Last Yield</th>
                    <th className="py-8 px-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 text-right italic">Intervention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-32 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <Loader2 className="animate-spin text-amber-500" size={48} />
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic animate-pulse">Loading wallet records...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredWallets.map((w, idx) => (
                    <motion.tr 
                      key={w.wallet_id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                      className="hover:bg-slate-50/80 transition-all group/row"
                    >
                      <td className="py-8 px-10">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-blue-900 rounded-2xl flex items-center justify-center text-amber-500 font-black italic text-xl border border-white/5 shadow-xl transition-transform group-hover/row:scale-110">
                            {w.user_name[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-black text-blue-900 italic uppercase tracking-tighter group-hover/row:text-amber-600 transition-colors">{w.user_name}</span>
                              {w.kyc_status === 'verified' ? (
                                <ShieldCheck size={14} className="text-amber-500" />
                              ) : (
                                <ShieldAlert size={14} className="text-amber-400" />
                              )}
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-70 italic">{w.user_email}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest italic ${w.kyc_status === 'verified' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                    {humanKycStatus(w.kyc_status || 'unverified')}
                                </span>
                                <span className="px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest italic bg-blue-50 text-blue-600 border border-blue-100">
                                    {humanRole(w.role)}
                                </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-8 px-8 text-right">
                        <div className="text-2xl font-black text-blue-900 italic tracking-tighter">₹{parseFloat(w.balance).toLocaleString()}</div>
                        <div className="flex items-center justify-end gap-3 mt-2">
                           <div className="text-right">
                              <p className="text-[8px] font-black text-amber-600 uppercase italic">Earned: ₹{parseFloat(w.total_earned).toLocaleString()}</p>
                           </div>
                           <div className="w-px h-2 bg-slate-200"></div>
                           <div className="text-right">
                              <p className="text-[8px] font-black text-blue-500 uppercase italic">Paid: ₹{parseFloat(w.total_withdrawn).toLocaleString()}</p>
                           </div>
                        </div>
                      </td>
                      <td className="py-8 px-8 text-center">
                        <div className="inline-flex items-center gap-3 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100">
                           <span className={`text-xl font-black italic ${parseInt(w.active_cycles) > 0 ? 'text-amber-600' : 'text-slate-300'}`}>{w.active_cycles}</span>
                           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Active Cycles</span>
                        </div>
                      </td>
                      <td className="py-8 px-8 text-right">
                        <div className="flex flex-col items-end">
                            <p className="text-sm font-black text-blue-900 italic uppercase tracking-tight leading-none mb-1">
                                {w.last_payout_at ? new Date(w.last_payout_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'NEVER'}
                            </p>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic opacity-60">Payout Details</p>
                        </div>
                      </td>
                      <td className="py-8 px-10 text-right">
                        <div className="flex items-center justify-end gap-2">
                            <button 
                                onClick={() => navigate(`/admin?tab=users&search=${w.user_name}`)}
                                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:bg-blue-900 hover:text-white hover:border-blue-900 transition-all shadow-sm group/btn"
                                title="View Investor Profile"
                            >
                                <UserCircle size={18} className="group-hover/btn:scale-110 transition-transform" />
                            </button>
                            <button 
                                onClick={() => navigate(`/admin?tab=investment_history&search=${w.user_name}`)}
                                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all shadow-sm group/btn"
                                title="Transaction Ledger"
                            >
                                <History size={18} className="group-hover/btn:rotate-12 transition-transform" />
                            </button>
                            <button 
                                onClick={() => {
                                    // Use sessionStorage to pass data to Adjust page if needed, or just navigate
                                    navigate(`/admin?tab=wallet_adj&user=${w.user_id}`);
                                }}
                                className="flex-1 bg-blue-900 text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] italic hover:bg-amber-600 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                            >
                                <CreditCard size={14} /> Adjust
                            </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {!loading && filteredWallets.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-40 text-center">
                         <div className="flex flex-col items-center gap-6 opacity-40">
                            <Search size={60} className="text-slate-300" />
                            <p className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-400 italic">No records match your filters</p>
                         </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Placeholder */}
            <div className="bg-slate-50/50 px-10 py-8 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Showing {filteredWallets.length} Customers</p>
                <div className="flex items-center gap-3">
                    <button disabled className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-300 cursor-not-allowed"><ChevronRight size={18} className="rotate-180" /></button>
                    <button className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-blue-900 font-black shadow-sm italic text-sm">1</button>
                    <button disabled className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-300 cursor-not-allowed"><ChevronRight size={18} /></button>
                </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default WalletListAdmin;

