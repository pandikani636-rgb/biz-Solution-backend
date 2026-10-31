import { processUploadedFile } from '../middleware/upload.js';

export const uploadSingleImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    const fileUrl = await processUploadedFile(req.file, req);

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      url: fileUrl,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadMultipleImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please upload at least one image file' });
    }

    const uploadPromises = req.files.map((file) => processUploadedFile(file, req));
    const urls = await Promise.all(uploadPromises);

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      urls,
    });
  } catch (error) {
    next(error);
  }
};
