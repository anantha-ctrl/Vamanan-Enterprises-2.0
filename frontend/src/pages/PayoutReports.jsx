import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, CheckCircle2, 
  Clock, AlertCircle, Calendar, Filter, Download, 
  Search, RefreshCw, Loader2, FileText, ChevronRight,
  ArrowUpRight, PieChart, Activity, Globe, Landmark, Play
} from 'lucide-react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import API_BASE_URL from '../config';
import { humanRole, humanStatus } from '../utils/humanLabels';

const PayoutReports = () => {
  const [data, setData] = useState({ summary: {}, chart: [], history: [] });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [lastPulse, setLastPulse] = useState(new Date());

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

  const [platformSettings, setPlatformSettings] = useState({ gold_base_price: '7250' });

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 15000); // 15s High-Frequency Pulse
    return () => clearInterval(interval);
  }, []);

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [reportRes, settingsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/payout_reports.php`),
        axios.get(`${API_BASE_URL}/admin/settings.php`)
      ]);
      
      if (reportRes.data.status === 'success') {
        setData(reportRes.data.data);
      }
      if (settingsRes.data.status === 'success') {
        setPlatformSettings(settingsRes.data.data);
      }
      setLastPulse(new Date());
    } catch (err) {
      console.error("Failed to fetch reports", err);
    } finally {
      setLoading(false);
    }
  };

  const runDailyPayout = async () => {
    if (!window.confirm("Initialize Institutional Daily Yield Protocol? This will process 1% cashback for all active cycles.")) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/cron/process_cashback.php?t=${Date.now()}`);
      if (res.data.status === 'success') {
        alert(`Protocol Successful!\nProcessed: ${res.data.processed}\nLogs: ${res.data.message}`);
        fetchData();
      }
    } catch (err) {
      alert("Protocol Execution Failed: " + (err.response?.data?.message || "Internal Server Error"));
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = data.history.filter(p => {
    const matchesSearch = p.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.account_no?.includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || p.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesDate = !dateFilter || p.created_at.includes(dateFilter);
    return matchesSearch && matchesStatus && matchesDate;
  });

  const exportExcel = () => {
    if (filteredHistory.length === 0) {
      alert("Institutional Matrix Empty: No data available for export.");
      return;
    }

    try {
      const headers = [["Date", "Investor Entity", "Bank Node", "Account Identification", "IFSC Protocol", "Transmission Value (₹)", "Protocol Status", "System Intercept Reason"]];
      const rows = filteredHistory.map(p => [
        new Date(p.created_at).toLocaleString(),
        p.user_name,
        p.bank_name || 'N/A',
        p.account_no || 'N/A',
        p.ifsc_code || 'N/A',
        p.amount,
        humanStatus(p.status),
        p.failure_reason || 'N/A'
      ]);

      const worksheet = window.XLSX.utils.aoa_to_sheet([...headers, ...rows]);
      const workbook = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(workbook, worksheet, "Payout Ledger");

      // Auto-size columns for premium look
      const max_width = rows.reduce((w, r) => Math.max(w, r[1].length), 20);
      worksheet["!cols"] = [ { wch: 25 }, { wch: max_width }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 30 } ];

      window.XLSX.writeFile(workbook, `VAMANAN_PAYOUT_LEDGER_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error("Export Error:", err);
      alert("Institutional Export Protocol Failed. Reverting to CSV...");
      // Fallback to simple CSV if XLSX fails
      const csvHeaders = ["Date", "Investor", "Bank", "Account", "IFSC", "Amount", "Status", "Reason"];
      const csvRows = filteredHistory.map(p => [new Date(p.created_at).toLocaleString(), p.user_name, p.bank_name, p.account_no, p.ifsc_code, p.amount, p.status, p.failure_reason]);
      let csvContent = "data:text/csv;charset=utf-8," + csvHeaders.join(",") + "\n" + csvRows.map(e => e.join(",")).join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", "payout_report.csv");
      link.click();
    }
  };

  // Custom SVG Trend Line Component
  // Custom SVG Trend Line Component - Institutional Grade
  const TrendChart = ({ data, color = "#f59e0b" }) => {
    if (!data || data.length < 2) {
      return (
        <div className="h-full relative overflow-hidden flex flex-col items-center justify-center gap-4 border-2 border-dashed border-amber-500/10 rounded-[2rem] bg-amber-500/[0.02]">
          {/* Real-time Scanning Wave */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-0 left-[-100%] w-[200%] h-full bg-gradient-to-r from-transparent via-amber-500 to-transparent animate-[shimmer_3s_infinite]" style={{ backgroundSize: '50% 100%' }} />
          </div>
          <Activity className="text-amber-500 animate-pulse" size={32} />
          <div className="text-center z-10">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic">Live Database Link Established</p>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Awaiting Transmission Nodes...</p>
          </div>
        </div>
      );
    }
    
    const max = Math.max(...data.map(d => parseFloat(d.total_amount))) || 1;
    const min = Math.min(...data.map(d => parseFloat(d.total_amount))) || 0;
    const range = max - min || 1;

    // Normalize points for 100x100 SVG space
    const pointsArr = data.map((d, i) => ({
      x: (i / (data.length - 1)) * 100,
      y: 100 - ((parseFloat(d.total_amount) - (min * 0.9)) / (max - (min * 0.9))) * 90
    }));

    const linePoints = pointsArr.map(p => `${p.x},${p.y}`).join(' ');
    const fillPoints = `0,100 ${linePoints} 100,100`;

    return (
      <div className="relative w-full h-full group">
        <svg viewBox="0 -10 100 120" className="w-full h-full drop-shadow-[0_10px_20px_rgba(245,158,11,0.2)]">
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`M ${fillPoints} Z`} fill="url(#chartGradient)" className="transition-all duration-700 ease-in-out" />
          <polyline 
            points={linePoints} 
            fill="none" 
            stroke={color} 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="transition-all duration-700 ease-in-out"
          />
          {/* Real-time Pulse Node */}
          <circle 
            cx={pointsArr[pointsArr.length-1].x} 
            cy={pointsArr[pointsArr.length-1].y} 
            r="3" 
            fill={color}
            className="animate-pulse shadow-lg"
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar 
        activeId="payout_reports" 
        showMobileMenu={showMobileMenu} 
        setShowMobileMenu={setShowMobileMenu} 
      />
      
      <main className="flex-1 lg:ml-72 p-4 md:p-10 pb-24 min-w-0">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <Header 
            setShowMobileMenu={setShowMobileMenu}
            activeTab="payout_reports"
            adminData={adminData}
            setShowAdminModal={setShowAdminModal}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            platformSettings={platformSettings}
          />

          {/* Institutional Analytics Matrix */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Primary Volume Chart */}
            <div className="xl:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className="text-3xl font-black italic tracking-tighter uppercase">Yield Volume Node</h2>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] italic">Last 15 Day Performance Ledger</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={runDailyPayout}
                      disabled={loading}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-slate-900 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-white hover:scale-105 transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                    >
                      {loading ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                      Run Daily Protocol
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">Live Pulse</span>
                    </div>
                  </div>
                </div>
                
                <div className="h-64 relative">
                  <TrendChart data={data.chart} />
                </div>
                
                <div className="grid grid-cols-3 gap-6 mt-10">
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Peak Yield</p>
                    <p className="text-xl font-black italic tracking-tighter">
                      ₹{(() => {
                        const amounts = data.chart.map(d => parseFloat(d.total_amount)).filter(a => !isNaN(a));
                        return (amounts.length > 0 ? Math.max(...amounts) : 0).toLocaleString();
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Period</p>
                    <p className="text-xl font-black italic tracking-tighter">
                      ₹{data.chart.reduce((s, d) => s + (parseFloat(d.total_amount) || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Cycles</p>
                    <p className="text-xl font-black italic tracking-tighter">
                      {data.summary.total_count || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Status Ledger */}
            <div className="space-y-6">
              {[
                { label: 'Total Capital Disbursed', value: `₹${parseFloat(data.summary.success_amount || 0).toLocaleString()}`, icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-50', sub: `${data.summary.success_count || 0} Successful Transmissions` },
                { label: 'Pending Authorizations', value: `₹${parseFloat(data.summary.pending_amount || 0).toLocaleString()}`, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', sub: `${data.summary.pending_count || 0} Awaiting Protocol` },
                { label: 'System Intercepts', value: `₹${parseFloat(data.summary.failed_amount || 0).toLocaleString()}`, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50', sub: `${data.summary.failed_count || 0} Failed Node Matches` }
              ].map((stat, i) => (
                <div key={i} className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm hover:scale-[1.02] transition-transform group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform`}>
                      <stat.icon size={24} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{stat.label}</p>
                      <h3 className="text-xl font-black text-slate-900 italic tracking-tighter">{stat.value}</h3>
                      <p className={`text-[8px] font-black uppercase tracking-tighter mt-1 ${stat.color}`}>{stat.sub}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Institutional History Ledger */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 text-amber-500 rounded-xl">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">Global Payout Registry</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Live Multi-Node Transaction History</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-100 rounded-xl py-3 pl-10 pr-10 text-[9px] font-black uppercase italic outline-none focus:border-amber-500 appearance-none cursor-pointer"
                  >
                    <option value="All">All Protocol Status</option>
                    <option value="success">Success Node</option>
                    <option value="pending">Pending Logic</option>
                    <option value="failed">Failed Intercept</option>
                  </select>
                </div>
                
                <button 
                  onClick={exportExcel}
                  className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-amber-600 transition-all active:scale-95"
                >
                  <Download size={14} className="text-amber-500" />
                  Export Ledger
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Investor Entity</th>
                    <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Banking Node</th>
                    <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Transmission Value</th>
                    <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Protocol Status</th>
                    <th className="px-8 py-5 text-right text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map((p, i) => (
                    <motion.tr 
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-black text-[10px] group-hover:bg-amber-500 group-hover:text-white transition-all">
                            {p.user_name?.[0].toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-900 uppercase italic tracking-tighter">{p.user_name}</span>
                            <span className="text-[9px] font-bold text-slate-400 tracking-widest">{p.user_email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-700 uppercase italic tracking-widest">{p.bank_name || 'Direct Transfer'}</span>
                          <span className="text-[8px] font-bold text-slate-400 tracking-widest">{p.account_no}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-black text-slate-900 italic tracking-tighter">₹{parseFloat(p.amount).toLocaleString()}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase italic tracking-widest ${
                          p.status === 'success' || p.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          p.status === 'failed' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                          'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {humanStatus(p.status)}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">{new Date(p.created_at).toLocaleDateString()}</span>
                          <span className="text-[8px] font-bold text-slate-400">{new Date(p.created_at).toLocaleTimeString()}</span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Activity size={40} className="text-slate-200" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Zero Anomalies Detected in Current Protocol Matrix</p>
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

export default PayoutReports;
