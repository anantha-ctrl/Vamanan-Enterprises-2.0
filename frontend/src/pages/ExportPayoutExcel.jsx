import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileSpreadsheet, Download, Search, Filter, 
  Calendar, Landmark, History, CheckCircle2, 
  AlertCircle, ChevronRight, Loader2, Play,
  Eye, Trash2, ArrowUpRight, DollarSign, Users,
  X, ExternalLink, ShieldCheck, RefreshCw
} from 'lucide-react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import API_BASE_URL from '../config';
import { humanRole, humanStatus } from '../utils/humanLabels';

const ExportPayoutExcel = () => {
  const [payouts, setPayouts] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ today: 0, monthly: 0, active_cycles: 0, total_paid: 0, last_run: 'Never' });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [bankFilter, setBankFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [lastSync, setLastSync] = useState(new Date());
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminData, setAdminData] = useState(() => {
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
    const interval = setInterval(() => {
      fetchData();
      setLastSync(new Date());
    }, 15000); // 15s High-Frequency Pulse
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payoutRes, historyRes, settingsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/payout_history.php`),
        axios.get(`${API_BASE_URL}/admin/export_payouts.php`),
        axios.get(`${API_BASE_URL}/admin/settings.php`)
      ]);
      
      if (payoutRes.data.status === 'success') {
        setPayouts(payoutRes.data.data);
        setStats(payoutRes.data.stats);
      }
      if (historyRes.data.status === 'success') setHistory(historyRes.data.data);
      if (settingsRes.data.status === 'success') setPlatformSettings(settingsRes.data.data);
    } catch (err) {
      console.error("Failed to fetch export data", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayouts = payouts.filter(p => {
    const matchesSearch = p.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.account_no?.includes(searchTerm) ||
                          p.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBank = bankFilter === 'All' || p.bank_name === bankFilter;
    const matchesStatus = statusFilter === 'All' || p.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesDate = !dateFilter || p.created_at.includes(dateFilter);
    return matchesSearch && matchesBank && matchesStatus && matchesDate;
  });

  const uniqueBanks = ['All', ...new Set(payouts.map(p => p.bank_name).filter(Boolean))];

  const filteredTotal = filteredPayouts.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const exportExcel = async () => {
    if (filteredPayouts.length === 0) return;
    setIsExporting(true);

    try {
      const headers = ["Date", "Customer Name", "Bank Name", "Account No.", "IFSC Code", "Amount", "Day", "Status"];
      const rows = filteredPayouts.map(p => [
        new Date(p.created_at).toLocaleDateString(), 
        p.user_name, 
        p.bank_name || 'N/A', 
        p.account_no || 'N/A', 
        p.ifsc_code || 'N/A', 
        p.amount, 
        p.current_day, 
        humanStatus(p.status)
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
      
      const filename = `bulk_transfer_${new Date().toISOString().split('T')[0]}_${bankFilter.replace(/\s+/g, '_')}.xls`;
      const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();

      // Record in history and update statuses
      await axios.post(`${API_BASE_URL}/admin/export_payouts.php`, {
        filename,
        export_type: 'Bank Bulk Transfer',
        total_amount: filteredTotal,
        total_records: filteredPayouts.length,
        transaction_ids: filteredPayouts.map(p => p.id)
      });

      fetchData();
    } catch (err) {
      console.error("Export recording failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar 
        activeId="export_payouts" 
        showMobileMenu={showMobileMenu} 
        setShowMobileMenu={setShowMobileMenu} 
      />
      
      <main className="flex-1 lg:ml-72 p-4 md:p-10 pb-24 min-w-0">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-10">
          
          {/* Universal Admin Header */}
          <Header 
            setShowMobileMenu={setShowMobileMenu}
            activeTab="export_payouts"
            adminData={adminData}
            setShowAdminModal={setShowAdminModal}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            platformSettings={platformSettings}
          />

          {/* Institutional Export Controls */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-3">
                <FileSpreadsheet className="text-amber-500" size={24} />
                Export Payout File
              </h3>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Live Sync Active • Pulse: {lastSync.toLocaleTimeString()}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={fetchData}
                disabled={loading}
                className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 hover:text-amber-600 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
              </button>
              <button 
                onClick={() => setShowPreview(true)}
                disabled={filteredPayouts.length === 0 || loading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-amber-500 hover:text-amber-600 transition-all shadow-sm disabled:opacity-50 active:scale-95"
              >
                <Eye size={14} />
                Preview Batch
              </button>
              <button 
                onClick={exportExcel}
                disabled={filteredPayouts.length === 0 || isExporting || loading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] italic hover:bg-amber-600 transition-all shadow-xl active:scale-95 disabled:opacity-50 group"
              >
                {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} className="text-amber-500 group-hover:text-white transition-colors" />}
                Generate Bulk Transfer
              </button>
            </div>
          </div>

          {/* Institutional Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: "Today's Yield", value: `₹${parseFloat(stats.today || 0).toLocaleString()}`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Active Cycles', value: stats.active_cycles || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Total Paid', value: `₹${parseFloat(stats.total_paid || 0).toLocaleString()}`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Last Payout', value: stats.last_run || 'Never', icon: Calendar, color: 'text-rose-600', bg: 'bg-rose-50' }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm relative overflow-hidden group"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500`} />
                <div className="relative space-y-3">
                  <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shadow-inner`}>
                    <stat.icon size={20} />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">{stat.label}</p>
                    <h3 className="text-xl font-black text-slate-900 italic tracking-tighter">{stat.value}</h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Filters Matrix */}
          <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 md:gap-6">
              <div className="flex-1 relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="SEARCH INVESTOR OR ACCOUNT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-16 pr-6 text-[9px] md:text-xs font-black uppercase italic outline-none focus:border-amber-500 transition-all"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                <div className="relative">
                  <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select 
                    value={bankFilter}
                    onChange={(e) => setBankFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-10 text-[8px] md:text-[9px] font-black uppercase italic outline-none focus:border-amber-500 appearance-none cursor-pointer"
                  >
                    {uniqueBanks.map(bank => (
                      <option key={bank} value={bank}>{bank === 'All' ? 'BANK NODE' : bank}</option>
                    ))}
                  </select>
                </div>
                
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-10 text-[8px] md:text-[9px] font-black uppercase italic outline-none focus:border-amber-500 appearance-none cursor-pointer"
                  >
                    <option value="All">ALL STATUS</option>
                    <option value="pending">PENDING</option>
                    <option value="completed">COMPLETED</option>
                  </select>
                </div>
                
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-[9px] font-black uppercase italic outline-none focus:border-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Data Ledger */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Customer</th>
                    <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Bank Details</th>
                    <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Payout Value</th>
                    <th className="px-8 py-6 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Status</th>
                    <th className="px-8 py-6 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence mode='popLayout'>
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="px-8 py-20 text-center">
                          <Loader2 className="animate-spin mx-auto text-amber-500 mb-4" size={32} />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Accessing Ledger Core...</p>
                        </td>
                      </tr>
                    ) : filteredPayouts.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-8 py-20 text-center text-slate-400 italic uppercase font-black text-[10px] tracking-widest">
                          No pending transfers found
                        </td>
                      </tr>
                    ) : (
                      filteredPayouts.map((p, idx) => (
                        <motion.tr 
                          key={p.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-amber-500 font-black text-xs border-2 border-slate-100 italic">
                                {p.user_name?.charAt(0)}
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-slate-900 uppercase italic tracking-tight">{p.user_name}</h4>
                                <p className="text-[8px] font-black text-slate-400 tracking-widest">{p.user_email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase italic">
                                <Landmark size={12} className="text-amber-500" />
                                {p.bank_name || 'NOT CONFIGURED'}
                              </div>
                              <p className="text-[8px] font-black text-slate-400 tracking-widest">ACC: {p.account_no || 'N/A'}</p>
                              <p className="text-[8px] font-black text-slate-400 tracking-widest">IFSC: {p.ifsc_code || 'N/A'}</p>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="space-y-1">
                              <span className="text-xs font-black text-slate-900 italic">₹{parseFloat(p.amount).toLocaleString()}</span>
                              <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-full inline-block">Day {p.current_day} Yield</p>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest italic ${
                              p.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                              {humanStatus(p.status)}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <button className="p-2 text-slate-300 hover:text-amber-500 transition-colors">
                                <ChevronRight size={18} />
                             </button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Export History Section */}
          <div className="space-y-6">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] italic flex items-center gap-3">
              <History size={18} className="text-amber-500" />
              Export History
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {history.map((h) => (
                <div key={h.id} className="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm hover:border-amber-200 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-amber-600 transition-colors">
                      <FileSpreadsheet size={20} />
                    </div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{new Date(h.created_at).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-[10px] font-black text-slate-900 uppercase italic mb-1 truncate">{h.filename}</h4>
                  <div className="flex items-center justify-between mt-4 border-t border-slate-50 pt-4">
                    <div>
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Total Volume</p>
                      <p className="text-xs font-black text-slate-900 italic">₹{parseFloat(h.total_amount).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Records</p>
                      <p className="text-xs font-black text-slate-900 italic">{h.total_records} ENTITIES</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPreview(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">Bulk Transfer Preview</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Verification Details</p>
                </div>
                <button onClick={() => setShowPreview(false)} className="p-3 bg-white rounded-full text-slate-400 hover:text-slate-900 transition-colors shadow-sm">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-white shadow-sm z-10">
                    <tr className="border-b border-slate-100">
                      <th className="px-4 py-4 text-left text-[8px] font-black text-slate-400 uppercase italic">Beneficiary</th>
                      <th className="px-4 py-4 text-left text-[8px] font-black text-slate-400 uppercase italic">Bank</th>
                      <th className="px-4 py-4 text-left text-[8px] font-black text-slate-400 uppercase italic">A/C Number</th>
                      <th className="px-4 py-4 text-left text-[8px] font-black text-slate-400 uppercase italic">IFSC</th>
                      <th className="px-4 py-4 text-right text-[8px] font-black text-slate-400 uppercase italic">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredPayouts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 text-[10px] font-black text-slate-900 uppercase italic">{p.user_name}</td>
                        <td className="px-4 py-4 text-[10px] font-black text-blue-600 uppercase italic">{p.bank_name || 'N/A'}</td>
                        <td className="px-4 py-4 text-[10px] font-black text-slate-600 tracking-widest">{p.account_no}</td>
                        <td className="px-4 py-4 text-[10px] font-black text-slate-600 tracking-widest">{p.ifsc_code}</td>
                        <td className="px-4 py-4 text-right text-[10px] font-black text-emerald-600 italic">₹{parseFloat(p.amount).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-8 bg-slate-900 flex justify-between items-center">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Consolidated Batch Value</p>
                  <p className="text-2xl font-black text-white italic">₹{filteredTotal.toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => { setShowPreview(false); exportExcel(); }}
                  className="bg-amber-500 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic hover:bg-amber-600 transition-all shadow-xl shadow-amber-900/20 active:scale-95"
                >
                  Finalize & Download
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ExportPayoutExcel;

