import express from 'express';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getPurchaseInvoices,
  getPurchaseInvoiceById,
  createPurchaseInvoice,
  updatePurchaseInvoice,
  deletePurchaseInvoice,
  recordPurchasePayment,
  getPurchaseReports,
} from '../controllers/purchaseController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Protect all purchase management routes for admin & staff
router.use(authenticate, authorize(ROLES.ADMIN, ROLES.STAFF));

// Supplier Routes
router.route('/suppliers')
  .get(getSuppliers)
  .post(createSupplier);

router.route('/suppliers/:id')
  .get(getSupplierById)
  .put(updateSupplier)
  .delete(deleteSupplier);

// Purchase Invoice Routes
router.route('/invoices')
  .get(getPurchaseInvoices)
  .post(createPurchaseInvoice);

router.route('/invoices/:id')
  .get(getPurchaseInvoiceById)
  .put(updatePurchaseInvoice)
  .delete(deletePurchaseInvoice);

// Payment Recording
router.post('/invoices/:id/payments', recordPurchasePayment);

// Analytics & Reports
router.get('/reports', getPurchaseReports);

export default router;
