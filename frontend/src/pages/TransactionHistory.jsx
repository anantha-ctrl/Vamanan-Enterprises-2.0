import React, { useState, useEffect } from 'react';
import { 
  Wallet as WalletIcon, ArrowLeft, Loader2, CreditCard, 
  History, TrendingUp, Clock, AlertCircle, CheckCircle2,
  Gift, Users, Activity, ShieldCheck, ChevronRight, RefreshCw,
  Search, Filter, Download, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import CustomerHeader from '../components/CustomerHeader';
import MobileHeader from '../components/MobileHeader';
import API_BASE_URL from '../config';
import { humanStatus } from '../utils/humanLabels';

const TransactionHistory = () => {
  const [data, setData] = useState({
    balance: 0,
    transactions: [],
    referral_total: 0,
    cashback_total: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!user.id) {
      navigate('/login');
      return;
    }
    fetchWalletData();
    const iv = setInterval(() => fetchWalletData(true), 15000);
    return () => clearInterval(iv);
  }, []);

  const fetchWalletData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/customer/wallet.php?user_id=${user.id}`);
      if (response.data.status === 'success') {
        setData(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch wallet data", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredTransactions = data.transactions.filter(t => {
    const matchesSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar 
        activeId="wallet_audit" 
        showMobileMenu={showMobileMenu} 
        setShowMobileMenu={setShowMobileMenu} 
      />
      
      <main className="flex-1 lg:ml-72 pb-24 min-w-0">
        <CustomerHeader 
          setShowMobileMenu={setShowMobileMenu}
          activeTab="Transaction History"
        />

        <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-8">

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-xl">
              <div className="relative z-10">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic mb-2">Available Balance</p>
                <h3 className="text-4xl font-black italic tracking-tighter">₹{data.balance.toLocaleString()}</h3>
              </div>
              <WalletIcon className="absolute right-[-20px] bottom-[-20px] text-white/5 group-hover:scale-110 transition-transform" size={150} />
            </div>
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm group hover:border-amber-500/20 transition-all">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic mb-2">Total Cashback</p>
              <h3 className="text-4xl font-black italic tracking-tighter text-slate-900">₹{(data.cashback_total || 0).toLocaleString()}</h3>
            </div>
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm group hover:border-amber-500/20 transition-all">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic mb-2">Referral Rewards</p>
              <h3 className="text-4xl font-black italic tracking-tighter text-slate-900">₹{(data.referral_total || 0).toLocaleString()}</h3>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 pl-12 pr-6 text-[11px] font-black uppercase italic outline-none focus:border-amber-500 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3.5 pl-10 pr-10 text-[9px] font-black uppercase italic outline-none appearance-none cursor-pointer"
                >
                  <option value="All">All Types</option>
                  <option value="cashback">Cashback</option>
                  <option value="referral">Referral Rewards</option>
                  <option value="withdrawal">Withdrawals</option>
                  <option value="purchase">Purchases</option>
                </select>
              </div>
              <button 
                onClick={fetchWalletData}
                className="p-3.5 bg-slate-900 text-amber-500 rounded-xl hover:bg-amber-500 hover:text-slate-900 transition-all active:scale-95"
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest italic">ID</th>
                    <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Details</th>
                    <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Amount</th>
                    <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Status</th>
                    <th className="px-8 py-6 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((t, i) => (
                    <motion.tr 
                      key={t.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-black text-slate-900 tracking-widest">#TXN-{t.id}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            t.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {t.type === 'credit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-slate-900 uppercase italic tracking-tighter">{t.description}</p>
                            <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest italic">{t.category}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-base font-black italic tracking-tighter ${
                          t.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'
                        }`}>
                          {t.type === 'credit' ? '+' : '-'} ₹{parseFloat(t.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase italic tracking-widest ${
                          t.status === 'completed' || t.status === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          t.status === 'failed' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                          'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {humanStatus(t.status)}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">{new Date(t.created_at).toLocaleDateString()}</span>
                          <span className="text-[8px] font-bold text-slate-400">{new Date(t.created_at).toLocaleTimeString()}</span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-8 py-24 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <Activity size={48} className="text-slate-200" />
                          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">No transactions yet</p>
                        </div>
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

export default TransactionHistory;
