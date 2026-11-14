import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Supplier } from '../src/models/Supplier.js';
import { PurchaseInvoice } from '../src/models/PurchaseInvoice.js';
import { SiteSetting } from '../src/models/SiteSetting.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/biz_zolution';

const suppliersData = [
  {
    supplierCode: 'SUP-001',
    name: 'SKF India Limited',
    contactPerson: 'Rajesh Mehta',
    phone: '+91 98200 12345',
    email: 'orders@skfindia.com',
    gstin: '27AAACS1814F1ZZ',
    category: 'Bearings',
    paymentTerms: 'Net 30',
    address: {
      street: 'Chinchwad Industrial Area, Pune-Mumbai Highway',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411033',
      country: 'India',
    },
    bankDetails: {
      bankName: 'HDFC Bank Ltd',
      accountNumber: '50200012345678',
      ifscCode: 'HDFC0000052',
      branch: 'Chinchwad Branch',
    },
    status: 'Active',
    notes: 'Primary supplier for SKF Deep Groove and Spherical Roller Bearings.',
  },
  {
    supplierCode: 'SUP-002',
    name: 'JK Fenner (India) Limited',
    contactPerson: 'S. Shanmugam',
    phone: '+91 94440 23456',
    email: 'sales.south@jkfenner.com',
    gstin: '33AAACJ0234M1Z5',
    category: 'Belts & Transmission',
    paymentTerms: 'Net 30',
    address: {
      street: '3 Madurai-Melur Road',
      city: 'Madurai',
      state: 'Tamil Nadu',
      pincode: '625106',
      country: 'India',
    },
    bankDetails: {
      bankName: 'State Bank of India',
      accountNumber: '319088776655',
      ifscCode: 'SBIN0000874',
      branch: 'Madurai Main Branch',
    },
    status: 'Active',
    notes: 'Authorized manufacturer for Fenner V-Belts, Cogged Belts, and Pulleys.',
  },
  {
    supplierCode: 'SUP-003',
    name: 'PIX Transmissions Ltd',
    contactPerson: 'Amitabh Sharma',
    phone: '+91 98901 34567',
    email: 'corporate@pixtrans.com',
    gstin: '27AAACP4412B1ZK',
    category: 'Belts & Transmission',
    paymentTerms: 'Net 45',
    address: {
      street: 'J-7, MIDC Hingna Road',
      city: 'Nagpur',
      state: 'Maharashtra',
      pincode: '440016',
      country: 'India',
    },
    bankDetails: {
      bankName: 'ICICI Bank',
      accountNumber: '003905001234',
      ifscCode: 'ICIC0000039',
      branch: 'MIDC Nagpur',
    },
    status: 'Active',
    notes: 'Supplier of PIX industrial wrapped and raw-edge V-Belts.',
  },
  {
    supplierCode: 'SUP-004',
    name: 'National Engineering Industries Ltd (NBC)',
    contactPerson: 'Vikram Singh',
    phone: '+91 94140 45678',
    email: 'industrial@nbcbearings.in',
    gstin: '08AAACN0123L1ZF',
    category: 'Bearings',
    paymentTerms: 'Net 30',
    address: {
      street: 'Khatipura Road',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302006',
      country: 'India',
    },
    bankDetails: {
      bankName: 'Axis Bank',
      accountNumber: '915020033445566',
      ifscCode: 'UTIB0000010',
      branch: 'Jaipur Central',
    },
    status: 'Active',
    notes: 'Direct supplier of NBC industrial ball and taper roller bearings.',
  },
  {
    supplierCode: 'SUP-005',
    name: 'Siemens Industrial Drives & Motors',
    contactPerson: 'K. Srinivasan',
    phone: '+91 98402 56789',
    email: 'channel.chennai@siemens.com',
    gstin: '33AAACS2341R1Z9',
    category: 'Motors',
    paymentTerms: 'Advance',
    address: {
      street: 'No. 8, Mount Poonamallee High Road, Porur',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600116',
      country: 'India',
    },
    bankDetails: {
      bankName: 'Citibank N.A.',
      accountNumber: '0012456789',
      ifscCode: 'CITI0000003',
      branch: 'Chennai Branch',
    },
    status: 'Active',
    notes: 'Authorized distributor for Siemens high-efficiency industrial motors and switchgears.',
  },
  {
    supplierCode: 'SUP-006',
    name: 'Shanthi Gears Limited',
    contactPerson: 'M. Duraisamy',
    phone: '+91 98422 67890',
    email: 'sales@shanthigears.murugappa.com',
    gstin: '33AAACS4567P1ZA',
    category: 'Gearboxes & Spares',
    paymentTerms: 'Net 30',
    address: {
      street: 'Avinashi Road, Singanallur',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      pincode: '641005',
      country: 'India',
    },
    bankDetails: {
      bankName: 'Canara Bank',
      accountNumber: '1244101019283',
      ifscCode: 'CNRB0001244',
      branch: 'Singanallur Coimbatore',
    },
    status: 'Active',
    notes: 'Murugappa Group company specializing in heavy duty gearboxes and custom gears.',
  },
];

async function seedPurchases() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB:', MONGO_URI);

    // 1. Update SiteSetting
    let siteSetting = await SiteSetting.findOne();
    if (!siteSetting) {
      siteSetting = new SiteSetting();
    }
    siteSetting.siteName = 'Balumuni and Associates';
    siteSetting.tagLine = 'Industrial Power Transmission & Bearings Solutions Partner';
    siteSetting.logo = '/bm-logo.png';
    siteSetting.favicon = '/bm-logo.png';
    siteSetting.contactEmail = 'balumuniandassociates@gmail.com';
    siteSetting.contactPhone = '+91 74184 23238';
    siteSetting.address = '45B/16 Noorullah Mall, Oothumalai Paradesimadam Street, Srivilliputtur, Virudhunagar Dist, Tamilnadu - 626125';
    siteSetting.metaDefaults = {
      title: 'Balumuni and Associates | Industrial Power Transmission & Bearings',
      description: 'Authorised dealers and stockists of industrial belts, bearings, gears, and motors.',
    };
    siteSetting.aboutUsSection = {
      title: 'Balumuni and Associates - Quality Power Transmission & Bearings',
      description: 'Supplying leading industrial brands like PIX, JK Fenner, SKF, FAG, Timken, NTN, Shanthi Gears, Siemens, ABB, Bharat Bijlee with reliable stock and technical support.',
      yearsOfExperience: 18,
      clientsServed: 1200,
      satisfactionRate: 99,
    };
    await siteSetting.save();
    console.log('SiteSetting updated to Balumuni and Associates.');

    // 2. Upsert Suppliers
    const seededSuppliers = [];
    for (const sup of suppliersData) {
      const existing = await Supplier.findOne({ name: sup.name });
      if (existing) {
        Object.assign(existing, sup);
        const saved = await existing.save();
        seededSuppliers.push(saved);
      } else {
        const created = await Supplier.create(sup);
        seededSuppliers.push(created);
      }
    }
    console.log(`Upserted ${seededSuppliers.length} suppliers.`);

    // 3. Seed Realistic Invoices if fewer than 5 exist
    const invoiceCount = await PurchaseInvoice.countDocuments();
    if (invoiceCount < 4) {
      const skf = seededSuppliers.find((s) => s.name.includes('SKF'));
      const fenner = seededSuppliers.find((s) => s.name.includes('Fenner'));
      const pix = seededSuppliers.find((s) => s.name.includes('PIX'));
      const nbc = seededSuppliers.find((s) => s.name.includes('NBC'));

      const sampleInvoices = [
        {
          invoiceNumber: 'PUR-2026-0001',
          vendorInvoiceNumber: 'SKF/INV/2026/0491',
          supplier: skf._id,
          supplierName: skf.name,
          purchaseDate: new Date('2026-03-05'),
          dueDate: new Date('2026-04-04'),
          items: [
            {
              itemName: 'SKF Deep Groove Ball Bearing 6205-2RSH',
              partNumber: '6205-2RSH/C3',
              category: 'Bearings',
              hsnCode: '84821010',
              quantity: 200,
              unit: 'PCS',
              unitPrice: 220,
              taxRate: 18,
              taxAmount: 7920,
              totalAmount: 51920,
            },
            {
              itemName: 'SKF Spherical Roller Bearing 22212 EK',
              partNumber: '22212-EK/C3',
              category: 'Bearings',
              hsnCode: '84823000',
              quantity: 40,
              unit: 'PCS',
              unitPrice: 1850,
              taxRate: 18,
              taxAmount: 13320,
              totalAmount: 87320,
            },
          ],
          subtotal: 118000,
          taxTotal: 21240,
          shippingCharges: 1500,
          discount: 2500,
          grandTotal: 138240,
          paidAmount: 138240,
          balanceDue: 0,
          paymentStatus: 'Paid',
          status: 'Received',
          receivedDate: new Date('2026-03-08'),
          warehouseLocation: 'Main Godown Srivilliputtur - Rack B1',
          payments: [
            {
              paymentDate: new Date('2026-03-12'),
              amount: 138240,
              paymentMethod: 'NEFT/RTGS',
              referenceNumber: 'NEFT2603120098',
              notes: 'Full settlement via HDFC Net Banking',
            },
          ],
          notes: 'Standard stock replenishment for textile mills client inquiries.',
        },
        {
          invoiceNumber: 'PUR-2026-0002',
          vendorInvoiceNumber: 'JKF/TX/98214',
          supplier: fenner._id,
          supplierName: fenner.name,
          purchaseDate: new Date('2026-03-15'),
          dueDate: new Date('2026-04-14'),
          items: [
            {
              itemName: 'Fenner Classic V-Belt B-68',
              partNumber: 'FEN-V-B68',
              category: 'Belts & Transmission',
              hsnCode: '40103100',
              quantity: 150,
              unit: 'PCS',
              unitPrice: 380,
              taxRate: 18,
              taxAmount: 10260,
              totalAmount: 67260,
            },
            {
              itemName: 'Fenner Wedge Belt SPC 3000',
              partNumber: 'FEN-W-SPC3000',
              category: 'Belts & Transmission',
              hsnCode: '40103200',
              quantity: 50,
              unit: 'PCS',
              unitPrice: 850,
              taxRate: 18,
              taxAmount: 7650,
              totalAmount: 50150,
            },
          ],
          subtotal: 99500,
          taxTotal: 17910,
          shippingCharges: 1200,
          discount: 0,
          grandTotal: 118610,
          paidAmount: 60000,
          balanceDue: 58610,
          paymentStatus: 'Partially Paid',
          status: 'Received',
          receivedDate: new Date('2026-03-18'),
          warehouseLocation: 'Belt Section - Rack A2',
          payments: [
            {
              paymentDate: new Date('2026-03-20'),
              amount: 60000,
              paymentMethod: 'NEFT/RTGS',
              referenceNumber: 'RTGS2603207712',
              notes: 'Part payment 50%',
            },
          ],
          notes: 'High demand items for ginning mills and cement crushers.',
        },
        {
          invoiceNumber: 'PUR-2026-0003',
          vendorInvoiceNumber: 'PIX/EXP/44019',
          supplier: pix._id,
          supplierName: pix.name,
          purchaseDate: new Date('2026-03-24'),
          dueDate: new Date('2026-04-23'),
          items: [
            {
              itemName: 'PIX-X-set Wrapped Belts C-112',
              partNumber: 'PIX-C-112',
              category: 'Belts & Transmission',
              hsnCode: '40103100',
              quantity: 80,
              unit: 'PCS',
              unitPrice: 620,
              taxRate: 18,
              taxAmount: 8928,
              totalAmount: 58528,
            },
          ],
          subtotal: 49600,
          taxTotal: 8928,
          shippingCharges: 800,
          discount: 1000,
          grandTotal: 58328,
          paidAmount: 0,
          balanceDue: 58328,
          paymentStatus: 'Unpaid',
          status: 'In Transit',
          warehouseLocation: 'Transit Dispatch - Expected at Srivilliputtur Hub',
          notes: 'Consignment dispatched via VRL Logistics LR #7781203.',
        },
        {
          invoiceNumber: 'PUR-2026-0004',
          vendorInvoiceNumber: 'NBC/IND/2026/812',
          supplier: nbc._id,
          supplierName: nbc.name,
          purchaseDate: new Date('2026-03-28'),
          dueDate: new Date('2026-04-27'),
          items: [
            {
              itemName: 'NBC Taper Roller Bearing 32210',
              partNumber: '32210-JR',
              category: 'Bearings',
              hsnCode: '84822000',
              quantity: 100,
              unit: 'PCS',
              unitPrice: 640,
              taxRate: 18,
              taxAmount: 11520,
              totalAmount: 75520,
            },
            {
              itemName: 'NBC Pillow Block Bearing UCP 208',
              partNumber: 'UCP-208',
              category: 'Bearings',
              hsnCode: '84832000',
              quantity: 60,
              unit: 'PCS',
              unitPrice: 520,
              taxRate: 18,
              taxAmount: 5616,
              totalAmount: 36816,
            },
          ],
          subtotal: 95200,
          taxTotal: 17136,
          shippingCharges: 1100,
          discount: 1500,
          grandTotal: 111936,
          paidAmount: 111936,
          balanceDue: 0,
          paymentStatus: 'Paid',
          status: 'Received',
          receivedDate: new Date('2026-03-31'),
          warehouseLocation: 'Main Godown Srivilliputtur - Rack B3',
          payments: [
            {
              paymentDate: new Date('2026-03-30'),
              amount: 111936,
              paymentMethod: 'UPI',
              referenceNumber: 'UPI/382910391/AXIS',
              notes: 'Full payment cleared',
            },
          ],
          notes: 'Supplied directly from Jaipur stock depot.',
        },
      ];

      for (const inv of sampleInvoices) {
        await PurchaseInvoice.create(inv);
      }
      console.log(`Seeded ${sampleInvoices.length} purchase invoices.`);
    }

    // Recalculate totals for all suppliers
    for (const sup of seededSuppliers) {
      const invoices = await PurchaseInvoice.find({ supplier: sup._id, status: { $ne: 'Cancelled' } });
      const totalPurchases = invoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
      const totalPaid = invoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
      const balanceDue = Math.max(0, totalPurchases - totalPaid);

      sup.totalPurchases = Math.round(totalPurchases * 100) / 100;
      sup.totalPaid = Math.round(totalPaid * 100) / 100;
      sup.balanceDue = Math.round(balanceDue * 100) / 100;
      sup.invoiceCount = invoices.length;
      await sup.save();
    }
    console.log('Supplier totals updated accurately.');

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding purchases:', err);
    process.exit(1);
  }
}

seedPurchases();
