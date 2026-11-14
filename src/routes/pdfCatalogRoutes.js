import express from 'express';
import {
  uploadPdfCatalog,
  getPublicPdfCatalog,
  getAdminPdfCatalogs,
  deletePdfCatalog,
  reprocessPdfCatalog,
  getPdfProductByPartNumber,
} from '../controllers/pdfCatalogController.js';
import { upload } from '../middleware/upload.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();

// Public route to view categorized PDF data with search
router.get('/', getPublicPdfCatalog);

// Public route to view a specific PDF catalog product by part number
router.get('/product/:partNumber', getPdfProductByPartNumber);

// Admin PDF Catalog Management
router.post('/upload', authenticate, authorize(ROLES.ADMIN), upload.single('pdf'), uploadPdfCatalog);
router.post('/admin/reprocess/:id', authenticate, authorize(ROLES.ADMIN), reprocessPdfCatalog);
router.get('/admin', authenticate, authorize(ROLES.ADMIN), getAdminPdfCatalogs);
router.delete('/admin/:id', authenticate, authorize(ROLES.ADMIN), deletePdfCatalog);

export default router;
