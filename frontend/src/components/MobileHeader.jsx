import React, { useState, useEffect } from 'react';
import { Menu, User, Bell, X, BellOff, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import API_BASE_URL from '../config';

const MobileHeader = ({ setShowMobileMenu }) => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.id) {
       fetchNotifications();
       const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
       return () => clearInterval(interval);
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/customer/get_notifications.php?user_id=${user.id}`);
      if (res.data.status === 'success') {
        setNotifications(res.data.data);
        setUnreadCount(res.data.data.length); // For now, just count them all as new
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  return (
    <header className="lg:hidden sticky top-0 z-[60] bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-sm">
      {/* Left Corner: Profile Icon */}
      <button 
        onClick={() => navigate('/profile')}
        className="p-2.5 bg-slate-50 rounded-xl text-slate-600 border border-slate-200 active:scale-95 transition-all"
      >
        <User size={20} />
      </button>

      {/* Center: App Name and Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center p-1 border border-slate-100">
          <img 
            src="/vamanan-logo.png" 
            alt="Logo" 
            className="w-full h-full object-contain" 
          />
        </div>
        <h1 className="text-sm font-black tracking-tighter uppercase leading-none text-slate-900 italic">
          Vamanan Gold
        </h1>
      </div>

      {/* Right Side: Notification and Menu */}
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setShowNotifications(true)}
          className="p-2.5 bg-slate-50 rounded-xl text-slate-600 border border-slate-200 active:scale-95 transition-all relative"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full border-2 border-white"></span>
          )}
        </button>
        <button 
          onClick={() => setShowMobileMenu(true)} 
          className="p-2.5 bg-slate-900 rounded-xl text-white shadow-sm active:scale-95 transition-all"
        >
          <Menu size={20} />
        </button>
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
              className="relative w-full bg-white border-b border-slate-100 shadow-2xl p-6 rounded-b-[2rem]"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <Bell size={20} />
                  </div>
                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Recent Broadcasts</h3>
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
                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight mb-1">{n.title}</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed mb-2 font-medium">{n.message}</p>
                      <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                        <Clock size={10} />
                        {new Date(n.created_at).toLocaleDateString()} • {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                      <BellOff className="text-slate-200" size={32} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Active Notifications</p>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setShowNotifications(false)}
                className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-slate-200"
              >
                Close Panel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default MobileHeader;
