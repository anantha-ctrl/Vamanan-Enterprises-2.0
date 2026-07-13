import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Phone, MapPin, Hash, Loader2, AlertCircle, CheckCircle, ArrowRight,
  Fingerprint, CreditCard, Building2, Zap, Mail, Package, FileText,
  Calendar, ShoppingBag, Users, ShieldCheck, Landmark, X, Gift
} from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../config';

const todayISO = () => new Date().toISOString().split('T')[0];

// Module-scope so inputs don't remount (and lose focus) on each keystroke.
const Field = ({ label, name, icon: Icon, placeholder, type = 'text', required = false, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic ml-1">
      {label}{required && <span className="text-amber-500"> *</span>}
    </label>
    <div className="relative group">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={16} />
      <input
        type={type}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-5 text-sm text-blue-900 outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all font-black italic tracking-tight"
      />
    </div>
  </div>
);

const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-white border border-slate-200/60 p-6 md:p-8 rounded-[2rem] shadow-sm space-y-6">
    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
      <div className="w-9 h-9 bg-blue-900 rounded-xl flex items-center justify-center text-amber-500 shadow-lg">
        <Icon size={18} />
      </div>
      <h3 className="text-[9px] font-black text-blue-900 uppercase tracking-[0.3em] italic">{title}</h3>
    </div>
    {children}
  </div>
);

/**
 * Cashback Application popup. Opens right after a purchase; prefills known
 * customer + purchase data from the DB, and the customer completes the rest
 * manually before submitting to api/customer/cashback_application.php.
 */
const CashbackApplicationModal = ({ open, onClose, user = {}, prefill = {}, onSubmitted }) => {
  const [formData, setFormData] = useState({
    customer_name: '', address: '', phone: '', aadhar_no: '', pan_no: '',
    customer_code: '', customer_email: '', referral_id: '',
    purchase_amount: '', purchased_product: '', product_details: '', purchase_date: todayISO(),
    bank_account_name: '', account_no: '', ifsc_code: '', bank_name: '', bank_branch: '',
    agent_name: '', agent_id: '',
    place: 'Krishnagiri', application_date: todayISO(),
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    if (!open) return;
    setStatus({ type: '', message: '' });
    setLoading(true);
    // Seed purchase details immediately, then hydrate customer data from the DB.
    setFormData(prev => ({ ...prev, ...prefill }));

    const fetchPrefill = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/customer/cashback_application.php?user_id=${user.id}`);
        if (res.data.status === 'success') {
          const u = res.data.data.user || {};
          setFormData(prev => ({
            ...prev,
            customer_name: u.name || prev.customer_name,
            address: u.address || prev.address,
            phone: u.phone || prev.phone,
            aadhar_no: u.aadhar_no || prev.aadhar_no,
            pan_no: u.pan_no || prev.pan_no,
            customer_code: u.customer_id || (u.id ? `VEV${String(u.id).padStart(3, '0')}` : prev.customer_code),
            customer_email: u.email || prev.customer_email,
            referral_id: u.referral_code || prev.referral_id,
            bank_account_name: u.name || prev.bank_account_name,
            account_no: u.account_no || prev.account_no,
            ifsc_code: u.ifsc_code || prev.ifsc_code,
            bank_name: u.bank_name || prev.bank_name,
            bank_branch: u.branch_name || prev.bank_branch,
            // keep purchase fields from prefill
            ...prefill,
          }));
        }
      } catch (err) {
        console.error('Cashback application prefill failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrefill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleInputChange = (e) => {
    let value = e.target.value;
    const name = e.target.name;
    if (name === 'aadhar_no') {
      const cleaned = value.replace(/\D/g, '').substring(0, 12);
      value = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    }
    if (name === 'pan_no' || name === 'ifsc_code') value = value.toUpperCase();
    setFormData(prev => ({ ...prev, [name]: value }));
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
        setTimeout(() => { onSubmitted && onSubmitted(); }, 1200);
      } else {
        setStatus({ type: 'error', message: res.data.message || 'Submission failed.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Submission failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-blue-950/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 20 }}
            className="bg-slate-50 w-full max-w-3xl max-h-[92vh] rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/10"
          >
            {/* Header */}
            <div className="bg-blue-900 text-white px-6 md:px-10 py-6 flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 shrink-0">
                  <Gift size={24} />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-black uppercase italic tracking-tighter leading-none">Cashback Application</h2>
                  <p className="text-[8px] md:text-[9px] text-blue-200 font-black uppercase tracking-widest mt-1.5 italic">Fill your details to claim daily cashback on this purchase</p>
                </div>
              </div>
              <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors shrink-0"><X size={22} /></button>
            </div>

            {/* Body */}
            {loading ? (
              <div className="flex-1 flex items-center justify-center py-24 text-amber-600">
                <Loader2 className="animate-spin" size={44} strokeWidth={3} />
              </div>
            ) : status.type === 'success' ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-20">
                <ShieldCheck size={84} className="text-amber-500 mb-6 drop-shadow-xl" strokeWidth={1.5} />
                <h3 className="text-xl md:text-2xl font-black text-blue-900 uppercase italic tracking-tighter mb-3">Application Received</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest max-w-sm italic leading-relaxed">
                  {status.message || 'Your cashback application has been saved. Our team will verify it shortly.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 md:px-10 py-6 space-y-6">
                <AnimatePresence>
                  {status.message && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                      className={`p-4 rounded-2xl flex items-center gap-3 border shadow-sm ${status.type === 'success' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}
                    >
                      {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                      <p className="text-[9px] font-black uppercase tracking-widest italic">{status.message}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Basic Details */}
                <Section title="Basic Details" icon={User}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label="Customer Name" name="customer_name" icon={User} placeholder="Full Name" required value={formData.customer_name} onChange={handleInputChange} />
                    <Field label="Phone No" name="phone" icon={Phone} placeholder="+91 00000 00000" required value={formData.phone} onChange={handleInputChange} />
                    <Field label="Address" name="address" icon={MapPin} placeholder="Full Address" value={formData.address} onChange={handleInputChange} />
                    <Field label="Aadhaar No" name="aadhar_no" icon={Fingerprint} placeholder="0000 0000 0000" value={formData.aadhar_no} onChange={handleInputChange} />
                    <Field label="PAN No" name="pan_no" icon={CreditCard} placeholder="ABCDE1234F" value={formData.pan_no} onChange={handleInputChange} />
                    <Field label="Customer ID" name="customer_code" icon={CreditCard} placeholder="VEV000" value={formData.customer_code} onChange={handleInputChange} />
                    <Field label="Customer E-mail ID" name="customer_email" icon={Mail} placeholder="you@email.com" type="email" value={formData.customer_email} onChange={handleInputChange} />
                    <Field label="Customer's Referral ID" name="referral_id" icon={Hash} placeholder="REF Code" value={formData.referral_id} onChange={handleInputChange} />
                  </div>
                </Section>

                {/* Purchase Details */}
                <Section title="Purchase Details" icon={ShoppingBag}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label="Total Value of Purchase (₹)" name="purchase_amount" icon={Zap} placeholder="0.00" type="number" required value={formData.purchase_amount} onChange={handleInputChange} />
                    <Field label="Purchased Product" name="purchased_product" icon={Package} placeholder="E.g. 22K Gold Coin" value={formData.purchased_product} onChange={handleInputChange} />
                    <Field label="Date of Purchase" name="purchase_date" icon={Calendar} placeholder="" type="date" value={formData.purchase_date} onChange={handleInputChange} />
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Details of Purchased Product</label>
                      <div className="relative group">
                        <FileText className="absolute left-4 top-4 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={16} />
                        <textarea
                          name="product_details" rows={2} value={formData.product_details} onChange={handleInputChange}
                          placeholder="Describe the purchased product..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-5 text-sm text-blue-900 outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all font-black italic tracking-tight resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </Section>

                {/* Payment Details */}
                <Section title="Payment Details (Bank)" icon={Landmark}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label="Name (as per bank records)" name="bank_account_name" icon={User} placeholder="Account Holder Name" value={formData.bank_account_name} onChange={handleInputChange} />
                    <Field label="Account No" name="account_no" icon={Hash} placeholder="00000000000" required value={formData.account_no} onChange={handleInputChange} />
                    <Field label="IFSC Code" name="ifsc_code" icon={Zap} placeholder="SBIN0000000" required value={formData.ifsc_code} onChange={handleInputChange} />
                    <Field label="Bank Name" name="bank_name" icon={Building2} placeholder="E.g. State Bank of India" value={formData.bank_name} onChange={handleInputChange} />
                    <Field label="Bank Branch" name="bank_branch" icon={MapPin} placeholder="E.g. Krishnagiri Main" value={formData.bank_branch} onChange={handleInputChange} />
                  </div>
                </Section>

                {/* Agent / Referral + Declaration */}
                <Section title="Agent / Referral & Declaration" icon={Users}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label="Agent Name" name="agent_name" icon={User} placeholder="Agent / Referrer Name" value={formData.agent_name} onChange={handleInputChange} />
                    <Field label="Agent ID / Referral ID" name="agent_id" icon={Hash} placeholder="Agent ID" value={formData.agent_id} onChange={handleInputChange} />
                    <Field label="Date" name="application_date" icon={Calendar} placeholder="" type="date" value={formData.application_date} onChange={handleInputChange} />
                    <Field label="Place" name="place" icon={MapPin} placeholder="Krishnagiri" value={formData.place} onChange={handleInputChange} />
                  </div>
                  <div className="flex items-start gap-3 p-5 bg-blue-900 rounded-2xl border border-white/5 shadow-xl">
                    <ShieldCheck className="text-amber-500 shrink-0 mt-0.5" size={18} strokeWidth={2.5} />
                    <p className="text-[8px] text-blue-200 font-bold leading-relaxed uppercase tracking-wider italic">
                      Fill this application with care — the company is not responsible for any incorrect information. Keep PAN, Aadhaar & bank details ready for verification.
                    </p>
                  </div>
                </Section>
              </form>
            )}

            {/* Footer actions */}
            {!loading && status.type !== 'success' && (
              <div className="shrink-0 border-t border-slate-200 bg-white px-5 md:px-10 py-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onClose} type="button"
                  className="sm:flex-none px-6 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest italic bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
                >
                  Skip for now
                </button>
                <button
                  onClick={handleSubmit} disabled={submitting}
                  className="flex-1 bg-blue-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-amber-600 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 text-[9px] uppercase tracking-[0.3em] italic group"
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : (<>Submit Application <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" /></>)}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CashbackApplicationModal;
