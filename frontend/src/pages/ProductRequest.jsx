import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Phone, Hash, Loader2, AlertCircle, CheckCircle, ArrowRight,
  CreditCard, Mail, Package, FileText, Zap, ShoppingBag, Layers,
  Tag, Scale, ShieldCheck, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';
import Sidebar from '../components/Sidebar';
import CustomerHeader from '../components/CustomerHeader';

const FALLBACK_CATEGORIES = [
  'Gold', 'House Construction', 'All Construction Material',
  'Electronics', 'Vehicles (2wheeler/4wheeler)', 'Groceries'
];

const STATUS_STYLES = {
  pending:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-600 border-amber-100' },
  reviewing: { label: 'Reviewing', cls: 'bg-blue-50 text-blue-600 border-blue-100' },
  approved:  { label: 'Approved',  cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  rejected:  { label: 'Rejected',  cls: 'bg-rose-50 text-rose-600 border-rose-100' },
  fulfilled: { label: 'Fulfilled', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

// Defined at module scope so inputs don't remount (and lose focus) on each keystroke.
const Field = ({ label, name, icon: Icon, placeholder, type = 'text', required = false, value, onChange, readOnly = false }) => (
  <div className="space-y-3">
    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">
      {label}{required && <span className="text-amber-500"> *</span>}
    </label>
    <div className="relative group">
      <Icon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={18} />
      <input
        type={type}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-[1.5rem] py-4 md:py-5 pl-14 pr-8 text-sm text-slate-900 outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all font-black italic tracking-tight ${readOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
      />
    </div>
  </div>
);

const SectionCard = ({ title, icon: Icon, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white border border-slate-200/60 p-8 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm space-y-10 md:space-y-12"
  >
    <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
      <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-amber-500 shadow-lg">
        <Icon size={20} />
      </div>
      <h3 className="text-[9px] md:text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] italic">{title}</h3>
    </div>
    {children}
  </motion.div>
);

const ProductRequest = () => {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_code: '',
    customer_email: '',
    phone: '',
    product_name: '',
    model: '',
    category: 'Gold',
    quantity: 1,
    weight: '',
    description: '',
  });

  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!user.id) {
      navigate('/login');
      return;
    }
    fetchData();
    fetchCategories();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/customer/product_request.php?user_id=${user.id}`);
      if (res.data.status === 'success') {
        const u = res.data.data.user || {};
        setRequests(res.data.data.requests || []);
        setFormData(prev => ({
          ...prev,
          customer_name: u.name || '',
          customer_code: u.customer_id || (u.id ? `VEV${String(u.id).padStart(3, '0')}` : ''),
          customer_email: u.email || '',
          phone: u.phone || '',
        }));
      }
    } catch (err) {
      console.error('Product request fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/categories.php`);
      if (res.data.status === 'success' && Array.isArray(res.data.data) && res.data.data.length) {
        setCategories(res.data.data.map(c => c.name));
      }
    } catch (err) {
      // keep fallback categories
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await axios.post(`${API_BASE_URL}/customer/product_request.php`, {
        user_id: user.id,
        ...formData,
      });
      if (res.data.status === 'success') {
        setStatus({ type: 'success', message: res.data.message });
        // Reset the request-specific fields, keep identity prefilled
        setFormData(prev => ({
          ...prev,
          product_name: '', model: '', category: categories[0] || 'Gold', quantity: 1,
          weight: '', description: '',
        }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
        fetchData(); // refresh the live list
      } else {
        setStatus({ type: 'error', message: res.data.message || 'Submission failed.' });
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message: err.response?.data?.message || 'Submission failed. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center text-amber-600">
      <div className="flex flex-col items-center gap-6">
        <Loader2 className="animate-spin" size={60} strokeWidth={3} />
        <p className="text-[10px] font-black animate-pulse uppercase tracking-[0.4em] italic">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-inter text-slate-900 overflow-x-hidden selection:bg-amber-100 selection:text-amber-900">
      <Sidebar showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className="ml-0 lg:ml-72 min-h-screen relative w-full">
        <CustomerHeader setShowMobileMenu={setShowMobileMenu} activeTab="Product Request" />

        <main className="p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 w-full max-w-[1500px] space-y-8 md:space-y-12 pb-32 lg:pb-16">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
          >
            <div>
              <div className="flex items-center gap-3 mb-3 md:mb-4">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Catalogue</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Request a Product</h1>
              <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2 md:mt-3 italic">Can't find what you want? Request it and our team will add it</p>
            </div>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-8 md:space-y-12">
            <AnimatePresence>
              {status.message && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-5 md:p-6 rounded-2xl md:rounded-[2rem] flex items-center gap-4 md:gap-6 border shadow-xl ${
                    status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'
                  }`}
                >
                  {status.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest italic">{status.message}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-8 md:gap-12">

              {/* Customer Identity (real-time, read-only) */}
              <SectionCard title="Requested By" icon={User}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                  <Field label="Customer Name" name="customer_name" icon={User} placeholder="Full Name" value={formData.customer_name} onChange={handleInputChange} readOnly />
                  <Field label="Customer ID" name="customer_code" icon={CreditCard} placeholder="VEV000" value={formData.customer_code} onChange={handleInputChange} readOnly />
                  <Field label="Customer E-mail ID" name="customer_email" icon={Mail} placeholder="you@email.com" value={formData.customer_email} onChange={handleInputChange} readOnly />
                  <Field label="Phone No" name="phone" icon={Phone} placeholder="+91 00000 00000" value={formData.phone} onChange={handleInputChange} />
                </div>
              </SectionCard>

              {/* Product Details */}
              <SectionCard title="Product Details" icon={ShoppingBag} delay={0.05}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                  <Field label="Product Name" name="product_name" icon={Package} placeholder="E.g. 24K Gold Bar (10g)" required value={formData.product_name} onChange={handleInputChange} />

                  <div className="space-y-3">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Category</label>
                    <div className="relative group">
                      <Layers className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors z-10" size={18} />
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl md:rounded-[1.5rem] py-4 md:py-5 pl-14 pr-8 text-sm text-slate-900 outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all font-black italic tracking-tight"
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Field label="Product Model" name="model" icon={Package} placeholder="E.g. 22K Gold Coin" value={formData.model} onChange={handleInputChange} />

                  <Field label="Quantity" name="quantity" icon={Tag} placeholder="1" type="number" value={formData.quantity} onChange={handleInputChange} />
                  <Field label="Weight (g) — optional" name="weight" icon={Scale} placeholder="0" type="number" value={formData.weight} onChange={handleInputChange} />

                  <div className="space-y-3 md:col-span-2">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Additional Details / Specifications</label>
                    <div className="relative group">
                      <FileText className="absolute left-5 top-6 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={18} />
                      <textarea
                        name="description"
                        rows={3}
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe the product you'd like us to add (brand, purity, model, etc.)"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-[1.5rem] py-4 md:py-5 pl-14 pr-8 text-sm text-slate-900 outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all font-black italic tracking-tight resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 md:gap-6 p-6 md:p-8 bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 shadow-2xl">
                  <ShieldCheck className="text-amber-500 shrink-0 mt-1" size={22} strokeWidth={2.5} />
                  <p className="text-[8px] md:text-[9px] text-slate-400 font-bold leading-relaxed uppercase tracking-wider italic">
                    Your request is sent to our team for review. Once approved, the product will be added to the catalogue and you'll be notified.
                  </p>
                </div>
              </SectionCard>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-slate-900 text-white py-6 md:py-8 rounded-[1.5rem] md:rounded-[2rem] font-black flex items-center justify-center gap-3 md:gap-4 hover:bg-amber-600 transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 text-[9px] md:text-[10px] uppercase tracking-[0.3em] italic group"
            >
              {submitting ? <Loader2 className="animate-spin" size={22} /> : (
                <>Submit Request <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" /></>
              )}
            </button>
          </form>

          {/* Live list of this customer's previous requests */}
          <SectionCard title="Your Requests" icon={Clock} delay={0.1}>
            {requests.length === 0 ? (
              <div className="text-center py-10">
                <Package size={48} className="mx-auto text-slate-200 mb-4" strokeWidth={1.5} />
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No product requests yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((r) => {
                  const st = STATUS_STYLES[r.status] || STATUS_STYLES.pending;
                  return (
                    <div key={r.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 md:p-6 bg-slate-50 border border-slate-100 rounded-2xl md:rounded-[1.5rem]">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-11 h-11 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                          <Package size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 uppercase italic truncate">{r.product_name}</p>
                          <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest italic mt-1">
                            {r.model ? `${r.model} · ` : ''}{r.category} · Qty {r.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest italic border ${st.cls}`}>{st.label}</span>
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic hidden md:block">
                          {r.created_at ? new Date(r.created_at.replace(' ', 'T')).toLocaleDateString('en-IN') : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </main>
      </div>
    </div>
  );
};

export default ProductRequest;
