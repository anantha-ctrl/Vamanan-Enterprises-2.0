const ADMIN_ROLES = ['admin'];

export const ADMIN_PERMISSIONS = [
  'overview',
  'investments',
  'investment_history',
  'inventory',
  'users',
  'genealogy',
  'wallets_view',
  'wallet_adj',
  'kyc',
  'withdrawals',
  'tickets',
  'market_rates',
  'recruitment',
  'settings',
  'fiscal_reports',
  'cashback_reports',
  'withdrawal_reports',
  'transaction_reports',
  'investment_reports',
  'referral_reports',
  'payout_reports',
  'payout_reports_module',
  'cashback_payouts',
  'tally_export',
  'tally_integration',
  'export_payouts',
  'payout_reconciliation',
  'wallets_list',
  'broadcast',
  'agreements',
];

export const parsePermissions = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [];

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }

  return [];
};

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

export const hasPermission = (user, permissionId) => {
  const role = user?.role || 'customer';
  if (ADMIN_ROLES.includes(role)) return true;
  if (!permissionId) return false;

  const permissions = parsePermissions(user?.permissions);
  if (permissions.length === 0) return permissionId === 'overview';

  return permissions.includes(permissionId);
};

export const canAccessRoute = (user, permissionId, allowedRoles = []) => {
  const role = user?.role || 'customer';
  if (allowedRoles.includes(role) && !permissionId) return true;
  if (ADMIN_ROLES.includes(role)) return true;
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) return false;
  return hasPermission(user, permissionId);
};

export const defaultRouteForRole = (role) => {
  if (role === 'admin') return '/admin';
  if (role === 'manager') return '/manager';
  // Staff use the admin dashboard, permission-filtered to only their granted tabs.
  if (role === 'staff') return '/admin';
  if (role === 'advocate') return '/advocate';
  if (role === 'customer') return '/dashboard';
  return '/login';
};
