import React, { useState, useEffect } from 'react';
import { 
  Landmark, ArrowLeft, Loader2, CheckCircle2, 
  AlertCircle, ChevronRight, ShieldCheck, Clock,
  History, CreditCard, Send, Wallet as WalletIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import CustomerHeader from '../components/CustomerHeader';
import API_BASE_URL from '../config';
import { humanStatus } from '../utils/humanLabels';

const Withdrawals = () => {
  const [balance, setBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState([]);
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : {};

  useEffect(() => {
    if (!user.id) {
      navigate('/login');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [walletRes, withRes, profileRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/customer/wallet.php?user_id=${user.id}`),
        axios.get(`${API_BASE_URL}/admin/withdrawals.php?user_id=${user.id}`),
        axios.get(`${API_BASE_URL}/customer/profile.php?user_id=${user.id}`)
      ]);

      if (walletRes.data.status === 'success') {
        setBalance(parseFloat(walletRes.data.balance || 0));
      }
      
      if (withRes.data.status === 'success') {
        const userWithdrawals = withRes.data.data.filter(w => w.user_id == user.id);
        setWithdrawals(userWithdrawals);
      }

      if (profileRes.data.status === 'success') {
        const profile = profileRes.data.data.user;
        if (profile.bank_name) setBankName(profile.bank_name);
        if (profile.account_no) setAccountNumber(profile.account_no);
        if (profile.ifsc_code) setIfsc(profile.ifsc_code);
      }
    } catch (err) {
      console.error("Failed to fetch withdrawal data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parseFloat(amount) > balance) {
      alert("Insufficient liquid capital for this transaction.");
      return;
    }
    if (parseFloat(amount) < 100) {
      alert("Minimum withdrawal protocol requires at least ₹100.");
      return;
    }

    setProcessing(true);
    try {
      const bankDetailsCombined = `BANK: ${bankName} | ACC: ${accountNumber} | IFSC: ${ifsc}`;
      const res = await axios.post(`${API_BASE_URL}/customer/request_withdrawal.php`, {
        user_id: user.id,
        amount,
        bank_details: bankDetailsCombined
      });

      if (res.data.status === 'success') {
        setSuccess(true);
        setAmount('');
        setBankName('');
        setAccountNumber('');
        setIfsc('');
        fetchData();
        setTimeout(() => setSuccess(false), 5000);
      } else {
        alert("PROTOCOL ERROR: " + res.data.message);
      }
    } catch (err) {
      alert("CONNECTION ERROR: " + (err.response?.data?.message || err.message));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center text-amber-600">
      <div className="flex flex-col items-center gap-6">
        <Loader2 className="animate-spin" size={60} strokeWidth={3} />
        <p className="text-[10px] font-black animate-pulse uppercase tracking-[0.4em] italic">Initializing Disbursement Hub...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-inter overflow-x-hidden text-slate-900 selection:bg-amber-100 selection:text-amber-900">
      <Sidebar showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className="ml-0 lg:ml-72 min-h-screen relative w-full">
        <CustomerHeader setShowMobileMenu={setShowMobileMenu} activeTab="Capital Disbursement" />

        <main className="p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 w-full max-w-[1500px] space-y-12 pb-32 lg:pb-16">
          
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
          >
             <div>
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                   <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Disbursement Hub</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Withdrawals</h1>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-3 italic">Withdraw your earnings to your bank account</p>
             </div>
             <button onClick={() => navigate('/wallet')} className="bg-white border border-slate-200 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-amber-500 hover:text-amber-600 transition-all shadow-sm flex items-center gap-3">
                <ArrowLeft size={16} /> Back to Wallet
             </button>
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-10">
            {/* Withdrawal Form */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="xl:col-span-3 bg-white border border-slate-200 rounded-[3.5rem] p-8 md:p-14 shadow-sm relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 p-12 opacity-5"><Landmark size={200} /></div>
               
               <div className="relative z-10">
                  <div className="flex items-center gap-6 mb-12">
                     <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-amber-500 shadow-xl border border-white/5"><CreditCard size={24}/></div>
                     <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Initialize Disbursement</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">Submit your liquidation request for processing</p>
                     </div>
                  </div>

                  <AnimatePresence>
                    {success && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl mb-10 flex items-center gap-5"
                      >
                         <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg"><CheckCircle2 size={20}/></div>
                         <div>
                            <p className="text-xs font-black text-emerald-900 uppercase italic">Disbursement Initialized!</p>
                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">Waiting for admin approval.</p>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSubmit} className="space-y-10">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Liquid Quantity (₹)</label>
                           <div className="relative">
                              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300 italic">₹</span>
                              <input 
                                type="number" 
                                required 
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-6 pl-12 pr-8 text-2xl font-black text-slate-900 outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner tracking-tighter italic"
                              />
                           </div>
                           <div className="flex justify-between items-center px-4">
                              <span className="text-[9px] font-black text-slate-400 uppercase italic">Min: ₹100</span>
                              <span className="text-[9px] font-black text-emerald-600 uppercase italic">Max: ₹{balance.toLocaleString()}</span>
                           </div>
                        </div>
                        
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Bank Account</label>
                           <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl flex items-center justify-between group hover:border-amber-600 transition-all cursor-pointer">
                              <div className="flex items-center gap-4">
                                 <Landmark size={20} className="text-slate-400 group-hover:text-amber-600" />
                                 <span className="text-[10px] font-black text-slate-900 uppercase italic tracking-widest">External Bank Transfer</span>
                              </div>
                              <CheckCircle2 size={16} className="text-emerald-500" />
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Bank Name</label>
                           <input 
                             type="text" 
                             required 
                             placeholder="e.g. STATE BANK OF INDIA"
                             value={bankName}
                             onChange={(e) => setBankName(e.target.value)}
                             className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-8 text-xs font-black uppercase italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner"
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Account Number</label>
                           <input 
                             type="text" 
                             required 
                             placeholder="00000000000"
                             value={accountNumber}
                             onChange={(e) => setAccountNumber(e.target.value)}
                             className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-8 text-xs font-black italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner"
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">IFSC Code</label>
                           <input 
                             type="text" 
                             required 
                             placeholder="SBIN000XXXX"
                             value={ifsc}
                             onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                             className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-8 text-xs font-black uppercase italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner"
                           />
                        </div>
                     </div>

                     <div className="p-8 bg-blue-50/50 border border-blue-100 rounded-[2.5rem] flex items-start gap-6">
                        <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm"><ShieldCheck size={24}/></div>
                        <div className="flex-1">
                           <p className="text-[11px] font-black text-blue-900 uppercase italic tracking-tight">Security Check Active</p>
                           <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mt-1 leading-relaxed italic">Withdrawal requests are usually processed within 24-48 hours. The requested amount will be locked after submission.</p>
                        </div>
                     </div>

                     <button 
                       type="submit" 
                       disabled={processing || balance < 100} 
                       className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 hover:bg-amber-600 transition shadow-2xl active:scale-[0.98] disabled:opacity-50 disabled:hover:bg-slate-900"
                     >
                        {processing ? <Loader2 className="animate-spin" /> : <><Send size={18}/> Submit Withdrawal Request</>}
                     </button>
                  </form>
               </div>
            </motion.div>

            {/* Account Status / History Summary */}
            <div className="xl:col-span-2 space-y-8">
               <motion.div 
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="bg-slate-900 rounded-[3.5rem] p-10 text-white relative overflow-hidden group"
               >
                  <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 transition-transform duration-1000"><WalletIcon size={250}/></div>
                  <div className="relative z-10">
                     <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-6 italic">Liquid Reserves</p>
                     <h2 className="text-5xl font-black italic tracking-tighter">₹{balance.toLocaleString()}</h2>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-3 italic">Available for Disbursement</p>
                     
                     <div className="mt-12 space-y-4">
                        <div className="flex justify-between items-center p-5 bg-white/5 border border-white/10 rounded-2xl">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Locked Funds</span>
                           <span className="text-xs font-black italic">₹{withdrawals.filter(w => w.status === 'pending').reduce((acc, curr) => acc + parseFloat(curr.amount), 0).toLocaleString()}</span>
                        </div>
                     </div>
                  </div>
               </motion.div>

               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.2 }}
                 className="bg-white border border-slate-200 rounded-[3.5rem] p-10 shadow-sm"
               >
                  <div className="flex items-center gap-4 mb-10">
                     <History size={20} className="text-amber-600" />
                     <h4 className="text-sm font-black uppercase tracking-widest italic text-slate-900">Recent Disbursements</h4>
                  </div>

                  <div className="space-y-6">
                     {withdrawals.length > 0 ? (
                        withdrawals.slice(0, 4).map((w, idx) => (
                           <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 transition-all group">
                              <div className="flex items-center gap-4">
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${w.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : w.status === 'rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                    <Landmark size={18} />
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-slate-900 uppercase italic">₹{parseFloat(w.amount).toLocaleString()}</p>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{new Date(w.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                                 </div>
                              </div>
                              <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${w.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : w.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                 {humanStatus(w.status)}
                              </span>
                           </div>
                        ))
                     ) : (
                        <div className="py-10 text-center">
                           <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">No disbursement history</p>
                        </div>
                     )}
                  </div>
                  
                  {withdrawals.length > 4 && (
                     <button className="w-full mt-8 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-amber-600 transition-colors border-t border-slate-50 italic">View Universal History</button>
                  )}
               </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Withdrawals;

