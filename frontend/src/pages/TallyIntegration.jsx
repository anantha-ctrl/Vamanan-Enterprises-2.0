import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, RefreshCw, Loader2, Download, Send, Eye, Plus, Trash2, CheckCircle2, AlertCircle,
  LayoutDashboard, BookOpen, FileBarChart, Receipt, ArrowLeftRight, ScrollText, Settings2,
  Building2, Landmark, TrendingUp, Wallet, ShoppingBag, Users, Coins, ArrowUpRight, X,
  FileSpreadsheet, FileCode2, FileText, Zap, Database, Server,
} from 'lucide-react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config';

const TALLY = `${API_BASE_URL}/admin/tally`;
const inr = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const LEDGERS = [
  { id: 'sales', label: 'Sales Ledger', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'customer', label: 'Customer Ledger', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'cashback', label: 'Cashback Ledger', icon: Coins, color: 'text-amber-600', bg: 'bg-amber-50' },
  { id: 'referral', label: 'Referral Ledger', icon: ArrowUpRight, color: 'text-violet-600', bg: 'bg-violet-50' },
  { id: 'withdrawal', label: 'Withdrawal Ledger', icon: Landmark, color: 'text-rose-600', bg: 'bg-rose-50' },
  { id: 'inventory', label: 'Inventory Ledger', icon: ShoppingBag, color: 'text-slate-700', bg: 'bg-slate-100' },
];

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'ledgers', label: 'Ledgers', icon: BookOpen },
  { id: 'reports', label: 'P&L / Balance Sheet', icon: FileBarChart },
  { id: 'vouchers', label: 'Vouchers', icon: Receipt },
  { id: 'reconciliation', label: 'Reconciliation', icon: ArrowLeftRight },
  { id: 'audit', label: 'Audit Logs', icon: ScrollText },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];

// ---------- small shared pieces ----------
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-[2rem] border border-slate-100 shadow-sm ${className}`}>{children}</div>
);

const Toast = ({ result, onClose }) => (
  <AnimatePresence>
    {result && (
      <motion.div initial={{ opacity: 0, y: 40, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 40, x: '-50%' }}
        className="fixed bottom-6 left-1/2 z-[300] max-w-md w-[92%]">
        <div className={`flex items-start gap-3 p-5 rounded-2xl border backdrop-blur-xl shadow-2xl ${
          result.status === 'success' ? 'bg-emerald-50/95 border-emerald-100 text-emerald-700'
          : result.status === 'info' ? 'bg-blue-50/95 border-blue-100 text-blue-700'
          : 'bg-rose-50/95 border-rose-100 text-rose-700'}`}>
          {result.status === 'success' ? <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
           : result.status === 'info' ? <Download size={20} className="shrink-0 mt-0.5" />
           : <AlertCircle size={20} className="shrink-0 mt-0.5" />}
          <p className="text-[10px] font-black uppercase tracking-wider italic leading-relaxed flex-1">{result.message}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900"><X size={16} /></button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const Label = ({ children }) => (
  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">{children}</p>
);

const Field = ({ label, hint, ...props }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic ml-1">{label}</label>
    <input {...props}
      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-black italic tracking-tight outline-none focus:border-amber-500 focus:bg-white transition-all" />
    {hint && <p className="text-[8px] font-bold text-slate-400 normal-case tracking-normal not-italic ml-1 leading-snug">{hint}</p>}
  </div>
);

const StatusPill = ({ value }) => {
  const v = String(value || '').toLowerCase();
  const map = {
    approved: 'bg-emerald-50 text-emerald-600', completed: 'bg-emerald-50 text-emerald-600',
    synced: 'bg-emerald-50 text-emerald-600', reconciled: 'bg-emerald-50 text-emerald-600',
    active: 'bg-emerald-50 text-emerald-600', settled: 'bg-slate-100 text-slate-500',
    rejected: 'bg-rose-50 text-rose-600', error: 'bg-rose-50 text-rose-600',
    pending: 'bg-amber-50 text-amber-600', draft: 'bg-amber-50 text-amber-600',
    posted: 'bg-blue-50 text-blue-600', outstanding: 'bg-amber-50 text-amber-600',
  };
  return <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${map[v] || 'bg-slate-100 text-slate-500'}`}>{value}</span>;
};

const TallyIntegration = () => {
  const [tab, setTab] = useState('dashboard');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [dashboard, setDashboard] = useState(null);
  const [activeLedger, setActiveLedger] = useState('sales');
  const [ledgerData, setLedgerData] = useState({ rows: [], summary: {} });
  const [report, setReport] = useState('pnl');
  const [reportData, setReportData] = useState(null);
  const [vouchers, setVouchers] = useState({ data: [], summary: {} });
  const [reconciliation, setReconciliation] = useState([]);
  const [audit, setAudit] = useState([]);
  const [settings, setSettings] = useState(null);
  const [range, setRange] = useState({ start_date: '', end_date: '' });
  const [showVoucherForm, setShowVoucherForm] = useState(false);

  const flash = (r) => { setResult(r); setTimeout(() => setResult(null), 5000); };
  const rangeQS = () => {
    const p = new URLSearchParams();
    if (range.start_date) p.set('start_date', range.start_date);
    if (range.end_date) p.set('end_date', range.end_date);
    return p.toString();
  };

  // ---------- loaders ----------
  // Each loader takes `silent`: a background (auto-refresh) poll skips the loading
  // spinner and error toast so the UI updates smoothly in place.
  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await axios.get(`${TALLY}/data.php?resource=dashboard`);
      if (r.data.status === 'success') { setDashboard(r.data.data); setSettings(r.data.data.settings); }
    } catch (e) { if (!silent) flash({ status: 'error', message: 'Failed to load dashboard. Check API/DB connection.' }); }
    finally { if (!silent) setLoading(false); }
  }, []);

  const loadLedger = useCallback(async (ledger, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await axios.get(`${TALLY}/data.php?resource=ledger&ledger=${ledger}&${rangeQS()}`);
      if (r.data.status === 'success') setLedgerData({ rows: r.data.data, summary: r.data.summary });
    } catch (e) { if (!silent) flash({ status: 'error', message: 'Failed to load ledger.' }); }
    finally { if (!silent) setLoading(false); }
  }, [range]);

  const loadReport = useCallback(async (rep, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await axios.get(`${TALLY}/data.php?resource=report&report=${rep}&${rangeQS()}`);
      if (r.data.status === 'success') setReportData(r.data.data);
    } catch (e) { if (!silent) flash({ status: 'error', message: 'Failed to load report.' }); }
    finally { if (!silent) setLoading(false); }
  }, [range]);

  const loadVouchers = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await axios.get(`${TALLY}/data.php?resource=vouchers`);
      if (r.data.status === 'success') setVouchers({ data: r.data.data, summary: r.data.summary });
    } catch (e) { if (!silent) flash({ status: 'error', message: 'Failed to load vouchers.' }); }
    finally { if (!silent) setLoading(false); }
  }, []);

  const loadReconciliation = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await axios.get(`${TALLY}/data.php?resource=reconciliation`);
      if (r.data.status === 'success') setReconciliation(r.data.data);
    } catch (e) { if (!silent) flash({ status: 'error', message: 'Failed to load reconciliation.' }); }
    finally { if (!silent) setLoading(false); }
  }, []);

  const loadAudit = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await axios.get(`${TALLY}/data.php?resource=audit&limit=300`);
      if (r.data.status === 'success') setAudit(r.data.data);
    } catch (e) { if (!silent) flash({ status: 'error', message: 'Failed to load audit logs.' }); }
    finally { if (!silent) setLoading(false); }
  }, []);

  // tab-driven loading
  useEffect(() => {
    if (tab === 'dashboard') loadDashboard();
    if (tab === 'ledgers') loadLedger(activeLedger);
    if (tab === 'reports') loadReport(report);
    if (tab === 'vouchers') loadVouchers();
    if (tab === 'reconciliation') loadReconciliation();
    if (tab === 'audit') loadAudit();
    if (tab === 'settings' && !settings) loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, activeLedger, report]);

  // Real-time auto-refresh: silently re-pull the active tab from MySQL every 15s.
  // Skips the Settings tab so live polling never overwrites the form being edited,
  // and pauses while the browser tab is hidden to avoid needless requests.
  useEffect(() => {
    if (tab === 'settings') return;
    const id = setInterval(() => {
      if (document.hidden) return;
      if (tab === 'dashboard') loadDashboard(true);
      else if (tab === 'ledgers') loadLedger(activeLedger, true);
      else if (tab === 'reports') loadReport(report, true);
      else if (tab === 'vouchers') loadVouchers(true);
      else if (tab === 'reconciliation') loadReconciliation(true);
      else if (tab === 'audit') loadAudit(true);
    }, 15000);
    return () => clearInterval(id);
  }, [tab, activeLedger, report, loadDashboard, loadLedger, loadReport, loadVouchers, loadReconciliation, loadAudit]);

  // ---------- actions ----------
  const exportFile = (resource, format, extra = {}) => {
    const p = new URLSearchParams({ resource, format, ...extra });
    if (range.start_date) p.set('start_date', range.start_date);
    if (range.end_date) p.set('end_date', range.end_date);
    window.open(`${TALLY}/export.php?${p.toString()}`, '_blank');
  };

  const previewXML = (resource, extra = {}) => {
    const p = new URLSearchParams({ resource, format: 'xml', mode: 'preview', ...extra });
    window.open(`${TALLY}/export.php?${p.toString()}`, '_blank');
  };

  const syncToTally = async (resource, ledger) => {
    if (!window.confirm('Push these entries directly into TallyPrime? Ensure Tally is open with the gateway enabled (port 9000).')) return;
    setLoading(true);
    try {
      const r = await axios.post(`${TALLY}/sync.php`, { resource, ledger });
      // Tally gateway offline → fall back to downloading the XML for manual import.
      if (r.data?.status === 'offline') {
        flash({ status: 'info', message: r.data.message });
        const fb = r.data.fallback || { resource, ledger };
        exportFile(fb.resource, 'xml', fb.ledger ? { ledger: fb.ledger } : {});
      } else {
        flash(r.data);
      }
      if (tab === 'dashboard') loadDashboard();
    } catch (e) { flash({ status: 'error', message: e.response?.data?.message || 'Sync failed. Is Tally running?' }); }
    finally { setLoading(false); }
  };

  const generateVouchers = async (source) => {
    setLoading(true);
    try {
      const r = await axios.post(`${TALLY}/vouchers.php`, { action: 'generate', source });
      flash(r.data);
      loadVouchers();
    } catch (e) { flash({ status: 'error', message: 'Failed to generate vouchers.' }); }
    finally { setLoading(false); }
  };

  const deleteVoucher = async (id) => {
    if (!window.confirm('Delete this voucher?')) return;
    try { await axios.post(`${TALLY}/vouchers.php`, { action: 'delete', id }); loadVouchers(); }
    catch (e) { flash({ status: 'error', message: 'Delete failed.' }); }
  };

  const postVoucher = async (id) => {
    try { await axios.post(`${TALLY}/vouchers.php`, { action: 'post', id }); loadVouchers(); }
    catch (e) { flash({ status: 'error', message: 'Post failed.' }); }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const r = await axios.post(`${TALLY}/vouchers.php`, { action: 'save_settings', settings });
      flash(r.data);
    } catch (e) { flash({ status: 'error', message: 'Failed to save settings.' }); }
    finally { setLoading(false); }
  };

  const ExportButtons = ({ resource, extra = {} }) => (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => exportFile(resource, 'xml', extra)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest italic hover:bg-amber-600 transition-all active:scale-95"><FileCode2 size={13} /> XML</button>
      <button onClick={() => exportFile(resource, 'excel', extra)} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest italic hover:bg-emerald-700 transition-all active:scale-95"><FileSpreadsheet size={13} /> Excel</button>
      <button onClick={() => exportFile(resource, 'csv', extra)} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest italic hover:border-amber-300 hover:text-amber-600 transition-all active:scale-95"><FileText size={13} /> CSV</button>
      <button onClick={() => previewXML(resource, extra)} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest italic hover:border-amber-300 hover:text-amber-600 transition-all active:scale-95"><Eye size={13} /> Preview</button>
    </div>
  );

  // ---------- renderers ----------
  const renderDashboard = () => {
    const m = dashboard?.metrics || {};
    const c = dashboard?.counts || {};
    const trend = dashboard?.trend || [];
    const maxT = Math.max(...trend.map((t) => t.amount), 1);
    const cards = [
      { label: 'Sales Revenue', value: m.sales_revenue, icon: TrendingUp, bg: 'bg-emerald-50', color: 'text-emerald-600' },
      { label: 'Cashback Paid', value: m.cashback_paid, icon: Coins, bg: 'bg-amber-50', color: 'text-amber-600' },
      { label: 'Referral Paid', value: m.referral_paid, icon: ArrowUpRight, bg: 'bg-violet-50', color: 'text-violet-600' },
      { label: 'Withdrawn', value: m.withdrawn, icon: Landmark, bg: 'bg-rose-50', color: 'text-rose-600' },
      { label: 'Inventory Value', value: m.inventory_value, icon: ShoppingBag, bg: 'bg-slate-100', color: 'text-slate-700' },
      { label: 'Net Position', value: m.net_position, icon: Wallet, bg: 'bg-blue-50', color: 'text-blue-600' },
    ];
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="p-6">
                <div className={`w-11 h-11 ${s.bg} rounded-2xl flex items-center justify-center mb-4`}><s.icon size={20} className={s.color} /></div>
                <Label>{s.label}</Label>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 italic tracking-tighter">{inr(s.value)}</h3>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-8 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] italic">Revenue Trend · 6 Months</h3>
              <TrendingUp size={16} className="text-emerald-500" />
            </div>
            <div className="flex items-end justify-between gap-2 h-44">
              {trend.map((t, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div initial={{ height: 0 }} animate={{ height: `${(t.amount / maxT) * 100}%` }} transition={{ delay: i * 0.08 }}
                    className="w-full bg-gradient-to-t from-amber-500 to-amber-300 rounded-t-lg min-h-[4px]" title={inr(t.amount)} />
                  <span className="text-[8px] font-black text-slate-400 uppercase italic">{t.month}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] italic mb-6">Integration Status</h3>
            <div className="space-y-4">
              {[
                { label: 'Managed Vouchers', value: c.vouchers, icon: Receipt },
                { label: 'Synced to Tally', value: c.synced, icon: CheckCircle2 },
                { label: 'Pending Sync', value: c.pending_sync, icon: Zap },
                { label: 'Sync Runs', value: c.sync_runs, icon: Server },
                { label: 'Audit Entries', value: c.audit_entries, icon: Database },
              ].map((x, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3"><x.icon size={15} className="text-slate-400" /><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">{x.label}</span></div>
                  <span className="text-sm font-black text-slate-900 italic">{x.value ?? 0}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const renderLedgers = () => {
    const meta = LEDGERS.find((l) => l.id === activeLedger);
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {LEDGERS.map((l) => (
            <button key={l.id} onClick={() => setActiveLedger(l.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest italic transition-all ${activeLedger === l.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-900'}`}>
              <l.icon size={13} className={activeLedger === l.id ? 'text-amber-500' : l.color} /> {l.label}
            </button>
          ))}
        </div>

        <Card className="p-6 flex flex-col md:flex-row md:items-end gap-4 justify-between">
          <div className="flex flex-wrap gap-4">
            <div><Label>From</Label><input type="date" value={range.start_date} onChange={(e) => setRange({ ...range, start_date: e.target.value })} className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-black italic outline-none focus:border-amber-500" /></div>
            <div><Label>To</Label><input type="date" value={range.end_date} onChange={(e) => setRange({ ...range, end_date: e.target.value })} className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-black italic outline-none focus:border-amber-500" /></div>
            <button onClick={() => loadLedger(activeLedger)} className="self-end flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest italic hover:bg-amber-100"><RefreshCw size={13} /> Apply</button>
          </div>
          <ExportButtons resource="ledger" extra={{ ledger: activeLedger }} />
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card className="p-6"><div className={`w-11 h-11 ${meta.bg} rounded-2xl flex items-center justify-center mb-4`}><meta.icon size={20} className={meta.color} /></div><Label>{ledgerData.summary?.label || 'Total'}</Label><h3 className="text-2xl font-black text-slate-900 italic tracking-tighter">{inr(ledgerData.summary?.total)}</h3></Card>
          <Card className="p-6"><div className="w-11 h-11 bg-blue-50 rounded-2xl flex items-center justify-center mb-4"><FileBarChart size={20} className="text-blue-600" /></div><Label>Entries</Label><h3 className="text-2xl font-black text-slate-900 italic tracking-tighter">{ledgerData.summary?.count || 0}</h3></Card>
          <Card className="p-6 flex flex-col justify-between"><Label>Push to Tally</Label><button onClick={() => syncToTally('ledger', activeLedger)} className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest italic hover:bg-emerald-700 transition-all active:scale-95 mt-2"><Send size={14} /> Sync {meta.label}</button></Card>
        </div>

        {renderLedgerTable(ledgerData.rows)}
      </div>
    );
  };

  const renderLedgerTable = (rows) => (
    <Card className="overflow-hidden">
      <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] italic">Ledger Entries</h3>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{rows.length} record(s)</span>
      </div>
      {loading ? (
        <div className="py-20 flex items-center justify-center text-amber-600"><Loader2 size={32} className="animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div className="py-20 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest italic">No entries found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[8px] font-black text-slate-400 uppercase tracking-widest italic">
                <th className="px-6 py-4">Date</th><th className="px-6 py-4">Ref</th><th className="px-6 py-4">Particulars</th>
                <th className="px-6 py-4 text-right">Debit</th><th className="px-6 py-4 text-right">Credit</th><th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-slate-50 hover:bg-slate-50/50 text-xs font-bold text-slate-700 italic">
                  <td className="px-6 py-4 whitespace-nowrap">{r.date}</td>
                  <td className="px-6 py-4 font-black text-slate-900">{r.ref}</td>
                  <td className="px-6 py-4 max-w-xs truncate">{r.particulars}</td>
                  <td className="px-6 py-4 text-right">{r.debit > 0 ? inr(r.debit) : '—'}</td>
                  <td className="px-6 py-4 text-right">{r.credit > 0 ? inr(r.credit) : '—'}</td>
                  <td className="px-6 py-4"><StatusPill value={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  const renderReports = () => {
    const isPL = report === 'pnl';
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setReport('pnl')} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest italic transition-all ${isPL ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-500'}`}><TrendingUp size={14} className={isPL ? 'text-amber-500' : ''} /> Profit &amp; Loss</button>
          <button onClick={() => setReport('balance_sheet')} className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest italic transition-all ${!isPL ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-500'}`}><FileBarChart size={14} className={!isPL ? 'text-amber-500' : ''} /> Balance Sheet</button>
        </div>

        {loading || !reportData ? (
          <div className="py-20 flex items-center justify-center text-amber-600"><Loader2 size={32} className="animate-spin" /></div>
        ) : isPL ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Card className="p-6"><Label>Total Income</Label><h3 className="text-2xl font-black text-emerald-600 italic tracking-tighter">{inr(reportData.total_income)}</h3></Card>
              <Card className="p-6"><Label>Total Expense</Label><h3 className="text-2xl font-black text-rose-600 italic tracking-tighter">{inr(reportData.total_expense)}</h3></Card>
              <Card className={`p-6 ${reportData.net_profit >= 0 ? 'bg-emerald-50/40' : 'bg-rose-50/40'}`}><Label>Net Profit ({reportData.margin}%)</Label><h3 className={`text-2xl font-black italic tracking-tighter ${reportData.net_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{inr(reportData.net_profit)}</h3></Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderStatementTable('Income', reportData.income, reportData.total_income, 'emerald')}
              {renderStatementTable('Expenses', reportData.expenses, reportData.total_expense, 'rose')}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderStatementTable('Assets', reportData.assets, reportData.total_assets, 'blue')}
            {renderStatementTable('Liabilities & Equity', reportData.liabilities, reportData.total_liabilities, 'amber')}
          </div>
        )}
      </div>
    );
  };

  const renderStatementTable = (title, items, total, tone) => {
    const toneMap = { emerald: 'text-emerald-600', rose: 'text-rose-600', blue: 'text-blue-600', amber: 'text-amber-600' };
    return (
      <Card className="overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100"><h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] italic">{title}</h3></div>
        <div className="divide-y divide-slate-50">
          {(items || []).map((it, i) => (
            <div key={i} className="px-8 py-4 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 italic">{it.particulars}</span>
              <span className="text-sm font-black text-slate-900 italic">{inr(it.amount)}</span>
            </div>
          ))}
        </div>
        <div className="px-8 py-5 bg-slate-50 flex items-center justify-between border-t border-slate-100">
          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest italic">Total {title}</span>
          <span className={`text-base font-black italic ${toneMap[tone]}`}>{inr(total)}</span>
        </div>
      </Card>
    );
  };

  const renderVouchers = () => (
    <div className="space-y-6">
      <Card className="p-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div>
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] italic mb-1">Voucher Management</h3>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{vouchers.summary?.count || 0} vouchers · {inr(vouchers.summary?.total)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select onChange={(e) => e.target.value && generateVouchers(e.target.value)} defaultValue=""
            className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-[9px] font-black uppercase tracking-widest italic outline-none focus:border-amber-500">
            <option value="">+ Auto-Generate From…</option>
            {LEDGERS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
          <button onClick={() => setShowVoucherForm(true)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest italic hover:bg-amber-600 active:scale-95"><Plus size={14} /> New Voucher</button>
          <button onClick={() => syncToTally('vouchers')} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest italic hover:bg-emerald-700 active:scale-95"><Send size={14} /> Sync All</button>
          <ExportButtons resource="vouchers" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center text-amber-600"><Loader2 size={32} className="animate-spin" /></div>
        ) : vouchers.data.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest italic">No vouchers yet — create one or auto-generate from a ledger</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[8px] font-black text-slate-400 uppercase tracking-widest italic">
                  <th className="px-6 py-4">Voucher #</th><th className="px-6 py-4">Type</th><th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Party</th><th className="px-6 py-4 text-right">Amount</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.data.map((v) => (
                  <tr key={v.id} className="border-t border-slate-50 hover:bg-slate-50/50 text-xs font-bold text-slate-700 italic">
                    <td className="px-6 py-4 font-black text-slate-900">{v.voucher_no}</td>
                    <td className="px-6 py-4">{v.voucher_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{v.voucher_date}</td>
                    <td className="px-6 py-4 max-w-[200px] truncate">{v.party_ledger || v.narration}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">{inr(v.amount)}</td>
                    <td className="px-6 py-4"><StatusPill value={v.sync_status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {v.sync_status === 'draft' && <button onClick={() => postVoucher(v.id)} title="Post" className="text-blue-500 hover:text-blue-700"><CheckCircle2 size={16} /></button>}
                        <button onClick={() => deleteVoucher(v.id)} title="Delete" className="text-rose-400 hover:text-rose-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );

  const renderReconciliation = () => (
    <Card className="overflow-hidden">
      <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] italic">Transaction Reconciliation</h3>
        <button onClick={loadReconciliation} className="flex items-center gap-2 text-amber-600 text-[9px] font-black uppercase tracking-widest italic"><RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh</button>
      </div>
      {loading ? (
        <div className="py-20 flex items-center justify-center text-amber-600"><Loader2 size={32} className="animate-spin" /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[8px] font-black text-slate-400 uppercase tracking-widest italic">
                <th className="px-6 py-4">Ledger</th><th className="px-6 py-4 text-right">Source Records</th><th className="px-6 py-4 text-right">Source Amount</th>
                <th className="px-6 py-4 text-right">Posted</th><th className="px-6 py-4 text-right">Synced</th><th className="px-6 py-4 text-right">Unposted</th><th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {reconciliation.map((r, i) => (
                <tr key={i} className="border-t border-slate-50 hover:bg-slate-50/50 text-xs font-bold text-slate-700 italic">
                  <td className="px-6 py-4 font-black text-slate-900 capitalize">{r.ledger}</td>
                  <td className="px-6 py-4 text-right">{r.source_count}</td>
                  <td className="px-6 py-4 text-right">{inr(r.source_amount)}</td>
                  <td className="px-6 py-4 text-right">{r.posted_count}</td>
                  <td className="px-6 py-4 text-right">{r.synced_count}</td>
                  <td className={`px-6 py-4 text-right font-black ${r.unposted > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{r.unposted}</td>
                  <td className="px-6 py-4"><StatusPill value={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  const renderAudit = () => (
    <Card className="overflow-hidden">
      <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] italic">Audit Trail</h3>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{audit.length} entries</span>
      </div>
      {loading ? (
        <div className="py-20 flex items-center justify-center text-amber-600"><Loader2 size={32} className="animate-spin" /></div>
      ) : audit.length === 0 ? (
        <div className="py-20 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest italic">No audit entries yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[8px] font-black text-slate-400 uppercase tracking-widest italic">
                <th className="px-6 py-4">Time</th><th className="px-6 py-4">Action</th><th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">Detail</th><th className="px-6 py-4 text-right">Amount</th><th className="px-6 py-4">Actor</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((a) => (
                <tr key={a.id} className="border-t border-slate-50 hover:bg-slate-50/50 text-xs font-bold text-slate-700 italic">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-400">{a.created_at}</td>
                  <td className="px-6 py-4 font-black text-slate-900">{a.action}</td>
                  <td className="px-6 py-4 capitalize">{a.entity}{a.entity_id ? ` #${a.entity_id}` : ''}</td>
                  <td className="px-6 py-4 max-w-xs truncate">{a.detail}</td>
                  <td className="px-6 py-4 text-right">{a.amount ? inr(a.amount) : '—'}</td>
                  <td className="px-6 py-4">{a.actor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  const renderSettings = () => {
    if (!settings) return <div className="py-20 flex items-center justify-center text-amber-600"><Loader2 size={32} className="animate-spin" /></div>;
    const set = (k) => (e) => setSettings({ ...settings, [k]: e.target.value });
    const fields = [
      { k: 'company', label: 'Company Name in Tally', hint: 'Leave blank to use whichever company is currently open in Tally' },
      { k: 'gateway', label: 'Tally Connection Address', hint: 'The URL where Tally listens (default http://localhost:9000)' },
      { k: 'sales_ledger', label: 'Sales Account Name', hint: 'Where sales income (excl. GST) is recorded in Tally' },
      { k: 'cgst_ledger', label: 'Output CGST Account', hint: 'Ledger for CGST collected on sales (duties & taxes)' },
      { k: 'sgst_ledger', label: 'Output SGST Account', hint: 'Ledger for SGST collected on sales (duties & taxes)' },
      { k: 'cashback_ledger', label: 'Cashback Expense Account', hint: 'Where cashback payouts are recorded' },
      { k: 'referral_ledger', label: 'Referral Commission Account', hint: 'Where referral payouts are recorded' },
      { k: 'bank_ledger', label: 'Bank / Cash Account', hint: 'Your main money account in Tally' },
      { k: 'debtors_group', label: 'Customers Group', hint: 'Group under which customer accounts are created (Sundry Debtors)' },
      { k: 'inventory_group', label: 'Stock / Inventory Group', hint: 'Group for your gold / product stock' },
    ];
    return (
      <Card className="p-8 md:p-10 space-y-8">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-amber-500"><Building2 size={18} /></div>
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] italic">Tally ERP Prime — Integration Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((f) => <Field key={f.k} label={f.label} hint={f.hint} value={settings[f.k] || ''} onChange={set(f.k)} />)}
        </div>
        <button onClick={saveSettings} disabled={loading} className="flex items-center gap-2 bg-slate-900 text-white px-7 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] italic hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-40">
          {loading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Save Settings
        </button>
      </Card>
    );
  };

  // ---------- voucher form modal ----------
  const VoucherForm = () => {
    const [f, setF] = useState({ voucher_type: 'Journal', voucher_date: new Date().toISOString().slice(0, 10), party_ledger: '', debit_ledger: '', credit_ledger: '', amount: '', narration: '' });
    const submit = async () => {
      if (!f.amount || Number(f.amount) <= 0) { flash({ status: 'error', message: 'Enter a valid amount.' }); return; }
      try {
        const r = await axios.post(`${TALLY}/vouchers.php`, { action: 'create', ...f });
        flash(r.data); setShowVoucherForm(false); loadVouchers();
      } catch (e) { flash({ status: 'error', message: 'Failed to create voucher.' }); }
    };
    return (
      <AnimatePresence>
        {showVoucherForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowVoucherForm(false)} className="fixed inset-0 z-[400] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2rem] border border-slate-100 shadow-2xl w-full max-w-lg p-8 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">New Voucher</h3>
                <button onClick={() => setShowVoucherForm(false)} className="text-slate-400 hover:text-slate-900"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Entry Type</label>
                  <select value={f.voucher_type} onChange={(e) => setF({ ...f, voucher_type: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-black italic outline-none focus:border-amber-500">
                    {[
                      ['Sales', 'Sales — money received from a customer'],
                      ['Purchase', 'Purchase — money spent buying stock'],
                      ['Receipt', 'Receipt — cash/bank money came in'],
                      ['Payment', 'Payment — cash/bank money went out'],
                      ['Journal', 'Journal — adjustment entry'],
                      ['Contra', 'Contra — cash ⇄ bank transfer'],
                      ['Credit Note', 'Credit Note — sales return'],
                      ['Debit Note', 'Debit Note — purchase return'],
                    ].map(([t, d]) => <option key={t} value={t}>{t} — {d.split(' — ')[1]}</option>)}
                  </select>
                  <p className="text-[8px] font-bold text-slate-400 normal-case tracking-normal not-italic ml-1 leading-snug">What kind of money movement is this?</p>
                </div>
                <Field label="Date" type="date" value={f.voucher_date} onChange={(e) => setF({ ...f, voucher_date: e.target.value })}
                  hint="When did this happen?" />
                <Field label="Customer / Party Name" placeholder="e.g. Jesscia" value={f.party_ledger} onChange={(e) => setF({ ...f, party_ledger: e.target.value })}
                  hint="Who is this entry about? (customer or vendor name)" />
                <Field label="Amount (₹)" type="number" placeholder="e.g. 50000" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })}
                  hint="How much money?" />
                <Field label="Money Goes To" placeholder="e.g. Bank Account" value={f.debit_ledger} onChange={(e) => setF({ ...f, debit_ledger: e.target.value })}
                  hint="Account that receives / increases (Debit)" />
                <Field label="Money Comes From" placeholder="e.g. Sales Account" value={f.credit_ledger} onChange={(e) => setF({ ...f, credit_ledger: e.target.value })}
                  hint="Account that gives / decreases (Credit)" />
              </div>
              <Field label="Description / Note" placeholder="e.g. Gold coin purchase by Jesscia" value={f.narration} onChange={(e) => setF({ ...f, narration: e.target.value })}
                hint="A short note so you remember what this entry is for" />
              <button onClick={submit} className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-7 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] italic hover:bg-amber-600 transition-all active:scale-95"><Plus size={15} /> Create Voucher</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const refreshCurrent = () => {
    if (tab === 'dashboard') loadDashboard();
    if (tab === 'ledgers') loadLedger(activeLedger);
    if (tab === 'reports') loadReport(report);
    if (tab === 'vouchers') loadVouchers();
    if (tab === 'reconciliation') loadReconciliation();
    if (tab === 'audit') loadAudit();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-inter text-slate-900 overflow-x-hidden">
      <Sidebar showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className="ml-0 lg:ml-72 min-h-screen relative w-full">
        {/* Header */}
        <div className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowMobileMenu(true)} className="lg:hidden w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200"><Menu size={20} /></button>
            <div>
              <h1 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">Tally Integration</h1>
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1 italic leading-none">Real-time Accounting · Tally ERP Prime</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[7px] font-black uppercase tracking-widest text-emerald-600 italic">MySQL · Live · Auto 15s</span>
            </div>
            <button onClick={refreshCurrent} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 hover:text-amber-600 transition-colors"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
          </div>
        </div>

        <main className="p-5 md:p-8 lg:p-10 w-full max-w-[1500px] space-y-7 pb-32">
          <div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Accounting Hub</h2>
            <p className="text-[10px] md:text-[12px] text-slate-400 font-black uppercase tracking-[0.3em] mt-3 italic">Ledgers · Reports · Vouchers · Sync to Tally ERP Prime</p>
          </div>

          {/* Tab nav */}
          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest italic whitespace-nowrap transition-all ${tab === t.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-900'}`}>
                <t.icon size={14} className={tab === t.id ? 'text-amber-500' : ''} /> {t.label}
              </button>
            ))}
          </div>

          {tab === 'dashboard' && (dashboard ? renderDashboard() : <div className="py-20 flex justify-center text-amber-600"><Loader2 size={32} className="animate-spin" /></div>)}
          {tab === 'ledgers' && renderLedgers()}
          {tab === 'reports' && renderReports()}
          {tab === 'vouchers' && renderVouchers()}
          {tab === 'reconciliation' && renderReconciliation()}
          {tab === 'audit' && renderAudit()}
          {tab === 'settings' && renderSettings()}
        </main>
      </div>

      <VoucherForm />
      <Toast result={result} onClose={() => setResult(null)} />
    </div>
  );
};

export default TallyIntegration;
