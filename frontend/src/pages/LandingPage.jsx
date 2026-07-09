import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, TrendingUp, Award, ArrowRight, Globe, Lock,
  Smartphone, PieChart, Zap, ChevronDown, Plus, Minus,
  Menu, X, Shield, Landmark, Crown, Star, CheckCircle2, ChevronRight, Activity, Users
} from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../config';

// Premium Counter Component
const CountUp = ({ value, prefix = "", suffix = "" }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = parseInt(value.toString().replace(/[^0-9]/g, ''));
      if (isNaN(end)) {
        setDisplayValue(value);
        return;
      }
      if (start === end) return;

      let totalDuration = 2000;
      let increment = end / (totalDuration / 16);

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setDisplayValue(end);
          clearInterval(timer);
        } else {
          setDisplayValue(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue}{suffix}
    </span>
  );
};

const LandingPage = () => {
  const [activeFaq, setActiveFaq] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    investors: 1200,
    goldValue: 15,
    dailyPayouts: 4.5,
    currentGoldRate: 0
  });
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const scale = useSpring(useTransform(scrollYProgress, [0, 0.2], [1, 1.05]), { stiffness: 100, damping: 30 });

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/public/stats.php`);
      if (res.data.status === 'success') {
        setStats({
          investors: parseInt(res.data.data.investors) || 1200,
          goldValue: parseInt(res.data.data.goldValue) || 15,
          dailyPayouts: parseFloat(res.data.data.dailyPayouts) || 4.5,
          currentGoldRate: res.data.data.currentGoldRate || 0
        });
      }
    } catch (err) {
      console.error("Stats fetch failed");
    }
  };

  const faqs = [
    { q: "Is Vamanan Enterprises V safe?", a: "Yes, 100%. All gold is BIS Hallmarked and stored in insured, bank-grade vaults under institutional custody." },
    { q: "How do I earn 1% daily?", a: "When you acquire gold through our terminal, it initiates an automated investment cycle that yields 1% diurnals for 100 cycles." },
    { q: "What is the referral hierarchy?", a: "We operate a 5-tier referral matrix: Level 1 (0.2%), Level 2 (0.1%), Level 3 (0.1%), Level 4 (0.05%), and Level 5 (0.05%) commissions." },
    { q: "Can I liquidate my earnings instantly?", a: "Yes, upon reaching the institutional threshold of ₹500, you can initialize a bridge transfer to your verified bank account." }
  ];

  return (
    <div className="min-h-screen bg-[#fafafa] text-blue-900 font-inter overflow-x-hidden relative selection:bg-amber-100 selection:text-amber-900">
      {/* Cinematic Background Gradient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-amber-100/30 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-slate-200/20 rounded-full blur-[150px]" />
        {/* Floating Particle Elements */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -100, 0],
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bg-amber-400/10 rounded-full blur-2xl"
            style={{
              width: `${100 + i * 50}px`,
              height: `${100 + i * 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Institutional Ticker */}
      <div className="bg-blue-900 text-white py-3 md:py-4 overflow-hidden border-b border-white/5 relative z-[60] shadow-2xl">
        <motion.div
          animate={{ x: [0, -2000] }}
          transition={{ repeat: Infinity, duration: 45, ease: "linear" }}
          className="flex gap-32 font-black text-[9px] md:text-[10px] uppercase tracking-[0.4em] italic whitespace-nowrap"
        >
          {[...Array(8)].map((_, i) => (
            <span key={i} className="flex items-center gap-16">
              <span className="flex items-center gap-4 text-amber-400"><TrendingUp size={14} strokeWidth={3} /> LIVE TICKER: ₹{parseFloat(stats.currentGoldRate).toLocaleString()}/g (22K PURE)</span>
              <span className="opacity-20 text-white">•</span>
              <span className="text-white">BIS HALLMARKED & INSURED ASSETS</span>
              <span className="opacity-20 text-white">•</span>
              <span className="flex items-center gap-4 text-amber-400"><Zap size={14} strokeWidth={3} /> 1% DIURNAL YIELD ACTIVE</span>
              <span className="opacity-20 text-white">•</span>
              <span className="text-white">5-TIER MATRIX ENABLED</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* Premium Navbar */}
      <nav className="container mx-auto px-6 py-8 md:py-12 flex justify-between items-center relative z-[70]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 md:gap-8 group cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="w-16 h-16 md:w-24 md:h-24 flex items-center justify-center p-3 md:p-4 bg-blue-900 rounded-[1.8rem] md:rounded-[2.5rem] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)] transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-700 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent"></div>
            <img
              src="/vamanan-logo.png"
              alt="Logo"
              className="w-full h-full object-contain relative z-10 brightness-110"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl md:text-4xl font-black text-blue-900 tracking-tighter leading-none uppercase italic">Vamanan <span className="text-amber-600">Enterprises V</span></h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-[8px] md:text-[11px] font-black text-slate-400 tracking-[0.4em] md:tracking-[0.5em] uppercase italic">Institutional Gold Vault</span>
            </div>
          </div>
        </motion.div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-20">
          <div className="flex gap-14 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">
            <a href="#how-it-works" className="hover:text-amber-600 transition-all hover:-translate-y-0.5">Framework</a>
            <a href="#security" className="hover:text-amber-600 transition-all hover:-translate-y-0.5">Security</a>
            <a href="#faq" className="hover:text-amber-600 transition-all hover:-translate-y-0.5">Knowledge</a>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/login" className="bg-white text-blue-900 px-10 py-6 rounded-[1.5rem] font-black hover:bg-blue-900 hover:text-white transition-all active:scale-95 uppercase text-[10px] tracking-[0.2em] italic border border-slate-200 shadow-sm">
              Login
            </Link>
            <Link to="/register" className="bg-blue-600 text-white px-12 py-6 rounded-[1.5rem] font-black hover:bg-blue-700 transition-all shadow-[0_20px_40px_-10px_rgba(37,99,235,0.4)] active:scale-95 uppercase text-[10px] tracking-[0.2em] italic relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
              Register
            </Link>
          </div>
        </div>

        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-4 bg-white border border-slate-200 rounded-2xl text-blue-900 shadow-sm active:scale-95 transition-all">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMenuOpen(false)} className="absolute inset-0 bg-blue-900/60 backdrop-blur-md" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute right-0 top-0 bottom-0 w-[85%] bg-white shadow-2xl flex flex-col p-6 overflow-y-auto">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <span className="text-[10px] font-black text-amber-600 tracking-[0.4em] uppercase italic">System Menu</span>
                <button onClick={() => setIsMenuOpen(false)} className="p-3 bg-slate-50 rounded-2xl border border-slate-100"><X size={20} /></button>
              </div>
              <div className="flex flex-col gap-3 flex-1">
                {[
                  { name: "Operational Framework", href: "#how-it-works", icon: Activity },
                  { name: "Security Protocols", href: "#security", icon: ShieldCheck },
                  { name: "Knowledge Matrix", href: "#faq", icon: Award }
                ].map((item, i) => (
                  <a key={i} href={item.href} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 font-black uppercase text-[12px] tracking-widest italic text-blue-900 hover:bg-amber-50 hover:border-amber-100 transition-all">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0"><item.icon size={18} className="text-amber-600" /></div>
                    {item.name}
                  </a>
                ))}
              </div>
              <div className="space-y-3 pt-6 mt-6 border-t border-slate-100 shrink-0">
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full py-4 bg-white border border-slate-200 text-blue-900 rounded-[1.5rem] flex items-center justify-center font-black uppercase text-[11px] tracking-widest italic">Login</Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="w-full py-4 bg-blue-600 text-white rounded-[1.5rem] flex items-center justify-center font-black uppercase text-[11px] tracking-widest italic shadow-xl">Register</Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-6 pt-16 md:pt-40 pb-20 md:pb-32 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-4 px-6 md:px-8 py-3 md:py-4 bg-white border border-slate-200 rounded-full mb-10 md:mb-16 shadow-[0_15px_30px_-5px_rgba(0,0,0,0.05)]"
          >
            <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            <span className="text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Institutional Yield Protocol v4.0 Active</span>
          </motion.div>

          <motion.div style={{ scale }}>
            <h2 className="text-[12vw] sm:text-[10vw] md:text-[9vw] lg:text-[8.5vw] font-black tracking-tighter leading-[0.8] uppercase italic text-blue-900 mb-12">
              Wealth that <br />
              <span className="text-amber-600 relative inline-block">
                Evolves.
                <div className="absolute -bottom-2 left-0 w-full h-3 bg-amber-500/10 -skew-x-12 -z-10" />
              </span>
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-400 text-base md:text-2xl lg:text-3xl max-w-5xl mx-auto mb-12 md:mb-20 font-black leading-relaxed px-2 md:px-6 uppercase tracking-tight italic"
          >
            Secure your financial legacy with <span className="text-blue-900">Vamanan Enterprises V</span>. Every institutional asset generates <span className="text-amber-600 underline decoration-amber-500/20 underline-offset-[12px]">1% Diurnal Yields</span> within our military-grade vault infrastructure.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center mb-20 md:mb-40"
          >
            <Link to="/register" className="w-full sm:w-auto px-16 py-8 bg-blue-600 text-white rounded-[2.5rem] font-black text-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-5 shadow-[0_30px_60px_-15px_rgba(37,99,235,0.4)] active:scale-95 uppercase tracking-widest italic group">
              Register Now <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
            </Link>
            <Link to="/login" className="w-full sm:w-auto px-16 py-8 bg-white border border-slate-200 text-blue-900 rounded-[2.5rem] font-black text-xl hover:border-amber-500 hover:shadow-xl transition-all flex items-center justify-center gap-5 active:scale-95 uppercase tracking-widest italic">
              Login
            </Link>
          </motion.div>

          {/* Institutional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-24 max-w-6xl mx-auto pt-16 md:pt-32 border-t border-slate-200/60 relative">
            <div className="absolute -top-px left-1/2 -translate-x-1/2 w-32 h-1 bg-amber-500"></div>
            <div className="flex flex-col items-center">
              <span className="text-6xl md:text-8xl font-black text-blue-900 italic mb-4 tracking-tighter">
                <CountUp value={stats.investors} suffix="+" />
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic">Institutional Partners</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl md:text-5xl font-black text-amber-600 italic tracking-tighter mb-4">₹</span>
                <span className="text-6xl md:text-8xl font-black text-blue-900 italic mb-4 tracking-tighter">
                  <CountUp value={stats.goldValue} suffix="Cr+" />
                </span>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic">Managed Assets</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl md:text-5xl font-black text-amber-600 italic tracking-tighter mb-4">₹</span>
                <span className="text-6xl md:text-8xl font-black text-blue-900 italic mb-4 tracking-tighter">
                  <CountUp value={stats.dailyPayouts} suffix="L+" />
                </span>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] italic">Weekly Diurnals</span>
            </div>
          </div>
        </section>

        {/* Framework Section */}
        <section id="how-it-works" className="py-20 md:py-64 bg-white relative">
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[#fafafa] to-transparent"></div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16 md:mb-32">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="w-12 h-px bg-amber-500"></div>
                <p className="text-amber-600 text-[10px] font-black uppercase tracking-[0.6em] italic">The Operational Framework</p>
                <div className="w-12 h-px bg-amber-500"></div>
              </div>
              <h3 className="text-5xl md:text-[7vw] font-black tracking-tighter uppercase italic text-blue-900 leading-[0.9]">
                Seamless <span className="text-amber-600">Acquisition</span>
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { step: "01", title: "Reserve Capture", desc: "Acquire certified 24K gold reserves through our secure institutional terminal nodes.", icon: Landmark },
                { step: "02", title: "Yield Activation", desc: "Your asset initiates an autonomous 100-cycle protocol, yielding 1% daily increments.", icon: Zap },
                { step: "03", title: "Bridge Transfer", desc: "Disburse your realized gains instantly to any verified banking node globally.", icon: Crown }
              ].map((item, i) => (
                <motion.div
                  whileHover={{ y: -15 }}
                  key={i}
                  className="bg-[#fafafa] p-12 md:p-16 rounded-[3.5rem] border border-slate-100 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] relative overflow-hidden group hover:border-amber-500/30 transition-all duration-700"
                >
                  <div className="absolute top-0 right-0 p-10 text-[10rem] font-black text-slate-200/20 group-hover:text-amber-500/5 transition-all italic select-none leading-none">{item.step}</div>
                  <div className="w-24 h-24 bg-blue-900 text-amber-500 rounded-[2rem] flex items-center justify-center mb-12 shadow-2xl relative z-10 group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-500">
                    <item.icon size={36} />
                  </div>
                  <h4 className="text-3xl font-black mb-6 uppercase tracking-tighter italic text-blue-900 relative z-10">{item.title}</h4>
                  <p className="text-slate-400 text-sm md:text-base font-bold uppercase tracking-widest leading-relaxed italic relative z-10">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section id="security" className="py-20 md:py-56 bg-blue-900 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          <div className="container mx-auto px-6">
            <div className="bg-white/5 backdrop-blur-3xl rounded-[4rem] md:rounded-[6rem] p-12 md:p-32 border border-white/10 flex flex-col lg:flex-row items-center gap-24 relative shadow-2xl">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] -z-10" />
              <div className="flex-1 space-y-10 relative z-10 text-center lg:text-left">
                <div className="inline-flex items-center gap-4 px-6 py-3 bg-white/5 rounded-full border border-white/10 text-amber-400 font-black text-[10px] md:text-[11px] uppercase tracking-[0.4em] italic">
                  <Shield className="animate-pulse" size={16} /> Institutional Security Matrix
                </div>
                <h3 className="text-5xl md:text-[6vw] font-black tracking-tighter uppercase italic leading-[0.85] text-white">
                  Assets, <br />
                  <span className="text-amber-500">Untouchable.</span>
                </h3>
                <p className="text-slate-400 text-lg md:text-2xl font-black uppercase tracking-tight italic max-w-2xl leading-relaxed">
                  Every gram of gold is <span className="text-white">BIS Hallmarked</span>, insured by global leaders, and secured within deep-vault military grade infrastructure with 24/7 biometric surveillance.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6">
                  <div className="flex items-center gap-5 p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-colors group">
                    <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform"><ShieldCheck size={28} /></div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-white italic">Multi-Node Custody</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 italic mt-1">Insured Vault Storage</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-colors group">
                    <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform"><Lock size={28} /></div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-white italic">AES-512 Protocol</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 italic mt-1">Quantum-Safe Auth</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 md:gap-10 relative z-10 w-full lg:w-auto">
                {[
                  { icon: Smartphone, label: "Biometric" },
                  { icon: Globe, label: "Geofenced" },
                  { icon: PieChart, label: "Live Audit" },
                  { icon: TrendingUp, label: "Hallmark" }
                ].map((item, i) => (
                  <motion.div
                    whileHover={{ rotate: 5, scale: 1.05 }}
                    key={i}
                    className="p-10 md:p-14 bg-white/5 border border-white/10 rounded-[2.5rem] md:rounded-[4rem] backdrop-blur-xl flex flex-col items-center group hover:bg-amber-500 transition-all duration-500 cursor-crosshair shadow-2xl"
                  >
                    <item.icon size={36} md:size={48} className="text-amber-500 mb-8 group-hover:text-blue-900 transition-colors" />
                    <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.3em] text-slate-300 group-hover:text-blue-900 italic transition-colors text-center">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Partners */}
        {/* <section className="py-32 bg-[#fafafa]">
           <div className="container mx-auto px-6 text-center">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.6em] mb-16 italic">Certified by Global Standards</p>
              <div className="flex flex-wrap justify-center items-center gap-16 md:gap-32 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
                 <img src="https://upload.wikimedia.org/wikipedia/en/thumb/5/5e/BIS_Logo.svg/1200px-BIS_Logo.svg.png" alt="BIS" className="h-16 md:h-24 object-contain" />
                 <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Bureau_Veritas_Logo.svg/2560px-Bureau_Veritas_Logo.svg.png" alt="Bureau Veritas" className="h-12 md:h-16 object-contain" />
                 <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Llyods_Register_Logo.svg/1200px-Llyods_Register_Logo.svg.png" alt="Lloyds" className="h-12 md:h-16 object-contain" />
                 <img src="https://upload.wikimedia.org/wikipedia/en/thumb/d/d1/NPCI_Logo.svg/1200px-NPCI_Logo.svg.png" alt="NPCI" className="h-12 md:h-16 object-contain" />
              </div>
           </div>
        </section> */}

        {/* Knowledge Matrix Section */}
        <section id="faq" className="container mx-auto px-6 py-20 md:py-64">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16 md:mb-32">
              <p className="text-amber-600 text-[10px] font-black uppercase tracking-[0.6em] mb-6 italic">Information Node</p>
              <h3 className="text-5xl md:text-[7vw] font-black tracking-tighter uppercase italic text-blue-900 leading-none">Knowledge <span className="text-amber-600">Matrix</span></h3>
            </div>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white border border-slate-200/60 rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden shadow-sm hover:border-amber-500/40 transition-all duration-500 group"
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                    className="w-full px-10 md:px-16 py-10 md:py-14 flex justify-between items-center text-left gap-10"
                  >
                    <span className="text-lg md:text-2xl font-black uppercase tracking-tight italic text-blue-900 group-hover:text-amber-600 transition-colors leading-tight">{faq.q}</span>
                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center shrink-0 transition-all duration-700 ${activeFaq === index ? 'bg-blue-900 text-amber-500 rotate-180' : 'text-slate-400 group-hover:bg-blue-900 group-hover:text-amber-500'}`}>
                      <ChevronDown size={24} />
                    </div>
                  </button>
                  <AnimatePresence>
                    {activeFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-10 md:px-16 pb-12 md:pb-20"
                      >
                        <p className="text-slate-500 text-sm md:text-xl font-black uppercase tracking-tight italic leading-relaxed pt-10 border-t border-slate-100">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Global Footer */}
        <footer className="bg-blue-900 pt-40 md:pt-64 pb-16 md:pb-24 text-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700"></div>
          <div className="container mx-auto px-6 max-w-7xl relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 md:gap-24 mb-16 md:mb-40">
              <div className="lg:col-span-2 space-y-12">
                <div className="flex items-center gap-8 group cursor-pointer">
                  <div className="w-20 h-20 md:w-28 md:h-28 bg-white p-5 rounded-[2rem] md:rounded-[3rem] flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent"></div>
                    <img
                      src="/vamanan-logo.png"
                      alt="Footer Logo"
                      className="w-full h-full object-contain relative z-10"
                    />
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-none mb-2">Vamanan <span className="text-amber-500">Enterprises V</span></h4>
                    <span className="text-[10px] md:text-[14px] font-black text-slate-500 uppercase tracking-[0.5em] italic">Institutional Custodian Node</span>
                  </div>
                </div>
                <p className="text-slate-400 text-xl md:text-3xl font-black uppercase tracking-tight italic max-w-2xl leading-[1.2]">
                  Pioneering gold digitalization through secure institutional frameworks and autonomous yield protocols. <span className="text-white">The future of wealth, captured.</span>
                </p>
              </div>

              <div className="space-y-12">
                <h5 className="text-amber-500 font-black text-[11px] md:text-[12px] uppercase tracking-[0.6em] italic">Navigation Node</h5>
                <div className="flex flex-col gap-6 text-[12px] md:text-[14px] font-black uppercase tracking-widest italic text-slate-500">
                  <a href="#how-it-works" className="hover:text-white transition-all hover:translate-x-4 duration-300">Operational Framework</a>
                  <a href="#security" className="hover:text-white transition-all hover:translate-x-4 duration-300">Security Protocols</a>
                  <a href="#faq" className="hover:text-white transition-all hover:translate-x-4 duration-300">Knowledge Matrix</a>
                  <Link to="/login" className="hover:text-amber-500 transition-all hover:translate-x-4 duration-300">Institutional Access</Link>
                </div>
              </div>

              <div className="space-y-12">
                <h5 className="text-amber-500 font-black text-[11px] md:text-[12px] uppercase tracking-[0.6em] italic">Legal Mandates</h5>
                <div className="flex flex-col gap-6 text-[12px] md:text-[14px] font-black uppercase tracking-widest italic text-slate-500">
                  <Link to="/agreement" className="hover:text-white transition-all hover:translate-x-4 duration-300">Terms of Presence</Link>
                  <Link to="/rules" className="hover:text-white transition-all hover:translate-x-4 duration-300">Operational Policy</Link>
                  <a href="#" className="hover:text-white transition-all hover:translate-x-4 duration-300">Privacy Firewall</a>
                  <a href="#" className="hover:text-white transition-all hover:translate-x-4 duration-300">Disclosures</a>
                </div>
              </div>

              <div className="space-y-12">
                <h5 className="text-amber-500 font-black text-[11px] md:text-[12px] uppercase tracking-[0.6em] italic">Support Terminal</h5>
                <div className="flex flex-col gap-8">
                  <div className="flex items-center gap-5 group">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-blue-900 transition-all"><Users size={20} /></div>
                    <span className="text-[11px] font-black uppercase tracking-widest italic text-slate-400 group-hover:text-white transition-colors">+91 96001 22373 | +91 96001 22613</span>
                  </div>
                  <div className="flex items-center gap-5 group">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-amber-500 group-hover:bg-amber-500 group-hover:text-blue-900 transition-all"><Globe size={20} /></div>
                    <span className="text-[11px] font-black uppercase tracking-widest italic text-slate-400 group-hover:text-white transition-colors">support@vamananenterprisesv.com</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-20 border-t border-white/5 flex flex-col lg:flex-row justify-between items-center gap-16">
              <div className="flex flex-col items-center lg:items-start gap-6">
                <p className="text-[11px] md:text-[12px] font-black text-slate-500 uppercase tracking-widest italic text-center lg:text-left leading-loose">
                  © {new Date().getFullYear()} Vamanan Enterprises V. <br className="md:hidden" /> All Institutional Rights Reserved. <span className="mx-6 text-blue-800 hidden md:inline">|</span> <a href="https://cloudhawk.in/" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:text-white transition-all duration-300 decoration-amber-500/20 underline underline-offset-[6px]">Architected by CloudHawk</a>
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-8">
                <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-amber-500 text-[10px] md:text-[11px] font-black uppercase tracking-widest italic hover:bg-amber-500 hover:text-blue-900 transition-all cursor-none">
                  BIS Certified Terminal
                </div>
                <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-amber-500 text-[10px] md:text-[11px] font-black uppercase tracking-widest italic hover:bg-amber-500 hover:text-blue-900 transition-all cursor-none">
                  SSL Secured Node
                </div>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default LandingPage;
