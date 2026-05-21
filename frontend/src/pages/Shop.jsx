import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Menu, Loader2, CheckCircle2, AlertCircle, Search, ArrowRight, ShieldCheck, Zap, Coins, RefreshCw, X, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';
import Sidebar from '../components/Sidebar';
import CustomerHeader from '../components/CustomerHeader';

const Shop = () => {
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ transaction_id: '', screenshot: null });
  
  const [goldPrice, setGoldPrice] = useState(7250);
  const [silverPrice, setSilverPrice] = useState(100);
  const [gstPercent, setGstPercent] = useState(3);
  const [supportPhone, setSupportPhone] = useState('919876543210');
  const [upiId, setUpiId] = useState('anantha130404-1@oksbi');
  const [companyName, setCompanyName] = useState('Vamanan Enterprises');
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [paymentMode, setPaymentMode] = useState('upi'); // 'upi' or 'bank'
  const [copiedField, setCopiedField] = useState(''); // '' or 'account' or 'ifsc'

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };
   const [minInvestment, setMinInvestment] = useState(1000);
   const [dailyRate, setDailyRate] = useState(1); // Default 1%
   const [weight, setWeight] = useState(1);
   const [assetType, setAssetType] = useState('gold'); // 'gold' or 'silver'
   
   const navigate = useNavigate();
   const user = JSON.parse(localStorage.getItem('user') || '{}') || {};

   useEffect(() => {
     fetchSettings();
     const iv = setInterval(() => fetchSettings(true), 60000);
     return () => clearInterval(iv);
   }, []);

   const fetchSettings = async (isSilent = false) => {
     if (isSilent) setRefreshing(true);
     try {
       const res = await axios.get(`${API_BASE_URL}/admin/settings.php`);
       if (res.data.status === 'success') {
         if (res.data.data.gold_base_price) setGoldPrice(parseFloat(res.data.data.gold_base_price));
         if (res.data.data.silver_base_price) setSilverPrice(parseFloat(res.data.data.silver_base_price));
         if (res.data.data.gst_percentage) setGstPercent(parseFloat(res.data.data.gst_percentage));
         if (res.data.data.support_phone) setSupportPhone(res.data.data.support_phone.replace(/\+/g, '').replace(/\s/g, ''));
         if (res.data.data.upi_id) setUpiId(res.data.data.upi_id);
         if (res.data.data.company_name) setCompanyName(res.data.data.company_name);
         if (res.data.data.min_investment) setMinInvestment(parseFloat(res.data.data.min_investment));
         if (res.data.data.daily_cashback_rate) setDailyRate(parseFloat(res.data.data.daily_cashback_rate));
         if (res.data.data.bank_name) setBankName(res.data.data.bank_name);
         if (res.data.data.bank_account_name) setBankAccountName(res.data.data.bank_account_name);
         if (res.data.data.bank_account_no) setBankAccountNo(res.data.data.bank_account_no);
         if (res.data.data.bank_ifsc) setBankIfsc(res.data.data.bank_ifsc);
         if (res.data.data.bank_branch) setBankBranch(res.data.data.bank_branch);
       }
    } catch (err) {
      console.error("Failed to load settings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const currentPrice = assetType === 'gold' ? goldPrice : silverPrice;
  const baseAmount = weight * currentPrice;
  const gstAmount = baseAmount * (gstPercent / 100);
  const totalAmount = baseAmount + gstAmount;

  const handlePurchaseInitiate = () => {
    if (!user.id) {
      navigate('/login');
      return;
    }
    
    if (totalAmount < minInvestment) {
      setStatus({ 
        type: 'error', 
        message: `Threshold Rejection: Minimum investment required is ₹${minInvestment.toLocaleString()}. Please adjust your weight.` 
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setShowPaymentModal(true);
  };

  const handleFinalSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!paymentForm.transaction_id || !paymentForm.screenshot) {
      alert("Please provide Transaction ID and Payment Screenshot.");
      return;
    }

    setBuying(true);
    setStatus({ type: '', message: '' });

    try {
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('weight', weight);
      formData.append('asset_type', assetType);
      formData.append('transaction_id', paymentForm.transaction_id);
      formData.append('phone', paymentForm.phone || user.phone || '');
      formData.append('screenshot', paymentForm.screenshot);

      const response = await axios.post(`${API_BASE_URL}/shop/purchase.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.status === 'success') {
        // WhatsApp Integration
        const message = encodeURIComponent(
          `🚀 *New Gold Purchase Request!* \n\n` +
          `👤 *Customer:* ${user.name}\n` +
          `📞 *Phone:* ${user.phone || 'N/A'}\n` +
          `💰 *Asset:* ${weight}g ${assetType.toUpperCase()}\n` +
          `💵 *Amount:* ₹${totalAmount.toLocaleString()}\n` +
          `🆔 *Trans ID:* ${paymentForm.transaction_id}\n\n` +
          `_Please verify the attached screenshot in the admin panel._`
        );
        const waLink = `https://wa.me/${supportPhone}?text=${message}`;
        
        setStatus({ 
          type: 'success', 
          message: response.data.message + " Redirecting to WhatsApp for confirmation..."
        });
        
        setShowPaymentModal(false);
        
        setTimeout(() => {
          window.open(waLink, '_blank');
          navigate('/dashboard');
        }, 3000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Transaction failed. Please try again.';
      setStatus({ type: 'error', message: msg });
    } finally {
      setBuying(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center text-amber-600">
      <div className="flex flex-col items-center gap-6">
        <Loader2 className="animate-spin" size={60} strokeWidth={3} />
        <p className="text-[10px] font-black animate-pulse uppercase tracking-[0.4em] italic">Accessing Market Ticker...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-inter text-slate-900 overflow-x-hidden selection:bg-amber-100 selection:text-amber-900">
      <Sidebar 
        showMobileMenu={showMobileMenu} 
        setShowMobileMenu={setShowMobileMenu} 
      />

      <div className="ml-0 lg:ml-72 min-h-screen relative">
        <CustomerHeader setShowMobileMenu={setShowMobileMenu} activeTab="Gold Market" />

        <main className="p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 w-full max-w-[1500px] space-y-8 md:space-y-12 pb-32 lg:pb-16">
          
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
          >
             <div>
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                   <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                   <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Institutional Ticker</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Asset Acquisition</h1>
                <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2 md:mt-3 italic">Establish long-term reserves with daily rewards</p>
             </div>
             <button type="button" onClick={() => fetchSettings(true)}
               className="bg-white border border-slate-200 px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:border-amber-500 hover:text-amber-600 transition-all shadow-sm flex items-center gap-2"
             >
               <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
               Refresh Market
             </button>
          </motion.div>

          {/* Asset Selection Tabs */}
          <div className="flex gap-4 mb-2">
             <button 
               onClick={() => setAssetType('gold')}
               className={`flex-1 py-4 md:py-6 rounded-2xl md:rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] italic transition-all flex items-center justify-center gap-3 border-2 ${assetType === 'gold' ? 'bg-slate-900 text-amber-500 border-slate-900 shadow-xl' : 'bg-white text-slate-400 border-slate-100 hover:border-amber-200'}`}
             >
                <Zap size={18} /> Gold 22K
             </button>
             <button 
               onClick={() => setAssetType('silver')}
               className={`flex-1 py-4 md:py-6 rounded-2xl md:rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] italic transition-all flex items-center justify-center gap-3 border-2 ${assetType === 'silver' ? 'bg-slate-900 text-slate-200 border-slate-900 shadow-xl' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
             >
                <Coins size={18} /> Silver Pure
             </button>
          </div>

          {/* Market Price Card */}
          <motion.div 
            key={assetType}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white border border-slate-200/60 p-6 md:p-14 rounded-[2rem] md:rounded-[3.5rem] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-10 relative overflow-hidden group"
          >
             <div className={`absolute top-0 left-0 w-1 h-full ${assetType === 'gold' ? 'bg-amber-500' : 'bg-slate-400'}`}></div>
             <div>
                <p className="text-[9px] md:text-[10px] text-slate-400 mb-2 font-black uppercase tracking-[0.2em] italic">Current {assetType === 'gold' ? 'Gold' : 'Silver'} Price</p>
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter italic">₹{currentPrice.toLocaleString()} <span className="text-sm md:text-lg text-slate-400">/ gram</span></h2>
                <div className="flex flex-wrap items-center gap-4 mt-4 md:mt-6">
                   <div className="bg-emerald-50 text-emerald-600 px-4 md:px-6 py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-100 shadow-sm italic flex items-center gap-2">
                      <TrendingUp size={14} strokeWidth={3} /> {assetType === 'gold' ? '+2.3%' : '+1.8%'} MARGINAL
                   </div>
                   <p className="text-[8px] md:text-[9px] text-slate-300 font-black uppercase tracking-widest italic">Live Market Node</p>
                </div>
             </div>
             <div className={`w-20 h-20 md:w-32 md:h-32 bg-slate-50 rounded-2xl md:rounded-[2rem] flex items-center justify-center border border-slate-100 shadow-inner group-hover:bg-slate-900 transition-all duration-500 ${assetType === 'gold' ? 'text-amber-500 group-hover:text-amber-500' : 'text-slate-400 group-hover:text-slate-200'}`}>
                {assetType === 'gold' ? <Zap size={40} md:size={60} strokeWidth={1} /> : <Coins size={40} md:size={60} strokeWidth={1} />}
             </div>
          </motion.div>

          {/* Calculator Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-slate-200/60 rounded-[2rem] md:rounded-[3.5rem] overflow-hidden shadow-2xl relative"
          >
             <div className="p-8 md:p-16 relative z-10">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-6 md:pb-8 mb-8 md:mb-12">
                   <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-amber-500 shadow-lg"><Zap size={20} /></div>
                   <h3 className="text-[9px] md:text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] italic">Capital Allocation Matrix</h3>
                </div>
                
                <div className="mb-8 md:mb-12">
                   <label className="block text-[9px] md:text-[10px] font-black text-slate-400 mb-3 md:mb-4 uppercase tracking-widest italic ml-1">Asset Mass (Grams)</label>
                   <div className="relative group">
                      <input 
                        type="number" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl md:rounded-[2rem] px-8 md:px-10 py-6 md:py-8 text-slate-900 focus:border-amber-500 focus:bg-white outline-none text-2xl md:text-3xl font-black transition-all shadow-inner italic"
                        value={weight}
                        onChange={(e) => setWeight(Math.max(1, parseInt(e.target.value) || 1))}
                        min="1"
                      />
                      <div className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2 text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] italic group-focus-within:text-amber-500 hidden sm:block">Precision Input Node</div>
                   </div>
                   <p className="text-[8px] md:text-[9px] text-slate-400 mt-3 md:mt-4 font-black uppercase tracking-[0.2em] italic ml-1 opacity-60">Threshold: 1.000g minimum institutional requirement</p>
                </div>

                <div className="space-y-6 md:space-y-8 pt-8 md:pt-12 border-t border-slate-50 mb-8 md:mb-12">
                   <div className="flex justify-between items-center">
                      <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Base Valuation</span>
                      <span className="text-lg md:text-xl font-black text-slate-900 italic tracking-tighter">₹{baseAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Fiscal Levy ({gstPercent}%)</span>
                      <span className="text-lg md:text-xl font-black text-slate-900 italic tracking-tighter">₹{gstAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                   </div>
                   <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                      <div>
                         <span className="text-[9px] md:text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] italic">Daily Institutional Payout</span>
                         <p className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest mt-1 opacity-70">Calculated at {dailyRate}% daily protocol</p>
                      </div>
                      <span className="text-lg md:text-xl font-black text-emerald-700 italic tracking-tighter">₹{(baseAmount * (dailyRate / 100)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                   </div>
                   <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-6 md:pt-8 border-t border-slate-100 mt-4 gap-4">
                      <span className="text-base md:text-lg font-black text-slate-900 uppercase tracking-[0.3em] italic">Total Terminal Amount</span>
                      <span className="text-3xl md:text-5xl font-black text-amber-600 italic tracking-tighter drop-shadow-sm">₹{totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                   </div>
                </div>

                <button 
                   onClick={handlePurchaseInitiate}
                   disabled={buying}
                   className="w-full bg-slate-900 text-white py-6 md:py-8 rounded-2xl md:rounded-[2rem] font-black text-[9px] md:text-[10px] uppercase tracking-[0.3em] hover:bg-amber-600 transition-all shadow-2xl active:scale-95 italic group flex items-center justify-center gap-3 md:gap-4"
                >
                   {buying ? <Loader2 className="animate-spin" size={20} md:size={24} /> : (
                      <>Initialize {assetType === 'gold' ? 'Gold' : 'Silver'} Transfer <ArrowRight size={18} md:size={20} className="group-hover:translate-x-2 transition-transform" /></>
                   )}
                </button>
                
                <div className="mt-8 md:mt-12 flex items-start gap-4 md:gap-6 p-6 md:p-8 bg-slate-50 rounded-2xl md:rounded-[2rem] border border-slate-100">
                    <ShieldCheck className="text-amber-500 shrink-0 mt-1" size={20} md:size={24} strokeWidth={2.5} />
                    <p className="text-[8px] md:text-[9px] text-slate-400 font-bold leading-relaxed uppercase tracking-wider italic">
                      Institutional purchases are cross-validated against the global {assetType === 'gold' ? '22K' : 'Pure Silver'} spot price. Once executed, your asset will generate daily rewards at the 00:00 UTC cycle.
                    </p>
                </div>
             </div>
          </motion.div>
          
        </main>
      </div>

      <AnimatePresence>
        {showPaymentModal && (
          <div key="payment-overlay" className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[300] flex items-center justify-center md:p-6 overflow-y-auto">
            <motion.div 
              key="payment-modal-content"
              initial={{ opacity: 0, y: 100 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 100 }}
              className="bg-white w-full max-w-5xl md:rounded-[4rem] overflow-hidden shadow-2xl flex flex-col md:flex-row relative h-full md:h-auto md:max-h-[90vh] rounded-t-[3rem] md:rounded-b-[4rem]"
            >
              <button 
                onClick={() => setShowPaymentModal(false)} 
                className="absolute top-6 right-6 md:top-8 md:right-8 z-50 p-2 md:p-3 bg-slate-100/10 hover:bg-slate-100 rounded-2xl text-white md:text-slate-400 hover:text-slate-900 transition-colors backdrop-blur-md"
              >
                <X size={20} />
              </button>

              {/* Left Side: QR Code / Bank Details */}
              <div className="w-full md:w-1/2 bg-slate-900 p-6 sm:p-10 md:p-12 lg:p-16 flex flex-col items-center justify-start text-center relative overflow-hidden shrink-0">
                <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                
                {/* Segmented Control */}
                <div className="relative z-10 flex p-1.5 bg-white/5 border border-white/10 rounded-2xl mb-8 w-full max-w-[280px]">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('upi')}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic ${paymentMode === 'upi' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}
                  >
                    UPI QR Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('bank')}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all italic ${paymentMode === 'bank' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'}`}
                  >
                    Bank Details
                  </button>
                </div>

                <div className="relative z-10 w-full max-w-[280px] sm:max-w-[320px] flex-1 flex flex-col justify-center items-center">
                  {paymentMode === 'upi' ? (
                    <div className="w-full flex flex-col items-center">
                      <div className="bg-white p-3 sm:p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-[0_0_50px_rgba(245,158,11,0.2)] mb-4 md:mb-6 group transition-transform hover:scale-105 duration-500 w-full max-w-[200px] sm:max-w-[240px]">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=${upiId}%26pn=${encodeURIComponent(companyName)}%26am=${totalAmount}%26cu=INR`}
                          alt="Payment QR Code" 
                          className="w-full h-full object-contain rounded-xl sm:rounded-2xl" 
                          onError={(e) => { e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=${upiId}%26pn=${encodeURIComponent(companyName)}%26am=${totalAmount}`; }}
                        />
                      </div>
                      <h3 className="text-amber-500 text-xl sm:text-2xl md:text-3xl font-black italic tracking-tighter uppercase mb-1">Scan & Transact</h3>
                      <p className="text-slate-400 text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] italic mb-6">Amount Payable: ₹{totalAmount.toLocaleString()}</p>
                    </div>
                  ) : (
                    <div className="w-full text-left space-y-4 mb-6">
                      <div className="bg-white/5 border border-white/10 rounded-[1.8rem] p-6 shadow-[0_0_40px_rgba(0,0,0,0.2)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-white"><Coins size={80} /></div>
                        
                        <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] mb-4 italic">Corporate Settlement Node</p>
                        
                        <div className="space-y-4">
                          <div>
                            <span className="text-[7px] md:text-[8px] text-slate-500 font-black uppercase tracking-widest block mb-0.5 italic">Beneficiary Bank</span>
                            <span className="text-sm font-black text-white uppercase italic">{bankName || 'State Bank of India'}</span>
                          </div>
                          
                          <div>
                            <span className="text-[7px] md:text-[8px] text-slate-500 font-black uppercase tracking-widest block mb-0.5 italic">Account Holder</span>
                            <span className="text-sm font-black text-white uppercase italic">{bankAccountName || companyName}</span>
                          </div>

                          <div className="flex items-center justify-between border-t border-white/5 pt-3">
                            <div>
                              <span className="text-[7px] md:text-[8px] text-slate-500 font-black uppercase tracking-widest block mb-0.5 italic">Account Number</span>
                              <span className="text-sm font-black text-amber-500 tracking-wider font-mono">{bankAccountNo || '123456789012'}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(bankAccountNo || '123456789012', 'account')}
                              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
                            >
                              {copiedField === 'account' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                            </button>
                          </div>

                          <div className="flex items-center justify-between border-t border-white/5 pt-3">
                            <div>
                              <span className="text-[7px] md:text-[8px] text-slate-500 font-black uppercase tracking-widest block mb-0.5 italic">IFSC / Routing Node</span>
                              <span className="text-sm font-black text-amber-500 tracking-wider font-mono">{bankIfsc || 'SBIN0001234'}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(bankIfsc || 'SBIN0001234', 'ifsc')}
                              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors"
                            >
                              {copiedField === 'ifsc' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                            </button>
                          </div>

                          {bankBranch && (
                            <div className="border-t border-white/5 pt-3">
                              <span className="text-[7px] md:text-[8px] text-slate-500 font-black uppercase tracking-widest block mb-0.5 italic">Branch Location</span>
                              <span className="text-[10px] font-black text-slate-300 uppercase italic">{bankBranch}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest block mb-1 italic">Transfer Amount</span>
                        <span className="text-lg font-black text-amber-500 italic">₹{totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  <div className="p-4 md:p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 md:gap-4 text-left w-full mt-auto">
                    <ShieldCheck className="text-amber-500 shrink-0" size={20} />
                    <div>
                      <p className="text-[7px] md:text-[8px] text-slate-400 font-black uppercase tracking-widest italic">Institutional Trust</p>
                      <p className="text-[9px] md:text-[10px] text-white font-bold uppercase tracking-tight">Secured Payment Gateway Node</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Form */}
              <div className="w-full md:w-1/2 p-8 md:p-20 overflow-y-auto max-h-[60vh] md:max-h-[85vh]">
                <div className="mb-8 md:mb-10">
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-2">Submission Protocol</h2>
                  <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest italic">Verify your transaction to initiate asset transfer</p>
                </div>

                <form onSubmit={handleFinalSubmit} className="space-y-6 md:space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    <div className="space-y-2 md:space-y-3">
                      <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Identity Node</label>
                      <input type="text" readOnly value={user.name} className="w-full bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl py-4 md:py-5 px-6 md:px-8 text-xs md:text-sm font-black text-slate-400 uppercase italic outline-none" />
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Contact Channel</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Enter Mobile Number"
                        value={paymentForm.phone || user.phone || ''} 
                        onChange={(e) => setPaymentForm({...paymentForm, phone: e.target.value})}
                        readOnly={!!user.phone}
                        className={`w-full ${user.phone ? 'bg-slate-50 text-slate-400' : 'bg-white text-slate-900 border-amber-200 focus:border-amber-500'} border rounded-xl md:rounded-2xl py-4 md:py-5 px-6 md:px-8 text-xs md:text-sm font-black uppercase italic outline-none transition-all`} 
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:space-y-3">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Transaction ID (UTR)</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Enter 12-digit Ref No" 
                      value={paymentForm.transaction_id}
                      onChange={(e) => setPaymentForm({...paymentForm, transaction_id: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl py-4 md:py-5 px-6 md:px-8 text-xs md:text-sm font-black text-slate-900 uppercase italic outline-none focus:border-amber-500 focus:bg-white transition-all shadow-inner" 
                    />
                  </div>

                  <div className="space-y-2 md:space-y-3">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Payment Proof (Screenshot)</label>
                    <div className="relative">
                      <input 
                        type="file" 
                        required 
                        accept="image/*"
                        onChange={(e) => setPaymentForm({...paymentForm, screenshot: e.target.files[0]})}
                        className="hidden" 
                        id="pay-proof" 
                      />
                      <label htmlFor="pay-proof" className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 border-dashed rounded-xl md:rounded-2xl py-4 md:py-5 px-6 md:px-8 text-[10px] md:text-xs font-black text-slate-400 cursor-pointer hover:bg-slate-100 transition-all">
                        <span className="truncate">{paymentForm.screenshot ? paymentForm.screenshot.name : 'Upload Screenshot'}</span>
                        <ShieldCheck size={18} className={paymentForm.screenshot ? 'text-emerald-500' : 'text-slate-300'} />
                      </label>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={buying}
                    className="w-full bg-slate-900 text-white py-5 md:py-6 rounded-2xl md:rounded-3xl font-black text-[9px] md:text-[10px] uppercase tracking-[0.3em] md:tracking-[0.4em] italic shadow-2xl hover:bg-amber-600 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 md:gap-4 mt-4"
                  >
                    {buying ? <Loader2 className="animate-spin" size={18} /> : <>Commit Transaction <ArrowRight size={18}/></>}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {status.message && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[400] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white p-8 md:p-16 rounded-[2.5rem] md:rounded-[4rem] max-w-xl w-full text-center shadow-[0_0_100px_rgba(0,0,0,0.3)] relative border border-slate-100 overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-full h-2 ${status.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
              <div className={`w-20 h-20 md:w-32 md:h-32 rounded-[2rem] md:rounded-[3rem] mx-auto mb-8 md:mb-12 flex items-center justify-center shadow-2xl ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600 shadow-emerald-500/20' : 'bg-rose-50 text-rose-600 shadow-rose-500/20'}`}>
                {status.type === 'success' ? <CheckCircle2 size={40} md:size={64} strokeWidth={1.5} /> : <AlertCircle size={40} md:size={64} strokeWidth={1.5} />}
              </div>
              <h3 className="text-2xl md:text-4xl font-black text-slate-900 mb-4 md:mb-6 tracking-tighter uppercase italic leading-none">{status.type === 'success' ? 'Protocol Success' : 'Error Detected'}</h3>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 md:p-8 mb-10 md:mb-16">
                <p className="text-slate-500 text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] italic leading-relaxed">{status.message}</p>
              </div>
              <button onClick={() => setStatus({ type: '', message: '' })} className="w-full bg-slate-900 text-white py-6 md:py-8 rounded-2xl md:rounded-[2.5rem] font-black text-[10px] md:text-[11px] uppercase tracking-[0.3em] hover:bg-amber-600 transition-all shadow-2xl italic active:scale-[0.98]">Acknowledge & Close</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Shop;
