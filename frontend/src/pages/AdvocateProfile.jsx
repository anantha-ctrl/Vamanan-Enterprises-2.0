import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, User, Mail, Lock, Camera, 
  ChevronRight, ArrowLeft, Crown, Gavel, 
  Activity, History, Settings, Bell, 
  CheckCircle2, AlertCircle, RefreshCw, X, Menu,
  Eye, EyeOff, Phone, Save, Edit3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config';

const AdvocateProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('identity'); 
  
  // Edit States
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: 'Certified institutional advocate overseeing decentralized capital nodes for Vamanan Enterprises. Specialized in protocol ratification and institutional integrity monitoring.'
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  // Security States
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwords, setPasswords] = useState({
    new: '',
    confirm: ''
  });
  const [secLoading, setSecLoading] = useState(false);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (!storedUser || storedUser.role !== 'advocate') {
      navigate('/login');
      return;
    }
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(storedUser);
      setEditData({
        name: storedUser.name || '',
        email: storedUser.email || '',
        phone: storedUser.phone || '',
        bio: editData.bio
      });
      setLoading(false);
    } catch (err) {
      console.error("Profile fetch failed", err);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/update_profile.php`, {
        user_id: user.id,
        name: editData.name,
        email: editData.email,
        phone: editData.phone
      });
      if (res.data.status === 'success') {
        alert("Identity Protocol Synchronized Successfully.");
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setIsEditing(false);
      } else {
        alert(res.data.message || "Update Failed");
      }
    } catch (err) {
      alert("Database Node Failure: Connection to Identity Node failed.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert("Operational Error: New access nodes do not match.");
      return;
    }
    setSecLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/update_password.php`, {
        user_id: user.id,
        new_password: passwords.new
      });
      if (res.data.status === 'success') {
        alert("Institutional Credentials Updated Successfully.");
        setShowPasswordForm(false);
        setPasswords({ new: '', confirm: '' });
      } else {
        alert(res.data.message || "Credential Update Failed");
      }
    } catch (err) {
      alert("Protocol Error: Connection to Security Node failed.");
    } finally {
      setSecLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
         <div className="relative">
            <div className="w-24 h-24 border-4 border-amber-100 border-t-amber-500 rounded-full animate-spin"></div>
            <Gavel className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500" size={32} />
         </div>
         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-600 animate-pulse italic">Synchronizing Legal Identity...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-inter text-slate-600 selection:bg-amber-500 selection:text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-amber-500/[0.05] blur-[150px] -z-0 rounded-full pointer-events-none"></div>
      
      <Sidebar 
        activeTab="profile" 
        setActiveTab={() => {}} 
        showMobileMenu={showMobileMenu} 
        setShowMobileMenu={setShowMobileMenu} 
      />

      <div className="ml-0 lg:ml-72 min-h-screen relative w-full flex flex-col z-10">
        <header className="sticky top-0 z-[100] bg-white/95 backdrop-blur-2xl border-b border-amber-100 p-3 md:p-6 flex justify-between items-center shadow-xl shadow-amber-500/5">
           <div className="flex items-center gap-3 md:gap-6">
              <button onClick={() => navigate('/advocate')} className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-amber-500 transition-all shadow-sm">
                 <ArrowLeft size={20} />
              </button>
              <div className="w-10 h-10 md:w-16 md:h-16 bg-blue-900 rounded-xl md:rounded-[1.5rem] flex items-center justify-center overflow-hidden p-1.5 md:p-2 shadow-xl border-2 md:border-4 border-white">
                 <img src="/vamanan-logo.png" alt="Vamanan Enterprises V" className="w-full h-full object-contain" />
              </div>
              <div>
                 <h2 className="text-lg md:text-3xl font-black text-blue-900 tracking-tighter uppercase italic leading-none">
                    Institutional <span className="text-amber-500">Identity</span>
                 </h2>
                 <p className="text-[7px] md:text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1 md:mt-2 italic">Legal Protocol Node 0.9-A</p>
              </div>
           </div>
           
           <div className="flex items-center gap-3 md:gap-8">
              <div className="hidden lg:flex flex-col items-end mr-2 text-right">
                 <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic mb-0.5 leading-none">Status</p>
                 <p className="text-xs font-black text-amber-500 italic uppercase tracking-tighter flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span> Authorized
                 </p>
              </div>
              <div className="w-10 h-10 md:w-16 md:h-16 bg-blue-900 rounded-xl md:rounded-[1.5rem] flex items-center justify-center overflow-hidden p-1.5 md:p-2 border-2 md:border-4 border-amber-500/10 shadow-xl">
                 <img src="/vamanan-logo.png" alt="Vamanan Enterprises V" className="w-full h-full object-contain" />
              </div>
           </div>
        </header>

        <main className="p-4 md:p-14 space-y-12 max-w-[1400px] mx-auto w-full pb-32">
           <div className="bg-white border-4 border-amber-50 rounded-[4rem] p-10 md:p-16 relative overflow-hidden shadow-2xl shadow-amber-500/5">
              <div className="absolute top-0 right-0 p-20 opacity-[0.03] rotate-12 pointer-events-none"><Crown size={400} /></div>
              <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                 <div className="w-32 h-32 md:w-48 md:h-48 bg-slate-50 border-8 border-white rounded-[4rem] flex items-center justify-center text-5xl md:text-7xl font-black text-blue-900 italic shadow-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500">V</div>
                 <div className="text-center md:text-left space-y-4">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                       <h3 className="text-3xl md:text-5xl font-black text-blue-900 uppercase italic tracking-tighter leading-none">{user?.name}</h3>
                       <span className="bg-amber-50 text-amber-600 px-5 py-2 rounded-full border border-amber-100 text-[10px] font-black uppercase italic">Lead Advocate</span>
                    </div>
                    <p className="text-sm md:text-xl text-slate-400 font-medium italic">Dedicated Legal Oversight • Vamanan Enterprises</p>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="space-y-6">
                 {[
                    { id: 'identity', label: 'Identity Protocol', icon: User, desc: 'Manage public info' },
                    { id: 'security', label: 'Security Hub', icon: Lock, desc: 'Update credentials' }
                 ].map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full p-8 rounded-[2.5rem] border-2 transition-all flex items-center gap-8 group ${activeSection === item.id ? 'bg-blue-900 border-blue-900 shadow-2xl shadow-blue-900/20' : 'bg-white border-amber-50 hover:border-amber-500 shadow-sm'}`}
                    >
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${activeSection === item.id ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-500 group-hover:scale-110'}`}>
                          <item.icon size={24} />
                       </div>
                       <div className="text-left">
                          <p className={`text-sm font-black uppercase italic leading-none mb-2 ${activeSection === item.id ? 'text-white' : 'text-blue-900'}`}>{item.label}</p>
                          <p className={`text-[10px] font-bold uppercase italic tracking-widest ${activeSection === item.id ? 'text-slate-400' : 'text-slate-300'}`}>{item.desc}</p>
                       </div>
                       <ChevronRight className={`ml-auto transition-transform ${activeSection === item.id ? 'text-amber-500 translate-x-2' : 'text-slate-100'}`} size={20} />
                    </button>
                 ))}
              </div>

              <div className="lg:col-span-2">
                 <AnimatePresence mode="wait">
                    {activeSection === 'identity' && (
                       <motion.div key="identity" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white border-2 border-amber-50 rounded-[4rem] p-10 md:p-16 space-y-12 shadow-sm">
                          <div className="flex justify-between items-center">
                             <h4 className="text-2xl font-black text-blue-900 uppercase italic tracking-tighter">Identity Details</h4>
                             <button 
                               onClick={() => setIsEditing(!isEditing)} 
                               className={`flex items-center gap-3 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest italic transition-all ${isEditing ? 'bg-blue-50 text-blue-500 border border-blue-100' : 'bg-amber-50 text-amber-500 border border-amber-100'}`}
                             >
                                {isEditing ? <><X size={14}/> Abort</> : <><Edit3 size={14}/> Edit Profile</>}
                             </button>
                          </div>

                          {!isEditing ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                   <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic ml-4">Full Name</label>
                                   <div className="w-full bg-slate-50 p-6 rounded-3xl text-sm font-black text-blue-900 uppercase italic border border-slate-100">{user?.name}</div>
                                </div>
                                <div className="space-y-4">
                                   <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic ml-4">Email Node</label>
                                   <div className="w-full bg-slate-50 p-6 rounded-3xl text-sm font-black text-blue-900 uppercase italic border border-slate-100">{user?.email}</div>
                                </div>
                                <div className="space-y-4">
                                   <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic ml-4">Phone Protocol</label>
                                   <div className="w-full bg-slate-50 p-6 rounded-3xl text-sm font-black text-blue-900 uppercase italic border border-slate-100">{user?.phone || 'NOT SET'}</div>
                                </div>
                                <div className="space-y-4 md:col-span-2">
                                   <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic ml-4">Professional Bio</label>
                                   <div className="w-full bg-slate-50 p-8 rounded-[2.5rem] text-sm text-slate-500 font-medium italic border border-slate-100 leading-relaxed">{editData.bio}</div>
                                </div>
                             </div>
                          ) : (
                             <form onSubmit={handleProfileUpdate} className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                   <div className="space-y-4">
                                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic ml-4">Full Name</label>
                                      <div className="relative">
                                         <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                                         <input 
                                           type="text" 
                                           value={editData.name}
                                           onChange={(e) => setEditData({...editData, name: e.target.value})}
                                           className="w-full bg-slate-50 border-2 border-slate-50 p-6 pl-16 rounded-3xl text-sm font-black uppercase italic focus:border-amber-500 outline-none transition-all"
                                           required
                                         />
                                      </div>
                                   </div>
                                   <div className="space-y-4">
                                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic ml-4">Email Node</label>
                                      <div className="relative">
                                         <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                                         <input 
                                           type="email" 
                                           value={editData.email}
                                           onChange={(e) => setEditData({...editData, email: e.target.value})}
                                           className="w-full bg-slate-50 border-2 border-slate-50 p-6 pl-16 rounded-3xl text-sm font-black uppercase italic focus:border-amber-500 outline-none transition-all"
                                           required
                                         />
                                      </div>
                                   </div>
                                   <div className="space-y-4">
                                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic ml-4">Phone Protocol</label>
                                      <div className="relative">
                                         <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20}/>
                                         <input 
                                           type="text" 
                                           value={editData.phone}
                                           onChange={(e) => setEditData({...editData, phone: e.target.value})}
                                           className="w-full bg-slate-50 border-2 border-slate-50 p-6 pl-16 rounded-3xl text-sm font-black uppercase italic focus:border-amber-500 outline-none transition-all"
                                           placeholder="ENTER CONTACT NODE..."
                                         />
                                      </div>
                                   </div>
                                   <div className="space-y-4 md:col-span-2">
                                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic ml-4">Professional Bio</label>
                                      <textarea 
                                        value={editData.bio}
                                        onChange={(e) => setEditData({...editData, bio: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-50 p-8 rounded-[2.5rem] text-sm text-slate-500 font-medium italic focus:border-amber-500 outline-none transition-all h-32 no-scrollbar"
                                      />
                                   </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                   <button 
                                     type="submit" 
                                     disabled={updateLoading}
                                     className="flex-1 bg-blue-900 text-white py-6 rounded-[2rem] text-[11px] font-black uppercase italic tracking-[0.2em] hover:bg-amber-500 transition-all shadow-2xl flex items-center justify-center gap-4"
                                   >
                                      {updateLoading ? <RefreshCw className="animate-spin" size={18}/> : <><Save size={18}/> Save Identity Node</>}
                                   </button>
                                   <button type="button" onClick={() => setIsEditing(false)} className="px-10 py-6 bg-slate-50 text-slate-400 rounded-[2rem] text-[11px] font-black uppercase italic tracking-widest hover:bg-blue-50 hover:text-blue-500 transition-all">Cancel</button>
                                </div>
                             </form>
                          )}
                       </motion.div>
                    )}

                    {activeSection === 'security' && (
                       <motion.div key="security" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white border-2 border-amber-50 rounded-[4rem] p-10 md:p-16 space-y-12 shadow-sm">
                          <div className="flex justify-between items-center">
                             <h4 className="text-2xl font-black text-blue-900 uppercase italic tracking-tighter">Security Hub</h4>
                             <ShieldCheck className="text-amber-500" size={32} />
                          </div>
                          
                          <div className="space-y-8">
                             {!showPasswordForm ? (
                                <div className="flex flex-col md:flex-row justify-between items-center gap-8 p-10 bg-slate-50 rounded-[3rem] border border-slate-100 group hover:border-amber-500 transition-all">
                                   <div className="flex items-center gap-8">
                                      <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 shadow-sm"><Lock size={24} /></div>
                                      <div>
                                         <p className="text-sm font-black text-blue-900 uppercase italic mb-1">Institutional Access Node</p>
                                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Update your encrypted protocol keys</p>
                                      </div>
                                   </div>
                                   <button 
                                     onClick={() => setShowPasswordForm(true)}
                                     className="px-10 py-5 bg-blue-900 text-white rounded-2xl text-[10px] font-black uppercase italic tracking-widest hover:bg-amber-500 transition-all shadow-xl"
                                   >
                                      Change Node
                                   </button>
                                </div>
                             ) : (
                                <motion.form 
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  onSubmit={handlePasswordUpdate}
                                  className="p-10 bg-white border-4 border-amber-50 rounded-[3.5rem] space-y-10 shadow-xl"
                                >
                                   <div className="flex justify-between items-center">
                                      <h5 className="text-lg font-black text-blue-900 uppercase italic tracking-tight flex items-center gap-4">
                                         <Lock className="text-amber-500" size={24} /> Update Credentials
                                      </h5>
                                      <button type="button" onClick={() => setShowPasswordForm(false)} className="text-slate-300 hover:text-blue-500"><X size={24}/></button>
                                   </div>
                                   
                                   <div className="space-y-8">
                                      <div className="space-y-4">
                                         <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic ml-4">New Access Node</label>
                                         <div className="relative">
                                            <input 
                                              type={showPass ? 'text' : 'password'}
                                              value={passwords.new}
                                              onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                                              className="w-full bg-slate-50 border-2 border-slate-50 p-6 rounded-3xl text-sm font-black uppercase italic focus:border-amber-500 outline-none transition-all"
                                              placeholder="ENTER NEW PROTOCOL KEY..."
                                              required
                                            />
                                            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-amber-500 transition-colors">
                                               {showPass ? <EyeOff size={20}/> : <Eye size={20}/>}
                                            </button>
                                         </div>
                                      </div>
                                      <div className="space-y-4">
                                         <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic ml-4">Confirm New Access Node</label>
                                         <div className="relative">
                                            <input 
                                              type={showConfirmPass ? 'text' : 'password'}
                                              value={passwords.confirm}
                                              onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                                              className="w-full bg-slate-50 border-2 border-slate-50 p-6 rounded-3xl text-sm font-black uppercase italic focus:border-amber-500 outline-none transition-all"
                                              placeholder="CONFIRM NEW PROTOCOL KEY..."
                                              required
                                            />
                                            <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-amber-500 transition-colors">
                                               {showConfirmPass ? <EyeOff size={20}/> : <Eye size={20}/>}
                                            </button>
                                         </div>
                                      </div>
                                   </div>

                                   <div className="flex gap-4 pt-6">
                                      <button 
                                        type="submit" 
                                        disabled={secLoading}
                                        className="flex-1 bg-blue-900 text-white py-6 rounded-[1.75rem] text-[11px] font-black uppercase italic tracking-widest hover:bg-amber-500 transition-all shadow-2xl disabled:opacity-50 flex items-center justify-center gap-4"
                                      >
                                         {secLoading ? <RefreshCw className="animate-spin" size={18}/> : 'Update Security Password'}
                                      </button>
                                      <button type="button" onClick={() => setShowPasswordForm(false)} className="px-10 py-6 bg-slate-50 text-slate-400 rounded-[1.75rem] text-[11px] font-black uppercase italic tracking-widest hover:bg-blue-50 hover:text-blue-500 transition-all">Abort</button>
                                   </div>
                                </motion.form>
                             )}
                          </div>
                       </motion.div>
                    )}
                 </AnimatePresence>
              </div>
           </div>
        </main>
      </div>
    </div>
  );
};

export default AdvocateProfile;
