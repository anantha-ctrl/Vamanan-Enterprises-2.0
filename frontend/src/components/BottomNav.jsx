import React from 'react';
import { Home, ShoppingCart, Zap, Award, User, UserCircle, Activity } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : {};

  // Define hidden routes
  const hiddenRoutes = ['/', '/login', '/register'];
  if (hiddenRoutes.includes(location.pathname)) return null;

  // Only show for customers
  if (user.role && user.role !== 'customer') return null;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'shop', label: 'Buy', icon: ShoppingCart, path: '/shop' },
    { id: 'cashback', label: 'Cashback', icon: Zap, path: '/cashback-plan' },
    { id: 'referrals', label: 'Referrals', icon: Award, path: '/referrals' },
    { id: 'profile', label: 'Profile', icon: UserCircle, path: '/profile' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-xl border-t border-slate-200/60 px-6 pb-6 pt-4 flex items-center justify-around shadow-[0_-20px_60px_rgba(0,0,0,0.08)] rounded-t-[2.5rem] print:hidden">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-2 transition-all duration-500 relative flex-1 ${isActive ? 'text-amber-600' : 'text-slate-400'}`}
          >
            {isActive && (
              <motion.div 
                layoutId="activeTabIndicator"
                className="absolute -top-4 w-10 h-1 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            
            <div className={`transition-all duration-500 p-2 rounded-xl ${isActive ? 'bg-amber-50 shadow-inner' : 'bg-transparent'}`}>
               <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={`${isActive ? 'scale-110 drop-shadow-sm' : 'opacity-70'}`} />
            </div>

            <span className={`text-[8px] font-black uppercase tracking-[0.2em] italic transition-all duration-500 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-40 -translate-y-0.5'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
