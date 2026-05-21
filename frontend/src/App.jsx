// High-Frequency Application Hub - Vamanan Gold
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Referrals from './pages/Referrals';
import Shop from './pages/Shop';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import StaffDashboard from './pages/StaffDashboard';
import AdvocateDashboard from './pages/AdvocateDashboard';
import AdvocateProfile from './pages/AdvocateProfile';
import Login from './pages/Login';
import Register from './pages/Register';
import KYC from './pages/KYC';
import Agreement from './pages/Agreement';
import Profile from './pages/Profile';
import CashbackPlan from './pages/CashbackPlan';
import WalletPage from './pages/Wallet';
import WalletOverview from './pages/WalletOverview';
import TransactionHistory from './pages/TransactionHistory';
import WithdrawHistory from './pages/WithdrawHistory';
import RulesPage from './pages/Rules';
import WithdrawalsPage from './pages/Withdrawals';
import WalletListAdmin from './pages/WalletListAdmin';
import CashbackPayouts from './pages/CashbackPayouts';
import ExportPayoutExcel from './pages/ExportPayoutExcel';
import PayoutReconciliation from './pages/PayoutReconciliation';
import PayoutReports from './pages/PayoutReports';
import AdminReports from './pages/AdminReports';
import Recovery from './pages/Recovery';
import Loader from './components/Loader';
import BottomNav from './components/BottomNav';

function AppRoutes() {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Show loader on every route change
    setIsLoading(true);
    
    // Simulate API call delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 200);  // Reduced from 1000ms — was causing blank screen on navigation

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      {isLoading && <Loader />}
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/recovery" element={<Recovery />} />
        <Route path="/admin/login" element={<Navigate to="/login" />} />

        {/* Customer Panel */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/wallet-overview" element={<WalletOverview />} />
        <Route path="/transaction-history" element={<TransactionHistory />} />
        <Route path="/withdraw-history" element={<WithdrawHistory />} />
        <Route path="/withdrawals" element={<WithdrawalsPage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/kyc" element={<KYC />} />
        <Route path="/agreement" element={<Agreement />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/cashback-plan" element={<CashbackPlan />} />

        {/* Staff Panel */}
        <Route path="/staff" element={<StaffDashboard />} />

        {/* Manager Panel */}
        <Route path="/manager" element={<ManagerDashboard />} />

        {/* Advocate Panel */}
        <Route path="/advocate" element={<AdvocateDashboard />} />
        <Route path="/advocate-profile" element={<AdvocateProfile />} />

        {/* Admin Panel */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/wallets" element={<WalletListAdmin />} />
        <Route path="/admin/cashbacks" element={<CashbackPayouts />} />
        <Route path="/admin/export-payouts" element={<ExportPayoutExcel />} />
        <Route path="/admin/payout-reconciliation" element={<PayoutReconciliation />} />
        <Route path="/admin/payout-reports" element={<PayoutReports />} />
        <Route path="/admin/reports/:type" element={<AdminReports />} />
        <Route path="/admin/withdrawals" element={<AdminDashboard />} />

        {/* Fallback to Home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <BottomNav />
    </>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppRoutes />
    </Router>
  );
}


export default App;
