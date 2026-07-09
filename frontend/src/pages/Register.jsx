import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, Lock, Users, ArrowRight, ArrowLeft, Loader2, CheckCircle, Eye, EyeOff, ShieldCheck, Shield, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', referral_code: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register.php`, formData);
      if (response.data.status === 'success') {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 5000);
      } else {
        setError(response.data.message || 'Identity creation failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Synchronization error. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-blue-900 flex items-center justify-center p-4 md:p-6 font-inter relative overflow-hidden selection:bg-amber-100 selection:text-amber-900">
      {/* Institutional Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[700px] h-[400px] md:h-[700px] bg-amber-500/10 blur-[120px] md:blur-[180px] -z-10 rounded-full animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        className="w-full max-w-xl bg-white border border-slate-200 p-8 md:p-14 rounded-[2.5rem] md:rounded-[4rem] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.08)] relative z-10"
      >
        {/* Navigation Control */}
        <Link to="/" className="absolute left-8 top-8 md:left-10 md:top-10 p-2.5 md:p-3 bg-slate-50 rounded-xl md:rounded-2xl transition-all text-slate-400 hover:text-blue-900 border border-slate-200 shadow-sm active:scale-95 group">
           <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        </Link>

        <div className="text-center mb-10 md:mb-12 mt-6 md:mt-8">
          <motion.div 
            initial={{ rotate: 5, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-28 h-28 md:w-32 md:h-32 mx-auto mb-5 md:mb-6 p-5 bg-blue-900 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl relative group overflow-hidden flex items-center justify-center"
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
          <div className="flex items-center justify-center gap-2 mb-5">
            <div className="w-8 h-px bg-amber-500"></div>
            <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] italic">Create your account</span>
            <div className="w-8 h-px bg-amber-500"></div>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-blue-900 tracking-tighter uppercase mb-2 italic leading-none">Register</h2>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="text-center py-10 md:py-16"
            >
              <div className="w-24 h-24 md:w-28 md:h-28 bg-amber-50 text-amber-500 rounded-[2.5rem] md:rounded-[3rem] flex items-center justify-center mx-auto mb-8 md:mb-10 shadow-2xl shadow-amber-500/10 border border-amber-100 relative">
                 <div className="absolute inset-0 bg-amber-500/20 animate-ping rounded-[3rem] -z-10"></div>
                 <CheckCircle size={48} md:size={56} className="animate-bounce" strokeWidth={1.5} />
              </div>
              <h3 className="text-2xl md:text-3xl font-black mb-3 md:mb-4 text-blue-900 italic tracking-tighter uppercase leading-none">Registration Pending</h3>
              <p className="text-slate-400 text-[10px] md:text-[11px] font-black uppercase tracking-widest leading-relaxed px-6 md:px-10 italic">
                Your institutional registration is complete. Your account is currently pending admin approval. Please check back later.
              </p>
            </motion.div>
          ) : (
            <motion.form 
              key="form"
              onSubmit={handleRegister} 
              className="space-y-6 md:space-y-8"
            >
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="bg-blue-50 border border-blue-100 text-blue-600 p-5 md:p-6 rounded-2xl md:rounded-3xl text-[9px] md:text-[10px] text-center font-black uppercase tracking-widest italic shadow-lg shadow-blue-500/5 flex items-center justify-center gap-3"
                >
                   <Shield size={14} className="shrink-0" />
                   <span>{error}</span>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                 <div className="space-y-2 md:space-y-3">
                   <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Full Name</label>
                   <div className="relative group">
                     <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 flex items-center justify-center border-r border-slate-100 mr-4">
                        <User className="text-slate-300 group-focus-within:text-amber-600 transition-colors" size={18} />
                     </div>
                     <input 
                       type="text" 
                       required
                       placeholder="Enter Your Name..." 
                       value={formData.name}
                       onChange={(e) => setFormData({...formData, name: e.target.value})}
                       className="w-full bg-slate-50 border border-slate-200 rounded-[1.2rem] md:rounded-[1.5rem] py-5 md:py-6 pl-16 pr-8 outline-none focus:border-amber-600 focus:bg-white transition-all text-sm text-blue-900 font-black italic tracking-tight shadow-inner placeholder:text-slate-300" 
                     />
                   </div>
                 </div>

                 <div className="space-y-2 md:space-y-3">
                   <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Email-ID</label>
                   <div className="relative group">
                     <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 flex items-center justify-center border-r border-slate-100 mr-4">
                        <Mail className="text-slate-300 group-focus-within:text-amber-600 transition-colors" size={18} />
                     </div>
                     <input 
                       type="email" 
                       required
                       placeholder="Enter Your Email ID..." 
                       value={formData.email}
                       onChange={(e) => setFormData({...formData, email: e.target.value})}
                       className="w-full bg-slate-50 border border-slate-200 rounded-[1.2rem] md:rounded-[1.5rem] py-5 md:py-6 pl-16 pr-8 outline-none focus:border-amber-600 focus:bg-white transition-all text-sm text-blue-900 font-black italic tracking-tight shadow-inner placeholder:text-slate-300" 
                     />
                   </div>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-2 md:space-y-3">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Phone Number</label>
                    <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 flex items-center justify-center border-r border-slate-100 mr-4">
                         <Phone className="text-slate-300 group-focus-within:text-amber-600 transition-colors" size={18} />
                      </div>
                      <input 
                        type="tel" 
                        required
                        placeholder="Mobile Number..." 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-[1.2rem] md:rounded-[1.5rem] py-5 md:py-6 pl-16 pr-8 outline-none focus:border-amber-600 focus:bg-white transition-all text-sm text-blue-900 font-black italic tracking-tight shadow-inner placeholder:text-slate-300" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:space-y-3">
                    <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Security Password</label>
                    <div className="relative group">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 flex items-center justify-center border-r border-slate-100 mr-4">
                         <Lock className="text-slate-300 group-focus-within:text-amber-600 transition-colors" size={18} />
                      </div>
                      <input 
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Security Password..." 
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-[1.2rem] md:rounded-[1.5rem] py-5 md:py-6 pl-16 pr-14 outline-none focus:border-amber-600 focus:bg-white transition-all text-sm text-blue-900 font-black italic tracking-widest shadow-inner placeholder:text-slate-300" 
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
              </div>

              <div className="space-y-2 md:space-y-3">
                   <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic ml-1">Referral Code (Optional)</label>
                   <div className="relative group">
                     <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 flex items-center justify-center border-r border-slate-100 mr-4">
                        <Users className="text-slate-300 group-focus-within:text-amber-600 transition-colors" size={18} />
                     </div>
                     <input 
                       type="text" 
                       placeholder="Referral Code..." 
                       value={formData.referral_code}
                       onChange={(e) => setFormData({...formData, referral_code: e.target.value})}
                       className="w-full bg-slate-50 border border-slate-200 rounded-[1.2rem] md:rounded-[1.5rem] py-5 md:py-6 pl-16 pr-8 outline-none focus:border-amber-600 focus:bg-white transition-all text-sm text-blue-900 font-black italic tracking-tight shadow-inner placeholder:text-slate-300" 
                     />
                   </div>
              </div>

              <div className="flex items-center gap-4 px-5 py-5 md:py-6 bg-slate-50 rounded-[1.2rem] md:rounded-[1.5rem] border border-slate-200 shadow-inner">
                 <ShieldCheck size={18} md:size={20} className="text-amber-600 shrink-0" strokeWidth={2.5} />
                 <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-relaxed">Your information is kept safe and secure</span>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 text-white py-6 md:py-8 rounded-[1.5rem] md:rounded-[2rem] font-black flex items-center justify-center gap-3 md:gap-4 hover:bg-blue-700 transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-[11px] italic group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                {loading ? <Loader2 className="animate-spin" size={20} /> : <>Register Now <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" /></>}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-10 md:mt-12 pt-8 border-t border-slate-100 text-center">
           <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] italic leading-none">
            Already have an account? <Link to="/login" className="text-amber-600 hover:text-blue-900 transition-colors underline decoration-amber-500/30 underline-offset-4 ml-1">Log In</Link>
          </p>
        </div>
      </motion.div>      
      {/* <div className="absolute bottom-6 md:bottom-10 left-0 w-full text-center">
         <p className="text-[8px] md:text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] md:tracking-[0.5em] italic">Vamanan Enterprises Infrastructure • © 2026</p>
      </div> */}
    </div>
  );
};

export default Register;
