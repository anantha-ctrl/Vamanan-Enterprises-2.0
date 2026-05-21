import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, ArrowLeft, Loader2, Eye, EyeOff, Shield, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login.php`, {
        email,
        password
      });

      if (response.data.status === 'success') {
        const user = response.data.user;
        localStorage.setItem('user', JSON.stringify(user));
        if (user.role === 'admin') navigate('/admin');
        else if (user.role === 'manager') navigate('/manager');
        else if (user.role === 'staff') navigate('/staff');
        else if (user.role === 'advocate') navigate('/advocate');
        else navigate('/dashboard');
      } else {
        setError(response.data.message || 'Authentication protocol failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Synchronization error. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 flex items-center justify-center p-4 md:p-6 font-inter relative overflow-hidden selection:bg-amber-100 selection:text-amber-900">
      {/* Institutional Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-amber-500/10 blur-[100px] md:blur-[150px] -z-10 rounded-full animate-pulse"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        className="w-full max-w-lg bg-white border border-slate-200 p-8 md:p-14 rounded-[2.5rem] md:rounded-[4rem] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.08)] relative z-10"
      >
        {/* Navigation Control */}
        <Link to="/" className="absolute left-8 top-8 md:left-10 md:top-10 p-2.5 md:p-3 bg-slate-50 rounded-xl md:rounded-2xl transition-all text-slate-400 hover:text-slate-900 border border-slate-200 shadow-sm active:scale-95 group">
           <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        </Link>

        <div className="text-center mb-10 md:mb-12 mt-6 md:mt-8">
          <motion.div 
            initial={{ rotate: -5, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 md:mb-8 flex items-center justify-center p-4 bg-slate-900 rounded-[1.8rem] md:rounded-[2rem] shadow-2xl relative group overflow-hidden"
          >
             <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
             <img 
               src="/vamanan-logo.png" 
               alt="Vamanan Enterprises" 
               className="w-full h-full object-contain relative z-10 brightness-110"
             />
          </motion.div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter mb-2 md:mb-3 uppercase italic leading-none">Access Login Gateway</h2>
          <p className="text-slate-400 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] italic">Institutional Security Protocol</p>
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
        </AnimatePresence>

        <form onSubmit={handleLogin} className="space-y-6 md:space-y-8">
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
                className="w-full bg-slate-50 border border-slate-200 rounded-[1.2rem] md:rounded-[1.5rem] py-5 md:py-6 pl-16 pr-8 outline-none focus:border-amber-600 focus:bg-white transition-all text-sm text-slate-900 font-black italic tracking-tight shadow-inner placeholder:text-slate-300" 
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
                className="w-full bg-slate-50 border border-slate-200 rounded-[1.2rem] md:rounded-[1.5rem] py-5 md:py-6 pl-16 pr-16 outline-none focus:border-amber-600 focus:bg-white transition-all text-sm text-slate-900 font-black italic tracking-widest shadow-inner placeholder:text-slate-300" 
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
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Node Sync Active</span>
             </div>
             <Link to="/recovery" className="text-[8px] md:text-[9px] font-black text-amber-600 uppercase tracking-widest italic hover:text-slate-900 transition-colors">Recover Key?</Link>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white py-6 md:py-8 rounded-[1.5rem] md:rounded-[2rem] font-black flex items-center justify-center gap-3 md:gap-4 hover:bg-amber-600 transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-[11px] italic group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
            {loading ? <Loader2 className="animate-spin" size={20} /> : <>Login Now <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" /></>}
          </button>
        </form>

        <div className="mt-10 md:mt-12 pt-8 border-t border-slate-100 text-center">
           <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] italic">
            First Entry? <Link to="/register" className="text-amber-600 hover:text-slate-900 transition-colors underline decoration-amber-500/30 underline-offset-4 ml-1">Register Now</Link>
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
