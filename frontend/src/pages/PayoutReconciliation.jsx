import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, AlertCircle, Clock, Search, 
  Upload, FileUp, RefreshCw, ChevronRight, 
  ArrowLeft, Download, ShieldCheck, Database,
  FileSpreadsheet, Loader2, X, Filter, History
} from 'lucide-react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import API_BASE_URL from '../config';

const PayoutReconciliation = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [lastPulse, setLastPulse] = useState(new Date());
  
  const [adminData, setAdminData] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return { 
        name: u.name || 'Super Admin', 
        email: u.email || 'admin@makkalgold.com',
        role: u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'Administrator' 
      };
    } catch { return { name: 'Super Admin', email: 'admin@makkalgold.com', role: 'Administrator' }; }
  });

  const [platformSettings, setPlatformSettings] = useState({ gold_base_price: '7250' });

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 15000); // 15s High-Frequency Pulse
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payoutRes, settingsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/admin/payout_history.php`),
        axios.get(`${API_BASE_URL}/admin/settings.php`)
      ]);
      
      if (payoutRes.data.status === 'success') {
        setPayouts(payoutRes.data.data);
      }
      if (settingsRes.data.status === 'success') {
        setPlatformSettings(settingsRes.data.data);
      }
      setLastPulse(new Date());
    } catch (err) {
      console.error("Reconciliation fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isPDF = file.name.endsWith('.pdf');
    
    reader.onload = async (event) => {
      if (isExcel) {
        const data = new Uint8Array(event.target.result);
        const workbook = window.XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        processExcelData(jsonData);
      } else if (isPDF) {
        processPDF(event.target.result);
      } else {
        const text = event.target.result;
        processCSV(text);
      }
    };

    if (isExcel || isPDF) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const processPDF = async (buffer) => {
    setProcessing(true);
    try {
      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
      
      const loadingTask = pdfjsLib.getDocument({ data: buffer });
      const pdf = await loadingTask.promise;
      let fullText = "";
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => item.str).join(' ');
      }
      
      // Basic scraper: Find Transaction IDs and their following status
      const results = [];
      payouts.forEach(p => {
        const id = String(p.id);
        if (fullText.includes(id)) {
          // Look for 'success' or 'failed' near the ID
          const index = fullText.indexOf(id);
          const excerpt = fullText.substring(index, index + 100).toLowerCase();
          const status = excerpt.includes('failed') || excerpt.includes('rejected') ? 'failed' : 'success';
          results.push({
            transaction_id: id,
            status: status,
            reason: 'Extracted from PDF Audit'
          });
        }
      });
      
      await submitReconciliation(results);
    } catch (err) {
      alert("PDF scraping failed: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const processExcelData = async (rows) => {
    setProcessing(true);
    try {
      const results = [];
      // Skip header row
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2) continue;
        
        const [id, status, reason] = row;
        if (id && status) {
          results.push({
            transaction_id: String(id).trim(),
            status: String(status).trim().toLowerCase(),
            reason: reason ? String(reason).trim() : 'Processed via Excel'
          });
        }
      }
      await submitReconciliation(results);
    } catch (err) {
      alert("Excel processing failed: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const processCSV = async (csvText) => {
    setProcessing(true);
    try {
      const lines = csvText.split('\n');
      const results = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const [id, status, reason] = line.split(',');
        if (id && status) {
          results.push({
            transaction_id: id.trim(),
            status: status.trim().toLowerCase(),
            reason: reason ? reason.trim() : 'Processed via CSV'
          });
        }
      }
      await submitReconciliation(results);
    } catch (err) {
      alert("CSV processing failed: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const submitReconciliation = async (results) => {
    if (results.length === 0) {
      alert("No valid transaction data found in document.");
      return;
    }
    const res = await axios.post(`${API_BASE_URL}/admin/reconcile_payouts.php`, { results });
    if (res.data.status === 'success') {
      alert(`Reconciliation Successful!\nProcessed: ${results.length}\nSuccess: ${res.data.data.success}\nFailed: ${res.data.data.failed}`);
      fetchData();
    }
  };

  const stats = {
    total: payouts.length,
    success: payouts.filter(p => p.status === 'success' || p.status === 'completed').length,
    failed: payouts.filter(p => p.status === 'failed').length,
    pending: payouts.filter(p => p.status === 'pending').length
  };

  const filteredPayouts = payouts.filter(p => {
    const matchesSearch = p.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.account_no?.includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || p.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const retryPayout = async (id) => {
    if (!window.confirm("Mark this payout for retry (reset to pending)?")) return;
    try {
      await axios.post(`${API_BASE_URL}/admin/reconcile_payouts.php`, {
        results: [{ transaction_id: id, status: 'pending', reason: 'Administrator Retry Request' }]
      });
      fetchData();
    } catch (err) {
      alert("Retry initialization failed");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar 
        activeId="payout_reconciliation" 
        showMobileMenu={showMobileMenu} 
        setShowMobileMenu={setShowMobileMenu} 
      />
      
      <main className="flex-1 lg:ml-72 p-4 md:p-10 pb-24 min-w-0">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <Header 
            setShowMobileMenu={setShowMobileMenu}
            activeTab="payout_reconciliation"
            adminData={adminData}
            setShowAdminModal={setShowAdminModal}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            platformSettings={platformSettings}
          />

          {/* Institutional Upload Hub */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-slate-900/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-amber-500/20 transition-all duration-700" />
              <div className="relative z-10 flex flex-col h-full justify-between gap-10">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                    <FileUp size={24} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black italic tracking-tighter uppercase">Bank Response Hub</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">Institutional Payout Reconciliation Node</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-3xl p-6 hover:border-amber-500 transition-all cursor-pointer bg-slate-800/50 group/upload">
                    <input type="file" className="hidden" accept=".csv, .xlsx, .xls, .pdf" onChange={handleFileUpload} disabled={processing} />
                    {processing ? <Loader2 size={32} className="text-amber-500 animate-spin" /> : <Upload size={32} className="text-slate-500 group-hover/upload:text-amber-500 transition-colors" />}
                    <span className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Upload Response Node</span>
                    <span className="text-[8px] text-slate-500 font-bold mt-1">Excel, CSV, or PDF Documents</span>
                  </label>
                  <div className="bg-slate-800/50 rounded-3xl p-6 border border-slate-700 flex flex-col justify-between">
                    <div className="space-y-4">
                      <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest italic underline decoration-amber-500/30 underline-offset-4">Document Specification</p>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-[9px] font-bold text-slate-300">
                          <div className="w-1 h-1 bg-amber-500 rounded-full" /> Column 1: Transaction ID
                        </li>
                        <li className="flex items-center gap-2 text-[9px] font-bold text-slate-300">
                          <div className="w-1 h-1 bg-amber-500 rounded-full" /> Column 2: Status (Success/Failed)
                        </li>
                        <li className="flex items-center gap-2 text-[9px] font-bold text-slate-300">
                          <div className="w-1 h-1 bg-amber-500 rounded-full" /> Column 3: Failure Reason
                        </li>
                      </ul>
                    </div>
                    
                    <button 
                      onClick={() => {
                        const csv = "TransactionID,Status,Reason\n" + payouts.filter(p => p.status === 'completed' || p.status === 'success').map(p => `${p.id},success,Processed`).join('\n');
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `reconciliation_template_${new Date().toISOString().split('T')[0]}.csv`;
                        a.click();
                      }}
                      className="mt-4 w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[8px] font-black uppercase tracking-widest border border-white/10 transition-all flex items-center justify-center gap-2"
                    >
                      <Download size={12} className="text-amber-500" />
                      Get Live Template
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 flex flex-col justify-between shadow-sm">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">System Pulse</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest italic">{lastPulse.toLocaleTimeString()}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Pending Batch', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Reconciled Success', value: stats.success, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Failure Intercepts', value: stats.failed, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' }
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:scale-[1.02] transition-transform">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center`}>
                          <stat.icon size={16} />
                        </div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{stat.label}</span>
                      </div>
                      <span className={`text-sm font-black ${stat.color} italic tracking-tighter`}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button 
                onClick={fetchData}
                disabled={loading}
                className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-600 transition-all active:scale-95"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Refresh Ledger Node
              </button>
            </div>
          </div>

          {/* Ledger Management Table */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <Database size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">Protocol Status Matrix</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Institutional Data Verification Hub</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-100 rounded-xl py-3 pl-10 pr-10 text-[9px] font-black uppercase italic outline-none focus:border-amber-500 appearance-none cursor-pointer"
                  >
                    <option value="All">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="success">Success</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Investor ID</th>
                    <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Transaction Node</th>
                    <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Institutional Status</th>
                    <th className="px-8 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Intervention Node</th>
                    <th className="px-8 py-5 text-right text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayouts.map((p, i) => (
                    <motion.tr 
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-900 uppercase italic tracking-tighter">{p.user_name}</span>
                          <span className="text-[9px] font-bold text-slate-400">ID: {p.user_id}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-700 tracking-widest">#{p.id}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{new Date(p.created_at).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase italic tracking-widest ${
                            p.status === 'success' || p.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            p.status === 'failed' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                            'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            {p.status === 'success' || p.status === 'completed' ? <CheckCircle2 size={10} /> :
                             p.status === 'failed' ? <AlertCircle size={10} /> :
                             <Clock size={10} />}
                            {p.status}
                          </span>
                          {p.failure_reason && (
                            <span className="text-[8px] font-bold text-rose-400 italic bg-rose-50/50 px-2 py-0.5 rounded border border-rose-100/50 w-fit">
                              {p.failure_reason}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex flex-col">
                           <span className="text-[9px] font-black text-slate-600 uppercase italic tracking-widest">{p.bank_name || 'Generic Protocol'}</span>
                           <span className="text-[8px] font-bold text-slate-400 tracking-widest italic">{p.account_no}</span>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {p.status === 'failed' && (
                          <button 
                            onClick={() => retryPayout(p.id)}
                            className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-amber-600 transition-all active:scale-90 shadow-lg shadow-slate-900/10"
                            title="Retry Transfer"
                          >
                            <RefreshCw size={14} />
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                  {filteredPayouts.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <History size={40} className="text-slate-200" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Zero Status Anomalies Detected in Current Matrix</p>
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

export default PayoutReconciliation;
