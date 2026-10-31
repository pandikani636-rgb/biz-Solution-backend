import express from 'express';
import {
  getDashboardOverview,
  getRevenueAndBookingCharts,
  exportBookingsCSV,
  generateDynamicReport,
} from '../controllers/statsController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/overview', getDashboardOverview);
router.get('/charts', getRevenueAndBookingCharts);
router.get('/export-bookings', exportBookingsCSV);
router.post('/dynamic-report', generateDynamicReport);
router.get('/dynamic-report', generateDynamicReport);

export default router;
