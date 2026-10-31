export const ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  STAFF: 'staff',
};

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const ENQUIRY_STATUS = {
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  QUOTED: 'quoted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

export const DISCOUNT_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
};

export const NOTIFICATION_TYPES = {
  BOOKING: 'booking',
  PAYMENT: 'payment',
  ENQUIRY: 'enquiry',
  SYSTEM: 'system',
};
