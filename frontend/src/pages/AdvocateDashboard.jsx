import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, FileText, Users, Search, Settings, 
  CheckCircle2, XCircle, Loader2, Clock, Eye, 
  Filter, ChevronRight, Activity, LayoutDashboard,
  FileSearch, AlertCircle, History, Download,
  ExternalLink, ArrowUpRight, TrendingUp, Gavel,
  Calendar, ArrowRight, Shield, Crown, RefreshCw, X,
  Scale, FileSignature, Database, Menu, UserCheck, 
  UserX, FileDigit, Fingerprint, FileX, Landmark, CheckCircle,
  ShoppingBag, Edit2, Trash2, Save, Wallet
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config';
import { humanAgreementType, humanKycStatus, humanStatus } from '../utils/humanLabels';

const AdvocateDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab); 
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  
  // Data States
  const [agreements, setAgreements] = useState([]);
  const [members, setMembers] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [activities, setActivities] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [stats, setStats] = useState({
    active_members: 0,
    active_agreements: 0,
    pending_agreements: 0,
    compliance_score: '99.8%',
    active_disputes: 0
  });

  // Purchase Modal and Editing States
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [isEditingPurchase, setIsEditingPurchase] = useState(false);
  const [editWeight, setEditWeight] = useState(0);
  const [editTotalValue, setEditTotalValue] = useState(0);
  const [editProductAmount, setEditProductAmount] = useState(0);
  const [editGstAmount, setEditGstAmount] = useState(0);
  const [editCashbackEligible, setEditCashbackEligible] = useState(0);
  const [editTransactionId, setEditTransactionId] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user || !user.id) {
      navigate('/login');
      return;
    }
    if (user.role !== 'advocate' && user.role !== 'admin' && user.role !== 'manager') {
      navigate('/dashboard');
      return;
    }
    fetchAdvocateData();
    const interval = setInterval(() => fetchAdvocateData(true), 15000); 
    return () => clearInterval(interval);
  }, []);

  const fetchAdvocateData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/advocate/stats.php`);
      if (response.data.status === 'success') {
        const d = response.data.data;
        setAgreements(d.agreements || []);
        setMembers(d.kyc_pending || []);
        setDisputes(d.disputes || []);
        setActivities(d.activities || []);
        setPurchases(d.purchases || []);

        setStats({
          active_members: d.stats.active_members || 0,
          active_agreements: d.stats.active_agreements || 0,
          pending_agreements: d.stats.pending_agreements || 0,
          compliance_score: d.stats.compliance_score || '99.2%',
          active_disputes: d.stats.active_disputes || 0
        });
      }
    } catch (err) {
      console.error("Advocate data fetch failed", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleLegalAction = async (action, id) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/advocate/actions.php`, { action, id });
      if (res.data.status === 'success') {
        fetchAdvocateData(true);
        setSelectedDoc(null);
        setSelectedMember(null);
        setSelectedPurchase(null);
      }
    } catch (err) {
      alert("Operational Error: " + (err.response?.data?.message || "Action failed"));
    }
  };

  const openEditPurchase = (purchase) => {
    setSelectedPurchase(purchase);
    setEditWeight(purchase.weight || 0);
    setEditTotalValue(purchase.total_value || purchase.total_amount || 0);
    setEditProductAmount(purchase.product_amount || 0);
    setEditGstAmount(purchase.gst_amount || 0);
    setEditCashbackEligible(purchase.cashback_eligible_amount || 0);
    setEditTransactionId(purchase.transaction_id || '');
    setEditPaymentMethod(purchase.payment_method || 'Bank Transfer');
  };

  const handleUpdatePurchase = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    try {
      const res = await axios.post(`${API_BASE_URL}/advocate/update_purchase.php`, {
        cycle_id: selectedPurchase.id,
        weight: editWeight,
        total_value: editTotalValue,
        product_amount: editProductAmount,
        gst_amount: editGstAmount,
        cashback_eligible_amount: editCashbackEligible,
        transaction_id: editTransactionId,
        payment_method: editPaymentMethod,
        operator_id: user.id || 0
      });
      
      if (res.data.status === 'success') {
        alert("Purchase record updated successfully!");
        setSelectedPurchase(null);
        fetchAdvocateData(true);
      }
    } catch (err) {
      alert("Error updating purchase: " + (err.response?.data?.message || err.message));
    }
  };

  const filteredPurchases = purchases.filter(p => {
    const matchesSearch = 
      p.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id?.toString().includes(searchTerm);
      
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Real-time purchase totals — recomputed from the live (filtered) DB data on every render.
  const purchaseTotals = filteredPurchases.reduce((acc, p) => {
    acc.count += 1;
    acc.total += parseFloat(p.total_value || p.total_amount || 0) || 0;
    acc.exGst += parseFloat(p.product_amount || 0) || 0;
    acc.gst += parseFloat(p.gst_amount || 0) || 0;
    acc.eligible += parseFloat(p.cashback_eligible_amount || p.product_amount || 0) || 0;
    return acc;
  }, { count: 0, total: 0, exGst: 0, gst: 0, eligible: 0 });
  const inr = (n) => `₹${parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const filteredAgreements = agreements.filter(a => 
    a.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.agreement_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMembers = members.filter(m => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.id?.toString().includes(searchTerm)
  );

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
         <div className="relative">
            <div className="w-24 h-24 border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin shadow-2xl shadow-amber-500/20"></div>
            <Gavel className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500" size={32} />
         </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-600 animate-pulse italic text-center px-4">Loading Advocate Dashboard...</p>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-inter text-slate-600 selection:bg-amber-500 selection:text-white relative overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        showMobileMenu={showMobileMenu} 
        setShowMobileMenu={setShowMobileMenu} 
      />

      <div className="ml-0 lg:ml-72 min-h-screen relative flex-1 min-w-0 flex flex-col z-10">
        <header className="sticky top-0 z-[100] bg-white/95 backdrop-blur-2xl border-b border-amber-100 p-3 md:p-6 flex justify-between items-center shadow-xl shadow-amber-500/5">
           <div className="flex items-center gap-3 md:gap-6">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-amber-500 transition-all shadow-sm">
                 <Menu size={20} />
              </button>
              
              <div className="relative group">
                 <div className="absolute inset-0 bg-amber-500 blur-xl opacity-5 group-hover:opacity-10 transition-opacity"></div>
                 <div className="relative w-10 h-10 md:w-16 md:h-16 bg-blue-950 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center overflow-hidden p-1.5 md:p-2 shadow-xl shadow-amber-500/10 border-2 md:border-4 border-white transform hover:scale-105 transition-all duration-500">
                    <img src="/vamanan-logo.png" alt="Vamanan Enterprises V" className="w-full h-full object-contain" />
                  </div>
              </div>

              <div className="flex flex-col justify-center">
                 <div className="flex items-center gap-2 md:gap-4">
                    <h2 className="text-lg md:text-3xl font-black text-blue-950 tracking-tighter uppercase italic leading-none">
                       Advocate <span className="text-amber-500">Dashboard</span>
                    </h2>
                    <div className="hidden sm:flex w-6 h-6 md:w-8 md:h-8 bg-amber-50 rounded-lg md:rounded-xl items-center justify-center border border-amber-100 shadow-sm">
                       <Crown className="text-amber-500 w-3 h-3 md:w-4 md:h-4" />
                    </div>
                 </div>
                 <div className="flex items-center gap-2 mt-1 md:mt-2">
                    <div className="flex items-center gap-1.5 md:gap-2.5 bg-amber-50 px-2 md:px-3.5 py-1 md:py-1.5 rounded-full border border-amber-100">
                       <span className="w-1 md:w-1.5 h-1 md:h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                       <p className="text-[7px] md:text-[9px] font-black text-amber-700 uppercase tracking-widest italic">System Online</p>
                    </div>
                    <div className="h-[1px] w-4 md:w-8 bg-slate-100 hidden sm:block"></div>
                    <p className="text-[7px] md:text-[9px] text-slate-400 font-black uppercase tracking-widest italic hidden sm:block">Advocate Portal</p>
                 </div>
              </div>
           </div>
           
           <div className="flex items-center gap-3 md:gap-8">
              <div className="hidden lg:flex flex-col items-end mr-2">
                 <p className="text-xs font-black text-blue-950 italic uppercase tracking-tighter">{new Date().toLocaleTimeString()}</p>
              </div>
              
              <button 
                onClick={() => fetchAdvocateData(true)} 
                className={`w-10 h-10 md:w-14 md:h-14 bg-white border border-slate-100 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-400 hover:text-amber-500 transition-all shadow-lg shadow-slate-100/50 active:scale-95 ${refreshing ? 'animate-spin' : ''}`}
              >
                 <RefreshCw size={18} className="md:w-6 md:h-6" />
              </button>
              
              <button onClick={() => navigate('/advocate-profile')} className="relative group active:scale-90 transition-all duration-300">
                 <div className="relative w-10 h-10 md:w-16 md:h-16 bg-blue-950 rounded-xl md:rounded-[1.5rem] flex items-center justify-center text-amber-500 font-black text-sm md:text-2xl italic border-2 md:border-4 border-amber-500/10 shadow-xl">
                    V
                    <div className="absolute -top-1 -right-1 w-4 h-4 md:w-7 md:h-7 bg-amber-500 border-2 md:border-4 border-white rounded-full shadow-lg"></div>
                 </div>
              </button>
           </div>
        </header>

        {/* Navigation Tabs Migrated to Sidebar */}
        <main className="p-4 md:p-14 space-y-8 md:space-y-16 max-w-[1900px] mx-auto w-full pb-32">
           <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                 <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 md:space-y-16">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10">
                       {[
                          { label: 'Total Customers', value: stats.active_members, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
                          { label: 'Approved Agreements', value: stats.active_agreements, icon: CheckCircle2, color: 'text-amber-600', bg: 'bg-amber-50' },
                          { label: 'Pending Approvals', value: stats.pending_agreements, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                          { label: 'Open Disputes', value: stats.active_disputes, icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50' }
                       ].map((s, i) => (
                          <div key={i} className="bg-white border border-amber-50 p-6 md:p-12 rounded-3xl md:rounded-[5rem] group hover:border-amber-500 transition-all relative overflow-hidden">
                             <div className={`w-12 h-12 md:w-20 md:h-20 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center mb-4 md:mb-10 border border-white shadow-xl ${s.bg} ${s.color}`}>
                                <s.icon size={20} className="md:w-8 md:h-8" />
                             </div>
                             <p className="text-[9px] md:text-[13px] font-black text-slate-400 uppercase tracking-widest italic mb-1 md:mb-3">{s.label}</p>
                             <h3 className="text-2xl md:text-6xl font-black text-blue-950 italic tracking-tighter leading-none">{s.value}</h3>
                          </div>
                       ))}
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 md:gap-24">
                       <div className="xl:col-span-2 space-y-6 md:space-y-12">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                             <h3 className="text-lg md:text-3xl font-black text-blue-950 uppercase italic tracking-tighter">Pending Signature Approvals</h3>
                          </div>
                          <div className="bg-white border border-amber-50 rounded-3xl md:rounded-[5rem] overflow-hidden shadow-sm">
                             <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[600px]">
                                   <thead>
                                      <tr className="bg-slate-50 border-b border-slate-100">
                                         <th className="py-6 md:py-14 px-6 md:px-16 text-[9px] md:text-[13px] font-black text-slate-400 uppercase tracking-widest italic">Customer</th>
                                         <th className="py-6 md:py-14 px-6 md:px-16 text-[9px] md:text-[13px] font-black text-slate-400 uppercase tracking-widest italic text-right">View Details</th>
                                      </tr>
                                   </thead>
                                   <tbody className="divide-y divide-slate-50">
                                      {agreements.filter(a => a.status === 'verified').length > 0 ? (
                                        agreements.filter(a => a.status === 'verified').map((agr, i) => (
                                          <tr key={i} className="hover:bg-amber-50/50 transition-all">
                                              <td className="py-6 md:py-16 px-6 md:px-16">
                                                <div className="flex items-center gap-3 md:gap-10">
                                                    <div className="w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] bg-white border border-slate-100 flex items-center justify-center text-sm md:text-xl font-black text-blue-950 uppercase italic shadow-sm">{agr.user_name?.[0] || 'V'}</div>
                                                    <p className="text-xs md:text-xl font-black text-blue-950 uppercase italic tracking-tight">{agr.user_name}</p>
                                                </div>
                                              </td>
                                              <td className="py-6 md:py-16 px-6 md:px-16 text-right">
                                                <button onClick={() => setSelectedDoc(agr)} className="w-8 h-8 md:w-16 md:h-16 bg-white border border-slate-100 rounded-lg md:rounded-3xl flex items-center justify-center text-slate-300 hover:text-amber-500 transition-all ml-auto"><Eye size={16}/></button>
                                              </td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr><td colSpan="2" className="py-20 text-center text-[10px] font-black text-slate-300 uppercase italic tracking-widest">No Pending Approvals Found</td></tr>
                                      )}
                                   </tbody>
                                </table>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-8">
                          <h3 className="text-lg md:text-2xl font-black text-blue-950 uppercase italic tracking-tighter px-4">Audit Logs</h3>
                          <div className="space-y-4">
                             {activities.length > 0 ? (
                                activities.map((act) => {
                                   const type = act.action.toLowerCase().includes('ratified') || act.action.toLowerCase().includes('verified') ? 'success' : 
                                                act.action.toLowerCase().includes('rejected') || act.action.toLowerCase().includes('dispute') ? 'warning' : 'info';
                                   return (
                                      <div key={act.id} className="p-6 bg-white border border-amber-50 rounded-3xl flex items-center gap-6 group hover:border-amber-500 transition-all">
                                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${type === 'success' ? 'bg-amber-50 text-amber-500' : type === 'warning' ? 'bg-blue-50 text-blue-500' : 'bg-blue-50 text-blue-500'}`}>
                                            <Activity size={18} />
                                         </div>
                                         <div>
                                            <p className="text-[10px] font-black text-blue-950 uppercase italic">{act.action}</p>
                                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">
                                               {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {act.user_name}
                                            </p>
                                         </div>
                                      </div>
                                   );
                                })
                             ) : (
                                <div className="py-20 text-center bg-white border border-dashed border-amber-200 rounded-3xl opacity-40">
                                   <p className="text-[10px] font-black uppercase italic tracking-widest text-slate-300">No History Logged...</p>
                                </div>
                             )}
                          </div>
                       </div>
                    </div>
                 </motion.div>
              )}

              {activeTab === 'purchases' && (
                  <motion.div key="purchases" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8 md:space-y-12">
                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                           <h3 className="text-xl md:text-4xl font-black text-blue-950 uppercase italic tracking-tighter">Purchase Verification Hub</h3>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5 italic">Verify and approve customer gold purchases</p>
                        </div>
                        <div className="flex items-center gap-4 bg-amber-50 px-6 py-3 rounded-2xl border border-amber-100">
                           <Clock className="text-amber-500" size={18} />
                           <p className="text-[10px] font-black text-amber-700 uppercase italic tracking-widest">{purchases.filter(p => p.status === 'pending').length} Pending Verification</p>
                        </div>
                     </div>

                     {/* Real-time purchase totals (reflects the active filter) */}
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {[
                           { label: 'Total Purchases', value: purchaseTotals.count, icon: ShoppingBag, accent: 'text-blue-950' },
                           { label: 'Total Value (Incl. GST)', value: inr(purchaseTotals.total), icon: Wallet, accent: 'text-blue-950' },
                           { label: 'Product Value (Ex-GST)', value: inr(purchaseTotals.exGst), icon: TrendingUp, accent: 'text-emerald-600' },
                           { label: 'GST Collected', value: inr(purchaseTotals.gst), icon: FileText, accent: 'text-amber-600' },
                        ].map((c, i) => (
                           <div key={i} className="bg-white border border-amber-50 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 shadow-sm">
                              <div className="flex items-center justify-between mb-4">
                                 <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] italic">{c.label}</p>
                                 <c.icon size={16} className="text-slate-300" />
                              </div>
                              <p className={`text-xl md:text-3xl font-black italic tracking-tighter ${c.accent}`}>{c.value}</p>
                           </div>
                        ))}
                     </div>

                     <div className="flex flex-col lg:flex-row gap-6 justify-between items-stretch lg:items-center">
                        <div className="flex flex-wrap gap-3">
                           {[
                              { id: 'all', label: 'All Purchases' },
                              { id: 'pending', label: 'Pending Verification' },
                              { id: 'active', label: 'Active' },
                              { id: 'completed', label: 'Completed' },
                              { id: 'rejected', label: 'Rejected' },
                              { id: 'cancelled', label: 'Cancelled' }
                           ].map(t => (
                              <button
                                 key={t.id}
                                 onClick={() => setStatusFilter(t.id)}
                                 className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider italic transition-all ${statusFilter === t.id ? 'bg-blue-950 text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-400 hover:text-blue-950'}`}
                              >
                                 {t.label}
                              </button>
                           ))}
                        </div>

                        <div className="relative w-full lg:w-[400px]">
                           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                           <input 
                             type="text" 
                             placeholder="SEARCH BY CUSTOMER NAME, PRODUCT, OR TXN ID..." 
                             value={searchTerm}
                             onChange={(e) => setSearchTerm(e.target.value)}
                             className="w-full bg-white border border-slate-100 rounded-xl md:rounded-[2.5rem] py-4 pl-14 pr-6 text-[9px] md:text-[11px] font-black uppercase italic tracking-widest focus:border-amber-500 outline-none shadow-sm"
                           />
                        </div>
                     </div>

                     <div className="bg-white border border-amber-50 rounded-[3rem] md:rounded-[4rem] overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                           <table className="w-full text-left min-w-[1100px]">
                              <thead>
                                 <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="py-10 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Purchase ID</th>
                                    <th className="py-10 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Customer Details</th>
                                    <th className="py-10 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Product Details</th>
                                    <th className="py-10 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Payment Details</th>
                                    <th className="py-10 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest italic text-right">Total Price (₹)</th>
                                    <th className="py-10 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest italic text-center">Status</th>
                                    <th className="py-10 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest italic text-right">Action</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                 {filteredPurchases.length > 0 ? (
                                    filteredPurchases.map((p, i) => (
                                       <tr key={i} className="hover:bg-amber-50/30 transition-all group">
                                          <td className="py-12 px-6">
                                             <p className="text-xs font-black text-blue-950 tracking-widest italic">#CC-{p.id}</p>
                                             <p className="text-[8px] text-slate-400 font-bold uppercase mt-1 italic">{new Date(p.created_at).toLocaleDateString()}</p>
                                          </td>
                                          <td className="py-12 px-6">
                                             <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-blue-950 rounded-xl flex items-center justify-center text-amber-500 font-black italic">{p.user_name?.[0] || 'V'}</div>
                                                <div>
                                                   <p className="text-sm font-black text-blue-950 uppercase italic">{p.user_name || 'Customer'}</p>
                                                   <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">{p.user_email}</p>
                                                </div>
                                             </div>
                                          </td>
                                          <td className="py-12 px-6">
                                             <p className="text-[11px] font-black text-blue-900 uppercase italic tracking-wide">{p.product_name}</p>
                                             <p className="text-[8px] text-amber-600 font-bold uppercase tracking-widest mt-1 italic">{p.weight} Grams • {p.asset_type}</p>
                                          </td>
                                          <td className="py-12 px-6">
                                             <p className="text-xs font-black text-blue-900 uppercase italic">{p.payment_method}</p>
                                             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">TID: {p.transaction_id || 'N/A'}</p>
                                          </td>
                                          <td className="py-12 px-6 text-right">
                                             <p className="text-sm font-black text-blue-950 italic">₹{parseFloat(p.total_value || p.total_amount || 0).toLocaleString()}</p>
                                             <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">Ex-GST: ₹{parseFloat(p.product_amount || 0).toLocaleString()}</p>
                                          </td>
                                          <td className="py-12 px-6 text-center">
                                             <span className={`px-4 py-1.5 rounded-full text-[8px] md:text-[9px] font-black uppercase italic border ${
                                                p.status === 'active' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                p.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                p.status === 'pending' ? 'bg-amber-50/50 text-amber-700 border-amber-100/50' :
                                                'bg-blue-50 text-blue-600 border-blue-100'
                                             }`}>
                                                {p.status}
                                             </span>
                                          </td>
                                          <td className="py-12 px-6 text-right">
                                             <div className="flex items-center justify-end gap-3">
                                                {p.status === 'pending' && (
                                                   <button 
                                                     onClick={() => handleLegalAction('approve_purchase', p.id)}
                                                     className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-[9px] font-black uppercase italic tracking-widest hover:bg-amber-600 transition-all shadow-md shadow-amber-500/10"
                                                   >
                                                      Approve
                                                   </button>
                                                )}
                                                <button 
                                                  onClick={() => openEditPurchase(p)}
                                                  className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-amber-500 transition-all shadow-sm"
                                                >
                                                   <Eye size={16} />
                                                </button>
                                             </div>
                                          </td>
                                       </tr>
                                    ))
                                 ) : (
                                    <tr><td colSpan="7" className="py-40 text-center text-[11px] font-black text-slate-300 uppercase italic tracking-[0.4em]">No purchases found matching this filter</td></tr>
                                 )}
                              </tbody>
                              {filteredPurchases.length > 0 && (
                                 <tfoot>
                                    <tr className="bg-blue-950 text-white">
                                       <td className="py-8 px-6 text-[11px] font-black uppercase tracking-widest italic" colSpan="3">
                                          Grand Total &bull; {purchaseTotals.count} Purchase{purchaseTotals.count === 1 ? '' : 's'}
                                       </td>
                                       <td className="py-8 px-6 text-right text-[9px] font-bold uppercase tracking-widest italic text-amber-400">
                                          GST: {inr(purchaseTotals.gst)}
                                       </td>
                                       <td className="py-8 px-6 text-right">
                                          <p className="text-base font-black italic text-amber-400">{inr(purchaseTotals.total)}</p>
                                          <p className="text-[8px] font-bold uppercase mt-1 text-white/60">Ex-GST: {inr(purchaseTotals.exGst)}</p>
                                       </td>
                                       <td className="py-8 px-6" colSpan="2"></td>
                                    </tr>
                                 </tfoot>
                              )}
                           </table>
                        </div>
                     </div>
                  </motion.div>
               )}

              {activeTab === 'agreements' && (
                 <motion.div key="agreements" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8 md:space-y-12">
                    <div className="flex justify-between items-center">
                       <h3 className="text-xl md:text-4xl font-black text-blue-950 uppercase italic tracking-tighter">Agreement Approvals Hub</h3>
                       <div className="flex items-center gap-4 bg-amber-50 px-6 py-3 rounded-2xl border border-amber-100">
                          <Clock className="text-amber-500" size={18} />
                          <p className="text-[10px] font-black text-amber-700 uppercase italic tracking-widest">{agreements.filter(a => a.status === 'verified').length} Signatures Required</p>
                       </div>
                    </div>

                    <div className="bg-white border border-amber-50 rounded-[3rem] md:rounded-[4rem] overflow-hidden shadow-sm">
                       <div className="overflow-x-auto">
                          <table className="w-full text-left min-w-[900px]">
                             <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                   <th className="py-10 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Agreement ID</th>
                                   <th className="py-10 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Customer Name</th>
                                   <th className="py-10 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Agreement Type</th>
                                   <th className="py-10 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest italic text-right">Action</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-50">
                                {agreements.filter(a => a.status === 'verified').length > 0 ? (
                                   agreements.filter(a => a.status === 'verified').map((agr, i) => (
                                      <tr key={i} className="hover:bg-amber-50/30 transition-all group">
                                         <td className="py-12 px-6">
                                            <p className="text-xs font-black text-blue-950 tracking-widest italic">{agr.agreement_id}</p>
                                            <p className="text-[8px] text-slate-400 font-bold uppercase mt-1 italic">{new Date(agr.created_at).toLocaleDateString()}</p>
                                         </td>
                                         <td className="py-12 px-6">
                                            <div className="flex items-center gap-4">
                                               <div className="w-12 h-12 bg-blue-950 rounded-xl flex items-center justify-center text-amber-500 font-black italic">{agr.user_name?.[0] || 'V'}</div>
                                               <p className="text-sm font-black text-blue-950 uppercase italic">{agr.user_name || 'Customer'}</p>
                                            </div>
                                         </td>
                                         <td className="py-12 px-6">
                                            <p className="text-[10px] font-black text-amber-600 uppercase italic tracking-widest">{humanAgreementType(agr.type)}</p>
                                         </td>
                                         <td className="py-12 px-6 text-right">
                                            <div className="flex items-center justify-end gap-3 transition-opacity">
                                               <button 
                                                 onClick={() => handleLegalAction('approve_agreement', agr.id)}
                                                 className="px-6 py-3 bg-amber-500 text-white rounded-xl text-[9px] font-black uppercase italic tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                                               >
                                                  Approve & Sign
                                               </button>
                                               <button 
                                                 onClick={() => setSelectedDoc(agr)}
                                                 className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 hover:text-amber-500 transition-all shadow-sm"
                                               >
                                                  <Eye size={16} />
                                               </button>
                                            </div>
                                         </td>
                                      </tr>
                                   ))
                                ) : (
                                   <tr><td colSpan="4" className="py-40 text-center text-[11px] font-black text-slate-300 uppercase italic tracking-[0.4em]">All Agreements Approved</td></tr>
                                )}
                             </tbody>
                          </table>
                       </div>
                    </div>
                 </motion.div>
              )}

              {activeTab === 'registry' && (
                 <motion.div key="registry" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-8 md:space-y-12">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                       <h3 className="text-xl md:text-4xl font-black text-blue-950 uppercase italic tracking-tighter">Customer Directory</h3>
                       <div className="relative w-full lg:w-[400px]">
                          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input 
                            type="text" 
                            placeholder="SEARCH CUSTOMERS..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-100 rounded-xl md:rounded-[2.5rem] py-4 md:py-8 pl-14 md:pl-20 pr-6 text-[10px] md:text-[14px] font-black uppercase italic tracking-widest focus:border-amber-500 outline-none shadow-sm"
                          />
                       </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-6 md:gap-10">
                       {filteredMembers.length > 0 ? (
                         filteredMembers.map((member) => (
                          <div key={member.id} className="bg-white border border-amber-50 p-6 md:p-12 rounded-3xl md:rounded-[4rem] group hover:border-amber-500 transition-all relative overflow-hidden shadow-sm">
                             <div className="flex items-center gap-4 md:gap-8 relative z-10">
                                <div className="w-12 h-12 md:w-20 md:h-20 bg-blue-950 border border-amber-500/20 rounded-xl md:rounded-[2.5rem] flex items-center justify-center text-sm md:text-2xl font-black text-amber-500 italic shadow-xl group-hover:scale-110 transition-all duration-500">
                                   {member.name?.[0] || 'V'}
                                </div>
                                <div>
                                   <div className="flex items-center gap-3">
                                      <h4 className="text-sm md:text-xl font-black text-blue-950 uppercase italic tracking-tight">{member.name}</h4>
                                      {member.kyc_status === 'verified' && <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-lg shadow-amber-500/50"></div>}
                                   </div>
                                   <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{member.email}</p>
                                </div>
                             </div>
                             <div className="mt-6 md:mt-12 pt-6 md:pt-10 border-t border-slate-50 space-y-4 md:space-y-8 relative z-10">
                                <div className="flex justify-between items-center">
                                   <div>
                                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1 leading-none">KYC STATUS</p>
                                      <span className={`px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase italic ${member.kyc_status === 'verified' ? 'bg-amber-50 text-amber-600' : 'bg-amber-50 text-amber-600'}`}>
                                         {humanKycStatus(member.kyc_status)}
                                      </span>
                                   </div>
                                   <div className="text-right">
                                      <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1 leading-none">CUSTOMER ID</p>
                                      <p className="text-xs md:text-base font-black text-blue-950 italic leading-none">{member.customer_id || `VEV${String(member.id).padStart(3, '0')}`}</p>
                                   </div>
                                </div>
                                <button 
                                  onClick={() => setSelectedMember(member)}
                                  className="w-full bg-slate-50 text-slate-400 py-4 md:py-6 rounded-xl md:rounded-[1.75rem] text-[8px] md:text-[10px] font-black uppercase italic tracking-widest hover:bg-blue-950 hover:text-white transition-all flex items-center justify-center gap-3"
                                >
                                   <Eye size={16} /> Inspect Customer KYC
                                </button>
                             </div>
                          </div>
                         ))
                       ) : (
                         <div className="col-span-full py-40 text-center text-[11px] font-black text-slate-300 uppercase italic tracking-[0.4em]">No Customers Found In Directory</div>
                       )}
                    </div>
                 </motion.div>
              )}

              {activeTab === 'archive' && (
                 <motion.div key="archive" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 md:space-y-12">
                    <h3 className="text-xl md:text-4xl font-black text-blue-950 uppercase italic tracking-tighter">Approved Agreements Archive</h3>
                    <div className="bg-white border border-amber-50 rounded-[4rem] overflow-hidden shadow-sm">
                       <div className="overflow-x-auto">
                          <table className="w-full text-left min-w-[800px]">
                             <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                   <th className="py-10 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Customer Details</th>
                                   <th className="py-10 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Agreement Details</th>
                                   <th className="py-10 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">Status</th>
                                   <th className="py-10 px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest italic text-right">Action</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-50">
                                {agreements.filter(a => ['ratified', 'active'].includes(a.status)).length > 0 ? (
                                   agreements.filter(a => ['ratified', 'active'].includes(a.status)).map((agr, i) => (
                                      <tr key={i} className="hover:bg-amber-50/20 transition-all">
                                         <td className="py-12 px-6">
                                            <div className="flex items-center gap-6">
                                               <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-lg font-black text-blue-950 italic shadow-sm">{agr.user_name?.[0]}</div>
                                               <p className="text-sm md:text-lg font-black text-blue-950 uppercase italic">{agr.user_name}</p>
                                            </div>
                                         </td>
                                         <td className="py-12 px-6">
                                            <p className="text-xs font-black text-slate-400 uppercase italic mb-1">{humanAgreementType(agr.type)}</p>
                                            <p className="text-[10px] text-amber-600 font-bold tracking-widest italic">{agr.agreement_id}</p>
                                         </td>
                                         <td className="py-12 px-6">
                                            <span className="bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase italic border border-amber-100">Approved</span>
                                         </td>
                                         <td className="py-12 px-6 text-right">
                                            <button onClick={() => setSelectedDoc(agr)} className="w-12 h-12 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 hover:text-amber-500 transition-all ml-auto shadow-sm"><Eye size={18}/></button>
                                         </td>
                                      </tr>
                                   ))
                                ) : (
                                   <tr><td colSpan="4" className="py-40 text-center text-[11px] font-black text-slate-300 uppercase italic tracking-[0.4em]">Archive List is Empty</td></tr>
                                )}
                             </tbody>
                          </table>
                       </div>
                    </div>
                 </motion.div>
              )}

              {activeTab === 'disputes' && (
                 <motion.div key="disputes" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-8 md:space-y-12">
                    <h3 className="text-xl md:text-4xl font-black text-blue-950 uppercase italic tracking-tighter">Dispute Resolution Hub</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {disputes.length > 0 ? (
                          disputes.map((dis, i) => (
                             <div key={i} className="bg-white border-2 border-amber-50 p-10 rounded-[3rem] space-y-8 group hover:border-blue-500 transition-all shadow-sm">
                                <div className="flex justify-between items-start">
                                   <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase italic border ${dis.priority === 'high' ? 'bg-blue-50 text-blue-500 border-blue-100' : 'bg-amber-50 text-amber-500 border-amber-100'}`}>
                                      {dis.priority} Priority
                                   </div>
                                   <p className="text-[10px] font-black text-slate-300 uppercase italic tracking-widest">{humanStatus(dis.status)}</p>
                                </div>
                                <div>
                                   <h4 className="text-xl font-black text-blue-950 uppercase italic tracking-tight mb-2">{dis.subject}</h4>
                                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">{dis.dispute_id}</p>
                                </div>
                                <p className="text-xs text-slate-500 font-medium italic leading-relaxed">{dis.description}</p>
                                <button 
                                   onClick={() => handleLegalAction('resolve_dispute', dis.id)}
                                   className="w-full bg-blue-950 text-white py-5 rounded-2xl text-[10px] font-black uppercase italic tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-3 active:scale-95 transition-all"
                                 >
                                    <Scale size={16} /> Mark Dispute Resolved
                                 </button>
                             </div>
                          ))
                       ) : (
                          <div className="col-span-full py-40 text-center bg-white border border-amber-50 rounded-[4rem]">
                             <Shield className="mx-auto text-amber-100 mb-6" size={64} />
                             <p className="text-[11px] font-black text-slate-300 uppercase italic tracking-[0.4em]">No Active Disputes Found</p>
                          </div>
                       )}
                    </div>
                 </motion.div>
              )}
           </AnimatePresence>
        </main>
      </div>

      {/* Member Details Modal — Signature Authority Hub Aesthetic */}
      <AnimatePresence>
         {selectedMember && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-12">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedMember(null)} className="absolute inset-0 bg-blue-950/80 backdrop-blur-md"></motion.div>
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: 30 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 30 }}
                 className="relative w-full max-w-5xl bg-white border-2 md:border-8 border-amber-50 rounded-[2.5rem] md:rounded-[6rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar"
               >
                  <div className="p-8 md:p-24 space-y-12 md:space-y-20">
                     <div className="flex justify-between items-start">
                        <div className="flex items-center gap-6 md:gap-12">
                           <div className="w-20 h-20 md:w-32 md:h-32 bg-blue-950 rounded-3xl md:rounded-[3.5rem] flex items-center justify-center text-amber-500 text-3xl md:text-5xl font-black italic shadow-2xl">
                              {selectedMember.name[0]}
                           </div>
                           <div>
                              <h3 className="text-2xl md:text-5xl font-black text-blue-950 uppercase italic tracking-tighter leading-none">{selectedMember.name}</h3>
                              <p className="text-[10px] md:text-[14px] text-slate-400 font-black uppercase tracking-[0.3em] mt-3 md:mt-5 italic">Customer ID: {selectedMember.customer_id || `VEV${String(selectedMember.id).padStart(3, '0')}`}</p>
                           </div>
                        </div>
                        <button onClick={() => setSelectedMember(null)} className="w-12 h-12 md:w-20 md:h-20 bg-slate-50 border border-slate-100 rounded-2xl md:rounded-[2.5rem] flex items-center justify-center text-slate-300 hover:text-blue-500 transition-all"><X size={24} className="md:w-10 md:h-10"/></button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                        <div className="space-y-8">
                           <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                              <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-widest italic border-b border-slate-200 pb-4 flex items-center gap-4">
                                 <Fingerprint size={18} className="text-amber-500" /> Customer Details
                              </h4>
                              <div className="space-y-6">
                                 <div>
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic mb-1">Email Address</p>
                                    <p className="text-sm md:text-base font-black text-blue-950 italic">{selectedMember.email}</p>
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic mb-1">Registration Date</p>
                                    <p className="text-sm md:text-base font-black text-blue-950 italic">{new Date(selectedMember.created_at).toLocaleDateString()}</p>
                                 </div>
                                 <div>
                                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic mb-2">KYC Status</p>
                                     <div className="flex items-center gap-3">
                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase italic border shadow-sm ${
                                           selectedMember.kyc_status === 'verified' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                           selectedMember.kyc_status === 'rejected' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                                           'bg-amber-50 text-amber-600 border-amber-100'
                                        }`}>
                                           {humanKycStatus(selectedMember.kyc_status)}
                                        </span>
                                        {selectedMember.kyc_status === 'verified' && (
                                           <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-xl border border-amber-100">
                                              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                                              <p className="text-[8px] font-black text-amber-600 uppercase italic">KYC Verified</p>
                                           </div>
                                        )}
                                        {selectedMember.kyc_status === 'rejected' && (
                                           <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
                                              <XCircle size={12} className="text-blue-500" />
                                              <p className="text-[8px] font-black text-blue-600 uppercase italic">Rejected</p>
                                           </div>
                                        )}
                                     </div>
                                  </div>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-8">
                           <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 space-y-6">
                              <h4 className="text-[12px] font-black text-amber-600 uppercase tracking-widest italic border-b border-amber-200 pb-4 flex items-center gap-4">
                                 <FileDigit size={18} /> KYC Document
                              </h4>
                              {selectedMember.kyc_document ? (
                                 <div className="space-y-6">
                                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest italic">KYC Document Image Attached</p>
                                    <div className="aspect-video w-full bg-white rounded-3xl border-2 border-dashed border-amber-200 flex items-center justify-center text-amber-300 overflow-hidden shadow-inner group/img relative">
                                       <img 
                                         src={`${API_BASE_URL.replace('/api', '')}/${selectedMember.kyc_document}`} 
                                         alt="KYC Document"
                                         className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-700 cursor-zoom-in"
                                         onError={(e) => {
                                           e.target.style.display = 'none';
                                           e.target.nextSibling.style.display = 'flex';
                                         }}
                                       />
                                       <div className="hidden absolute inset-0 items-center justify-center flex-col gap-4 text-amber-200">
                                          <FileSearch size={48} />
                                          <p className="text-[10px] font-black uppercase italic">Document Image Error</p>
                                       </div>
                                    </div>
                                    <button 
                                      onClick={() => window.open(`${API_BASE_URL.replace('/api', '')}/${selectedMember.kyc_document}`, '_blank')}
                                      className="w-full bg-blue-950 text-white py-4 md:py-6 rounded-2xl md:rounded-3xl text-[10px] font-black uppercase italic tracking-widest hover:bg-amber-500 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-950/10"
                                    >
                                       <ExternalLink size={16} /> View Full Document
                                    </button>
                                 </div>
                              ) : (
                                 <div className="py-12 text-center opacity-40">
                                    <FileX size={48} className="mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase italic">No Document Attached</p>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>

                      <div className="flex flex-col sm:flex-row gap-4 pt-8 md:pt-12 border-t border-slate-100">
                         {selectedMember.kyc_status !== 'verified' && (
                            <button 
                              onClick={() => handleLegalAction('approve_kyc', selectedMember.id)}
                              className="flex-1 bg-amber-600 text-white py-6 rounded-3xl font-black uppercase tracking-widest text-[12px] hover:bg-amber-700 transition-all flex items-center justify-center gap-4 shadow-xl shadow-amber-500/20 italic active:scale-95"
                            >
                               <UserCheck size={20} /> Approve KYC
                            </button>
                         )}
                         <button 
                           onClick={() => handleLegalAction('reject_kyc', selectedMember.id)}
                           className="px-10 md:px-20 bg-white text-blue-500 border-4 border-blue-50 py-6 rounded-3xl font-black uppercase tracking-widest text-[12px] hover:bg-blue-500 hover:text-white transition-all italic active:scale-95"
                         >
                            Reject KYC
                         </button>
                      </div>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* Agreement Verification Modal */}
      <AnimatePresence>
         {selectedDoc && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedDoc(null)} className="absolute inset-0 bg-blue-950/90 backdrop-blur-md"></motion.div>
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95, y: 20 }}
                 className="relative w-full max-w-6xl bg-white border-2 border-amber-50 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto no-scrollbar"
               >
                  <div className="sticky top-0 z-[1010] bg-white/80 backdrop-blur-xl border-b border-slate-100 p-6 flex justify-between items-center">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-950 rounded-xl flex items-center justify-center text-amber-500 shadow-lg">
                           <FileSignature size={20} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Agreement Verification</p>
                     </div>
                     <button onClick={() => setSelectedDoc(null)} className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 hover:text-blue-500 transition-all"><X size={20}/></button>
                  </div>

                  <div className="p-8 md:p-16 lg:p-24 space-y-12">
                     <div className="text-center pb-12 border-b-2 border-blue-950 relative">
                        <div className="flex justify-center mb-6">
                           <div className="w-16 h-16 bg-blue-950 rounded-2xl flex items-center justify-center p-2 shadow-xl border-4 border-white">
                              <img src="/vamanan-logo.png" alt="Logo" className="w-full h-full object-contain" />
                           </div>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-blue-950 mb-2 uppercase italic leading-tight">{humanAgreementType(selectedDoc.type || 'Gold Purchase Agreement')}</h1>
                        <p className="text-amber-600 text-[10px] font-black tracking-[0.4em] uppercase italic">Agreement Reference ID: {selectedDoc.agreement_id}</p>
                     </div>

                     <div className="space-y-12 font-serif italic text-blue-900">
                        <p className="text-lg border-l-4 border-amber-500 pl-6 py-1 font-black text-blue-950 not-italic uppercase tracking-tight">
                           Established on <span className="text-amber-600 underline underline-offset-4">{new Date(selectedDoc.created_at).toLocaleDateString()}</span> at the Krishnagiri Branch.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                           <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                              <h3 className="font-black text-slate-400 mb-4 uppercase tracking-[0.4em] text-[8px] italic">Company (Issuer)</h3>
                              <p className="text-lg font-black text-blue-950 uppercase italic mb-2">Vamanan Enterprises</p>
                              <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest leading-relaxed">Krishnagiri Operations Center, Tamil Nadu – 635 002.</p>
                           </div>

                           <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                              <h3 className="font-black text-slate-400 mb-4 uppercase tracking-[0.4em] text-[8px] italic">Customer Details</h3>
                              <p className="text-lg font-black text-blue-950 uppercase italic mb-2">{selectedDoc.user_name}</p>
                              <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest leading-relaxed">{selectedDoc.aadhar_no || '---'} / {selectedDoc.pan_no || '---'}</p>
                           </div>
                        </div>

                        <div className="space-y-8 font-sans not-italic">
                           <div className="flex items-center gap-4 mb-4">
                              <div className="w-10 h-10 bg-blue-950 text-amber-500 rounded-xl flex items-center justify-center shadow-lg"><FileText size={20} /></div>
                              <h2 className="text-xl font-black text-blue-950 uppercase italic tracking-tighter">Product Specifications</h2>
                           </div>
                           
                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 border-y-2 border-slate-100 py-8 bg-slate-50/50 rounded-3xl px-8">
                              <div>
                                 <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.3em] mb-2 italic">Product Name</p>
                                 <p className="text-lg font-black text-blue-950 uppercase italic tracking-tighter">{selectedDoc.product_name || 'Custom Gold Asset'}</p>
                              </div>
                              <div className="sm:border-l border-slate-200 sm:pl-8">
                                 <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.3em] mb-2 italic">Total Price</p>
                                 <p className="text-lg font-black text-amber-600 italic tracking-tighter">₹{parseFloat(selectedDoc.price || 0).toLocaleString()}</p>
                              </div>
                              <div className="sm:border-l border-slate-200 sm:pl-8">
                                 <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.3em] mb-2 italic">Gold Weight</p>
                                 <p className="text-lg font-black text-blue-950 italic tracking-tighter">{selectedDoc.weight || '---'} Grams</p>
                              </div>
                           </div>
                        </div>

                        <div className="mt-12 pt-12 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-10 font-sans not-italic">
                           <div className="text-center group">
                              <div className="w-full h-24 border-b-2 border-slate-200 mb-4 flex items-center justify-center relative overflow-hidden rounded-2xl bg-slate-50 group-hover:bg-blue-950 transition-all duration-500">
                                 <Landmark size={40} className="text-slate-200 group-hover:text-amber-500 transition-colors opacity-20" />
                                 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-[8px] font-black text-amber-500 uppercase tracking-[0.4em] italic">VAM_SEC_AUTH_7</p>
                                 </div>
                              </div>
                              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400 mb-1">Company Authorization</p>
                              <p className="text-xs font-black text-blue-950 uppercase italic">Vamanan Enterprises V</p>
                           </div>

                           <div className="text-center group">
                               <div className={`w-full h-24 border-b-2 border-slate-200 mb-4 flex flex-col items-center justify-center rounded-2xl transition-all duration-500 ${['ratified', 'active'].includes(selectedDoc.status) ? 'bg-amber-50 border-amber-200' : 'bg-slate-50'}`}>
                                  {['ratified', 'active'].includes(selectedDoc.status) ? (
                                     <>
                                        <ShieldCheck size={28} className="text-amber-600 mb-1 animate-bounce" />
                                        <p className="text-[8px] font-black text-amber-700 uppercase tracking-widest italic">Approved by Advocate</p>
                                        <p className="text-[7px] text-slate-400 font-bold mt-1">TS: {selectedDoc.signed_at ? new Date(selectedDoc.signed_at).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                                     </>
                                  ) : (
                                     <>
                                        <Gavel size={28} className="text-slate-300 mb-1" />
                                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic">Awaiting Advocate Signature</p>
                                     </>
                                  )}
                               </div>
                              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400 mb-1">Authorized Advocate</p>
                              <p className="text-xs font-black text-blue-950 uppercase italic">Advocate Verification Seal</p>
                           </div>
                           
                           <div className="text-center group">
                               <div className={`w-full h-24 border-b-2 border-slate-200 mb-4 flex flex-col items-center justify-center rounded-2xl transition-all duration-500 ${['verified', 'ratified', 'active'].includes(selectedDoc.status) ? 'bg-amber-50 group-hover:bg-amber-500' : 'bg-slate-50'}`}>
                                  {['verified', 'ratified', 'active'].includes(selectedDoc.status) ? (
                                     <>
                                        <CheckCircle size={24} className="text-amber-500 mb-1 group-hover:text-white transition-colors" />
                                        <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest italic group-hover:text-white transition-colors">Customer Signed</p>
                                     </>
                                  ) : (
                                     <>
                                        <Clock size={24} className="text-slate-300 mb-1 animate-pulse" />
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Awaiting Customer Signature</p>
                                     </>
                                  )}
                                </div>
                              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400 mb-1">Customer Signature</p>
                              <p className="text-xs font-black text-blue-950 uppercase italic">{selectedDoc.user_name}</p>
                        </div>
                     </div>
                  </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-100">
                         {selectedDoc.status === 'verified' && (
                            <>
                               <button 
                                  onClick={() => handleLegalAction('approve_agreement', selectedDoc.id)}
                                  className="flex-1 bg-amber-600 text-white py-6 rounded-3xl font-black uppercase tracking-widest text-[12px] hover:bg-amber-700 transition-all flex items-center justify-center gap-4 shadow-xl shadow-amber-500/20 italic active:scale-95"
                               >
                                  <ShieldCheck size={20} /> Approve & Sign Agreement
                               </button>
                               <button 
                                  onClick={() => handleLegalAction('reject_agreement', selectedDoc.id)}
                                  className="px-10 md:px-20 bg-white text-blue-500 border-4 border-blue-50 py-6 rounded-3xl font-black uppercase tracking-widest text-[12px] hover:bg-blue-500 hover:text-white transition-all italic active:scale-95"
                               >
                                  Reject Agreement
                               </button>
                            </>
                         )}
                         {['ratified', 'active'].includes(selectedDoc.status) && (
                            <button 
                               disabled
                               className="flex-1 bg-amber-50 text-amber-600 py-6 rounded-3xl font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-4 border-4 border-amber-100 italic"
                            >
                               <CheckCircle size={20} /> Agreement Approved & Signed
                            </button>
                         )}
                         {selectedDoc.status === 'pending' && (
                            <button 
                               disabled
                               className="flex-1 bg-slate-50 text-slate-400 py-6 rounded-3xl font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-4 border border-slate-200 italic"
                            >
                               <Clock size={20} className="animate-pulse text-slate-300" /> Awaiting Customer Signature
                            </button>
                         )}
                         {selectedDoc.status === 'rejected' && (
                            <button 
                               disabled
                               className="flex-1 bg-blue-50 text-blue-500 py-6 rounded-3xl font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-4 border border-blue-100 italic"
                            >
                               <XCircle size={20} /> Agreement Rejected
                            </button>
                         )}
                      </div>
                   </div>
                </motion.div>
             </div>
          )}
       </AnimatePresence>

       {/* Purchase Audit & Correction Modal */}
       <AnimatePresence>
          {selectedPurchase && (
             <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedPurchase(null)} className="absolute inset-0 bg-blue-950/80 backdrop-blur-md"></motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-6xl bg-white border-2 border-amber-50 rounded-[2.5rem] md:rounded-[4rem] shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto no-scrollbar"
                >
                   <div className="sticky top-0 z-[1010] bg-white/95 border-b border-slate-100 p-6 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-blue-950 rounded-xl flex items-center justify-center text-amber-500 shadow-lg">
                            <ShoppingBag size={20} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Purchase Verification Details</p>
                            <h4 className="text-xs font-black text-blue-950 uppercase italic tracking-tight">Receipt #CC-{selectedPurchase.id}</h4>
                         </div>
                      </div>
                      <button onClick={() => setSelectedPurchase(null)} className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 hover:text-blue-500 transition-all"><X size={20}/></button>
                   </div>

                   <div className="p-8 md:p-16 lg:p-24 space-y-12">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                         <div className="space-y-8">
                            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-6">
                               <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic border-b border-slate-200 pb-3">Customer Details</h5>
                               <div className="grid grid-cols-2 gap-6">
                                  <div>
                                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Full Name</p>
                                     <p className="text-sm font-black text-blue-950 uppercase italic">{selectedPurchase.user_name || 'N/A'}</p>
                                  </div>
                                  <div>
                                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Email Address</p>
                                     <p className="text-sm font-black text-blue-950 italic break-all">{selectedPurchase.user_email || 'N/A'}</p>
                                  </div>
                                  <div>
                                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Phone Number</p>
                                     <p className="text-sm font-black text-blue-950 italic">{selectedPurchase.user_phone || 'N/A'}</p>
                                  </div>
                                  <div>
                                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">KYC Verification Details</p>
                                     <p className="text-sm font-black text-blue-950 uppercase italic">AADHAR: {selectedPurchase.aadhar_no || 'N/A'}</p>
                                     <p className="text-[10px] font-bold text-slate-500 uppercase">PAN: {selectedPurchase.pan_no || 'N/A'}</p>
                                  </div>
                               </div>
                            </div>

                            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-6">
                               <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic border-b border-slate-200 pb-3">Settlement Bank Details</h5>
                               <div className="grid grid-cols-2 gap-6">
                                  <div>
                                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Bank Name</p>
                                     <p className="text-sm font-black text-blue-950 uppercase italic">{selectedPurchase.bank_name || 'N/A'}</p>
                                  </div>
                                  <div>
                                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Branch Name</p>
                                     <p className="text-sm font-black text-blue-950 uppercase italic">{selectedPurchase.branch_name || 'N/A'}</p>
                                  </div>
                                  <div>
                                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Account Number</p>
                                     <p className="text-sm font-black text-blue-950 italic">{selectedPurchase.account_no || 'N/A'}</p>
                                  </div>
                                  <div>
                                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">IFSC Code</p>
                                     <p className="text-sm font-black text-blue-950 uppercase italic">{selectedPurchase.ifsc_code || 'N/A'}</p>
                                  </div>
                               </div>
                            </div>

                            <div className="bg-amber-50/50 p-8 rounded-3xl border border-amber-100 space-y-6">
                               <h5 className="text-[11px] font-black text-amber-700 uppercase tracking-widest italic border-b border-amber-200/50 pb-3">Uploaded Payment Receipt</h5>
                               {selectedPurchase.payment_screenshot ? (
                                  <div className="space-y-4">
                                     <div className="aspect-video w-full bg-white rounded-2xl border-2 border-dashed border-amber-200 flex items-center justify-center overflow-hidden shadow-inner group/img relative">
                                        <img 
                                          src={`${API_BASE_URL.replace('/api', '')}/${selectedPurchase.payment_screenshot}`} 
                                          alt="Payment Receipt"
                                          className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700 cursor-zoom-in"
                                          onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                          }}
                                        />
                                        <div className="hidden absolute inset-0 items-center justify-center flex-col gap-4 text-amber-200 font-sans font-bold">
                                           <FileSearch size={48} />
                                           <p className="text-[10px] font-black uppercase italic">Receipt Image Missing</p>
                                        </div>
                                     </div>
                                     <button 
                                        onClick={() => window.open(`${API_BASE_URL.replace('/api', '')}/${selectedPurchase.payment_screenshot}`, '_blank')}
                                        className="w-full bg-blue-950 text-white py-4 rounded-xl text-[9px] font-black uppercase italic tracking-widest hover:bg-amber-500 transition-all flex items-center justify-center gap-3 shadow-md"
                                     >
                                        <ExternalLink size={14} /> View Full Receipt Image
                                     </button>
                                  </div>
                               ) : (
                                  <div className="py-12 text-center opacity-40">
                                     <FileX size={48} className="mx-auto mb-4 text-amber-400" />
                                     <p className="text-[10px] font-black uppercase italic text-amber-700">No Receipt Image Uploaded</p>
                                  </div>
                               )}
                            </div>
                         </div>

                         <div className="space-y-8 bg-white border border-slate-100 p-8 rounded-3xl shadow-sm">
                            <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-widest italic border-b border-slate-100 pb-3 flex items-center gap-2">
                               <ShoppingBag size={16} className="text-amber-500" /> Purchase Information
                            </h5>
                            
                            <div className="space-y-6">
                               <div className="grid grid-cols-2 gap-6">
                                  <div>
                                     <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Product Name</label>
                                     <div className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black text-blue-900 uppercase italic">
                                        {selectedPurchase.product_name || 'Product'}
                                     </div>
                                  </div>
                                  <div>
                                     <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Asset Type / Category</label>
                                     <div className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black text-blue-900 uppercase italic">
                                        {selectedPurchase.asset_type || 'N/A'}
                                     </div>
                                  </div>
                                  <div>
                                     <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Weight (Grams)</label>
                                     <div className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black text-blue-950 italic">
                                        {parseFloat(selectedPurchase.weight || 0).toFixed(3)} G
                                     </div>
                                  </div>
                                  <div>
                                     <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Payment Method</label>
                                     <div className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black text-blue-950 uppercase italic">
                                        {selectedPurchase.payment_method || 'Bank Transfer'}
                                     </div>
                                  </div>
                                  <div className="col-span-2">
                                     <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Transaction ID (TID)</label>
                                     <div className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black text-blue-950 uppercase break-all">
                                        {selectedPurchase.transaction_id || 'N/A'}
                                     </div>
                                  </div>

                                  <div className="border-t border-slate-100 col-span-2 pt-6 my-2">
                                     <h6 className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic mb-2">Payment Details</h6>
                                  </div>

                                  <div>
                                     <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Product Subtotal (Ex-GST)</label>
                                     <div className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black text-blue-955 italic">
                                        ₹{parseFloat(selectedPurchase.product_amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                     </div>
                                  </div>
                                  <div>
                                     <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">GST Amount</label>
                                     <div className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black text-blue-955 italic">
                                        ₹{parseFloat(selectedPurchase.gst_amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                     </div>
                                  </div>
                                  <div>
                                     <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Total Paid (Inclusive of GST)</label>
                                     <div className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black text-amber-600 italic">
                                        ₹{parseFloat(selectedPurchase.total_value || selectedPurchase.total_amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                     </div>
                                  </div>
                                  <div>
                                     <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Cashback Eligible (Ex-GST)</label>
                                     <div className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-black text-blue-955 italic">
                                        ₹{parseFloat(selectedPurchase.cashback_eligible_amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                     </div>
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-slate-100">
                         {selectedPurchase.status === 'pending' && (
                            <>
                               <button 
                                  onClick={() => handleLegalAction('approve_purchase', selectedPurchase.id)}
                                  className="flex-1 bg-amber-600 text-white py-6 rounded-3xl font-black uppercase tracking-widest text-[12px] hover:bg-amber-700 transition-all flex items-center justify-center gap-4 shadow-xl shadow-amber-500/20 italic active:scale-95"
                               >
                                  <ShieldCheck size={20} /> Verify & Approve Purchase
                               </button>
                               <button 
                                  onClick={() => handleLegalAction('reject_purchase', selectedPurchase.id)}
                                  className="px-10 md:px-20 bg-white text-blue-500 border-4 border-blue-50 py-6 rounded-3xl font-black uppercase tracking-widest text-[12px] hover:bg-blue-500 hover:text-white transition-all italic active:scale-95"
                               >
                                  Reject Purchase
                               </button>
                            </>
                         )}
                         {selectedPurchase.status === 'active' && (
                            <button 
                               disabled
                               className="flex-1 bg-amber-50 text-amber-600 py-6 rounded-3xl font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-4 border-4 border-amber-100 italic"
                            >
                               <CheckCircle size={20} /> Purchase Record Approved & Active
                            </button>
                         )}
                         {['completed', 'rejected', 'cancelled'].includes(selectedPurchase.status) && (
                            <button 
                               disabled
                               className="flex-1 bg-slate-50 text-slate-400 py-6 rounded-3xl font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-4 border border-slate-200 italic"
                            >
                               <CheckCircle2 size={20} /> Record Status: {selectedPurchase.status.toUpperCase()}
                            </button>
                         )}
                      </div>
                   </div>
                </motion.div>
             </div>
          )}
       </AnimatePresence>
    </div>
  );
};

export default AdvocateDashboard;
