import mongoose from 'mongoose';

const siteSettingSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      default: 'Balumuni and Associates',
    },
    siteNameFirstPart: {
      type: String,
      default: 'Balumuni',
    },
    siteNameRemainingPart: {
      type: String,
      default: 'and Associates',
    },
    tagLine: {
      type: String,
      default: 'Industrial Power Transmission & Bearings Solutions Partner',
    },
    logo: {
      type: String,
      default: '/bm-logo.png',
    },
    favicon: {
      type: String,
      default: '/bm-logo.png',
    },
    contactEmail: {
      type: String,
      default: 'balumuniandassociates@gmail.com',
    },
    contactPhone: {
      type: String,
      default: '+91 74184 23238',
    },
    address: {
      type: String,
      default: '45B/16 Noorullah Mall, Oothumalai Paradesimadam Street, Srivilliputtur, Virudhunagar Dist, Tamilnadu - 626125',
    },
    googleMapsLocation: {
      type: String,
      default: '45B/16 Noorullah Mall, Oothumalai Paradesimadam Street, Srivilliputtur, Virudhunagar Dist, Tamilnadu - 626125',
    },
    googleMapsEmbedUrl: {
      type: String,
      default: '',
    },
    footerDescription: {
      type: String,
      default: 'Authorized industrial distributor for world-class mechanical transmission belts, bearings, taper pulleys, and industrial equipment.',
    },
    proprietorName: {
      type: String,
      default: 'K. Karthick Kumar',
    },
    gstin: {
      type: String,
      default: '33HONPK5547G2ZK',
    },
    businessHours: {
      type: String,
      default: 'Mon - Sat: 9:00 AM - 7:00 PM',
    },
    currency: {
      type: String,
      default: 'INR',
    },
    currencySymbol: {
      type: String,
      default: '₹',
    },
    defaultTaxRate: {
      type: Number,
      default: 18,
    },
    socialLinks: {
      facebook: { type: String, default: 'https://facebook.com' },
      twitter: { type: String, default: 'https://twitter.com' },
      linkedin: { type: String, default: 'https://linkedin.com' },
      instagram: { type: String, default: 'https://instagram.com' },
      youtube: { type: String, default: 'https://youtube.com' },
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    metaDefaults: {
      title: { type: String, default: 'Balumuni and Associates | Industrial Power Transmission & Bearings' },
      description: {
        type: String,
        default: 'Authorised dealers and stockists of industrial belts, bearings, gears, and motors.',
      },
    },
    aboutUsSection: {
      title: { type: String, default: 'Balumuni and Associates - Quality Power Transmission & Bearings' },
      description: {
        type: String,
        default: 'Supplying leading industrial brands like PIX, JK Fenner, SKF, FAG, Timken, NTN, Shanthi Gears, Siemens, ABB, Bharat Bijlee with reliable stock and technical support.',
      },
      yearsOfExperience: { type: Number, default: 12 },
      clientsServed: { type: Number, default: 25000 },
      satisfactionRate: { type: Number, default: 99 },
    },
  },
  {
    timestamps: true,
  }
);

export const SiteSetting = mongoose.model('SiteSetting', siteSettingSchema);
