import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, ArrowLeft, Loader2, Eye, EyeOff, Shield, Zap, Timer, CheckCircle, Gift, Sparkles, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';

const containerVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

const Login = () => {
  // Authentication Step: 'credentials' or 'otp'
  const [step, setStep] = useState('credentials');
  
  // Credentials Step States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // OTP Verification Step States
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [expiryTimer, setExpiryTimer] = useState(600); // 10 minutes session
  const [resendTimeout, setResendTimeout] = useState(0); // 60 seconds rate limit
  const otpRefs = useRef([]);

  // General States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [offers, setOffers] = useState([]);
  const [pendingUser, setPendingUser] = useState(null);
  
  const navigate = useNavigate();

  // Active offers shown as a banner directly on the login page
  const [bannerOffers, setBannerOffers] = useState([]);
  useEffect(() => {
    axios.get(`${API_BASE_URL}/offers/active.php`)
      .then(res => { if (res.data?.status === 'success') setBannerOffers(res.data.data || []); })
      .catch(() => {});
  }, []);

  // Expiration Countdowns
  useEffect(() => {
    let interval = null;
    if (step === 'otp' && resendTimeout > 0) {
      interval = setInterval(() => {
        setResendTimeout((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimeout]);

  useEffect(() => {
    let interval = null;
    if (step === 'otp' && expiryTimer > 0) {
      interval = setInterval(() => {
        setExpiryTimer((prev) => prev - 1);
      }, 1000);
    } else if (expiryTimer === 0 && step === 'otp') {
      setError('Verification session expired. Please re-enter your credentials.');
      setStep('credentials');
    }
    return () => clearInterval(interval);
  }, [step, expiryTimer]);

  // Segmented input helper functions
  const handleOtpChange = (element, index) => {
    const value = element.value.replace(/[^0-9]/g, '');
    let newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input box
    if (value && index < 5) {
      otpRefs.current[index + 1].focus();
    }

    // Auto-verify if all 6 digits are typed
    const finalOtp = newOtp.join('');
    if (finalOtp.length === 6) {
      triggerVerification(finalOtp);
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        let newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        otpRefs.current[index - 1].focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').substring(0, 6);
    if (pasteData.length === 6) {
      const newOtp = pasteData.split('');
      setOtp(newOtp);
      otpRefs.current[5].focus();
      triggerVerification(pasteData);
    }
  };

  // User role-based routing
  const redirectUser = (user) => {
    if (user.role === 'admin') navigate('/admin');
    else if (user.role === 'manager') navigate('/manager');
    else if (user.role === 'staff') navigate('/admin'); // permission-filtered admin dashboard
    else if (user.role === 'advocate') navigate('/advocate');
    else navigate('/dashboard');
  };

  // After a successful login, show any active festival/offer popups before entering the app.
  const proceedAfterLogin = async (user) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/offers/active.php`);
      const list = res.data?.status === 'success' ? (res.data.data || []) : [];
      if (list.length > 0) {
        setOffers(list);
        setPendingUser(user);
        return; // popup dismissal triggers the redirect
      }
    } catch (err) {
      // offers are non-critical — never block login on them
    }
    redirectUser(user);
  };

  // Phase 1: Credentials submission (Initiate OTP Login)
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login.php`, {
        email,
        password
      });

      if (response.data.status === 'otp_required') {
        setStep('otp');
        setExpiryTimer(600); // 10 minutes session
        setResendTimeout(60); // 60s resend cooldown
        setOtp(['', '', '', '', '', '']);
        setSuccessMessage(response.data.message || 'Security code dispatched!');
        
        // Focus first input field
        setTimeout(() => {
          if (otpRefs.current[0]) otpRefs.current[0].focus();
        }, 150);
      } else if (response.data.status === 'success') {
        // Fallback safety block
        const user = response.data.user;
        localStorage.setItem('user', JSON.stringify(user));
        proceedAfterLogin(user);
      } else {
        setError(response.data.message || 'Login failed. Please check your details.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Phase 2: Verify OTP submission
  const triggerVerification = async (otpValue) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/verify_login_otp.php`, {
        email,
        otp: otpValue
      });

      if (response.data.status === 'success') {
        const user = response.data.user;
        localStorage.setItem('user', JSON.stringify(user));
        setSuccessMessage('Secure verification successful. Welcoming user...');
        setError('');
        
        setTimeout(() => {
          proceedAfterLogin(user);
        }, 1200);
      } else {
        setError(response.data.message || 'Incorrect verification code.');
        // Select last field for quick correction
        if (otpRefs.current[5]) otpRefs.current[5].select();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification communication node failure.');
    } finally {
      setLoading(false);
    }
  };

  // Verify button click wrapper
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    const finalOtp = otp.join('');
    if (finalOtp.length !== 6) {
      setError('Please input the full 6-digit security code.');
      return;
    }
    triggerVerification(finalOtp);
  };

  // Rate-limited OTP resend
  const handleResendOtp = async () => {
    if (resendTimeout > 0) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/resend_login_otp.php`, {
        email
      });

      if (response.data.status === 'success') {
        setSuccessMessage('A fresh login code has been dispatched.');
        setResendTimeout(60);
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => {
          if (otpRefs.current[0]) otpRefs.current[0].focus();
        }, 150);
      } else {
        setError(response.data.message || 'Failed to dispatch new code.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to communicate with resend server.');
    } finally {
      setLoading(false);
    }
  };

  // Format countdown string MM:SS
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const offerColors = {
    blue:    { bar: 'bg-blue-600',    soft: 'bg-blue-50 text-blue-700 border-blue-100',       ring: 'from-blue-600 to-blue-900' },
    amber:   { bar: 'bg-amber-500',   soft: 'bg-amber-50 text-amber-700 border-amber-100',    ring: 'from-amber-500 to-amber-700' },
    emerald: { bar: 'bg-emerald-500', soft: 'bg-emerald-50 text-emerald-700 border-emerald-100', ring: 'from-emerald-500 to-emerald-700' },
    red:     { bar: 'bg-red-500',     soft: 'bg-red-50 text-red-700 border-red-100',          ring: 'from-red-500 to-red-700' },
    purple:  { bar: 'bg-purple-500',  soft: 'bg-purple-50 text-purple-700 border-purple-100', ring: 'from-purple-500 to-purple-700' },
  };
  const dismissOffers = () => {
    const u = pendingUser;
    setOffers([]);
    setPendingUser(null);
    if (u) redirectUser(u);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-blue-900 flex items-center justify-center p-4 md:p-6 font-inter relative overflow-hidden selection:bg-amber-100 selection:text-amber-900">
      {/* Festival / Offer popup shown right after login */}
      <AnimatePresence>
        {offers.length > 0 && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={dismissOffers} className="absolute inset-0 bg-blue-950/70 backdrop-blur-md" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              {(() => { const c = offerColors[offers[0].color] || offerColors.blue; return (
                <div className={`h-2 w-full ${c.bar}`} />
              ); })()}
              <button onClick={dismissOffers} className="absolute top-5 right-5 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-blue-950 transition-all z-10">
                <X size={18} />
              </button>
              <div className="p-8 md:p-10 overflow-y-auto custom-scrollbar space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg"><Gift size={24} /></div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Vamanan Enterprises V</p>
                    <h3 className="text-lg font-black text-blue-950 uppercase italic tracking-tight leading-none">Special Offers</h3>
                  </div>
                </div>
                {offers.map((o) => {
                  const c = offerColors[o.color] || offerColors.blue;
                  return (
                    <div key={o.id} className="border border-slate-100 rounded-[1.75rem] p-6 shadow-sm bg-slate-50/50">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${c.soft} italic mb-3`}>
                        <Sparkles size={11} /> {o.badge || 'OFFER'}
                      </span>
                      {o.image && <img src={o.image} alt={o.title} className="w-full rounded-2xl mb-3 object-cover max-h-48" />}
                      <h4 className="text-xl font-black text-blue-950 italic tracking-tight leading-tight">{o.title}</h4>
                      {o.message && <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">{o.message}</p>}
                      {o.ends_at && <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-3 italic">Valid till {new Date(o.ends_at).toLocaleDateString()}</p>}
                    </div>
                  );
                })}
              </div>
              <div className="p-6 border-t border-slate-100">
                <button onClick={dismissOffers} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-blue-700 transition-all shadow-xl active:scale-[0.98] italic">
                  Continue to Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Institutional Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-amber-500/10 blur-[100px] md:blur-[150px] -z-10 rounded-full animate-pulse"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        className="w-full max-w-lg bg-white border border-slate-200 p-8 md:p-14 rounded-[2.5rem] md:rounded-[4rem] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.08)] relative z-10"
      >
        {/* Navigation Control / Return Button */}
        {step === 'credentials' ? (
          <Link to="/" className="absolute left-8 top-8 md:left-10 md:top-10 p-2.5 md:p-3 bg-slate-50 rounded-xl md:rounded-2xl transition-all text-slate-400 hover:text-blue-900 border border-slate-200 shadow-sm active:scale-95 group">
             <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
        ) : (
          <button 
            type="button"
            onClick={() => {
              setStep('credentials');
              setError('');
              setSuccessMessage('');
            }} 
            className="absolute left-8 top-8 md:left-10 md:top-10 p-2.5 md:p-3 bg-slate-50 rounded-xl md:rounded-2xl transition-all text-slate-400 hover:text-blue-900 border border-slate-200 shadow-sm active:scale-95 group"
          >
             <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          </button>
        )}

        <div className="text-center mb-10 md:mb-12 mt-6 md:mt-8">
          <motion.div 
            initial={{ rotate: -5, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-28 h-28 md:w-32 md:h-32 mx-auto mb-5 md:mb-6 flex items-center justify-center p-5 bg-blue-900 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl relative group overflow-hidden"
          >
             <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
             <img
               src="/vamanan-logo.png"
               alt="Vamanan Enterprises V"
               className="w-full h-full object-contain relative z-10 brightness-110"
             />
          </motion.div>

          <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic leading-none mb-1">
            <span className="text-blue-900">Vamanan </span><span className="text-amber-600">Enterprises V</span>
          </h1>
          <div className="flex items-center justify-center gap-2 mb-5 md:mb-7">
            <div className="w-8 h-px bg-amber-500"></div>
            <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Institutional Portal</span>
            <div className="w-8 h-px bg-amber-500"></div>
          </div>

          {/* Active offers banner */}
          {bannerOffers.length > 0 && (
            <div className="mb-6 space-y-2">
              {bannerOffers.slice(0, 2).map(o => (
                <div key={o.id} className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-left">
                  <Gift size={16} className="text-amber-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-amber-700 uppercase italic tracking-wide truncate">{o.title}</p>
                    {o.message && <p className="text-[9px] font-bold text-amber-600/80 truncate">{o.message}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <h2 className="text-xl md:text-2xl font-black text-blue-900 tracking-tighter mb-2 uppercase italic leading-none">
            {step === 'credentials' ? 'Log In' : 'Verify OTP'}
          </h2>
          <p className="text-slate-400 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] italic">
            {step === 'credentials' ? 'Welcome back, please log in' : 'Enter the code sent to you'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              key="error-box"
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-blue-50 border border-blue-100 text-blue-600 p-5 md:p-6 rounded-2xl md:rounded-3xl text-[9px] md:text-[10px] mb-8 text-center font-black uppercase tracking-widest italic shadow-lg shadow-blue-500/5 flex items-center justify-center gap-3"
            >
              <Shield size={14} className="shrink-0 animate-bounce" />
              <span>{error}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div 
              key="success-box"
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-amber-50 border border-amber-100 text-amber-600 p-5 md:p-6 rounded-2xl md:rounded-3xl text-[9px] md:text-[10px] mb-8 text-center font-black uppercase tracking-widest italic shadow-lg shadow-amber-500/5 flex items-center justify-center gap-3"
            >
              <CheckCircle size={14} className="shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {step === 'credentials' ? (
            <motion.form 
              key="login-credentials"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.25 }}
              onSubmit={handleLogin} 
              className="space-y-6 md:space-y-8"
            >
              <div className="space-y-2 md:space-y-3">
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Email-ID</label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 flex items-center justify-center border-r border-slate-100 mr-4">
                    <Mail className="text-slate-300 group-focus-within:text-amber-600 transition-colors" size={18} />
                  </div>
                  <input 
                    type="email" 
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Your Email ID" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.2rem] md:rounded-[1.5rem] py-5 md:py-6 pl-16 pr-8 outline-none focus:border-amber-600 focus:bg-white transition-all text-sm text-blue-900 font-black italic tracking-tight shadow-inner placeholder:text-slate-300" 
                  />
                </div>
              </div>
              
              <div className="space-y-2 md:space-y-3">
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 flex items-center justify-center border-r border-slate-100 mr-4">
                    <Lock className="text-slate-300 group-focus-within:text-amber-600 transition-colors" size={18} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Your PassKey" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-[1.2rem] md:rounded-[1.5rem] py-5 md:py-6 pl-16 pr-16 outline-none focus:border-amber-600 focus:bg-white transition-all text-sm text-blue-900 font-black italic tracking-widest shadow-inner placeholder:text-slate-300" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-amber-600 transition-colors p-2"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between px-2">
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Secure</span>
                 </div>
                 <Link to="/recovery" className="text-[8px] md:text-[9px] font-black text-amber-600 uppercase tracking-widest italic hover:text-blue-900 transition-colors">Recover Key?</Link>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 text-white py-6 md:py-8 rounded-[1.5rem] md:rounded-[2rem] font-black flex items-center justify-center gap-3 md:gap-4 hover:bg-blue-700 transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-[11px] italic group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                {loading ? <Loader2 className="animate-spin" size={20} /> : <>Continue <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" /></>}
              </button>
            </motion.form>
          ) : (
            <motion.form 
              key="login-otp"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.25 }}
              onSubmit={handleVerifyOtp}
              className="space-y-8"
            >
              <div className="text-center space-y-3">
                <p className="text-xs text-slate-600 font-semibold leading-relaxed px-4">
                  We have dispatched a 6-digit secure OTP code to: <br/>
                  <strong className="text-slate-950 font-black italic tracking-wide break-all">{email}</strong>
                </p>
                <p className="text-[8px] md:text-[9px] text-slate-400 font-black uppercase tracking-widest italic">
                  Input code below to complete session synchronization
                </p>
              </div>

              {/* Segmented OTP Boxes */}
              <div className="flex justify-between items-center gap-2 max-w-sm mx-auto my-6 px-1">
                {otp.map((data, index) => (
                  <input
                    key={index}
                    type="text"
                    name={`otp-box-${index}`}
                    ref={(el) => (otpRefs.current[index] = el)}
                    maxLength={1}
                    value={data}
                    onPaste={handleOtpPaste}
                    onChange={(e) => handleOtpChange(e.target, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    className="w-12 h-14 sm:w-14 sm:h-16 text-center text-lg sm:text-xl font-black bg-slate-50 text-slate-950 border border-slate-200 rounded-xl sm:rounded-2xl outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all shadow-inner"
                  />
                ))}
              </div>

              {/* Real-time Expiration Timer */}
              <div className="flex items-center justify-center gap-2 py-3 px-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 max-w-xs mx-auto">
                <Timer size={14} className="text-amber-600 shrink-0" />
                <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest italic">
                  Session Expiry: <strong className="font-mono tracking-tight font-black ml-1 text-xs">{formatTime(expiryTimer)}</strong>
                </span>
              </div>

              <div className="space-y-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-6 md:py-8 rounded-[1.5rem] md:rounded-[2rem] font-black flex items-center justify-center gap-3 md:gap-4 hover:bg-blue-700 transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-[11px] italic group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <>Verify & Log In <Zap size={14} className="text-amber-400 shrink-0" /></>}
                </button>

                {/* Resend Controller */}
                <div className="text-center pt-2">
                  {resendTimeout > 0 ? (
                    <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest italic">
                      Resend dynamic code in <strong className="font-mono text-slate-600 ml-1">{resendTimeout}s</strong>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-[9px] md:text-[10px] font-black text-amber-600 uppercase tracking-widest italic hover:text-blue-900 transition-colors border-b border-dashed border-amber-500 hover:border-blue-900 pb-0.5"
                    >
                      Resend Verification Code
                    </button>
                  )}
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-10 md:mt-12 pt-8 border-t border-slate-100 text-center">
           <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] italic">
            First Entry? <Link to="/register" className="text-amber-600 hover:text-blue-900 transition-colors underline decoration-amber-500/30 underline-offset-4 ml-1">Register Now</Link>
          </p>
        </div>
      </motion.div>

      <div className="absolute bottom-6 md:bottom-10 left-0 w-full text-center">
         <p className="text-[8px] md:text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] md:tracking-[0.5em] italic">Secured by Vamanan Enterprises • © 2026</p>
      </div>
    </div>
  );
};

export default Login;
