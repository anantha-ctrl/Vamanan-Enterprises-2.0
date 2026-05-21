import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Search, Filter, ChevronRight, UserCircle, 
  ArrowUpRight, RefreshCw, Loader2, 
  ShieldCheck, Clock, Download, Play, 
  CheckCircle2, DollarSign, Landmark, CreditCard, ExternalLink
} from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config';

const CashbackPayouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPayouts();
    
    // Real-time auto-refresh interval (every 30 seconds)
    const interval = setInterval(() => {
      fetchPayouts(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchPayouts = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/payout_history.php`);
      if (res.data.status === 'success') {
        setPayouts(res.data.data);
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch payouts", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayouts = async () => {
    if (!window.confirm("PROTOCOL INITIATION: Are you sure you want to trigger the global daily cashback dispatch? This will credit 1% to all active cycles.")) return;
    
    setProcessing(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/cron/process_cashback.php?t=${Date.now()}`);
      if (res.data.status === 'success') {
        alert(`SUCCESS: ${res.data.message}`);
        fetchPayouts();
      }
    } catch (err) {
      alert("ERROR: " + (err.response?.data?.message || "Protocol execution failed"));
    } finally {
      setProcessing(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/update_transaction.php`, { id, status: newStatus });
      if (res.data.status === 'success') {
        fetchPayouts();
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const exportExcel = () => {
    const headers = ["Date", "Customer Name", "Bank Name", "Account No.", "IFSC Code", "Amount", "Day", "Status"];
    const rows = filteredPayouts.map(p => [
      new Date(p.created_at).toLocaleDateString(), 
      p.user_name, 
      p.bank_name || 'N/A', 
      p.account_no || 'N/A', 
      p.ifsc_code || 'N/A', 
      p.amount, 
      p.current_day, 
      p.status === 'completed' ? 'Paid' : 'Pending'
    ]);
    
    let xml = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40"><Worksheet ss:Name="Payouts"><Table>';
    xml += '<Row>';
    headers.forEach(h => xml += `<Cell><Data ss:Type="String">${h}</Data></Cell>`);
    xml += '</Row>';
    rows.forEach(r => {
      xml += '<Row>';
      r.forEach((v, i) => {
        const type = (i === 5 || i === 6) ? 'Number' : 'String';
        xml += `<Cell><Data ss:Type="${type}">${v}</Data></Cell>`;
      });
      xml += '</Row>';
    });
    xml += '</Table></Worksheet></Workbook>';
    
    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payouts_export_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
  };

  const filteredPayouts = payouts.filter(p => 
    p.user_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-inter text-slate-900 overflow-x-hidden selection:bg-amber-100 selection:text-amber-900">
      <Sidebar showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className="ml-0 lg:ml-72 min-h-screen relative w-full">
        {/* Header */}
        <div className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <button onClick={() => setShowMobileMenu(true)} className="lg:hidden w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200"><Zap size={20}/></button>
                <div>
                    <h1 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">Cashback Portal</h1>
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1 italic leading-none">Institutional Yield Dispatch</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full">
                    <Clock size={10} className="text-amber-600" />
                    <span className="text-[7px] font-black uppercase tracking-widest text-amber-600 italic">Last Protocol Run: {stats?.last_run || 'Checking...'}</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[7px] font-black uppercase tracking-widest text-emerald-600 italic">Live Sync Active</span>
                </div>
                <button 
                    onClick={handleGeneratePayouts}
                    disabled={processing}
                    className="hidden md:flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] italic hover:bg-amber-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                    {processing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                    Process Daily Yield
                </button>
                <button onClick={fetchPayouts} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 hover:text-amber-600 transition-colors">
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>
        </div>

        <main className="p-6 md:p-10 w-full max-w-[1600px] space-y-10 pb-32">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Yield Disbursements</h2>
              <p className="text-[10px] md:text-[12px] text-slate-400 font-black uppercase tracking-[0.3em] mt-4 italic">Tracking and executing the 100-day 1% cashback protocol</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search Investor Identity..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-[2rem] py-4 pl-14 pr-6 text-sm font-black uppercase italic outline-none focus:border-amber-500 shadow-sm transition-all"
                />
              </div>
              <button 
                onClick={exportExcel}
                className="bg-white border border-slate-200 rounded-[2rem] p-4 text-slate-400 hover:text-amber-600 hover:border-amber-200 transition-all shadow-sm flex items-center gap-3 px-8"
              >
                <Download size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest italic">Export Excel</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Yield Dispatched Today', value: stats?.today || 0, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Current Month Total', value: stats?.monthly || 0, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Active Yield Cycles', value: stats?.active_cycles || 0, icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Total Cumulative Yield', value: stats?.total_paid || 0, icon: ArrowUpRight, color: 'text-rose-600', bg: 'bg-rose-50' },
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all"
              >
                <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:bg-slate-900 transition-all duration-500`}>
                  <stat.icon size={22} className={`${stat.color} group-hover:text-amber-500 transition-colors`} />
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">{stat.label}</p>
                <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter">
                  {stat.label.includes('Cycles') ? stat.value : `₹${stat.value.toLocaleString()}`}
                </h3>
              </motion.div>
            ))}
          </div>

          {/* Payout Table */}
          <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-10 text-slate-50 opacity-10 group-hover:scale-110 transition-transform duration-1000"><Zap size={300} /></div>
            
            <div className="overflow-x-auto relative z-10">
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="py-8 px-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 italic">Investor Entity</th>
                    <th className="py-8 px-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 italic">Yield Details</th>
                    <th className="py-8 px-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 italic">Settlement Target (Bank)</th>
                    <th className="py-8 px-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 text-center italic">Dispatch Status</th>
                    <th className="py-8 px-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 text-right italic">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-32 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <Loader2 className="animate-spin text-amber-500" size={48} />
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic animate-pulse">Syncing Yield Ledger...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPayouts.map((p, idx) => (
                    <motion.tr 
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.03 }}
                      className="hover:bg-slate-50/80 transition-all group/row"
                    >
                      <td className="py-8 px-10">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-amber-500 font-black italic text-xl border border-white/5 shadow-xl transition-transform group-hover/row:scale-110">
                            {p.user_name[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="text-base font-black text-slate-900 italic uppercase tracking-tighter block">{p.user_name}</span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-70 italic">{p.user_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-8 px-8">
                        <div className="text-lg font-black text-amber-600 italic tracking-tighter">₹{parseFloat(p.amount).toLocaleString()}</div>
                        <div className="flex items-center gap-2 mt-1">
                           <Clock size={12} className="text-slate-400" />
                           <p className="text-[9px] font-black text-slate-400 uppercase italic">Day {p.current_day} of 100</p>
                        </div>
                        <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mt-1 italic truncate max-w-[200px]">{p.description}</p>
                      </td>
                      <td className="py-8 px-8">
                        {p.bank_name ? (
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Landmark size={14} className="text-slate-400" />
                                    <span className="text-[10px] font-black text-slate-900 uppercase italic">{p.bank_name}</span>
                                </div>
                                <p className="text-[9px] font-black text-slate-500 tracking-wider">A/C: {p.account_no}</p>
                                <p className="text-[8px] font-black text-slate-400 tracking-widest">IFSC: {p.ifsc_code}</p>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-slate-300 italic">
                                <ShieldCheck size={14} />
                                <span className="text-[9px] font-black uppercase tracking-widest">KYC Internal Settlement</span>
                            </div>
                        )}
                      </td>
                      <td className="py-8 px-8 text-center">
                         <div className="inline-flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest italic border ${
                                p.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                p.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' : 
                                'bg-slate-50 text-slate-400 border-slate-100'
                            }`}>
                                {p.status === 'completed' ? 'Wallet Credited' : p.status.toUpperCase()}
                            </span>
                            {p.status === 'completed' && <CheckCircle2 size={14} className="text-emerald-500" />}
                         </div>
                      </td>
                      <td className="py-8 px-10 text-right">
                        <div className="flex items-center justify-end gap-2">
                            {p.status === 'pending' && (
                                <button 
                                    onClick={() => updateStatus(p.id, 'completed')}
                                    className="bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest italic hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
                                >
                                    Mark Paid
                                </button>
                            )}
                            <button 
                                onClick={() => navigate(`/admin/wallets?search=${p.user_name}`)}
                                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                title="View Investor Ledger"
                            >
                                <CreditCard size={18} />
                            </button>
                            <button 
                                onClick={() => window.open(`${API_BASE_URL}/admin/get_user_daily_payout.php?user_id=${p.user_id}`)}
                                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-amber-600 transition-all shadow-sm"
                                title="Protocol Verification"
                            >
                                <ExternalLink size={18} />
                            </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {!loading && filteredPayouts.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-40 text-center">
                         <div className="flex flex-col items-center gap-6 opacity-40">
                            <Search size={60} className="text-slate-300" />
                            <p className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-400 italic">No disbursements found in historical ledger</p>
                         </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default CashbackPayouts;
