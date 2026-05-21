import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, BarChart3, PauseCircle, Users, Wallet, ArrowLeft, ArrowRight, 
  History, CheckCircle, CheckCircle2, XCircle, Loader2, Search, Settings, 
  Settings2, Trash2, ShieldCheck, TrendingUp, TrendingDown, ShoppingBag, 
  Plus, Activity, Zap, UserPlus, Megaphone, Globe, CreditCard, MessageCircle, 
  AlertTriangle, LogOut, Eye, EyeOff, ExternalLink, Menu, Package, Award, 
  ShoppingCart, Clock, Coins, Star, Save, Edit3, X, Percent, Phone, Mail, 
  UserCircle, FileText, RefreshCw, Network, ChevronRight, ChevronDown, 
  Trophy, Target, Trash, Landmark, PlusCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config';

const AVAILABLE_PERMISSIONS = [
  { id: 'overview', label: 'Dashboard', icon: BarChart3 },
  { id: 'investments', label: 'Investments', icon: ShoppingCart },
  { id: 'inventory', label: 'Assets', icon: ShoppingBag },
  { id: 'users', label: 'Entities', icon: Users },
  { id: 'genealogy', label: 'Genealogy', icon: Network },
  { id: 'wallets_view', label: 'Wallets', icon: Wallet },
  { id: 'kyc', label: 'KYC', icon: ShieldCheck },
  { id: 'withdrawals', label: 'Withdrawals', icon: Landmark },
  { id: 'tickets', label: 'Notifications', icon: Megaphone },
  { id: 'market_rates', label: 'Market Rates', icon: TrendingUp },
  { id: 'recruitment', label: 'Staffing', icon: UserPlus },
  { id: 'settings', label: 'Settings', icon: Globe },
];

const ManagerDashboard = () => {
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : {};
  const role = currentUser.role || 'customer';
  const permissions = currentUser.permissions ? (typeof currentUser.permissions === 'string' ? JSON.parse(currentUser.permissions) : currentUser.permissions) : [];

  const isTabAllowed = (tabId) => {
    if (role === 'admin') return true;
    if (permissions.length === 0) return tabId === 'overview';
    return permissions.includes(tabId);
  };

  const [stats, setStats] = useState({ revenue: 0, payouts: 0, users: 0, fraud: 0, withdrawals: [] });
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [investmentHistory, setInvestmentHistory] = useState([]);
  const [walletsData, setWalletsData] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [reports, setReports] = useState([]);
  const [platformSettings, setPlatformSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKYC, setSelectedKYC] = useState(null);
  
  const navigate = useNavigate();

  const [profileForm, setProfileForm] = useState({
    name: currentUser.name || '',
    email: currentUser.email || '',
    phone: currentUser.phone || '',
    password: '',
    notify_email: currentUser.notify_email !== undefined ? !!currentUser.notify_email : true,
    notify_system: currentUser.notify_system !== undefined ? !!currentUser.notify_system : true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [settingsTab, setSettingsTab] = useState('personal');
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [assetForm, setAssetForm] = useState({
    price: '',
    weight: '',
    image: null,
    description: '',
    is_active: 1
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', type: 'info' });
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', role: 'staff', password: '', permissions: ['overview', 'kyc', 'tickets'] });
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const results = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/manager/stats.php`),
        axios.get(`${API_BASE_URL}/admin/all_users.php`),
        axios.get(`${API_BASE_URL}/admin/products.php`),
        axios.get(`${API_BASE_URL}/admin/withdrawals.php`),
        axios.get(`${API_BASE_URL}/admin/investments.php`),
        axios.get(`${API_BASE_URL}/admin/investment_history.php`),
        axios.get(`${API_BASE_URL}/admin/settings.php`),
        axios.get(`${API_BASE_URL}/admin/wallets.php`),
        axios.get(`${API_BASE_URL}/admin/get_all_notifications.php`),
        axios.get(`${API_BASE_URL}/admin/payout_reports.php`)
      ]);

      const getData = (idx) => results[idx]?.status === 'fulfilled' && results[idx].value?.data?.status === 'success' ? results[idx].value.data.data : null;

      const statsData = getData(0); 
      if (statsData) {
        setStats(statsData);
        setUsers(statsData.all_users || []);
        setWithdrawals(statsData.withdrawals || []);
        setInvestments(statsData.investments || []); // Added if available
      }
      const prodsData = getData(2); if (prodsData) setProducts(prodsData);
      const setData   = getData(6); if (setData) setPlatformSettings(setData);
      const walData   = getData(7); if (walData) setWalletsData(walData);
      const notifData = getData(8); if (notifData) setNotifications(notifData);
      const repData   = getData(9); if (repData) setReports(repData.history || []);

    } catch (err) {
      console.error("Failed to fetch manager data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Redirect if current tab is not allowed
  useEffect(() => {
    if (!loading && !isTabAllowed(activeTab)) {
      setActiveTab('overview');
    }
  }, [activeTab, loading]);

  const handleAction = async (action, id) => {
    setProcessing(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/manager/actions.php`, { action, id });
      if (res.data.status === 'success') {
        fetchData();
        setSelectedKYC(null);
      }
    } catch (err) {
      alert("Action protocol failed: " + (err.response?.data?.message || err.message));
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveInvestment = async (cycle_id, status) => {
    if (!window.confirm(`Initialize ${status === 'active' ? 'APPROVAL' : 'REJECTION'} sequence?`)) return;
    setProcessing(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/approve_investment.php`, { cycle_id, status });
      if (res.data.status === 'success') {
        fetchData();
      }
    } catch (err) {
      alert("Terminal error: " + (err.response?.data?.message || "Server failure"));
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/manager/update_profile.php`, {
        id: currentUser.id,
        ...profileForm
      });
      if (res.data.status === 'success') {
        localStorage.setItem('user', JSON.stringify(res.data.data));
        setSuccessMessage('Institutional identity updated successfully.');
        setTimeout(() => setSuccessMessage(null), 5000);
        setProfileForm({ ...profileForm, password: '' });
      } else {
        alert("Error: " + res.data.message);
      }
    } catch (err) {
      alert("Failed to update profile.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const endpoint = isEditing ? 'update_product.php' : 'products.php';
      const formData = new FormData();
      Object.keys(assetForm).forEach(key => {
        if (key === 'image') {
          if (assetForm[key] instanceof File) {
            formData.append('image', assetForm[key]);
          }
        } else if (assetForm[key] !== null && assetForm[key] !== undefined) {
          formData.append(key, assetForm[key]);
        }
      });
      if (isEditing) formData.append('id', assetForm.id);

      const res = await axios.post(`${API_BASE_URL}/admin/${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.status === 'success') {
        setSuccessMessage(isEditing ? 'Institutional asset updated successfully.' : 'The new institutional asset is now live in the inventory.');
        setTimeout(() => setSuccessMessage(null), 5000);
        setShowAssetModal(false);
        setIsEditing(false);
        setAssetForm({ name: '', category: 'Gold Asset', price: '', weight: '', purity: '24K', image: null, description: '', is_active: 1 });
        fetchData();
      }
    } catch (err) {
      console.error(err);
      alert("Terminal error: " + (err.response?.data?.message || "Protocol failure"));
    }
    setProcessing(false);
  };

  const handleDeleteAsset = async (id) => {
    if (!window.confirm("Execute DECOMMISSION sequence for this asset? This action is irreversible.")) return;
    setProcessing(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/delete_product.php`, { id });
      if (res.data.status === 'success') {
        setSuccessMessage('Asset successfully decommissioned from inventory.');
        setTimeout(() => setSuccessMessage(null), 5000);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
    setProcessing(false);
  };

  const handleCreateBroadcast = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/broadcast.php`, broadcastForm);
      if (res.data.status === 'success') {
        setSuccessMessage('Institutional broadcast dispatched successfully.');
        setTimeout(() => setSuccessMessage(null), 5000);
        setShowBroadcastModal(false);
        setBroadcastForm({ title: '', message: '', type: 'info' });
        fetchData();
      }
    } catch (err) {
      alert("Broadcast failure: " + (err.response?.data?.message || "Protocol error"));
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/add_staff.php`, staffForm);
      if (res.data.status === 'success') {
        setSuccessMessage('Personnel successfully onboarded to the operations hub.');
        setTimeout(() => setSuccessMessage(null), 5000);
        setShowStaffModal(false);
        setStaffForm({ name: '', email: '', role: 'staff', password: '' });
        fetchData();
      }
    } catch (err) {
      alert("Onboarding failed: " + (err.response?.data?.message || "Security violation"));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center text-amber-600">
      <div className="flex flex-col items-center gap-6">
        <Loader2 className="animate-spin" size={60} strokeWidth={3} />
        <p className="text-[10px] font-black animate-pulse uppercase tracking-[0.4em] italic">Accessing Operations Ledger...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-inter text-slate-900 overflow-x-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        showMobileMenu={showMobileMenu} 
        setShowMobileMenu={setShowMobileMenu} 
      />

      <div className="flex-1 lg:ml-72 flex flex-col min-h-screen w-full">
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 md:px-12 py-8 flex lg:grid lg:grid-cols-3 items-center justify-between sticky top-0 z-50">
          {/* Left: Control Layer (Mobile) / Page Title (Desktop) */}
          <div className="flex items-center gap-8">
             <button 
               onClick={() => setShowMobileMenu(true)} 
               className="p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-sm group lg:hidden"
             >
                <Menu size={22} className="group-hover:scale-110 transition-transform" />
             </button>
             
             {/* Desktop Page Title */}
             <div className="hidden lg:block">
                <div className="flex flex-col">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center overflow-hidden p-1.5 shadow-xl border border-white/10">
                         <img src="/vamanan-logo.png" alt="Vamanan Gold" className="w-full h-full object-contain" />
                      </div>
                      <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
                         {activeTab.replace('_', ' ')}
                      </h2>
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 ml-16 italic">Manager Command Node</p>
                </div>
             </div>
          </div>

          {/* Center: System Status & Identity */}
          <div className="flex flex-col items-center justify-center">
             {/* <div className="hidden lg:flex items-center gap-4 bg-slate-900/5 px-6 py-2.5 rounded-full border border-slate-200/50 backdrop-blur-sm shadow-inner group">
                <div className="relative">
                   <div className={`w-2 h-2 ${stats.users?.total > 0 ? 'bg-emerald-500' : 'bg-amber-500'} rounded-full animate-pulse`}></div>
                   <div className={`absolute inset-0 ${stats.users?.total > 0 ? 'bg-emerald-500' : 'bg-amber-500'} rounded-full animate-ping opacity-20`}></div>
                </div>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] italic group-hover:text-slate-900 transition-colors">
                   {stats.users?.total || 0} Institutional Nodes Active
                </span>
             </div> */}

             {/* Mobile Identity */}
             <div className="flex flex-col items-center justify-center lg:hidden">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden p-1 shadow-xl rotate-3">
                      <img src="/vamanan-logo.png" alt="Vamanan Gold" className="w-full h-full object-contain" />
                   </div>
                   <h1 className="text-sm font-black tracking-tighter text-slate-900 uppercase italic leading-none">
                      Vamanan <span className="text-amber-600">Gold</span>
                   </h1>
                </div>
             </div>
          </div>

          {/* Right: Operational Authority */}
          <div className="flex items-center justify-end">
             <div 
               onClick={() => setActiveTab('settings')} 
               className="flex items-center gap-6 cursor-pointer group/profile transition-all px-4 py-2 rounded-[2rem] hover:bg-slate-50 border border-transparent hover:border-slate-200 shadow-sm hover:shadow-md"
             >
                <div className="hidden sm:flex flex-col items-end">
                   <p className="text-xs font-black text-slate-900 uppercase italic leading-none tracking-tighter group-hover/profile:text-amber-600 transition-colors">
                      {currentUser.name || 'Regional User'}
                   </p>
                   <div className="flex items-center gap-2 mt-2">
                      <div className="px-2 py-0.5 bg-amber-500/10 rounded-md border border-amber-500/20">
                         <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest italic flex items-center gap-1.5">
                            <ShieldCheck size={10} /> {currentUser.role?.toUpperCase() || 'MANAGER'}
                         </p>
                      </div>
                   </div>
                </div>
                <div className="relative">
                   <div className="absolute -inset-1.5 bg-gradient-to-tr from-amber-600 to-amber-200 rounded-[1.5rem] blur opacity-0 group-hover/profile:opacity-40 transition duration-500"></div>
                   <div className="relative w-12 h-12 md:w-14 md:h-14 bg-slate-900 text-amber-500 rounded-[1.4rem] flex items-center justify-center font-black italic shadow-2xl border-4 border-white ring-1 ring-slate-200 transform group-hover/profile:scale-105 transition-all text-xl">
                      {currentUser.name ? currentUser.name[0] : 'M'}
                   </div>
                   <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full shadow-lg"></div>
                </div>
             </div>
          </div>
        </header>

        <main className="p-6 md:p-12 lg:p-16 max-w-7xl mx-auto w-full space-y-12 pb-32">
          {activeTab === 'overview' && (
            <div className="space-y-16">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all"></div>
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="p-3 bg-slate-50 text-slate-900 rounded-2xl shadow-inner"><Landmark size={24}/></div>
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full italic tracking-widest">LIVE VOLUME</span>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Total Investment Volume</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic">₹{(stats.revenue?.total_volume || 0).toLocaleString()}</h3>
                </div>
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-slate-50 text-slate-900 rounded-2xl"><Users size={24}/></div>
                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">+5.2%</span>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Total Users</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic">{stats.users?.total || 0}</h3>
                </div>
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-all"></div>
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="p-3 bg-slate-50 text-slate-900 rounded-2xl shadow-inner"><Zap size={24}/></div>
                    <div className="text-[9px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full italic tracking-widest">{stats.revenue?.active_investments || 0} ACTIVE</div>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Active Protocols</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic">{stats.revenue?.active_investments || 0} Members</h3>
                </div>
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-all"></div>
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="p-3 bg-slate-50 text-slate-900 rounded-2xl shadow-inner"><TrendingUp size={24}/></div>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Today's Gold Rate</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic">₹{stats.liveGoldPrice || 0}</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter">KYC Queue</h3>
                    <button onClick={() => setActiveTab('kyc')} className="text-[10px] font-black text-amber-600 uppercase italic">View All</button>
                  </div>
                  <div className="space-y-6">
                    {users.filter(u => u.kyc_status === 'pending').slice(0, 3).map(u => (
                      <div key={u.id} className="flex justify-between items-center p-6 bg-slate-50 rounded-[2rem] hover:bg-white border border-transparent hover:border-slate-100 transition-all group">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black italic">{u.name[0]}</div>
                          <div>
                            <p className="text-sm font-black italic uppercase">{u.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">{u.email}</p>
                          </div>
                        </div>
                        <button onClick={() => { setSelectedKYC(u); setActiveTab('kyc'); }} className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase italic tracking-widest hover:bg-slate-900 hover:text-white transition-all">Review</button>
                      </div>
                    ))}
                    {users.filter(u => u.kyc_status === 'pending').length === 0 && (
                      <p className="text-center py-10 text-[10px] font-black text-slate-300 uppercase italic">All identities validated</p>
                    )}
                  </div>
                </div>

                <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter">Recent Withdrawals</h3>
                    <button onClick={() => setActiveTab('withdrawals')} className="text-[10px] font-black text-amber-600 uppercase italic">View All</button>
                  </div>
                  <div className="space-y-6">
                    {withdrawals.slice(0, 3).map(w => (
                      <div key={w.id} className="flex justify-between items-center p-6 bg-slate-50 rounded-[2rem] border border-transparent hover:border-slate-100 transition-all group">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-slate-900 text-amber-500 rounded-xl flex items-center justify-center font-black italic"><Wallet size={20}/></div>
                          <div>
                            <p className="text-sm font-black italic uppercase">{w.user_name}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">{w.payment_method}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black italic">₹{parseFloat(w.amount).toLocaleString()}</p>
                          <p className={`text-[8px] font-black uppercase ${w.status === 'pending' ? 'text-amber-500' : 'text-emerald-500'}`}>{w.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white border border-slate-200 p-12 rounded-[4rem] shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Investor Directory</h3>
                <div className="relative w-full md:w-80">
                  <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search Node..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] py-4 pl-14 pr-8 text-[11px] font-black uppercase italic outline-none focus:bg-white focus:border-amber-500 transition-all shadow-inner" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                  <div key={u.id} className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 hover:border-amber-500/50 hover:bg-white transition-all shadow-sm group relative overflow-hidden">
                    {u.status === 'pending' && (
                       <div className="absolute top-0 right-0 px-6 py-2 bg-amber-500 text-white text-[8px] font-black uppercase italic tracking-widest rounded-bl-2xl shadow-lg">New Request</div>
                    )}
                    
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-16 h-16 bg-slate-900 text-amber-500 rounded-[1.5rem] flex items-center justify-center font-black italic text-xl border border-white/5 shadow-xl">{u.name[0]}</div>
                      <div className="min-w-0">
                        <p className="text-base font-black text-slate-900 uppercase italic tracking-tighter truncate leading-none mb-2">{u.name}</p>
                        <div className="flex items-center gap-2">
                           <Clock size={10} className="text-slate-400" />
                           <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest italic truncate">Joined {new Date(u.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                       <div className="p-4 bg-white/50 rounded-2xl border border-slate-200/50">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Wallet</p>
                          <p className="text-sm font-black text-slate-900 italic">₹{parseFloat(u.balance || 0).toLocaleString()}</p>
                       </div>
                       <div className="p-4 bg-white/50 rounded-2xl border border-slate-200/50">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Status</p>
                          <div className="flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : u.status === 'pending' ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
                             <p className={`text-[9px] font-black italic uppercase ${u.status === 'active' ? 'text-emerald-600' : u.status === 'pending' ? 'text-amber-500' : 'text-rose-500'}`}>{u.status}</p>
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-6 border-t border-slate-200/60">
                       {u.status === 'pending' ? (
                          <button 
                            onClick={() => handleAction('activate_user', u.id)}
                            disabled={processing}
                            className="w-full bg-slate-900 text-amber-500 py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] italic hover:bg-emerald-600 hover:text-white transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                          >
                             <CheckCircle size={14} /> Grant Login Access
                          </button>
                       ) : u.status === 'active' ? (
                          <button 
                            onClick={() => handleAction('suspend_user', u.id)}
                            disabled={processing}
                            className="w-full bg-white border border-rose-100 text-rose-500 py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] italic hover:bg-rose-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                          >
                             <ShieldAlert size={14} /> Suspend Institutional ID
                          </button>
                       ) : (
                          <button 
                            onClick={() => handleAction('activate_user', u.id)}
                            disabled={processing}
                            className="w-full bg-emerald-50 text-emerald-600 py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] italic hover:bg-emerald-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                          >
                             <RefreshCw size={14} /> Re-Activate ID
                          </button>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'investments' && (
            <div className="bg-white border border-slate-200 p-12 rounded-[4rem] shadow-sm">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-12">Pending Acquisition Protocol</h3>
              <div className="space-y-6">
                {investments.length === 0 ? (
                  <div className="py-24 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                    <ShoppingCart size={60} className="mx-auto text-slate-200 mb-6" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">All acquisition protocols finalized</p>
                  </div>
                ) : (
                  investments.map(inv => (
                    <div key={inv.cycle_id} className="p-10 bg-slate-50 border border-slate-100 hover:border-amber-500/30 hover:bg-white rounded-[3rem] transition-all group">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 items-center">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Investor Entity</p>
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black italic">{inv.user_name[0]}</div>
                            <div>
                              <p className="text-sm font-black italic uppercase">{inv.user_name}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">{inv.user_email}</p>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Asset Matrix</p>
                          <p className="text-sm font-black italic uppercase">{inv.asset_type === 'silver' ? 'Silver Asset' : 'Gold Asset'}</p>
                          <p className="text-[10px] text-amber-600 font-black uppercase mt-1 italic">{inv.weight} Grams</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Valuation</p>
                          <p className="text-xl font-black italic tracking-tighter">₹{parseFloat(inv.total_value).toLocaleString()}</p>
                          <p className="text-[10px] text-emerald-600 font-black uppercase mt-1 italic">₹{inv.daily_payout}/Day Yield</p>
                        </div>
                        <div className="flex gap-4">
                          <button onClick={() => handleApproveInvestment(inv.cycle_id, 'active')} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-slate-200 italic">Approve</button>
                          <button onClick={() => handleApproveInvestment(inv.cycle_id, 'rejected')} className="flex-1 bg-white border border-slate-200 text-slate-400 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition-all active:scale-95 italic">Reject</button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'kyc' && (
            <div className="bg-white border border-slate-200 p-12 rounded-[4rem] shadow-sm">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-12">Identity Verification Terminal</h3>
              <div className="space-y-6">
                {users.filter(u => u.kyc_status === 'pending').map(u => (
                  <div key={u.id} className="p-10 bg-slate-50 border border-slate-100 hover:border-amber-500/30 hover:bg-white rounded-[3rem] transition-all group">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                      <div className="flex items-center gap-8">
                        <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center font-black italic text-xl shadow-xl">{u.name[0]}</div>
                        <div>
                          <p className="text-lg font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-2">{u.name}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase italic">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-6">
                        <button onClick={() => setSelectedKYC(u)} className="px-10 py-4 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-900 hover:text-white transition-all italic active:scale-95 shadow-sm">Review Document</button>
                        <button onClick={() => handleAction('approve_kyc', u.id)} className="p-4 bg-slate-900 text-amber-500 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-xl active:scale-95 border border-white/5"><CheckCircle size={24}/></button>
                        <button onClick={() => handleAction('reject_kyc', u.id)} className="p-4 bg-white border border-slate-200 text-slate-300 rounded-2xl hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm active:scale-95"><X size={24}/></button>
                      </div>
                    </div>
                  </div>
                ))}
                {users.filter(u => u.kyc_status === 'pending').length === 0 && (
                  <div className="py-24 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                    <ShieldCheck size={60} className="mx-auto text-slate-200 mb-6" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">All identities validated</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'withdrawals' && (
            <div className="bg-white border border-slate-200 p-12 rounded-[4rem] shadow-sm">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-12">Liquidity Disbursement Queue</h3>
              <div className="space-y-6">
                {withdrawals.filter(w => w.status === 'pending').map(w => (
                  <div key={w.id} className="p-10 bg-slate-50 border border-slate-100 hover:border-amber-500/30 hover:bg-white rounded-[3rem] transition-all group">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                      <div className="flex items-center gap-8">
                        <div className="w-16 h-16 bg-slate-900 text-amber-500 rounded-[1.5rem] flex items-center justify-center font-black italic shadow-xl"><Landmark size={24}/></div>
                        <div>
                          <p className="text-lg font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-2">{w.user_name}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase italic">{w.payment_method}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-12">
                        <div className="text-right">
                          <p className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none mb-1">₹{parseFloat(w.amount).toLocaleString()}</p>
                          <p className="text-[9px] font-black text-amber-500 uppercase italic tracking-widest">Pending Node</p>
                        </div>
                        <div className="flex gap-4">
                          <button onClick={() => handleAction('approve_withdrawal', w.id)} className="p-4 bg-slate-900 text-amber-500 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-xl active:scale-95 border border-white/5"><CheckCircle size={24}/></button>
                          <button onClick={() => handleAction('reject_withdrawal', w.id)} className="p-4 bg-white border border-slate-200 text-slate-300 rounded-2xl hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm active:scale-95"><X size={24}/></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {withdrawals.filter(w => w.status === 'pending').length === 0 && (
                  <div className="py-24 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                    <Wallet size={60} className="mx-auto text-slate-200 mb-6" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">All disbursements finalized</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto space-y-12 pb-20">
               {/* Settings Navigation */}
               <div className="flex flex-wrap gap-4 mb-12">
                  {[
                    { id: 'personal', label: 'Identity & Security', icon: UserCircle },
                    { id: 'permissions', label: 'Authorization Matrix', icon: ShieldCheck },
                    { id: 'activity', label: 'Operational Footprint', icon: Activity },
                    { id: 'notifications', label: 'Alert Protocols', icon: Megaphone }
                  ].map(tab => (
                    <button 
                      key={tab.id}
                      onClick={() => setSettingsTab(tab.id)}
                      className={`px-8 py-4 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest italic transition-all ${settingsTab === tab.id ? 'bg-slate-900 text-amber-500 shadow-xl' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
                    >
                      <tab.icon size={16} /> {tab.label}
                    </button>
                  ))}
               </div>

               {settingsTab === 'personal' && (
                 <div className="space-y-12">
                    <div className="bg-white border border-slate-200 p-8 md:p-16 rounded-[4rem] shadow-sm relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12"><UserCircle size={240} /></div>
                       <div className="flex items-center gap-8 mb-16 relative z-10">
                          <div className="w-20 h-20 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-amber-500 shadow-2xl border border-white/5"><UserCircle size={40}/></div>
                          <div>
                             <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Institutional Identity</h3>
                             <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] mt-1 italic">Maintain your authenticated manager credentials</p>
                          </div>
                       </div>

                       <form onSubmit={handleUpdateProfile} className="space-y-10 relative z-10">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Full Name</label>
                                <input 
                                  type="text" 
                                  required 
                                  value={profileForm.name} 
                                  onChange={e => setProfileForm({...profileForm, name: e.target.value})} 
                                  className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-5 px-8 text-sm font-black uppercase italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner" 
                                />
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Official Email</label>
                                <input 
                                  type="email" 
                                  required 
                                  value={profileForm.email} 
                                  onChange={e => setProfileForm({...profileForm, email: e.target.value})} 
                                  className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-5 px-8 text-sm font-black italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner" 
                                />
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Mobile Number</label>
                                <input 
                                  type="text" 
                                  value={profileForm.phone} 
                                  onChange={e => setProfileForm({...profileForm, phone: e.target.value})} 
                                  className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-5 px-8 text-sm font-black italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner" 
                                  placeholder="+91 XXXXX XXXXX"
                                />
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Change Access Key (Optional)</label>
                                <div className="relative">
                                   <input 
                                     type={showPassword ? "text" : "password"} 
                                     value={profileForm.password} 
                                     onChange={e => setProfileForm({...profileForm, password: e.target.value})} 
                                     className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-5 px-8 text-sm font-black italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner tracking-widest" 
                                     placeholder="••••••••"
                                   />
                                   <button 
                                     type="button" 
                                     onClick={() => setShowPassword(!showPassword)} 
                                     className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400"
                                   >
                                     {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                   </button>
                                </div>
                             </div>
                          </div>

                          <div className="pt-8 flex justify-end">
                             <button 
                               type="submit" 
                               disabled={processing} 
                               className="w-full md:w-80 bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 hover:bg-amber-600 transition shadow-2xl active:scale-95"
                             >
                                {processing ? <Loader2 className="animate-spin" /> : <><Save size={20}/> Sync Credentials</>}
                             </button>
                          </div>
                       </form>
                    </div>
                 </div>
               )}

               {settingsTab === 'permissions' && (
                 <div className="space-y-12">
                    <div className="bg-slate-900 rounded-[4rem] p-16 text-white relative overflow-hidden group border border-white/5 shadow-2xl">
                       <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-1000 rotate-12"><ShieldCheck size={260} /></div>
                       <div className="relative z-10">
                          <h4 className="text-3xl font-black uppercase italic tracking-tighter mb-6 flex items-center gap-4">
                             <div className="w-2 h-8 bg-amber-500 rounded-full"></div> Authorization Matrix
                          </h4>
                          <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.3em] mb-16 italic max-w-2xl leading-relaxed">
                            Your operational level provides high-priority clearance for asset management, KYC verification, and liquidity processing.
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                             {[
                                { label: 'User Directory Access', status: 'ACTIVE', desc: 'Read/Write access to customer institutional profiles' },
                                { label: 'Asset Provisioning', status: 'ACTIVE', desc: 'Authorized to create and manage investment products' },
                                { label: 'KYC Verification', status: 'ACTIVE', desc: 'Primary authority for identity protocol validation' },
                                { label: 'Liquidity Control', status: 'RESTRICTED', desc: 'Approval authority with secondary audit layer' },
                                { label: 'Platform Configuration', status: 'LOCKED', desc: 'Superadmin clearance required for core system changes' }
                             ].map((perm, i) => (
                               <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/10 transition-all group/perm">
                                  <div className="flex justify-between items-center mb-4">
                                     <p className="text-sm font-black italic uppercase tracking-tighter">{perm.label}</p>
                                     <span className={`text-[8px] font-black px-3 py-1 rounded-full ${perm.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>{perm.status}</span>
                                  </div>
                                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic">{perm.desc}</p>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>
               )}

               {settingsTab === 'activity' && (
                 <div className="space-y-12">
                    <div className="bg-white border border-slate-200 p-16 rounded-[4rem] shadow-sm">
                       <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-12 flex items-center gap-4">
                          <Activity size={24} className="text-amber-600" /> Operational Footprint
                       </h3>
                       <div className="space-y-4">
                          {(stats.logs || []).map((log) => (
                             <div key={log.id} className="flex items-center justify-between p-8 bg-slate-50 rounded-3xl border border-transparent hover:border-slate-100 hover:bg-white transition-all group">
                                <div className="flex items-center gap-6">
                                   <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black italic">#</div>
                                   <div>
                                      <p className="text-sm font-black uppercase italic">{log.action.replace('_', ' ')}</p>
                                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{log.details}</p>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <p className="text-[10px] font-black text-slate-900 italic">{new Date(log.created_at).toLocaleString()}</p>
                                   <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">IP: {log.ip_address}</p>
                                </div>
                             </div>
                          ))}
                          {(!stats.logs || stats.logs.length === 0) && (
                            <p className="text-center py-20 text-[10px] font-black text-slate-300 uppercase italic tracking-[0.3em]">No operational records found</p>
                          )}
                       </div>
                    </div>
                 </div>
               )}

               {settingsTab === 'notifications' && (
                 <div className="space-y-12">
                    <div className="bg-white border border-slate-200 p-16 rounded-[4rem] shadow-sm">
                       <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-12 flex items-center gap-4">
                          <Megaphone size={24} className="text-amber-600" /> Alert Protocols
                       </h3>
                       <div className="space-y-10">
                          {[
                            { id: 'notify_email', label: 'Institutional Email Alerts', desc: 'Receive critical updates via authenticated email', icon: Mail },
                            { id: 'notify_system', label: 'System Terminal Notifications', desc: 'Real-time alerts within the operations terminal', icon: Zap }
                          ].map(notif => (
                            <div key={notif.id} className="flex items-center justify-between p-10 bg-slate-50 rounded-[3rem] border border-slate-100">
                               <div className="flex items-center gap-8">
                                  <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-900"><notif.icon size={24} /></div>
                                  <div>
                                     <p className="text-lg font-black uppercase italic tracking-tighter leading-none mb-2">{notif.label}</p>
                                     <p className="text-[10px] text-slate-400 font-black uppercase italic">{notif.desc}</p>
                                  </div>
                               </div>
                               <button 
                                 onClick={() => setProfileForm({...profileForm, [notif.id]: !profileForm[notif.id]})}
                                 className={`w-20 h-10 rounded-full relative transition-all duration-500 ${profileForm[notif.id] ? 'bg-slate-900' : 'bg-slate-200'}`}
                               >
                                  <div className={`absolute top-1 w-8 h-8 rounded-full bg-white shadow-lg transition-all duration-500 ${profileForm[notif.id] ? 'left-11' : 'left-1'}`}></div>
                               </button>
                            </div>
                          ))}
                       </div>
                       <div className="mt-16 flex justify-end">
                          <button 
                            onClick={handleUpdateProfile}
                            className="px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] italic shadow-2xl hover:bg-amber-600 transition-all"
                          >
                             Apply Protocol Updates
                          </button>
                       </div>
                    </div>
                 </div>
               )}
            </motion.div>
          )}

          {activeTab === 'investment_history' && (
            <div className="space-y-12">
               <div className="bg-white border border-slate-200 p-12 rounded-[4rem] shadow-sm">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-12 flex items-center gap-4">
                     <History size={24} className="text-amber-600" /> Fiscal Audit: Investment History
                  </h3>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-separate border-spacing-y-4">
                        <thead>
                           <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                              <th className="px-8 pb-4">Investor</th>
                              <th className="px-8 pb-4">Asset</th>
                              <th className="px-8 pb-4">Weight</th>
                              <th className="px-8 pb-4">Value</th>
                              <th className="px-8 pb-4">Status</th>
                              <th className="px-8 pb-4">Date</th>
                           </tr>
                        </thead>
                        <tbody>
                           {investmentHistory.map(inv => (
                              <tr key={inv.id} className="bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 transition-all group">
                                 <td className="px-8 py-6 rounded-l-[2rem]">
                                    <p className="text-sm font-black uppercase italic">{inv.user_name}</p>
                                    <p className="text-[9px] text-slate-400 font-bold">{inv.user_email}</p>
                                 </td>
                                 <td className="px-8 py-6">
                                    <span className="text-[10px] font-black uppercase bg-slate-900 text-amber-500 px-3 py-1 rounded-lg italic">{inv.asset_type}</span>
                                 </td>
                                 <td className="px-8 py-6 text-sm font-black italic">{inv.weight}g</td>
                                 <td className="px-8 py-6 text-sm font-black italic">₹{parseFloat(inv.total_value).toLocaleString()}</td>
                                 <td className="px-8 py-6">
                                    <span className={`text-[9px] font-black uppercase italic px-3 py-1 rounded-full ${inv.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                       {inv.status}
                                    </span>
                                 </td>
                                 <td className="px-8 py-6 rounded-r-[2rem] text-[10px] font-black text-slate-400 italic">
                                    {new Date(inv.created_at).toLocaleDateString()}
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                     {investmentHistory.length === 0 && (
                        <div className="py-20 text-center text-[10px] font-black text-slate-300 uppercase italic tracking-widest">No historical data available</div>
                     )}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-12">
               <div className="bg-white border border-slate-200 p-12 rounded-[4rem] shadow-sm">
                  <div className="flex justify-between items-center mb-12">
                     <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                        <ShoppingBag size={24} className="text-amber-600" /> Institutional Asset Inventory
                     </h3>
                     <button 
                       onClick={() => { setIsEditing(false); setAssetForm({ name: '', category: 'Gold Asset', price: '', weight: '', purity: '22K', description: '', is_active: 1 }); setShowAssetModal(true); }}
                       className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest italic flex items-center gap-3 hover:bg-amber-600 transition-all shadow-xl"
                     >
                        <Plus size={18} /> Provision New Asset
                     </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                     {products.map(product => (
                        <div key={product.id} className="bg-slate-50 border border-slate-100 p-8 rounded-[3rem] hover:bg-white hover:border-amber-500/30 transition-all group relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-6">
                              <span className={`text-[8px] font-black px-3 py-1 rounded-full ${product.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                 {product.is_active ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                           </div>
                           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-900 mb-6 shadow-sm border border-slate-50 group-hover:scale-110 transition-transform"><Package size={28}/></div>
                           <h4 className="text-lg font-black uppercase italic tracking-tighter mb-2">{product.name}</h4>
                           <p className="text-[10px] text-slate-400 font-black uppercase italic tracking-widest mb-6">{product.category}</p>
                           <div className="grid grid-cols-2 gap-4 mb-8">
                              <div className="bg-white p-4 rounded-2xl border border-slate-100">
                                 <p className="text-[8px] font-black text-slate-400 uppercase italic mb-1">Weight</p>
                                 <p className="text-sm font-black italic">{product.weight}g</p>
                              </div>
                              <div className="bg-white p-4 rounded-2xl border border-slate-100">
                                 <p className="text-[8px] font-black text-slate-400 uppercase italic mb-1">Purity</p>
                                 <p className="text-sm font-black italic">{product.purity}</p>
                              </div>
                           </div>
                           <div className="flex justify-between items-center">
                              <p className="text-2xl font-black italic tracking-tighter text-amber-600">₹{parseFloat(product.price).toLocaleString()}</p>
                              <div className="flex gap-2">
                                 <button 
                                   onClick={() => { setIsEditing(true); setAssetForm(product); setShowAssetModal(true); }}
                                   className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-slate-900 transition-all"
                                 >
                                   <Edit3 size={18}/>
                                 </button>
                                 <button 
                                   onClick={() => handleDeleteAsset(product.id)}
                                   className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-rose-500 transition-all"
                                 >
                                   <Trash2 size={18}/>
                                 </button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'wallets_view' && (
            <div className="space-y-12">
               <div className="bg-white border border-slate-200 p-12 rounded-[4rem] shadow-sm">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-12 flex items-center gap-4">
                     <Wallet size={24} className="text-amber-600" /> Operational Ledger: Cashback Monitoring
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                     <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-700"><Coins size={120} /></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Total Payout Volume</p>
                        <h4 className="text-3xl font-black italic tracking-tighter text-amber-500">₹{(stats.revenue?.cashback || 0).toLocaleString()}</h4>
                     </div>
                     <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 group-hover:scale-110 transition-transform duration-700"><Users size={120} /></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Active Recipients</p>
                        <h4 className="text-3xl font-black italic tracking-tighter text-slate-900">{walletsData.length} Accounts</h4>
                     </div>
                  </div>
                  <div className="space-y-4">
                     {walletsData.map(wallet => (
                        <div key={wallet.id} className="flex items-center justify-between p-8 bg-slate-50 rounded-3xl border border-transparent hover:border-slate-100 hover:bg-white transition-all group">
                           <div className="flex items-center gap-6">
                              <div className="w-14 h-14 bg-slate-900 text-amber-500 rounded-2xl flex items-center justify-center font-black italic shadow-xl">{wallet.user_name ? wallet.user_name[0] : 'U'}</div>
                              <div>
                                 <p className="text-sm font-black uppercase italic leading-none mb-2">{wallet.user_name}</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{wallet.wallet_address || 'Standard Wallet'}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-xl font-black italic tracking-tighter text-slate-900">₹{parseFloat(wallet.balance).toLocaleString()}</p>
                              <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mt-1 italic">Current Liquidity</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="space-y-12">
               <div className="bg-white border border-slate-200 p-12 rounded-[4rem] shadow-sm">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-12 flex items-center gap-4">
                     <MessageCircle size={24} className="text-amber-600" /> Resolution Center: Support Matrix
                  </h3>
                  <div className="space-y-6">
                     {(stats.tickets || []).map(ticket => (
                        <div key={ticket.id} className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] hover:bg-white hover:border-amber-500/30 transition-all group">
                           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                              <div className="flex items-center gap-6">
                                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black italic shadow-xl ${ticket.status === 'open' ? 'bg-amber-100 text-amber-600' : 'bg-slate-900 text-slate-400'}`}><MessageCircle size={24}/></div>
                                 <div>
                                    <p className="text-sm font-black uppercase italic tracking-tighter mb-2">{ticket.subject}</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase italic">ID: #{ticket.id} • User: {ticket.user_name}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-6 self-end md:self-auto">
                                 <span className={`text-[8px] font-black px-4 py-2 rounded-full italic tracking-widest ${ticket.status === 'open' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{ticket.status.toUpperCase()}</span>
                                 <button className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] italic hover:bg-amber-600 transition-all shadow-lg active:scale-95">Respond</button>
                              </div>
                           </div>
                        </div>
                     ))}
                     {(!stats.tickets || stats.tickets.length === 0) && (
                        <div className="py-32 text-center">
                           <ShieldCheck size={60} className="mx-auto text-slate-100 mb-8" />
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic">No active support requests</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'broadcast' && (
            <div className="space-y-12">
               <div className="bg-white border border-slate-200 p-12 rounded-[4rem] shadow-sm">
                  <div className="flex justify-between items-center mb-12">
                     <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                        <Megaphone size={24} className="text-amber-600" /> Communication Hub: Broadcast Matrix
                     </h3>
                     <button 
                       onClick={() => setShowBroadcastModal(true)}
                       className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest italic flex items-center gap-3 hover:bg-amber-600 transition-all shadow-xl"
                     >
                        <Plus size={18} /> New Institutional Alert
                     </button>
                  </div>
                  <div className="space-y-6">
                     {(notifications || []).map(notif => (
                        <div key={notif.id} className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] hover:bg-white hover:border-amber-500/30 transition-all group relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700"><Megaphone size={100} /></div>
                           <div className="flex justify-between items-start relative z-10">
                              <div className="flex items-center gap-6">
                                 <div className="w-12 h-12 bg-slate-900 text-amber-500 rounded-xl flex items-center justify-center font-black italic"><Megaphone size={20}/></div>
                                 <div>
                                    <p className="text-sm font-black uppercase italic tracking-tighter mb-1">{notif.title}</p>
                                    <p className="text-[10px] text-slate-500 font-black italic leading-relaxed max-w-2xl">{notif.message}</p>
                                 </div>
                              </div>
                              <p className="text-[9px] font-black text-slate-400 uppercase italic tracking-widest">{new Date(notif.created_at).toLocaleDateString()}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'payout_reports' && (
            <div className="space-y-12">
               <div className="bg-white border border-slate-200 p-12 rounded-[4rem] shadow-sm">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-12 flex items-center gap-4">
                     <FileText size={24} className="text-amber-600" /> Yield Analytics: Fiscal Reports
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                     <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">Aggregate Daily Payout</p>
                        <h4 className="text-4xl font-black italic tracking-tighter text-slate-900">₹{(stats.revenue?.total || 0).toLocaleString()}</h4>
                     </div>
                     <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">Next Disbursement Cycle</p>
                        <h4 className="text-4xl font-black italic tracking-tighter text-amber-600">IN 14H 22M</h4>
                     </div>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-separate border-spacing-y-4">
                        <thead>
                           <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                              <th className="px-8 pb-4">Protocol ID</th>
                              <th className="px-8 pb-4">Recipient</th>
                              <th className="px-8 pb-4">Daily Yield</th>
                              <th className="px-8 pb-4">Accumulated</th>
                              <th className="px-8 pb-4">Status</th>
                           </tr>
                        </thead>
                        <tbody>
                           {(reports || []).map((rep) => (
                              <tr key={rep.id} className="bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 transition-all group">
                                 <td className="px-8 py-6 rounded-l-[2rem] text-sm font-black italic text-slate-400">#PR-{rep.id}</td>
                                 <td className="px-8 py-6">
                                    <p className="text-sm font-black uppercase italic leading-none mb-1">{rep.user_name}</p>
                                    <p className="text-[9px] text-slate-400 font-bold">{rep.user_email}</p>
                                 </td>
                                 <td className="px-8 py-6 text-sm font-black italic text-emerald-600">₹{parseFloat(rep.daily_payout).toLocaleString()}</td>
                                 <td className="px-8 py-6 text-sm font-black italic">₹{parseFloat(rep.total_value).toLocaleString()}</td>
                                 <td className="px-8 py-6 rounded-r-[2rem]">
                                    <span className="text-[9px] font-black uppercase italic px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full tracking-widest">ACTIVE</span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'recruitment' && (
            <div className="space-y-12">
               <div className="bg-white border border-slate-200 p-12 rounded-[4rem] shadow-sm">
                  <div className="flex justify-between items-center mb-12">
                     <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                        <Users size={24} className="text-amber-600" /> Staff Infrastructure: Operations Team
                     </h3>
                     <button 
                       onClick={() => setShowStaffModal(true)}
                       className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest italic flex items-center gap-3 hover:bg-amber-600 transition-all shadow-xl"
                     >
                        <UserPlus size={18} /> Register Personnel
                     </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {users.filter(u => ['staff', 'advocate'].includes(u.role)).map(staff => (
                        <div key={staff.id} className="p-10 bg-slate-50 border border-slate-100 rounded-[3rem] hover:bg-white hover:border-amber-500/30 transition-all group">
                           <div className="w-16 h-16 bg-slate-900 text-amber-500 rounded-2xl flex items-center justify-center font-black italic shadow-xl mb-6">{staff.name[0]}</div>
                           <h4 className="text-lg font-black uppercase italic tracking-tighter leading-none mb-2">{staff.name}</h4>
                           <p className="text-[10px] text-slate-400 font-black uppercase italic tracking-widest mb-6">{staff.email}</p>
                           <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black px-4 py-2 bg-amber-50 text-amber-600 rounded-full italic uppercase tracking-widest">{staff.role}</span>
                              <div className="flex gap-2">
                                 <button className="p-3 bg-white border border-slate-200 text-slate-300 hover:text-slate-900 transition-all rounded-xl"><Edit3 size={18}/></button>
                                 <button className="p-3 bg-white border border-slate-200 text-slate-300 hover:text-rose-500 transition-all rounded-xl"><Trash2 size={18}/></button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {!['overview', 'users', 'investments', 'kyc', 'withdrawals', 'settings', 'investment_history', 'inventory', 'wallets_view', 'tickets', 'broadcast', 'payout_reports', 'recruitment'].includes(activeTab) && (
            <div className="py-40 text-center flex flex-col items-center gap-10">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-200 animate-pulse border border-slate-100"><Package size={48} /></div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase italic mb-3 tracking-tighter leading-none">Module Initialized</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Navigating to {activeTab.replace('_', ' ')} command layer...</p>
                <button onClick={() => fetchData()} className="mt-8 text-amber-600 underline text-[10px] font-black uppercase italic tracking-widest">Refresh Connectivity</button>
              </div>
            </div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {showAssetModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 overflow-y-auto">
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-12 md:p-20 rounded-[4rem] max-w-4xl w-full shadow-2xl relative border border-slate-100 my-auto">
                <button onClick={() => setShowAssetModal(false)} className="absolute top-10 right-10 p-3 bg-slate-50 text-slate-300 hover:text-slate-900 transition-all rounded-2xl"><X size={32} /></button>
                <div className="mb-16">
                   <h3 className="text-4xl font-black text-slate-900 mb-3 italic uppercase tracking-tighter">{isEditing ? 'Asset Calibration' : 'Asset Provisioning'}</h3>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">{isEditing ? 'Modify institutional protocol parameters' : 'Deploy new institutional gold/silver inventory'}</p>
                </div>
                
                <form onSubmit={handleCreateAsset} className="space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Product Name</label>
                         <input required value={assetForm.name} onChange={e => setAssetForm({...assetForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-5 px-8 text-sm font-black uppercase italic focus:bg-white outline-none transition-all shadow-inner" placeholder="E.G. 24K GOLD SOVEREIGN" />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Asset Category</label>
                         <select value={assetForm.category} onChange={e => setAssetForm({...assetForm, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-5 px-8 text-sm font-black uppercase italic focus:bg-white outline-none transition-all shadow-inner">
                            <option>Gold Asset</option>
                            <option>Silver Asset</option>
                            <option>Institutional Bullion</option>
                         </select>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Standard Weight (Grams)</label>
                         <input required type="number" step="0.001" value={assetForm.weight} onChange={e => setAssetForm({...assetForm, weight: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-5 px-8 text-sm font-black italic focus:bg-white outline-none transition-all shadow-inner" placeholder="8.000" />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Asset Purity (K/999)</label>
                         <input required value={assetForm.purity} onChange={e => setAssetForm({...assetForm, purity: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-5 px-8 text-sm font-black italic focus:bg-white outline-none transition-all shadow-inner" placeholder="E.G. 22K OR 999" />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Institutional Price (₹)</label>
                         <input required type="number" value={assetForm.price} onChange={e => setAssetForm({...assetForm, price: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-5 px-8 text-sm font-black italic focus:bg-white outline-none transition-all shadow-inner" placeholder="55000" />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Visual Asset Interface (Image)</label>
                         <input type="file" accept="image/*" onChange={e => setAssetForm({...assetForm, image: e.target.files[0]})} className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-4 px-8 text-[10px] font-black italic focus:bg-white outline-none transition-all shadow-inner" />
                      </div>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Protocol Description</label>
                      <textarea rows="3" value={assetForm.description} onChange={e => setAssetForm({...assetForm, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-5 px-8 text-sm font-black italic focus:bg-white outline-none transition-all shadow-inner resize-none" placeholder="Specifications and investment protocols..."></textarea>
                   </div>
                   <div className="pt-8 flex justify-end">
                      <button type="submit" disabled={processing} className="w-full md:w-80 bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 hover:bg-amber-600 transition shadow-2xl active:scale-95">
                         {processing ? <Loader2 className="animate-spin" /> : <>{isEditing ? <Save size={20}/> : <PlusCircle size={20}/>} {isEditing ? 'Synchronize Updates' : 'Deploy Asset'}</>}
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}

        {showBroadcastModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 overflow-y-auto">
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-12 md:p-20 rounded-[4rem] max-w-4xl w-full shadow-2xl relative border border-slate-100 my-auto">
                <button onClick={() => setShowBroadcastModal(false)} className="absolute top-10 right-10 p-3 bg-slate-50 text-slate-300 hover:text-slate-900 transition-all rounded-2xl"><X size={32} /></button>
                <div className="mb-16">
                   <h3 className="text-4xl font-black text-slate-900 mb-3 italic uppercase tracking-tighter">Broadcast Authorization</h3>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Deploy platform-wide institutional alerts</p>
                </div>
                <form onSubmit={handleCreateBroadcast} className="space-y-10">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Alert Headline</label>
                      <input required value={broadcastForm.title} onChange={e => setBroadcastForm({...broadcastForm, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-5 px-8 text-sm font-black uppercase italic focus:bg-white outline-none transition-all shadow-inner" placeholder="E.G. SYSTEM MAINTENANCE SCHEDULE" />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Institutional Message</label>
                      <textarea required rows="4" value={broadcastForm.message} onChange={e => setBroadcastForm({...broadcastForm, message: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-5 px-8 text-sm font-black italic focus:bg-white outline-none transition-all shadow-inner resize-none" placeholder="Detailed institutional communication..."></textarea>
                   </div>
                   <div className="pt-8 flex justify-end">
                      <button type="submit" disabled={processing} className="w-full md:w-80 bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 hover:bg-amber-600 transition shadow-2xl active:scale-95">
                         {processing ? <Loader2 className="animate-spin" /> : <><Megaphone size={20}/> Dispatch Broadcast</>}
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}

        {showStaffModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 overflow-y-auto">
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-12 md:p-20 rounded-[4rem] max-w-4xl w-full shadow-2xl relative border border-slate-100 my-auto">
                <button onClick={() => setShowStaffModal(false)} className="absolute top-10 right-10 p-3 bg-slate-50 text-slate-300 hover:text-slate-900 transition-all rounded-2xl"><X size={32} /></button>
                <div className="mb-16">
                   <h3 className="text-4xl font-black text-slate-900 mb-3 italic uppercase tracking-tighter">Personnel Registration</h3>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Onboard new institutional operations staff</p>
                </div>
                <form onSubmit={handleCreateStaff} className="space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Personnel Name</label>
                         <input required value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-5 px-8 text-sm font-black uppercase italic focus:bg-white outline-none transition-all shadow-inner" placeholder="E.G. OFFICER RAJESH" />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Institutional Email</label>
                         <input required type="email" value={staffForm.email} onChange={e => setStaffForm({...staffForm, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-5 px-8 text-sm font-black italic focus:bg-white outline-none transition-all shadow-inner" placeholder="staff@makkalgold.com" />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Operational Role</label>
                         <select disabled value="staff" className="w-full bg-slate-100 border border-slate-200 rounded-3xl py-5 px-8 text-sm font-black uppercase italic outline-none transition-all cursor-not-allowed">
                            <option value="staff">Operations Staff</option>
                         </select>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Access Key (Password)</label>
                         <div className="relative">
                            <input required type={showStaffPassword ? "text" : "password"} value={staffForm.password} onChange={e => setStaffForm({...staffForm, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-5 px-8 text-sm font-black italic focus:bg-white outline-none transition-all shadow-inner" placeholder="••••••••" />
                            <button type="button" onClick={() => setShowStaffPassword(!showStaffPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 p-2">{showStaffPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Permission-Based Access Control</label>
                         <button 
                           type="button" 
                           onClick={() => setStaffForm({ ...staffForm, permissions: staffForm.permissions.length === AVAILABLE_PERMISSIONS.length ? [] : AVAILABLE_PERMISSIONS.map(p => p.id) })}
                           className="text-[9px] font-black text-amber-600 uppercase tracking-widest hover:underline italic"
                         >
                            {staffForm.permissions.length === AVAILABLE_PERMISSIONS.length ? 'DESELECT ALL' : 'SELECT ALL ACCESS'}
                         </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         {AVAILABLE_PERMISSIONS.map((perm) => (
                            <button
                               key={perm.id}
                               type="button"
                               onClick={() => {
                                  const newPerms = staffForm.permissions.includes(perm.id)
                                     ? staffForm.permissions.filter(p => p !== perm.id)
                                     : [...staffForm.permissions, perm.id];
                                  setStaffForm({ ...staffForm, permissions: newPerms });
                               }}
                               className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 group ${
                                  staffForm.permissions.includes(perm.id)
                                  ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-amber-500/50 hover:bg-white'
                               }`}
                            >
                               <perm.icon size={20} className={staffForm.permissions.includes(perm.id) ? 'text-amber-500' : 'group-hover:text-amber-600'} />
                               <span className="text-[8px] font-black uppercase tracking-widest text-center italic">{perm.label}</span>
                            </button>
                         ))}
                      </div>
                   </div>

                   <div className="pt-8 flex justify-end">
                      <button type="submit" disabled={processing} className="w-full md:w-80 bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 hover:bg-amber-600 transition shadow-2xl active:scale-95">
                         {processing ? <Loader2 className="animate-spin" /> : <><UserPlus size={20}/> Complete Onboarding</>}
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}

        {selectedKYC && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-2xl z-[999] flex items-center justify-center p-4 md:p-8">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} 
               animate={{ scale: 1, opacity: 1 }} 
               className="bg-white rounded-[3rem] md:rounded-[4rem] max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-[0_0_100px_rgba(0,0,0,0.5)] relative border border-slate-100 flex flex-col"
             >
                {/* Header Section */}
                <div className="p-8 md:p-12 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/90 backdrop-blur-md z-20">
                   <div>
                      <div className="flex items-center gap-4 mb-2">
                         <div className="w-1.5 h-6 bg-amber-600 rounded-full"></div>
                         <h3 className="text-2xl md:text-3xl font-black text-slate-900 italic uppercase tracking-tighter">Identity Audit</h3>
                      </div>
                      <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic ml-6">Protocol for: <span className="text-amber-600 uppercase">{selectedKYC.name}</span></p>
                   </div>
                   <button 
                     onClick={() => setSelectedKYC(null)} 
                     className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all rounded-2xl active:scale-95 shadow-sm"
                   >
                     <X size={24} />
                   </button>
                </div>

                {/* Content Section */}
                <div className="p-8 md:p-12 space-y-12 flex-1">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
                       {/* Artifact Viewer */}
                       <div className="lg:col-span-2 bg-slate-950 border-4 border-slate-900 rounded-[2.5rem] md:rounded-[3rem] p-4 md:p-8 min-h-[300px] md:min-h-[600px] flex items-center justify-center shadow-inner relative group">
                          {selectedKYC.kyc_document ? (
                            <img 
                              src={`${API_BASE_URL.replace('/api', '')}/${selectedKYC.kyc_document}`} 
                              alt="KYC Artifact" 
                              className="max-w-full max-h-[70vh] object-contain rounded-xl md:rounded-2xl transition-transform duration-700 group-hover:scale-[1.02]" 
                            />
                          ) : (
                            <div className="text-center py-20">
                               <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                  <AlertTriangle size={32} className="text-rose-500 animate-pulse" />
                               </div>
                               <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">No digital artifact found</p>
                            </div>
                          )}
                       </div>

                       {/* Identity & Bank Dossier */}
                       <div className="space-y-8">
                          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-200 pb-3 italic">Identity Dossier</h4>
                             <div className="space-y-4">
                                <div>
                                   <p className="text-[8px] font-black text-slate-400 uppercase italic">Contact Line</p>
                                   <p className="text-xs font-bold text-slate-900">{selectedKYC.phone || 'N/A'}</p>
                                </div>
                                <div>
                                   <p className="text-[8px] font-black text-slate-400 uppercase italic">Aadhar Reference</p>
                                   <p className="text-xs font-bold text-slate-900">{selectedKYC.aadhar_no || 'N/A'}</p>
                                </div>
                                <div>
                                   <p className="text-[8px] font-black text-slate-400 uppercase italic">PAN Node</p>
                                   <p className="text-xs font-bold text-slate-900 uppercase">{selectedKYC.pan_no || 'N/A'}</p>
                                </div>
                             </div>
                          </div>

                          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-200 pb-3 italic">Bank Infrastructure</h4>
                             <div className="space-y-4">
                                <div>
                                   <p className="text-[8px] font-black text-slate-400 uppercase italic">Institution</p>
                                   <p className="text-xs font-bold text-slate-900 uppercase">{selectedKYC.bank_name || 'N/A'}</p>
                                </div>
                                <div>
                                   <p className="text-[8px] font-black text-slate-400 uppercase italic">Vault Number</p>
                                   <p className="text-xs font-bold text-slate-900">{selectedKYC.account_no || 'N/A'}</p>
                                </div>
                                <div>
                                   <p className="text-[8px] font-black text-slate-400 uppercase italic">IFSC Code</p>
                                   <p className="text-xs font-bold text-slate-900 uppercase">{selectedKYC.ifsc_code || 'N/A'}</p>
                                </div>
                                <div>
                                   <p className="text-[8px] font-black text-slate-400 uppercase italic">Branch Designation</p>
                                   <p className="text-xs font-bold text-slate-900 uppercase">{selectedKYC.branch_name || 'N/A'}</p>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                   {/* Actions Footer */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <button 
                        onClick={() => handleAction('approve_kyc', selectedKYC.id)} 
                        className="w-full bg-slate-900 text-amber-500 py-6 rounded-2xl md:rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:bg-emerald-600 hover:text-white transition-all shadow-xl italic active:scale-95 flex items-center justify-center gap-3"
                      >
                         <CheckCircle2 size={18} /> Approve Identity
                      </button>
                      <button 
                        onClick={() => handleAction('reject_kyc', selectedKYC.id)} 
                        className="w-full bg-white border-2 border-slate-100 text-slate-400 py-6 rounded-2xl md:rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:text-rose-500 hover:border-rose-200 transition-all italic active:scale-95 flex items-center justify-center gap-3 shadow-sm"
                      >
                         <XCircle size={18} /> Reject Request
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 100, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 100, x: '-50%' }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[300] bg-slate-900 text-amber-500 px-10 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] italic shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex items-center gap-4 border border-white/10"
          >
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            {successMessage}
            <button onClick={() => setSuccessMessage(null)} className="ml-4 text-slate-500 hover:text-white"><X size={14}/></button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManagerDashboard;
