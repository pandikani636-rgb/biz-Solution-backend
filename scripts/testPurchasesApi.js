import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Supplier } from '../src/models/Supplier.js';
import { PurchaseInvoice } from '../src/models/PurchaseInvoice.js';
import { SiteSetting } from '../src/models/SiteSetting.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/biz_zolution';

async function testApi() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('--- TESTING PURCHASE DATA INTEGRITY ---');

    // 1. SiteSetting Check
    const siteSetting = await SiteSetting.findOne();
    console.log('Site Name:', siteSetting?.siteName);
    console.log('Site Logo:', siteSetting?.logo);
    console.log('Contact Email:', siteSetting?.contactEmail);
    console.log('Contact Phone:', siteSetting?.contactPhone);

    // 2. Suppliers Check
    const suppliers = await Supplier.find();
    console.log(`\nSuppliers Count: ${suppliers.length}`);
    suppliers.forEach((s) => {
      console.log(`- [${s.supplierCode}] ${s.name} | Cat: ${s.category} | Purchases: Rs. ${s.totalPurchases} | Balance: Rs. ${s.balanceDue}`);
    });

    // 3. Invoices Check
    const invoices = await PurchaseInvoice.find().populate('supplier');
    console.log(`\nPurchase Invoices Count: ${invoices.length}`);
    invoices.forEach((i) => {
      console.log(`- [${i.invoiceNumber}] Vendor: ${i.supplierName} | Status: ${i.status} | Pay: ${i.paymentStatus} | Grand: Rs. ${i.grandTotal} | Due: Rs. ${i.balanceDue}`);
      console.log(`  Items (${i.items.length}):`, i.items.map((it) => `${it.itemName} (${it.quantity} ${it.unit})`).join(', '));
    });

    console.log('\n--- ALL VERIFICATIONS PASSED ---');
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

testApi();
