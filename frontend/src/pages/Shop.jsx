import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp, Loader2, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck,
  Zap, Coins, RefreshCw, X, Copy, Package, ShoppingCart, Plus, Minus,
  Clock, CheckCircle, XCircle, ClipboardList, Trash2, Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';

const SITE_URL = API_BASE_URL.replace('/api', ''); // https://vamananenterprisesv.com
const imgUrl = (path) => path ? `${SITE_URL}/${path}` : null;
import Sidebar from '../components/Sidebar';
import CustomerHeader from '../components/CustomerHeader';

/* ─── status badge helper ─── */
const StatusBadge = ({ status }) => {
  const map = {
    pending:  { bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-200',  icon: <Clock size={10} />,        label: 'Pending'  },
    active:   { bg: 'bg-emerald-50',text: 'text-emerald-600',border: 'border-emerald-200',icon: <CheckCircle size={10} />,  label: 'Active'   },
    rejected: { bg: 'bg-rose-50',   text: 'text-rose-600',   border: 'border-rose-200',   icon: <XCircle size={10} />,      label: 'Rejected' },
    completed:{ bg: 'bg-slate-50',  text: 'text-slate-400',  border: 'border-slate-200',  icon: <CheckCircle2 size={10} />, label: 'Completed'},
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest italic border ${s.bg} ${s.text} ${s.border}`}>
      {s.icon} {s.label}
    </span>
  );
};

const Shop = () => {
  /* ── page state ── */
  const [loading, setLoading]               = useState(true);
  const [buying, setBuying]                 = useState(false);
  const [refreshing, setRefreshing]         = useState(false);
  const [status, setStatus]                 = useState({ type: '', message: '' });
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm]       = useState({ transaction_id: '', screenshot: null, phone: '' });

  /* ── settings ── */
  const [goldPrice, setGoldPrice]           = useState(7250);
  const [silverPrice, setSilverPrice]       = useState(100);
  const [gstPercent, setGstPercent]         = useState(3);
  const [supportPhone, setSupportPhone]     = useState('919876543210');
  const [paymentGateway, setPaymentGateway] = useState({ upiId:'', companyName:'', bankName:'', bankAccountName:'', bankAccountNo:'', bankIfsc:'', bankBranch:'' });
  const [paymentMode, setPaymentMode]       = useState('bank');
  const [copiedField, setCopiedField]       = useState('');
  const [minInvestment, setMinInvestment]   = useState(1000);
  const [dailyRate, setDailyRate]           = useState(1);

  /* ── gold/silver ── */
  const [weight, setWeight]     = useState(1);
  const [assetType, setAssetType] = useState('gold');
  const [activeTab, setActiveTab] = useState('gold');

  /* ── products ── */
  const [products, setProducts]               = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productQtys, setProductQtys]         = useState({});   // {id: qty}

  /* ── cart ── */
  const [cart, setCart]       = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState('single'); // 'single'|'cart'
  const [selectedProduct, setSelectedProduct] = useState(null);

  /* ── orders (live tracking) ── */
  const [orders, setOrders]               = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const ordersPollRef = useRef(null);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}') || {};

  /* ──────────── computed ──────────── */
  const currentPrice = assetType === 'gold' ? goldPrice : assetType === 'silver' ? silverPrice : (selectedProduct ? parseFloat(selectedProduct.price) : 0);
  const baseAmount   = weight * currentPrice;
  const gstAmount    = baseAmount * (gstPercent / 100);
  const totalAmount  = baseAmount + gstAmount;

  const cartPreGST  = cart.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
  const cartGST     = cartPreGST * (gstPercent / 100);
  const cartTotal   = cartPreGST + cartGST;
  const cartCount   = cart.reduce((s, i) => s + i.quantity, 0);
  const cartDailyPayout = cartPreGST * (dailyRate / 100);

  const effectiveAmount = checkoutMode === 'cart' ? cartTotal : totalAmount;
  const paymentCompanyName = paymentGateway.companyName || 'Vamanan Enterprises';
  const upiPaymentData = `upi://pay?pa=${encodeURIComponent(paymentGateway.upiId)}&pn=${encodeURIComponent(paymentCompanyName)}&am=${effectiveAmount.toFixed(2)}&cu=INR`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiPaymentData)}`;

  /* ──────────── lifecycle ──────────── */
  useEffect(() => {
    fetchSettings();
    const iv = setInterval(() => fetchSettings(true), 60000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
      fetchOrders();
      ordersPollRef.current = setInterval(fetchOrders, 30000);
    } else {
      clearInterval(ordersPollRef.current);
    }
    return () => clearInterval(ordersPollRef.current);
  }, [activeTab]);

  useEffect(() => {
    if (!showPaymentModal) return;
    fetchSettings(true);
    const iv = setInterval(() => fetchSettings(true), 10000);
    return () => clearInterval(iv);
  }, [showPaymentModal]);

  /* ──────────── API helpers ──────────── */
  const fetchSettings = async (isSilent = false) => {
    if (isSilent) setRefreshing(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/settings.php`);
      if (res.data.status === 'success') {
        const d = res.data.data || {};
        if (d.gold_base_price)       setGoldPrice(parseFloat(d.gold_base_price));
        if (d.silver_base_price)     setSilverPrice(parseFloat(d.silver_base_price));
        if (d.gst_percentage)        setGstPercent(parseFloat(d.gst_percentage));
        if (d.support_phone)         setSupportPhone(d.support_phone.replace(/\+|\s/g, ''));
        if (d.min_investment)        setMinInvestment(parseFloat(d.min_investment));
        if (d.daily_cashback_rate)   setDailyRate(parseFloat(d.daily_cashback_rate));
        setPaymentGateway({
          upiId: d.upi_id || '', companyName: d.company_name || '',
          bankName: d.bank_name || '', bankAccountName: d.bank_account_name || '',
          bankAccountNo: d.bank_account_no || '', bankIfsc: d.bank_ifsc || '',
          bankBranch: d.bank_branch || '',
        });
      }
    } catch (err) { console.error('Settings fetch failed'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/products.php`);
      if (res.data.status === 'success') {
        const active = (res.data.data || []).filter(p => p.is_active == 1);
        setProducts(active);
        const initQtys = {};
        active.forEach(p => { initQtys[p.id] = 1; });
        setProductQtys(prev => ({ ...initQtys, ...prev }));
      }
    } catch { console.error('Products fetch failed'); }
    finally { setProductsLoading(false); }
  };

  const fetchOrders = async () => {
    if (!user.id) return;
    setOrdersLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/customer/dashboard.php?user_id=${user.id}`);
      if (res.data.status === 'success') {
        setOrders(res.data.data?.cycles || []);
      }
    } catch { /* silent */ }
    finally { setOrdersLoading(false); }
  };

  /* ──────────── cart ops ──────────── */
  const addToCart = (product) => {
    const qty = productQtys[product.id] || 1;
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + qty } : i);
      return [...prev, { ...product, quantity: qty }];
    });
    setShowCart(true);
  };

  const removeFromCart = (productId) => setCart(prev => prev.filter(i => i.id !== productId));

  const updateCartItemQty = (productId, qty) => {
    if (qty <= 0) return removeFromCart(productId);
    setCart(prev => prev.map(i => i.id === productId ? { ...i, quantity: qty } : i));
  };

  const setQty = (productId, qty) => setProductQtys(prev => ({ ...prev, [productId]: Math.max(1, qty) }));

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  /* ──────────── checkout ──────────── */
  const handleSingleBuy = (product) => {
    if (!user.id) { navigate('/login'); return; }
    setSelectedProduct(product);
    setAssetType('product');
    setWeight(1);
    setCheckoutMode('single');
    setShowPaymentModal(true);
  };

  const handleCartCheckout = () => {
    if (!user.id) { navigate('/login'); return; }
    if (cart.length === 0) return;
    setCheckoutMode('cart');
    setShowPaymentModal(true);
  };

  const handleGoldSilverBuy = () => {
    if (!user.id) { navigate('/login'); return; }
    if (totalAmount < minInvestment) {
      setStatus({ type: 'error', message: `Minimum investment ₹${minInvestment.toLocaleString()}. Please increase weight.` });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setCheckoutMode('single');
    setShowPaymentModal(true);
  };

  /* ──────────── submit ──────────── */
  const handleFinalSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!paymentForm.transaction_id || !paymentForm.screenshot) {
      alert('Please provide Transaction ID and Payment Screenshot.');
      return;
    }
    setBuying(true);
    setStatus({ type: '', message: '' });
    try {
      const fd = new FormData();
      fd.append('user_id', user.id);
      fd.append('phone', paymentForm.phone || user.phone || '');
      fd.append('payment_mode', paymentMode);
      fd.append('transaction_id', paymentForm.transaction_id);
      fd.append('screenshot', paymentForm.screenshot);

      if (checkoutMode === 'cart') {
        fd.append('asset_type', 'product');
        fd.append('weight', '1');
        fd.append('items', JSON.stringify(cart.map(i => ({ product_id: i.id, quantity: i.quantity }))));
      } else if (assetType === 'product' && selectedProduct) {
        fd.append('asset_type', 'product');
        fd.append('weight', '1');
        fd.append('product_id', selectedProduct.id);
      } else {
        fd.append('asset_type', assetType);
        fd.append('weight', weight);
      }

      const res = await axios.post(`${API_BASE_URL}/shop/purchase.php`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });

      if (res.data.status === 'success') {
        const itemLabel = checkoutMode === 'cart'
          ? `Cart (${cartCount} items)`
          : assetType === 'product' ? selectedProduct?.name : `${weight}g ${assetType.toUpperCase()}`;

        const msg = encodeURIComponent(
          `🛒 *New Purchase Request!*\n\n👤 *Customer:* ${user.name}\n📞 *Phone:* ${user.phone || 'N/A'}\n💰 *Asset:* ${itemLabel}\n💵 *Amount:* ₹${effectiveAmount.toLocaleString()}\n🆔 *UTR:* ${paymentForm.transaction_id}\n\n_Please verify screenshot in admin panel._`
        );
        const waLink = `https://wa.me/${supportPhone}?text=${msg}`;
        setStatus({ type: 'success', message: res.data.message + ' Redirecting to WhatsApp...' });
        setShowPaymentModal(false);
        if (checkoutMode === 'cart') setCart([]);
        setPaymentForm({ transaction_id: '', screenshot: null, phone: '' });
        setTimeout(() => { window.open(waLink, '_blank'); navigate('/dashboard'); }, 3000);
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Transaction failed. Try again.' });
    } finally { setBuying(false); }
  };

  /* ──────────── loading screen ──────────── */
  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center text-amber-600">
      <div className="flex flex-col items-center gap-6">
        <Loader2 className="animate-spin" size={60} strokeWidth={3} />
        <p className="text-[10px] font-black animate-pulse uppercase tracking-[0.4em] italic">Accessing Market Ticker...</p>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════ RENDER ══════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-slate-50 flex font-inter text-slate-900 overflow-x-hidden selection:bg-amber-100 selection:text-amber-900">
      <Sidebar showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className="ml-0 lg:ml-72 min-h-screen relative w-full">
        <CustomerHeader setShowMobileMenu={setShowMobileMenu} activeTab="Gold Market" />

        <main className="p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 w-full max-w-[1500px] space-y-8 md:space-y-10 pb-32 lg:pb-16">

          {/* ── Page Header ── */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Institutional Ticker</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Asset Acquisition</h1>
              <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2 italic">Establish long-term reserves with daily rewards</p>
            </div>
            <div className="flex items-center gap-3">
              {activeTab === 'products' && cartCount > 0 && (
                <button onClick={() => setShowCart(true)}
                  className="relative bg-slate-900 text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-amber-600 transition-all">
                  <ShoppingCart size={14} /> Cart
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full text-[9px] font-black flex items-center justify-center text-white">{cartCount}</span>
                </button>
              )}
              <button onClick={() => fetchSettings(true)}
                className="bg-white border border-slate-200 px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:border-amber-500 hover:text-amber-600 transition-all shadow-sm flex items-center gap-2">
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
          </motion.div>

          {/* ── Tabs ── */}
          <div className="flex gap-3">
            {[
              { key: 'gold',     label: 'Gold 22K',    icon: <Zap size={16} />,      active: 'bg-slate-900 text-amber-500 border-slate-900 shadow-xl', inactive: 'hover:border-amber-200' },
              { key: 'silver',   label: 'Silver Pure', icon: <Coins size={16} />,    active: 'bg-slate-900 text-slate-200 border-slate-900 shadow-xl', inactive: 'hover:border-slate-300' },
              { key: 'products', label: 'Products',    icon: <Package size={16} />,  active: 'bg-slate-900 text-emerald-400 border-slate-900 shadow-xl', inactive: 'hover:border-emerald-200' },
            ].map(tab => (
              <button key={tab.key}
                onClick={() => { setActiveTab(tab.key); if (tab.key !== 'products') { setAssetType(tab.key); setSelectedProduct(null); } }}
                className={`relative flex-1 py-4 md:py-5 rounded-2xl md:rounded-[2rem] font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] italic transition-all flex items-center justify-center gap-2 border-2 ${activeTab === tab.key ? tab.active : `bg-white text-slate-400 border-slate-100 ${tab.inactive}`}`}>
                {tab.icon} {tab.label}
                {tab.key === 'products' && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 rounded-full text-[8px] font-black flex items-center justify-center text-white">{cartCount}</span>
                )}
              </button>
            ))}
          </div>

          {/* ══════════ GOLD / SILVER PANEL ══════════ */}
          {activeTab !== 'products' && (
            <>
              <motion.div key={assetType} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-white border border-slate-200/60 p-6 md:p-14 rounded-[2rem] md:rounded-[3.5rem] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1 h-full ${assetType === 'gold' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                <div>
                  <p className="text-[9px] md:text-[10px] text-slate-400 mb-2 font-black uppercase tracking-[0.2em] italic">Current {assetType === 'gold' ? 'Gold' : 'Silver'} Price</p>
                  <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter italic">₹{currentPrice.toLocaleString()} <span className="text-sm md:text-lg text-slate-400">/ gram</span></h2>
                  <div className="flex flex-wrap items-center gap-4 mt-4 md:mt-6">
                    <div className="bg-emerald-50 text-emerald-600 px-4 md:px-6 py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-100 italic flex items-center gap-2">
                      <TrendingUp size={14} strokeWidth={3} /> {assetType === 'gold' ? '+2.3%' : '+1.8%'} Marginal
                    </div>
                    <p className="text-[8px] md:text-[9px] text-slate-300 font-black uppercase tracking-widest italic">Live Market Node</p>
                  </div>
                </div>
                <div className={`w-20 h-20 md:w-32 md:h-32 bg-slate-50 rounded-2xl md:rounded-[2rem] flex items-center justify-center border border-slate-100 shadow-inner group-hover:bg-slate-900 transition-all duration-500 ${assetType === 'gold' ? 'text-amber-500 group-hover:text-amber-500' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {assetType === 'gold' ? <Zap size={40} strokeWidth={1} /> : <Coins size={40} strokeWidth={1} />}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-white border border-slate-200/60 rounded-[2rem] md:rounded-[3.5rem] overflow-hidden shadow-2xl">
                <div className="p-8 md:p-16">
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-6 md:pb-8 mb-8 md:mb-12">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-amber-500 shadow-lg"><Zap size={20} /></div>
                    <h3 className="text-[9px] md:text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] italic">Capital Allocation Matrix</h3>
                  </div>
                  <div className="mb-8 md:mb-12">
                    <label className="block text-[9px] md:text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest italic ml-1">Asset Mass (Grams)</label>
                    <div className="relative group">
                      <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl md:rounded-[2rem] px-8 md:px-10 py-6 md:py-8 text-slate-900 focus:border-amber-500 focus:bg-white outline-none text-2xl md:text-3xl font-black transition-all shadow-inner italic"
                        value={weight} onChange={(e) => setWeight(Math.max(1, parseInt(e.target.value) || 1))} min="1" />
                      <div className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] italic hidden sm:block">Precision Input Node</div>
                    </div>
                  </div>
                  <div className="space-y-6 md:space-y-8 pt-8 border-t border-slate-50 mb-8">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Base Valuation</span>
                      <span className="text-lg md:text-xl font-black text-slate-900 italic">₹{baseAmount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Fiscal Levy ({gstPercent}%)</span>
                      <span className="text-lg md:text-xl font-black text-slate-900 italic">₹{gstAmount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                      <div>
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.3em] italic">Daily Payout ({dailyRate}%)</span>
                      </div>
                      <span className="text-lg font-black text-emerald-700 italic">₹{(baseAmount*(dailyRate/100)).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-6 border-t border-slate-100 gap-4">
                      <span className="text-base md:text-lg font-black text-slate-900 uppercase tracking-[0.3em] italic">Total Amount</span>
                      <span className="text-3xl md:text-5xl font-black text-amber-600 italic tracking-tighter">₹{totalAmount.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                    </div>
                  </div>
                  <button onClick={handleGoldSilverBuy} disabled={buying}
                    className="w-full bg-slate-900 text-white py-6 md:py-8 rounded-2xl md:rounded-[2rem] font-black text-[9px] md:text-[10px] uppercase tracking-[0.3em] hover:bg-amber-600 transition-all shadow-2xl active:scale-95 italic group flex items-center justify-center gap-3">
                    {buying ? <Loader2 className="animate-spin" size={20} /> : <><span>Initialize {assetType === 'gold' ? 'Gold' : 'Silver'} Transfer</span> <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" /></>}
                  </button>
                  <div className="mt-8 flex items-start gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <ShieldCheck className="text-amber-500 shrink-0 mt-1" size={20} strokeWidth={2.5} />
                    <p className="text-[8px] text-slate-400 font-bold leading-relaxed uppercase tracking-wider italic">
                      Purchases cross-validated against global {assetType === 'gold' ? '22K' : 'Pure Silver'} spot price. Daily rewards activate at 00:00 UTC.
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          )}

          {/* ══════════ PRODUCTS PANEL ══════════ */}
          {activeTab === 'products' && (
            <motion.div key="products-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">

              {/* Product Grid */}
              {productsLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-6">
                  <Loader2 className="animate-spin text-amber-500" size={40} strokeWidth={2} />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] italic text-slate-400">Loading Product Catalog...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-[2rem] border border-slate-100">
                  <Package size={56} className="text-slate-200" strokeWidth={1} />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] italic text-slate-300">No Products Available</p>
                  <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest italic">Admin has not listed any products yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
                  {products.map((product, idx) => {
                    const inCart = cart.find(i => i.id === product.id);
                    const qty = productQtys[product.id] || 1;
                    const productTotal = parseFloat(product.price) * qty;
                    const productGST = productTotal * (gstPercent / 100);
                    const productFinal = productTotal + productGST;
                    const dailyPayout = productTotal * (dailyRate / 100);
                    return (
                      <motion.div key={product.id}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                        className={`flex flex-col bg-white rounded-[2rem] overflow-hidden border-2 shadow-sm transition-all duration-300 ${inCart ? 'border-emerald-400 shadow-emerald-100 shadow-lg' : 'border-slate-100 hover:border-slate-200 hover:shadow-md'}`}>

                        {/* Image */}
                        <div className="relative h-52 bg-slate-50 overflow-hidden shrink-0">
                          {product.image ? (
                            <img src={imgUrl(product.image)} alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={56} className="text-slate-200" strokeWidth={1} />
                            </div>
                          )}
                          {inCart && (
                            <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest italic px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                              <CheckCircle2 size={10} strokeWidth={3} /> In Cart
                            </div>
                          )}
                          {product.purity && (
                            <div className="absolute top-3 left-3 bg-amber-500 text-slate-900 text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow">
                              {product.purity}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex flex-col flex-1 p-5 gap-4">
                          {/* Name + badges */}
                          <div>
                            <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-tight leading-tight mb-2">{product.name}</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {product.category && (
                                <span className="bg-slate-50 text-slate-400 text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-slate-100">{product.category}</span>
                              )}
                              {parseFloat(product.weight) > 0 && (
                                <span className="bg-slate-50 text-slate-400 text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-slate-100">{product.weight}g</span>
                              )}
                            </div>
                          </div>

                          {/* Description */}
                          {product.description && (
                            <p className="text-[9px] text-slate-400 font-semibold leading-relaxed line-clamp-2 italic uppercase tracking-wide">{product.description}</p>
                          )}

                          {/* Price + daily payout */}
                          <div className="bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100">
                            <div className="flex justify-between items-center">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Unit Price</span>
                              <span className="text-base font-black text-slate-900 italic tracking-tighter">₹{parseFloat(product.price).toLocaleString()}</span>
                            </div>
                            {qty > 1 && (
                              <div className="flex justify-between items-center">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Total ({qty} pcs)</span>
                                <span className="text-sm font-black text-slate-700 italic">₹{productFinal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest italic">Daily Payout</span>
                              <span className="text-[11px] font-black text-emerald-600 italic">+₹{(dailyPayout).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}/day</span>
                            </div>
                          </div>

                          {/* Quantity control */}
                          <div className="flex items-center gap-3">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic shrink-0">Qty</span>
                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex-1">
                              <button onClick={() => setQty(product.id, qty - 1)}
                                className="px-3 py-2.5 hover:bg-slate-200 transition-colors text-slate-500 hover:text-slate-900">
                                <Minus size={12} strokeWidth={3} />
                              </button>
                              <span className="flex-1 text-center text-sm font-black text-slate-900 italic">{qty}</span>
                              <button onClick={() => setQty(product.id, qty + 1)}
                                className="px-3 py-2.5 hover:bg-slate-200 transition-colors text-slate-500 hover:text-slate-900">
                                <Plus size={12} strokeWidth={3} />
                              </button>
                            </div>
                          </div>

                          {/* Action buttons — pushed to bottom */}
                          <div className="flex gap-2 mt-auto pt-2">
                            <button onClick={() => addToCart(product)}
                              className={`flex-1 py-3 rounded-xl font-black text-[8px] uppercase tracking-widest italic transition-all active:scale-95 flex items-center justify-center gap-1.5 border-2 ${inCart ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-900 hover:text-slate-900'}`}>
                              <ShoppingCart size={11} />
                              {inCart ? 'Add More' : 'Add to Cart'}
                            </button>
                            <button onClick={() => handleSingleBuy(product)}
                              className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black text-[8px] uppercase tracking-widest italic hover:bg-amber-600 transition-all active:scale-95 flex items-center justify-center gap-1.5">
                              Buy Now <ArrowRight size={11} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Cart Summary Bar (if cart has items) */}
              {cart.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900 text-white rounded-[2rem] p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                      <ShoppingCart size={22} className="text-amber-400" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.3em] italic text-slate-400">{cartCount} item{cartCount > 1 ? 's' : ''} in cart</p>
                      <p className="text-xl font-black italic tracking-tighter">₹{cartTotal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</p>
                      <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest italic">+₹{cartDailyPayout.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}/day rewards</p>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={() => setShowCart(true)}
                      className="flex-1 sm:flex-none px-5 py-3 bg-white/10 border border-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest italic hover:bg-white/20 transition-all flex items-center gap-2 justify-center">
                      <ShoppingCart size={13} /> View Cart
                    </button>
                    <button onClick={handleCartCheckout}
                      className="flex-1 sm:flex-none px-6 py-3 bg-amber-500 text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest italic hover:bg-amber-400 transition-all active:scale-95 flex items-center gap-2 justify-center shadow-lg">
                      Checkout <ArrowRight size={13} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── My Orders (Live Tracking) ── */}
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-amber-500 shadow-lg shrink-0"><ClipboardList size={18} /></div>
                  <div>
                    <h3 className="text-[10px] md:text-xs font-black text-slate-900 uppercase tracking-[0.3em] italic">My Orders</h3>
                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest italic">Live investment tracking — updates every 30s</p>
                  </div>
                  {ordersLoading && <Loader2 size={14} className="animate-spin text-slate-300 ml-auto" />}
                </div>

                {orders.length === 0 ? (
                  <div className="bg-white rounded-[2rem] border border-slate-100 p-12 flex flex-col items-center gap-4 text-center">
                    <ClipboardList size={48} className="text-slate-100" strokeWidth={1} />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] italic text-slate-300">No Orders Yet</p>
                    <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest italic">Your purchase history will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const assetType = order.asset_type || 'gold';
                      const assetLabel = assetType === 'product'
                        ? (order.product_name || 'Product Order')
                        : assetType === 'silver'
                          ? `${parseFloat(order.weight || 0)}g Silver`
                          : `${parseFloat(order.weight || 0)}g Gold 22K`;
                      return (
                        <motion.div key={order.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          className="bg-white rounded-[1.5rem] border border-slate-100 p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:border-slate-200 transition-all shadow-sm">

                          {/* Icon */}
                          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 shrink-0 flex items-center justify-center">
                            {assetType === 'silver'
                              ? <Coins size={22} className="text-slate-400" strokeWidth={1.5} />
                              : assetType === 'product'
                                ? <Package size={22} className="text-emerald-500" strokeWidth={1.5} />
                                : <Zap size={22} className="text-amber-500" strokeWidth={1.5} />
                            }
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <p className="text-xs font-black text-slate-900 uppercase italic truncate">{assetLabel}</p>
                              <StatusBadge status={order.status} />
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest italic">
                                <span className="text-slate-600">₹{parseFloat(order.total_value||0).toLocaleString()}</span> invested
                              </p>
                              {order.daily_payout > 0 && (
                                <p className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest italic">
                                  +₹{parseFloat(order.daily_payout).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}/day
                                </p>
                              )}
                              {order.payment_method && (
                                <p className="text-[8px] text-slate-300 font-bold uppercase tracking-widest italic">{order.payment_method}</p>
                              )}
                            </div>
                          </div>

                          {/* Date + UTR */}
                          <div className="text-right shrink-0">
                            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest italic">
                              {new Date(order.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                            </p>
                            {order.transaction_id && (
                              <p className="text-[7px] text-slate-300 font-black uppercase tracking-widest italic mt-0.5 truncate max-w-[100px]">UTR: {order.transaction_id}</p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

            </motion.div>
          )}

        </main>
      </div>

      {/* ══════════ CART DRAWER ══════════ */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div key="cart-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250]" onClick={() => setShowCart(false)} />
            <motion.div key="cart-drawer"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[260] shadow-2xl flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-amber-500"><ShoppingCart size={18} /></div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase italic tracking-tighter">Your Cart</h2>
                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest italic">{cartCount} item{cartCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <button onClick={() => setShowCart(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900"><X size={18} /></button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-20">
                    <ShoppingCart size={48} className="text-slate-100" strokeWidth={1} />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] italic text-slate-300">Cart is Empty</p>
                  </div>
                ) : cart.map(item => {
                  const itemTotal = parseFloat(item.price) * item.quantity;
                  return (
                    <div key={item.id} className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3 border border-slate-100">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-slate-100 shrink-0">
                        {item.image ? <img src={imgUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Package size={18} className="text-slate-200" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-900 uppercase italic truncate">{item.name}</p>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest italic">₹{parseFloat(item.price).toLocaleString()} ea.</p>
                        {item.purity && <p className="text-[7px] text-amber-500 font-black uppercase tracking-widest">{item.purity}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <p className="text-sm font-black text-slate-900 italic">₹{itemTotal.toLocaleString()}</p>
                        <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden">
                          <button onClick={() => updateCartItemQty(item.id, item.quantity - 1)} className="px-2 py-1 hover:bg-slate-100 transition-colors"><Minus size={10} strokeWidth={3} /></button>
                          <span className="px-2 text-xs font-black text-slate-900">{item.quantity}</span>
                          <button onClick={() => updateCartItemQty(item.id, item.quantity + 1)} className="px-2 py-1 hover:bg-slate-100 transition-colors"><Plus size={10} strokeWidth={3} /></button>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all ml-1"><Trash2 size={13} /></button>
                    </div>
                  );
                })}
              </div>

              {/* Footer summary */}
              {cart.length > 0 && (
                <div className="border-t border-slate-100 p-5 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
                      <span>Subtotal</span><span>₹{cartPreGST.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
                      <span>GST ({gstPercent}%)</span><span>₹{cartGST.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-slate-900 uppercase italic tracking-tighter border-t border-slate-100 pt-2">
                      <span>Total</span><span className="text-amber-600">₹{cartTotal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-black text-emerald-500 uppercase tracking-widest italic">
                      <span>Daily Rewards</span><span>+₹{cartDailyPayout.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}/day</span>
                    </div>
                  </div>
                  <button onClick={() => { setShowCart(false); handleCartCheckout(); }}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] italic hover:bg-amber-600 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-xl">
                    Checkout <ArrowRight size={16} />
                  </button>
                  <button onClick={() => setCart([])}
                    className="w-full py-3 border border-rose-200 text-rose-500 rounded-2xl font-black text-[8px] uppercase tracking-widest italic hover:bg-rose-50 transition-all flex items-center justify-center gap-2">
                    <Trash2 size={12} /> Clear Cart
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════ PAYMENT MODAL ══════════ */}
      <AnimatePresence>
        {showPaymentModal && (
          <div key="payment-overlay" className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[300] flex items-center justify-center md:p-6 overflow-y-auto">
            <motion.div key="payment-modal-content"
              initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
              className="bg-white w-full max-w-5xl md:rounded-[4rem] overflow-hidden shadow-2xl flex flex-col md:flex-row relative h-full md:h-auto md:max-h-[90vh] rounded-t-[3rem] md:rounded-b-[4rem]">
              <button onClick={() => setShowPaymentModal(false)}
                className="absolute top-6 right-6 md:top-8 md:right-8 z-50 p-2 md:p-3 bg-slate-100/10 hover:bg-slate-100 rounded-2xl text-white md:text-slate-400 hover:text-slate-900 transition-colors backdrop-blur-md">
                <X size={20} />
              </button>

              {/* Left: Payment details */}
              <div className="w-full md:w-1/2 bg-slate-900 p-8 sm:p-12 md:p-16 lg:p-20 flex flex-col items-center justify-center text-center relative overflow-hidden shrink-0">
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <div className="relative z-10 w-full max-w-[280px] mt-4 md:mt-0">
                  <div className="mb-4 flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-widest text-slate-500 italic">
                    <RefreshCw size={12} className={refreshing ? 'animate-spin text-amber-500' : 'text-slate-600'} /> Live Admin Gateway
                  </div>
                  <div className="flex bg-white/5 border border-white/10 p-1 rounded-2xl mb-8">
                    <button onClick={() => setPaymentMode('bank')}
                      className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider italic rounded-xl transition-all ${paymentMode === 'bank' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>Bank Transfer</button>
                    <button onClick={() => setPaymentMode('upi')}
                      className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider italic rounded-xl transition-all ${paymentMode === 'upi' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>UPI Scan</button>
                  </div>

                  {paymentMode === 'upi' ? (
                    <div className="flex flex-col items-center">
                      <div className="bg-white p-3 md:p-6 rounded-[2.5rem] shadow-[0_0_50px_rgba(245,158,11,0.2)] mb-6 hover:scale-105 transition-transform duration-500">
                        {paymentGateway.upiId ? (
                          <img src={qrCodeUrl} alt="QR Code" className="w-full object-contain rounded-xl" />
                        ) : (
                          <div className="w-[220px] h-[220px] flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-slate-400">UPI ID not configured</div>
                        )}
                      </div>
                      <h3 className="text-amber-500 text-2xl md:text-3xl font-black italic tracking-tighter uppercase mb-1">Scan & Pay</h3>
                      <p className="text-white text-[10px] font-black uppercase tracking-widest italic mb-2 break-all">{paymentGateway.upiId || 'Admin UPI Pending'}</p>
                      <p className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] italic">Amount: ₹{effectiveAmount.toLocaleString()}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-full bg-white p-5 md:p-7 rounded-[2rem] shadow-[0_0_50px_rgba(245,158,11,0.2)] mb-6 text-left space-y-3 hover:scale-105 transition-transform duration-500">
                        {[
                          { label: 'Beneficiary', val: paymentGateway.bankAccountName || 'Vamanan Enterprises V' },
                          { label: 'Bank', val: paymentGateway.bankName || 'Canara Bank' },
                        ].map(row => (
                          <div key={row.label}>
                            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest italic mb-0.5">{row.label}</p>
                            <p className="text-xs text-slate-900 font-extrabold uppercase">{row.val}</p>
                            <div className="h-px bg-slate-100 mt-2" />
                          </div>
                        ))}
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest italic mb-0.5">Account No.</p>
                            <p className="text-sm text-slate-900 font-black tracking-wider break-all">{paymentGateway.bankAccountNo || '638492017451'}</p>
                          </div>
                          <button onClick={() => handleCopy(paymentGateway.bankAccountNo || '638492017451', 'account')}
                            className="p-2 bg-slate-50 hover:bg-amber-500 hover:text-slate-900 rounded-xl transition-all text-slate-500 border border-slate-100 active:scale-95">
                            {copiedField === 'account' ? <span className="text-[8px] font-black uppercase italic px-1 text-emerald-600">Copied</span> : <Copy size={12} />}
                          </button>
                        </div>
                        <div className="h-px bg-slate-100" />
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest italic mb-0.5">IFSC</p>
                            <p className="text-sm text-amber-600 font-black tracking-wider">{paymentGateway.bankIfsc || 'CNRB0002987'}</p>
                          </div>
                          <button onClick={() => handleCopy(paymentGateway.bankIfsc || 'CNRB0002987', 'ifsc')}
                            className="p-2 bg-slate-50 hover:bg-amber-500 hover:text-slate-900 rounded-xl transition-all text-slate-500 border border-slate-100 active:scale-95">
                            {copiedField === 'ifsc' ? <span className="text-[8px] font-black uppercase italic px-1 text-emerald-600">Copied</span> : <Copy size={12} />}
                          </button>
                        </div>
                        {paymentGateway.bankBranch && (
                          <><div className="h-px bg-slate-100" />
                          <div>
                            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest italic mb-0.5">Branch</p>
                            <p className="text-xs text-slate-900 font-extrabold uppercase">{paymentGateway.bankBranch}</p>
                          </div></>
                        )}
                      </div>
                      <h3 className="text-amber-500 text-2xl md:text-3xl font-black italic tracking-tighter uppercase mb-1">Bank Transfer</h3>
                      <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] italic">Amount: ₹{effectiveAmount.toLocaleString()}</p>
                    </div>
                  )}

                  <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 text-left">
                    <ShieldCheck className="text-amber-500 shrink-0" size={20} />
                    <div>
                      <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest italic">Institutional Trust</p>
                      <p className="text-[9px] text-white font-bold uppercase tracking-tight">Secured Payment Gateway</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Form */}
              <div className="w-full md:w-1/2 p-8 md:p-16 overflow-y-auto max-h-[60vh] md:max-h-[85vh]">
                <div className="mb-8">
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-1">Submission Protocol</h2>
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest italic">
                    {checkoutMode === 'cart' ? `Cart — ${cartCount} items · ₹${cartTotal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}` : 'Verify transaction to initiate asset transfer'}
                  </p>
                </div>

                {/* Cart items preview */}
                {checkoutMode === 'cart' && cart.length > 0 && (
                  <div className="mb-6 bg-slate-50 rounded-2xl p-4 space-y-2 border border-slate-100 max-h-32 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-[9px]">
                        <span className="font-black text-slate-600 uppercase italic truncate flex-1 mr-2">{item.quantity}x {item.name}</span>
                        <span className="font-black text-slate-900 italic shrink-0">₹{(parseFloat(item.price)*item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleFinalSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Name</label>
                      <input readOnly value={user.name || ''} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-5 text-sm font-black text-slate-400 uppercase italic outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Phone</label>
                      <input type="text" required placeholder="Mobile Number"
                        value={paymentForm.phone || user.phone || ''}
                        onChange={(e) => setPaymentForm(p => ({...p, phone: e.target.value}))}
                        readOnly={!!user.phone}
                        className={`w-full ${user.phone ? 'bg-slate-50 text-slate-400' : 'bg-white text-slate-900 border-amber-200 focus:border-amber-500'} border rounded-xl py-4 px-5 text-sm font-black uppercase italic outline-none transition-all`} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Transaction ID (UTR)</label>
                    <input type="text" required placeholder="Enter UTR / Reference Number"
                      value={paymentForm.transaction_id}
                      onChange={(e) => setPaymentForm(p => ({...p, transaction_id: e.target.value}))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 px-5 text-sm font-black text-slate-900 uppercase italic outline-none focus:border-amber-500 focus:bg-white transition-all shadow-inner" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Payment Screenshot</label>
                    <div>
                      <input type="file" required accept="image/*" id="pay-proof"
                        onChange={(e) => setPaymentForm(p => ({...p, screenshot: e.target.files[0]}))} className="hidden" />
                      <label htmlFor="pay-proof"
                        className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 border-dashed rounded-xl py-4 px-5 text-xs font-black text-slate-400 cursor-pointer hover:bg-slate-100 transition-all">
                        <span className="truncate">{paymentForm.screenshot ? paymentForm.screenshot.name : 'Upload Screenshot'}</span>
                        <ShieldCheck size={16} className={paymentForm.screenshot ? 'text-emerald-500' : 'text-slate-300'} />
                      </label>
                    </div>
                  </div>

                  <button type="submit" disabled={buying}
                    className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[9px] uppercase tracking-[0.4em] italic shadow-2xl hover:bg-amber-600 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 mt-2">
                    {buying ? <Loader2 className="animate-spin" size={18} /> : <><Bell size={16} /> Confirm &amp; Notify Admin <ArrowRight size={16} /></>}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {/* Status popup */}
        {status.message && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[400] flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] max-w-xl w-full text-center shadow-[0_0_100px_rgba(0,0,0,0.3)] relative border border-slate-100 overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-2 ${status.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <div className={`w-24 h-24 rounded-[2rem] mx-auto mb-8 flex items-center justify-center shadow-2xl ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {status.type === 'success' ? <CheckCircle2 size={48} strokeWidth={1.5} /> : <AlertCircle size={48} strokeWidth={1.5} />}
              </div>
              <h3 className="text-2xl md:text-4xl font-black text-slate-900 mb-4 tracking-tighter uppercase italic">{status.type === 'success' ? 'Order Submitted!' : 'Error Detected'}</h3>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-8">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] italic leading-relaxed">{status.message}</p>
              </div>
              <button onClick={() => setStatus({ type: '', message: '' })}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-amber-600 transition-all shadow-2xl italic active:scale-[0.98]">
                Acknowledge &amp; Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Shop;
