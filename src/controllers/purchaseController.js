import { Supplier } from '../models/Supplier.js';
import { PurchaseInvoice } from '../models/PurchaseInvoice.js';

// Helper to recalculate supplier totals accurately
const recalculateSupplierTotals = async (supplierId) => {
  if (!supplierId) return;
  const invoices = await PurchaseInvoice.find({ supplier: supplierId, status: { $ne: 'Cancelled' } });
  const totalPurchases = invoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
  const balanceDue = Math.max(0, totalPurchases - totalPaid);

  await Supplier.findByIdAndUpdate(supplierId, {
    totalPurchases: Math.round(totalPurchases * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    balanceDue: Math.round(balanceDue * 100) / 100,
    invoiceCount: invoices.length,
  });
};

// ==========================================
// SUPPLIERS / VENDORS
// ==========================================

export const getSuppliers = async (req, res, next) => {
  try {
    const { search, category, status, sort = 'name', page = 1, limit = 50 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { supplierCode: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { gstin: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) query.category = category;
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [suppliers, total] = await Promise.all([
      Supplier.find(query).sort(sort).skip(skip).limit(Number(limit)),
      Supplier.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: suppliers,
      pagination: {
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const invoices = await PurchaseInvoice.find({ supplier: supplier._id }).sort({ purchaseDate: -1 }).limit(20);

    res.status(200).json({
      success: true,
      data: {
        supplier,
        invoices,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }
    res.status(200).json({
      success: true,
      message: 'Supplier updated successfully',
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSupplier = async (req, res, next) => {
  try {
    const invoiceCount = await PurchaseInvoice.countDocuments({ supplier: req.params.id });
    if (invoiceCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete supplier with ${invoiceCount} linked purchase invoices. Consider archiving or setting status to Inactive.`,
      });
    }

    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// PURCHASE INVOICES & ORDERS
// ==========================================

export const getPurchaseInvoices = async (req, res, next) => {
  try {
    const {
      search,
      supplier,
      status,
      paymentStatus,
      startDate,
      endDate,
      sort = '-purchaseDate',
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { purchaseNumber: { $regex: search, $options: 'i' } },
        { vendorInvoiceNumber: { $regex: search, $options: 'i' } },
        { supplierName: { $regex: search, $options: 'i' } },
        { 'items.itemName': { $regex: search, $options: 'i' } },
        { 'items.partNumber': { $regex: search, $options: 'i' } },
      ];
    }

    if (supplier) query.supplier = supplier;
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      query.purchaseDate = {};
      if (startDate) query.purchaseDate.$gte = new Date(startDate);
      if (endDate) query.purchaseDate.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [invoices, total] = await Promise.all([
      PurchaseInvoice.find(query)
        .populate('supplier', 'name supplierCode phone gstin email address')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      PurchaseInvoice.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPurchaseInvoiceById = async (req, res, next) => {
  try {
    const invoice = await PurchaseInvoice.findById(req.params.id).populate(
      'supplier',
      'name supplierCode phone email gstin address bankDetails paymentTerms'
    );
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Purchase invoice not found' });
    }
    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

export const createPurchaseInvoice = async (req, res, next) => {
  try {
    const {
      supplier: supplierId,
      vendorInvoiceNumber,
      purchaseDate,
      dueDate,
      status = 'Received',
      paymentMethod = 'Bank Transfer / NEFT',
      items = [],
      shippingCost = 0,
      discount = 0,
      initialPayment = 0,
      notes = '',
      receivedBy = 'K. Karthick Kumar',
    } = req.body;

    const supplierDoc = await Supplier.findById(supplierId);
    if (!supplierDoc) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    // Process line items and compute totals
    let calculatedSubtotal = 0;
    let calculatedTax = 0;

    const processedItems = items.map((item) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      const lineSubtotal = qty * price;
      const rate = Number(item.taxRate) || 18;
      const itemTax = Math.round(((lineSubtotal * rate) / 100) * 100) / 100;
      const lineTotal = Math.round((lineSubtotal + itemTax) * 100) / 100;

      calculatedSubtotal += lineSubtotal;
      calculatedTax += itemTax;

      return {
        itemName: item.itemName,
        partNumber: item.partNumber || '',
        category: item.category || supplierDoc.category || 'Bearings',
        hsnCode: item.hsnCode || '8482',
        quantity: qty,
        unit: item.unit || 'NOS',
        unitPrice: price,
        taxRate: rate,
        taxAmount: itemTax,
        totalAmount: lineTotal,
      };
    });

    const parsedShipping = Number(shippingCost) || 0;
    const parsedDiscount = Number(discount) || 0;
    const grandTotal = Math.round((calculatedSubtotal + calculatedTax + parsedShipping - parsedDiscount) * 100) / 100;
    const initialPaid = Math.min(grandTotal, Number(initialPayment) || 0);

    const payments = [];
    if (initialPaid > 0) {
      payments.push({
        amount: initialPaid,
        paymentDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        method: paymentMethod,
        reference: req.body.paymentReference || 'Initial Advance/Settlement',
        notes: 'Initial recorded payment',
        recordedBy: receivedBy,
      });
    }

    const newInvoice = await PurchaseInvoice.create({
      supplier: supplierDoc._id,
      supplierName: supplierDoc.name,
      vendorInvoiceNumber: vendorInvoiceNumber || '',
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status,
      items: processedItems,
      subtotal: Math.round(calculatedSubtotal * 100) / 100,
      taxAmount: Math.round(calculatedTax * 100) / 100,
      shippingCost: parsedShipping,
      discount: parsedDiscount,
      grandTotal,
      paidAmount: initialPaid,
      balanceDue: Math.max(0, grandTotal - initialPaid),
      paymentMethod,
      paymentReference: req.body.paymentReference || '',
      payments,
      notes,
      receivedBy,
    });

    // Update supplier statistics
    await recalculateSupplierTotals(supplierDoc._id);

    const populated = await PurchaseInvoice.findById(newInvoice._id).populate('supplier');

    res.status(201).json({
      success: true,
      message: 'Purchase invoice created successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePurchaseInvoice = async (req, res, next) => {
  try {
    const existing = await PurchaseInvoice.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Purchase invoice not found' });
    }

    const { items, shippingCost, discount, status, vendorInvoiceNumber, dueDate, notes, purchaseDate } = req.body;

    if (items && Array.isArray(items)) {
      let calculatedSubtotal = 0;
      let calculatedTax = 0;

      const processedItems = items.map((item) => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.unitPrice) || 0;
        const lineSubtotal = qty * price;
        const rate = Number(item.taxRate) || 18;
        const itemTax = Math.round(((lineSubtotal * rate) / 100) * 100) / 100;
        const lineTotal = Math.round((lineSubtotal + itemTax) * 100) / 100;

        calculatedSubtotal += lineSubtotal;
        calculatedTax += itemTax;

        return {
          itemName: item.itemName,
          partNumber: item.partNumber || '',
          category: item.category || 'Bearings',
          hsnCode: item.hsnCode || '8482',
          quantity: qty,
          unit: item.unit || 'NOS',
          unitPrice: price,
          taxRate: rate,
          taxAmount: itemTax,
          totalAmount: lineTotal,
        };
      });

      const parsedShipping = shippingCost !== undefined ? Number(shippingCost) : existing.shippingCost;
      const parsedDiscount = discount !== undefined ? Number(discount) : existing.discount;
      const grandTotal = Math.round((calculatedSubtotal + calculatedTax + parsedShipping - parsedDiscount) * 100) / 100;

      existing.items = processedItems;
      existing.subtotal = Math.round(calculatedSubtotal * 100) / 100;
      existing.taxAmount = Math.round(calculatedTax * 100) / 100;
      existing.shippingCost = parsedShipping;
      existing.discount = parsedDiscount;
      existing.grandTotal = grandTotal;
      existing.balanceDue = Math.max(0, grandTotal - (existing.paidAmount || 0));
    }

    if (status) existing.status = status;
    if (vendorInvoiceNumber !== undefined) existing.vendorInvoiceNumber = vendorInvoiceNumber;
    if (dueDate) existing.dueDate = new Date(dueDate);
    if (purchaseDate) existing.purchaseDate = new Date(purchaseDate);
    if (notes !== undefined) existing.notes = notes;

    await existing.save();
    await recalculateSupplierTotals(existing.supplier);

    const updated = await PurchaseInvoice.findById(existing._id).populate('supplier');

    res.status(200).json({
      success: true,
      message: 'Purchase invoice updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePurchaseInvoice = async (req, res, next) => {
  try {
    const invoice = await PurchaseInvoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Purchase invoice not found' });
    }

    await recalculateSupplierTotals(invoice.supplier);

    res.status(200).json({
      success: true,
      message: 'Purchase invoice deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const recordPurchasePayment = async (req, res, next) => {
  try {
    const { amount, method = 'Bank Transfer / NEFT', reference = '', notes = '' } = req.body;
    const paymentAmount = Number(amount);

    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
    }

    const invoice = await PurchaseInvoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Purchase invoice not found' });
    }

    invoice.payments.push({
      amount: paymentAmount,
      paymentDate: new Date(),
      method,
      reference,
      notes,
      recordedBy: 'K. Karthick Kumar',
    });

    invoice.paidAmount = Math.round(((invoice.paidAmount || 0) + paymentAmount) * 100) / 100;
    invoice.balanceDue = Math.max(0, Math.round((invoice.grandTotal - invoice.paidAmount) * 100) / 100);

    if (invoice.paidAmount >= invoice.grandTotal) {
      invoice.paymentStatus = 'Paid';
    } else {
      invoice.paymentStatus = 'Partially Paid';
    }

    await invoice.save();
    await recalculateSupplierTotals(invoice.supplier);

    const updated = await PurchaseInvoice.findById(invoice._id).populate('supplier');

    res.status(200).json({
      success: true,
      message: `Payment of ₹${paymentAmount.toLocaleString('en-IN')} recorded successfully`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// REPORTS & EXPENSE TRACKING
// ==========================================

export const getPurchaseReports = async (req, res, next) => {
  try {
    const { range = 'all' } = req.query;
    const query = { status: { $ne: 'Cancelled' } };

    if (range === 'month') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      query.purchaseDate = { $gte: firstDay };
    } else if (range === 'quarter') {
      const now = new Date();
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      query.purchaseDate = { $gte: threeMonthsAgo };
    } else if (range === 'year') {
      const now = new Date();
      const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
      query.purchaseDate = { $gte: firstDayOfYear };
    }

    const [invoices, suppliers] = await Promise.all([
      PurchaseInvoice.find(query).populate('supplier', 'name category city state'),
      Supplier.find({ status: 'Active' }),
    ]);

    const totalPurchases = invoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
    const totalPaid = invoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
    const totalOutstanding = Math.max(0, totalPurchases - totalPaid);

    // Category breakdown
    const categoryMap = {};
    invoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const cat = item.category || 'Bearings';
        categoryMap[cat] = (categoryMap[cat] || 0) + (item.totalAmount || 0);
      });
    });

    const categorySpend = Object.keys(categoryMap).map((cat) => ({
      category: cat,
      amount: Math.round(categoryMap[cat] * 100) / 100,
    }));

    // Monthly expense breakdown (last 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = {};

    invoices.forEach((inv) => {
      const d = new Date(inv.purchaseDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyMap[key] = (monthlyMap[key] || 0) + (inv.grandTotal || 0);
    });

    const monthlyExpenses = Object.keys(monthlyMap).map((month) => ({
      month,
      amount: Math.round(monthlyMap[month] * 100) / 100,
    }));

    // Top suppliers by spend
    const supplierSpendMap = {};
    invoices.forEach((inv) => {
      const sName = inv.supplierName || inv.supplier?.name || 'General Vendor';
      supplierSpendMap[sName] = (supplierSpendMap[sName] || 0) + (inv.grandTotal || 0);
    });

    const supplierRankings = Object.keys(supplierSpendMap)
      .map((name) => ({
        name,
        amount: Math.round(supplierSpendMap[name] * 100) / 100,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);

    // Status distribution
    const statusCounts = {
      received: invoices.filter((i) => i.status === 'Received').length,
      pending: invoices.filter((i) => i.status === 'Pending').length,
      inTransit: invoices.filter((i) => i.status === 'In Transit').length,
      paid: invoices.filter((i) => i.paymentStatus === 'Paid').length,
      partiallyPaid: invoices.filter((i) => i.paymentStatus === 'Partially Paid').length,
      unpaid: invoices.filter((i) => i.paymentStatus === 'Unpaid').length,
    };

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalPurchases: Math.round(totalPurchases * 100) / 100,
          totalPaid: Math.round(totalPaid * 100) / 100,
          totalOutstanding: Math.round(totalOutstanding * 100) / 100,
          totalInvoices: invoices.length,
          activeSuppliers: suppliers.length,
          averageOrderValue: invoices.length ? Math.round((totalPurchases / invoices.length) * 100) / 100 : 0,
        },
        categorySpend,
        monthlyExpenses,
        supplierRankings,
        statusCounts,
      },
    });
  } catch (error) {
    next(error);
  }
};
