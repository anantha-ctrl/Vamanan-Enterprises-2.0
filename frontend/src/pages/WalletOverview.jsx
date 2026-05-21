import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, 
  History, TrendingUp, DollarSign, CreditCard, 
  ChevronRight, Bell, Search, Filter, Download,
  Activity, ShieldCheck, Globe, Star, Zap,
  Clock, CheckCircle2, AlertCircle, PieChart,
  Target, Award, Share2
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import CustomerHeader from '../components/CustomerHeader';
import MobileHeader from '../components/MobileHeader';
import API_BASE_URL from '../config';

const WalletOverview = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({
    balance: 0,
    transactions: [],
    referral_total: 0,
    cashback_total: 0,
    investment_total: 0,
    pending_withdrawal: 0
  });
  const [loading, setLoading] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [user, setUser] = useState({});

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    fetchWalletData(userData.id);

    const interval = setInterval(() => fetchWalletData(userData.id, true), 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchWalletData = async (userId, isSilent = false) => {
    if (!userId) return;
    if (!isSilent) setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/customer/wallet.php?user_id=${userId}`);
      if (res.data.status === 'success') {
        setData(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch wallet data", err);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Active Yields', value: `₹${data.investment_total.toLocaleString()}`, icon: Target, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Cashback Earned', value: `₹${data.cashback_total.toLocaleString()}`, icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Referral Rewards', value: `₹${data.referral_total.toLocaleString()}`, icon: Award, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Pending Payouts', value: `₹${data.pending_withdrawal.toLocaleString()}`, icon: Clock, color: 'text-rose-500', bg: 'bg-rose-50' }
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar 
        activeId="wallet_overview" 
        showMobileMenu={showMobileMenu} 
        setShowMobileMenu={setShowMobileMenu} 
      />
      
      <main className="flex-1 lg:ml-72 pb-24 min-w-0">
        <CustomerHeader 
          setShowMobileMenu={setShowMobileMenu}
          activeTab="Wallet Overview"
        />

        <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-8">

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Primary Balance Module */}
            <div className="xl:col-span-2 bg-slate-900 rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20 group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-amber-500/20 transition-all duration-1000" />
              
              <div className="relative z-10 space-y-12">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] italic text-amber-500">Live Institutional Pulse</span>
                  </div>
                  <div className="w-14 h-9 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                    <div className="w-8 h-5 bg-gradient-to-r from-amber-400 to-amber-600 rounded-sm opacity-60" />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] italic text-slate-400 mb-4">Total Liquid Capital</p>
                  <div className="flex items-baseline gap-4">
                    <h2 className="text-6xl md:text-8xl font-black italic tracking-tighter">₹{data.balance.toLocaleString()}</h2>
                    <span className="text-xl font-black text-amber-500 tracking-widest uppercase italic">INR</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-4">
                  <button 
                    onClick={() => navigate('/withdrawals')}
                    className="px-8 py-4 bg-amber-500 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:scale-105 transition-all shadow-xl shadow-amber-500/20 active:scale-95 flex items-center gap-3"
                  >
                    <ArrowUpRight size={16} />
                    Withdraw Capital
                  </button>
                  <button 
                    onClick={() => navigate('/shop')}
                    className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 hover:scale-105 transition-all active:scale-95 flex items-center gap-3"
                  >
                    <Zap size={16} className="text-amber-500" />
                    Buy Gold
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats Ledger */}
            <div className="space-y-6">
              {stats.map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm hover:scale-[1.02] transition-transform group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform`}>
                      <stat.icon size={24} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{stat.label}</p>
                      <h3 className="text-xl font-black text-slate-900 italic tracking-tighter">{stat.value}</h3>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Action Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Referral Link', icon: Share2, path: '/referrals', color: 'bg-indigo-50 text-indigo-600' },
              { label: 'View Agreement', icon: ShieldCheck, path: '/agreement', color: 'bg-emerald-50 text-emerald-600' },
              { label: 'Market Access', icon: Globe, path: '/shop', color: 'bg-amber-50 text-amber-600' },
              { label: 'Audit History', icon: History, path: '/wallet', color: 'bg-slate-100 text-slate-600' }
            ].map((item, i) => (
              <button 
                key={i}
                onClick={() => navigate(item.path)}
                className="p-6 bg-white border border-slate-100 rounded-[2rem] flex flex-col items-center gap-3 hover:shadow-lg transition-all hover:translate-y-[-4px] group"
              >
                <div className={`p-4 ${item.color} rounded-2xl group-hover:scale-110 transition-transform`}>
                  <item.icon size={20} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest italic text-slate-600">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Transaction Node */}
          <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 text-amber-500 rounded-xl">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">Transmission Ledger</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Live Multi-Channel History</p>
                </div>
              </div>
              <button onClick={() => navigate('/wallet')} className="text-amber-500 text-[10px] font-black uppercase tracking-widest hover:translate-x-2 transition-transform flex items-center gap-2">
                Full Audit <ChevronRight size={14} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Transmission ID</th>
                    <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Category</th>
                    <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Value</th>
                    <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Protocol Status</th>
                    <th className="px-8 py-5 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.transactions.slice(0, 8).map((t, i) => (
                    <motion.tr 
                      key={t.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-black text-slate-900 tracking-widest">#TXN-{t.id}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${t.type === 'credit' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className="text-[10px] font-black text-slate-700 uppercase italic tracking-tighter">{t.category}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-sm font-black italic tracking-tighter ${t.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {t.type === 'credit' ? '+' : '-'} ₹{parseFloat(t.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase italic tracking-widest ${
                          t.status === 'completed' || t.status === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          t.status === 'failed' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                          'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right text-[9px] font-black text-slate-400 tracking-widest italic uppercase">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  ))}
                  {data.transactions.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-8 py-20 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Zero Active Transmissions Detected</p>
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

export default WalletOverview;
