import React, { useState, useEffect } from 'react';
import { 
   User, Mail, Phone, MapPin, ShieldCheck, Wallet, 
   Award, Camera, Edit3, Save, ArrowLeft, Loader2,
   CheckCircle2, AlertCircle, Menu, Bell, LogOut, XCircle,
   CreditCard, Calendar, Hash, ChevronRight, TrendingUp,
   Search, ShoppingCart, ChevronDown, Star, LayoutGrid, Eye, EyeOff, Shield, X, Fingerprint, Landmark
 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import CustomerHeader from '../components/CustomerHeader';
import API_BASE_URL from '../config';
import { humanKycStatus } from '../utils/humanLabels';

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    bank_name: '',
    account_no: '',
    ifsc_code: ''
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ new: '', confirm: '' });
  const navigate = useNavigate();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : {};

  useEffect(() => {
    if (!user.id) {
      navigate('/login');
      return;
    }
    fetchProfileData();
  }, []);

  useEffect(() => {
    if (profileData?.user) {
      setFormData({
        name: profileData.user.name || '',
        email: profileData.user.email || '',
        phone: profileData.user.phone || '',
        address: profileData.user.address || '',
        bank_name: profileData.user.bank_name || '',
        account_no: profileData.user.account_no || '',
        ifsc_code: profileData.user.ifsc_code || ''
      });
    }
  }, [profileData]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fetchProfileData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/customer/profile.php?user_id=${user.id}`);
      if (response.data.status === 'success') {
        setProfileData(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus({ type: '', message: '' });
    try {
      const response = await axios.post(`${API_BASE_URL}/customer/update_profile.php`, {
        user_id: user.id,
        ...formData
      });

      if (response.data.status === 'success') {
        setStatus({ type: 'success', message: 'Profile updated successfully!' });
        setEditing(false);
        // Update local storage so changes reflect immediately across the UI
        const updatedUser = { ...user, ...formData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        fetchProfileData();
      } else {
        setStatus({ type: 'error', message: response.data.message });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const photoFormData = new FormData();
    photoFormData.append('user_id', user.id);
    photoFormData.append('avatar', file);

    try {
      const response = await axios.post(`${API_BASE_URL}/customer/upload_avatar.php`, photoFormData);
      if (response.data.status === 'success') {
        setStatus({ type: 'success', message: 'Photo updated successfully!' });
        fetchProfileData();
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Photo upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      setStatus({ type: 'error', message: 'New passwords do not match!' });
      return;
    }
    
    setSaving(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/customer/change_password.php`, {
        user_id: user.id,
        new_password: passwordForm.new
      });

      if (response.data.status === 'success') {
        setStatus({ type: 'success', message: response.data.message });
        setShowPasswordModal(false);
        setPasswordForm({ new: '', confirm: '' });
      } else {
        setStatus({ type: 'error', message: response.data.message });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to update credential key.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center text-amber-600">
      <div className="flex flex-col items-center gap-6">
        <Loader2 className="animate-spin" size={60} strokeWidth={3} />
        <p className="text-[10px] font-black animate-pulse uppercase tracking-[0.4em] italic">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-inter overflow-x-hidden text-slate-900 selection:bg-amber-100 selection:text-amber-900">
      <Sidebar 
        showMobileMenu={showMobileMenu} 
        setShowMobileMenu={setShowMobileMenu} 
      />

      <div className="ml-0 lg:ml-72 min-h-screen relative w-full">
         <CustomerHeader setShowMobileMenu={setShowMobileMenu} activeTab="My Profile" />

        <main className="p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 w-full max-w-[1500px] space-y-8 md:space-y-12 pb-32 lg:pb-16">
          
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
          >
             <div>
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                   <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                   <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">My Account</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">My Profile</h1>
                <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2 md:mt-3 italic">Manage your account details and password</p>
             </div>
          </motion.div>

          {/* Hero Section */}
          <div className="relative mb-32 sm:mb-20">
            <div className="h-48 md:h-96 bg-slate-900 rounded-[2rem] md:rounded-[4rem] overflow-hidden relative shadow-2xl border border-white/5">
               <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 right-0 w-64 md:w-[600px] h-64 md:h-[600px] bg-amber-500 blur-[100px] md:blur-[180px] -translate-y-1/2 translate-x-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-40 md:w-96 h-40 md:h-96 bg-blue-500 blur-[80px] md:blur-[150px] translate-y-1/2 -translate-x-1/2"></div>
               </div>
               <div className="absolute bottom-0 right-0 p-10 md:p-20 opacity-5">
                  <Shield size={loading ? 100 : 250} className="text-white" />
               </div>
            </div>

            {/* Avatar and Name */}
            <div className="absolute -bottom-24 sm:-bottom-20 left-0 sm:left-12 right-0 sm:right-auto flex flex-col sm:flex-row items-center sm:items-end gap-6 md:gap-10 px-4 sm:px-0">
               <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 transition={{ delay: 0.1 }}
                 className="relative group"
               >
                  <div className="w-40 h-40 md:w-64 md:h-64 bg-white p-3 md:p-5 rounded-[3rem] md:rounded-[5rem] shadow-[0_25px_60px_rgba(0,0,0,0.15)] border-4 border-white relative z-20">
                     <div className="w-full h-full bg-slate-100 rounded-[1.8rem] md:rounded-[3.5rem] flex items-center justify-center text-slate-400 overflow-hidden relative group border border-slate-200">
                        {profileData?.user?.avatar ? (
                           <img src={`${API_BASE_URL}/../${profileData.user.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center">
                               <span className="text-5xl md:text-8xl font-black text-slate-300 italic leading-none">{(profileData?.user?.name || 'U')[0]}</span>
                               <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2 italic">No Photo</p>
                            </div>
                        )}
                        <label className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 text-white cursor-pointer backdrop-blur-md">
                           {uploading ? <Loader2 className="animate-spin" size={24} /> : <Camera size={32} />}
                           <p className="text-[9px] font-black uppercase mt-3 tracking-widest text-center px-4 text-amber-500 italic">Change Photo</p>
                           <input type="file" className="hidden" onChange={handlePhotoUpload} accept="image/*" />
                        </label>
                     </div>
                  </div>
               </motion.div>
               <div className="mb-4 sm:mb-10 text-center sm:text-left flex flex-col items-center sm:items-start">
                  <motion.h2 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl md:text-6xl font-black text-slate-900 tracking-tighter flex items-center justify-center sm:justify-start gap-3 md:gap-6 italic uppercase leading-none"
                  >
                    {profileData?.user?.name || 'Investor'}
                    {profileData?.user?.kyc_status === 'verified' && <div className="bg-emerald-500 p-1.5 md:p-3 rounded-full text-white shadow-xl shadow-emerald-500/20"><ShieldCheck size={18} md:size={32} strokeWidth={2.5} /></div>}
                  </motion.h2>
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-wrap items-center justify-center sm:justify-start gap-3 md:gap-4 mt-4 md:mt-6"
                  >
                    <span className="px-4 py-1.5 bg-slate-900 text-amber-500 text-[9px] md:text-[10px] font-black rounded-xl md:rounded-2xl uppercase tracking-[0.2em] shadow-lg italic">User ID: #{user.id}</span>
                    <span className={`px-4 py-1.5 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm italic ${profileData?.user?.kyc_status === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                      {humanKycStatus(profileData?.user?.kyc_status || 'pending')}
                    </span>
                  </motion.div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 mt-32 md:mt-40">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8 md:space-y-12">
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="bg-white border border-slate-200/60 p-6 sm:p-10 md:p-16 rounded-[2.5rem] md:rounded-[4rem] shadow-sm relative overflow-hidden"
               >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 mb-10 md:mb-20 relative z-10">
                     <h3 className="text-[9px] md:text-xs font-black text-slate-900 uppercase tracking-[0.4em] flex items-center gap-4 md:gap-6 italic">
                        <div className="w-10 h-10 md:w-16 md:h-16 bg-slate-900 text-amber-500 rounded-xl md:rounded-3xl flex items-center justify-center shadow-xl"><Edit3 size={20} md:size={32} /></div>
                        Profile Attributes
                     </h3>
                     <div className="flex w-full sm:w-auto gap-3 md:gap-6">
                        {editing && (
                           <button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none px-6 md:px-10 py-4 md:py-5 bg-slate-900 text-white rounded-2xl md:rounded-[1.5rem] text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] hover:bg-amber-600 transition-all flex items-center justify-center gap-3 md:gap-4 shadow-2xl active:scale-95 italic">
                              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                              Save
                           </button>
                        )}
                        <button onClick={() => setEditing(!editing)} className={`flex-1 sm:flex-none px-6 md:px-10 py-4 md:py-5 rounded-2xl md:rounded-[1.5rem] text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] border transition-all active:scale-95 italic ${editing ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-slate-50 text-slate-900 border-slate-200'}`}>
                           {editing ? 'Cancel' : 'Edit'}
                        </button>
                     </div>
                  </div>

                  <AnimatePresence>
                     {status.message && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`mb-8 md:mb-12 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] flex items-center gap-4 md:gap-6 text-[10px] md:text-[11px] font-black uppercase tracking-widest shadow-xl italic ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                           {status.type === 'success' ? <CheckCircle2 size={20} strokeWidth={2.5} /> : <AlertCircle size={20} strokeWidth={2.5} />}
                           {status.message}
                        </motion.div>
                     )}
                  </AnimatePresence>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-16 relative z-10">
                     {[
                       { label: 'Full Name', name: 'name', icon: User, value: profileData?.user?.name },
                       { label: 'Email', name: 'email', icon: Mail, value: profileData?.user?.email },
                       { label: 'Phone Number', name: 'phone', icon: Phone, value: profileData?.user?.phone },
                       { label: 'Address', name: 'address', icon: MapPin, value: profileData?.user?.address },
                       { label: 'Bank Name', name: 'bank_name', icon: Landmark, value: profileData?.user?.bank_name },
                       { label: 'Account Number', name: 'account_no', icon: Hash, value: profileData?.user?.account_no },
                       { label: 'IFSC Code', name: 'ifsc_code', icon: ShieldCheck, value: profileData?.user?.ifsc_code },
                     ].map((field, i) => (
                        <div key={i} className="space-y-3">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4 md:ml-8 italic">{field.label}</p>
                           <div className={`flex items-center gap-4 md:gap-6 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border transition-all duration-500 ${editing ? 'bg-white border-amber-500 shadow-xl' : 'bg-slate-50 border-slate-100 shadow-inner'}`}>
                              <field.icon size={20} className={editing ? 'text-amber-600' : 'text-slate-400'} />
                              {editing ? (
                                 <input name={field.name} value={formData[field.name]} onChange={handleInputChange} className="bg-transparent w-full outline-none text-sm md:text-base font-black text-slate-900 placeholder:text-slate-300 italic" />
                              ) : (
                                 <p className="text-sm md:text-base font-black text-slate-900 tracking-tight truncate uppercase italic">{field.value || 'Not added'}</p>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               </motion.div>

                {/* Verification & Banking */}
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.1 }}
                 className="bg-white border border-slate-200/60 p-6 sm:p-10 md:p-16 rounded-[2.5rem] md:rounded-[4rem] shadow-sm"
               >
                  <h3 className="text-[9px] md:text-xs font-black text-slate-900 uppercase tracking-[0.4em] flex items-center gap-4 md:gap-6 mb-10 md:mb-20 italic">
                     <div className="w-10 h-10 md:w-16 md:h-16 bg-slate-50 text-blue-600 rounded-xl md:rounded-3xl flex items-center justify-center border border-slate-100 shadow-sm"><ShieldCheck size={20} md:size={32} /></div>
                     Verification & Bank
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-14">
                     <div className="p-8 md:p-14 bg-slate-50 border border-slate-100 rounded-[2rem] md:rounded-[4rem] relative group overflow-hidden shadow-inner">
                        <p className="text-[9px] font-black text-amber-600 uppercase tracking-[0.3em] mb-4 md:mb-6 italic">KYC Status</p>
                        <div className="flex items-center gap-4 mb-6 md:mb-10">
                           <span className={`px-6 md:px-8 py-2 md:py-3 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-widest shadow-xl italic ${profileData?.user?.kyc_status === 'verified' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                              {humanKycStatus(profileData?.user?.kyc_status || 'not_found')}
                           </span>
                        </div>
                        <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest truncate italic">Aadhaar: {profileData?.user?.aadhar_no ? 'On file' : 'Not added'}</p>
                     </div>
  
                     <div className="p-8 md:p-14 bg-slate-900 text-white rounded-[2rem] md:rounded-[4rem] relative group overflow-hidden shadow-2xl">
                        <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-1000"><Wallet size={100} /></div>
                        <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.3em] mb-4 md:mb-6 italic">Wallet Balance</p>
                        <h4 className="text-3xl md:text-6xl font-black uppercase tracking-tighter mb-6 md:mb-10 italic">₹{parseFloat(profileData?.wallet?.balance || 0).toLocaleString()}</h4>
                        <button onClick={() => navigate('/wallet')} className="flex items-center gap-3 md:gap-4 text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-white hover:text-amber-500 transition-colors italic group">
                           Manage <ChevronRight size={16} md:size={20} className="group-hover:translate-x-2 transition-transform" />
                        </button>
                     </div>
                  </div>

                  <div className="mt-8 md:mt-14 space-y-4 md:space-y-6">
                     {[
                       { label: 'Aadhaar Card', value: profileData?.user?.aadhar_no, color: 'bg-blue-50 text-blue-600', icon: Fingerprint },
                       { label: 'PAN Card', value: profileData?.user?.pan_no, color: 'bg-rose-50 text-rose-600', icon: CreditCard }
                     ].map((doc, i) => (
                        <div key={i} className="p-6 md:p-10 bg-slate-50 border border-slate-200 rounded-[1.8rem] md:rounded-[3rem] flex items-center justify-between group hover:border-amber-500 transition-all shadow-sm">
                           <div className="flex items-center gap-6 md:gap-10 min-w-0">
                              <div className={`w-12 h-12 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center shrink-0 border border-slate-200 bg-white shadow-xl ${doc.color}`}><doc.icon size={20} md:size={32} /></div>
                              <div className="min-w-0">
                                 <p className="text-sm md:text-xl font-black text-slate-900 uppercase tracking-tight truncate italic">{doc.label}</p>
                                 <p className="text-[9px] md:text-[12px] text-slate-400 font-black uppercase tracking-[0.25em] mt-1 md:mt-2 truncate italic">{doc.value ? 'Submitted' : 'Not added yet'}</p>
                              </div>
                           </div>
                           <ChevronRight size={20} md:size={28} className="text-slate-300 group-hover:text-amber-500 transition-colors shrink-0" />
                        </div>
                     ))}
                  </div>
               </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-8 md:space-y-12">
               <motion.div 
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="bg-white border border-slate-200/60 p-6 md:p-16 rounded-[2rem] md:rounded-[4rem] shadow-sm overflow-hidden"
               >
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.5em] mb-10 md:mb-16 italic border-l-4 border-amber-500 pl-4">My Summary</h3>
                  <div className="space-y-10 md:space-y-12">
                     {[
                       { label: 'Total Invested', value: `₹${parseFloat(profileData?.stats?.total_invested || 0).toLocaleString()}`, icon: TrendingUp, color: 'bg-amber-50 text-amber-600' },
                       { label: 'Active Plans', value: profileData?.stats?.active_cycles || 0, icon: ShieldCheck, color: 'bg-emerald-50 text-emerald-600' },
                       { label: 'Referrals', value: profileData?.stats?.referral_count || 0, icon: Award, color: 'bg-blue-50 text-blue-600' },
                     ].map((stat, i) => (
                        <div key={i} className="flex justify-between items-end border-b border-slate-100 pb-10 md:pb-12 last:border-0 last:pb-0">
                           <div className="min-w-0">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2 md:mb-3 truncate italic">{stat.label}</p>
                              <p className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter truncate italic">{stat.value}</p>
                           </div>
                           <div className={`p-4 md:p-5 rounded-2xl md:rounded-3xl shrink-0 border border-slate-100 bg-slate-50 shadow-sm ${stat.color}`}><stat.icon size={20} md:size={28} strokeWidth={2} /></div>
                        </div>
                     ))}
                  </div>
               </motion.div>

               <motion.div 
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 transition={{ delay: 0.1 }}
                 className="bg-slate-900 text-white p-8 md:p-16 rounded-[2rem] md:rounded-[4rem] shadow-2xl relative overflow-hidden group border border-white/5"
               >
                  <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                    <ShieldCheck size={100} className="text-white" />
                  </div>
                  <h3 className="text-xl md:text-4xl font-black mb-10 md:mb-16 uppercase tracking-tighter leading-none italic">Account <br/>Security</h3>
                  <div className="space-y-4 md:space-y-6 relative z-10">
                      <button 
                        onClick={() => setShowPasswordModal(true)}
                        className="w-full bg-white/5 hover:bg-amber-600 hover:text-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-between transition-all group border border-white/5 shadow-xl italic"
                      >
                        <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em]">Change Password</span>
                        <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
                      </button>
                     <button className="w-full bg-white/5 hover:bg-blue-600 hover:text-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-between transition-all group border border-white/5 shadow-xl italic">
                        <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em]">Two-Factor</span>
                        <div className="px-3 py-1 bg-amber-500 text-slate-900 text-[8px] font-black rounded-lg uppercase tracking-widest italic">ACTIVE</div>
                     </button>
                  </div>
                  <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="w-full mt-16 md:mt-24 bg-rose-600/10 text-rose-500 border border-rose-500/20 py-6 md:py-8 rounded-[2rem] md:rounded-[3rem] font-black text-[10px] md:text-[11px] uppercase tracking-[0.3em] hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-4 md:gap-6 shadow-2xl active:scale-95 italic">
                     <LogOut size={20} md:size={28} strokeWidth={2.5} /> Terminate
                  </button>
               </motion.div>
            </div>
          </div>
        </main>
      </div>

      {/* Credential Key Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              className="relative w-full max-w-xl bg-white border border-slate-200 rounded-[2rem] md:rounded-[4rem] p-8 md:p-20 shadow-[0_0_100px_rgba(0,0,0,0.3)] overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-12 opacity-5">
                <Hash size={100} className="text-slate-900" />
              </div>
              
              <div className="flex justify-between items-start mb-10 md:mb-16 relative z-10">
                <div>
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter mb-2 md:mb-3 italic uppercase">Change Password</h3>
                  <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Update your login password</p>
                </div>
                <button 
                  onClick={() => setShowPasswordModal(false)}
                  className="p-3 md:p-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl md:rounded-[1.5rem] transition-colors border border-slate-200 active:scale-95 shadow-sm"
                >
                  <X size={20} md:size={32} />
                </button>
              </div>

              <div className="space-y-6 md:space-y-10 relative z-10">
                <div className="space-y-3 md:space-y-4">
                  <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4 md:ml-6 italic">New Password</p>
                  <div className="relative group">
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 p-6 md:p-8 pr-16 md:pr-20 rounded-[1.5rem] md:rounded-[2.5rem] text-slate-900 outline-none focus:border-amber-600 focus:bg-white transition-all font-black tracking-widest shadow-inner italic text-sm"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600 transition-colors p-2"
                    >
                      {showPassword ? <EyeOff size={20} md:size={28} /> : <Eye size={20} md:size={28} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-3 md:space-y-4">
                  <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-4 md:ml-6 italic">Confirm Password</p>
                  <div className="relative group">
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 p-6 md:p-8 pr-16 md:pr-20 rounded-[1.5rem] md:rounded-[2.5rem] text-slate-900 outline-none focus:border-amber-600 focus:bg-white transition-all font-black tracking-widest shadow-inner italic text-sm"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600 transition-colors p-2"
                    >
                      {showPassword ? <EyeOff size={20} md:size={28} /> : <Eye size={20} md:size={28} />}
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handlePasswordChange}
                  disabled={saving}
                  className="w-full bg-slate-900 text-white py-6 md:py-8 rounded-[2rem] md:rounded-[3rem] font-black text-[10px] md:text-[11px] uppercase tracking-[0.3em] hover:bg-amber-600 transition-all shadow-2xl flex items-center justify-center gap-3 md:gap-4 mt-6 md:mt-8 active:scale-[0.98] italic"
                >
                  {saving ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={24} md:size={28} strokeWidth={2.5} />}
                  Update Password
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
