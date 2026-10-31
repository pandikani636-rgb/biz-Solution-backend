import mongoose from 'mongoose';

const siteSettingSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      default: 'BizZolution',
    },
    tagLine: {
      type: String,
      default: 'Your Comprehensive Business & Lifestyle Solutions Partner',
    },
    logo: {
      type: String,
      default: '',
    },
    favicon: {
      type: String,
      default: '',
    },
    contactEmail: {
      type: String,
      default: 'contact@bizzolution.com',
    },
    contactPhone: {
      type: String,
      default: '+91 98765 43210',
    },
    address: {
      type: String,
      default: 'Tech Hub Boulevard, Cyber City, Bangalore - 560100',
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
      title: { type: String, default: 'BizZolution | All-in-One Multi-Service Platform' },
      description: {
        type: String,
        default: 'Discover corporate, travel, recharge, logistics, and legal services in one seamless portal.',
      },
    },
    aboutUsSection: {
      title: { type: String, default: 'Empowering Businesses and Individuals with End-to-End Solutions' },
      description: {
        type: String,
        default: 'BizZolution connects modern customers with verified enterprise services, seamless automated workflows, and trusted delivery experts across the nation.',
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
