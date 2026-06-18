import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Phone, MapPin, Hash, Loader2, AlertCircle, CheckCircle, ArrowRight,
  Fingerprint, CreditCard, Building2, Zap, Mail, Package, FileText,
  Calendar, ShoppingBag, Users, ShieldCheck, Landmark
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';
import Sidebar from '../components/Sidebar';
import CustomerHeader from '../components/CustomerHeader';

const todayISO = () => new Date().toISOString().split('T')[0];

// Defined at module scope so inputs don't remount (and lose focus) on each keystroke.
const Field = ({ label, name, icon: Icon, placeholder, type = 'text', required = false, value, onChange }) => (
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
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-[1.5rem] py-4 md:py-5 pl-14 pr-8 text-sm text-slate-900 outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all font-black italic tracking-tight"
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

const CashbackApplication = () => {
  const [formData, setFormData] = useState({
    // Basic Details
    customer_name: '',
    address: '',
    phone: '',
    aadhar_no: '',
    pan_no: '',
    customer_code: '',
    customer_email: '',
    referral_id: '',
    // Purchase Details
    purchase_amount: '',
    purchased_product: '',
    product_details: '',
    purchase_date: '',
    // Payment Details
    bank_account_name: '',
    account_no: '',
    ifsc_code: '',
    bank_name: '',
    bank_branch: '',
    // Agent / Referral Details
    agent_name: '',
    agent_id: '',
    // Footer
    place: 'Krishnagiri',
    application_date: todayISO(),
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/customer/cashback_application.php?user_id=${user.id}`);
      if (res.data.status === 'success') {
        const u = res.data.data.user || {};
        // Prefill with live customer data from the database
        setFormData(prev => ({
          ...prev,
          customer_name: u.name || '',
          address: u.address || '',
          phone: u.phone || '',
          aadhar_no: u.aadhar_no || '',
          pan_no: u.pan_no || '',
          customer_code: u.customer_id || (u.id ? `VEV${String(u.id).padStart(3, '0')}` : ''),
          customer_email: u.email || '',
          referral_id: u.referral_code || '',
          bank_account_name: u.name || '',
          account_no: u.account_no || '',
          ifsc_code: u.ifsc_code || '',
          bank_name: u.bank_name || '',
          bank_branch: u.branch_name || '',
        }));
      }
    } catch (err) {
      console.error('Cashback application fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    let value = e.target.value;
    const name = e.target.name;

    if (name === 'aadhar_no') {
      const cleaned = value.replace(/\D/g, '').substring(0, 12);
      value = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    }
    if (name === 'pan_no' || name === 'ifsc_code') {
      value = value.toUpperCase();
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await axios.post(`${API_BASE_URL}/customer/cashback_application.php`, {
        user_id: user.id,
        ...formData,
      });
      if (res.data.status === 'success') {
        setStatus({ type: 'success', message: res.data.message });
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <CustomerHeader setShowMobileMenu={setShowMobileMenu} activeTab="Cashback Application" />

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
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Application</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Cashback Application</h1>
              <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2 md:mt-3 italic">Submit your purchase details to claim cashback rewards</p>
            </div>
          </motion.div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 md:p-20 rounded-[2.5rem] md:rounded-[3.5rem] border border-emerald-100 bg-white shadow-2xl shadow-emerald-500/5 flex flex-col items-center justify-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-20"></div>
              <ShieldCheck size={100} className="text-emerald-500 mb-6 md:mb-8 drop-shadow-xl" strokeWidth={1.5} />
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 tracking-tighter uppercase italic leading-tight">Application Received</h2>
              <p className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest max-w-md mx-auto mb-10 italic leading-relaxed">
                Your cashback application has been submitted and saved. Our team will verify the details shortly.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-slate-900 text-white px-10 py-5 rounded-[1.5rem] font-black flex items-center gap-3 hover:bg-amber-600 transition-all shadow-xl active:scale-95 text-[9px] md:text-[10px] uppercase tracking-[0.3em] italic"
              >
                Back to Dashboard <ArrowRight size={18} />
              </button>
            </motion.div>
          ) : (
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

                {/* Basic Details */}
                <SectionCard title="Basic Details" icon={User}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                    <Field label="Customer Name" name="customer_name" icon={User} placeholder="Full Name" required value={formData.customer_name} onChange={handleInputChange} />
                    <Field label="Address" name="address" icon={MapPin} placeholder="Full Address" value={formData.address} onChange={handleInputChange} />
                    <Field label="Phone No" name="phone" icon={Phone} placeholder="+91 00000 00000" required value={formData.phone} onChange={handleInputChange} />
                    <Field label="Aadhaar No" name="aadhar_no" icon={Fingerprint} placeholder="0000 0000 0000" value={formData.aadhar_no} onChange={handleInputChange} />
                    <Field label="PAN No" name="pan_no" icon={CreditCard} placeholder="ABCDE1234F" value={formData.pan_no} onChange={handleInputChange} />
                    <Field label="Customer ID" name="customer_code" icon={CreditCard} placeholder="VEV000" value={formData.customer_code} onChange={handleInputChange} />
                    <Field label="Customer E-mail ID" name="customer_email" icon={Mail} placeholder="you@email.com" type="email" value={formData.customer_email} onChange={handleInputChange} />
                    <Field label="Customer's Referral ID" name="referral_id" icon={Hash} placeholder="REF Code" value={formData.referral_id} onChange={handleInputChange} />
                  </div>
                </SectionCard>

                {/* Purchase Details */}
                <SectionCard title="Purchase Details" icon={ShoppingBag} delay={0.05}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                    <Field label="Total Value of Purchase (₹)" name="purchase_amount" icon={Zap} placeholder="0.00" type="number" required value={formData.purchase_amount} onChange={handleInputChange} />
                    <Field label="Purchased Product" name="purchased_product" icon={Package} placeholder="E.g. 22K Gold Coin" value={formData.purchased_product} onChange={handleInputChange} />
                    <Field label="Date of Purchase" name="purchase_date" icon={Calendar} placeholder="" type="date" value={formData.purchase_date} onChange={handleInputChange} />
                    <div className="space-y-3 md:col-span-2">
                      <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Details of Purchased Product</label>
                      <div className="relative group">
                        <FileText className="absolute left-5 top-6 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={18} />
                        <textarea
                          name="product_details"
                          rows={3}
                          value={formData.product_details}
                          onChange={handleInputChange}
                          placeholder="Describe the purchased product..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-[1.5rem] py-4 md:py-5 pl-14 pr-8 text-sm text-slate-900 outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all font-black italic tracking-tight resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {/* Payment Details */}
                <SectionCard title="Payment Details" icon={Landmark} delay={0.1}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                    <Field label="Name (as per bank records)" name="bank_account_name" icon={User} placeholder="Account Holder Name" value={formData.bank_account_name} onChange={handleInputChange} />
                    <Field label="Account No" name="account_no" icon={Hash} placeholder="00000000000" required value={formData.account_no} onChange={handleInputChange} />
                    <Field label="IFSC Code" name="ifsc_code" icon={Zap} placeholder="SBIN0000000" required value={formData.ifsc_code} onChange={handleInputChange} />
                    <Field label="Bank Name" name="bank_name" icon={Building2} placeholder="E.g. State Bank of India" value={formData.bank_name} onChange={handleInputChange} />
                    <Field label="Bank Branch" name="bank_branch" icon={MapPin} placeholder="E.g. Krishnagiri Main" value={formData.bank_branch} onChange={handleInputChange} />
                  </div>
                </SectionCard>

                {/* Agent / Referral Details */}
                <SectionCard title="Agent / Referral Details" icon={Users} delay={0.15}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                    <Field label="Agent Name" name="agent_name" icon={User} placeholder="Agent / Referrer Name" value={formData.agent_name} onChange={handleInputChange} />
                    <Field label="Agent ID / Referral ID" name="agent_id" icon={Hash} placeholder="Agent ID" value={formData.agent_id} onChange={handleInputChange} />
                  </div>
                </SectionCard>

                {/* Date & Place */}
                <SectionCard title="Declaration" icon={FileText} delay={0.2}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                    <Field label="Date" name="application_date" icon={Calendar} placeholder="" type="date" value={formData.application_date} onChange={handleInputChange} />
                    <Field label="Place" name="place" icon={MapPin} placeholder="Krishnagiri" value={formData.place} onChange={handleInputChange} />
                  </div>
                  <div className="flex items-start gap-4 md:gap-6 p-6 md:p-8 bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 shadow-2xl">
                    <ShieldCheck className="text-amber-500 shrink-0 mt-1" size={22} strokeWidth={2.5} />
                    <p className="text-[8px] md:text-[9px] text-slate-400 font-bold leading-relaxed uppercase tracking-wider italic">
                      Submit this application along with copies of PAN Card, Aadhaar Card and Bank details. Fill this application with care — the company is not responsible for any incorrect information.
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
                  <>Submit Application <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" /></>
                )}
              </button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
};

export default CashbackApplication;
