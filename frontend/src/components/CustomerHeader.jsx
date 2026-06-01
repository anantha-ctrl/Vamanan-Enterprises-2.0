import React, { useState, useEffect } from 'react';
import { Menu, User, Bell, X, BellOff, Clock, Activity, CheckCircle, Circle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import API_BASE_URL from '../config';

const portalLabel = (role) => {
  const map = { admin: 'Admin Portal', manager: 'Manager Portal', staff: 'Staff Portal', advocate: 'Advocate Portal' };
  return map[role] || '{portal}';
};

const CustomerHeader = ({ setShowMobileMenu, activeTab = "Dashboard" }) => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const portal = portalLabel(user.role);

  useEffect(() => {
    if (user.id) {
       fetchNotifications();
       const interval = setInterval(fetchNotifications, 30000); 
       return () => clearInterval(interval);
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/customer/get_notifications.php?user_id=${user.id}`);
      if (res.data.status === 'success') {
        setNotifications(res.data.data);
        const unread = res.data.data.filter(n => n.is_read == 0).length;
        setUnreadCount(unread); 
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  const handleMarkRead = async (notifId, currentStatus) => {
    try {
      const newStatus = currentStatus == 1 ? 0 : 1;
      await axios.post(`${API_BASE_URL}/customer/mark_notification_read.php`, {
        notification_id: notifId,
        user_id: user.id,
        is_read: newStatus
      });
      fetchNotifications();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleDeleteNotification = async (notifId) => {
    if (!window.confirm("Delete this notification?")) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/customer/delete_notification.php`, {
        notification_id: notifId,
        user_id: user.id
      });
      if (res.data.status === 'success') {
        fetchNotifications();
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-[60] bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-3 md:py-4 flex items-center justify-between shadow-sm">
      {/* Left: Hamburger (Mobile) + Title (Desktop) */}
      <div className="flex items-center gap-3 md:gap-4">
        <button 
          onClick={() => setShowMobileMenu(true)} 
          className="lg:hidden p-2 bg-slate-900 rounded-xl text-white shadow-sm active:scale-95 transition-all"
        >
          <Menu size={18} />
        </button>
        
        <div className="hidden lg:flex items-center gap-3">
          <div className="w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center overflow-hidden p-1.5 shadow-lg border border-white/10">
            <img src="/vamanan-logo.png" alt="Vamanan Gold" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] mb-0.5">
              <span>Vamanan Gold</span>
              <div className="w-1 h-1 rounded-full bg-amber-500"></div>
              <span className="text-amber-600 italic">{portal}</span>
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic text-slate-900 leading-none">
              {activeTab}
            </h1>
          </div>
        </div>

        {/* Mobile App Title - Optimized */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden p-1 shadow-md">
            <img src="/vamanan-logo.png" alt="Vamanan Gold" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col justify-center">
             <h1 className="text-[12px] font-black tracking-tighter uppercase leading-none text-slate-900 italic">Vamanan Gold</h1>
             <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-0.5">{portal}</span>
          </div>
        </div>
      </div>

      {/* Right Side: Search (Desktop Hidden) + Notifications + Profile */}
      <div className="flex items-center gap-2 md:gap-4">
        
        {/* Market Status (Desktop Only) */}
        <div className="hidden md:flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl group hover:border-amber-500/40 transition-all shadow-inner">
          <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
            <Activity size={16} className="animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Status</span>
            <span className="text-[10px] font-black text-slate-900 italic tracking-tight">Online</span>
          </div>
        </div>

        {/* Notifications */}
        <button 
          onClick={() => setShowNotifications(true)}
          className="p-2.5 md:p-3 bg-slate-50 rounded-xl text-slate-600 border border-slate-200 active:scale-95 hover:bg-white hover:border-amber-500 transition-all relative"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full border-2 border-white animate-bounce"></span>
          )}
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-slate-100">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 italic">Investor</span>
            <span className="text-[11px] font-black text-slate-900 leading-none truncate max-w-[100px]">{user.name || 'User'}</span>
          </div>
          <button 
            onClick={() => navigate('/profile')}
            className="w-10 h-10 md:w-11 md:h-11 bg-slate-900 rounded-xl md:rounded-2xl flex items-center justify-center text-amber-500 font-black text-base shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            {user.name ? user.name[0].toUpperCase() : <User size={20} />}
          </button>
        </div>
      </div>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <div className="fixed inset-0 z-[110] flex flex-col">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="relative w-full lg:max-w-xl lg:mx-auto bg-white border-b lg:border border-slate-100 shadow-2xl p-6 lg:mt-4 lg:rounded-[2.5rem] rounded-b-[2.5rem]"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <Bell size={20} />
                  </div>
                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight italic">Broadcast History</h3>
                </div>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                {notifications.length > 0 ? (
                  notifications.map((n, i) => (
                    <div key={i} className={`p-5 rounded-[1.5rem] border transition-all group relative ${n.is_read == 1 ? 'bg-white border-slate-100 opacity-80' : 'bg-slate-50 border-amber-100'}`}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h4 className={`text-[11px] font-black uppercase tracking-tight mb-2 italic transition-colors ${n.is_read == 1 ? 'text-slate-500' : 'text-slate-900 group-hover:text-amber-600'}`}>{n.title}</h4>
                          <p className="text-[10px] text-slate-500 leading-relaxed mb-3 font-medium">{n.message}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                           <button 
                            onClick={() => handleMarkRead(n.id, n.is_read)}
                            title={n.is_read == 1 ? "Mark as Unread" : "Mark as Read"}
                            className={`p-1.5 rounded-lg transition-all ${n.is_read == 1 ? 'text-slate-300 hover:text-amber-500 hover:bg-amber-50' : 'text-amber-500 bg-amber-50 hover:bg-amber-100'}`}
                           >
                            {n.is_read == 1 ? <Circle size={14} /> : <CheckCircle size={14} />}
                           </button>
                           {n.user_id && (
                             <button 
                              onClick={() => handleDeleteNotification(n.id)}
                              title="Delete Notification"
                              className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                             >
                              <Trash2 size={14} />
                             </button>
                           )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-300 uppercase tracking-widest italic">
                        <Clock size={10} />
                        {new Date(n.created_at).toLocaleDateString()} • {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                      <BellOff className="text-slate-200" size={32} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">No Active Broadcasts</p>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setShowNotifications(false)}
                className="w-full mt-6 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all italic"
              >
                Dismiss Panel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default CustomerHeader;
