import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ShieldCheck, ArrowRight, ArrowLeft, Loader2, CheckCircle, Key, RefreshCcw, Shield, Zap, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';

const Recovery = () => {
  const [step, setStep] = useState('request'); // 'request', 'verify', 'reset'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [receivedOtp, setReceivedOtp] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/forgot_password.php`, { email });
      if (res.data.status === 'success') {
        setSuccess(res.data.message);
        setReceivedOtp(res.data.otp);
        setStep('verify');
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Communication failed. Check network connectivity.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/verify_otp.php`, { email, otp });
      if (res.data.status === 'success') {
        setStep('reset');
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Verification node unreachable.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passphrase mismatch detected.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/reset_password.php`, { email, otp, new_password: newPassword });
      if (res.data.status === 'success') {
        setSuccess(res.data.message);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError("Protocol reset failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 flex items-center justify-center p-4 md:p-6 font-inter relative overflow-hidden selection:bg-amber-100 selection:text-amber-900">
      {/* Institutional Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-amber-500/10 blur-[100px] md:blur-[150px] -z-10 rounded-full animate-pulse"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        className="w-full max-w-lg bg-white border border-slate-200 p-8 md:p-14 rounded-[2.5rem] md:rounded-[4rem] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.08)] relative z-10"
      >
        {/* Navigation Control */}
        <button 
          onClick={() => step === 'request' ? navigate('/login') : setStep(step === 'verify' ? 'request' : 'verify')} 
          className="absolute left-8 top-8 md:left-10 md:top-10 p-2.5 md:p-3 bg-slate-50 rounded-xl md:rounded-2xl transition-all text-slate-400 hover:text-slate-900 border border-slate-200 shadow-sm active:scale-95 group"
        >
           <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        </button>

        <div className="text-center mb-10 md:mb-12 mt-6 md:mt-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 md:mb-8 flex items-center justify-center p-4 bg-slate-900 rounded-[1.8rem] md:rounded-[2rem] shadow-2xl relative group overflow-hidden"
          >
             <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent"></div>
             <Key size={32} className="text-amber-500 relative z-10 animate-pulse" />
          </motion.div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter mb-2 md:mb-3 uppercase italic leading-none">Security Recovery</h2>
          <p className="text-slate-400 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] italic">Identity Access Restoration Node</p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-rose-50 border border-rose-100 text-rose-600 p-5 md:p-6 rounded-2xl md:rounded-3xl text-[9px] md:text-[10px] mb-8 text-center font-black uppercase tracking-widest italic shadow-lg shadow-rose-500/5 flex items-center justify-center gap-3"
            >
              <Shield size={14} className="shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && step !== 'reset' && (
             <motion.div 
               initial={{ opacity: 0, y: -10 }} 
               animate={{ opacity: 1, y: 0 }} 
               className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-5 md:p-6 rounded-2xl md:rounded-3xl text-[9px] md:text-[10px] mb-8 text-center font-black uppercase tracking-widest italic flex items-center justify-center gap-3"
             >
               <CheckCircle size={14} className="shrink-0" />
               <span>{success}</span>
             </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {step === 'request' && (
            <motion.form 
              key="request"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleRequestOTP} 
              className="space-y-8"
            >
              <div className="space-y-3">
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Account Identity (Email)</label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 flex items-center justify-center border-r border-slate-100 mr-4">
                    <Mail className="text-slate-300 group-focus-within:text-amber-600 transition-colors" size={18} />
                  </div>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Verified Email" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.2rem] md:rounded-[1.5rem] py-5 md:py-6 pl-16 pr-8 outline-none focus:border-amber-600 focus:bg-white transition-all text-sm text-slate-900 font-black italic tracking-tight shadow-inner" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-slate-900 text-white py-6 md:py-8 rounded-[1.5rem] md:rounded-[2rem] font-black flex items-center justify-center gap-3 md:gap-4 hover:bg-amber-600 transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-11px italic group"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <>Generate Verification Code <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" /></>}
              </button>
            </motion.form>
          )}

          {step === 'verify' && (
            <motion.form 
              key="verify"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleVerifyOTP} 
              className="space-y-8"
            >
              <div className="space-y-6 text-center">
                <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-5"><Zap size={40} className="text-amber-600" /></div>
                   <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 italic">Institutional Sync Code</p>
                   <p className="text-4xl font-black text-slate-900 tracking-[0.2em] italic">{receivedOtp || '------'}</p>
                   <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-2 italic">Automated protocol verification active</p>
                </div>

                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-relaxed">Enter the above code to verify your identity</label>
                <input 
                  type="text" 
                  maxLength="6"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-[1.5rem] py-6 text-center text-3xl font-black text-slate-900 tracking-[0.5em] outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner italic" 
                  placeholder="000000"
                />
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-slate-900 text-white py-6 md:py-8 rounded-[1.5rem] md:rounded-[2rem] font-black flex items-center justify-center gap-3 md:gap-4 hover:bg-emerald-600 transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-11px italic group"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <>Verify Identity <ShieldCheck size={20} /></>}
                </button>
                <button 
                  type="button"
                  onClick={() => setStep('request')}
                  className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic hover:text-amber-600 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCcw size={12} /> Request New Protocol Code
                </button>
              </div>
            </motion.form>
          )}

          {step === 'reset' && (
            <motion.form 
              key="reset"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleResetPassword} 
              className="space-y-8"
            >
              <div className="space-y-3">
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">New Access Passphrase</label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 flex items-center justify-center border-r border-slate-100 mr-4">
                    <Lock className="text-slate-300 group-focus-within:text-amber-600 transition-colors" size={18} />
                  </div>
                  <input 
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Create New Key" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.2rem] md:rounded-[1.5rem] py-5 md:py-6 pl-16 pr-16 outline-none focus:border-amber-600 focus:bg-white transition-all text-sm text-slate-900 font-black italic tracking-widest shadow-inner placeholder:text-slate-300" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-amber-600 transition-colors p-2"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Confirm Protocol Key</label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 flex items-center justify-center border-r border-slate-100 mr-4">
                    <ShieldCheck className="text-slate-300 group-focus-within:text-amber-600 transition-colors" size={18} />
                  </div>
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter New Key" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.2rem] md:rounded-[1.5rem] py-5 md:py-6 pl-16 pr-16 outline-none focus:border-amber-600 focus:bg-white transition-all text-sm text-slate-900 font-black italic tracking-widest shadow-inner placeholder:text-slate-300" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-amber-600 transition-colors p-2"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-slate-900 text-white py-6 md:py-8 rounded-[1.5rem] md:rounded-[2rem] font-black flex items-center justify-center gap-3 md:gap-4 hover:bg-amber-600 transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-11px italic group"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <>Commit Protocol Reset <CheckCircle size={20} /></>}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-10 md:mt-12 pt-8 border-t border-slate-100 text-center">
           <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] italic">
            Remembered Key? <Link to="/login" className="text-amber-600 hover:text-slate-900 transition-colors underline decoration-amber-500/30 underline-offset-4 ml-1">Return to Authentication</Link>
          </p>
        </div>
      </motion.div>

      <div className="absolute bottom-6 md:bottom-10 left-0 w-full text-center">
         <p className="text-[8px] md:text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] md:tracking-[0.5em] italic">Vamanan Enterprises Infrastructure • © 2026</p>
      </div>
    </div>
  );
};

export default Recovery;
