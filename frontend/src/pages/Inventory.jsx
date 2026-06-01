import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Package, Trash2, Settings, XCircle, Loader2,
  RefreshCw, Zap, CheckCircle2, AlertTriangle, X, Search,
  TrendingUp, ShoppingBag, BarChart3, History, Bell,
  ArrowRight, ChevronUp, ChevronDown, ArrowUpDown,
  Check, AlertCircle, RotateCcw, Minus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import CustomerHeader from '../components/CustomerHeader';
import API_BASE_URL from '../config';

const SITE_URL = API_BASE_URL.replace('/api', '');
const imgUrl = (p) => p ? (p.startsWith('http') ? p : `${SITE_URL}/${p}`) : null;

// ── Stock Badge ───────────────────────────────────────────────────────────────
const StockBadge = ({ status }) => {
  const map = {
    in_stock:     { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', label: 'In Stock' },
    low_stock:    { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-100',   label: 'Low Stock' },
    out_of_stock: { bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'border-rose-100',    label: 'Out of Stock' },
  };
  const s = map[status] || map.in_stock;
  return (
    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border italic ${s.bg} ${s.text} ${s.border}`}>
      {s.label}
    </span>
  );
};

// ── Movement Badge ────────────────────────────────────────────────────────────
const MovBadge = ({ type }) => {
  const map = {
    add:     { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '+ Add' },
    remove:  { bg: 'bg-rose-100',    text: 'text-rose-700',    label: '− Remove' },
    adjust:  { bg: 'bg-blue-100',    text: 'text-blue-700',    label: '⟳ Adjust' },
    sale:    { bg: 'bg-amber-100',   text: 'text-amber-700',   label: '↑ Sale' },
    return:  { bg: 'bg-purple-100',  text: 'text-purple-700',  label: '↩ Return' },
    initial: { bg: 'bg-slate-100',   text: 'text-slate-600',   label: '◎ Initial' },
  };
  const s = map[type] || map.adjust;
  return <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider ${s.bg} ${s.text}`}>{s.label}</span>;
};

// ═════════════════════════════════════════════════════════════════════════════
const Inventory = () => {
  const navigate = useNavigate();
  const pollRef  = useRef(null);
  const user     = JSON.parse(localStorage.getItem('user') || '{}');

  // ── State ──────────────────────────────────────────────────────────────────
  const [products,      setProducts]      = useState([]);
  const [stockMap,      setStockMap]      = useState({});   // product_id → stock row
  const [adminCategories, setAdminCategories] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [processing,    setProcessing]    = useState(false);
  const [lastSync,      setLastSync]      = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [toast,         setToast]         = useState(null);
  const [search,        setSearch]        = useState('');

  // Stock tracking requires api/admin/inventory.php on the server.
  // If that endpoint is missing (e.g. not yet deployed), we degrade to products-only.
  const [stockEnabled, setStockEnabled] = useState(true);
  const stockEnabledRef = useRef(true);

  // product modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState({ id: null, name: '', category: 'Gold', weight: '', purity: '24K', price: '', description: '', image: '', is_active: 1 });
  const [productType, setProductType] = useState('precious_metal');
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);

  // stock modal
  const [stockModal,  setStockModal]  = useState(null);
  const [stockForm,   setStockForm]   = useState({ action: 'add', quantity: '', notes: '' });
  const [stockMsg,    setStockMsg]    = useState({ type: '', text: '' });
  const [submitting,  setSubmitting]  = useState(false);

  // history modal
  const [historyModal, setHistoryModal] = useState(null);
  const [movements,    setMovements]    = useState([]);

  // alerts
  const [alerts,      setAlerts]      = useState([]);
  const [alertsPanel, setAlertsPanel] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    try {
      // Always available on production: products + categories
      const [prodRes, catRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/admin/products.php`),
        axios.get(`${API_BASE_URL}/admin/categories.php`),
      ]);

      if (prodRes.status === 'fulfilled' && prodRes.value.data.status === 'success') {
        setProducts(prodRes.value.data.data || []);
        setLastSync(new Date());
      }
      if (catRes.status === 'fulfilled' && catRes.value.data.status === 'success') {
        setAdminCategories(catRes.value.data.data || []);
      }

      // Optional: stock tracking (inventory.php). Skip entirely once we know it's unavailable.
      if (stockEnabledRef.current) {
        const [invRes, alertRes] = await Promise.allSettled([
          axios.get(`${API_BASE_URL}/admin/inventory.php`),
          axios.get(`${API_BASE_URL}/admin/inventory.php?action=alerts`),
        ]);

        const invOk = invRes.status === 'fulfilled' && invRes.value?.data?.status === 'success';
        if (invOk) {
          const map = {};
          (invRes.value.data.data || []).forEach(r => { map[r.id] = r; });
          setStockMap(map);
        }
        if (alertRes.status === 'fulfilled' && alertRes.value?.data?.status === 'success') {
          setAlerts(alertRes.value.data.data || []);
        }

        // Both rejected → endpoint missing/unreachable. Disable stock features & stop polling it.
        if (invRes.status === 'rejected' && alertRes.status === 'rejected') {
          stockEnabledRef.current = false;
          setStockEnabled(false);
        }
      }
    } catch (err) {
      console.error('Inventory fetch error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchMovements = async (product_id = null) => {
    try {
      const url = product_id
        ? `${API_BASE_URL}/admin/inventory.php?action=movements&product_id=${product_id}`
        : `${API_BASE_URL}/admin/inventory.php?action=movements`;
      const res = await axios.get(url);
      if (res.data.status === 'success') setMovements(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchAll();
    pollRef.current = setInterval(() => fetchAll(true), 30000);
    return () => clearInterval(pollRef.current);
  }, [fetchAll]);

  // ── Filtered products ──────────────────────────────────────────────────────
  const filtered = products.filter(p =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Save Product (Add / Edit) ──────────────────────────────────────────────
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const url = productForm.id
        ? `${API_BASE_URL}/admin/update_product.php`
        : `${API_BASE_URL}/admin/products.php`;

      const fd = new FormData();
      const payload = {
        ...productForm,
        weight: productType === 'general' ? (productForm.weight || 0) : productForm.weight,
        purity: productType === 'general' ? (productForm.purity || '') : productForm.purity,
      };
      Object.keys(payload).forEach(k => {
        if (payload[k] !== null && payload[k] !== undefined) fd.append(k, payload[k]);
      });

      const res = await axios.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.status === 'success') {
        showToast(productForm.id ? 'Product updated successfully!' : 'Product added successfully!');
        setShowProductModal(false);
        resetProductForm();
        fetchAll(true);
      } else {
        showToast(res.data.message || 'Failed to save product.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Connection error.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // ── Delete Product ─────────────────────────────────────────────────────────
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setProcessing(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/delete_product.php`, { id });
      if (res.data.status === 'success') {
        showToast('Product deleted successfully.');
        fetchAll(true);
      }
    } catch (err) {
      showToast('Delete failed.', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // ── Stock Update ───────────────────────────────────────────────────────────
  const handleStockUpdate = async (e) => {
    e.preventDefault();
    if (!stockModal) return;
    const qty = parseInt(stockForm.quantity);
    if (stockForm.action !== 'set' && (!qty || qty <= 0)) {
      setStockMsg({ type: 'error', text: 'Enter a valid quantity.' }); return;
    }
    setSubmitting(true);
    setStockMsg({ type: '', text: '' });
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/inventory.php`, {
        action: stockForm.action, product_id: stockModal.id,
        quantity: qty, notes: stockForm.notes, created_by: user.id,
      });
      if (res.data.status === 'success') {
        setStockMsg({ type: 'success', text: res.data.message });
        fetchAll(true);
        setTimeout(() => {
          setStockModal(null);
          setStockForm({ action: 'add', quantity: '', notes: '' });
          setStockMsg({ type: '', text: '' });
        }, 1400);
      } else {
        setStockMsg({ type: 'error', text: res.data.message });
      }
    } catch {
      setStockMsg({ type: 'error', text: 'Network error. Try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const resetProductForm = () => {
    setProductForm({ id: null, name: '', category: 'Gold', weight: '', purity: '24K', price: '', description: '', image: '', is_active: 1 });
    setProductType('precious_metal');
    setCategorySearch('');
    setShowCategoryDropdown(false);
  };

  const openAddModal = () => {
    const defaultCat = adminCategories[0]?.name || 'Gold';
    setProductForm({ id: null, name: '', category: defaultCat, weight: '', purity: '24K', price: '', description: '', image: '', is_active: 1 });
    setProductType('precious_metal');
    setCategorySearch('');
    setShowCategoryDropdown(false);
    setShowProductModal(true);
  };

  const openEditModal = (p) => {
    const isPrecious = /^(22K|24K|18K|999)$/.test(p.purity || '') || parseFloat(p.weight || 0) > 0;
    setProductForm({ id: p.id, name: p.name || '', category: p.category || 'Gold', weight: p.weight || '', purity: p.purity || (isPrecious ? '24K' : ''), price: p.price || '', description: p.description || '', image: p.image || '', is_active: p.is_active });
    setProductType(isPrecious ? 'precious_metal' : 'general');
    setCategorySearch('');
    setShowCategoryDropdown(false);
    setShowProductModal(true);
  };

  const currentStockQty = stockModal ? (stockMap[stockModal.id]?.stock_quantity ?? 0) : 0;
  const currentStockStatus = stockModal ? (stockMap[stockModal.id]?.stock_status ?? 'out_of_stock') : 'out_of_stock';

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center text-amber-600">
      <div className="flex flex-col items-center gap-5">
        <Loader2 className="animate-spin" size={52} strokeWidth={2} />
        <p className="text-[10px] font-black animate-pulse uppercase tracking-[0.5em] italic">Loading Inventory...</p>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50 flex font-inter text-slate-900 overflow-x-hidden">
      <Sidebar showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className="ml-0 lg:ml-72 min-h-screen w-full">
        <CustomerHeader setShowMobileMenu={setShowMobileMenu} activeTab="Asset Inventory" />

        <main className="p-4 sm:p-6 md:p-8 pb-24 w-full max-w-[1600px] mx-auto space-y-8">

          {/* ── Inventory Card ── */}
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 p-6 md:p-10 rounded-[2.5rem] shadow-sm">

            {/* Header row */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                  Gold Inventory
                </h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">
                  Registry of physical assets and digital investment instruments
                </p>
                {lastSync && (
                  <p className="text-[8px] text-slate-300 font-black italic mt-1">
                    Last synced {lastSync.toLocaleTimeString()}
                  </p>
                )}
                {!stockEnabled && (
                  <p className="text-[8px] text-amber-500 font-black uppercase tracking-widest italic mt-1.5">
                    Stock tracking offline — deploy inventory.php to enable
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {stockEnabled && alerts.length > 0 && (
                  <button onClick={() => setAlertsPanel(true)}
                    className="relative bg-rose-500 text-white px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest italic flex items-center gap-2 shadow-lg hover:bg-rose-400 transition-all active:scale-95">
                    <Bell size={13} /> Alerts
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-slate-900 text-white rounded-full text-[8px] font-black flex items-center justify-center">
                      {alerts.length}
                    </span>
                  </button>
                )}

                <button onClick={() => fetchAll(true)}
                  className="w-11 h-11 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-amber-600 hover:border-amber-400 transition-all shadow-sm">
                  <RefreshCw size={15} className={refreshing ? 'animate-spin text-amber-500' : ''} />
                </button>

                {/* Search */}
                <div className="relative">
                  <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search products..."
                    className="bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-4 py-3 text-[10px] font-black uppercase italic outline-none focus:border-amber-500 transition-all w-44" />
                  {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-700"><X size={11} /></button>}
                </div>

                <button onClick={openAddModal}
                  className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[9px] flex items-center gap-2 hover:bg-amber-600 transition shadow-xl active:scale-95 uppercase tracking-widest italic">
                  <Plus size={15} strokeWidth={3} /> Provision Asset
                </button>
              </div>
            </div>

            {/* ── Products Table ── */}
            <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="py-5 px-6 text-[8px] font-black uppercase tracking-[0.25em] text-slate-400 border-b border-slate-100 italic">Asset Description</th>
                      <th className="py-5 px-6 text-[8px] font-black uppercase tracking-[0.25em] text-slate-400 border-b border-slate-100 italic">Classification</th>
                      <th className="py-5 px-6 text-[8px] font-black uppercase tracking-[0.25em] text-slate-400 border-b border-slate-100 italic">Metric / Purity</th>
                      <th className="py-5 px-6 text-[8px] font-black uppercase tracking-[0.25em] text-slate-400 border-b border-slate-100 italic">Market Value</th>
                      {stockEnabled && <th className="py-5 px-6 text-[8px] font-black uppercase tracking-[0.25em] text-slate-400 border-b border-slate-100 italic">Stock</th>}
                      <th className="py-5 px-6 text-[8px] font-black uppercase tracking-[0.25em] text-slate-400 border-b border-slate-100 italic">Status</th>
                      <th className="py-5 px-6 text-[8px] font-black uppercase tracking-[0.25em] text-slate-400 border-b border-slate-100 text-right italic">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={stockEnabled ? 7 : 6} className="py-20 text-center">
                          <Package size={48} className="text-slate-100 mx-auto mb-3" strokeWidth={1} />
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] italic text-slate-300">
                            {search ? 'No products match your search' : 'No products yet — provision your first asset'}
                          </p>
                        </td>
                      </tr>
                    ) : filtered.map((p, i) => {
                      const stock = stockMap[p.id];
                      const stockQty    = stock?.stock_quantity ?? '—';
                      const stockStatus = stock?.stock_status ?? null;
                      return (
                        <motion.tr key={p.id}
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className="hover:bg-slate-50/60 transition group">

                          {/* Asset */}
                          <td className="py-6 px-6">
                            <div className="flex items-center gap-4">
                              <div className="w-11 h-11 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden shadow-inner shrink-0">
                                {imgUrl(p.image)
                                  ? <img src={imgUrl(p.image)} alt={p.name} className="w-full h-full object-cover" />
                                  : <Package className="text-slate-200" size={18} />}
                              </div>
                              <span className="font-black text-sm text-slate-900 uppercase italic tracking-tight group-hover:text-amber-600 transition-colors max-w-[180px] truncate">
                                {p.name}
                              </span>
                            </div>
                          </td>

                          {/* Classification */}
                          <td className="py-6 px-6">
                            <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest italic">{p.category || 'Gold'}</div>
                            <div className="text-[8px] text-slate-400 font-bold mt-0.5 uppercase">Asset Type</div>
                          </td>

                          {/* Metric / Purity */}
                          <td className="py-6 px-6">
                            <span className="font-black text-xs text-slate-900 italic tracking-tighter uppercase">
                              {p.weight ? `${p.weight}g` : '—'}{p.purity ? ` · ${p.purity}` : ''}
                            </span>
                          </td>

                          {/* Market Value */}
                          <td className="py-6 px-6">
                            <span className="font-black text-xl text-slate-900 italic tracking-tighter">
                              ₹{parseFloat(p.price || 0).toLocaleString('en-IN')}
                            </span>
                          </td>

                          {/* Stock qty */}
                          {stockEnabled && (
                            <td className="py-6 px-6">
                              <button onClick={() => { setStockModal(p); setStockForm({ action: 'add', quantity: '', notes: '' }); setStockMsg({ type: '', text: '' }); }}
                                className="flex items-center gap-2 group/s hover:text-amber-600 transition-colors">
                                <span className={`font-black text-lg italic tracking-tighter ${stockStatus === 'out_of_stock' ? 'text-rose-600' : stockStatus === 'low_stock' ? 'text-amber-600' : 'text-slate-900'}`}>
                                  {stockQty}
                                </span>
                                <span className="text-[8px] text-slate-300 font-black uppercase italic">units</span>
                                <Plus size={11} strokeWidth={2.5} className="text-slate-200 group-hover/s:text-amber-500 transition-colors" />
                              </button>
                            </td>
                          )}

                          {/* Status */}
                          <td className="py-6 px-6">
                            <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border italic ${
                              p.is_active == 1 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                            }`}>
                              {p.is_active == 1 ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-6 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {stockEnabled && (
                                <button onClick={() => { fetchMovements(p.id); setHistoryModal(p); }}
                                  title="Stock History"
                                  className="w-9 h-9 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all active:scale-90">
                                  <History size={14} />
                                </button>
                              )}
                              <button onClick={() => openEditModal(p)}
                                title="Edit"
                                className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-amber-600 transition-all shadow-lg active:scale-90">
                                <Settings size={15} />
                              </button>
                              <button onClick={() => handleDeleteProduct(p.id)}
                                title="Delete"
                                className="w-9 h-9 bg-white text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all border border-slate-200 active:scale-90">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>

        </main>
      </div>

      {/* ════════════════ PRODUCT MODAL (ADD / EDIT) ════════════════ */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[400] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border border-slate-100 p-8 md:p-12 rounded-[3rem] w-full max-w-4xl relative overflow-y-auto max-h-[90vh] shadow-2xl">

              <button onClick={() => setShowProductModal(false)}
                className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 p-2 bg-slate-50 rounded-full transition-colors">
                <XCircle size={26} />
              </button>

              <div className="mb-8">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">
                  {productForm.id ? 'Edit Asset' : 'Provision New Asset'}
                </h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5 italic">
                  {productType === 'precious_metal' ? 'Gold, silver & jewellery inventory' : 'Electronics, accessories & general products'}
                </p>
              </div>

              {/* Product type toggle */}
              <div className="flex gap-3 mb-8">
                <button type="button"
                  onClick={() => { setProductType('precious_metal'); setProductForm(f => ({ ...f, purity: '24K' })); }}
                  className={`flex-1 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest italic transition-all border-2 flex items-center justify-center gap-2 ${productType === 'precious_metal' ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-xl' : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-amber-300'}`}>
                  <Zap size={14} /> Precious Metal
                </button>
                <button type="button"
                  onClick={() => { setProductType('general'); setProductForm(f => ({ ...f, purity: '', weight: '' })); }}
                  className={`flex-1 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest italic transition-all border-2 flex items-center justify-center gap-2 ${productType === 'general' ? 'bg-slate-900 text-emerald-400 border-slate-900 shadow-xl' : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-emerald-300'}`}>
                  <Package size={14} /> General Product
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3 italic">
                      {productType === 'precious_metal' ? 'Asset Name' : 'Product Name'} *
                    </label>
                    <input type="text" required
                      placeholder={productType === 'precious_metal' ? 'e.g. 22K Gold Coin 1g' : 'e.g. Samsung Galaxy S24'}
                      value={productForm.name}
                      onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-black uppercase italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner" />
                  </div>

                  {/* Weight (precious) / Specification (general) */}
                  {productType === 'precious_metal' ? (
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3 italic">Weight (Grams) *</label>
                      <input type="number" step="0.001" required
                        placeholder="e.g. 1"
                        value={productForm.weight}
                        onChange={e => setProductForm({ ...productForm, weight: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-black italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3 italic">Specification / Model</label>
                      <input type="text"
                        placeholder="e.g. 128GB / 8GB RAM"
                        value={productForm.purity}
                        onChange={e => setProductForm({ ...productForm, purity: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-black uppercase italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner" />
                    </div>
                  )}

                  {/* Purity (precious only) */}
                  {productType === 'precious_metal' && (
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3 italic">Purity / Karat</label>
                      <select value={productForm.purity}
                        onChange={e => setProductForm({ ...productForm, purity: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-sm font-black uppercase italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner appearance-none">
                        <option value="24K">24K — 99.9% Pure Gold</option>
                        <option value="22K">22K — 91.6% Pure Gold</option>
                        <option value="18K">18K — 75% Pure Gold</option>
                        <option value="999">999 — Pure Silver</option>
                      </select>
                    </div>
                  )}

                  {/* Category combobox */}
                  <div className="space-y-2 relative">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3 italic">Category</label>
                    <div className="relative">
                      <input type="text" autoComplete="off"
                        placeholder="Type to search or create..."
                        value={showCategoryDropdown ? categorySearch : (productForm.category || '')}
                        onFocus={() => { setShowCategoryDropdown(true); setCategorySearch(productForm.category || ''); }}
                        onBlur={() => { if (categorySearch.trim()) setProductForm(f => ({ ...f, category: categorySearch.trim() })); setTimeout(() => setShowCategoryDropdown(false), 180); }}
                        onChange={e => { setCategorySearch(e.target.value); setProductForm(f => ({ ...f, category: e.target.value })); }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 pr-10 text-sm font-black uppercase italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner" />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-xs">▼</span>
                      {showCategoryDropdown && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[999] overflow-hidden mt-1 max-h-52 overflow-y-auto"
                          onMouseDown={e => e.preventDefault()}>
                          {adminCategories
                            .filter(c => c?.name?.toLowerCase().includes((categorySearch || '').toLowerCase()))
                            .map(cat => (
                              <button key={cat.id} type="button"
                                onClick={() => { setProductForm(f => ({ ...f, category: cat.name })); setShowCategoryDropdown(false); setCategorySearch(''); }}
                                className={`w-full text-left px-6 py-3.5 text-sm font-black uppercase italic tracking-widest transition-colors hover:bg-amber-50 hover:text-amber-700 ${productForm.category === cat.name ? 'bg-amber-50 text-amber-600' : 'text-slate-700'}`}>
                                {cat.name}
                              </button>
                            ))}
                          {categorySearch.trim() && !adminCategories.some(c => c?.name?.toLowerCase() === categorySearch.trim().toLowerCase()) && (
                            <button type="button" disabled={savingCategory}
                              onClick={async () => {
                                const n = categorySearch.trim(); if (!n || savingCategory) return;
                                setSavingCategory(true);
                                try {
                                  const r = await axios.post(`${API_BASE_URL}/admin/categories.php`, { name: n });
                                  if (r.data.status === 'success') {
                                    setAdminCategories(prev => [...prev, r.data.data]);
                                    setProductForm(f => ({ ...f, category: r.data.data.name }));
                                    setShowCategoryDropdown(false); setCategorySearch('');
                                  }
                                } catch { alert('Failed to create category'); }
                                finally { setSavingCategory(false); }
                              }}
                              className="w-full text-left px-6 py-3.5 text-sm font-black uppercase italic tracking-widest text-amber-600 hover:bg-amber-50 transition-colors border-t border-slate-100 flex items-center gap-2">
                              <Plus size={13} />{savingCategory ? 'Creating...' : `Create "${categorySearch.trim()}"`}
                            </button>
                          )}
                          {adminCategories.filter(c => c?.name?.toLowerCase().includes((categorySearch || '').toLowerCase())).length === 0 && !categorySearch.trim() && (
                            <div className="px-6 py-4 text-[10px] font-black uppercase italic tracking-widest text-slate-300">Start typing to search or create...</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3 italic">Valuation (₹) *</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg font-black text-slate-300">₹</span>
                      <input type="number" required min="0"
                        value={productForm.price}
                        onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-xl font-black text-amber-600 italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner" />
                    </div>
                  </div>

                  {/* Image upload */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3 italic">Product Image</label>
                    <label htmlFor="prod-img"
                      className="flex items-center justify-center gap-3 w-full border-2 border-dashed border-slate-200 rounded-2xl py-5 px-4 cursor-pointer hover:border-amber-500 hover:bg-amber-50/30 transition-all group">
                      {productForm.image && typeof productForm.image === 'object' ? (
                        <div className="flex items-center gap-3">
                          <img src={URL.createObjectURL(productForm.image)} alt="preview" className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                          <p className="text-[9px] font-black italic text-slate-700">{productForm.image.name}</p>
                        </div>
                      ) : productForm.image && typeof productForm.image === 'string' ? (
                        <div className="flex items-center gap-3">
                          <img src={imgUrl(productForm.image)} alt="current" className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                          <p className="text-[9px] font-black italic text-slate-500">Current image (upload to replace)</p>
                        </div>
                      ) : (
                        <>
                          <Package size={18} className="text-slate-300 group-hover:text-amber-500 transition-colors" />
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic group-hover:text-amber-600">Click to upload image</p>
                        </>
                      )}
                    </label>
                    <input id="prod-img" type="file" accept="image/*" className="hidden"
                      onChange={e => setProductForm({ ...productForm, image: e.target.files?.[0] || '' })} />
                  </div>
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-4">
                  <button type="button"
                    onClick={() => setProductForm(f => ({ ...f, is_active: f.is_active == 1 ? 0 : 1 }))}
                    className={`w-12 h-6 rounded-full transition-all relative ${productForm.is_active == 1 ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${productForm.is_active == 1 ? 'left-6' : 'left-0.5'}`} />
                  </button>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                    {productForm.is_active == 1 ? 'Active (active)' : 'Inactive (inactive)'}
                  </span>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-3 italic">Description</label>
                  <textarea rows={3} value={productForm.description}
                    onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Optional product description..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-6 text-[11px] font-black italic text-slate-700 outline-none focus:border-amber-500 focus:bg-white transition-all resize-none" />
                </div>

                <div className="flex gap-4">
                  <button type="button" onClick={() => setShowProductModal(false)}
                    className="flex-1 py-4 border border-slate-200 rounded-2xl text-[9px] font-black uppercase tracking-widest italic text-slate-400 hover:bg-slate-50 transition-all">
                    Cancel
                  </button>
                  <button type="submit" disabled={processing}
                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest italic hover:bg-amber-600 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2">
                    {processing ? <Loader2 size={16} className="animate-spin" /> : <><Zap size={14} className="text-amber-400" /> {productForm.id ? 'Save Changes' : 'Provision Asset'}</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════════ STOCK UPDATE MODAL ════════════════ */}
      <AnimatePresence>
        {stockModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[450] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden">

              <div className="bg-slate-900 p-7 relative overflow-hidden">
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                <button onClick={() => setStockModal(null)} className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white/60 hover:text-white transition-colors"><X size={16} /></button>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-white/10 border border-white/10 shrink-0">
                    {imgUrl(stockModal.image)
                      ? <img src={imgUrl(stockModal.image)} alt={stockModal.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Package size={18} className="text-white/40" /></div>}
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] italic mb-1">Update Stock</p>
                    <h3 className="text-lg font-black text-white uppercase italic tracking-tight leading-tight truncate max-w-[240px]">{stockModal.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] font-black text-amber-400 italic">Current: {currentStockQty} units</span>
                      {stockMap[stockModal.id] && <StockBadge status={currentStockStatus} />}
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleStockUpdate} className="p-7 space-y-5">
                <div className="grid grid-cols-3 gap-2">
                  {[{ val: 'add', label: 'Add', color: 'emerald' }, { val: 'remove', label: 'Remove', color: 'rose' }, { val: 'set', label: 'Set Exact', color: 'blue' }].map(a => (
                    <button key={a.val} type="button"
                      onClick={() => setStockForm(f => ({ ...f, action: a.val }))}
                      className={`py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest italic transition-all border-2 ${
                        stockForm.action === a.val
                          ? a.color === 'emerald' ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg'
                          : a.color === 'rose' ? 'bg-rose-500 text-white border-rose-500 shadow-lg'
                          : 'bg-blue-500 text-white border-blue-500 shadow-lg'
                          : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-300'
                      }`}>
                      {a.label}
                    </button>
                  ))}
                </div>

                <input type="number" min="0" required
                  value={stockForm.quantity}
                  onChange={e => setStockForm(f => ({ ...f, quantity: e.target.value }))}
                  placeholder="Enter quantity..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 text-2xl font-black italic text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition-all shadow-inner tracking-tighter" />

                {stockForm.quantity && (
                  <div className="flex items-center gap-2 text-[9px] font-black italic">
                    <span className="text-slate-400">{currentStockQty}</span>
                    <ArrowRight size={10} className="text-slate-300" />
                    <span className={`font-black ${stockForm.action === 'add' ? 'text-emerald-600' : stockForm.action === 'remove' ? 'text-rose-600' : 'text-blue-600'}`}>
                      {stockForm.action === 'add' ? currentStockQty + parseInt(stockForm.quantity || 0)
                        : stockForm.action === 'remove' ? Math.max(0, currentStockQty - parseInt(stockForm.quantity || 0))
                        : parseInt(stockForm.quantity || 0)} units
                    </span>
                  </div>
                )}

                <textarea value={stockForm.notes} onChange={e => setStockForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Reason for update (optional)..." rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-5 text-xs font-black italic text-slate-700 outline-none focus:border-amber-500 focus:bg-white transition-all resize-none" />

                {stockMsg.text && (
                  <div className={`p-3 rounded-2xl text-[9px] font-black uppercase tracking-widest italic flex items-center gap-2 ${stockMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                    {stockMsg.type === 'success' ? <Check size={12} /> : <AlertCircle size={12} />}{stockMsg.text}
                  </div>
                )}

                <button type="submit" disabled={submitting}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] italic hover:bg-amber-600 transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3">
                  {submitting ? <Loader2 className="animate-spin" size={16} /> : <><Zap size={14} className="text-amber-400" /> Confirm Update</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════════ MOVEMENT HISTORY MODAL ════════════════ */}
      <AnimatePresence>
        {historyModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[400] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="bg-slate-900 px-7 py-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center"><History size={16} className="text-amber-400" /></div>
                  <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Movement History</p>
                    <h3 className="text-sm font-black text-white uppercase italic truncate max-w-[260px]">{historyModal.name}</h3>
                  </div>
                </div>
                <button onClick={() => { setHistoryModal(null); setMovements([]); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white/60 hover:text-white transition-colors"><X size={15} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {movements.length === 0 ? (
                  <div className="text-center py-16">
                    <History size={40} className="text-slate-100 mx-auto mb-3" strokeWidth={1} />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] italic text-slate-300">No movements recorded yet</p>
                  </div>
                ) : movements.map((m, i) => (
                  <motion.div key={m.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                    className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${m.movement_type === 'add' ? 'bg-emerald-100 text-emerald-600' : m.movement_type === 'remove' ? 'bg-rose-100 text-rose-600' : m.movement_type === 'sale' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                      {m.movement_type === 'add' ? <Plus size={14} strokeWidth={2.5} /> : m.movement_type === 'remove' ? <Minus size={14} strokeWidth={2.5} /> : m.movement_type === 'return' ? <RotateCcw size={14} /> : <ArrowUpDown size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <MovBadge type={m.movement_type} />
                      </div>
                      <div className="flex items-center gap-3 text-[9px] font-black italic">
                        <span className="text-slate-400">Before: <span className="text-slate-700">{m.previous_qty}</span></span>
                        <ArrowRight size={8} className="text-slate-300" />
                        <span className="text-slate-400">After: <span className={`font-black ${m.new_qty > m.previous_qty ? 'text-emerald-600' : 'text-rose-600'}`}>{m.new_qty}</span></span>
                      </div>
                      {m.notes && <p className="text-[8px] text-slate-400 italic mt-1 truncate">📝 {m.notes}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[8px] text-slate-400 font-black italic whitespace-nowrap">
                        {new Date(m.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                      <p className="text-[7px] text-slate-300 font-black italic">
                        {new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════════ ALERTS PANEL ════════════════ */}
      <AnimatePresence>
        {alertsPanel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[350]" onClick={() => setAlertsPanel(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-[360] shadow-2xl flex flex-col">
              <div className="bg-slate-900 px-6 py-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-xl flex items-center justify-center"><Bell size={15} className="text-amber-400" /></div>
                  <div>
                    <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest italic">Stock Alerts</p>
                    <p className="text-sm font-black text-white uppercase italic">{alerts.length} Issues</p>
                  </div>
                </div>
                <button onClick={() => setAlertsPanel(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white/60 hover:text-white transition-colors"><X size={14} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {alerts.map((a, i) => (
                  <motion.div key={a.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    className={`rounded-2xl p-4 border ${a.alert_type === 'out_of_stock' ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      {a.alert_type === 'out_of_stock' ? <X size={13} className="text-rose-500 shrink-0" /> : <AlertTriangle size={13} className="text-amber-500 shrink-0" />}
                      <div className="min-w-0">
                        <p className={`text-[9px] font-black uppercase italic truncate ${a.alert_type === 'out_of_stock' ? 'text-rose-700' : 'text-amber-700'}`}>{a.product_name}</p>
                        <p className={`text-[8px] font-black uppercase tracking-widest italic ${a.alert_type === 'out_of_stock' ? 'text-rose-500' : 'text-amber-600'}`}>
                          {a.alert_type === 'out_of_stock' ? 'Out of Stock' : `Low — ${a.current_qty} units left`}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => {
                      const prod = products.find(p => p.id === a.product_id);
                      if (prod) { setStockModal(prod); setStockForm({ action: 'add', quantity: '', notes: '' }); setStockMsg({ type: '', text: '' }); setAlertsPanel(false); }
                    }}
                      className={`w-full py-2 rounded-xl text-[8px] font-black uppercase tracking-widest italic transition-all ${a.alert_type === 'out_of_stock' ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-amber-500 text-slate-900 hover:bg-amber-400'}`}>
                      Restock Now
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ════════════════ TOAST ════════════════ */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-8 right-8 z-[600] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest italic ${toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-slate-900 text-white'}`}>
            {toast.type === 'error' ? <AlertCircle size={14} /> : <Check size={14} className="text-amber-400" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Inventory;

