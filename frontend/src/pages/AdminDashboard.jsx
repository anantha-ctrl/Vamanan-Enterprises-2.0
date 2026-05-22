import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, BarChart3, PauseCircle, Users, Wallet, ArrowLeft, ArrowRight, History, CheckCircle, CheckCircle2, XCircle, Loader2, Search, Settings, Settings2, Trash2, ShieldCheck, TrendingUp, TrendingDown, ShoppingBag, Plus, Activity, Zap, UserPlus, Megaphone, Globe, CreditCard, MessageCircle, AlertTriangle, LogOut, Eye, EyeOff, ExternalLink, Menu, Package, Award, ShoppingCart, Clock, Coins, Star, Save, Edit3, X, Percent, Phone, Mail, UserCircle, FileText, RefreshCw, Network, ChevronRight, ChevronDown, Trophy, Target, Landmark } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import GenealogyTree from '../components/GenealogyTree';
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

const AdminDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || 'customer';
  const permissions = user.permissions ? (typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions) : [];
  
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
  const [activityLogs, setActivityLogs] = useState([]);
  const [platformSettings, setPlatformSettings] = useState({
    referral_commission: '5',
    referral_commission_l1: '0.2',
    referral_commission_l2: '0.1',
    referral_commission_l3: '0.1',
    referral_commission_l4: '0.05',
    referral_commission_l5: '0.05',
    min_withdrawal: '500',
    gold_base_price: '7850',
    silver_base_price: '100',
    gst_percentage: '3',
    maintenance_mode: '0',
    payout_processing_fee: '10',
    daily_cashback_rate: '1',
    min_investment: '1000',
    support_phone: '+91 90000 00000',
    support_email: 'support@makkalgold.com',
    company_name: 'Vamanan Enterprises',
    company_address: '123, Gold Plaza, Main Road, City, State, 600001',
    upi_id: '',
    bank_name: '',
    bank_account_name: '',
    bank_account_no: '',
    bank_ifsc: '',
    bank_branch: ''
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [settingsSubTab, setSettingsSubTab] = useState('profile'); // profile, company, security, protocol
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };
  
  // Adjustment States
  const [adjForm, setAdjForm] = useState({ user_id: '', amount: '', type: 'credit', reason: '' });
  const [selectedUserPayout, setSelectedUserPayout] = useState(null);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', role: 'manager', password: '', permissions: AVAILABLE_PERMISSIONS.map(p => p.id) });
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [notifForm, setNotifForm] = useState({ user_id: '', title: '', message: '', type: 'info' });
  const [notifEditId, setNotifEditId] = useState(null);
  
  // Product CRUD States
  const [productForm, setProductForm] = useState({ id: null, name: '', category: 'Gold Asset', weight: '', purity: '24K', price: '', description: '', image: '', is_active: 1 });
  const [showProductModal, setShowProductModal] = useState(false);
  
  // User Management States
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editAdminMode, setEditAdminMode] = useState(false);
  const [adminData, setAdminData] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return { name: u.name || 'Super Admin', email: u.email || 'admin@makkalgold.com', role: u.role ? u.role.charAt(0).toUpperCase() + u.role.slice(1) : 'Super Administrator' };
    } catch { return { name: 'Super Admin', email: 'admin@makkalgold.com', role: 'Super Administrator' }; }
  });
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' });

  // Genealogy States
  const [genealogyData, setGenealogyData] = useState([]);
  const [genealogyLoading, setGenealogyLoading] = useState(false);
  const [genealogySearchTerm, setGenealogySearchTerm] = useState('');
  const [genealogySelectedUser, setGenealogySelectedUser] = useState(null);
  const [rootUsers, setRootUsers] = useState([]);

  // Fetch data on mount and tab change
  useEffect(() => {
    // Parse query params for deep linking (e.g., from Wallet List)
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    const userParam = params.get('user');
    const searchParam = params.get('search');

    if (tabParam) {
      setActiveTab(tabParam);
      if (tabParam === 'wallet_adj' && userParam) {
        setAdjForm(prev => ({ ...prev, user_id: userParam }));
        fetchUserPayout(userParam);
      }
    }
    
    if (searchParam) {
      setSearchTerm(searchParam);
    }

    fetchData();
  }, [activeTab, adjForm.user_id]);

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const results = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/admin/stats.php`),
        axios.get(`${API_BASE_URL}/admin/all_users.php`),
        axios.get(`${API_BASE_URL}/admin/products.php`),
        axios.get(`${API_BASE_URL}/admin/withdrawals.php`),
        axios.get(`${API_BASE_URL}/admin/investments.php`),
        axios.get(`${API_BASE_URL}/admin/activity_logs.php`),
        axios.get(`${API_BASE_URL}/admin/investment_history.php`),
        axios.get(`${API_BASE_URL}/admin/get_all_notifications.php`),
        axios.get(`${API_BASE_URL}/admin/settings.php`),
        axios.get(`${API_BASE_URL}/admin/wallets.php`)
      ]);

      const getData = (idx) => results[idx]?.status === 'fulfilled' && results[idx].value?.data?.status === 'success' ? results[idx].value.data.data : null;

      const statsData = getData(0); if (statsData) setStats(statsData);
      const usersData = getData(1); if (usersData) setUsers(usersData);
      const prodsData = getData(2); if (prodsData) setProducts(prodsData);
      const withData  = getData(3); if (withData) setWithdrawals(withData);
      const invData   = getData(4); if (invData) setInvestments(invData);
      const actLogs   = getData(5); if (actLogs) setActivityLogs(actLogs);
      const invHistData = getData(6); if (invHistData) setInvestmentHistory(invHistData);
      const notifData = getData(7); if (notifData) setNotifications(notifData);
      const setData   = getData(8); if (setData) setPlatformSettings(setData);
      const walData   = getData(9); if (walData) setWalletsData(walData);

      // Log any failed APIs for debugging
      results.forEach((r, i) => {
        if (r.status === 'rejected') console.warn(`Admin API #${i} failed:`, r.reason?.message);
      });
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
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

  const handleAdjustWallet = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/adjust_wallet.php`, adjForm);
      if(res.data.status === 'success') {
        showToast("Balance adjusted and logged on secure ledger!", "success");
        const lastUserId = adjForm.user_id;
        setAdjForm({ user_id: '', amount: '', type: 'credit', reason: '', category: 'purchase' });
        fetchData(true);
        // Re-fetch user specific payout info to update the yellow/white summary cards
        if (lastUserId) {
          fetchUserPayout(lastUserId);
        }
        setActiveTab('wallets_view'); // Redirect to ledger to see the update
      }
    } catch (err) {
      showToast("Adjustment failed: " + (err.response?.data?.message || "Internal server error"), "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleRegisterStaff = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/add_staff.php`, staffForm);
      if(res.data.status === 'success') {
        showToast("Staff credentials provisioned successfully!", "success");
        setStaffForm({ name: '', email: '', role: 'manager', password: '' });
        setActiveTab('users');
        fetchData(true);
      }
    } catch (err) {
      showToast("Registration failed: " + (err.response?.data?.message || "Invalid payload"), "error");
    } finally {
      setProcessing(false);
    }
  };

  const fetchUserPayout = async (userId) => {
    if (!userId) { setSelectedUserPayout(null); return; }
    setPayoutLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/get_user_daily_payout.php?user_id=${userId}`);
      if (res.data.status === 'success' && res.data.data) {
        setSelectedUserPayout(res.data.data);
        // Auto-fill amount with today's total daily payout
        if (res.data.data.total_daily_payout > 0) {
          setAdjForm(prev => ({ ...prev, amount: res.data.data.total_daily_payout.toFixed(2) }));
        }
      } else {
        console.warn('API returned error or empty data:', res.data.message);
        setSelectedUserPayout(null);
      }
    } catch (err) {
      console.error('Failed to fetch user payout info', err);
      setSelectedUserPayout(null);
    } finally {
      setPayoutLoading(false);
    }
  };

  // handleSendBroadcast was removed in favor of handleSendNotification in the Notification Hub tab


  const handleSendNotification = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    console.log("Attempting to dispatch notification...");
    
    if (!notifForm.title || !notifForm.message) {
      showToast("Please fill in both the Title and Message.", "error");
      return;
    }

    setProcessing(true);
    try {
      const endpoint = notifEditId ? 'edit_notification.php' : 'send_notification.php';
      const payload = notifEditId ? { ...notifForm, id: notifEditId } : notifForm;
      
      console.log(`Sending to: ${API_BASE_URL}/admin/${endpoint}`, payload);
      
      const res = await axios.post(`${API_BASE_URL}/admin/${endpoint}`, payload);
      
      if(res.data.status === 'success') {
        showToast(notifEditId ? "Notification dispatch node updated!" : "Notification broadcast dispatched successfully!", "success");
        setNotifForm({ user_id: '', title: '', message: '', type: 'info' });
        setNotifEditId(null);
        fetchData(true);
      } else {
        showToast("Dispatch failed: " + (res.data.message || "Endpoint error"), "error");
      }
    } catch (err) {
      console.error("Dispatch Error:", err);
      showToast("Dispatch connection error: " + (err.message || "Failed to reach node"), "error");
    } finally {
      setProcessing(false);
    }
  };

  const startEditingNotif = (n) => {
    setNotifForm({
      user_id: n.user_id || '',
      title: n.title,
      message: n.message,
      type: n.type
    });
    setNotifEditId(n.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteNotification = async (id) => {
    if (!window.confirm("Retract this notification? It will be removed from all customer interfaces.")) return;
    setProcessing(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/delete_notification.php`, { id });
      if(res.data.status === 'success') {
        showToast("Notification successfully retracted from dashboard feeds!", "success");
        fetchData(true);
      }
    } catch (err) {
      showToast("Retraction error: Secure connection interrupted", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessWithdrawal = async (id, status, transaction_id = 'N/A') => {
    if (!window.confirm(`Protocol: Confirm ${status.toUpperCase()} of this withdrawal request?`)) return;
    setProcessing(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/process_withdrawal.php`, { id, status, transaction_id });
      if(res.data.status === 'success') {
        showToast(`Withdrawal request successfully marked as ${status.toUpperCase()}!`, "success");
        fetchData(true);
      } else {
        showToast("Error processing request: " + res.data.message, "error");
      }
    } catch (err) {
      showToast("Connection fault: Failed to reach banking processing gateway", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const url = productForm.id 
        ? `${API_BASE_URL}/admin/update_product.php` 
        : `${API_BASE_URL}/admin/products.php`;
      
      const formData = new FormData();
      Object.keys(productForm).forEach(key => {
        if (productForm[key] !== null && productForm[key] !== undefined) {
          formData.append(key, productForm[key]);
        }
      });

      const res = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.status === 'success') {
        showToast(productForm.id ? "Asset node specs updated successfully!" : "New product asset successfully minted!", "success");
        setShowProductModal(false);
        setProductForm({ id: null, name: '', category: 'Gold Asset', weight: '', purity: '24K', price: '', description: '', image: '', is_active: 1 });
        fetchData(true);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Connection to database failed";
      showToast("Error: " + msg, "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateWithdrawal = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this payout?`)) return;
    setProcessing(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/update_withdrawal.php`, { id, status });
      if (res.data.status === 'success') {
        showToast(`Payout status marked as ${status.toUpperCase()}!`, "success");
        fetchData(true);
      }
    } catch (err) {
      showToast("Update failed: Secure communication channel fault", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleApproveInvestment = async (cycle_id, status) => {
    const action = status === 'active' ? 'APPROVE' : 'REJECT';
    if (!window.confirm(`Are you sure you want to ${action} this investment request?`)) return;
    setProcessing(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/approve_investment.php`, { cycle_id, status });
      if (res.data.status === 'success') {
        showToast(`Investment request successfully ${status === 'active' ? 'APPROVED' : 'REJECTED'}!`, "success");
        fetchData(true);
      }
    } catch (err) {
      showToast("Action failed: Connection to database node interrupted", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateAdminProfile = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/update_profile.php`, adminForm);
      if (res.data.status === 'success') {
        showToast("Institutional security profile synchronized successfully!", "success");
        setAdminData({ ...adminData, name: adminForm.name, email: adminForm.email });
        setEditAdminMode(false);
        fetchData(true);
      }
    } catch (err) {
      showToast("Identity calibration failed: Credential invalid", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateSettings = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setProcessing(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/settings.php`, platformSettings);
      if (res.data.status === 'success') {
        showToast("Platform settings successfully synchronized to blockchain ledger!", "success");
        fetchData(true);
      }
    } catch (err) {
      showToast("Settings update failed: Secure channel authentication fault", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateUser = async (updates) => {
    setProcessing(true);
    try {
      const targetId = updates.id || selectedUser?.id;
      const res = await axios.post(`${API_BASE_URL}/admin/update_user.php`, { id: targetId, ...updates });
      if (res.data.status === 'success') {
        showToast("User profile details successfully synchronized!", "success");
        setShowUserModal(false);
        fetchData(true);
      }
    } catch (err) {
      showToast("Investor calibration failed", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("CRITICAL WARNING: You are about to permanently purge this investor entity and all associated fiscal records. This action cannot be reversed. Proceed?")) return;
    setProcessing(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/delete_user.php`, { id });
      if (res.data.status === 'success') {
        showToast("Investor dossier permanently purged from ledger system", "success");
        setShowUserModal(false);
        fetchData(true);
      }
    } catch (err) {
      showToast("Purge failed: Access permissions mismatch", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    setProcessing(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/delete_product.php`, { id });
      if (res.data.status === 'success') {
        showToast("Product deleted from storefront database", "success");
        fetchData(true);
      }
    } catch (err) {
      showToast("Deletion failed: Resource locked", "error");
    } finally {
      setProcessing(false);
    }
  };

  const fetchGenealogy = async (userId = null) => {
    setGenealogyLoading(true);
    try {
      const url = userId 
        ? `${API_BASE_URL}/admin/get_genealogy.php?user_id=${userId}`
        : `${API_BASE_URL}/admin/get_genealogy.php`;
      
      const res = await axios.get(url);
      if (res.data.status === 'success') {
        if (userId) {
          setGenealogyData(res.data.data);
          const user = users.find(u => u.id.toString() === userId.toString());
          setGenealogySelectedUser(user);
        } else {
          setRootUsers(res.data.data);
          setGenealogyData([]);
          setGenealogySelectedUser(null);
        }
      }
    } catch (err) {
      console.error("Genealogy fetch failed", err);
    } finally {
      setGenealogyLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'genealogy') {
      fetchGenealogy();
    }
  }, [activeTab]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center text-amber-600">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin" size={48} />
        <p className="text-[10px] font-black animate-pulse uppercase tracking-[0.2em]">Accessing Dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-inter flex flex-col lg:flex-row overflow-x-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        showMobileMenu={showMobileMenu} 
        setShowMobileMenu={setShowMobileMenu} 
      />


      {/* Main Panel */}
      <main className="flex-1 p-4 md:p-6 lg:p-12 overflow-y-auto min-h-screen lg:ml-72 pb-24 lg:pb-12">
        <Header 
          setShowMobileMenu={setShowMobileMenu}
          activeTab={activeTab}
          adminData={adminData}
          setShowAdminModal={setShowAdminModal}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          platformSettings={platformSettings}
        />

        {/* Global Action Bar */}
        <div className="mb-8 flex justify-end">
           <button 
             onClick={async () => {
               if(!window.confirm("Initialize Daily Yield Protocol? This will process 1% cashback for all active cycles.")) return;
               setProcessing(true);
               try {
                 const res = await axios.get(`${API_BASE_URL}/cron/process_cashback.php?t=${Date.now()}`);
                 if (res.data.status === 'success') {
                   showToast("DAILY YIELD PROTOCOL FULLY DISPATCHED!", "success");
                   fetchData(true);
                 } else {
                   showToast("Protocol failed: " + (res.data.message || "Unknown error"), "error");
                 }
               } catch (err) {
                 showToast("Connection fault: Cron processing server offline", "error");
               } finally {
                 setProcessing(false);
               }
             }}
             disabled={processing}
             className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-amber-600 transition-all shadow-xl active:scale-95 italic flex items-center gap-3 disabled:opacity-50"
           >
             {processing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} className="text-amber-500" />}
             Process Daily Yield
           </button>
        </div>

        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white border border-slate-200 p-8 rounded-[3.5rem] relative overflow-hidden group hover:border-amber-600/50 transition-all duration-700 shadow-sm hover:shadow-2xl">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-all duration-1000"></div>
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-slate-900 transition-all duration-500">
                  <BarChart3 className="text-amber-600 group-hover:text-amber-500" size={24} />
                </div>
                <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase italic">Institutional Revenue</p>
                <div className="flex items-end gap-3 mt-2">
                  <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter">₹ {parseFloat(stats.revenue || 0).toLocaleString()}</h3>
                  <span className="text-emerald-600 text-[10px] font-black mb-1.5 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 shadow-sm"><TrendingUp size={10} className="mr-1"/> +12%</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-8 rounded-[3.5rem] relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-700 shadow-sm hover:shadow-2xl">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all duration-1000"></div>
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-slate-900 transition-all duration-500">
                  <Wallet className="text-emerald-600" size={24} />
                </div>
                <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase italic">Total Payouts</p>
                <div className="flex items-end gap-3 mt-2">
                  <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter">₹ {parseFloat(stats.payouts || 0).toLocaleString()}</h3>
                  <span className="text-slate-400 text-[10px] font-black mb-1.5 italic bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">MTD Yield</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-8 rounded-[3.5rem] relative overflow-hidden group hover:border-blue-500/50 transition-all duration-700 shadow-sm hover:shadow-2xl">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all duration-1000"></div>
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-slate-900 transition-all duration-500">
                  <Users className="text-blue-500" size={24} />
                </div>
                <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase italic">Active Investors</p>
                <div className="flex items-end gap-3 mt-2">
                  <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter">{stats.users}</h3>
                  <span className="text-blue-500 text-[10px] font-black mb-1.5 flex items-center bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 shadow-sm"><UserPlus size={10} className="mr-1"/> +5 New</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-8 rounded-[3.5rem] relative overflow-hidden group hover:border-amber-600/50 transition-all duration-700 shadow-sm hover:shadow-2xl">
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-all duration-1000"></div>
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-slate-900 transition-all duration-500">
                  <ShoppingBag className="text-amber-600" size={24} />
                </div>
                <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase italic">Asset Inventory</p>
                <div className="flex items-end gap-3 mt-2">
                  <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter">{parseFloat(stats.total_gold_weight || 0).toFixed(3)}g</h3>
                  <span className="text-amber-600 text-[10px] font-black mb-1.5 italic bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 shadow-sm">22K Gold</span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] italic">Silver Reserve:</span>
                  <span className="text-[10px] font-black text-slate-500 italic">{parseFloat(stats.total_silver_weight || 0).toFixed(2)}g</span>
                </div>
              </div>
            </div>

            {/* Growth Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
               {/* Revenue Growth Chart */}
               <div className="bg-white border border-slate-200 p-8 md:p-12 rounded-[3.5rem] shadow-sm relative overflow-hidden group min-h-[450px]">
                  <div className="flex justify-between items-center mb-10">
                     <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">Institutional Growth Analytics</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 italic">Rolling 7-Day Revenue Matrix</p>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="hidden sm:flex flex-col items-end">
                           <span className="text-[14px] font-black italic text-slate-900">₹ {parseFloat(stats.revenue || 0).toLocaleString()}</span>
                           <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest italic">Total Liquid Revenue</span>
                        </div>
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-amber-500 shadow-lg border border-white/10"><TrendingUp size={20} /></div>
                     </div>
                  </div>
                  
                  {/* High-End Analytics Engine */}
                  <div className="h-64 w-full relative mt-4">
                     {/* Y-Axis Grid Lines */}
                     <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none opacity-40">
                        {[1, 2, 3, 4, 5].map(i => (
                           <div key={i} className="w-full border-b border-slate-100 flex justify-between">
                              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest -mt-4">{(Math.max(...(stats.revenue_history || []).map(x => x.amount)) * (1 - (i-1)/4)).toFixed(0)}</span>
                           </div>
                        ))}
                     </div>

                     <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
                        <defs>
                           <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
                              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                           </linearGradient>
                        </defs>
                        
                        {stats.revenue_history && stats.revenue_history.length > 1 && (() => {
                          const max = Math.max(...stats.revenue_history.map(x => x.amount)) || 1;
                          const step = 600 / (stats.revenue_history.length - 1);
                          const points = stats.revenue_history.map((h, i) => ({
                             x: i * step,
                             y: 180 - (h.amount / max) * 160
                          }));

                          // Generate Smooth Bezier Path
                          let d = `M ${points[0].x},${points[0].y}`;
                          for (let i = 0; i < points.length - 1; i++) {
                             const cp1x = points[i].x + (points[i+1].x - points[i].x) / 2;
                             const cp1y = points[i].y;
                             const cp2x = points[i].x + (points[i+1].x - points[i].x) / 2;
                             const cp2y = points[i+1].y;
                             d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${points[i+1].x},${points[i+1].y}`;
                          }

                          return (
                            <>
                               {/* Area Fill */}
                               <motion.path 
                                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
                                 d={`${d} L 600,200 L 0,200 Z`}
                                 fill="url(#revenueGradient)"
                               />
                               {/* Main Line */}
                               <motion.path 
                                 initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, ease: "easeInOut" }}
                                 d={d}
                                 fill="none"
                                 stroke="#f59e0b"
                                 strokeWidth="4"
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 className="drop-shadow-xl"
                               />
                               {/* Data Nodes */}
                               {points.map((p, i) => (
                                 <motion.g key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 + 1 }}>
                                    <circle cx={p.x} cy={p.y} r="6" fill="#fff" stroke="#f59e0b" strokeWidth="3" className="shadow-lg" />
                                    <circle cx={p.x} cy={p.y} r="2" fill="#f59e0b" />
                                 </motion.g>
                               ))}
                            </>
                          );
                        })()}
                     </svg>
                  </div>
                  <div className="flex justify-between mt-8 border-t border-slate-100 pt-6">
                     {(stats.revenue_history || []).map((h, i) => (
                        <span key={i} className="text-[8px] font-black text-slate-400 uppercase italic tracking-[0.2em]">{h.date}</span>
                     ))}
                  </div>
               </div>

               {/* User Growth Chart */}
               <div className="bg-white border border-slate-200 p-8 md:p-12 rounded-[3.5rem] shadow-sm relative overflow-hidden group min-h-[450px]">
                  <div className="flex justify-between items-center mb-10">
                     <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">Investor Network Pulse</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Rolling 7-Day Enrollment Matrix</p>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="hidden sm:flex flex-col items-end">
                           <span className="text-[14px] font-black italic text-slate-900">{stats.users} Entities</span>
                           <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest italic animate-pulse">Live Synchronization</span>
                        </div>
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-blue-500 shadow-lg border border-white/10"><Activity size={20} /></div>
                     </div>
                  </div>

                  {/* Blue Pulse Analytics Engine */}
                  <div className="h-64 w-full relative mt-4">
                     {/* Y-Axis Grid Lines */}
                     <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none opacity-40">
                        {[1, 2, 3, 4, 5].map(i => (
                           <div key={i} className="w-full border-b border-slate-100 flex justify-between">
                              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest -mt-4">{(Math.max(...(stats.user_history || []).map(x => x.count)) * (1 - (i-1)/4)).toFixed(0)}</span>
                           </div>
                        ))}
                     </div>

                     <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
                        <defs>
                           <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                           </linearGradient>
                        </defs>
                        
                        {stats.user_history && stats.user_history.length > 1 && (() => {
                          const max = Math.max(...stats.user_history.map(x => x.count)) || 1;
                          const step = 600 / (stats.user_history.length - 1);
                          const points = stats.user_history.map((h, i) => ({
                             x: i * step,
                             y: 180 - (h.count / max) * 160
                          }));

                          let d = `M ${points[0].x},${points[0].y}`;
                          for (let i = 0; i < points.length - 1; i++) {
                             const cp1x = points[i].x + (points[i+1].x - points[i].x) / 2;
                             const cp1y = points[i].y;
                             const cp2x = points[i].x + (points[i+1].x - points[i].x) / 2;
                             const cp2y = points[i+1].y;
                             d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${points[i+1].x},${points[i+1].y}`;
                          }

                          return (
                            <>
                               <motion.path 
                                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
                                 d={`${d} L 600,200 L 0,200 Z`}
                                 fill="url(#userGradient)"
                               />
                               <motion.path 
                                 initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, ease: "easeInOut" }}
                                 d={d}
                                 fill="none"
                                 stroke="#3b82f6"
                                 strokeWidth="4"
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                                 className="drop-shadow-xl"
                               />
                               {points.map((p, i) => (
                                 <motion.g key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 + 1 }}>
                                    <circle cx={p.x} cy={p.y} r="6" fill="#fff" stroke="#3b82f6" strokeWidth="3" className="shadow-lg" />
                                    <circle cx={p.x} cy={p.y} r="2" fill="#3b82f6" />
                                 </motion.g>
                               ))}
                            </>
                          );
                        })()}
                     </svg>
                  </div>
                  <div className="flex justify-between mt-8 border-t border-slate-100 pt-6">
                     {(stats.user_history || []).map((h, i) => (
                        <span key={i} className="text-[8px] font-black text-slate-400 uppercase italic tracking-[0.2em]">{h.date}</span>
                     ))}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Level-wise Distribution Intelligence */}
              <div className="lg:col-span-2 bg-white border border-slate-200 p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] shadow-sm relative overflow-hidden">
                 <div className="flex justify-between items-center mb-10 md:mb-14">
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-slate-900 italic uppercase tracking-tight">Network Yield Matrix</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">Institutional commission distribution by tier</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                       <span className="text-[10px] font-black text-slate-900 uppercase italic tracking-widest">Live Flow</span>
                    </div>
                 </div>

                 <div className="space-y-8 md:space-y-10">
                    {['L1', 'L2', 'L3', 'L4', 'L5'].map((lvl) => {
                       const amount = stats.level_distribution?.[lvl] || 0;
                       const max = Math.max(...Object.values(stats.level_distribution || { L1: 1 })) || 1;
                       const percentage = (amount / max) * 100;
                       const colors = { L1: 'bg-amber-500', L2: 'bg-emerald-500', L3: 'bg-blue-500', L4: 'bg-indigo-500', L5: 'bg-rose-500' };
                       const labels = { L1: 'Primary Nodes', L2: 'Secondary Vectors', L3: 'Tertiary Links', L4: 'Quaternary Nodes', L5: 'Terminal Nodes' };
                       
                       return (
                          <div key={lvl} className="group">
                             <div className="flex justify-between items-end mb-3 md:mb-4 px-2">
                                <div>
                                   <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${colors[lvl]} text-white italic mr-4 shadow-sm`}>{lvl} Matrix</span>
                                   <span className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest group-hover:text-slate-900 transition-colors">{labels[lvl]}</span>
                                </div>
                                <span className="text-sm md:text-base font-black text-slate-900 italic tracking-tighter">₹ {amount.toLocaleString()}</span>
                             </div>
                             <div className="w-full bg-slate-50 h-3 md:h-4 rounded-full overflow-hidden border border-slate-100 shadow-inner p-0.5">
                                <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${percentage}%` }}
                                   transition={{ duration: 1.5, ease: "easeOut" }}
                                   className={`${colors[lvl]} h-full rounded-full shadow-lg relative group-hover:brightness-110 transition-all`}
                                >
                                   <div className="absolute top-0 right-0 h-full w-20 bg-gradient-to-l from-white/20 to-transparent"></div>
                                </motion.div>
                             </div>
                          </div>
                       );
                    })}
                 </div>

                 <div className="mt-12 md:mt-16 pt-8 md:pt-10 border-t border-slate-100 flex flex-wrap gap-6 md:gap-10">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-inner"><TrendingUp size={18} /></div>
                       <div><p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">Avg Growth</p><p className="text-sm font-black text-slate-900 italic">+18.4%</p></div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100 shadow-inner"><Users size={18} /></div>
                       <div><p className="text-[10px] font-black text-slate-400 uppercase italic tracking-widest">Active Links</p><p className="text-sm font-black text-slate-900 italic">2,481 Units</p></div>
                    </div>
                 </div>
              </div>

              {/* Top Performer Leaderboard */}
              <div className="bg-slate-900 text-white p-8 md:p-10 rounded-[3rem] md:rounded-[4.5rem] shadow-2xl relative overflow-hidden group border border-white/5">
                 <div className="absolute -right-20 -bottom-20 opacity-5 group-hover:scale-125 transition-transform duration-1000 rotate-12"><Trophy size={400} className="text-amber-500" /></div>
                 
                 <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-10 md:mb-14">
                       <div className="w-2 h-8 bg-amber-500 rounded-full shadow-[0_0_15px_#d97706]"></div>
                       <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter">Alpha Network</h3>
                    </div>

                    <div className="space-y-6 md:space-y-8">
                       {(stats.top_referrers || []).length > 0 ? stats.top_referrers.map((ref, i) => (
                          <div key={i} className="flex items-center justify-between p-4 md:p-5 bg-white/5 border border-white/5 rounded-[2rem] hover:bg-white/10 transition-all group/node relative">
                             {i === 0 && <div className="absolute -top-3 -right-3 bg-amber-500 text-slate-900 text-[8px] font-black px-2 py-1 rounded-lg uppercase italic shadow-lg z-20">Network Alpha</div>}
                             <div className="flex items-center gap-4 md:gap-5">
                                <div className="relative">
                                   <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-lg md:text-xl font-black italic border ${i === 0 ? 'bg-amber-500 text-slate-900 border-amber-400' : 'bg-white/5 text-white border-white/10'}`}>
                                      {i + 1}
                                   </div>
                                   {i < 3 && <Trophy size={14} className={`absolute -bottom-1 -right-1 ${i === 0 ? 'text-white' : i === 1 ? 'text-slate-300' : 'text-amber-700'}`} />}
                                </div>
                                <div>
                                   <p className="text-sm md:text-base font-black italic uppercase tracking-tight truncate max-w-[120px]">{ref.name}</p>
                                   <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest mt-0.5">{ref.referral_code}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-sm md:text-base font-black italic text-emerald-500">₹ {parseFloat(ref.earnings || 0).toLocaleString()}</p>
                                <p className="text-[9px] text-white/40 font-black uppercase tracking-widest mt-0.5">{ref.referrals} Directs</p>
                             </div>
                          </div>
                       )) : (
                          <div className="py-20 text-center opacity-30 text-[10px] font-black uppercase tracking-widest italic">Scanning Network for Leaders...</div>
                       )}
                    </div>

                    <div className="mt-12 md:mt-16 p-6 md:p-8 bg-amber-500/10 border border-amber-500/20 rounded-[2.5rem] relative overflow-hidden group/card hover:bg-amber-500/15 transition-all">
                       <div className="relative z-10 flex items-center justify-between">
                          <div>
                             <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] italic mb-1">Neural Goal</p>
                             <p className="text-lg font-black italic uppercase tracking-tighter text-white">Scale Matrix 2.0</p>
                          </div>
                          <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-slate-900 shadow-[0_0_15px_#d97706] group-hover/card:scale-110 transition-transform"><Target size={20} /></div>
                       </div>
                       <div className="mt-6 w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                          <motion.div initial={{ width: 0 }} animate={{ width: '74%' }} className="h-full bg-amber-500 shadow-[0_0_10px_#d97706]"></motion.div>
                       </div>
                       <p className="text-[9px] text-white/40 mt-3 font-black uppercase tracking-widest italic">Institutional Target Completion: 74%</p>
                    </div>
                 </div>
              </div>
            </div>

            {/* Recent Investment History */}
            <div className="bg-white border border-slate-200 p-8 md:p-12 rounded-[3.5rem] shadow-sm relative overflow-hidden">
               <div className="absolute -right-20 -top-20 opacity-5 pointer-events-none rotate-12"><History size={400} /></div>
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
                  <div>
                     <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Recent Investment Protocol</h3>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">Last 5 processed institutional acquisitions</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('investment_history')}
                    className="group bg-slate-50 hover:bg-slate-900 text-slate-400 hover:text-white px-8 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border border-slate-200 shadow-sm flex items-center gap-3 italic"
                  >
                    View Full Audit Log <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
               </div>

               <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white relative z-10">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-slate-50">
                              <th className="py-6 px-10 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 italic">Processing Node</th>
                              <th className="py-6 px-10 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 italic">Investor Entity</th>
                              <th className="py-6 px-10 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 italic">Capital Matrix</th>
                              <th className="py-6 px-10 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 text-right italic">Status Code</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {investmentHistory.slice(0, 5).map(inv => (
                              <tr key={inv.cycle_id} className="hover:bg-slate-50/70 transition group">
                                 <td className="py-7 px-10">
                                    <div className="text-xs font-black text-slate-900 italic">{new Date(inv.processed_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1.5 italic">{new Date(inv.processed_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                                 </td>
                                 <td className="py-7 px-10">
                                    <div className="text-sm font-black text-slate-900 italic uppercase tracking-tight group-hover:text-amber-600 transition-colors">{inv.user_name}</div>
                                    <div className="text-[10px] text-slate-500 font-bold mt-1.5 truncate max-w-[200px]">{inv.user_email}</div>
                                 </td>
                                 <td className="py-7 px-10">
                                    <div className="text-xl font-black text-slate-900 italic tracking-tighter">₹{parseFloat(inv.total_value).toLocaleString()}</div>
                                    <div className="text-[9px] text-emerald-600 font-black uppercase tracking-widest mt-1.5 italic">Yield: ₹{inv.daily_payout}/Day</div>
                                 </td>
                                 <td className="py-7 px-10 text-right">
                                    <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm italic ${
                                       inv.cycle_status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                       inv.cycle_status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                       'bg-amber-50 text-amber-600 border-amber-100'
                                    }`}>
                                       <div className={`w-1.5 h-1.5 rounded-full ${inv.cycle_status === 'active' ? 'bg-emerald-500' : inv.cycle_status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'} animate-pulse`}></div>
                                       {inv.cycle_status}
                                    </span>
                                 </td>
                              </tr>
                           ))}
                           {investmentHistory.length === 0 && (
                              <tr>
                                 <td colSpan="4" className="py-32 text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 italic">
                                    Waiting for institutional activations...
                                 </td>
                              </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'investments' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-100 p-8 md:p-12 rounded-[3rem] shadow-sm">
            <div className="flex justify-between items-center mb-12">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Pending Gold Requests</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Review and approve customer investment submissions</p>
               </div>
               <div className="bg-amber-50 text-amber-600 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 shadow-sm">
                  {investments.length} Pending
               </div>
            </div>

            <div className="space-y-6">
               {investments.length === 0 ? (
                 <div className="text-center py-32 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                    <Package size={60} className="mx-auto text-slate-200 mb-8" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">All gold requests have been processed</p>
                 </div>
               ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {investments.map((inv) => (
                      <div key={inv.cycle_id} className="bg-white border border-slate-100 p-8 md:p-10 rounded-[3rem] shadow-sm hover:border-amber-400/50 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform"><Award size={150} className="text-amber-500" /></div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-center relative z-10">
                           <div className="lg:col-span-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Investor Identity</p>
                              <div className="flex items-center gap-5">
                                 <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-amber-500 font-black italic text-xl border border-white/10 shadow-lg">{inv.user_name[0]}</div>
                                 <div className="min-w-0">
                                    <h4 className="text-sm font-black text-slate-900 uppercase italic leading-none truncate">{inv.user_name}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1.5 truncate max-w-[140px]">{inv.user_email}</p>
                                 </div>
                              </div>
                           </div>

                           <div className="lg:col-span-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Digital Asset</p>
                              <h4 className="text-sm font-black text-slate-900 uppercase italic leading-none">
                                {inv.asset_type === 'silver' ? 'Pure Silver Asset' : '22K Gold Asset'}
                              </h4>
                              <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                <Package size={10}/> {parseFloat(inv.weight || 0).toFixed(3)} Grams
                              </p>
                           </div>

                           <div className="lg:col-span-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Financial Matrix</p>
                              <div className="flex flex-col">
                                 <span className="text-2xl font-black text-slate-900 leading-none italic tracking-tighter">₹{parseFloat(inv.total_value).toLocaleString()}</span>
                                 <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mt-2 flex items-center gap-2"><TrendingUp size={10}/> Yield: ₹{inv.daily_payout}/Day</span>
                              </div>
                           </div>

                           <div className="lg:col-span-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Payment Node</p>
                              <div className="flex flex-col gap-2">
                                 <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest italic">{inv.payment_method || 'Bank Transfer'}</span>
                                 <span className="text-[10px] font-black text-slate-900 uppercase italic truncate">ID: {inv.transaction_id || 'N/A'}</span>
                                 {inv.payment_screenshot ? (
                                    <a 
                                      href={`${API_BASE_URL.replace('/api', '')}/${inv.payment_screenshot}`} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 transition-colors"
                                    >
                                       <ExternalLink size={14} /> <span className="text-[9px] font-black uppercase tracking-widest underline italic">Verify Receipt</span>
                                    </a>
                                 ) : (
                                    <span className="text-[9px] text-rose-500 font-black uppercase tracking-widest italic">No Screenshot Found</span>
                                 )}
                              </div>
                           </div>

                           <div className="lg:col-span-1 flex flex-col sm:flex-row lg:flex-col lg:items-end gap-3">
                              <button 
                                onClick={() => handleApproveInvestment(inv.cycle_id, 'active')}
                                disabled={processing}
                                className="flex-1 lg:w-full bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition shadow-xl shadow-slate-200 active:scale-95"
                              >
                                 Authorize Activation
                              </button>
                              <button 
                                onClick={() => handleApproveInvestment(inv.cycle_id, 'rejected')}
                                disabled={processing}
                                className="flex-1 lg:w-full bg-white border border-slate-200 text-slate-400 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 transition active:scale-95"
                              >
                                 Reject Asset Request
                              </button>
                           </div>
                        </div>
                        
                        <div className="mt-8 pt-8 border-t border-slate-50 flex flex-wrap items-center justify-between gap-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                           <div className="flex items-center gap-2 italic">
                              <Clock size={12} className="text-amber-600" /> Submitted: {new Date(inv.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 italic text-amber-500">
                                 <Zap size={12} /> Awaiting Verification
                              </div>
                              <span className="text-slate-200">|</span>
                              <div className="flex items-center gap-2 italic text-blue-500">
                                 <ShieldCheck size={12} /> ID Verified
                              </div>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
               )}
            </div>
          </motion.div>
        )}

        {activeTab === 'investment_history' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-100 p-8 md:p-12 rounded-[3rem] shadow-sm">
            <div className="flex justify-between items-center mb-12">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Investment Audit History</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Institutional log of all processed gold asset acquisitions</p>
               </div>
               <div className="bg-slate-50 text-slate-600 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 shadow-sm">
                  {investmentHistory.length} Records Detected
               </div>
            </div>

            <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="py-5 px-8 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 italic">Processing Node</th>
                        <th className="py-5 px-8 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 italic">Investor Entity</th>
                        <th className="py-5 px-8 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 italic">Portfolio Insight</th>
                        <th className="py-5 px-8 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 italic">Capital Matrix</th>
                        <th className="py-5 px-8 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 italic">UTR / Reference</th>
                        <th className="py-5 px-8 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 text-right italic">Status Code</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {investmentHistory.map(inv => (
                        <tr key={inv.cycle_id} className="hover:bg-slate-50/70 transition group">
                          <td className="py-6 px-8">
                            <div className="text-xs font-black text-slate-900 italic">{new Date(inv.processed_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">{new Date(inv.processed_date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                          </td>
                          <td className="py-6 px-8">
                            <div className="text-sm font-black text-slate-900 italic uppercase tracking-tight group-hover:text-amber-600 transition-colors">{inv.user_name}</div>
                            <div className="text-[10px] text-slate-500 font-bold mt-1.5 truncate max-w-[150px]">{inv.user_email}</div>
                          </td>
                          <td className="py-6 px-8">
                            <div className="text-xs font-black text-slate-900 uppercase italic">
                              {inv.asset_type === 'silver' ? 'Pure Silver Asset' : '22K Gold Asset'}
                            </div>
                            <div className={`text-[9px] font-black uppercase tracking-widest mt-1 flex items-center gap-1 ${inv.asset_type === 'silver' ? 'text-slate-400' : 'text-amber-600'}`}>
                              <Package size={10}/> {parseFloat(inv.weight || 0).toFixed(3)} Grams
                            </div>
                          </td>
                          <td className="py-6 px-8">
                            <div className="text-base font-black text-slate-900 italic tracking-tighter">₹{parseFloat(inv.total_value).toLocaleString()}</div>
                            <div className="text-[9px] text-emerald-600 font-black uppercase tracking-widest mt-1 italic">Daily: ₹{inv.daily_payout}</div>
                          </td>
                            <td className="py-6 px-8">
                              <div className="text-[9px] text-amber-600 font-black uppercase tracking-widest mb-1 italic">{inv.payment_method || 'Bank Transfer'}</div>
                              <div className="text-xs font-black text-slate-900 uppercase italic truncate max-w-[120px]">{inv.transaction_id || 'N/A'}</div>
                              {inv.payment_screenshot && (
                                <a 
                                  href={`${API_BASE_URL.replace('/api', '')}/${inv.payment_screenshot}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-[9px] text-amber-600 font-black uppercase tracking-widest mt-1 flex items-center gap-1 hover:text-amber-700 transition-colors cursor-pointer"
                                >
                                  <FileText size={10}/> View Receipt
                                </a>
                              )}
                            </td>
                          <td className="py-6 px-8 text-right">
                            <span className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                              inv.cycle_status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm' : 
                              inv.cycle_status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-sm' :
                              inv.cycle_status === 'cancelled' ? 'bg-slate-50 text-slate-400 border-slate-200 shadow-sm' :
                              'bg-amber-50 text-amber-600 border-amber-100 shadow-sm'
                            }`}>
                              {inv.cycle_status === 'active' ? <CheckCircle size={12} /> : inv.cycle_status === 'rejected' ? <XCircle size={12} /> : <AlertTriangle size={12} />}
                              {inv.cycle_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {investmentHistory.length === 0 && (
                        <tr>
                          <td colSpan="6" className="py-24 text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 italic">
                             Audit record is currently empty
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          </motion.div>
        )}
        {activeTab === 'genealogy' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="bg-white border border-slate-200 p-8 md:p-12 rounded-[3.5rem] shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Genealogy Explorer</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">Audit the hierarchical referral matrix (Up to 5 Levels)</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                   <div className="relative flex-1 md:w-80">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="SEARCH INVESTOR NODE..." 
                        value={genealogySearchTerm}
                        onChange={(e) => setGenealogySearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-[10px] font-black uppercase tracking-widest outline-none focus:border-amber-500 focus:bg-white transition-all shadow-inner"
                      />
                   </div>
                   {genealogySelectedUser && (
                     <button 
                       onClick={() => fetchGenealogy()}
                       className="bg-slate-900 text-white p-4 rounded-2xl hover:bg-amber-600 transition-all active:scale-95 shadow-lg"
                     >
                        <ArrowLeft size={16} />
                     </button>
                   )}
                </div>
              </div>

              {!genealogySelectedUser ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rootUsers.filter(u => 
                    u.name.toLowerCase().includes(genealogySearchTerm.toLowerCase()) || 
                    u.referral_code.toLowerCase().includes(genealogySearchTerm.toLowerCase()) ||
                    u.email.toLowerCase().includes(genealogySearchTerm.toLowerCase())
                  ).map((u) => (
                    <div 
                      key={u.id} 
                      onClick={() => fetchGenealogy(u.id)}
                      className="bg-slate-50 border border-slate-100 p-6 rounded-[2rem] hover:border-amber-500 hover:bg-white transition-all cursor-pointer group relative overflow-hidden"
                    >
                      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform"><Network size={100} /></div>
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-amber-500 font-black italic text-lg border border-white/5 shadow-lg">{u.name[0]}</div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-black text-slate-900 uppercase italic truncate">{u.name}</h4>
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">{u.referral_code}</p>
                        </div>
                      </div>
                      <div className="mt-6 pt-6 border-t border-slate-200/50 flex justify-between items-center relative z-10">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Inspect Tree</span>
                        <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm border border-slate-100">
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="bg-amber-50 border border-amber-100 p-8 rounded-[3rem] flex items-center justify-between">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center text-amber-500 shadow-xl border border-white/5 italic font-black text-2xl">{genealogySelectedUser.name[0]}</div>
                       <div>
                          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 italic">Selected Root Node</p>
                          <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{genealogySelectedUser.name}</h4>
                          <div className="flex gap-4 mt-1">
                             <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{genealogySelectedUser.email}</span>
                             <span className="text-[9px] text-amber-600 font-black uppercase tracking-widest italic font-bold">● {genealogySelectedUser.referral_code}</span>
                          </div>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Total Network Depth</p>
                       <p className="text-2xl font-black text-slate-900 italic tracking-tighter">5 Levels Active</p>
                    </div>
                  </div>
                  <GenealogyTree data={genealogyData} loading={genealogyLoading} />
                </div>
              )}
            </div>

            {/* Anti-Fraud Intelligence Insights */}
            <div className="bg-slate-900 text-white p-12 rounded-[4rem] shadow-2xl relative overflow-hidden group border border-white/5">
               <div className="absolute -right-20 -top-20 opacity-5 group-hover:scale-110 transition-transform duration-1000"><ShieldAlert size={400} /></div>
               <div className="relative z-10">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-4 flex items-center gap-3">
                    <div className="w-2 h-8 bg-rose-500 rounded-full"></div> Fraud Detection Intelligence
                  </h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-10 italic">Neural monitoring for circular referral patterns and multiple account abuse</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                     {[
                       { 
                         label: 'Circular Links', 
                         value: (stats.circular_links || 0) + ' Detected', 
                         status: (stats.circular_links > 0 ? 'Risk Found' : 'Secure'), 
                         icon: RefreshCw, 
                         color: (stats.circular_links > 0 ? 'text-rose-500' : 'text-emerald-500'),
                         bgStatus: (stats.circular_links > 0 ? 'bg-rose-500' : 'bg-emerald-500')
                       },
                       { 
                         label: 'IP Clusters', 
                         value: (stats.ip_clusters || 0) + ' Flagged', 
                         status: (stats.ip_clusters > 0 ? 'Review Needed' : 'Stable'), 
                         icon: Globe, 
                         color: (stats.ip_clusters > 0 ? 'text-amber-500' : 'text-emerald-500'),
                         bgStatus: (stats.ip_clusters > 0 ? 'bg-amber-500' : 'bg-emerald-500')
                       },
                       { 
                         label: 'Node Velocity', 
                         value: (stats.node_velocity || 0) + ' New Today', 
                         status: 'Healthy', 
                         icon: Activity, 
                         color: 'text-blue-500',
                         bgStatus: 'bg-emerald-500'
                       },
                     ].map((item, i) => (
                       <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] hover:bg-white/10 transition-all shadow-xl">
                          <div className={`w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center ${item.color} mb-6 border border-white/5`}><item.icon size={20} /></div>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">{item.label}</p>
                          <h4 className="text-xl font-black italic tracking-tight mb-2">{item.value}</h4>
                          <div className="flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${item.bgStatus} shadow-[0_0_8px_rgba(16,185,129,0.8)]`}></div>
                             <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${item.color} italic`}>{item.status}</span>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'wallets_view' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 p-8 md:p-12 rounded-[3.5rem] shadow-sm">
            <div className="flex justify-between items-center mb-12">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Institutional Wallets Ledger</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Real-time fiscal monitoring of all investor account balances</p>
               </div>
               <div className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg italic">
                  Total Active: {walletsData.length} Portfolios
               </div>
            </div>

            <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="py-5 px-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 italic">Investor Entity</th>
                        <th className="py-5 px-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 text-right italic">Available Capital</th>
                        <th className="py-5 px-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 text-right italic">Cumulative Yield</th>
                        <th className="py-5 px-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 text-right italic">Total Liquidation</th>
                        <th className="py-5 px-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 text-right italic">Intervention</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {walletsData.map(w => (
                        <tr key={w.wallet_id} className="hover:bg-slate-50/70 transition group">
                          <td className="py-7 px-8">
                            <div className="flex items-center gap-6">
                              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-amber-500 font-black italic text-xl border border-white/5 shadow-xl">{w.user_name[0]}</div>
                              <div>
                                <div className="text-sm font-black text-slate-900 italic uppercase tracking-tight group-hover:text-amber-600 transition-colors">{w.user_name}</div>
                                <div className="text-[10px] text-slate-400 font-bold mt-1.5 truncate max-w-[200px]">{w.user_email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-7 px-8 text-right">
                            <div className="text-xl font-black text-slate-900 italic tracking-tighter">₹{parseFloat(w.balance).toLocaleString()}</div>
                            <div className="text-[9px] text-amber-600 font-black uppercase tracking-[0.2em] mt-1 italic">Liquid Reserve</div>
                          </td>
                          <td className="py-7 px-8 text-right">
                            <div className="text-sm font-black text-emerald-600 italic tracking-tight">₹{parseFloat(w.total_earned).toLocaleString()}</div>
                            <div className="text-[9px] text-emerald-600/50 font-black uppercase tracking-[0.2em] mt-1 italic">Gross Profits</div>
                          </td>
                          <td className="py-7 px-8 text-right">
                            <div className="text-sm font-black text-rose-500 italic tracking-tight">₹{parseFloat(w.total_withdrawn).toLocaleString()}</div>
                            <div className="text-[9px] text-rose-500/50 font-black uppercase tracking-[0.2em] mt-1 italic">Total Outflow</div>
                          </td>
                          <td className="py-7 px-8 text-right">
                            <button 
                              onClick={() => {
                                const foundUser = users.find(u => u.id.toString() === w.user_id.toString());
                                if (foundUser) {
                                  setSelectedUser(foundUser);
                                  setShowUserModal(true);
                                } else {
                                  alert("System: Investor profile node not found in current cache.");
                                }
                              }}
                              className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-900 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all active:scale-95 shadow-sm"
                            >
                              <UserCircle size={14} className="text-amber-500" /> View Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                      {walletsData.length === 0 && (
                        <tr>
                          <td colSpan="5" className="py-24 text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 italic">
                             Financial ledger is currently empty
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'wallet_adj' && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto bg-white border border-slate-200 p-8 md:p-14 rounded-[3.5rem] shadow-sm">
            <div className="flex items-center gap-6 mb-12">
               <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center text-amber-500 shadow-xl border border-white/5"><CreditCard size={32}/></div>
               <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Capital Correction Protocol</h3>
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] mt-1 italic">Manual intervention layer for investor wallet adjustment</p>
               </div>
            </div>
            
            <form onSubmit={handleAdjustWallet} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Target Investor Entity</label>
                   <select 
                      required 
                      value={adjForm.user_id} 
                      onChange={e => {
                        const uid = e.target.value;
                        setAdjForm({...adjForm, user_id: uid, amount: ''});
                        setSelectedUserPayout(null);
                        fetchUserPayout(uid);
                      }} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-5 px-8 text-sm outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner text-slate-700 font-black uppercase italic"
                   >
                      <option value="">-- IDENTIFY USER --</option>
                      {users.filter(u => u.role !== 'admin').map(u => (
                         <option key={u.id} value={u.id}>
                            {u.name.toUpperCase()} [{u.email.toLowerCase()}]
                         </option>
                      ))}
                   </select>
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Correction Direction</label>
                   <select value={adjForm.type} onChange={e => setAdjForm({...adjForm, type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-5 px-8 text-sm outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner text-slate-700 font-black uppercase italic">
                      <option value="credit">Inject Capital (Credit +)</option>
                      <option value="debit">Withdraw Capital (Debit -)</option>
                   </select>
                </div>
              </div>

              {/* Auto-populated Payout Info Card */}
              {payoutLoading && (
                <div className="flex items-center justify-center gap-3 py-6 text-amber-600">
                  <Loader2 className="animate-spin" size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest italic">Fetching investor payout data...</span>
                </div>
              )}
              {!payoutLoading && selectedUserPayout && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {/* Row 1 — 3 key figures */}
                  <div className="grid grid-cols-3 gap-4 p-6 bg-amber-50/50 border border-amber-100 rounded-[3rem] shadow-sm relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 text-amber-100/50 rotate-12"><TrendingUp size={80} /></div>
                    <div className="text-center relative z-10">
                      <p className="text-[8px] font-black text-amber-600 uppercase tracking-[0.3em] mb-1.5 italic">Daily Payout</p>
                      <p className="text-2xl font-black text-slate-900 italic tracking-tighter">₹{selectedUserPayout.total_daily_payout.toLocaleString()}</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <span className="w-1 h-1 bg-amber-500 rounded-full animate-pulse"></span>
                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest italic">1% Institutional Yield</p>
                      </div>
                    </div>
                    <div className="text-center border-x border-amber-100 relative z-10">
                      <p className="text-[8px] font-black text-rose-600 uppercase tracking-[0.3em] mb-1.5 italic">Remaining Capital</p>
                      <p className="text-2xl font-black text-rose-600 italic tracking-tighter">₹{selectedUserPayout.remaining_value.toLocaleString()}</p>
                      <p className="text-[8px] text-slate-400 font-black uppercase mt-1 italic">{selectedUserPayout.cashback_percentage}% Progress</p>
                    </div>
                    <div className="text-center relative z-10">
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1.5 italic">Total Invested</p>
                      <p className="text-2xl font-black text-slate-900 italic tracking-tighter">₹{selectedUserPayout.total_invested.toLocaleString()}</p>
                      <p className="text-[8px] text-amber-600 font-black uppercase tracking-widest mt-1 italic">
                        {selectedUserPayout.cycles?.[0]?.asset_type === 'silver' ? 'Pure Silver' : '22K Gold'} Asset
                      </p>
                    </div>
                  </div>
                  {/* Row 2 — 3 secondary figures */}
                  <div className="grid grid-cols-3 gap-4 p-5 bg-slate-50/80 border border-slate-100 rounded-[2.5rem] shadow-sm">
                    <div className="text-center">
                      <p className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-1 italic">Wallet Balance</p>
                      <p className="text-xl font-black text-emerald-600 italic tracking-tighter">₹{selectedUserPayout.wallet_balance.toLocaleString()}</p>
                    </div>
                    <div className="text-center border-x border-slate-100">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1 italic">Total Earned</p>
                      <p className="text-xl font-black text-slate-900 italic tracking-tighter">₹{selectedUserPayout.total_earned.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1 italic">Cycle Progress</p>
                      <p className="text-xl font-black text-slate-900 italic tracking-tighter">
                        {selectedUserPayout.days_completed} <span className="text-slate-300 text-sm">/ 100</span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {!payoutLoading && adjForm.user_id && !selectedUserPayout && (
                <div className="bg-slate-50 border border-dashed border-slate-200 p-8 rounded-3xl mb-10 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-2">No Active Portfolio Detected</p>
                  <p className="text-sm font-bold text-slate-500">This user currently has no active investment cycles to calculate daily payouts from.</p>
                </div>
              )}

              {selectedUserPayout && selectedUserPayout.active_cycles > 0 && (
                <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2.5rem] mb-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200"><Zap size={32} /></div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-1 italic">Daily Payout Detected</p>
                      <h4 className="text-3xl font-black text-slate-900 italic tracking-tighter">₹{selectedUserPayout.total_daily_payout.toLocaleString()}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 italic">Across {selectedUserPayout.active_cycles} Active Cycles</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setAdjForm({ ...adjForm, amount: selectedUserPayout.total_daily_payout.toString(), reason: 'Daily Cashback Payout', type: 'credit', category: 'cashback' })}
                    className="w-full md:w-auto bg-emerald-600 text-white px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-xl hover:shadow-emerald-500/20 active:scale-95 italic flex items-center justify-center gap-3"
                  >
                    <CheckCircle2 size={18} /> Apply 1% Daily Payout
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-10">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Injection Quantity (₹)</label>
                   <div className="relative group">
                      <span className="absolute left-10 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">₹</span>
                      <input type="number" placeholder="0.00" required value={adjForm.amount} onChange={e => setAdjForm({...adjForm, amount: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-[2.5rem] py-8 pl-20 pr-10 text-4xl font-black text-slate-900 outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner tracking-tighter" />
                   </div>
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Authorization Rationale</label>
                   <textarea placeholder="Specify the precise reason for this manual intervention..." value={adjForm.reason} onChange={e => setAdjForm({...adjForm, reason: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] p-8 h-32 text-sm outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner text-slate-700 font-bold"></textarea>
                </div>
              </div>
              <button 
                type="button" 
                onClick={handleAdjustWallet}
                disabled={processing} 
                className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 hover:bg-amber-600 transition shadow-2xl active:scale-[0.98]"
              >
                 {processing ? <Loader2 className="animate-spin" /> : <><CheckCircle size={20}/> Pay Out</>}
              </button>
            </form>
          </motion.div>
        )}

        {activeTab === 'tickets' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
             {/* Dispatch Controller */}
             <div className="bg-slate-900 text-white p-10 md:p-14 rounded-[4rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-20 -bottom-20 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                   <Megaphone size={400} />
                </div>
                
                <div className="relative z-10">
                   <div className="flex items-center gap-5 mb-10">
                      <div className="w-16 h-16 bg-amber-500 rounded-[2rem] flex items-center justify-center text-slate-900 shadow-xl border border-white/10">
                         <Megaphone size={32} />
                      </div>
                      <div>
                         <h3 className="text-3xl font-black tracking-tighter uppercase italic">{notifEditId ? 'Update Message' : 'Notification Hub'}</h3>
                         <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1 italic">{notifEditId ? 'Modifying existing neural transmission' : 'Neural dispatch for institutional communications'}</p>
                      </div>
                   </div>

                   <form onSubmit={handleSendNotification} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="space-y-8">
                         {notifEditId && (
                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex justify-between items-center">
                               <span className="text-[10px] font-black text-amber-600 uppercase italic">Editing Mode Active (ID: #{notifEditId})</span>
                               <button type="button" onClick={() => { setNotifEditId(null); setNotifForm({ user_id: '', title: '', message: '', type: 'info' }); }} className="text-rose-500 hover:text-rose-700 transition-colors"><X size={16} /></button>
                            </div>
                         )}
                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Recipient Selection</label>
                            <select 
                               value={notifForm.user_id} 
                               onChange={e => setNotifForm({...notifForm, user_id: e.target.value})}
                               className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-sm font-black text-white outline-none focus:border-amber-500 focus:bg-white/10 transition-all italic"
                            >
                               <option value="" className="bg-slate-900">GLOBAL BROADCAST (ALL INVESTORS)</option>
                               {users.map(u => (
                                  <option key={u.id} value={u.id} className="bg-slate-900 text-white uppercase italic">{u.name} (ID: {u.id})</option>
                               ))}
                            </select>
                         </div>

                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Communication Title</label>
                            <input 
                               type="text" 
                               placeholder="e.g., SYSTEM UPGRADE SUCCESSFUL" 
                               value={notifForm.title}
                               onChange={e => setNotifForm({...notifForm, title: e.target.value})}
                               required
                               className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-sm font-black text-white outline-none focus:border-amber-500 focus:bg-white/10 transition-all uppercase italic"
                            />
                         </div>

                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Neural Message</label>
                            <textarea 
                               placeholder="Draft your institutional announcement here..."
                               value={notifForm.message}
                               onChange={e => setNotifForm({...notifForm, message: e.target.value})}
                               required
                               className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-8 h-32 text-sm font-bold text-white outline-none focus:border-amber-500 focus:bg-white/10 transition-all italic"
                            ></textarea>
                         </div>
                      </div>

                      <div className="space-y-8 flex flex-col justify-between">
                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Priority Protocol</label>
                            <div className="grid grid-cols-3 gap-4">
                               {['info', 'success', 'warning'].map(t => (
                                  <button 
                                    key={t}
                                    type="button"
                                    onClick={() => setNotifForm(prev => ({...prev, type: t}))}
                                    className={`py-5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                                       notifForm.type === t 
                                       ? 'bg-amber-500 text-slate-900 border-amber-600 shadow-lg' 
                                       : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                                    }`}
                                  >
                                     {t}
                                  </button>
                               ))}
                            </div>
                         </div>

                         <div className="bg-amber-500/5 border border-amber-500/20 p-8 rounded-[2.5rem] italic">
                            <p className="text-[9px] text-amber-500/80 leading-relaxed font-black uppercase tracking-wider">
                               Attention: Dispatching this notification will immediately update the neural interface of the selected recipient(s). Ensure all technical data is verified before execution.
                            </p>
                         </div>

                         <button 
                           type="button" 
                           onClick={handleSendNotification}
                           disabled={processing}
                           className="w-full bg-amber-500 text-slate-900 py-6 rounded-3xl font-black uppercase tracking-[0.4em] text-xs flex items-center justify-center gap-4 hover:bg-white transition-all shadow-2xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                            {processing ? (
                               <div className="flex items-center gap-3">
                                  <Loader2 className="animate-spin" size={20} />
                                  <span>PROCESSING...</span>
                               </div>
                            ) : (
                               <div className="flex items-center gap-3">
                                  {notifEditId ? <Save size={20}/> : <Zap size={20}/>} 
                                  <span>{notifEditId ? 'UPDATE PROTOCOL' : 'DISPATCH NOTIFICATION'}</span>
                               </div>
                            )}
                         </button>
                      </div>
                   </form>
                </div>
             </div>

             {/* Transmission Log */}
             <div className="bg-white border border-slate-200 p-8 md:p-12 rounded-[4rem] shadow-sm">
                <div className="flex justify-between items-center mb-10">
                   <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Neural Logs</h3>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">Historical audit of institutional communications</p>
                   </div>
                   <div className="bg-slate-50 text-slate-400 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
                      {notifications.length} DISPATCHED
                   </div>
                </div>

                <div className="space-y-6">
                   {notifications.length === 0 ? (
                      <div className="text-center py-24 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                         <Activity size={60} className="mx-auto text-slate-200 mb-8" />
                         <p className="text-slate-400 font-black uppercase tracking-widest text-xs italic">No active neural transmissions found</p>
                      </div>
                   ) : (
                      notifications.map((n) => (
                         <div key={n.id} className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group">
                            <div className="flex gap-6 items-start">
                               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner ${
                                  n.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                  n.type === 'warning' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                  'bg-blue-50 text-blue-600 border-blue-100'
                               }`}>
                                  <Activity size={20} />
                               </div>
                               <div>
                                  <div className="flex items-center gap-3 mb-1">
                                     <h4 className="font-black text-sm text-slate-900 uppercase italic tracking-tight">{n.title}</h4>
                                     <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${
                                        n.type === 'success' ? 'bg-emerald-500 text-white' :
                                        n.type === 'warning' ? 'bg-rose-500 text-white' :
                                        'bg-blue-500 text-white'
                                     }`}>{n.type}</span>
                                  </div>
                                  <p className="text-xs text-slate-500 font-medium italic mb-2">{n.message}</p>
                                  <div className="flex items-center gap-4">
                                     <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest italic">
                                        RECIPIENT: {n.user_id ? `${n.user_name} (ID: ${n.user_id})` : 'GLOBAL ALL'}
                                     </span>
                                  </div>
                               </div>
                            </div>
                            <div className="flex flex-col md:flex-row items-end md:items-center gap-4 md:gap-8 w-full md:w-auto">
                               <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic flex items-center gap-2">
                                  <Clock size={14} /> {new Date(n.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                               </div>
                               <div className="flex gap-2">
                                  <button 
                                    onClick={() => startEditingNotif(n)}
                                    className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm border border-amber-100 group-hover:shadow-md"
                                  >
                                     <Edit3 size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteNotification(n.id)}
                                    className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-100 group-hover:shadow-md"
                                  >
                                     <Trash2 size={16} />
                                  </button>
                               </div>
                            </div>
                         </div>
                      ))
                   )}
                </div>
             </div>
          </motion.div>
        )}

         {activeTab === 'users' && (
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 p-8 md:p-12 rounded-[3.5rem] shadow-sm">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                <div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Investor Directory</h3>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">Universal registry of all platform participants</p>
                </div>
                <div className="flex w-full md:w-auto gap-4">
                   <div className="relative flex-1 md:flex-none">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="SEARCH BY IDENTITY..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-80 bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-6 text-[10px] font-black uppercase tracking-widest outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner" 
                      />
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {users.filter(u => 
                   u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                   u.email.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((u) => (
                   <div key={u.id} className="p-8 bg-white border border-slate-100 rounded-[3rem] hover:border-amber-500/50 transition-all group shadow-sm">
                      <div className="flex items-center gap-5 mb-8">
                         <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-amber-500 font-black uppercase text-2xl shadow-xl border border-white/10">{u.name[0]}</div>
                         <div className="min-w-0">
                            <h4 className="text-sm font-black text-slate-900 uppercase italic leading-none truncate">{u.name}</h4>
                            <p className="text-[10px] text-slate-400 font-bold mt-1.5 truncate uppercase tracking-widest">Joined {new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-8">
                         <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Wallet</p>
                            <p className="text-sm font-black text-slate-900 italic">₹{parseFloat(u.balance || 0).toLocaleString()}</p>
                         </div>
                         <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Role</p>
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-1 italic">{u.role}</p>
                         </div>
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                         <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-sm border ${
                            u.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : u.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                         }`}>
                            {u.status}
                         </div>
                         <button 
                           onClick={() => { setSelectedUser(u); setShowUserModal(true); }}
                           className="w-10 h-10 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl flex items-center justify-center transition-all shadow-sm border border-slate-200 active:scale-95"
                         >
                            <Settings size={18} />
                         </button>
                      </div>
                   </div>
                ))}
             </div>
           </motion.div>
        )}

        {activeTab === 'kyc' && (
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 p-8 md:p-12 rounded-[3.5rem] shadow-sm mt-8">
             <div className="flex justify-between items-center mb-12">
                <div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Institutional KYC Registry</h3>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">Identity verification protocol for high-net-worth individuals</p>
                </div>
                <div className="bg-amber-50 text-amber-600 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 shadow-sm">
                   {users.filter(u => u.kyc_status === 'pending').length} Awaiting Verification
                </div>
             </div>

             <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="py-6 px-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 italic">Investor Entity</th>
                        <th className="py-6 px-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 italic">Submission Node</th>
                        <th className="py-6 px-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 italic">Digital Credential</th>
                        <th className="py-6 px-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 text-right italic">Authorization</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.filter(u => u.kyc_status === 'pending').map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition group">
                          <td className="py-8 px-10">
                            <div className="flex items-center gap-6">
                              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-amber-500 font-black italic text-xl border border-white/5 shadow-xl">{u.name[0]}</div>
                              <div>
                                <div className="text-sm font-black text-slate-900 italic uppercase tracking-tight group-hover:text-amber-600 transition-colors">{u.name}</div>
                                <div className="text-[10px] text-slate-400 font-bold mt-1.5 truncate max-w-[200px]">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-8 px-10">
                            <div className="text-xs font-black text-slate-900 italic">{new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            <div className="text-[9px] text-amber-600 font-black uppercase tracking-widest mt-1 italic">Pending Review</div>
                          </td>
                          <td className="py-8 px-10">
                            {u.kyc_document ? (
                               <a 
                                 href={u.kyc_document.startsWith('http') ? u.kyc_document : `${API_BASE_URL.replace('/api', '')}/${u.kyc_document}`} 
                                 target="_blank" 
                                 rel="noreferrer"
                                 className="inline-flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-2xl border border-white/10 hover:bg-amber-600 transition-all text-[9px] font-black uppercase tracking-widest shadow-lg italic"
                               >
                                  <ExternalLink size={14} /> Analyze Document
                               </a>
                            ) : (
                               <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest italic">Node: No Data</span>
                            )}
                          </td>
                          <td className="py-8 px-10 text-right">
                            <div className="flex justify-end gap-3">
                               <button 
                                 onClick={() => handleUpdateUser({ id: u.id, kyc_status: 'verified' })}
                                 className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm italic"
                               >
                                  Approve
                               </button>
                               <button 
                                 onClick={() => handleUpdateUser({ id: u.id, kyc_status: 'rejected' })}
                                 className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all border border-rose-100 shadow-sm italic"
                               >
                                  Reject
                               </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {users.filter(u => u.kyc_status === 'pending').length === 0 && (
                        <tr>
                          <td colSpan="4" className="py-24 text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 italic">
                             All KYC nodes are currently synchronized
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'broadcast' && (
           <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto bg-white border border-slate-200 p-8 md:p-14 rounded-[3.5rem] shadow-sm">
             <div className="flex items-center gap-6 mb-16">
                <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center text-amber-500 shadow-xl border border-white/5"><Megaphone size={32}/></div>
                <div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Universal Broadcast</h3>
                   <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] mt-1 italic">Push high-priority notifications to all active investor portals</p>
                </div>
             </div>

             <form onSubmit={handleSendBroadcast} className="space-y-10">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Broadcast Subject</label>
                   <input 
                     type="text" 
                     required 
                     placeholder="URGENT: SYSTEM UPDATE..."
                     value={broadcastForm.title}
                     onChange={(e) => setBroadcastForm({...broadcastForm, title: e.target.value})}
                     className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-8 text-xl font-black text-slate-900 outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner tracking-tight italic uppercase"
                   />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Transmission Type</label>
                      <select 
                        value={broadcastForm.type}
                        onChange={(e) => setBroadcastForm({...broadcastForm, type: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-3xl py-5 px-8 text-sm outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner text-slate-700 font-black uppercase italic"
                      >
                         <option value="info">Informational Message</option>
                         <option value="success">Profit Realization Alert</option>
                         <option value="warning">System Caution Notice</option>
                         <option value="error">High-Priority Emergency</option>
                      </select>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Recurrence Protocol</label>
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between italic">
                         <span className="text-[10px] font-black text-slate-400 uppercase">Single Transmission</span>
                         <div className="w-10 h-6 bg-slate-200 rounded-full relative">
                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Transmission Body</label>
                   <textarea 
                     required 
                     placeholder="Type your message to all platform users here..."
                     value={broadcastForm.message}
                     onChange={(e) => setBroadcastForm({...broadcastForm, message: e.target.value})}
                     className="w-full bg-slate-50 border border-slate-200 rounded-[2.5rem] p-8 h-48 text-sm outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner text-slate-700 font-bold leading-relaxed"
                   ></textarea>
                </div>

                <div className="flex gap-6 pt-4">
                   <button type="submit" disabled={processing} className="flex-1 bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 hover:bg-amber-600 transition shadow-2xl active:scale-[0.98]">
                      {processing ? <Loader2 className="animate-spin" /> : <><Globe size={20}/> Execute Universal Transmission</>}
                   </button>
                   <button type="button" onClick={() => setActiveTab('overview')} className="px-12 bg-slate-50 text-slate-400 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition border border-slate-200 italic">Discard</button>
                </div>
             </form>
           </motion.div>
        )}

        {activeTab === 'recruitment' && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto space-y-12 pb-20">
             <div className="flex items-center gap-6 mb-16">
                <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center text-amber-500 shadow-xl border border-white/5"><UserPlus size={32}/></div>
                <div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Personnel Recruitment</h3>
                   <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] mt-1 italic">Administrative interface for onboarding elite platform management staff</p>
                </div>
             </div>

             <form onSubmit={handleRegisterStaff} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Full Identity</label>
                      <input type="text" placeholder="e.g. MARCUS AURELIUS" required value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-8 text-sm font-black uppercase italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner" />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Institutional Email</label>
                      <input type="email" placeholder="staff.node@makkalgold.com" required value={staffForm.email} onChange={e => setStaffForm({...staffForm, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-8 text-sm font-black italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner" />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">System Role Authorization</label>
                      <div className="relative">
                         <select 
                           value={staffForm.role} 
                           onChange={e => {
                              const newRole = e.target.value;
                              let newPerms = AVAILABLE_PERMISSIONS.map(p => p.id);
                              if (newRole === 'staff') {
                                 newPerms = ['overview', 'kyc', 'tickets'];
                              } else if (newRole === 'advocate') {
                                 newPerms = ['overview', 'agreements', 'users'];
                              }
                              setStaffForm({...staffForm, role: newRole, permissions: newPerms});
                           }} 
                           className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-8 text-sm font-black uppercase italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner appearance-none"
                         >
                            <option value="manager">MANAGER</option>
                            <option value="staff">STAFF</option>
                            <option value="advocate">ADVOCATE</option>
                         </select>
                         <Settings className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      </div>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Security Credentials</label>
                      <div className="relative">
                         <input 
                           type={showStaffPassword ? "text" : "password"} 
                           placeholder="••••••••" 
                           required 
                           value={staffForm.password} 
                           onChange={e => setStaffForm({...staffForm, password: e.target.value})} 
                           className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 pl-8 pr-16 text-sm font-black tracking-widest outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner" 
                         />
                         <button 
                           type="button" 
                           onClick={() => setShowStaffPassword(!showStaffPassword)} 
                           className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600 transition p-2"
                         >
                           {showStaffPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                         </button>
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

                <div className="p-8 bg-amber-50 border border-amber-100 rounded-[2.5rem] shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldAlert size={80} className="text-amber-600" /></div>
                   <div className="flex items-center gap-4 mb-3 text-amber-600 relative z-10">
                      <ShieldAlert size={20} />
                      <p className="text-[11px] font-black uppercase tracking-widest">Protocol Authorization Note</p>
                   </div>
                   <p className="text-[10px] text-slate-500 font-bold leading-relaxed relative z-10 uppercase tracking-tight">Newly onboarded staff will be required to initialize secondary encryption and synchronize credentials upon their primary session entry. Verification of node email is mandatory.</p>
                </div>

                <div className="flex gap-6 pt-6">
                   <button type="submit" disabled={processing} className="flex-1 bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 hover:bg-amber-600 transition shadow-2xl active:scale-[0.98]">
                      {processing ? <Loader2 className="animate-spin" /> : <><CheckCircle size={20}/> Finalize Onboarding</>}
                   </button>
                   <button type="button" onClick={() => setActiveTab('overview')} className="px-12 bg-slate-50 text-slate-400 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition border border-slate-200 italic">Cancel</button>
                </div>
             </form>
          </motion.div>
        )}

        {activeTab === 'withdrawals' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-slate-200 p-8 md:p-12 rounded-[3.5rem] shadow-sm">
            <div className="flex justify-between items-center mb-12">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Institutional Payout Matrix</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">Authorized liquidation of investor capital reserves</p>
               </div>
               <div className="bg-rose-50 text-rose-600 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100 shadow-sm flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></div> {withdrawals.filter(w => w.status === 'pending').length} Awaiting Liquidation
               </div>
            </div>
            
            <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="py-6 px-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 italic">Investor Entity</th>
                        <th className="py-6 px-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 italic">Channel</th>
                        <th className="py-6 px-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 italic">Quantum (₹)</th>
                        <th className="py-6 px-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 italic">Protocol State</th>
                        <th className="py-6 px-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 text-right italic">Node Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {withdrawals.length === 0 ? (
                         <tr><td colSpan="5" className="py-32 text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 italic">Institutional payout queue is currently empty</td></tr>
                      ) : (
                         withdrawals.map((w) => (
                           <tr key={w.id} className="hover:bg-slate-50/70 transition group">
                              <td className="py-8 px-10">
                                 <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-amber-500 font-black italic text-lg border border-white/5 shadow-xl">{w.user_name[0]}</div>
                                    <div className="flex flex-col">
                                       <span className="font-black text-sm text-slate-900 uppercase italic tracking-tight group-hover:text-amber-600 transition-colors">{w.user_name}</span>
                                       <span className="text-[10px] text-slate-400 font-bold mt-1.5 truncate max-w-[150px]">{w.user_email}</span>
                                    </div>
                                 </div>
                              </td>
                              <td className="py-8 px-10">
                                 <div className="text-[10px] text-slate-900 font-black uppercase tracking-widest">{w.payment_method || 'Bank Transfer'}</div>
                                 <div className="text-[9px] text-slate-400 font-bold mt-2 bg-slate-100 p-3 rounded-xl border border-slate-200 shadow-inner max-w-[200px] break-words">
                                    {w.bank_details || 'NODE: NO CREDENTIALS PROVIDED'}
                                 </div>
                              </td>
                              <td className="py-8 px-10">
                                 <div className="text-xl font-black text-slate-900 italic tracking-tighter">₹{parseFloat(w.amount).toLocaleString()}</div>
                                 <div className="text-[9px] text-rose-500 font-black uppercase tracking-[0.2em] mt-1 italic">Capital Liquidation</div>
                              </td>
                              <td className="py-8 px-10">
                                 <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm border italic ${
                                    w.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                    w.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                                    'bg-amber-50 text-amber-600 border-amber-100'
                                 }`}>
                                    {w.status}
                                 </span>
                              </td>
                              <td className="py-8 px-10 text-right">
                                 {w.status === 'pending' && (
                                    <div className="flex justify-end gap-3">
                                       <button 
                                         onClick={() => handleProcessWithdrawal(w.id, 'approved')}
                                         className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg active:scale-95 italic flex items-center gap-2"
                                       >
                                          <CheckCircle2 size={12} className="text-amber-500" /> Authorize
                                       </button>
                                       <button 
                                         onClick={() => handleProcessWithdrawal(w.id, 'rejected')}
                                         className="bg-white text-slate-400 px-6 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-200 active:scale-95 italic flex items-center gap-2"
                                       >
                                          <XCircle size={12} /> Reject
                                       </button>
                                    </div>
                                 )}
                                 {w.status !== 'pending' && (
                                     <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest italic">
                                        Processed {new Date(w.processed_at || w.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                     </div>
                                 )}
                              </td>
                           </tr>
                         ))
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'inventory' && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-slate-200 p-8 md:p-12 rounded-[3.5rem] shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
               <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Institutional Gold Vault</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">Registry of physical assets and digital investment instruments</p>
               </div>
               <button 
                 onClick={() => {
                   setProductForm({ id: null, name: '', category: 'Gold Asset', weight: '', purity: '24K', price: '', description: '', image: '', is_active: 1 });
                   setShowProductModal(true);
                 }}
                 className="w-full md:w-auto bg-slate-900 text-white px-10 py-5 rounded-3xl font-black text-xs flex items-center justify-center gap-3 hover:bg-amber-600 transition shadow-xl active:scale-95 uppercase tracking-widest"
               >
                 <Plus size={18}/> Provision Asset
               </button>
            </div>

            <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-sm">
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="py-6 px-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 italic">Asset Description</th>

                        <th className="py-6 px-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 italic">Classification</th>
                        <th className="py-6 px-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 italic">Metric / Purity</th>
                        <th className="py-6 px-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 italic">Market Value</th>
                        <th className="py-6 px-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 italic">Protocol State</th>
                        <th className="py-6 px-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 text-right italic">Node Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition group">
                          <td className="py-8 px-10">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden shadow-inner">
                                  {p.image ? (
                                     <img src={p.image.startsWith('http') ? p.image : `${API_BASE_URL.replace('/api', '')}/${p.image}`} alt={p.name} className="w-full h-full object-cover" />
                                  ) : (
                                     <Package className="text-slate-200" size={20} />
                                  )}
                               </div>
                             <span className="font-black text-sm text-slate-900 uppercase italic tracking-tight group-hover:text-amber-600 transition-colors">{p.name}</span>
                            </div>
                          </td>

                          <td className="py-8 px-10">
                             <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest italic">{p.category || 'Gold Asset'}</div>
                             <div className="text-[8px] text-slate-400 font-bold mt-1 uppercase">Institutional Class</div>
                          </td>

                          <td className="py-8 px-10 font-black text-xs text-slate-900 italic tracking-tighter uppercase">{p.weight} Grams • {p.purity}</td>
                          <td className="py-8 px-10 font-black text-xl text-slate-900 italic tracking-tighter">₹{parseFloat(p.price).toLocaleString()}</td>
                          <td className="py-8 px-10">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border italic ${
                              p.is_active == 1 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                               {p.is_active == 1 ? 'Live Protocol' : 'Node Locked'}
                            </span>
                          </td>
                          <td className="py-8 px-10 text-right">
                             <div className="flex items-center justify-end gap-3">
                                <button 
                                  onClick={() => {
                                    setProductForm({
                                      id: p.id,
                                      name: p.name || '',
                                      category: p.category || 'Gold Asset',
                                      weight: p.weight || '',
                                      purity: p.purity || '24K',
                                      price: p.price || '',
                                      description: p.description || '',
                                      image: p.image || '',
                                      is_active: p.is_active
                                    });
                                    setShowProductModal(true);
                                  }}
                                  className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-amber-600 transition-all shadow-lg active:scale-95"
                                >
                                  <Settings size={18}/>
                                </button>
                                <button 
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="w-10 h-10 bg-white text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all border border-slate-200 active:scale-95"
                                >
                                  <Trash2 size={18}/>
                                </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>

            {/* Product Provisioning Modal */}
            <AnimatePresence>
               {showProductModal && (
                 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[250] flex items-center justify-center p-6">
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white border border-slate-100 p-10 md:p-16 rounded-[4rem] w-full max-w-5xl relative overflow-y-auto max-h-[90vh] shadow-2xl">
                       <button onClick={() => setShowProductModal(false)} className="absolute top-10 right-10 text-slate-400 hover:text-slate-900 p-2 bg-slate-50 rounded-full transition-colors"><XCircle size={28}/></button>
                       
                       <div className="mb-12">
                          <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">{productForm.id ? 'Calibrate Asset' : 'Provision New Asset'}</h3>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 italic">Institutional node for gold inventory management</p>
                       </div>
                       
                       <form onSubmit={handleSaveProduct} className="space-y-10">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                             <div className="space-y-3">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Asset Nomenclature</label>
                                <input type="text" required placeholder="e.g. MAKKAL GOLD BAR 10G" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-8 text-sm font-black uppercase italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner" />
                             </div>

                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Mass Displacement (Grams)</label>
                                <input type="number" step="0.001" required value={productForm.weight} onChange={e => setProductForm({...productForm, weight: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-8 text-sm font-black italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner" />
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Metallurgical Purity</label>
                                <select value={productForm.purity} onChange={e => setProductForm({...productForm, purity: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-8 text-sm font-black uppercase italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner appearance-none">
                                   <option value="24K">PROTOCOL 24K (99.9% PURE)</option>
                                   <option value="22K">STANDARD 22K (91.6% PURE)</option>
                                   <option value="18K">COMMERCIAL 18K</option>
                                </select>
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Asset Classification</label>
                                <input type="text" placeholder="e.g. GOLD ASSET PROTOCOL" value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-8 text-sm font-black uppercase italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner" />
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Valuation (₹)</label>
                                <div className="relative group">
                                   <span className="absolute left-8 top-1/2 -translate-y-1/2 text-lg font-black text-slate-300">₹</span>
                                   <input type="number" required value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 pl-14 pr-8 text-xl font-black text-amber-600 italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner" />
                                </div>
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Visual Asset Interface</label>
                                <div className="relative group">
                                   <input 
                                     type="file" 
                                     id="product-image"
                                     className="hidden" 
                                     accept="image/*"
                                     onChange={e => setProductForm({...productForm, image: e.target.files[0]})} 
                                   />
                                   <label htmlFor="product-image" className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl py-5 px-8 text-sm font-black uppercase italic cursor-pointer hover:border-amber-600 hover:bg-white transition-all flex items-center justify-between shadow-inner">
                                      <span className="text-slate-400 truncate max-w-[200px]">
                                         {productForm.image instanceof File ? productForm.image.name : (productForm.image ? 'Retain Current Artifact' : 'Upload Digital Asset')}
                                      </span>
                                      <Plus size={18} className="text-amber-600" />
                                   </label>
                                </div>
                             </div>
                          </div>
                          
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Institutional Description</label>
                             <textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-[2.5rem] p-8 h-40 text-sm font-bold outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner leading-relaxed" placeholder="Specify technical details, origin, and investment merits..."></textarea>
                          </div>

                          <div className="flex items-center gap-5 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-200 shadow-inner">
                             <input type="checkbox" id="asset-active" checked={productForm.is_active == 1} onChange={e => setProductForm({...productForm, is_active: e.target.checked ? 1 : 0})} className="w-6 h-6 accent-slate-900 rounded-lg" />
                             <label htmlFor="asset-active" className="text-[11px] font-black text-slate-900 uppercase tracking-widest cursor-pointer italic">Enable public node visibility for this asset</label>
                          </div>

                          <div className="flex gap-6 pt-6">
                             <button type="submit" disabled={processing} className="flex-1 bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 hover:bg-emerald-600 transition shadow-2xl active:scale-[0.98]">
                                {processing ? <Loader2 className="animate-spin" /> : <><CheckCircle size={20}/> {productForm.id ? 'Synchronize Asset' : 'Commit Asset Provisioning'}</>}
                             </button>
                             <button type="button" onClick={() => setShowProductModal(false)} className="px-12 bg-slate-50 text-slate-400 py-6 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition border border-slate-200 italic">Discard</button>
                          </div>
                       </form>
                    </motion.div>
                 </div>
               )}
            </AnimatePresence>
          </motion.div>
        )}
        {activeTab === 'market_rates' && (
           <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-5xl mx-auto space-y-6 md:space-y-10">
             <div className="bg-white border border-slate-200 p-6 md:p-14 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm">
                <div className="flex items-center gap-4 md:gap-6 mb-10 md:mb-16">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-900 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-amber-500 shadow-xl border border-white/5"><TrendingUp size={24} className="md:w-8 md:h-8"/></div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tighter uppercase italic leading-tight">Market Rate Control</h3>
                      <p className="text-slate-400 font-black uppercase tracking-widest text-[8px] md:text-[10px] mt-1 italic">Real-time asset valuation adjustments</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 mb-10 md:mb-16">
                    {/* Gold Calibration */}
                    <div className="bg-slate-50 border border-slate-200 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] relative overflow-hidden group hover:border-amber-500/50 transition-all shadow-inner">
                       <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all"></div>
                       <div className="flex items-center gap-3 mb-6 md:mb-8">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm border border-slate-100"><Zap size={16}/></div>
                          <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Gold Protocol (24K)</p>
                       </div>
                       <div className="space-y-4">
                          <label className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Asset Base Value</label>
                          <div className="relative group/input">
                             <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg md:text-2xl font-black text-slate-300 group-focus-within/input:text-amber-500 transition-colors italic">₹</span>
                             <input 
                               type="number" 
                               value={platformSettings.gold_base_price}
                               onChange={(e) => setPlatformSettings({...platformSettings, gold_base_price: e.target.value})}
                               className="w-full bg-white border border-slate-100 rounded-2xl py-5 md:py-6 pl-12 md:pl-16 pr-20 md:pr-24 text-2xl md:text-3xl font-black text-slate-900 outline-none focus:border-amber-600 transition-all shadow-sm tracking-tighter italic"
                             />
                             <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic">/ Gram</span>
                          </div>
                       </div>
                    </div>

                    {/* Silver Calibration */}
                    <div className="bg-slate-50 border border-slate-200 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] relative overflow-hidden group hover:border-slate-400/50 transition-all shadow-inner">
                       <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-400/5 rounded-full blur-2xl group-hover:bg-slate-400/10 transition-all"></div>
                       <div className="flex items-center gap-3 mb-6 md:mb-8">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100"><Coins size={16}/></div>
                          <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Silver Protocol (Pure)</p>
                       </div>
                       <div className="space-y-4">
                          <label className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 italic">Asset Base Value</label>
                          <div className="relative group/input">
                             <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg md:text-2xl font-black text-slate-300 group-focus-within/input:text-slate-900 transition-colors italic">₹</span>
                             <input 
                               type="number" 
                               value={platformSettings.silver_base_price}
                               onChange={(e) => setPlatformSettings({...platformSettings, silver_base_price: e.target.value})}
                               className="w-full bg-white border border-slate-100 rounded-2xl py-5 md:py-6 pl-12 md:pl-16 pr-20 md:pr-24 text-2xl md:text-3xl font-black text-slate-900 outline-none focus:border-slate-400 transition-all shadow-sm tracking-tighter italic"
                             />
                             <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic">/ Gram</span>
                          </div>
                       </div>
                    </div>
                </div>

                <button 
                  onClick={handleUpdateSettings}
                  disabled={processing}
                  className="w-full bg-slate-900 text-white py-6 md:py-8 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs flex items-center justify-center gap-3 md:gap-4 hover:bg-amber-600 transition shadow-2xl active:scale-[0.98] italic"
                >
                   {processing ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={20} className="md:w-6 md:h-6"/> Finalize Rate Synchronization</>}
                </button>
             </div>

             <div className="bg-amber-50 border border-amber-100 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] flex items-start gap-4 md:gap-6 shadow-sm">
                <AlertTriangle className="text-amber-600 shrink-0 mt-1 md:w-6 md:h-6" size={20} />
                <p className="text-[8px] md:text-[10px] text-slate-500 font-bold leading-relaxed uppercase tracking-tight italic">
                  Critical Warning: Modifying market rates will immediately impact all customer purchase simulations. Ensure cross-validation with global spot price nodes before execution.
                </p>
             </div>
           </motion.div>
        )}

        {activeTab === 'payout_reports' && (
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              <div className="bg-slate-900 rounded-[4rem] p-10 md:p-16 text-white relative overflow-hidden group">
                 <div className="absolute -right-20 -top-20 opacity-10 group-hover:scale-110 transition-transform duration-1000 rotate-12">
                    <BarChart3 size={400} />
                 </div>
                 
                 <div className="relative z-10">
                    <div className="flex items-center gap-6 mb-12">
                       <div className="w-20 h-20 bg-amber-500 rounded-[2.5rem] flex items-center justify-center text-slate-900 shadow-2xl border-4 border-white/10">
                          <BarChart3 size={40} />
                       </div>
                       <div>
                          <h3 className="text-4xl font-black tracking-tighter uppercase italic">Fiscal Performance Node</h3>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-1 italic">Real-time audit of institutional liquidity and yield distribution</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                       {[
                          { label: 'Total Platform Liquidity', value: `₹${(stats.revenue || 0).toLocaleString()}`, icon: Wallet, color: 'text-amber-500' },
                          { label: 'Yield Dispersal Today', value: `₹${(stats.payouts || 0).toLocaleString()}`, icon: Zap, color: 'text-emerald-400' },
                          { label: 'Investor Count', value: stats.users || 0, icon: Users, color: 'text-blue-400' },
                          { label: 'Active Assets', value: products.length, icon: ShoppingBag, color: 'text-rose-400' }
                       ].map((item, i) => (
                          <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-sm group/card hover:bg-white/10 transition-all">
                             <div className="flex items-center justify-between mb-6">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 ${item.color}`}>
                                   <item.icon size={20} />
                                </div>
                                <Activity size={16} className="text-white/20 group-hover/card:animate-pulse" />
                             </div>
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mb-2">{item.label}</p>
                             <p className="text-2xl font-black italic tracking-tighter">{item.value}</p>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>

              {/* Transaction Stream Analysis */}
              <div className="bg-white border border-slate-200 p-10 md:p-14 rounded-[4rem] shadow-sm">
                 <div className="flex justify-between items-center mb-12">
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Yield Audit Stream</h3>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 italic">Historical ledger of all institutional payouts and commissions</p>
                    </div>
                    <button 
                      onClick={() => window.print()}
                      className="bg-slate-50 text-slate-900 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-slate-200 hover:bg-slate-900 hover:text-white transition shadow-sm flex items-center gap-3 italic"
                    >
                       <FileText size={16} /> Generate Hardcopy
                    </button>
                 </div>

                 <div className="overflow-hidden rounded-[2.5rem] border border-slate-100">
                    <div className="overflow-x-auto">
                       <table className="w-full text-left border-collapse">
                          <thead>
                             <tr className="bg-slate-50">
                                <th className="py-6 px-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 italic">Temporal Stamp</th>
                                <th className="py-6 px-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 italic">Investor Entity</th>
                                <th className="py-6 px-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 italic">Operational Type</th>
                                <th className="py-6 px-10 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 italic text-right">Value Node</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                             {activityLogs.filter(log => log.action_type === 'payout' || log.action_type === 'commission').slice(0, 50).map((log, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition group">
                                   <td className="py-8 px-10">
                                      <div className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{new Date(log.created_at).toLocaleString()}</div>
                                      <div className="text-[8px] text-slate-400 font-bold mt-1 uppercase">ISO Standardized</div>
                                   </td>
                                   <td className="py-8 px-10">
                                      <div className="text-sm font-black text-slate-900 italic uppercase tracking-tight group-hover:text-amber-600 transition-colors">{log.user_id}</div>
                                      <div className="text-[8px] text-slate-400 font-bold mt-1 uppercase">Entity ID Verified</div>
                                   </td>
                                   <td className="py-8 px-10">
                                      <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest italic border ${
                                         log.action_type === 'payout' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                      }`}>
                                         {log.action_type}
                                      </span>
                                   </td>
                                   <td className="py-8 px-10 text-right">
                                      <div className="text-xl font-black text-slate-900 italic tracking-tighter">₹{parseFloat(log.amount || 0).toLocaleString()}</div>
                                      <div className="text-[8px] text-slate-400 font-bold mt-1 uppercase">Institutional Settlement</div>
                                   </td>
                                </tr>
                             ))}
                             {activityLogs.filter(log => log.action_type === 'payout' || log.action_type === 'commission').length === 0 && (
                                <tr>
                                   <td colSpan="4" className="py-32 text-center">
                                      <Activity size={60} className="mx-auto text-slate-100 mb-8" />
                                      <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs italic">No fiscal activity nodes detected</p>
                                   </td>
                                </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
           </motion.div>
        )}

        {activeTab === 'settings' && (
           <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-6xl mx-auto space-y-12 pb-20">
              {/* Settings Header & Sub-nav */}
              <div className="bg-white border border-slate-200 p-8 md:p-12 rounded-[3.5rem] shadow-sm">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center text-amber-500 shadow-xl border border-white/5"><Settings size={32}/></div>
                       <div>
                          <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">System Calibration</h3>
                          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] mt-1 italic">Authorized modification of platform operational parameters</p>
                       </div>
                    </div>
                 </div>

                 {/* Sub-navigation Matrix */}
                 <div className="flex flex-wrap gap-4 p-2 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                    {[
                       { id: 'profile', label: 'Admin Profile', icon: UserCircle },
                       { id: 'company', label: 'Company Node', icon: Globe },
                       { id: 'security', label: 'Security Protocols', icon: ShieldCheck },
                       { id: 'protocol', label: 'Finance Parameters', icon: Zap },
                       { id: 'payment', label: 'Payment Gateway', icon: CreditCard }
                    ].map((tab) => (
                       <button 
                         key={tab.id}
                         onClick={() => setSettingsSubTab(tab.id)}
                         className={`flex items-center gap-3 px-8 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all italic ${settingsSubTab === tab.id ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-slate-900 hover:bg-white'}`}
                       >
                          <tab.icon size={16} /> {tab.label}
                       </button>
                    ))}
                 </div>
              </div>

              {/* Sub-tab Content */}
              <AnimatePresence mode="wait">
                 <motion.div 
                   key={settingsSubTab}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   className="bg-white border border-slate-200 p-8 md:p-16 rounded-[4rem] shadow-sm"
                 >
                    {settingsSubTab === 'profile' && (
                       <div className="space-y-12">
                          <div className="flex flex-col md:flex-row items-center gap-12 p-10 bg-slate-900 rounded-[3rem] text-white relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000"><UserCircle size={200} /></div>
                             <div className="w-40 h-40 bg-white rounded-[3rem] flex items-center justify-center text-slate-900 font-black text-6xl italic border-8 border-white/10 shadow-2xl relative z-10">{adminData.name[0]}</div>
                             <div className="text-center md:text-left relative z-10">
                                <h4 className="text-4xl font-black uppercase italic tracking-tighter mb-2">{adminData.name}</h4>
                                <p className="text-amber-500 text-[11px] font-black uppercase tracking-[0.5em] mb-6 italic">{adminData.role} Node</p>
                                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                   <span className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest italic">{adminData.email}</span>
                                   <span className="px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest italic text-emerald-400">Authenticated Session</span>
                                </div>
                             </div>
                          </div>

                          <form onSubmit={handleUpdateAdminProfile} className="space-y-10">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Administrator Name</label>
                                   <input type="text" required value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-8 text-sm font-black uppercase italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner" />
                                </div>
                                <div className="space-y-3">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Node Email Address</label>
                                   <input type="email" required value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-8 text-sm font-black italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner" />
                                </div>
                                <div className="space-y-3">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Update Security Key (Leave blank to maintain current)</label>
                                   <input type="password" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-8 text-sm font-black italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner" placeholder="••••••••" />
                                </div>
                             </div>
                             <div className="flex justify-end">
                                <button type="submit" disabled={processing} className="w-full md:w-80 bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 hover:bg-amber-600 transition shadow-2xl active:scale-95">
                                   {processing ? <Loader2 className="animate-spin" /> : <><Save size={20}/> Synchronize Profile</>}
                                </button>
                             </div>
                          </form>
                       </div>
                    )}

                    {settingsSubTab === 'company' && (
                       <form onSubmit={handleUpdateSettings} className="space-y-12">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                             <div className="space-y-3 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Institutional Nomenclature (Company Name)</label>
                                <input type="text" required value={platformSettings.company_name} onChange={e => setPlatformSettings({...platformSettings, company_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] py-6 px-10 text-2xl font-black text-slate-900 uppercase italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner" />
                             </div>
                             <div className="space-y-3 md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Headquarters Location Address</label>
                                <textarea required value={platformSettings.company_address} onChange={e => setPlatformSettings({...platformSettings, company_address: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-[2.5rem] p-10 h-32 text-sm font-bold outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner leading-relaxed" />
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Support Dispatch Hotline</label>
                                <div className="relative group">
                                   <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-600 transition-colors"><Phone size={20} /></div>
                                   <input type="text" value={platformSettings.support_phone} onChange={e => setPlatformSettings({...platformSettings, support_phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 pl-16 pr-8 text-sm font-black italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner" />
                                </div>
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Institutional Support Email</label>
                                <div className="relative group">
                                   <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-600 transition-colors"><Mail size={20} /></div>
                                   <input type="email" value={platformSettings.support_email} onChange={e => setPlatformSettings({...platformSettings, support_email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 pl-16 pr-8 text-sm font-black italic outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner" />
                                </div>
                             </div>
                          </div>
                          <div className="flex justify-end">
                             <button disabled={processing} className="w-full md:w-80 bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 hover:bg-amber-600 transition shadow-2xl active:scale-95">
                                {processing ? <Loader2 className="animate-spin" /> : <><Globe size={20}/> Synchronize Node Info</>}
                             </button>
                          </div>
                       </form>
                    )}

                    {settingsSubTab === 'security' && (
                       <div className="space-y-12">
                          <div className="bg-rose-50 border border-rose-100 p-10 rounded-[3rem] relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000"><ShieldAlert size={150} className="text-rose-600" /></div>
                             <h4 className="text-xl font-black text-rose-600 uppercase tracking-tighter italic mb-4 flex items-center gap-3">
                                <ShieldAlert size={24} /> Platform State Override
                             </h4>
                             <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-10 italic max-w-2xl leading-relaxed">Emergency protocol to restrict node access globally. Use only during maintenance or security breach mitigation.</p>
                             
                             <div className="flex flex-col sm:flex-row gap-6 relative z-10">
                                <button 
                                  type="button"
                                  onClick={() => {
                                    if(window.confirm("CRITICAL: Are you sure you want to take the ENTIRE protocol OFFLINE?")) {
                                       setPlatformSettings({...platformSettings, maintenance_mode: '1'});
                                       handleUpdateSettings();
                                    }
                                  }}
                                  className={`flex-1 py-6 rounded-3xl font-black uppercase text-xs tracking-[0.3em] transition-all border shadow-lg italic ${platformSettings.maintenance_mode === '1' ? 'bg-rose-600 text-white border-rose-700 shadow-rose-200 scale-105' : 'bg-white text-rose-600 border-rose-100 hover:bg-rose-100'}`}
                                >
                                   PROTOCOL OFFLINE
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setPlatformSettings({...platformSettings, maintenance_mode: '0'});
                                    handleUpdateSettings();
                                  }}
                                  className={`flex-1 py-6 rounded-3xl font-black uppercase text-xs tracking-[0.3em] transition-all border shadow-lg italic ${platformSettings.maintenance_mode === '0' ? 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-200 scale-105' : 'bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-100'}`}
                                >
                                   SYSTEM OPERATIONAL
                                </button>
                             </div>
                          </div>

                          <div className="bg-amber-50 border border-amber-100 p-10 rounded-[3rem] relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000"><ShieldCheck size={150} className="text-amber-600" /></div>
                             <h4 className="text-xl font-black text-amber-600 uppercase tracking-tighter italic mb-4 flex items-center gap-3">
                                <ShieldCheck size={24} /> Network Security Status
                             </h4>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                <div className="p-6 bg-white rounded-2xl border border-amber-100 shadow-sm">
                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic mb-2">Encryption</p>
                                   <p className="text-sm font-black text-slate-900 uppercase italic">AES-256 ACTIVE</p>
                                </div>
                                <div className="p-6 bg-white rounded-2xl border border-amber-100 shadow-sm">
                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic mb-2">Access Logs</p>
                                   <p className="text-sm font-black text-slate-900 uppercase italic">MONITORED</p>
                                </div>
                                <div className="p-6 bg-white rounded-2xl border border-amber-100 shadow-sm">
                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic mb-2">Node Isolation</p>
                                   <p className="text-sm font-black text-slate-900 uppercase italic">ENABLED</p>
                                </div>
                             </div>
                          </div>
                       </div>
                    )}

                    {settingsSubTab === 'protocol' && (
                       <form onSubmit={handleUpdateSettings} className="space-y-12">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                             {[
                                { label: 'L1 Commission (%)', name: 'referral_commission_l1', icon: Users, type: 'number', step: '0.01' },
                                { label: 'L2 Commission (%)', name: 'referral_commission_l2', icon: Users, type: 'number', step: '0.01' },
                                { label: 'L3 Commission (%)', name: 'referral_commission_l3', icon: Users, type: 'number', step: '0.01' },
                                { label: 'L4 Commission (%)', name: 'referral_commission_l4', icon: Users, type: 'number', step: '0.01' },
                                { label: 'L5 Commission (%)', name: 'referral_commission_l5', icon: Users, type: 'number', step: '0.01' },
                                { label: 'Daily Cashback Rate (%)', name: 'daily_cashback_rate', icon: Percent, type: 'number', step: '0.01' },
                                { label: 'Minimum Investment (₹)', name: 'min_investment', icon: Award, type: 'number', step: '1' },
                                { label: 'Minimum Withdrawal (₹)', name: 'min_withdrawal', icon: Wallet, type: 'number', step: '1' },
                                { label: 'Gold Base Price (₹/g)', name: 'gold_base_price', icon: TrendingUp, type: 'number', step: '1' },
                                { label: 'Silver Base Price (₹/g)', name: 'silver_base_price', icon: Coins, type: 'number', step: '1' },
                                { label: 'GST Percentage (%)', name: 'gst_percentage', icon: Globe, type: 'number', step: '0.1' },
                                { label: 'Processing Fee (₹)', name: 'payout_processing_fee', icon: CreditCard, type: 'number', step: '1' }
                             ].map((field, i) => (
                                <div key={i} className="space-y-3">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">{field.label}</label>
                                   <div className="relative group">
                                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-amber-600 transition-colors"><field.icon size={20} /></div>
                                      <input 
                                        type={field.type} 
                                        step={field.step}
                                        value={platformSettings[field.name]}
                                        onChange={(e) => setPlatformSettings({...platformSettings, [field.name]: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 pl-16 pr-8 text-lg font-black text-slate-900 outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner tracking-tight italic"
                                      />
                                   </div>
                                </div>
                             ))}
                          </div>

                          <div className="pt-8 border-t border-slate-100 flex justify-end">
                             <button disabled={processing} className="w-full md:w-80 bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 hover:bg-amber-600 transition shadow-2xl active:scale-95">
                                {processing ? <Loader2 className="animate-spin" /> : <><ShieldAlert size={20}/> Synchronize Protocol</>}
                             </button>
                          </div>
                       </form>
                    )}

                    {settingsSubTab === 'payment' && (
                       <div className="space-y-12">
                          <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000"><CreditCard size={150} /></div>
                             <div className="relative z-10">
                                <h4 className="text-2xl font-black uppercase italic tracking-tighter mb-4">Payment Node Configuration</h4>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-10 italic">Management of institutional payment channels and QR synchronization</p>
                                
                                <form onSubmit={handleUpdateSettings} className="space-y-10">
                                   <div className="space-y-4">
                                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Institutional UPI Identifier</label>
                                      <div className="relative">
                                         <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600"><Zap size={20} /></div>
                                         <input 
                                           type="text" 
                                           placeholder="e.g., business@upi"
                                           value={platformSettings.upi_id || ''}
                                           onChange={e => setPlatformSettings({...platformSettings, upi_id: e.target.value})}
                                           className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-16 pr-8 text-lg font-black text-amber-500 outline-none focus:border-amber-500 transition-all italic"
                                         />
                                      </div>
                                   </div>

                                   <div className="border-t border-white/10 pt-10">
                                      <h5 className="text-sm font-black uppercase italic text-slate-400 mb-6">Institutional Bank Details</h5>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                         <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Bank Name</label>
                                            <input 
                                              type="text" 
                                              placeholder="e.g., State Bank of India"
                                              value={platformSettings.bank_name || ''}
                                              onChange={e => setPlatformSettings({...platformSettings, bank_name: e.target.value})}
                                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-sm font-bold text-slate-200 outline-none focus:border-amber-500 transition-all"
                                            />
                                         </div>
                                         <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Account Holder Name</label>
                                            <input 
                                              type="text" 
                                              placeholder="e.g., Vamanan Enterprises"
                                              value={platformSettings.bank_account_name || ''}
                                              onChange={e => setPlatformSettings({...platformSettings, bank_account_name: e.target.value})}
                                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-sm font-bold text-slate-200 outline-none focus:border-amber-500 transition-all"
                                            />
                                         </div>
                                         <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Account Number</label>
                                            <input 
                                              type="text" 
                                              placeholder="e.g., 123456789012"
                                              value={platformSettings.bank_account_no || ''}
                                              onChange={e => setPlatformSettings({...platformSettings, bank_account_no: e.target.value})}
                                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-sm font-bold text-slate-200 outline-none focus:border-amber-500 transition-all"
                                            />
                                         </div>
                                         <div className="space-y-4">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">IFSC Code</label>
                                            <input 
                                              type="text" 
                                              placeholder="e.g., SBIN0001234"
                                              value={platformSettings.bank_ifsc || ''}
                                              onChange={e => setPlatformSettings({...platformSettings, bank_ifsc: e.target.value})}
                                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-sm font-bold text-slate-200 outline-none focus:border-amber-500 transition-all"
                                            />
                                         </div>
                                         <div className="space-y-4 md:col-span-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Branch Name</label>
                                            <input 
                                              type="text" 
                                              placeholder="e.g., Main Branch, Chennai"
                                              value={platformSettings.bank_branch || ''}
                                              onChange={e => setPlatformSettings({...platformSettings, bank_branch: e.target.value})}
                                              className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-sm font-bold text-slate-200 outline-none focus:border-amber-500 transition-all"
                                            />
                                         </div>
                                      </div>
                                   </div>

                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                      <div className="space-y-4">
                                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic ml-1">Static QR Node (Optional)</label>
                                         <div className="relative">
                                            <input 
                                              type="file" 
                                              id="qr-upload"
                                              className="hidden"
                                              onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                  // Logic for uploading custom QR could go here
                                                  // For now we use dynamic QR, but this field allows future static override
                                                  alert("QR Image selected. System will prioritize dynamic generation unless static override is enabled.");
                                                }
                                              }}
                                            />
                                            <label htmlFor="qr-upload" className="flex items-center justify-between bg-white/5 border border-white/10 border-dashed rounded-2xl p-6 cursor-pointer hover:bg-white/10 transition-all">
                                               <span className="text-xs font-bold text-slate-400">Upload Static QR Code</span>
                                               <Plus size={20} className="text-amber-500" />
                                            </label>
                                         </div>
                                      </div>

                                      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center justify-center">
                                         <div className="text-center">
                                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-4">Current Dynamic Preview</p>
                                            <div className="bg-white p-3 rounded-2xl inline-block shadow-2xl">
                                               <img 
                                                 src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${platformSettings.upi_id || 'anantha130404-1@oksbi'}%26pn=${encodeURIComponent(platformSettings.company_name || 'Vamanan')}%26cu=INR`}
                                                 alt="QR Preview"
                                                 className="w-24 h-24"
                                               />
                                            </div>
                                         </div>
                                      </div>
                                   </div>

                                   <div className="pt-6">
                                      <button type="submit" disabled={processing} className="w-full bg-amber-500 text-slate-900 py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 hover:bg-white transition shadow-2xl active:scale-95">
                                         {processing ? <Loader2 className="animate-spin" /> : <><Save size={20}/> Deploy Payment Node</>}
                                      </button>
                                   </div>
                                </form>
                             </div>
                          </div>
                       </div>
                    )}
                 </motion.div>
              </AnimatePresence>
           </motion.div>
        )}
      </main>

      {/* Admin Profile Modal */}
      <AnimatePresence>
        {showAdminModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowAdminModal(false)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="relative w-full max-w-2xl bg-white rounded-[4rem] p-10 md:p-16 shadow-2xl overflow-hidden border border-slate-100"
             >
                <div className="absolute top-0 right-0 p-12 opacity-5"><ShieldCheck size={250} /></div>
                
                <div className="flex justify-between items-start mb-12 relative z-10">
                   <div>
                      <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Institutional Profile</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Superuser Credential Management</p>
                   </div>
                   <button onClick={() => setShowAdminModal(false)} className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-3xl transition-colors border border-slate-100 active:scale-95"><XCircle size={24} /></button>
                </div>

                <div className="space-y-10 relative z-10">
                   <div className="flex flex-col md:flex-row items-center gap-10 p-10 bg-slate-50 border border-slate-100 rounded-[3rem] shadow-inner">
                      <div className="w-32 h-32 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-amber-500 font-black text-5xl italic border-4 border-white shadow-2xl">{adminData.name[0]}</div>
                      <div className="text-center md:text-left">
                         <h4 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">{adminData.name}</h4>
                         <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.4em] mt-2 italic">{adminData.role}</p>
                         <div className="flex items-center justify-center md:justify-start gap-2 mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                            <CreditCard size={14} /> {adminData.email}
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 gap-6">
                      <button 
                        onClick={() => {
                          setEditAdminMode(true);
                          setAdminForm({ name: adminData.name, email: adminData.email, password: '' });
                        }}
                        className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.25em] text-xs flex items-center justify-center gap-4 hover:bg-amber-600 transition shadow-xl active:scale-95"
                      >
                         <Settings size={20} /> CALIBRATE CREDENTIALS
                      </button>
                      <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="w-full bg-rose-50 text-rose-600 py-6 rounded-[2rem] font-black uppercase tracking-[0.25em] text-xs flex items-center justify-center gap-4 hover:bg-rose-500 hover:text-white transition shadow-sm border border-rose-100 active:scale-95">
                         <LogOut size={20} /> TERMINATE COMMAND SESSION
                      </button>
                   </div>
                </div>

                {/* Edit Overlay */}
                <AnimatePresence>
                   {editAdminMode && (
                      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="absolute inset-0 bg-white p-10 md:p-16 z-50 overflow-y-auto">
                         <div className="flex items-center gap-6 mb-12">
                            <button onClick={() => setEditAdminMode(false)} className="p-4 bg-slate-50 text-slate-900 rounded-3xl border border-slate-100 active:scale-95"><ArrowLeft size={24}/></button>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Calibrate Identity</h3>
                         </div>

                         <form onSubmit={handleUpdateAdminProfile} className="space-y-10">
                            <div className="space-y-3">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Superuser Name</label>
                               <input type="text" required value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-8 text-xl font-black text-slate-900 outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner uppercase italic" />
                            </div>
                            <div className="space-y-3">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Institutional Email</label>
                               <input type="email" required value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-8 text-xl font-black text-slate-900 outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner italic" />
                            </div>
                            <div className="space-y-3">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Security Override Key</label>
                               <div className="relative group">
                                  <input 
                                    type={showStaffPassword ? "text" : "password"} 
                                    placeholder="••••••••"
                                    value={adminForm.password}
                                    onChange={e => setAdminForm({...adminForm, password: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 px-8 text-xl font-black text-slate-900 outline-none focus:border-amber-600 focus:bg-white transition-all shadow-inner tracking-widest"
                                  />
                                  <button type="button" onClick={() => setShowStaffPassword(!showStaffPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600 transition-colors p-2">{showStaffPassword ? <EyeOff size={24} /> : <Eye size={24}/>}</button>
                               </div>
                               <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-2 ml-4 italic">Leave blank to maintain current encryption</p>
                            </div>

                            <button disabled={processing} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-4 hover:bg-emerald-600 transition shadow-2xl active:scale-[0.98]">
                               {processing ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={20}/> Synchronize Identity</>}
                            </button>
                         </form>
                      </motion.div>
                   )}
                </AnimatePresence>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Management Modal */}
      <AnimatePresence>
        {showUserModal && selectedUser && (
           <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowUserModal(false)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="relative w-full max-w-2xl bg-white rounded-[4rem] p-10 md:p-14 shadow-2xl overflow-hidden border border-slate-100"
             >
                <div className="flex justify-between items-start mb-10 relative z-10">
                   <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Investor Calibration</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Protocol adjustments for User #{selectedUser.id}</p>
                   </div>
                   <button onClick={() => setShowUserModal(false)} className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-3xl transition-colors border border-slate-100 active:scale-95"><XCircle size={24} /></button>
                </div>

                <div className="space-y-10 relative z-10">
                   <div className="flex items-center gap-8 p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] shadow-inner">
                      <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center text-amber-500 font-black text-3xl italic border-2 border-white shadow-lg">{selectedUser.name[0]}</div>
                      <div>
                         <h4 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">{selectedUser.name}</h4>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">{selectedUser.email}</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Account Authorization</label>
                         <div className="flex gap-4">
                            <button 
                              onClick={() => handleUpdateUser({ id: selectedUser.id, status: 'active' })}
                              className={`flex-1 py-4 rounded-2xl font-black uppercase text-[9px] tracking-[0.2em] transition-all border shadow-sm ${selectedUser.status === 'active' ? 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                            >
                               Grant Access
                            </button>
                            <button 
                              onClick={() => handleUpdateUser({ id: selectedUser.id, status: 'suspended' })}
                              className={`flex-1 py-4 rounded-2xl font-black uppercase text-[9px] tracking-[0.2em] transition-all border shadow-sm ${selectedUser.status === 'suspended' ? 'bg-rose-500 text-white border-rose-600 shadow-rose-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                            >
                               Suspend ID
                            </button>
                         </div>
                      </div>

                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Security Override</label>
                         <button 
                           onClick={() => {
                              const newPassword = window.prompt(`NODE OVERRIDE: Enter new password for ${selectedUser.name}`);
                              if (newPassword) {
                                 handleUpdateUser({ id: selectedUser.id, password: newPassword });
                              }
                           }}
                           className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[9px] flex items-center justify-center gap-3 hover:bg-amber-600 transition shadow-lg active:scale-95"
                         >
                            <XCircle size={16}/> RESET CREDENTIALS
                         </button>
                      </div>
                   </div>

                   <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row gap-4">
                      <button 
                        onClick={() => {
                           alert(`INVESTOR DOSSIER: ${selectedUser.name}\n\nEmail: ${selectedUser.email}\nRole: ${selectedUser.role}\nStatus: ${selectedUser.status}\nJoined: ${new Date(selectedUser.created_at).toLocaleDateString()}\nWallet Balance: ₹${parseFloat(selectedUser.balance || 0).toLocaleString()}`);
                        }}
                        className="flex-1 bg-slate-50 text-slate-900 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-900 hover:text-white transition shadow-sm border border-slate-200 active:scale-95"
                      >
                         View Profile Details
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(selectedUser.id)}
                        className="flex-1 bg-rose-50 text-rose-600 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-rose-600 hover:text-white transition shadow-sm border border-rose-100 active:scale-95"
                      >
                         Delete Profile
                      </button>
                   </div>
                </div>
             </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* Premium Toast Notification System */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 20, scale: 0.9, x: '-50%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-4 bg-slate-900/90 text-white px-8 py-5 rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 backdrop-blur-md min-w-[320px] max-w-[90%]"
          >
            <div className={`p-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : toast.type === 'error' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {toast.type === 'success' ? <CheckCircle size={20} /> : toast.type === 'error' ? <XCircle size={20} /> : <AlertTriangle size={20} />}
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{toast.type === 'success' ? 'Protocol Success' : toast.type === 'error' ? 'Protocol Breach' : 'Protocol Alert'}</p>
              <p className="text-xs font-bold mt-1 tracking-tight text-white">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
