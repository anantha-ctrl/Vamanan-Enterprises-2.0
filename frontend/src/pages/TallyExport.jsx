import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Download, Loader2, RefreshCw, Send, Eye, FileSpreadsheet,
  Building2, Landmark, CheckCircle2, AlertCircle, Calculator, Receipt, Menu
} from 'lucide-react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config';

const TallyExport = () => {
  const [apps, setApps] = useState([]);
  const [summary, setSummary] = useState({ count: 0, total_amount: 0 });
  const [loading, setLoading] = useState(true);
  const [pushing, setPushing] = useState(false);
  const [result, setResult] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Tally settings
  const [settings, setSettings] = useState({
    company: '',
    sales_ledger: 'Sales Account',
    voucher_type: 'Sales',
    status: '',
    gateway: 'http://localhost:9000',
  });

  useEffect(() => {
    fetchApps();
  }, [settings.status]);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const q = settings.status ? `?status=${settings.status}` : '';
      const res = await axios.get(`${API_BASE_URL}/admin/cashback_applications.php${q}`);
      if (res.data.status === 'success') {
        setApps(res.data.data);
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch applications', err);
    } finally {
      setLoading(false);
    }
  };

  // Build query string from Tally settings
  const buildParams = (extra = {}) => {
    const p = new URLSearchParams();
    if (settings.company) p.set('company', settings.company);
    if (settings.sales_ledger) p.set('sales_ledger', settings.sales_ledger);
    if (settings.voucher_type) p.set('voucher_type', settings.voucher_type);
    if (settings.status) p.set('status', settings.status);
    if (settings.gateway) p.set('gateway', settings.gateway);
    Object.entries(extra).forEach(([k, v]) => p.set(k, v));
    return p.toString();
  };

  const downloadXML = () => {
    window.open(`${API_BASE_URL}/admin/tally_export.php?${buildParams()}`, '_blank');
  };

  const previewXML = () => {
    window.open(`${API_BASE_URL}/admin/tally_export.php?${buildParams({ mode: 'preview' })}`, '_blank');
  };

  const pushToTally = async () => {
    if (!window.confirm('Push these vouchers directly into Tally? Make sure TallyPrime is open with the gateway enabled (port 9000).')) return;
    setPushing(true);
    setResult(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/tally_export.php?${buildParams({ mode: 'push' })}`);
      setResult(res.data);
    } catch (err) {
      setResult({ status: 'error', message: err.response?.data?.message || 'Push failed. Is Tally running with the gateway enabled?' });
    } finally {
      setPushing(false);
    }
  };

  const setField = (e) => setSettings({ ...settings, [e.target.name]: e.target.value });

  const inr = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <div className="min-h-screen bg-slate-50 flex font-inter text-slate-900 overflow-x-hidden">
      <Sidebar showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className="ml-0 lg:ml-72 min-h-screen relative w-full">
        {/* Header */}
        <div className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowMobileMenu(true)} className="lg:hidden w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200"><Menu size={20} /></button>
            <div>
              <h1 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">Tally Export</h1>
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1 italic leading-none">Cashback Applications → Tally Accounting</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full">
              <Receipt size={11} className="text-amber-600" />
              <span className="text-[7px] font-black uppercase tracking-widest text-amber-600 italic">TallyPrime / ERP 9</span>
            </div>
            <button onClick={fetchApps} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 hover:text-amber-600 transition-colors">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        <main className="p-6 md:p-10 w-full max-w-[1500px] space-y-8 pb-32">

          {/* Title */}
          <div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Tally Voucher Export</h2>
            <p className="text-[10px] md:text-[12px] text-slate-400 font-black uppercase tracking-[0.3em] mt-3 italic">Post customer purchases to Tally as sales vouchers</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: 'Applications', value: summary.count, icon: FileSpreadsheet, bg: 'bg-blue-50', color: 'text-blue-600', isAmount: false },
              { label: 'Total Purchase Value', value: summary.total_amount, icon: Calculator, bg: 'bg-emerald-50', color: 'text-emerald-600', isAmount: true },
              { label: 'Voucher Type', value: settings.voucher_type, icon: Receipt, bg: 'bg-amber-50', color: 'text-amber-600', isText: true },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className={`w-12 h-12 ${s.bg} rounded-2xl flex items-center justify-center mb-5`}>
                  <s.icon size={22} className={s.color} />
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">{s.label}</p>
                <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter">
                  {s.isAmount ? inr(s.value) : s.value}
                </h3>
              </motion.div>
            ))}
          </div>

          {/* Tally settings */}
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-amber-500"><Building2 size={18} /></div>
              <h3 className="text-[9px] md:text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] italic">Tally Settings</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'company', label: 'Tally Company Name', placeholder: 'Blank = currently open company', icon: Building2 },
                { name: 'sales_ledger', label: 'Sales Ledger', placeholder: 'Sales Account', icon: Landmark },
              ].map((f) => (
                <div key={f.name} className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic ml-1">{f.label}</label>
                  <div className="relative">
                    <f.icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input name={f.name} value={settings[f.name]} onChange={setField} placeholder={f.placeholder}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-sm font-black italic tracking-tight outline-none focus:border-amber-500 focus:bg-white transition-all" />
                  </div>
                </div>
              ))}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Voucher Type</label>
                <select name="voucher_type" value={settings.voucher_type} onChange={setField}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-black italic tracking-tight outline-none focus:border-amber-500 focus:bg-white transition-all">
                  <option value="Sales">Sales</option>
                  <option value="Receipt">Receipt</option>
                  <option value="Journal">Journal</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Status Filter</label>
                <select name="status" value={settings.status} onChange={setField}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-black italic tracking-tight outline-none focus:border-amber-500 focus:bg-white transition-all">
                  <option value="">All Applications</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Tally Gateway (Push)</label>
                <input name="gateway" value={settings.gateway} onChange={setField} placeholder="http://localhost:9000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 px-4 text-sm font-black italic tracking-tight outline-none focus:border-amber-500 focus:bg-white transition-all" />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <button onClick={downloadXML} disabled={summary.count === 0}
                className="flex items-center gap-3 bg-slate-900 text-white px-7 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic hover:bg-amber-600 transition-all shadow-lg active:scale-95 disabled:opacity-40">
                <Download size={16} /> Download Tally XML
              </button>
              <button onClick={pushToTally} disabled={pushing || summary.count === 0}
                className="flex items-center gap-3 bg-emerald-600 text-white px-7 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic hover:bg-emerald-700 transition-all shadow-lg active:scale-95 disabled:opacity-40">
                {pushing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Push to Tally
              </button>
              <button onClick={previewXML} disabled={summary.count === 0}
                className="flex items-center gap-3 bg-white border border-slate-200 text-slate-600 px-7 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic hover:border-amber-300 hover:text-amber-600 transition-all active:scale-95 disabled:opacity-40">
                <Eye size={16} /> Preview XML
              </button>
            </div>

            {/* Push result */}
            {result && (
              <div className={`p-5 rounded-2xl flex items-start gap-4 border ${result.status === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                {result.status === 'success' ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" /> : <AlertCircle size={20} className="shrink-0 mt-0.5" />}
                <div className="text-[10px] font-black uppercase tracking-wider italic leading-relaxed">
                  <p>{result.message}</p>
                  {result.status === 'success' && (result.created != null || result.errors != null) && (
                    <p className="mt-1 opacity-80">Created: {result.created ?? '?'} · Errors: {result.errors ?? 0}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Applications table */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[9px] md:text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] italic">Cashback Applications</h3>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{summary.count} record(s)</span>
            </div>

            {loading ? (
              <div className="py-20 flex items-center justify-center text-amber-600"><Loader2 size={36} className="animate-spin" /></div>
            ) : apps.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest italic">No cashback applications found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[8px] font-black text-slate-400 uppercase tracking-widest italic">
                      <th className="px-6 py-4">Voucher</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map((a) => (
                      <tr key={a.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors text-xs font-bold text-slate-700 italic">
                        <td className="px-6 py-4 font-black text-slate-900">CBA-{a.id}</td>
                        <td className="px-6 py-4">
                          <p className="font-black text-slate-900">{a.customer_name || `Customer #${a.user_id}`}</p>
                          <p className="text-[9px] text-slate-400">{a.customer_email}</p>
                        </td>
                        <td className="px-6 py-4">{a.purchased_product || '—'}</td>
                        <td className="px-6 py-4">{a.application_date || a.purchase_date || '—'}</td>
                        <td className="px-6 py-4 text-right font-black text-slate-900">{inr(a.purchase_amount)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                            a.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                            a.status === 'rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                          }`}>{a.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TallyExport;
