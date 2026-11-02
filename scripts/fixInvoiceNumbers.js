import mongoose from 'mongoose';

async function fix() {
  await mongoose.connect('mongodb://127.0.0.1:27017/biz_zolution');
  const collection = mongoose.connection.db.collection('purchaseinvoices');
  const invs = await collection.find().toArray();
  for (let i = 0; i < invs.length; i++) {
    const num = `PUR-2026-${String(i + 1).padStart(4, '0')}`;
    await collection.updateOne(
      { _id: invs[i]._id },
      { $set: { purchaseNumber: num, invoiceNumber: num } }
    );
  }
  console.log(`Updated ${invs.length} invoices with invoiceNumber & purchaseNumber.`);
  process.exit(0);
}

fix();
