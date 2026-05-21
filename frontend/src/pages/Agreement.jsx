import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Download, CheckCircle, ArrowLeft, Printer, Loader2,
  Menu, Bell, LogOut, X, FileText, ChevronRight, Landmark, Zap, Shield, Crown, Clock, Gavel, Fingerprint
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import CustomerHeader from '../components/CustomerHeader';

import API_BASE_URL from '../config';

const Agreement = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}') || {};

  useEffect(() => {
    if (!user.id) {
      navigate('/login');
      return;
    }
    fetchAgreement();
  }, []);

  const fetchAgreement = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/customer/agreement.php?user_id=${user.id}`);
      if (response.data.status === 'success') {
        setData(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch agreement");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center text-amber-600">
      <div className="flex flex-col items-center gap-6">
        <Loader2 className="animate-spin" size={60} strokeWidth={3} />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse italic">Generating Legal Vault Artifact...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-inter text-blue-900 overflow-x-hidden selection:bg-amber-100 selection:text-amber-900 print:bg-white">
      <div className="print:hidden">
        <Sidebar 
          showMobileMenu={showMobileMenu} 
          setShowMobileMenu={setShowMobileMenu} 
        />
      </div>

      <div className="ml-0 lg:ml-72 min-h-screen relative w-full">
        <div className="print:hidden">
          <CustomerHeader setShowMobileMenu={setShowMobileMenu} activeTab="Legal Protocol" />
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page { size: A4; margin: 10mm; }
            body { background: white !important; -webkit-print-color-adjust: exact; }
            .ml-0 { margin-left: 0 !important; }
            .lg\\:ml-72 { margin-left: 0 !important; }
            main { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
            .print-container { border: none !important; box-shadow: none !important; padding: 10mm !important; margin: 0 !important; width: 100% !important; }
            section { page-break-inside: avoid; margin-bottom: 5mm !important; }
            .signature-section { margin-top: 10mm !important; padding-top: 5mm !important; }
            .signature-box { height: 20mm !important; }
          }
        `}} />

        <main className="p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 w-full max-w-[1500px] space-y-8 md:space-y-12 pb-32 lg:pb-16 print:p-0 print:m-0 print:pb-0">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 md:gap-12 print:hidden">
            <div>
               <div className="flex items-center gap-3 mb-3 md:mb-4">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Legal Protocol</span>
               </div>
               <h2 className="text-3xl md:text-5xl font-black text-blue-900 tracking-tighter uppercase italic leading-none">Agreement</h2>
               <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2 md:mt-3 italic">Verified digital certificate of gold acquisition</p>
            </div>
            <div className="flex w-full md:w-auto gap-4">
                <button 
                  onClick={handlePrint}
                  className="flex-1 md:flex-none p-4 md:p-5 bg-white border border-slate-200 rounded-xl md:rounded-2xl text-slate-400 hover:text-blue-900 transition-all shadow-sm active:scale-95 group flex items-center justify-center"
                  title="Print Protocol"
                >
                  <Printer size={20} md:size={22} className="group-hover:scale-110 transition-transform" />
                </button>
               <button 
                 className="flex-1 md:flex-none flex items-center justify-center gap-3 md:gap-4 bg-blue-950 text-white px-6 md:px-10 py-4 md:py-5 rounded-xl md:rounded-[1.5rem] font-black hover:bg-amber-600 transition-all shadow-2xl active:scale-95 uppercase text-[9px] md:text-[10px] tracking-[0.2em] md:tracking-[0.3em] italic border border-white/10"
               >
                 <Download size={18} md:size={20} /> Download
               </button>
            </div>
          </div>

           {!data ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 md:py-32 bg-white border border-slate-200/60 rounded-[2rem] md:rounded-[4rem] shadow-2xl flex flex-col items-center gap-8 md:gap-10 px-6"
            >
               <div className="w-16 h-16 md:w-24 md:h-24 bg-slate-50 text-slate-200 rounded-2xl md:rounded-[2rem] flex items-center justify-center border border-slate-100 shadow-inner">
                  <ShieldCheck size={40} md:size={64} strokeWidth={1} />
               </div>
               <div>
                  <h3 className="text-2xl md:text-3xl font-black text-blue-950 uppercase mb-3 tracking-tighter italic leading-none">Vault Empty</h3>
                  <p className="text-[10px] md:text-[11px] text-slate-400 font-black uppercase tracking-[0.25em] italic leading-relaxed max-w-xs mx-auto">No institutional acquisitions detected. Initialize a gold purchase protocol to generate a legal agreement.</p>
               </div>
               <button onClick={() => navigate('/shop')} className="bg-blue-950 text-white px-10 md:px-12 py-5 md:py-6 rounded-xl md:rounded-[1.5rem] font-black text-[10px] md:text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:bg-amber-600 transition-all italic active:scale-95">Initialize Acquisition</button>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-blue-100 p-8 sm:p-12 md:p-24 lg:p-32 rounded-[2.5rem] md:rounded-[5rem] relative overflow-hidden print-container print:rounded-none"
            >
              {/* Document Header */}
              <div className="text-center mb-8 md:mb-24 border-b-4 border-blue-900 pb-6 md:pb-16 relative print:mb-6 print:pb-4">
                <div className="absolute top-0 right-0 p-8 opacity-5 print:hidden"><Crown size={150} /></div>
                <div className="flex justify-center mb-8 md:mb-10">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-950 rounded-2xl md:rounded-[2rem] flex items-center justify-center p-3 md:p-4 shadow-2xl border-4 border-white">
                    <img 
                      src="/vamanan-logo.png" 
                      alt="Logo" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tighter text-blue-950 mb-3 md:mb-4 uppercase italic leading-tight">{data.agreement?.type || 'Institutional Gold Agreement'}</h1>
                <p className="text-amber-600 text-[9px] md:text-[11px] font-black tracking-[0.3em] md:tracking-[0.5em] uppercase italic">Artifact ID: {data.agreement?.agreement_id || `VAM_SEC_${data.agreement?.id || 'ALPHA'}`}</p>
              </div>

              {/* Legal Text Section */}
              <div className="space-y-8 md:space-y-16 text-blue-900 leading-loose text-sm sm:text-base md:text-lg font-serif italic print:space-y-4">
                <p className="text-base sm:text-xl border-l-4 border-amber-500 pl-6 md:pl-8 py-2 font-black text-blue-955 not-italic uppercase tracking-tight">
                  This protocol is established on this <span className="text-amber-600 underline decoration-amber-500/30 underline-offset-8">{data.agreement?.agreement_date ? new Date(data.agreement.agreement_date).getDate() : '---'}</span> day of <span className="text-amber-600 underline decoration-amber-500/30 underline-offset-8">{data.agreement?.agreement_date ? new Date(data.agreement.agreement_date).toLocaleString('default', { month: 'long' }) : '---'}</span>, <span className="text-amber-600 underline decoration-amber-500/30 underline-offset-8">{data.agreement?.agreement_date ? new Date(data.agreement.agreement_date).getFullYear() : '2026'}</span> at the Krishnagiri Hub.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                  <div className="bg-blue-50/30 p-8 md:p-12 rounded-[2rem] md:rounded-[3.5rem] border border-blue-100 shadow-inner relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000"><Landmark size={120} /></div>
                    <h3 className="font-black text-blue-400 mb-4 md:mb-6 uppercase tracking-[0.4em] text-[8px] md:text-[10px] italic relative z-10">ENTITY ALPHA (ISSUER)</h3>
                    <p className="text-lg md:text-xl font-black text-blue-950 uppercase italic mb-3 md:mb-4 relative z-10">{data.company?.name || 'VAMANAN ENTERPRISES'}</p>
                    <p className="text-blue-700 text-[9px] md:text-[11px] font-bold uppercase tracking-widest leading-relaxed relative z-10">{data.company?.office || 'Krishnagiri Operations Center, Tamil Nadu – 635 002.'}</p>
                  </div>

                  <div className="bg-blue-50/30 p-8 md:p-12 rounded-[2rem] md:rounded-[3.5rem] border border-blue-100 shadow-inner relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000"><Shield size={120} /></div>
                    <h3 className="font-black text-blue-400 mb-4 md:mb-6 uppercase tracking-[0.4em] text-[8px] md:text-[10px] italic relative z-10">ENTITY BETA (PARTNER)</h3>
                    <div className="space-y-4 md:space-y-6 relative z-10">
                       <div>
                         <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1 italic">Verified Name</p>
                         <p className="text-lg md:text-xl font-black text-blue-950 uppercase italic">{data.user?.name || '---'}</p>
                       </div>
                       <div>
                         <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1 italic">Credential ID</p>
                         <p className="text-xs md:text-sm font-black text-blue-955 uppercase tracking-tighter">{data.user?.aadhar_no || '---'} / {data.user?.pan_no || '---'}</p>
                       </div>
                    </div>
                  </div>
                </div>

                <section className="space-y-8 md:space-y-10">
                  <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-8">
                     <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-950 text-amber-500 rounded-xl flex items-center justify-center shadow-lg"><FileText size={20} md:size={24} /></div>
                     <h2 className="text-xl md:text-2xl font-black text-blue-950 uppercase italic tracking-tighter">I. Asset Specification</h2>
                  </div>
                  <div className="space-y-6 md:space-y-8 font-sans not-italic">
                    <p className="text-blue-800 text-xs md:text-base leading-relaxed"><strong>1.1 PROTOCOL:</strong> Buy Institutional Gold diurnally and initiate yield generation immediately.</p>
                    <p className="text-blue-800 text-xs md:text-base leading-relaxed"><strong>1.2 MATURITY:</strong> 100 Operational Cycles (Maturity extends diurnally if asset persists).</p>
                    <p className="text-blue-800 text-xs md:text-base leading-relaxed"><strong>1.3 YIELD:</strong> Upon execution, Partner receives a diurnal cashback equivalent to 1.00% of aggregate valuation.</p>
                    
                    <div className="mt-8 md:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 border-y-2 border-blue-100 py-8 md:py-12 bg-blue-50/20 rounded-[2rem] md:rounded-[3rem] px-8 md:px-10">
                      <div>
                        <p className="text-[8px] md:text-[10px] text-blue-400 font-black uppercase tracking-[0.3em] mb-3 md:mb-4 italic">Asset Specification</p>
                        <p className="text-xl md:text-2xl font-black text-blue-950 uppercase italic tracking-tighter">{data.agreement?.product_name || 'Custom Gold Asset'}</p>
                      </div>
                      <div className="sm:border-l border-blue-100 sm:pl-12">
                        <p className="text-[8px] md:text-[10px] text-blue-400 font-black uppercase tracking-[0.3em] mb-3 md:mb-4 italic">Aggregate Valuation</p>
                        <p className="text-xl md:text-3xl font-black text-amber-600 italic tracking-tighter">₹{parseFloat(data.agreement?.price || 0).toLocaleString()}</p>
                      </div>
                      <div className="sm:border-l border-blue-100 sm:pl-12">
                        <p className="text-[8px] md:text-[10px] text-blue-400 font-black uppercase tracking-[0.3em] mb-3 md:mb-4 italic">Asset Weight</p>
                        <p className="text-xl md:text-3xl font-black text-blue-955 italic tracking-tighter">{data.agreement?.weight || '---'} Grams</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-8 md:space-y-10">
                  <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-8">
                     <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-950 text-amber-500 rounded-xl flex items-center justify-center shadow-lg"><ShieldCheck size={20} md:size={24} /></div>
                     <h2 className="text-xl md:text-2xl font-black text-blue-950 uppercase italic tracking-tighter">II. Institutional Covenants</h2>
                  </div>
                  <div className="space-y-4 md:space-y-6 font-sans not-italic text-[9px] md:text-xs text-blue-700 uppercase font-black tracking-widest leading-loose italic">
                    <p>2.1 Partners may acquire institutional gold; minimum threshold: 1.00 Gram.</p>
                    <p>2.2 Partner may activate a referral node by onboarding 10 qualified entities.</p>
                    <p>2.3 Partners shall receive 1.00% diurnal yield during the maturity tenure.</p>
                    <p>2.4 Protocol maturity achieved upon 100 cycles or 100% principal realization.</p>
                  </div>
                </section>

                {/* Secure Signatures */}
                <div className="mt-20 md:mt-32 pt-16 md:pt-20 border-t-2 border-blue-100 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10 font-sans not-italic signature-section print:mt-10 print:pt-6">
                  {/* Issuer Sign */}
                  <div className="text-center group">
                    <div className="w-full h-32 border-b-2 border-blue-200 mb-6 flex items-center justify-center relative overflow-hidden rounded-2xl bg-blue-50/30 group-hover:bg-blue-950 transition-all duration-500 signature-box print:mb-2 print:h-24">
                       <Landmark size={50} className="text-blue-200 group-hover:text-amber-500 transition-colors opacity-20" />
                       <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.4em] italic">VAM_SEC_AUTH_7</p>
                       </div>
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-400 mb-1">Authorized Control</p>
                    <p className="text-xs md:text-sm font-black text-blue-955 uppercase italic">Vamanan Gold</p>
                  </div>

                  {/* Advocate Sign */}
                  <div className="text-center group">
                    <div className={`w-full h-32 border-b-2 border-blue-200 mb-6 flex flex-col items-center justify-center rounded-2xl transition-all duration-500 signature-box print:mb-2 print:h-24 ${data.agreement?.status === 'verified' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50/30 border-blue-100'}`}>
                      {data.agreement?.status === 'verified' ? (
                        <>
                           <ShieldCheck size={32} className="text-amber-600 mb-2 animate-bounce" />
                           <p className="text-[8px] font-black text-amber-700 uppercase tracking-widest italic">Legal Ratification Verified</p>
                           <p className="text-[7px] text-blue-400 font-bold mt-1">TS: {new Date(data.agreement?.signed_at).toLocaleDateString()}</p>
                        </>
                      ) : (
                        <>
                           <Gavel size={32} className="text-blue-300 mb-2" />
                           <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest italic">Awaiting Legal Review</p>
                        </>
                      )}
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-400 mb-1">Institutional Advocate</p>
                    <p className="text-xs md:text-sm font-black text-blue-955 uppercase italic">Legal Command Center</p>
                  </div>
                  
                  {/* Partner Sign */}
                  <div className="text-center group">
                    <div className={`w-full h-32 border-b-2 border-blue-200 mb-6 flex flex-col items-center justify-center rounded-xl md:rounded-[1.5rem] transition-all duration-500 signature-box print:mb-2 print:h-24 ${data.agreement?.status === 'verified' ? 'bg-emerald-50 group-hover:bg-emerald-500' : (data.agreement?.status === 'ratified' ? 'bg-amber-50 animate-pulse border-amber-300' : 'bg-blue-50/30')}`}>
                      {data.agreement?.status === 'verified' ? (
                        <>
                          <CheckCircle size={28} className="text-emerald-500 mb-2 group-hover:text-white transition-colors" />
                          <p className="text-[8px] md:text-[9px] font-black text-emerald-600 uppercase tracking-widest italic group-hover:text-white transition-colors">Digitally Signed & Verified</p>
                          <p className="text-[7px] text-emerald-400 font-bold mt-1 group-hover:text-white">TS: {new Date(data.agreement?.customer_signed_at).toLocaleDateString()}</p>
                        </>
                      ) : data.agreement?.status === 'ratified' ? (
                        <>
                          <Fingerprint size={32} className="text-amber-500 mb-2" />
                          <p className="text-[8px] md:text-[9px] font-black text-amber-600 uppercase tracking-widest italic">Ready to Sign</p>
                        </>
                      ) : (
                        <>
                          <Clock size={28} className="text-blue-300 mb-2 animate-pulse" />
                          <p className="text-[8px] md:text-[9px] font-black text-blue-400 uppercase tracking-widest italic">Awaiting Ratification</p>
                        </>
                      )}
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-400 mb-1">Partner Signature</p>
                    <p className="text-xs md:text-sm font-black text-blue-950 uppercase italic">{data.user?.name}</p>
                  </div>
                </div>

                {/* Sign Action Button (Customer Side) */}
                {data.agreement?.status === 'ratified' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-16 flex justify-center print:hidden"
                  >
                    <button 
                      onClick={async () => {
                        try {
                          const res = await axios.post(`${API_BASE_URL}/customer/sign_agreement.php`, {
                            agreement_id: data.agreement.id,
                            user_id: JSON.parse(localStorage.getItem('user')).id
                          });
                          if (res.data.status === 'success') {
                            // Instant Refresh
                            window.location.reload();
                          }
                        } catch (err) {
                          alert("Signing Failed: " + (err.response?.data?.message || "Protocol Error"));
                        }
                      }}
                      className="group relative bg-blue-950 text-white px-12 py-6 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.4em] italic shadow-2xl hover:bg-amber-600 transition-all active:scale-95 flex items-center gap-6"
                    >
                      <Fingerprint size={24} className="group-hover:rotate-12 transition-transform" />
                      Sign Institutional Deed
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Security Watermark */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 pointer-events-none opacity-[0.02] text-blue-900 font-black text-[60px] sm:text-[100px] md:text-[180px] whitespace-nowrap uppercase italic tracking-tighter select-none">
                VAMANAN VAULT SECURE
              </div>
            </motion.div>
          )}

          {/* Verification Badge */}
          <div className="mt-8 md:mt-12 text-center flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 text-emerald-600 font-black text-[9px] md:text-[11px] uppercase tracking-[0.3em] md:tracking-[0.4em] italic print:text-slate-400 print:mt-12">
            <ShieldCheck size={18} md:size={20} strokeWidth={2.5} /> SHA-256 Digitally Secured & Timestamped • {new Date().toLocaleDateString('en-GB')}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Agreement;
