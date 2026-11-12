import { Banner } from '../models/Banner.js';

export const getActiveBanners = async (req, res, next) => {
  try {
    const now = new Date();
    const banners = await Banner.find({
      isActive: true,
      $or: [{ startDate: { $lte: now }, endDate: { $gte: now } }, { endDate: null }],
    }).sort({ displayOrder: 1, createdAt: -1 });

    res.json({ success: true, data: banners });
  } catch (error) {
    next(error);
  }
};

export const getAllBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ displayOrder: 1, createdAt: -1 });
    res.json({ success: true, data: banners });
  } catch (error) {
    next(error);
  }
};

export const createBanner = async (req, res, next) => {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json({ success: true, message: 'Banner created successfully', data: banner });
  } catch (error) {
    next(error);
  }
};



export const updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, message: 'Banner updated successfully', data: banner });
  } catch (error) {
    next(error);
  }
};

export const deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    next(error);
  }
};
