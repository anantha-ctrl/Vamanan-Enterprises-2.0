const LABELS = {
  status: {
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
    verified: 'Verified',
    ratified: 'Signed by Customer',
    completed: 'Completed',
    success: 'Successful',
    failed: 'Failed',
    suspended: 'Suspended',
    open: 'Open',
    closed: 'Closed',
    processing: 'Processing',
    cancelled: 'Cancelled',
    paid: 'Paid',
    unpaid: 'Unpaid',
  },
  role: {
    admin: 'Administrator',
    manager: 'Manager',
    staff: 'Staff',
    advocate: 'Advocate',
    customer: 'Customer',
    user: 'Customer',
    superadmin: 'Super Administrator',
  },
  transactionType: {
    credit: 'Money Added',
    debit: 'Money Deducted',
    withdrawal: 'Withdrawal',
    cashback: 'Cashback',
    commission: 'Referral Commission',
    payout: 'Payout',
    wallet_adjustment: 'Wallet Adjustment',
    investment: 'Purchase',
    purchase: 'Purchase',
  },
  assetType: {
    gold: 'Gold',
    silver: 'Silver',
    product: 'Product',
    bullion: 'Bullion',
    coin: 'Coin',
    bar: 'Bar',
  },
  paymentMethod: {
    upi: 'UPI',
    bank_transfer: 'Bank Transfer',
    bank: 'Bank Transfer',
    cash: 'Cash',
    wallet: 'Wallet',
    neft: 'NEFT',
    rtgs: 'RTGS',
    imps: 'IMPS',
  },
  kycStatus: {
    pending: 'KYC Pending',
    verified: 'KYC Verified',
    rejected: 'KYC Rejected',
    not_found: 'KYC Not Submitted',
    unverified: 'KYC Not Verified',
  },
  agreementType: {
    gold_purchase_agreement: 'Gold Purchase Agreement',
    silver_purchase_agreement: 'Silver Purchase Agreement',
    institutional_gold_agreement: 'Gold Purchase Agreement',
  },
};

const normalize = (value) => String(value ?? '')
  .trim()
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/[_-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .toLowerCase();

const titleCase = (value) => normalize(value)
  .split(' ')
  .filter(Boolean)
  .map((word) => {
    if (['upi', 'id', 'kyc', 'utr', 'pan', 'ifsc', 'neft', 'rtgs', 'imps'].includes(word)) {
      return word.toUpperCase();
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  })
  .join(' ');

export const humanize = (value, category) => {
  if (value === null || value === undefined || value === '') return 'Not Available';
  const key = normalize(value).replace(/\s+/g, '_');
  return LABELS[category]?.[key] || titleCase(value);
};

export const humanStatus = (value) => humanize(value, 'status');
export const humanRole = (value) => humanize(value, 'role');
export const humanTransactionType = (value) => humanize(value, 'transactionType');
export const humanAssetType = (value) => humanize(value, 'assetType');
export const humanPaymentMethod = (value) => humanize(value, 'paymentMethod');
export const humanKycStatus = (value) => humanize(value, 'kycStatus');
export const humanAgreementType = (value) => humanize(value, 'agreementType');
