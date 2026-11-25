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
        contactPhone: '+91 74184 23238',
        address: '45B/16 Noorullah Mall, Oothumalai Paradesimadam Street, Srivilliputtur, Virudhunagar Dist, Tamilnadu - 626125',
        googleMapsLocation: '45B/16 Noorullah Mall, Oothumalai Paradesimadam Street, Srivilliputtur, Virudhunagar Dist, Tamilnadu - 626125',
        footerDescription: 'Authorized industrial distributor for world-class mechanical transmission belts, bearings, taper pulleys, and industrial equipment.',
        proprietorName: 'Karthick Kumar K',
        gstin: '33HONPK5547G2ZK',
      });
    } else {
      // Ensure default values for new fields if not already set
      let needsSave = false;
      if (!settings.contactPhone || settings.contactPhone.includes('98426')) {
        settings.contactPhone = '+91 74184 23238';
        needsSave = true;
      }
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
        settings.proprietorName = 'Karthick Kumar K';
        needsSave = true;
      }
      if (!settings.gstin) {
        settings.gstin = '33HONPK5547G2ZK';
        needsSave = true;
      }
      if (settings.defaultTaxRate === undefined || settings.defaultTaxRate === null) {
        settings.defaultTaxRate = 18;
        needsSave = true;
      }
      if (settings.existingUserDiscountPercentage === undefined || settings.existingUserDiscountPercentage === null) {
        settings.existingUserDiscountPercentage = 48;
        needsSave = true;
      }
      if (settings.newUserDiscountPercentage === undefined || settings.newUserDiscountPercentage === null) {
        settings.newUserDiscountPercentage = 40;
        needsSave = true;
      }
      if (!settings.categoryDiscounts || (settings.categoryDiscounts instanceof Map ? settings.categoryDiscounts.size === 0 : Object.keys(settings.categoryDiscounts).length === 0)) {
        settings.categoryDiscounts = {
          'Belts': 48,
          'Power Transmission Belts': 48,
          'Pulleys': 25,
          'Bush Pulleys & Taper Bushes': 25,
          'Bearings': 48,
          'Industrial Bearings': 48,
        };
        needsSave = true;
      }
      if (!settings.brandDiscounts || (settings.brandDiscounts instanceof Map ? settings.brandDiscounts.size === 0 : Object.keys(settings.brandDiscounts).length === 0)) {
        settings.brandDiscounts = {
          'PIX': 48,
          'JK Fenner': 25,
          'Diamond': 48,
          'NBC': 48,
          'FAG': 48,
          'SKF': 10,
          'Timken': 48,
          'NTN': 48,
          'Siemens': 48,
          'Crompton': 48,
          'ABB': 48,
          'Bharat Bijlee': 48,
          'Shanthi Gears': 48,
          'Vignesh Gears': 48,
        };
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
