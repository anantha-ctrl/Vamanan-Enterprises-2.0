import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, Users, Wallet, ShieldCheck, ShoppingBag, 
  CreditCard, MessageCircle, UserPlus, Globe, LogOut, XCircle, FileSignature,
  Home, FileText, UserCircle, ShoppingCart, Award, Zap, BookOpen, ChevronRight, X, Shield, Landmark, Settings, TrendingUp, Megaphone, Network, Receipt
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { humanRole } from '../utils/humanLabels';
import { hasPermission } from '../utils/accessControl';

const Sidebar = ({ activeTab, setActiveTab, showMobileMenu, setShowMobileMenu }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [expandedItem, setExpandedItem] = useState(null);
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : {};
  const role = user?.role || 'customer';

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    
    // Prevent body scroll when mobile menu is open
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = 'unset';
    };
  }, [showMobileMenu]);

  const getNavItems = () => {
    let items = [];
    const filterByPermission = (groupList) => {
      if (role === 'admin') return groupList;

      return groupList.map(group => ({
        ...group,
        items: group.items
          .map(item => {
            if (!item.subItems) return item;
            return {
              ...item,
              subItems: item.subItems.filter(subItem => hasPermission(user, subItem.id)),
            };
          })
          .filter(item => hasPermission(user, item.id) || item.subItems?.length > 0)
      })).filter(group => group.items.length > 0);
    };

    if (role === 'admin') {
      items = [
        { group: 'Management', items: [
          { id: 'overview', label: 'Dashboard', icon: BarChart3 },
          { id: 'investments', label: 'Purchases', icon: ShoppingCart },
          { id: 'investment_history', label: 'Purchase History', icon: FileText },
          { id: 'inventory', label: 'Asset Inventory', icon: ShoppingBag, path: '/admin/inventory' },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'genealogy', label: 'Genealogy', icon: Network },
          // { id: 'agreements', label: 'Institutional Agreements', icon: FileSignature, path: '/advocate?tab=agreements' },
        ]},
        { group: 'Operations', items: [
          { id: 'wallets_view', label: 'Wallets', icon: Wallet, subItems: [
            { id: 'wallets_list', label: 'Wallet List', path: '/admin/wallets' },
            { id: 'cashback_payouts', label: 'Cashback Payouts', path: '/admin/cashbacks' },
            { id: 'export_payouts', label: 'Export Payout Excel', path: '/admin/export-payouts' },
            { id: 'payout_reconciliation', label: 'Payout Reconciliation', path: '/admin/payout-reconciliation' },
            { id: 'payout_reports', label: 'Payout Reports', path: '/admin/payout-reports' },
          ]},
          { id: 'wallet_adj', label: 'Wallet Adjustment', icon: CreditCard },
          { id: 'tally_export', label: 'Tally Export', icon: Receipt, path: '/admin/tally' },
          { id: 'tally_integration', label: 'Tally Integration', icon: BookOpen, path: '/admin/tally-integration' },
          { id: 'kyc', label: 'KYC', icon: ShieldCheck },
          { id: 'market_rates', label: 'Market Rates', icon: TrendingUp },
          { id: 'withdrawals', label: 'Withdrawals', icon: Landmark },
          { id: 'tickets', label: 'Notifications', icon: Megaphone },
          { id: 'fiscal_reports', label: 'Reports', icon: FileText, subItems: [
            { id: 'cashback_reports', label: 'Cashback Reports', path: '/admin/reports/cashback' },
            { id: 'withdrawal_reports', label: 'Withdrawal Reports', path: '/admin/reports/withdrawal' },
            { id: 'transaction_reports', label: 'Transaction Reports', path: '/admin/reports/transaction' },
            { id: 'investment_reports', label: 'Investment Reports', path: '/admin/reports/investment' },
            { id: 'referral_reports', label: 'Referral Reports', path: '/admin/reports/referral' },
            { id: 'payout_reports_module', label: 'Payout Reports', path: '/admin/reports/payout' },
          ]},
        ]},
        { group: 'System', items: [
          { id: 'recruitment', label: 'Add Staff', icon: UserPlus },
          { id: 'settings', label: 'Settings', icon: Globe },
        ]}
      ];
    } else if (role === 'manager') {
      items = [
        { group: 'Operations', items: [
          { id: 'overview', label: 'Dashboard', icon: BarChart3 },
          { id: 'users', label: 'Customers', icon: Users },
          { id: 'investments', label: 'Purchase Requests', icon: ShoppingCart },
          { id: 'investment_history', label: 'Purchase History', icon: FileText },
          { id: 'inventory', label: 'Manage Assets', icon: ShoppingBag, path: '/admin/inventory' },
          { id: 'agreements', label: 'Agreements', icon: FileSignature, path: '/advocate?tab=agreements' },
          { id: 'kyc', label: 'KYC Verification', icon: ShieldCheck },
        ]},
        { group: 'Finance', items: [
          { id: 'wallets_view', label: 'Cashback', icon: Wallet },
          { id: 'withdrawals', label: 'Withdrawals', icon: Landmark },
          { id: 'tickets', label: 'Support Tickets', icon: MessageCircle },
          { id: 'broadcast', label: 'Notifications', icon: Megaphone },
          { id: 'payout_reports', label: 'Reports', icon: TrendingUp },
        ]},
        { group: 'Settings', items: [
          { id: 'recruitment', label: 'Staff Management', icon: UserPlus },
          { id: 'settings', label: 'Profile', icon: UserCircle },
        ]}
      ];
      return filterByPermission(items);
    } else if (role === 'advocate') {
      return [
        { group: 'Legal', items: [
          { id: 'overview', label: 'Overview', icon: BarChart3, path: '/advocate?tab=overview' },
          { id: 'agreements', label: 'Agreements', icon: FileSignature, path: '/advocate?tab=agreements' },
          { id: 'registry', label: 'Members', icon: Users, path: '/advocate?tab=registry' },
          { id: 'archive', label: 'Archive', icon: Landmark, path: '/advocate?tab=archive' },
          { id: 'disputes', label: 'Dispute Resolution', icon: Shield, path: '/advocate?tab=disputes' },
        ]},
        { group: 'Account', items: [
          { id: 'profile', label: 'Profile', icon: Shield, path: '/advocate-profile' },
        ]}
      ];
    } else if (role === 'staff') {
      items = [
        { group: 'Tasks', items: [
          { id: 'overview', label: 'Dashboard', icon: BarChart3 },
          { id: 'kyc', label: 'KYC', icon: ShieldCheck },
          { id: 'tickets', label: 'Notifications', icon: Megaphone },
        ]}
      ];
      return filterByPermission(items);
    } else {
      return [
        { group: 'Main Menu', items: [
          { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
          { id: 'shop', label: 'Buy', icon: ShoppingCart, path: '/shop' },
          { id: 'cashback', label: 'Cashback', icon: Zap, path: '/cashback-plan' },
          { id: 'cashback_application', label: 'Cashback Application', icon: FileText, path: '/cashback-application' },
          { id: 'referrals', label: 'Referrals', icon: Award, path: '/referrals' },
          { id: 'wallet_view', label: 'Wallet', icon: Wallet, subItems: [
            { id: 'wallet_overview', label: 'Wallet Overview', path: '/wallet-overview' },
            { id: 'wallet_audit', label: 'Transaction History', path: '/transaction-history' },
            { id: 'wallet_withdraw', label: 'Withdraw History', path: '/withdraw-history' },
          ]},
          { id: 'rules', label: 'Rules', icon: BookOpen, path: '/rules' },
        ]},
        { group: 'Account Settings', items: [
          { id: 'kyc', label: 'KYC', icon: ShieldCheck, path: '/kyc' },
          { id: 'agreement', label: 'Agreement', icon: FileText, path: '/agreement' },
          { id: 'profile', label: 'Profile', icon: UserCircle, path: '/profile' },
        ]}
      ];
    }
    return items;
  };

  const menuGroups = getNavItems();

  const handleNavClick = (item) => {
    if (item.subItems) {
      setExpandedItem(expandedItem === item.id ? null : item.id);
      return;
    }
    
    if (item.path) {
      navigate(item.path);
    }
    
    if (typeof setActiveTab === 'function') {
      setActiveTab(item.id);
    } else if (role === 'admin' && !item.path) {
      navigate('/admin');
    } else if (role === 'advocate' && !item.path) {
      navigate('/advocate');
    }
    
    setShowMobileMenu(false);
  };

  return (
    <AnimatePresence mode="wait">
      {(showMobileMenu || isDesktop) && (
        <>
          {/* Overlay Matrix */}
          {!isDesktop && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)} 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[190]" 
            />
          )}

          <motion.aside 
            initial={isDesktop ? false : { x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`
              fixed top-0 left-0 bottom-0 h-screen h-[100dvh] z-[250] w-72 bg-white border-slate-200 border-r p-6 pb-12 md:p-8 flex flex-col 
              transition-all duration-500 ease-in-out shadow-2xl lg:shadow-none
              ${showMobileMenu ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
          >
            {/* Sidebar Header */}
            <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => { navigate('/'); setShowMobileMenu(false); }}>
                   <div className="w-10 h-10 bg-slate-900 rounded-[1rem] flex items-center justify-center overflow-hidden p-1.5 shadow-xl border border-white/5 transition-transform group-hover:rotate-12">
                      <img src="/vamanan-logo.png" alt="Logo" className="w-full h-full object-contain" />
                   </div>
                   <div>
                      <h1 className="text-sm font-black tracking-tighter uppercase italic leading-none text-slate-900">Vamanan <span className="text-amber-600">Gold</span></h1>
                      <div className="flex items-center gap-1.5 mt-1">
                         <div className="w-1 h-1 bg-amber-500 rounded-full animate-pulse"></div>
                         <span className="text-[7px] font-black uppercase tracking-[0.4em] text-slate-400 italic">{humanRole(role)}</span>
                      </div>
                   </div>
                </div>
                <button 
                  onClick={() => setShowMobileMenu(false)} 
                  className="lg:hidden w-9 h-9 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 active:scale-95 transition-all shadow-sm"
                >
                   <X size={18} />
                </button>
            </div>
            
            {/* Navigation Matrix */}
            <nav className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-1 pb-4">
              {menuGroups.map((group, idx) => (
                <div key={idx} className="space-y-2">
                  <p className="text-[8px] font-black uppercase tracking-[0.5em] ml-4 mb-3 text-slate-400 italic opacity-80">{group.group}</p>
                  {group.items.map((item) => {
                    const isActive = item.path ? location.pathname === item.path : activeTab === item.id;
                    const activeStyle = isActive 
                      ? (role === 'advocate' 
                          ? 'bg-amber-50 text-amber-600 border-2 border-amber-100 shadow-xl shadow-amber-500/5' 
                          : 'bg-slate-900 text-white shadow-xl shadow-slate-200') 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-2 border-transparent';
                    
                    return (
                      <div key={item.id} className="space-y-1">
                        <button 
                          onClick={() => handleNavClick(item)} 
                          className={`w-full flex items-center justify-between p-4 rounded-[1.25rem] transition-all duration-500 group relative ${activeStyle}`}
                        >
                          <div className="flex items-center space-x-3">
                            <item.icon 
                              size={18} 
                              strokeWidth={isActive ? 2.5 : 1.5} 
                              className={isActive ? (role === 'advocate' ? 'text-amber-600' : 'text-amber-500') : 'group-hover:text-amber-600 transition-colors'} 
                            /> 
                            <span className={`text-[9px] uppercase font-black tracking-widest italic ${isActive ? 'tracking-[0.12em]' : ''} ${isActive && role === 'advocate' ? 'text-amber-700' : ''}`}>
                               {item.label}
                            </span>
                          </div>
                          {(isActive || (item.subItems && expandedItem === item.id)) && !item.subItems && (
                            <motion.div 
                              layoutId="activeIndicator" 
                              className="w-1 h-1 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]" 
                            />
                          )}
                          {item.subItems && (
                            <motion.div animate={{ rotate: expandedItem === item.id ? 90 : 0 }}>
                              <ChevronRight size={14} className="text-slate-300" />
                            </motion.div>
                          )}
                          {!isActive && !item.subItems && (
                            <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-slate-300" />
                          )}
                        </button>
                        
                        {/* Submenu Matrix */}
                        <AnimatePresence>
                          {item.subItems && expandedItem === item.id && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden ml-6 pl-4 border-l border-slate-100 space-y-1"
                            >
                              {item.subItems.map((sub) => (
                                <button
                                  key={sub.id}
                                  onClick={() => { navigate(sub.path); setShowMobileMenu(false); }}
                                  className={`w-full text-left p-3 rounded-xl text-[8px] font-black uppercase tracking-widest italic transition-all ${location.pathname === sub.path ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                                >
                                  {sub.label}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              ))}
            </nav>

            {/* Sidebar Footer */}
            <div className="mt-auto pt-6 border-t border-slate-100">
              <div className="bg-slate-50 rounded-[1.25rem] p-4 border border-slate-100 group/footer transition-all hover:bg-slate-900">
                 <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 group-hover/footer:bg-amber-500 transition-colors">
                       <UserCircle size={18} className="text-slate-400 group-hover/footer:text-slate-900" />
                    </div>
                    <div className="min-w-0">
                       <p className="text-[9px] font-black text-slate-900 uppercase italic truncate group-hover/footer:text-white transition-colors">{user.name || 'Anonymous'}</p>
                       <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest truncate mt-0.5 group-hover/footer:text-amber-500/70 transition-colors">Signed In</p>
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => { localStorage.clear(); navigate('/login'); setShowMobileMenu(false); }} 
                className="flex items-center justify-between w-full p-4 group rounded-[1.25rem] text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-95 border border-transparent hover:border-rose-100"
              >
                <div className="flex items-center gap-3">
                   <LogOut size={18} className="group-hover:translate-x-1 transition-transform" /> 
                   <span className="text-[9px] font-black uppercase tracking-[0.3em] italic">Log Out</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-200 group-hover:bg-rose-500 transition-colors"></div>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
