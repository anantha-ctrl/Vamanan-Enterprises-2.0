import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, ShieldCheck, FileText, CheckCircle, ArrowLeft, 
  User, Phone, MapPin, Hash, Loader2, AlertCircle, Menu, ArrowRight, Clock, ShieldAlert, Shield, Fingerprint, CreditCard, Building2, Zap, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';
import Sidebar from '../components/Sidebar';
import CustomerHeader from '../components/CustomerHeader';

const KYC = () => {
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    aadhar_no: '',
    pan_no: '',
    bank_name: '',
    account_no: '',
    ifsc_code: '',
    branch_name: ''
  });

  const [kycStatus, setKycStatus] = useState('none'); // none, pending, approved, rejected, verified
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [dismissedRejected, setDismissedRejected] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!user.id) {
      navigate('/login');
      return;
    }
    fetchKYCData();
  }, []);

  const fetchKYCData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/customer/kyc.php?user_id=${user.id}`);
      if (response.data.status === 'success') {
        const d = response.data.data;
        setFormData({
          phone: d.phone || '',
          address: d.address || '',
          aadhar_no: d.aadhar_no || '',
          pan_no: d.pan_no || '',
          bank_name: d.bank_name || '',
          account_no: d.account_no || '',
          ifsc_code: d.ifsc_code || '',
          branch_name: d.branch_name || ''
        });
        
        // If status is pending but no document is uploaded, show the form (none)
        if (d.kyc_status === 'pending' && !d.kyc_document) {
           setKycStatus('none');
        } else {
           setKycStatus(d.kyc_status || 'none');
        }
      }
    } catch (err) {
      console.error("KYC fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    let value = e.target.value;
    
    if (e.target.name === 'aadhar_no') {
      // Clean and format Aadhar Number: 0000 0000 0000
      const cleaned = value.replace(/\D/g, '');
      const limited = cleaned.substring(0, 12);
      const formatted = limited.replace(/(\d{4})(?=\d)/g, '$1 ');
      value = formatted;
    }
    
    if (e.target.name === 'pan_no') {
      value = value.toUpperCase().substring(0, 10);
    }

    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!file && kycStatus === 'none') {
      alert("Please upload a verification document.");
      return;
    }

    setSubmitting(true);
    setStatus({ type: '', message: '' });

    const data = new FormData();
    data.append('user_id', user.id);
    data.append('address', formData.address);
    data.append('phone', formData.phone);
    data.append('aadhar_no', formData.aadhar_no);
    data.append('pan_no', formData.pan_no);
    data.append('bank_name', formData.bank_name);
    data.append('account_no', formData.account_no);
    data.append('ifsc_code', formData.ifsc_code);
    data.append('branch_name', formData.branch_name);
    if (file) data.append('document', file);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/customer/kyc.php`, 
        data,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (response.data.status === 'success') {
        setStatus({ type: 'success', message: response.data.message });
        setKycStatus('pending');
      }
    } catch (err) {
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.message || 'Submission failed. Please try again.' 
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
    <div className="min-h-screen bg-slate-50 flex font-inter text-blue-900 overflow-x-hidden selection:bg-amber-100 selection:text-amber-900">
      <Sidebar 
        showMobileMenu={showMobileMenu} 
        setShowMobileMenu={setShowMobileMenu} 
      />

      <div className="ml-0 lg:ml-72 min-h-screen relative w-full">
        <CustomerHeader setShowMobileMenu={setShowMobileMenu} activeTab="Verification Center" />

        <main className="p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 w-full max-w-[1500px] space-y-8 md:space-y-12 pb-32 lg:pb-16">
          
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
          >
             <div>
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                   <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                   <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Verification</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-blue-900 tracking-tighter uppercase italic leading-none">KYC Verification</h1>
                <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2 md:mt-3 italic">Verify your identity to unlock withdrawals and rewards</p>
             </div>
          </motion.div>

          {(kycStatus === 'pending' || kycStatus === 'verified') ? (
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className={`p-8 md:p-20 rounded-[2.5rem] md:rounded-[3.5rem] border shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden ${
                kycStatus === 'verified' 
                ? 'bg-white border-amber-100 shadow-amber-500/5' 
                : 'bg-white border-amber-100 shadow-amber-500/5'
             }`}>
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-20"></div>
                
                {kycStatus === 'verified' ? (
                   <ShieldCheck size={80} md:size={100} className="text-amber-500 mb-6 md:mb-8 drop-shadow-xl" strokeWidth={1.5} />
                ) : (
                   <div className="relative mb-6 md:mb-8">
                      <Clock size={80} md:size={100} className="text-amber-500 animate-pulse" strokeWidth={1.5} />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-4 h-4 bg-amber-500 rounded-full animate-ping"></div>
                      </div>
                   </div>
                )}
                
                <h2 className="text-2xl md:text-3xl font-black text-blue-900 mb-4 tracking-tighter uppercase italic leading-tight">
                   {kycStatus === 'verified' ? 'Verified' : 'Under Review'}
                </h2>
                <p className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest max-w-sm md:max-w-md mx-auto mb-10 md:mb-12 italic leading-relaxed">
                   {kycStatus === 'verified'
                     ? 'Your identity is verified. You can now withdraw money and earn cashback.'
                     : "We're reviewing your documents. This usually takes 24-48 hours."}
                </p>

                <div className="w-full max-w-md bg-slate-50 p-8 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 text-left shadow-inner">
                   <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5 md:mb-6 border-b border-slate-200 pb-3 italic">Your Details</h4>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center gap-4">
                         <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase italic">Phone</span>
                         <span className="text-xs md:text-sm font-black text-blue-900 italic tracking-tight text-right">{formData.phone || 'NOT_FOUND'}</span>
                      </div>
                      <div className="flex justify-between items-center gap-4">
                         <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase italic whitespace-nowrap">Aadhaar No</span>
                         <span className="text-xs md:text-sm font-black text-blue-900 italic tracking-tight text-right">{formData.aadhar_no ? 'XXXX ' + formData.aadhar_no.slice(-4) : 'NOT_FOUND'}</span>
                      </div>
                      <div className="flex justify-between items-center gap-4">
                         <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase italic">PAN No</span>
                         <span className="text-xs md:text-sm font-black text-blue-900 italic tracking-tight text-right">{formData.pan_no ? 'XXXX' + formData.pan_no.slice(-4) : 'NOT_FOUND'}</span>
                      </div>
                   </div>
                </div>
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
                      status.type === 'success' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-blue-50 border-blue-100 text-blue-600'
                    }`}
                  >
                    {status.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest italic">{status.message}</p>
                  </motion.div>
                )}
                {kycStatus === 'rejected' && !status.message && !dismissedRejected && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-6 md:p-8 rounded-2xl md:rounded-[2rem] flex items-center justify-between gap-4 md:gap-6 border bg-blue-500/5 border-blue-500/20 text-blue-600 shadow-xl relative overflow-hidden group"
                  >
                    <div className="flex items-center gap-4 md:gap-6">
                       <ShieldAlert size={28} md:size={32} className="shrink-0" strokeWidth={1.5} />
                       <div>
                          <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-1 italic">Validation Failure Detected</p>
                          <p className="text-[8px] md:text-[10px] font-bold text-blue-400 uppercase tracking-tight italic opacity-80">Previous submission failed compliance checks. Re-submit high-resolution documentation.</p>
                       </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setDismissedRejected(true)}
                      className="p-2 hover:bg-blue-500/10 rounded-xl transition-all text-blue-400 hover:text-blue-600 active:scale-90"
                    >
                       <X size={18} md:size={20} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 gap-8 md:gap-12">
                {/* Basic Information Card */}
                <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="bg-white border border-slate-200/60 p-8 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm space-y-10 md:space-y-12"
                >
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                    <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center text-amber-500 shadow-lg"><User size={20} /></div>
                    <h3 className="text-[9px] md:text-[10px] font-black text-blue-900 uppercase tracking-[0.3em] italic">Personal Details</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                    <div className="space-y-3">
                      <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Phone Number</label>
                      <div className="relative group">
                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={18} md:size={20} />
                        <input 
                          type="text" 
                          name="phone"
                          required
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+91 00000 00000" 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-[1.5rem] py-4 md:py-5 pl-14 pr-8 text-sm text-blue-900 outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all font-black italic tracking-tight" 
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Address</label>
                      <div className="relative group">
                        <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={18} md:size={20} />
                        <input 
                          type="text" 
                          name="address"
                          required
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Your full address"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-[1.5rem] py-4 md:py-5 pl-14 pr-8 text-sm text-blue-900 outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all font-black italic tracking-tight" 
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Aadhaar Number</label>
                      <div className="relative group">
                        <Fingerprint className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={18} md:size={20} />
                        <input 
                          type="text" 
                          name="aadhar_no"
                          required
                          value={formData.aadhar_no}
                          onChange={handleInputChange}
                          placeholder="0000 0000 0000" 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-[1.5rem] py-4 md:py-5 pl-14 pr-8 text-sm text-blue-900 outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all font-black italic tracking-tight" 
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">PAN Number</label>
                      <div className="relative group">
                        <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={18} md:size={20} />
                        <input 
                          type="text" 
                          name="pan_no"
                          required
                          value={formData.pan_no}
                          onChange={handleInputChange}
                          placeholder="ABCDE1234F" 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-[1.5rem] py-4 md:py-5 pl-14 pr-8 text-sm text-blue-900 outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all uppercase font-black italic tracking-tight" 
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Bank Infrastructure Card */}
                <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.05 }}
                   className="bg-white border border-slate-200/60 p-8 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm space-y-10 md:space-y-12"
                >
                   <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                      <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center text-amber-500 shadow-lg"><Building2 size={20} /></div>
                      <h3 className="text-[9px] md:text-[10px] font-black text-blue-900 uppercase tracking-[0.3em] italic">Bank Details</h3>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                      <div className="space-y-3">
                         <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Bank Name</label>
                         <div className="relative group">
                            <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={18} md:size={20} />
                            <input 
                              type="text" 
                              name="bank_name"
                              required
                              value={formData.bank_name}
                              onChange={handleInputChange}
                              placeholder="E.G. STATE BANK OF INDIA" 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-[1.5rem] py-4 md:py-5 pl-14 pr-8 text-sm text-blue-900 outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all font-black italic tracking-tight" 
                            />
                         </div>
                      </div>

                      <div className="space-y-3">
                         <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Account Number</label>
                         <div className="relative group">
                            <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={18} md:size={20} />
                            <input 
                              type="text" 
                              name="account_no"
                              required
                              value={formData.account_no}
                              onChange={handleInputChange}
                              placeholder="00000000000" 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-[1.5rem] py-4 md:py-5 pl-14 pr-8 text-sm text-blue-900 outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all font-black italic tracking-tight" 
                            />
                         </div>
                      </div>

                      <div className="space-y-3">
                         <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">IFSC Code</label>
                         <div className="relative group">
                            <Zap className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={18} md:size={20} />
                            <input 
                              type="text" 
                              name="ifsc_code"
                              required
                              value={formData.ifsc_code}
                              onChange={handleInputChange}
                              placeholder="SBIN0000000" 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-[1.5rem] py-4 md:py-5 pl-14 pr-8 text-sm text-blue-900 outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all font-black italic tracking-tight uppercase" 
                            />
                         </div>
                      </div>

                      <div className="space-y-3">
                         <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Branch Name</label>
                         <div className="relative group">
                            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-500 transition-colors" size={18} md:size={20} />
                            <input 
                              type="text" 
                              name="branch_name"
                              required
                              value={formData.branch_name}
                              onChange={handleInputChange}
                              placeholder="E.G. CHENNAI MAIN" 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-[1.5rem] py-4 md:py-5 pl-14 pr-8 text-sm text-blue-900 outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/5 transition-all font-black italic tracking-tight" 
                            />
                         </div>
                      </div>
                   </div>
                </motion.div>

                {/* Proof of Identity Card */}
                <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.1 }}
                   className="bg-white border border-slate-200/60 p-8 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-8 md:mb-12">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-amber-500 shadow-sm border border-slate-100"><FileText size={20} /></div>
                       <h3 className="text-[9px] md:text-[10px] font-black text-blue-900 uppercase tracking-[0.3em] italic">Upload Documents</h3>
                    </div>
                    <div className="flex gap-2">
                       <div className="px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20 text-[7px] md:text-[8px] font-black text-amber-600 uppercase italic tracking-widest">Required: 03</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-10 md:mb-12">
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-slate-400 font-black italic text-[10px]">01</div>
                        <div>
                           <p className="text-[9px] font-black text-blue-900 uppercase tracking-tighter italic leading-none mb-1">Aadhar Card</p>
                           <p className="text-[7px] font-bold text-slate-400 uppercase italic">Front & Back View</p>
                        </div>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-slate-400 font-black italic text-[10px]">02</div>
                        <div>
                           <p className="text-[9px] font-black text-blue-900 uppercase tracking-tighter italic leading-none mb-1">PAN Card</p>
                           <p className="text-[7px] font-bold text-slate-400 uppercase italic">Full Scanned View</p>
                        </div>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-slate-400 font-black italic text-[10px]">03</div>
                        <div>
                           <p className="text-[9px] font-black text-blue-900 uppercase tracking-tighter italic leading-none mb-1">Bank Proof</p>
                           <p className="text-[7px] font-bold text-slate-400 uppercase italic">Passbook / Cheque</p>
                        </div>
                     </div>
                  </div>
                  
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    />
                    <div className="border-[3px] border-dashed border-slate-100 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-20 text-center group-hover:border-amber-500/50 group-hover:bg-amber-50 transition-all duration-500 relative overflow-hidden">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 md:mb-8 group-hover:scale-110 group-hover:bg-blue-900 group-hover:text-amber-500 transition-all duration-500 border border-slate-100 shadow-sm">
                        <Upload className={file ? "text-amber-500" : "text-slate-400"} size={24} md:size={32} strokeWidth={2} />
                      </div>
                      {file ? (
                        <div>
                          <p className="text-amber-600 font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] mb-2 italic">File Selected</p>
                          <p className="text-xs md:text-sm font-black text-blue-900 italic opacity-60 truncate max-w-[200px] md:max-w-xs mx-auto">{file.name}</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-black text-blue-900 mb-2 uppercase italic tracking-tighter leading-none">Click to Upload</p>
                          <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] italic opacity-60">PDF / Images containing all docs (Max: 5MB)</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 md:mt-12 flex items-start gap-4 md:gap-6 p-6 md:p-8 bg-blue-900 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 shadow-2xl">
                    <Shield className="text-amber-500 shrink-0 mt-1" size={20} md:size={24} strokeWidth={2.5} />
                    <p className="text-[8px] md:text-[9px] text-slate-400 font-bold leading-relaxed uppercase tracking-wider italic">
                      Your documents are stored securely. Verification usually takes 24-48 hours.
                    </p>
                  </div>
                </motion.div>
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-900 text-white py-6 md:py-8 rounded-[1.5rem] md:rounded-[2rem] font-black flex items-center justify-center gap-3 md:gap-4 hover:bg-amber-600 transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 text-[9px] md:text-[10px] uppercase tracking-[0.3em] italic group"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} md:size={24} /> : (
                  <>Execute Validation <ArrowRight size={18} md:size={20} className="group-hover:translate-x-2 transition-transform" /></>
                )}
              </button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
};

export default KYC;
