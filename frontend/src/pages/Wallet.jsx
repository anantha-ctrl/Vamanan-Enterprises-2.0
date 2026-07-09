import React, { useState, useEffect } from 'react';
import { 
  Wallet as WalletIcon, ArrowLeft, Loader2, CreditCard, 
  History, TrendingUp, Clock, AlertCircle, CheckCircle2,
  Gift, Users, Activity, ShieldCheck, ChevronRight, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import CustomerHeader from '../components/CustomerHeader';
import API_BASE_URL from '../config';
import { humanStatus } from '../utils/humanLabels';

const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [referralTotal, setReferralTotal] = useState(0);
  const [referralToday, setReferralToday] = useState(0);
  const navigate = useNavigate();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : {};

  useEffect(() => {
    if (!user.id) {
      navigate('/login');
      return;
    }
    fetchWalletData();

    const iv = setInterval(() => fetchWalletData(true), 30000);
    return () => clearInterval(iv);
  }, []);

  const fetchWalletData = async (isSilent = false) => {
    if (isSilent) setRefreshing(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/customer/wallet.php?user_id=${user.id}`);
      if (response.data.status === 'success') {
        setBalance(parseFloat(response.data.balance || 0));
        setTransactions(response.data.transactions || []);
        setReferralTotal(parseFloat(response.data.referral_total || 0));
        setReferralToday(parseFloat(response.data.referral_today || 0));
      }
    } catch (err) {
      console.error("Failed to fetch wallet data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleWithdraw = () => {
    navigate('/withdrawals');
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center text-amber-600">
      <div className="flex flex-col items-center gap-6">
        <Loader2 className="animate-spin" size={60} strokeWidth={3} />
        <p className="text-[10px] font-black animate-pulse uppercase tracking-[0.4em] italic">Accessing Wallet...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-inter overflow-x-hidden text-blue-900 selection:bg-amber-100 selection:text-amber-900">
      <Sidebar 
        showMobileMenu={showMobileMenu} 
        setShowMobileMenu={setShowMobileMenu} 
      />

      <div className="ml-0 lg:ml-72 min-h-screen relative w-full">
         <CustomerHeader setShowMobileMenu={setShowMobileMenu} activeTab="Transaction History" />

        <main className="p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 w-full max-w-[1500px] space-y-8 md:space-y-12 pb-32 lg:pb-16">
          
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
          >
             <div>
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                   <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                   <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Financial Overview</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-blue-900 tracking-tighter uppercase italic leading-none">Wallet</h1>
                <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2 md:mt-3 italic">Manage your capital and transaction history</p>
             </div>
             <div className="flex items-center gap-3">
                <button type="button" onClick={() => fetchWalletData(true)}
                  className="bg-white border border-slate-200 px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:border-amber-500 hover:text-amber-600 transition-all shadow-sm"
                ><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /></button>
                <div className="bg-white border border-slate-200 px-6 py-3 rounded-2xl shadow-sm hidden md:flex items-center gap-4">
                   <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Account Synchronized</span>
                </div>
             </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Primary Wallet Card */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2 bg-blue-900 p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl text-white relative overflow-hidden group"
            >
               <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                  <WalletIcon size={loading ? 150 : 300} />
               </div>
               <div className="relative z-10 flex flex-col h-full justify-between gap-10 md:gap-12">
                  <div className="flex justify-between items-start">
                     <div className="flex items-center gap-4 text-amber-500 font-black uppercase text-[9px] md:text-[10px] tracking-[0.3em] italic">
                        <Activity size={18} /> Wallet Balance (INR)
                     </div>
                     <div className="w-16 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-sm">
                        <div className="w-10 h-6 bg-gradient-to-r from-amber-400 to-amber-600 rounded-md"></div>
                     </div>
                  </div>
                  
                  <div>
                    <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-3 md:mb-4 italic">₹{balance.toLocaleString()}</h2>
                    <p className="text-[10px] md:text-[11px] text-slate-400 font-black uppercase tracking-[0.5em] italic">Available Balance</p>
                  </div>

                  <div className="flex flex-wrap gap-3 md:gap-4 pt-4 md:pt-6">
                     <button 
                       type="button"
                       onClick={handleWithdraw}
                       className="flex-1 sm:flex-none bg-amber-500 text-blue-900 px-8 md:px-12 py-5 md:py-6 rounded-2xl md:rounded-3xl font-black uppercase tracking-[0.25em] text-[10px] md:text-xs hover:bg-white transition-all shadow-xl shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-3 md:gap-4"
                     >
                        <CreditCard size={18} /> Withdraw
                     </button>
                     <button 
                       type="button"
                       onClick={() => navigate('/shop')}
                       className="flex-1 sm:flex-none bg-white/5 border border-white/10 text-white px-8 md:px-10 py-5 md:py-6 rounded-2xl md:rounded-3xl font-black uppercase tracking-[0.2em] text-[9px] md:text-[10px] hover:bg-white/10 transition-all active:scale-95 italic"
                     >
                        Investments
                     </button>
                  </div>
               </div>
            </motion.div>

            {/* Referral Stats */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-slate-200 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-14 shadow-sm flex flex-col justify-between group"
            >
               <div className="space-y-10 md:space-y-12">
                  <div className="flex justify-between items-start">
                     <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-50 text-amber-600 rounded-xl md:rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm group-hover:bg-blue-900 group-hover:text-amber-500 transition-colors duration-500">
                        <Users size={20} md:size={24} />
                     </div>
                     <div className="bg-amber-50 text-amber-600 px-3 md:px-4 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border border-amber-100">Live</div>
                  </div>
                  
                  <div className="space-y-3 md:space-y-4">
                     <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Network Revenue</p>
                     <div>
                        <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest italic">Total Earned</p>
                        <h3 className="text-2xl md:text-3xl font-black text-blue-900 tracking-tighter italic mt-1">₹{referralTotal.toLocaleString()}</h3>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 bg-blue-50/50 p-4 rounded-xl md:rounded-2xl border border-blue-100/50">
                     <TrendingUp size={14} md:size={16} className="text-blue-600" />
                     <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-blue-600 italic">+₹{referralToday.toLocaleString()} Today</span>
                  </div>
               </div>
            </motion.div>
          </div>

          {/* Transaction History */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border border-slate-200 rounded-[2.5rem] md:rounded-[4rem] shadow-sm overflow-hidden flex flex-col"
          >
             <div className="p-8 md:p-14 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-blue-900 tracking-tighter uppercase italic">Transaction History</h3>
                  <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 italic">Record of all your transactions and earnings</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 px-5 md:px-6 py-2 rounded-full border border-slate-200">
                   <Clock size={14} className="text-amber-500" />
                   <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Live Mode</span>
                </div>
             </div>
             
             <div className="flex flex-col">
                {transactions.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {transactions.map((tx, idx) => {
                       const date = new Date(tx.created_at);
                       const isCredit = tx.type === 'credit';
                       const isCashback = tx.category === 'cashback' || tx.description.toLowerCase().includes('cashback');
                       const isReferral = tx.category === 'referral' || tx.description.toLowerCase().includes('referral');
                       
                       let Icon = WalletIcon;
                       let iconBg = 'bg-blue-900 text-amber-500';
                       let amountColor = isCredit ? 'text-amber-600' : 'text-blue-600';
                       let statusBg = tx.status === 'completed' || tx.status === 'success' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-amber-50 text-amber-600 border-amber-100';

                       if (isCashback) {
                          Icon = Gift;
                       } else if (isReferral) {
                          Icon = Users;
                       }

                       return (
                         <div key={idx} className="p-6 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors group">
                            <div className="flex items-center gap-6 md:gap-8">
                               <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] flex items-center justify-center shadow-xl border border-white/10 group-hover:scale-110 transition-transform ${iconBg}`}>
                                  <Icon size={20} md:size={24} />
                               </div>
                               <div>
                                  <h4 className="text-sm md:text-base font-black text-blue-900 mb-1 md:mb-2 uppercase italic tracking-tight">{tx.description}</h4>
                                  <div className="flex flex-wrap items-center gap-3 md:gap-4">
                                     <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest italic flex items-center gap-2">
                                        <Clock size={10} md:size={12} className="text-amber-500" /> {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                     </p>
                                     <span className={`px-3 md:px-4 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest border shadow-sm italic ${statusBg}`}>
                                        {humanStatus(tx.status)}
                                     </span>
                                  </div>
                               </div>
                            </div>
                            
                            <div className={`text-2xl md:text-3xl font-black italic tracking-tighter ${amountColor}`}>
                               {isCredit ? '+' : '-'}₹{parseFloat(tx.amount).toLocaleString()}
                            </div>
                         </div>
                       );
                    })}
                  </div>
                ) : (
                  <div className="p-16 md:p-20 flex flex-col items-center justify-center text-slate-400 gap-6">
                     <AlertCircle size={40} md:size={48} className="opacity-20" />
                     <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] italic text-center">No transactions found</p>
                  </div>
                )}
             </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Wallet;
