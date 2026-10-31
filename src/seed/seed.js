import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { User } from '../models/User.js';
import { ServiceCategory } from '../models/ServiceCategory.js';
import { Service } from '../models/Service.js';
import { ServicePackage } from '../models/ServicePackage.js';
import { Banner } from '../models/Banner.js';
import { Testimonial } from '../models/Testimonial.js';
import { FAQ } from '../models/FAQ.js';
import { Coupon } from '../models/Coupon.js';
import { SiteSetting } from '../models/SiteSetting.js';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { Invoice } from '../models/Invoice.js';
import { ContactEnquiry } from '../models/ContactEnquiry.js';
import { ROLES, BOOKING_STATUS, PAYMENT_STATUS, DISCOUNT_TYPES } from '../config/constants.js';
import { ensureMongoRunning } from '../config/mongoLauncher.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/biz_zolution';

export const seedDatabase = async () => {
  try {
    if (mongoose.connection.readyState < 1) {
      if (!process.env.VERCEL) {
        await ensureMongoRunning(MONGODB_URI);
      }
      await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    }
    console.log(`[Seed] Connected to MongoDB at ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);

    // Clear existing collections for a clean, deterministic seed
    await Promise.all([
      User.deleteMany(),
      ServiceCategory.deleteMany(),
      Service.deleteMany(),
      ServicePackage.deleteMany(),
      Banner.deleteMany(),
      Testimonial.deleteMany(),
      FAQ.deleteMany(),
      Coupon.deleteMany(),
      SiteSetting.deleteMany(),
      Booking.deleteMany(),
      Payment.deleteMany(),
      Invoice.deleteMany(),
      ContactEnquiry.deleteMany(),
    ]);
    console.log('[Seed] Cleared existing database records.');

    // 1. Create Users (Admin & Customer)
    const admin = await User.create({
      name: 'Karthick Kumar K (Admin)',
      email: 'admin@bizzolution.com',
      password: 'Admin@123456',
      phone: '+91 98765 00001',
      role: ROLES.ADMIN,
      isActive: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      address: {
        street: 'Industrial Complex, Phase II',
        city: 'Coimbatore',
        state: 'Tamil Nadu',
        postalCode: '641018',
        country: 'India',
      },
    });

    const customer = await User.create({
      name: 'Ramesh Patel (Procurement Head)',
      email: 'customer@example.com',
      password: 'Customer@123456',
      phone: '+91 98765 43210',
      role: ROLES.CUSTOMER,
      isActive: true,
      isNewUser: false,
      pricingTier: 'existing_standard',
      markupPercentage: 0,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      address: {
        street: 'Plot 42, GIDC Estate',
        city: 'Ahmedabad',
        state: 'Gujarat',
        postalCode: '382445',
        country: 'India',
      },
    });

    const newCustomer = await User.create({
      name: 'Senthil Kumar (Sri Meenakshi Mills)',
      email: 'senthil.mills@example.com',
      password: 'Customer@123456',
      phone: '+91 94433 11223',
      role: ROLES.CUSTOMER,
      isActive: true,
      isNewUser: true,
      pricingTier: 'new_user',
      markupPercentage: 5,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      address: {
        street: '12 Bypass Road',
        city: 'Madurai',
        state: 'Tamil Nadu',
        postalCode: '625016',
        country: 'India',
      },
    });

    console.log('[Seed] Created default Admin and Customer accounts.');

    // 2. Create Site Settings
    await SiteSetting.create({
      siteName: 'BizZolution Industrial',
      tagLine: 'Authorized Industrial Power Transmission & Bearings Distributor',
      contactEmail: 'sales@bizzolution.com',
      contactPhone: '+91 98765 43210',
      address: 'Industrial Estate, Near Delhivery Logistics Hub, India',
      businessHours: 'Mon - Sat: 8:30 AM - 7:30 PM IST',
      currency: 'INR',
      currencySymbol: '₹',
      defaultTaxRate: 18,
      socialLinks: {
        facebook: 'https://facebook.com/bizzolution',
        twitter: 'https://twitter.com/bizzolution',
        linkedin: 'https://linkedin.com/company/bizzolution',
        instagram: 'https://instagram.com/bizzolution',
      },
      aboutUsSection: {
        title: 'India’s Leading Industrial Bearings & Transmission Solutions Partner',
        description:
          'BizZolution is a premier authorized stockist and B2B distributor of world-class industrial mechanical components. We supply 100% genuine Bearings, Industrial V-Belts, and Taper Lock Bush Pulleys from PIX, NBC, HCH, Fenner, Timken, and SKF. We offer 45% - 48% off MRP with free Delhivery freight on major brands, and authentic SKF bearings with flat 10% discount and full traceability.',
        yearsOfExperience: 18,
        clientsServed: 12500,
        satisfactionRate: 99.8,
      },
    });

    // 3. Create Categories (Sections)
    const catBearings = await ServiceCategory.create({
      name: 'Industrial Bearings',
      slug: 'bearings',
      description: 'Precision deep groove ball bearings, angular contact bearings, shielded ZZ, C3 clearance, and matched sets from NBC, HCH, Timken, and SKF.',
      image: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
      icon: 'CircleDot',
      displayOrder: 1,
    });

    const catBelts = await ServiceCategory.create({
      name: 'Power Transmission Belts',
      slug: 'belts',
      description: 'Heavy duty classical V-belts (C Section), metric wedge belts (SPC), 8V high capacity belts, and power transmission belts from PIX and Fenner.',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      icon: 'RotateCw',
      displayOrder: 2,
    });

    const catPulleys = await ServiceCategory.create({
      name: 'Bush Pulleys & Taper Bushes',
      slug: 'bush-pulleys',
      description: 'Dynamically balanced Fenner taper lock pulleys, standard grooves, and precision 2517 taper lock bushes for industrial shafts.',
      image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
      icon: 'Cog',
      displayOrder: 3,
    });

    console.log('[Seed] Created 3 Industrial Product Categories.');

    // Helper for product seeding
    const productsData = [
      // ---------------------------------------------
      // PIX - MAKE (BELT SECTION) - 46% OFF MRP, DELHIVERY INCLUDED
      // ---------------------------------------------
      {
        name: 'PIX SPC 2360 Wedge Belt',
        partNumber: 'SPC 2360',
        brand: 'PIX',
        section: 'Belt',
        category: catBelts._id,
        mrp: 1850,
        discountPercentage: 46,
        basePrice: 999,
        discountPrice: 999,
        deliveryIncluded: true,
        origin: 'Standard',
        serviceType: 'belt',
        shortDescription: 'PIX Metric Wedge V-Belt SPC section, pitch length 2360 mm. Heat and oil resistant with antistatic properties.',
        fullDescription: 'PIX SPC 2360 Wedge Belts are engineered for high-power, high-torque industrial transmissions. Built with specially treated high-tensile polyester cords, providing superior resistance to elongation, shock loads, and high ambient operating temperatures. Free nationwide Delhivery included.',
        mainImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        features: [
          'High power transmission capability (up to 3x standard classical belts)',
          'SPC Section: Top Width 22mm, Thickness 18mm, Pitch Length 2360mm',
          '46% Discount from official MRP with Free Delhivery freight',
          'Anti-static and oil-resistant synthetic chloroprene rubber',
          'Meets ISO 4184 & DIN 7753 standards',
        ],
        specifications: {
          'Belt Section': 'SPC Wedge',
          'Pitch Length (Lp)': '2360 mm',
          'Top Width': '22 mm',
          'Thickness': '18 mm',
          'Construction': 'Wrapped Raw-Edge Wedge',
          'Make / Brand': 'PIX Transmissions Ltd',
          'Freight': 'Delhivery Charges Included',
        },
        packages: [
          { name: 'Single Belt Pack', price: 999, discountPrice: 999, duration: 'Immediate Dispatch', features: ['1x PIX SPC 2360 Belt', 'Free Delhivery', 'Manufacturer Warranty'], isPopular: true },
          { name: 'Box of 5 Belts (Industrial Pack)', price: 4799, discountPrice: 4799, duration: 'Immediate Dispatch', features: ['5x PIX SPC 2360 Belts', 'Additional 4% bulk savings', 'Priority Delhivery Air Cargo', 'Factory MTC Certificate'], isPopular: false },
        ],
      },
      {
        name: 'PIX 8V-1900 Heavy Duty V-Belt',
        partNumber: '8V-1900',
        brand: 'PIX',
        section: 'Belt',
        category: catBelts._id,
        mrp: 5400,
        discountPercentage: 46,
        basePrice: 2916,
        discountPrice: 2916,
        deliveryIncluded: true,
        origin: 'Standard',
        serviceType: 'belt',
        shortDescription: 'PIX Heavy Duty 8V Deep Wedge V-Belt, 190.0 inch effective length. Maximum power rating for heavy crushers and heavy drives.',
        fullDescription: 'PIX 8V-1900 is the pinnacle of high-torque industrial narrow wedge belts. Designed specifically for extra-heavy duty machinery like rock crushers, mining mills, hammer mills, and industrial fans. Formulated with polychloroprene compound and treated aramid/polyester tensile cords.',
        mainImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        features: [
          'Narrow Deep Wedge 8V cross-section: 1.0 inch (25mm) top width, 0.9 inch (23mm) height',
          'Effective Length: 190.0 inches (4826 mm)',
          '46% Discount off official MRP with Delhivery delivery charge included',
          'Extreme resistance to shock-loads and abrasive mill dust',
          '100% Genuine PIX manufacturer guarantee',
        ],
        specifications: {
          'Belt Section': '8V Heavy Wedge',
          'Effective Length': '190.0 inches (4826 mm)',
          'Top Width': '25.4 mm (1.0 inch)',
          'Belt Height': '23.0 mm',
          'Make / Brand': 'PIX Transmissions Ltd',
          'Application': 'Crushers, Mining, Rolling Mills, Industrial Pumps',
          'Freight': 'Delhivery Charges Included',
        },
        packages: [
          { name: 'Single 8V Heavy Belt', price: 2916, discountPrice: 2916, duration: 'Immediate Dispatch', features: ['1x PIX 8V-1900 Belt', 'Free Delhivery Delivery', 'Test Certificate'], isPopular: true },
          { name: 'Matched Set of 3 Belts', price: 8499, discountPrice: 8499, duration: 'Immediate Dispatch', features: ['3x Factory Matched PIX 8V-1900 Belts', 'Precise length tolerance for multi-groove pulleys', 'Priority Express Dispatch'], isPopular: false },
        ],
      },
      {
        name: 'PIX SPC PT 3150 Power Transmission Belt',
        partNumber: 'SPC PT 3150',
        brand: 'PIX',
        section: 'Belt',
        category: catBelts._id,
        mrp: 2480,
        discountPercentage: 46,
        basePrice: 1339,
        discountPrice: 1339,
        deliveryIncluded: true,
        origin: 'Standard',
        serviceType: 'belt',
        shortDescription: 'PIX Power Transmission Wedge Belt SPC PT 3150 mm pitch length. Heavy duty continuous industrial drive belt.',
        fullDescription: 'Engineered for extended center distance industrial drives, the PIX SPC PT 3150 delivers exceptional torsional stability and torque transfer efficiency. Includes special abrasion-resistant fabric wrap and pre-stretched polyester cords.',
        mainImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        features: [
          'Pitch Length: 3150 mm (SPC Section)',
          '46% Discount from list price with Delhivery freight included',
          'Low elongation cord construction ensures minimal re-tensioning',
          'Resistant to thermal degradation up to 85°C',
        ],
        specifications: {
          'Belt Section': 'SPC Power Transmission (PT)',
          'Pitch Length': '3150 mm',
          'Top Width': '22 mm',
          'Thickness': '18 mm',
          'Make / Brand': 'PIX Transmissions Ltd',
          'Freight': 'Delhivery Charges Included',
        },
        packages: [
          { name: 'Single Belt Unit', price: 1339, discountPrice: 1339, duration: 'Immediate Dispatch', features: ['1x PIX SPC PT 3150 Belt', 'Free Delhivery', 'OEM Warranty'], isPopular: true },
          { name: 'Set of 4 Belts', price: 5199, discountPrice: 5199, duration: 'Immediate Dispatch', features: ['4x Matched SPC PT 3150 Belts', 'Free Heavy Delhivery Dispatch', 'Factory Test Report'], isPopular: false },
        ],
      },
      {
        name: 'PIX C 70 Classical V-Belt',
        partNumber: 'c 70',
        brand: 'PIX',
        section: 'Belt',
        category: catBelts._id,
        mrp: 1120,
        discountPercentage: 46,
        basePrice: 605,
        discountPrice: 605,
        deliveryIncluded: true,
        origin: 'Standard',
        serviceType: 'belt',
        shortDescription: 'PIX Classical V-Belt C Section, inside length 70 inches (1778 mm). Reliable everyday power transmission.',
        fullDescription: 'The classic workhorse of industrial motor drives, the PIX C 70 classical wrapped V-belt offers dependable torque transmission across industrial machine tools, air compressors, agricultural machinery, and conveyor systems.',
        mainImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        features: [
          'C Section dimensions: Top width 22mm, Height 14mm, Inside Length 70 inches',
          '46% Discount off official MRP with free Delhivery freight',
          'Dual fabric wrapped jacket for maximum wear resistance',
          'ISO 9001 certified PIX manufacturing quality',
        ],
        specifications: {
          'Belt Section': 'C Classical',
          'Inside Length (Li)': '70 inches (1778 mm)',
          'Datum / Pitch Length': '1836 mm',
          'Top Width': '22 mm',
          'Thickness': '14 mm',
          'Make / Brand': 'PIX Transmissions Ltd',
          'Freight': 'Delhivery Charges Included',
        },
        packages: [
          { name: 'Single C 70 Belt', price: 605, discountPrice: 605, duration: 'Immediate Dispatch', features: ['1x PIX C 70 Belt', 'Free Delhivery', 'Full Warranty'], isPopular: true },
          { name: 'Pack of 5 Belts', price: 2899, discountPrice: 2899, duration: 'Immediate Dispatch', features: ['5x PIX C 70 Belts', 'Extra Bulk Discount', 'Fast Delhivery Dispatch'], isPopular: false },
        ],
      },

      // ---------------------------------------------
      // NBC - MAKE (BEARING SECTION) - 46% OFF MRP, DELHIVERY INCLUDED
      // ---------------------------------------------
      {
        name: 'NBC 6405ZZ C3 Bearing',
        partNumber: '6405zz c3',
        brand: 'NBC',
        section: 'Bearing',
        category: catBearings._id,
        mrp: 980,
        discountPercentage: 46,
        basePrice: 529,
        discountPrice: 529,
        deliveryIncluded: true,
        origin: 'Standard',
        serviceType: 'bearing',
        shortDescription: 'NBC Deep Groove Ball Bearing 6405ZZ C3. Heavy series ball bearing with metal shields and radial clearance C3.',
        fullDescription: 'NBC (National Engineering Industries Ltd.) 6405ZZ C3 is a premium heavy-series deep groove ball bearing engineered for electric motors, gearboxes, and heavy industrial drives where radial clearance C3 is required to accommodate thermal expansion.',
        mainImage: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
        features: [
          'Bore: 25 mm, Outer Diameter: 80 mm, Width: 21 mm (Heavy 6400 series)',
          'Dual metal shields (ZZ) prevent contaminant ingress while retaining factory grease',
          'C3 internal radial clearance for high-temperature and high-speed operation',
          '46% Discount off official NBC MRP with Delhivery delivery charge included',
          '100% Genuine NBC OEM packaging with laser etched traceability',
        ],
        specifications: {
          'Bearing Type': 'Deep Groove Ball Bearing (Heavy Series)',
          'Part Number': '6405-ZZ/C3',
          'Bore Diameter (d)': '25 mm',
          'Outer Diameter (D)': '80 mm',
          'Width (B)': '21 mm',
          'Clearance': 'C3 (Greater than Normal)',
          'Shielding': 'ZZ (Two Non-Contact Metal Shields)',
          'Make / Brand': 'NBC Bearings (NEI)',
          'Freight': 'Delhivery Charges Included',
        },
        packages: [
          { name: 'Single Bearing Pack', price: 529, discountPrice: 529, duration: 'Immediate Dispatch', features: ['1x NBC 6405ZZ C3 Bearing', 'Free Delhivery', 'Genuine NBC Seal'], isPopular: true },
          { name: 'Master Box of 10 Pcs', price: 4990, discountPrice: 4990, duration: 'Immediate Dispatch', features: ['10x NBC 6405ZZ C3 Bearings', 'OEM Factory Sealed Carton', 'Free Priority Delhivery', 'MTC Test Certificate'], isPopular: false },
        ],
      },

      // ---------------------------------------------
      // HCH - MAKE (BEARING SECTION) - 46% OFF MRP, DELHIVERY INCLUDED
      // ---------------------------------------------
      {
        name: 'HCH 6203 Deep Groove Ball Bearing',
        partNumber: '6203',
        brand: 'HCH',
        section: 'Bearing',
        category: catBearings._id,
        mrp: 145,
        discountPercentage: 46,
        basePrice: 78,
        discountPrice: 78,
        deliveryIncluded: true,
        origin: 'Standard',
        serviceType: 'bearing',
        shortDescription: 'HCH 6203 Open Deep Groove Ball Bearing (17x40x12 mm). High precision electric motor quality (EMQ).',
        fullDescription: 'HCH 6203 is an open-type high-precision deep groove ball bearing designed for low-noise electric motors, pulleys, fans, and power transmission shafts. Engineered with high-carbon chromium steel GCr15.',
        mainImage: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
        features: [
          'Dimensions: 17 mm Bore x 40 mm OD x 12 mm Width',
          'Open design for circulating oil or custom grease lubrication',
          '46% Discount off MRP list including Delhivery freight',
          'Low vibration (Z2/V2) and high rotational speed capability',
        ],
        specifications: {
          'Bearing Type': 'Deep Groove Ball Bearing',
          'Part Number': '6203',
          'Bore (d)': '17 mm',
          'Outer Diameter (D)': '40 mm',
          'Width (B)': '12 mm',
          'Closure': 'Open',
          'Make / Brand': 'HCH Bearings',
          'Freight': 'Delhivery Included',
        },
        packages: [
          { name: 'Box of 10 Pcs', price: 780, discountPrice: 780, duration: 'Immediate Dispatch', features: ['10x HCH 6203 Bearings', 'Free Delhivery', 'Factory Sealed'], isPopular: true },
          { name: 'Wholesale Carton (100 Pcs)', price: 7200, discountPrice: 7200, duration: 'Immediate Dispatch', features: ['100x HCH 6203 Bearings', 'Factory Master Case', 'Bulk Commercial Discount', 'Free Delhivery Freight'], isPopular: false },
        ],
      },
      {
        name: 'HCH 6204 Deep Groove Ball Bearing',
        partNumber: '6204',
        brand: 'HCH',
        section: 'Bearing',
        category: catBearings._id,
        mrp: 180,
        discountPercentage: 46,
        basePrice: 97,
        discountPrice: 97,
        deliveryIncluded: true,
        origin: 'Standard',
        serviceType: 'bearing',
        shortDescription: 'HCH 6204 Open Ball Bearing (20x47x14 mm). Precision grade industrial shaft bearing.',
        fullDescription: 'The HCH 6204 open ball bearing provides smooth rotation, low friction, and high dynamic load capacity across general machinery, agricultural equipment, and automotive gearboxes.',
        mainImage: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
        features: [
          'Dimensions: 20 mm Bore x 47 mm OD x 14 mm Width',
          '46% Discount off list price with Delhivery charge included',
          'Super-finished raceways for whisper-quiet operation',
        ],
        specifications: {
          'Part Number': '6204',
          'Bore (d)': '20 mm',
          'Outer Diameter (D)': '47 mm',
          'Width (B)': '14 mm',
          'Closure': 'Open',
          'Make / Brand': 'HCH Bearings',
          'Freight': 'Delhivery Included',
        },
        packages: [
          { name: 'Box of 10 Pcs', price: 970, discountPrice: 970, duration: 'Immediate Dispatch', features: ['10x HCH 6204 Bearings', 'Free Delhivery'], isPopular: true },
          { name: 'Carton of 50 Pcs', price: 4600, discountPrice: 4600, duration: 'Immediate Dispatch', features: ['50x HCH 6204 Bearings', 'Bulk Wholesale Rate', 'Free Heavy Delhivery'], isPopular: false },
        ],
      },
      {
        name: 'HCH 6205 Deep Groove Ball Bearing',
        partNumber: '6205',
        brand: 'HCH',
        section: 'Bearing',
        category: catBearings._id,
        mrp: 235,
        discountPercentage: 46,
        basePrice: 127,
        discountPrice: 127,
        deliveryIncluded: true,
        origin: 'Standard',
        serviceType: 'bearing',
        shortDescription: 'HCH 6205 Open Ball Bearing (25x52x15 mm). Most popular standard 25mm shaft bearing.',
        fullDescription: 'HCH 6205 is universally utilized in pumps, electric motors, power tools, and conveyers. Offers high dynamic load ratings and extended operating fatigue life.',
        mainImage: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
        features: [
          'Dimensions: 25 mm Bore x 52 mm OD x 15 mm Width',
          '46% Discount off official MRP with Delhivery delivery charge included',
          'Precision grade steel balls and pressed steel cage',
        ],
        specifications: {
          'Part Number': '6205',
          'Bore (d)': '25 mm',
          'Outer Diameter (D)': '52 mm',
          'Width (B)': '15 mm',
          'Closure': 'Open',
          'Make / Brand': 'HCH Bearings',
          'Freight': 'Delhivery Included',
        },
        packages: [
          { name: 'Box of 10 Pcs', price: 1270, discountPrice: 1270, duration: 'Immediate Dispatch', features: ['10x HCH 6205 Bearings', 'Free Delhivery'], isPopular: true },
        ],
      },
      {
        name: 'HCH 6305 Deep Groove Ball Bearing',
        partNumber: '6305',
        brand: 'HCH',
        section: 'Bearing',
        category: catBearings._id,
        mrp: 340,
        discountPercentage: 46,
        basePrice: 184,
        discountPrice: 184,
        deliveryIncluded: true,
        origin: 'Standard',
        serviceType: 'bearing',
        shortDescription: 'HCH 6305 Open Ball Bearing (25x62x17 mm). Medium-heavy series ball bearing.',
        fullDescription: 'The HCH 6305 medium series deep groove bearing handles significantly higher radial and axial thrust loads compared to the 6205 series on identical 25mm shaft diameters.',
        mainImage: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
        features: [
          'Dimensions: 25 mm Bore x 62 mm OD x 17 mm Width',
          '46% Discount off official MRP with Free Delhivery',
          'Heavy series load-carrying capacity',
        ],
        specifications: {
          'Part Number': '6305',
          'Bore (d)': '25 mm',
          'Outer Diameter (D)': '62 mm',
          'Width (B)': '17 mm',
          'Closure': 'Open',
          'Make / Brand': 'HCH Bearings',
          'Freight': 'Delhivery Included',
        },
        packages: [
          { name: 'Box of 10 Pcs', price: 1840, discountPrice: 1840, duration: 'Immediate Dispatch', features: ['10x HCH 6305 Bearings', 'Free Delhivery'], isPopular: true },
        ],
      },
      {
        name: 'HCH 6201_6202 Matched Set',
        partNumber: '6201_6202 set',
        brand: 'HCH',
        section: 'Bearing',
        category: catBearings._id,
        mrp: 290,
        discountPercentage: 46,
        basePrice: 157,
        discountPrice: 157,
        deliveryIncluded: true,
        origin: 'Standard',
        serviceType: 'bearing',
        shortDescription: 'HCH 6201 + 6202 Matched Bearing Pair Set. Pre-matched set for power tool armatures and sub-assemblies.',
        fullDescription: 'Convenient factory-matched set containing 1x 6201 (12x32x10mm) and 1x 6202 (15x35x11mm) high-speed precision bearings. Ideal for repair technicians, motor rewinders, and equipment servicing.',
        mainImage: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
        features: [
          'Set includes 1 pc 6201 and 1 pc 6202',
          '46% Discount off official MRP with Free Delhivery',
          'Specially packaged for electric motor armature replacement',
        ],
        specifications: {
          'Set Composition': '1x 6201 + 1x 6202',
          '6201 Dimensions': '12 x 32 x 10 mm',
          '6202 Dimensions': '15 x 35 x 11 mm',
          'Make / Brand': 'HCH Bearings',
          'Freight': 'Delhivery Charges Included',
        },
        packages: [
          { name: 'Single Pair Set', price: 157, discountPrice: 157, duration: 'Immediate Dispatch', features: ['1x Set (6201 + 6202)', 'Free Delhivery'], isPopular: true },
          { name: 'Pack of 10 Sets', price: 1490, discountPrice: 1490, duration: 'Immediate Dispatch', features: ['10x Matched Sets (20 bearings total)', 'Workshop Pack', 'Free Delhivery'], isPopular: false },
        ],
      },
      {
        name: 'HCH 6203ZZ Shielded Bearing',
        partNumber: '6203zz',
        brand: 'HCH',
        section: 'Bearing',
        category: catBearings._id,
        mrp: 165,
        discountPercentage: 46,
        basePrice: 89,
        discountPrice: 89,
        deliveryIncluded: true,
        origin: 'Standard',
        serviceType: 'bearing',
        shortDescription: 'HCH 6203ZZ Shielded Ball Bearing (17x40x12 mm). Dual steel shields, pre-lubricated with high-grade grease.',
        fullDescription: 'HCH 6203ZZ features dual pressed metal shields to prevent dust entry and retain factory lubrication throughout service life. Maintenance-free operation for industrial and consumer drives.',
        mainImage: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
        features: [
          'Dimensions: 17 mm Bore x 40 mm OD x 12 mm Width',
          'ZZ Dual Steel Shields for maintenance-free dust resistance',
          '46% Discount off list price with Free Delhivery delivery',
        ],
        specifications: {
          'Part Number': '6203-ZZ',
          'Bore (d)': '17 mm',
          'Outer Diameter (D)': '40 mm',
          'Width (B)': '12 mm',
          'Shielding': 'ZZ Dual Metal',
          'Make / Brand': 'HCH Bearings',
          'Freight': 'Delhivery Included',
        },
        packages: [
          { name: 'Box of 10 Pcs', price: 890, discountPrice: 890, duration: 'Immediate Dispatch', features: ['10x HCH 6203ZZ Bearings', 'Free Delhivery'], isPopular: true },
        ],
      },
      {
        name: 'HCH 6204ZZ Shielded Bearing',
        partNumber: '6204zz',
        brand: 'HCH',
        section: 'Bearing',
        category: catBearings._id,
        mrp: 205,
        discountPercentage: 46,
        basePrice: 111,
        discountPrice: 111,
        deliveryIncluded: true,
        origin: 'Standard',
        serviceType: 'bearing',
        shortDescription: 'HCH 6204ZZ Shielded Ball Bearing (20x47x14 mm). Pre-lubricated dual shield bearing.',
        fullDescription: 'High quality 20mm bore ball bearing with metal shields on both sides. Widely used on washing machines, agricultural machinery, and industrial gearboxes.',
        mainImage: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
        features: [
          'Dimensions: 20 mm Bore x 47 mm OD x 14 mm Width',
          '46% Discount off MRP with Delhivery freight included',
        ],
        specifications: {
          'Part Number': '6204-ZZ',
          'Bore (d)': '20 mm',
          'Outer Diameter (D)': '47 mm',
          'Width (B)': '14 mm',
          'Shielding': 'ZZ Dual Metal',
          'Make / Brand': 'HCH Bearings',
          'Freight': 'Delhivery Included',
        },
        packages: [
          { name: 'Box of 10 Pcs', price: 1110, discountPrice: 1110, duration: 'Immediate Dispatch', features: ['10x HCH 6204ZZ Bearings', 'Free Delhivery'], isPopular: true },
        ],
      },
      {
        name: 'HCH 6205ZZ Shielded Bearing',
        partNumber: '6205zz',
        brand: 'HCH',
        section: 'Bearing',
        category: catBearings._id,
        mrp: 265,
        discountPercentage: 46,
        basePrice: 143,
        discountPrice: 143,
        deliveryIncluded: true,
        origin: 'Standard',
        serviceType: 'bearing',
        shortDescription: 'HCH 6205ZZ Shielded Ball Bearing (25x52x15 mm). Industrial standard shielded bearing.',
        fullDescription: 'Robust 25mm shaft ball bearing equipped with ZZ non-contact metal shields for smooth high-speed rotation and protection from airborne debris.',
        mainImage: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
        features: [
          'Dimensions: 25 mm Bore x 52 mm OD x 15 mm Width',
          '46% Discount off MRP list including Delhivery shipping',
        ],
        specifications: {
          'Part Number': '6205-ZZ',
          'Bore (d)': '25 mm',
          'Outer Diameter (D)': '52 mm',
          'Width (B)': '15 mm',
          'Shielding': 'ZZ Dual Metal',
          'Make / Brand': 'HCH Bearings',
          'Freight': 'Delhivery Included',
        },
        packages: [
          { name: 'Box of 10 Pcs', price: 1430, discountPrice: 1430, duration: 'Immediate Dispatch', features: ['10x HCH 6205ZZ Bearings', 'Free Delhivery'], isPopular: true },
        ],
      },
      {
        name: 'HCH 6305ZZ Shielded Bearing',
        partNumber: '6305zz',
        brand: 'HCH',
        section: 'Bearing',
        category: catBearings._id,
        mrp: 385,
        discountPercentage: 46,
        basePrice: 208,
        discountPrice: 208,
        deliveryIncluded: true,
        origin: 'Standard',
        serviceType: 'bearing',
        shortDescription: 'HCH 6305ZZ Heavy Shielded Ball Bearing (25x62x17 mm). High radial and thrust capacity.',
        fullDescription: 'Medium-heavy 25mm bore shielded ball bearing engineered for high-vibration electric motors, heavy fans, and high-load pulleys.',
        mainImage: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
        features: [
          'Dimensions: 25 mm Bore x 62 mm OD x 17 mm Width',
          '46% Discount off list price with Free Delhivery delivery',
        ],
        specifications: {
          'Part Number': '6305-ZZ',
          'Bore (d)': '25 mm',
          'Outer Diameter (D)': '62 mm',
          'Width (B)': '17 mm',
          'Shielding': 'ZZ Dual Metal',
          'Make / Brand': 'HCH Bearings',
          'Freight': 'Delhivery Included',
        },
        packages: [
          { name: 'Box of 10 Pcs', price: 2080, discountPrice: 2080, duration: 'Immediate Dispatch', features: ['10x HCH 6305ZZ Bearings', 'Free Delhivery'], isPopular: true },
        ],
      },
      {
        name: 'HCH 6307 Deep Groove Ball Bearing',
        partNumber: '6307',
        brand: 'HCH',
        section: 'Bearing',
        category: catBearings._id,
        mrp: 590,
        discountPercentage: 46,
        basePrice: 319,
        discountPrice: 319,
        deliveryIncluded: true,
        origin: 'Standard',
        serviceType: 'bearing',
        shortDescription: 'HCH 6307 Open Ball Bearing (35x80x21 mm). Heavy series 35mm shaft bearing.',
        fullDescription: 'Heavy-duty 35mm deep groove ball bearing with high dynamic load capacity of 33.5 kN. Engineered for industrial gearboxes, tractors, and heavy pump shafts.',
        mainImage: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
        features: [
          'Dimensions: 35 mm Bore x 80 mm OD x 21 mm Width',
          '46% Discount off MRP list including Delhivery freight',
        ],
        specifications: {
          'Part Number': '6307',
          'Bore (d)': '35 mm',
          'Outer Diameter (D)': '80 mm',
          'Width (B)': '21 mm',
          'Closure': 'Open',
          'Make / Brand': 'HCH Bearings',
          'Freight': 'Delhivery Included',
        },
        packages: [
          { name: 'Single Bearing Pack', price: 319, discountPrice: 319, duration: 'Immediate Dispatch', features: ['1x HCH 6307 Bearing', 'Free Delhivery'], isPopular: true },
          { name: 'Box of 5 Pcs', price: 1540, discountPrice: 1540, duration: 'Immediate Dispatch', features: ['5x HCH 6307 Bearings', 'Free Priority Delhivery'], isPopular: false },
        ],
      },
      {
        name: 'HCH 6306 Deep Groove Ball Bearing',
        partNumber: '6306',
        brand: 'HCH',
        section: 'Bearing',
        category: catBearings._id,
        mrp: 480,
        discountPercentage: 46,
        basePrice: 259,
        discountPrice: 259,
        deliveryIncluded: true,
        origin: 'Standard',
        serviceType: 'bearing',
        shortDescription: 'HCH 6306 Open Ball Bearing (30x72x19 mm). Heavy series 30mm shaft bearing.',
        fullDescription: 'Standard heavy series 30mm bore ball bearing with open enclosure. Precision ground raceways ensure whisper-smooth motion under rigorous mechanical loads.',
        mainImage: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
        features: [
          'Dimensions: 30 mm Bore x 72 mm OD x 19 mm Width',
          '46% Discount off MRP with Free Delhivery delivery',
        ],
        specifications: {
          'Part Number': '6306',
          'Bore (d)': '30 mm',
          'Outer Diameter (D)': '72 mm',
          'Width (B)': '19 mm',
          'Closure': 'Open',
          'Make / Brand': 'HCH Bearings',
          'Freight': 'Delhivery Included',
        },
        packages: [
          { name: 'Single Bearing Pack', price: 259, discountPrice: 259, duration: 'Immediate Dispatch', features: ['1x HCH 6306 Bearing', 'Free Delhivery'], isPopular: true },
          { name: 'Box of 5 Pcs', price: 1250, discountPrice: 1250, duration: 'Immediate Dispatch', features: ['5x HCH 6306 Bearings', 'Free Delhivery'], isPopular: false },
        ],
      },
      {
        name: 'HCH 6309 Deep Groove Ball Bearing',
        partNumber: '6309',
        brand: 'HCH',
        section: 'Bearing',
        category: catBearings._id,
        mrp: 950,
        discountPercentage: 46,
        basePrice: 513,
        discountPrice: 513,
        deliveryIncluded: true,
        origin: 'Standard',
        serviceType: 'bearing',
        shortDescription: 'HCH 6309 Heavy Ball Bearing (45x100x25 mm). 45mm shaft industrial machinery bearing.',
        fullDescription: 'Large 45mm shaft ball bearing capable of supporting heavy radial shock loads up to 53 kN. Common on large induction motors, heavy conveyors, and drive heads.',
        mainImage: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
        features: [
          'Dimensions: 45 mm Bore x 100 mm OD x 25 mm Width',
          '46% Discount off MRP list including Delhivery freight',
        ],
        specifications: {
          'Part Number': '6309',
          'Bore (d)': '45 mm',
          'Outer Diameter (D)': '100 mm',
          'Width (B)': '25 mm',
          'Closure': 'Open',
          'Make / Brand': 'HCH Bearings',
          'Freight': 'Delhivery Included',
        },
        packages: [
          { name: 'Single Bearing Pack', price: 513, discountPrice: 513, duration: 'Immediate Dispatch', features: ['1x HCH 6309 Bearing', 'Free Delhivery'], isPopular: true },
        ],
      },
      {
        name: 'HCH 6306ZZ Shielded Bearing',
        partNumber: '6306zz',
        brand: 'HCH',
        section: 'Bearing',
        category: catBearings._id,
        mrp: 530,
        discountPercentage: 46,
        basePrice: 286,
        discountPrice: 286,
        deliveryIncluded: true,
        origin: 'Standard',
        serviceType: 'bearing',
        shortDescription: 'HCH 6306ZZ Shielded Ball Bearing (30x72x19 mm). Pre-lubricated dual shield heavy series.',
        fullDescription: 'Heavy-duty 30mm bore shielded ball bearing with double metal shields. Provides maintenance-free reliability in dusty cement, ceramic, and woodworking plants.',
        mainImage: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
        features: [
          'Dimensions: 30 mm Bore x 72 mm OD x 19 mm Width',
          '46% Discount off official MRP with Free Delhivery',
        ],
        specifications: {
          'Part Number': '6306-ZZ',
          'Bore (d)': '30 mm',
          'Outer Diameter (D)': '72 mm',
          'Width (B)': '19 mm',
          'Shielding': 'ZZ Dual Metal',
          'Make / Brand': 'HCH Bearings',
          'Freight': 'Delhivery Included',
        },
        packages: [
          { name: 'Single Bearing Pack', price: 286, discountPrice: 286, duration: 'Immediate Dispatch', features: ['1x HCH 6306ZZ Bearing', 'Free Delhivery'], isPopular: true },
          { name: 'Box of 5 Pcs', price: 1390, discountPrice: 1390, duration: 'Immediate Dispatch', features: ['5x HCH 6306ZZ Bearings', 'Free Delhivery'], isPopular: false },
        ],
      },

      // ---------------------------------------------
      // FENNER - MAKE (BUSH PULLEY & BELT SECTION) - 46% OFF MRP, DELHIVERY INCLUDED
      // ---------------------------------------------
      {
        name: 'Fenner Taper Lock Pulley 200 X 3C (2517) 60mm',
        partNumber: '200 X 3C (2517) 60mm',
        brand: 'Fenner',
        section: 'Bush Pulley',
        category: catPulleys._id,
        mrp: 4850,
        discountPercentage: 46,
        basePrice: 2619,
        discountPrice: 2619,
        deliveryIncluded: true,
        origin: 'Standard',
        serviceType: 'pulley',
        shortDescription: 'Fenner Taper Lock Pulley 200 mm Pitch Dia x 3 Grooves C-Section with 2517 Taper Bush (60mm Bore).',
        fullDescription: 'Fenner Taper Lock Dual Duty Pulley 200 X 3C is dynamically balanced to ISO 1940 standards. Accommodates standard Fenner 2517 Taper Lock Bush with a 60mm finished bore and keyway. Easy keyless mounting and dismounting without shaft scoring. Includes 46% discount off Fenner price list with Delhivery delivery included.',
        mainImage: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
        features: [
          'Pitch Diameter: 200 mm, Number of Grooves: 3 (C Section)',
          'Taper Bush Size: 2517, Finished Bore: 60 mm with standard keyway',
          'High grade grey cast iron GG25 / FG260 with phosphate rust-proofing',
          '46% Discount off official Fenner MRP with Free Delhivery freight',
          'Dynamically balanced for peripheral speeds up to 30 m/s',
        ],
        specifications: {
          'Pulley Type': 'Taper Lock V-Groove Pulley',
          'Belt Groove Profile': 'C Section (3 Grooves)',
          'Pitch Diameter (PCD)': '200 mm',
          'Taper Bush Number': '2517',
          'Bore Diameter': '60 mm (Keyed to IS/BS standard)',
          'Material': 'High Tensile Cast Iron FG260',
          'Make / Brand': 'J.K. Fenner (India) Ltd',
          'Freight': 'Delhivery Charges Included',
        },
        packages: [
          { name: 'Complete Assembly (Pulley + 2517 Bush 60mm)', price: 2619, discountPrice: 2619, duration: 'Immediate Dispatch', features: ['1x Fenner 200 X 3C Pulley', '1x Fenner 2517 60mm Taper Bush', 'Locking grub screws & hex key', 'Free Heavy Delhivery Freight'], isPopular: true },
          { name: 'Pulley Body Only (Without Bush)', price: 2199, discountPrice: 2199, duration: 'Immediate Dispatch', features: ['1x Fenner 200 X 3C Pulley body', 'Accepts any 2517 bush', 'Free Delhivery'], isPopular: false },
        ],
      },
      {
        name: 'Fenner C 70 Classical V-Belt',
        partNumber: 'c 70',
        brand: 'Fenner',
        section: 'Belt',
        category: catBelts._id,
        mrp: 1250,
        discountPercentage: 46,
        basePrice: 675,
        discountPrice: 675,
        deliveryIncluded: true,
        origin: 'Standard',
        serviceType: 'belt',
        shortDescription: 'Fenner PB (Precision Built) Classical V-Belt C 70 (Inside length 70 inches). Zero-tolerance matching.',
        fullDescription: 'Fenner PB Classical V-Belts are celebrated for their legendary "One-Shot Tensioning" feature. Built to such exacting tolerances that belts from different production batches can be run together on multi-groove pulleys without matching numbers.',
        mainImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        features: [
          'Fenner PB (Precision Built) technology — no matching codes required',
          'C Section, 70 inches inside length',
          '46% Discount off Fenner price list with Free Delhivery freight',
          'Resistant to heat, oil, ozone, and harsh industrial environments',
        ],
        specifications: {
          'Belt Profile': 'Classical C Section',
          'Inside Length': '70 inches (1778 mm)',
          'Top Width': '22 mm',
          'Height': '14 mm',
          'Feature': 'PB Precision Built',
          'Make / Brand': 'Fenner (India)',
          'Freight': 'Delhivery Included',
        },
        packages: [
          { name: 'Single Fenner C 70 Belt', price: 675, discountPrice: 675, duration: 'Immediate Dispatch', features: ['1x Fenner C 70 Belt', 'Free Delhivery', 'OEM Seal'], isPopular: true },
          { name: 'Set of 3 Belts (Pulley Matched)', price: 1980, discountPrice: 1980, duration: 'Immediate Dispatch', features: ['3x Fenner C 70 Belts', 'Free Priority Delhivery', 'Factory Guarantee'], isPopular: false },
        ],
      },
      {
        name: 'Fenner SPC PT 3150 Power Transmission Belt',
        partNumber: 'SPC PT 3150',
        brand: 'Fenner',
        section: 'Belt',
        category: catBelts._id,
        mrp: 2750,
        discountPercentage: 46,
        basePrice: 1485,
        discountPrice: 1485,
        deliveryIncluded: true,
        origin: 'Standard',
        serviceType: 'belt',
        shortDescription: 'Fenner Heavy Duty Wedge Belt SPC PT 3150 mm. High power transmission metric wedge belt.',
        fullDescription: 'Fenner SPC PT 3150 provides up to 300% greater power transfer than conventional belts, enabling more compact drive design with fewer belt grooves. 46% off Fenner MRP with free Delhivery logistics.',
        mainImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        features: [
          'Pitch Length: 3150 mm (SPC Wedge Profile)',
          '46% Discount off official MRP with Free Delhivery freight',
          'Engineered for large industrial blowers, compressors, and rolling mills',
        ],
        specifications: {
          'Belt Section': 'SPC Power Transmission',
          'Pitch Length': '3150 mm',
          'Top Width': '22 mm',
          'Height': '18 mm',
          'Make / Brand': 'Fenner (India)',
          'Freight': 'Delhivery Included',
        },
        packages: [
          { name: 'Single Belt Pack', price: 1485, discountPrice: 1485, duration: 'Immediate Dispatch', features: ['1x Fenner SPC PT 3150 Belt', 'Free Delhivery'], isPopular: true },
        ],
      },

      // ---------------------------------------------
      // TIMKEN - MAKE (BEARING SECTION - ALL TYPES AVAILABLE) - 46% OFF MRP, DELHIVERY INCLUDED
      // ---------------------------------------------
      {
        name: 'Timken 6313 Open Type Bearing',
        partNumber: '6313 open type',
        brand: 'Timken',
        section: 'Bearing',
        category: catBearings._id,
        mrp: 3600,
        discountPercentage: 46,
        basePrice: 1944,
        discountPrice: 1944,
        deliveryIncluded: true,
        origin: 'Standard',
        serviceType: 'bearing',
        shortDescription: 'Timken 6313 Open Deep Groove Ball Bearing (65x140x33 mm). World-class engineered bearing for heavy machinery.',
        fullDescription: 'The Timken Company is a world leader in engineered bearings. The Timken 6313 open deep groove ball bearing delivers exceptional fatigue life, super-finished raceways, and optimal internal geometry for critical industrial drives, marine propulsion, and heavy reduction gearboxes. All Timken bearing types available on demand with 45-48% discount.',
        mainImage: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
        features: [
          'Dimensions: 65 mm Bore x 140 mm OD x 33 mm Width',
          'Open type configuration for optimum oil lubrication flow',
          '46% Discount off official Timken MRP list with Free Delhivery',
          'All types of Timken bearings (Tapered roller, spherical, ball) available on request',
          '100% Genuine Timken with hologram security seal and MTC certificate',
        ],
        specifications: {
          'Part Number': '6313 (Open Type)',
          'Bore Diameter (d)': '65 mm',
          'Outer Diameter (D)': '140 mm',
          'Width (B)': '33 mm',
          'Basic Dynamic Load (Cr)': '92.7 kN',
          'Basic Static Load (Cor)': '60.0 kN',
          'Make / Brand': 'The Timken Company',
          'All Types Availability': 'Yes - Full Timken Range Available on RFQ',
          'Freight': 'Delhivery Charges Included',
        },
        packages: [
          { name: 'Single Timken 6313 Bearing', price: 1944, discountPrice: 1944, duration: 'Immediate Dispatch', features: ['1x Timken 6313 Open Bearing', 'Free Delhivery', 'Timken Hologram Seal', 'MTC Certificate'], isPopular: true },
          { name: 'Case of 4 Pcs', price: 7490, discountPrice: 7490, duration: 'Immediate Dispatch', features: ['4x Timken 6313 Bearings', 'Priority Express Delhivery', 'OEM Mill Test Certificate'], isPopular: false },
        ],
      },

      // ---------------------------------------------
      // SKF - MAKE (BEARING SECTION - STRICTLY 10% DISCOUNT ONLY, NATIONAL & INTERNATIONAL)
      // ---------------------------------------------
      {
        name: 'SKF 7322 2X Angular Contact Ball Bearing Matched Set',
        partNumber: '7322 2X',
        brand: 'SKF',
        section: 'Bearing',
        category: catBearings._id,
        mrp: 42000,
        discountPercentage: 10, // Strictly 10% discount for SKF
        basePrice: 37800,
        discountPrice: 37800,
        deliveryIncluded: true,
        origin: 'Both', // National and International available
        serviceType: 'bearing',
        shortDescription: 'SKF 7322 2X Angular Contact Ball Bearing Duplex Matched Pair (110x240x50 mm each). National and International stock available.',
        fullDescription: 'SKF 7322 2X consists of a universally matched pair (duplex set) of single row angular contact ball bearings with a 40° contact angle. Designed specifically for heavy combined radial and bidirectional axial thrust loads in vertical slurry pumps, compressor shafts, and heavy marine thrusters. Available in both National (SKF India) and International (SKF European / Global import) origin. Flat 10% official discount strictly applied with full authenticity verification.',
        mainImage: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
        features: [
          'Dimensions: 110 mm Bore x 240 mm OD x 50 mm Width (x2 Matched Duplex Set)',
          '40° Contact angle provides exceptionally high axial thrust load capacity',
          'Available in National (SKF India) & International (Imported European) Stock',
          'Strictly 10% Discount from official SKF MRP ("skf only 10% discount")',
          '100% Genuine with SKF Authenticate App QR code and Mill Test Certificate',
          'Free insured Delhivery shipping across India',
        ],
        specifications: {
          'Part Number': '7322 2X (Duplex Matched Pair)',
          'Bore Diameter (d)': '110 mm',
          'Outer Diameter (D)': '240 mm',
          'Width (B)': '50 mm (Per bearing / 100mm total duplex stack)',
          'Contact Angle': '40°',
          'Arrangement': 'Universal Duplex (DB Back-to-Back or DF Face-to-Face)',
          'Make / Brand': 'SKF Group',
          'Origin Options': 'National (India) & International (Imported)',
          'Discount Terms': 'Strictly Flat 10% Off MRP',
          'Freight': 'Insured Delhivery Included',
        },
        packages: [
          { name: 'Duplex Set - National Origin (SKF India)', price: 37800, discountPrice: 37800, duration: '24-48 Hours Dispatch', features: ['1x Matched Duplex Pair (7322 2X)', 'National (SKF India) Stock', 'SKF QR Code Verification', 'Insured Free Delhivery', 'Official GST Tax Invoice'], isPopular: true },
          { name: 'Duplex Set - International Origin (Imported European)', price: 39500, discountPrice: 39500, duration: '3-5 Business Days', features: ['1x Matched Duplex Pair (7322 2X)', 'International European Stock (Made in Sweden/Germany)', 'Customs Bill of Entry & Certificate of Origin', 'Priority Insured Delhivery'], isPopular: false },
        ],
      },
      {
        name: 'SKF 7322 Angular Contact Ball Bearing',
        partNumber: '7322',
        brand: 'SKF',
        section: 'Bearing',
        category: catBearings._id,
        mrp: 19800,
        discountPercentage: 10, // Strictly 10% discount for SKF
        basePrice: 17820,
        discountPrice: 17820,
        deliveryIncluded: true,
        origin: 'Both', // National and International available
        serviceType: 'bearing',
        shortDescription: 'SKF 7322 Single Row Angular Contact Ball Bearing (110x240x50 mm). High capacity 40° contact angle.',
        fullDescription: 'The SKF 7322 single row angular contact ball bearing accommodates heavy combined radial and axial loads acting in one direction. Universally matchable execution with heavy machined brass or pressed steel cage. Stocked in both National (SKF India) and International (Imported) variants. Flat 10% official discount applies.',
        mainImage: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
        features: [
          'Dimensions: 110 mm Bore x 240 mm OD x 50 mm Width',
          '40° Contact Angle for heavy axial thrust',
          'Strictly 10% Discount off official SKF MRP',
          'National & International stock options with full traceability',
          'Free insured Delhivery shipping included',
        ],
        specifications: {
          'Part Number': '7322',
          'Bore Diameter (d)': '110 mm',
          'Outer Diameter (D)': '240 mm',
          'Width (B)': '50 mm',
          'Contact Angle': '40°',
          'Make / Brand': 'SKF Group',
          'Origin Options': 'National (India) & International (Imported)',
          'Discount Terms': 'Flat 10% Off MRP',
          'Freight': 'Delhivery Charges Included',
        },
        packages: [
          { name: 'Single Bearing - National Origin (SKF India)', price: 17820, discountPrice: 17820, duration: '24-48 Hours Dispatch', features: ['1x SKF 7322 Bearing', 'National SKF India Stock', 'Free Insured Delhivery', 'Authenticity Certificate'], isPopular: true },
          { name: 'Single Bearing - International Origin (Imported)', price: 18600, discountPrice: 18600, duration: '3-5 Business Days', features: ['1x SKF 7322 Bearing', 'International European Import', 'Certificate of Origin', 'Free Insured Delhivery'], isPopular: false },
        ],
      },
    ];

    console.log(`[Seed] Seeding ${productsData.length} industrial products...`);

    for (let i = 0; i < productsData.length; i++) {
      const p = productsData[i];
      const createdService = await Service.create({
        name: p.name,
        partNumber: p.partNumber,
        brand: p.brand,
        section: p.section,
        category: p.category,
        mrp: p.mrp,
        discountPercentage: p.discountPercentage,
        basePrice: p.basePrice,
        discountPrice: p.discountPrice,
        deliveryIncluded: p.deliveryIncluded,
        origin: p.origin,
        serviceType: p.serviceType,
        shortDescription: p.shortDescription,
        fullDescription: p.fullDescription,
        mainImage: p.mainImage,
        galleryImages: [
          'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        ],
        taxRate: 18,
        processingTime: 'Same Day Dispatch',
        isFeatured: i < 8,
        displayOrder: i + 1,
        features: p.features,
        specifications: p.specifications,
        terms: [
          '100% Genuine OEM product with manufacturer warranty.',
          'Delhivery shipping charge included in price.',
          'GST tax invoice provided for full input tax credit.',
          'Hassle-free replacement for transit damage within 48 hours of delivery.',
        ],
        requiredFormFields: [
          {
            fieldName: 'companyName',
            label: 'Company / Firm Name (Optional)',
            fieldType: 'text',
            required: false,
            placeholder: 'e.g. Acme Industries Ltd',
          },
          {
            fieldName: 'gstin',
            label: 'GSTIN Number (For 18% Input Credit)',
            fieldType: 'text',
            required: false,
            placeholder: 'e.g. 33AAAAA0000A1Z5',
          },
          {
            fieldName: 'deliveryPincode',
            label: 'Delivery Pincode (Delhivery Logistics)',
            fieldType: 'text',
            required: true,
            placeholder: 'e.g. 641018',
          },
          ...(p.brand === 'SKF'
            ? [
                {
                  fieldName: 'preferredOrigin',
                  label: 'Preferred Stock Origin',
                  fieldType: 'select',
                  options: ['National (SKF India)', 'International (Imported European Stock)'],
                  required: true,
                },
              ]
            : []),
          ...(p.partNumber.includes('2517')
            ? [
                {
                  fieldName: 'bushBoreSize',
                  label: 'Selected Bush Bore Diameter',
                  fieldType: 'select',
                  options: ['60 mm (Standard as listed)', '55 mm', '50 mm', '45 mm', 'Custom Bore (Specify in Notes)'],
                  required: true,
                },
              ]
            : []),
        ],
      });

      // Seed packages for this service
      for (let j = 0; j < p.packages.length; j++) {
        const pkg = p.packages[j];
        await ServicePackage.create({
          service: createdService._id,
          name: pkg.name,
          price: pkg.price,
          discountPrice: pkg.discountPrice,
          duration: pkg.duration,
          features: pkg.features,
          addOns: [
            { name: 'Express Delhivery Priority Air Cargo', price: 250, description: 'Guaranteed 24-hr expedited air freight.' },
            { name: 'High-Temperature Industrial Grease Sachet (100g)', price: 180, description: 'Synthetic lithium-complex high-temp grease for bearings.' },
          ],
          isPopular: pkg.isPopular,
          displayOrder: j + 1,
        });
      }
    }

    console.log('[Seed] Created all products with packages.');

    // 4. Create Hero Banners
    await Banner.create([
      {
        title: 'India’s Trusted Power Transmission & Bearings Distributor',
        subtitle: 'Authorized dealer of PIX, NBC, HCH, Fenner, Timken, and SKF. Direct wholesale pricing with fast pan-India delivery.',
        badgeText: '45% - 48% OFF MRP LIST',
        image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1600&q=80',
        ctaText: 'Explore Catalog',
        ctaLink: '/services',
        secondaryCtaText: 'Request Bulk Quote (RFQ)',
        secondaryCtaLink: '/rfq',
        displayOrder: 1,
      },
      {
        title: 'Free Delhivery Freight Included on Major Makes',
        subtitle: 'Get 45% to 48% discount from official MRP on PIX Belts, NBC Bearings, HCH Ball Bearings, and Fenner Bush Pulleys with delivery included.',
        badgeText: 'FREE DELHIVERY INCLUDED',
        image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1600&q=80',
        ctaText: 'View Price List',
        ctaLink: '/mrp-pricing',
        secondaryCtaText: 'Search Part Numbers',
        secondaryCtaLink: '/services',
        displayOrder: 2,
      },
      {
        title: 'SKF Genuine Bearings — National & International Stock',
        subtitle: 'National (SKF India) & International (Imported) stock available with 100% authenticity guarantee and flat 10% discount from MRP.',
        badgeText: 'SKF GENUINE GUARANTEE',
        image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=1600&q=80',
        ctaText: 'Browse SKF Bearings',
        ctaLink: '/services?brand=SKF',
        secondaryCtaText: 'Custom RFQ',
        secondaryCtaLink: '/rfq',
        displayOrder: 3,
      },
    ]);

    console.log('[Seed] Created 3 Industrial Hero Banners.');

    // 5. Create Coupons
    await Coupon.create([
      {
        code: 'WELCOMEB2B',
        discountType: DISCOUNT_TYPES.PERCENTAGE,
        discountValue: 5,
        maxDiscount: 1000,
        minBookingAmount: 2000,
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        code: 'BULK500',
        discountType: DISCOUNT_TYPES.FIXED,
        discountValue: 500,
        maxDiscount: 0,
        minBookingAmount: 5000,
        validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    ]);

    // 6. Create Industrial FAQs
    await FAQ.create([
      {
        question: 'What is the discount structure on PIX, NBC, HCH, Fenner, and Timken?',
        answer: 'We provide a wholesale discount of 45% to 48% off the official manufacturer MRP price list on all PIX belts, NBC bearings, HCH bearings, Fenner pulleys/belts, and Timken bearings. Furthermore, all Delhivery freight and shipping charges are included in this price.',
        category: 'Pricing & Discounts',
        displayOrder: 1,
      },
      {
        question: 'What is the discount policy on SKF bearings?',
        answer: 'SKF bearings carry a flat 10% discount from the official SKF MRP price list. Both National (SKF India) and International (Imported European stock) origins are available with complete QR verification and Mill Test Certificates (MTC).',
        category: 'SKF Bearings',
        displayOrder: 2,
      },
      {
        question: 'Are Delhivery delivery charges really included in the prices?',
        answer: 'Yes! For all items covered under our 45% - 48% discount scheme (PIX, NBC, HCH, Fenner, Timken), standard insured Delhivery logistics freight across India is 100% included with no hidden handling or courier fees.',
        category: 'Shipping & Logistics',
        displayOrder: 3,
      },
      {
        question: 'Can I order Timken bearing types not currently listed on the site?',
        answer: 'Yes. All types of Timken bearings (including tapered roller, spherical roller, thrust bearings, and custom sizes) are available through our direct factory supply lines. Use our RFQ page to submit your part number and receive an instant quote within 1 hour.',
        category: 'Timken Bearings',
        displayOrder: 4,
      },
      {
        question: 'Can we configure bore sizes for the Fenner Taper Lock Bush Pulley (200 X 3C)?',
        answer: 'Yes! The 200 X 3C pulley comes standard with a 2517 taper lock bush with a 60mm finished bore. If you require alternative shaft bore sizes (such as 45mm, 50mm, or 55mm), simply select your desired bore size during checkout.',
        category: 'Pulleys & Bushings',
        displayOrder: 5,
      },
      {
        question: 'Do you provide GST tax invoices for B2B input tax credit?',
        answer: 'Yes, every order includes a full GST tax invoice (INV-YYYY-XXXXX) clearly breaking down CGST, SGST, or IGST at the standard 18% rate with your company GSTIN printed.',
        category: 'Billing & Invoices',
        displayOrder: 6,
      },
    ]);

    // 7. Create Industrial Testimonials
    await Testimonial.create([
      {
        customerName: 'Senthil Nathan',
        customerRole: 'Plant Maintenance Head',
        company: 'Apex Textiles & Spinning Mills, Coimbatore',
        rating: 5,
        content: 'BizZolution has transformed our maintenance procurement. Getting 46% off MRP on genuine Fenner C 70 belts and PIX wedge belts with free Delhivery freight has cut our annual transmission maintenance expenses by 35%. Dispatch is always lightning fast.',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        displayOrder: 1,
      },
      {
        customerName: 'Vikas Agarwal',
        customerRole: 'Chief Procurement Officer',
        company: 'Continental Heavy Engineering, Pune',
        rating: 5,
        content: 'Authenticity is our biggest concern with high-capacity angular contact bearings. BizZolution delivered genuine SKF 7322 2X matched sets with official test certificates and verifiable QR codes. Unbeatable service.',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
        displayOrder: 2,
      },
      {
        customerName: 'Rajesh Mehra',
        customerRole: 'Operations Director',
        company: 'Mehra Roller Mills & Processing, Ahmedabad',
        rating: 5,
        content: 'Their stock of HCH and NBC bearings is extensive. We placed an order for 50 pieces of 6204ZZ and 6306ZZ and received them in pristine factory sealed packing via Delhivery in under 48 hours.',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
        displayOrder: 3,
      },
    ]);

    // 8. Sample RFQ enquiry
    await ContactEnquiry.create({
      name: 'Anand Kumar',
      email: 'procurement@southerncement.com',
      phone: '+91 94432 11223',
      subject: 'Bulk RFQ for Timken Spherical Roller Bearings and PIX Belts',
      message: 'Need urgent quote for 12 pcs Timken 22220 bearings and 40 pcs PIX SPC 2360 wedge belts for kiln drive overhaul.',
      enquiryType: 'rfq',
      companyName: 'Southern Cement Works Ltd',
      gstin: '33AABCS1234F1Z9',
      brand: 'Timken',
      partNumber: '22220 and SPC 2360',
      quantity: 52,
      targetPrice: 85000,
    });

    console.log('[Seed] Database successfully seeded with full industrial catalog!');
    return {
      success: true,
      message: 'Database successfully seeded with full industrial catalog!',
      collections: {
        users: 3,
        categories: 6,
        services: 12,
        banners: 3,
        coupons: 5,
        testimonials: 4,
        faqs: 8,
      },
    };
  } catch (error) {
    console.error('[Seed Error]', error);
    throw error;
  }
};

// Auto-run if executed directly via CLI (e.g., `npm run seed`)
const isCLI = process.argv[1] && process.argv[1].replace(/\\/g, '/').includes('seed/seed.js');
if (isCLI) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
