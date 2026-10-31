import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { isCloudinaryConfigured, cloudinary } from '../config/cloudinary.js';

// Safe upload directory for both local development and serverless (Vercel)
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const uploadDir = isServerless
  ? path.join(os.tmpdir(), 'bizzolution_uploads')
  : path.resolve(process.cwd(), 'public', 'uploads');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn('[Upload Storage] Notice: Could not create upload directory:', err.message);
}

// Multer storage
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'image/gif',
    'application/pdf',
  ];
  if (allowedMimeTypes.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.pdf')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WEBP images and PDF documents are allowed.'), false);
  }
};

export const upload = multer({
  storage: diskStorage,
  limits: { fileSize: 35 * 1024 * 1024 }, // 35MB limit to support 20MP high-res images and large PDF catalogs
  fileFilter,
});

// Helper to get public URL for an uploaded file
export const processUploadedFile = async (file, req) => {
  if (!file) return null;

  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'bizzolution',
        use_filename: true,
      });
      // Optionally clean up local temp file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return result.secure_url;
    } catch (error) {
      console.error('[Cloudinary Upload Error]', error.message);
      // Fallback to local URL
    }
  }

  // Fallback to local file URL
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${file.filename}`;
};
