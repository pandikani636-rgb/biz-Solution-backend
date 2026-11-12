import { Advertisement } from '../models/Advertisement.js';

export const DEFAULT_ADVERTISEMENT = {
  title: 'Special Industrial Discount Alert!',
  badgeText: 'Limited Period Offer',
  content: 'Get up to 48% OFF on authentic industrial V-belts, precision bearings, and power transmission spares. Instant quote generation & genuine MTC certified delivery.',
  imageUrl: '/banners/img2.png',
  linkUrl: '/rfq',
  ctaText: 'Claim Your Quote Now',
  isActive: true,
  priority: 10,
};

export const getActiveAdvertisement = async (req, res, next) => {
  try {
    let ad = await Advertisement.findOne({ isActive: true }).sort({ priority: -1, updatedAt: -1 });
    
    // Seed default advertisement if none exist
    if (!ad) {
      const count = await Advertisement.countDocuments();
      if (count === 0) {
        ad = await Advertisement.create(DEFAULT_ADVERTISEMENT);
      }
    }

    res.json({
      success: true,
      data: ad,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllAdvertisements = async (req, res, next) => {
  try {
    let ads = await Advertisement.find().sort({ priority: -1, createdAt: -1 });
    if (ads.length === 0) {
      const defaultAd = await Advertisement.create(DEFAULT_ADVERTISEMENT);
      ads = [defaultAd];
    }
    res.json({
      success: true,
      data: ads,
    });
  } catch (error) {
    next(error);
  }
};

export const createAdvertisement = async (req, res, next) => {
  try {
    const { title, content, imageUrl, linkUrl, ctaText, isActive, priority, badgeText } = req.body;
    if (!title || !imageUrl) {
      return res.status(400).json({ success: false, message: 'Title and image URL are required.' });
    }

    const ad = await Advertisement.create({
      title: String(title).trim(),
      content: String(content || '').trim(),
      imageUrl: String(imageUrl).trim(),
      linkUrl: String(linkUrl || '/services').trim(),
      ctaText: String(ctaText || 'Explore Now').trim(),
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      priority: Number(priority) || 1,
      badgeText: String(badgeText || 'Special Offer').trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Advertisement created successfully',
      data: ad,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdvertisement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ad = await Advertisement.findById(id);
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Advertisement not found.' });
    }

    const { title, content, imageUrl, linkUrl, ctaText, isActive, priority, badgeText } = req.body;
    if (title !== undefined) ad.title = String(title).trim();
    if (content !== undefined) ad.content = String(content).trim();
    if (imageUrl !== undefined) ad.imageUrl = String(imageUrl).trim();
    if (linkUrl !== undefined) ad.linkUrl = String(linkUrl).trim();
    if (ctaText !== undefined) ad.ctaText = String(ctaText).trim();
    if (isActive !== undefined) ad.isActive = Boolean(isActive);
    if (priority !== undefined) ad.priority = Number(priority);
    if (badgeText !== undefined) ad.badgeText = String(badgeText).trim();

    await ad.save();

    res.json({
      success: true,
      message: 'Advertisement updated successfully',
      data: ad,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAdvertisement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ad = await Advertisement.findByIdAndDelete(id);
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Advertisement not found.' });
    }
    res.json({
      success: true,
      message: 'Advertisement deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const toggleAdvertisement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ad = await Advertisement.findById(id);
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Advertisement not found.' });
    }
    ad.isActive = !ad.isActive;
    await ad.save();

    res.json({
      success: true,
      message: `Advertisement ${ad.isActive ? 'activated' : 'deactivated'} successfully`,
      data: ad,
    });
  } catch (error) {
    next(error);
  }
};
