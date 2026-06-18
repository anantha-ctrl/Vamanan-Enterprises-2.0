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
import CashbackApplication from './pages/CashbackApplication';
import ProductRequest from './pages/ProductRequest';
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
import Inventory from './pages/Inventory';
import TallyExport from './pages/TallyExport';
import TallyIntegration from './pages/TallyIntegration';
import Recovery from './pages/Recovery';
import Loader from './components/Loader';
import BottomNav from './components/BottomNav';
import { canAccessRoute, defaultRouteForRole, getStoredUser } from './utils/accessControl';

function ProtectedRoute({ children, allowedRoles = [], permission }) {
  const user = getStoredUser();
  const role = user.role || '';

  if (!user.id) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessRoute(user, permission, allowedRoles)) {
    return <Navigate to={defaultRouteForRole(role)} replace />;
  }

  return children;
}

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
        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['customer']}><Dashboard /></ProtectedRoute>} />
        <Route path="/shop" element={<ProtectedRoute allowedRoles={['customer']}><Shop /></ProtectedRoute>} />
        <Route path="/referrals" element={<ProtectedRoute allowedRoles={['customer']}><Referrals /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute allowedRoles={['customer']}><WalletPage /></ProtectedRoute>} />
        <Route path="/wallet-overview" element={<ProtectedRoute allowedRoles={['customer']}><WalletOverview /></ProtectedRoute>} />
        <Route path="/transaction-history" element={<ProtectedRoute allowedRoles={['customer']}><TransactionHistory /></ProtectedRoute>} />
        <Route path="/withdraw-history" element={<ProtectedRoute allowedRoles={['customer']}><WithdrawHistory /></ProtectedRoute>} />
        <Route path="/withdrawals" element={<ProtectedRoute allowedRoles={['customer']}><WithdrawalsPage /></ProtectedRoute>} />
        <Route path="/rules" element={<ProtectedRoute allowedRoles={['customer']}><RulesPage /></ProtectedRoute>} />
        <Route path="/kyc" element={<ProtectedRoute allowedRoles={['customer']}><KYC /></ProtectedRoute>} />
        <Route path="/agreement" element={<ProtectedRoute allowedRoles={['customer']}><Agreement /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute allowedRoles={['customer']}><Profile /></ProtectedRoute>} />
        <Route path="/cashback-plan" element={<ProtectedRoute allowedRoles={['customer']}><CashbackPlan /></ProtectedRoute>} />
        <Route path="/cashback-application" element={<ProtectedRoute allowedRoles={['customer']}><CashbackApplication /></ProtectedRoute>} />
        <Route path="/product-request" element={<ProtectedRoute allowedRoles={['customer']}><ProductRequest /></ProtectedRoute>} />

        {/* Staff Panel */}
        <Route path="/staff" element={<ProtectedRoute allowedRoles={['staff']}><StaffDashboard /></ProtectedRoute>} />

        {/* Manager Panel */}
        <Route path="/manager" element={<ProtectedRoute allowedRoles={['manager']}><ManagerDashboard /></ProtectedRoute>} />

        {/* Advocate Panel */}
        <Route path="/advocate" element={<ProtectedRoute allowedRoles={['advocate']}><AdvocateDashboard /></ProtectedRoute>} />
        <Route path="/advocate-profile" element={<ProtectedRoute allowedRoles={['advocate']}><AdvocateProfile /></ProtectedRoute>} />

        {/* Admin Panel */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/wallets" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'staff']} permission="wallets_view"><WalletListAdmin /></ProtectedRoute>} />
        <Route path="/admin/cashbacks" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'staff']} permission="cashback_payouts"><CashbackPayouts /></ProtectedRoute>} />
        <Route path="/admin/export-payouts" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'staff']} permission="export_payouts"><ExportPayoutExcel /></ProtectedRoute>} />
        <Route path="/admin/payout-reconciliation" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'staff']} permission="payout_reconciliation"><PayoutReconciliation /></ProtectedRoute>} />
        <Route path="/admin/payout-reports" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'staff']} permission="payout_reports"><PayoutReports /></ProtectedRoute>} />
        <Route path="/admin/inventory" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'staff']} permission="inventory"><Inventory /></ProtectedRoute>} />
        <Route path="/admin/tally" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'staff']} permission="tally_export"><TallyExport /></ProtectedRoute>} />
        <Route path="/admin/tally-integration" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'staff']} permission="tally_integration"><TallyIntegration /></ProtectedRoute>} />
        <Route path="/admin/reports/:type" element={<ProtectedRoute allowedRoles={['admin', 'manager', 'staff']} permission="fiscal_reports"><AdminReports /></ProtectedRoute>} />
        <Route path="/admin/withdrawals" element={<ProtectedRoute allowedRoles={['admin', 'staff']} permission="withdrawals"><AdminDashboard /></ProtectedRoute>} />

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
