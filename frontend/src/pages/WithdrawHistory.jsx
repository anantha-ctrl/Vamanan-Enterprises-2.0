import React, { useState, useEffect } from 'react';
import { 
  Landmark, ArrowLeft, Loader2, CheckCircle2, 
  AlertCircle, ChevronRight, ShieldCheck, Clock,
  History, CreditCard, Send, Wallet as WalletIcon,
  Activity, ArrowUpRight, ArrowDownLeft, Filter, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import CustomerHeader from '../components/CustomerHeader';
import API_BASE_URL from '../config';
import { humanStatus } from '../utils/humanLabels';

const WithdrawHistory = () => {
  const [data, setData] = useState({
    balance: 0,
    withdrawals: []
  });
  const [form, setForm] = useState({
    amount: '',
    bank_name: '',
    account_no: '',
    ifsc_code: ''
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!user.id) {
      navigate('/login');
      return;
    }
    fetchData();
    const interval = setInterval(() => fetchData(true), 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [walletRes, withRes, profileRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/customer/wallet.php?user_id=${user.id}`),
        axios.get(`${API_BASE_URL}/admin/withdrawals.php?user_id=${user.id}`),
        axios.get(`${API_BASE_URL}/customer/profile.php?user_id=${user.id}`)
      ]);

      setData({
        balance: parseFloat(walletRes.data.balance || 0),
        withdrawals: withRes.data.data || []
      });

      if (profileRes.data.status === 'success') {
        setForm(prev => ({
          ...prev,
          bank_name: profileRes.data.data.bank_name || '',
          account_no: profileRes.data.data.account_no || '',
          ifsc_code: profileRes.data.data.ifsc_code || ''
        }));
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (parseFloat(form.amount) > data.balance) {
      alert("You don't have enough balance.");
      return;
    }
    if (parseFloat(form.amount) < 1) {
      alert("Minimum withdrawal amount: ₹1");
      return;
    }

    setProcessing(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/customer/request_withdrawal.php`, {
        user_id: user.id,
        ...form
      });
      if (res.data.status === 'success') {
        setSuccess(true);
        setForm(prev => ({ ...prev, amount: '' }));
        fetchData();
        setTimeout(() => setSuccess(false), 5000);
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert("Withdrawal failed: " + (err.response?.data?.message || "Something went wrong. Please try again."));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar 
        activeId="wallet_withdraw" 
        showMobileMenu={showMobileMenu} 
        setShowMobileMenu={setShowMobileMenu} 
      />
      
      <main className="flex-1 lg:ml-72 pb-24 min-w-0">
        <CustomerHeader 
          setShowMobileMenu={setShowMobileMenu}
          activeTab="Withdraw History"
        />

        <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-8">

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* Liquidation Form */}
            <div className="xl:col-span-2 space-y-8">
              <div className="bg-white rounded-[3rem] border border-slate-200 p-8 md:p-12 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                  <Landmark size={200} />
                </div>
                
                <div className="relative z-10 max-w-2xl mx-auto space-y-10">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full border border-amber-100 mb-4">
                      <WalletIcon size={14} className="text-amber-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 italic">Available Balance: ₹{data.balance.toLocaleString()}</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Withdraw Money</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Enter your bank details to receive your money</p>
                  </div>

                  <form onSubmit={handleWithdraw} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic ml-4">Amount (₹)</label>
                      <input 
                        type="number" 
                        required
                        placeholder="0.00"
                        value={form.amount}
                        onChange={(e) => setForm({...form, amount: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-8 text-2xl font-black italic tracking-tighter outline-none focus:border-amber-500 focus:bg-white transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic ml-4">Bank Name</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Bank Name"
                        value={form.bank_name}
                        onChange={(e) => setForm({...form, bank_name: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-xs font-black italic outline-none focus:border-amber-500 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic ml-4">Account Number</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Account Number"
                        value={form.account_no}
                        onChange={(e) => setForm({...form, account_no: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-xs font-black italic outline-none focus:border-amber-500 transition-all"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic ml-4">IFSC Code</label>
                      <input 
                        type="text" 
                        required
                        placeholder="IFSC Code"
                        value={form.ifsc_code}
                        onChange={(e) => setForm({...form, ifsc_code: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-xs font-black italic outline-none focus:border-amber-500 transition-all uppercase"
                      />
                    </div>

                    <div className="md:col-span-2 pt-6">
                      <button 
                        type="submit"
                        disabled={processing}
                        className="w-full py-5 bg-slate-900 text-amber-500 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] italic shadow-2xl hover:bg-amber-500 hover:text-slate-900 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                        {processing ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                        Request Withdrawal
                      </button>
                    </div>
                  </form>

                  <AnimatePresence>
                    {success && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-center gap-4"
                      >
                        <div className="p-3 bg-emerald-500 text-white rounded-xl">
                          <CheckCircle2 size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-emerald-900 uppercase italic tracking-widest">Request Submitted</p>
                          <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Your withdrawal request has been received.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Sidebar Notes */}
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-xl">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-amber-500" size={24} />
                  <h3 className="font-black text-sm uppercase italic tracking-tight">Good to Know</h3>
                </div>
                <div className="space-y-4">
                  {[
                    "All withdrawals are reviewed for your security.",
                    "Processing time: 2-24 business hours.",
                    "Limits may apply based on your KYC status.",
                    "Please double-check your bank details before submitting."
                  ].map((note, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1 shrink-0" />
                      <p className="text-[10px] font-bold text-slate-400 leading-relaxed italic">{note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-[2.5rem] p-8 space-y-4">
                <div className="flex items-center gap-3">
                  <Activity className="text-amber-600" size={20} />
                  <h3 className="font-black text-[10px] text-amber-900 uppercase tracking-widest italic">Status</h3>
                </div>
                <p className="text-[9px] font-bold text-amber-700 leading-relaxed italic">
                  System status: <span className="text-emerald-600">Online</span>. Large transfers above ₹50,000 may take a little longer to verify.
                </p>
              </div>
            </div>
          </div>

          {/* Disbursement Ledger */}
          <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 text-amber-500 rounded-xl">
                  <History size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">Withdrawal History</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Your past withdrawals</p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Request ID</th>
                    <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Amount</th>
                    <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Bank</th>
                    <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Status</th>
                    <th className="px-8 py-5 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.withdrawals.map((w, i) => (
                    <motion.tr 
                      key={w.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-black text-slate-900 tracking-widest">#REQ-{w.id}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-base font-black italic tracking-tighter text-slate-900">₹{parseFloat(w.amount).toLocaleString()}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-700 uppercase italic tracking-tighter">{w.bank_name}</span>
                          <span className="text-[9px] font-bold text-slate-400 tracking-widest">{w.account_no}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase italic tracking-widest ${
                          w.status === 'completed' || w.status === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          w.status === 'failed' || w.status === 'rejected' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                          'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {humanStatus(w.status)}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">{new Date(w.created_at).toLocaleDateString()}</span>
                          <span className="text-[8px] font-bold text-slate-400">{new Date(w.created_at).toLocaleTimeString()}</span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {data.withdrawals.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-8 py-20 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No withdrawals yet</p>
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

export default WithdrawHistory;
