import { SiteSetting } from '../models/SiteSetting.js';

export const getSettings = async (req, res, next) => {
  try {
    let settings = await SiteSetting.findOne();
    if (!settings) {
      settings = await SiteSetting.create({
        siteName: 'Balumuni and Associates',
        siteNameFirstPart: 'Balumuni',
        siteNameRemainingPart: 'and Associates',
        logo: '/bm-logo.png',
        contactEmail: 'balumuniandassociates@gmail.com',
        contactPhone: '+91-74184 23238 / +91 98426 70320',
        address: '45B/16 Noorullah Mall, Oothumalai Paradesimadam Street, Srivilliputtur, Virudhunagar Dist, Tamilnadu - 626125',
        googleMapsLocation: '45B/16 Noorullah Mall, Oothumalai Paradesimadam Street, Srivilliputtur, Virudhunagar Dist, Tamilnadu - 626125',
        footerDescription: 'Authorized industrial distributor for world-class mechanical transmission belts, bearings, taper pulleys, and industrial equipment.',
        proprietorName: 'K. Karthick Kumar',
        gstin: '33HONPK5547G2ZK',
      });
    } else {
      // Ensure default values for new fields if not already set
      let needsSave = false;
      if (!settings.siteNameFirstPart) {
        settings.siteNameFirstPart = 'Balumuni';
        needsSave = true;
      }
      if (!settings.siteNameRemainingPart) {
        settings.siteNameRemainingPart = 'and Associates';
        needsSave = true;
      }
      if (!settings.googleMapsLocation) {
        settings.googleMapsLocation = settings.address || '45B/16 Noorullah Mall, Oothumalai Paradesimadam Street, Srivilliputtur, Virudhunagar Dist, Tamilnadu - 626125';
        needsSave = true;
      }
      if (!settings.footerDescription) {
        settings.footerDescription = 'Authorized industrial distributor for world-class mechanical transmission belts, bearings, taper pulleys, and industrial equipment.';
        needsSave = true;
      }
      if (!settings.proprietorName) {
        settings.proprietorName = 'K. Karthick Kumar';
        needsSave = true;
      }
      if (!settings.gstin) {
        settings.gstin = '33HONPK5547G2ZK';
        needsSave = true;
      }
      if (needsSave) {
        await settings.save();
      }
    }
    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    let settings = await SiteSetting.findOne();
    if (!settings) {
      settings = new SiteSetting(req.body);
    } else {
      Object.assign(settings, req.body);
    }
    await settings.save();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};
