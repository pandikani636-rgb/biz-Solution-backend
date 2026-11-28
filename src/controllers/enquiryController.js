import { ContactEnquiry } from '../models/ContactEnquiry.js';
import { User } from '../models/User.js';
import { notifyAdmins, createNotification } from '../services/notificationService.js';
import { sendEmail } from '../services/emailService.js';
import { ENQUIRY_STATUS } from '../config/constants.js';

export const submitEnquiry = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      subject,
      message,
      enquiryType = 'general',
      companyName,
      gstin,
      deliveryLocation,
      brand,
      partNumber,
      quantity,
      targetPrice,
    } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const isRfq = enquiryType === 'rfq' || enquiryType === 'bulk_order';
    let quotationNumber = '';
    let monthlySequence = 1;
    if (isRfq) {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = String(now.getFullYear()).slice(-2);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const countThisMonth = await ContactEnquiry.countDocuments({
        enquiryType: { $in: ['rfq', 'bulk_order'] },
        createdAt: { $gte: startOfMonth },
      });
      monthlySequence = countThisMonth + 1;
      // Sequential format: QT-[Sequential Number]-[Month]-[Year] (e.g. QT-22-11-26)
      quotationNumber = `QT-${monthlySequence}-${month}-${year}`;
    }

    // Try finding customer account by token or email
    let customerId = req.user ? req.user._id : null;
    if (!customerId) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) customerId = existingUser._id;
    }

    // Items array & pricing calculations
    let quotationItems = [];
    if (Array.isArray(req.body.items) && req.body.items.length > 0) {
      quotationItems = req.body.items.map((it) => {
        const qty = Number(it.quantity) || 1;
        const mrp = Number(it.mrp) || Number(it.unitPrice) || 0;
        const disc = it.discountPercentage !== undefined ? Number(it.discountPercentage) : 48;
        const rate = it.rate !== undefined ? Number(it.rate) : Math.round(mrp * (1 - disc / 100));
        const amount = it.amount !== undefined ? Number(it.amount) : Math.round(rate * qty);
        return {
          category: it.category || brand || '',
          partNumber: it.partNumber || partNumber || '',
          name: it.name || it.partNumber || '',
          description: it.description || `${it.category || ''} ${it.partNumber || ''}`.trim(),
          hsn: it.hsn || '8482',
          quantity: qty,
          mrp,
          discountPercentage: disc,
          rate,
          amount,
        };
      });
    } else if (partNumber) {
      const qty = quantity ? Number(quantity) : 1;
      const target = targetPrice ? Number(targetPrice) : 0;
      quotationItems = [
        {
          category: brand || 'Industrial Spares',
          partNumber: partNumber,
          name: partNumber,
          description: `${brand ? brand + ' - ' : ''}${partNumber}`,
          hsn: '8482',
          quantity: qty,
          mrp: target > 0 ? target : 1000,
          discountPercentage: 48,
          rate: target > 0 ? Math.round(target * 0.52) : 520,
          amount: target > 0 ? Math.round(target * 0.52) * qty : 520 * qty,
        },
      ];
    }

    const subtotal = quotationItems.reduce((acc, it) => acc + (it.amount || 0), 0) || (targetPrice ? Number(targetPrice) : 0);
    const deliveryCharge = Number(req.body.deliveryCharge) || 0;
    const taxRate = Number(req.body.taxRate) || 18;
    const taxAmount = Math.round(((subtotal + deliveryCharge) * (taxRate / 100)) * 100) / 100;
    const totalAmount = Math.round((subtotal + deliveryCharge + taxAmount) * 100) / 100;

    // Attach any customer images passed in request
    const customerImages = Array.isArray(req.body.customerImages) ? req.body.customerImages : [];

    const enquiry = await ContactEnquiry.create({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      subject,
      message,
      enquiryType,
      quotationNumber,
      monthlySequence,
      customer: customerId,
      companyName: companyName || '',
      gstin: gstin || '',
      deliveryLocation: deliveryLocation || '',
      brand: brand || '',
      partNumber: partNumber || (quotationItems[0]?.partNumber || ''),
      quantity: quantity ? Number(quantity) : (quotationItems.reduce((acc, it) => acc + it.quantity, 0) || 1),
      targetPrice: targetPrice ? Number(targetPrice) : subtotal,
      approvedPrice: targetPrice ? Number(targetPrice) : subtotal,
      items: quotationItems,
      subtotal,
      deliveryCharge,
      taxRate,
      taxAmount,
      totalAmount,
      paymentTerms: req.body.paymentTerms || '7 DAYS CREDIT',
      deliveryTerms: req.body.deliveryTerms || 'SELF TO SRIVIL',
      customerImages,
      status: ENQUIRY_STATUS.NEW,
    });

    // Notify administrators
    await notifyAdmins({
      title: isRfq ? `New B2B RFQ / Quotation #${quotationNumber}` : 'New Customer Enquiry',
      message: `${name} (${companyName || email}) submitted ${isRfq ? `Quotation request for ${partNumber || 'Bulk parts'}` : `enquiry: "${subject}"`}`,
      type: 'enquiry',
      link: `/admin/enquiries`,
    });

    // If customer is known, send confirmation notification
    if (customerId) {
      await createNotification({
        recipient: customerId,
        title: isRfq ? 'Quotation Request Received' : 'Enquiry Received',
        message: isRfq
          ? `Your quotation request #${quotationNumber} has been received. Our sales desk is reviewing pricing.`
          : `We received your inquiry regarding "${subject}".`,
        type: 'enquiry',
        link: '/customer/quotations',
      });
    }

    res.status(201).json({
      success: true,
      message: isRfq
        ? `Quotation request #${quotationNumber} submitted successfully. Our team will review and approve pricing within 1 hour.`
        : 'Thank you! Your enquiry has been received. Our team will get back to you shortly.',
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};

export const getEnquiries = async (req, res, next) => {
  try {
    const { status, type, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status && Object.values(ENQUIRY_STATUS).includes(status)) {
      query.status = status;
    }

    if (type) {
      if (type === 'rfq') {
        query.enquiryType = { $in: ['rfq', 'bulk_order'] };
      } else {
        query.enquiryType = type;
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { quotationNumber: { $regex: search, $options: 'i' } },
        { partNumber: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [enquiries, total, thisMonthTotal] = await Promise.all([
      ContactEnquiry.find(query).populate('customer', 'name email phone avatar').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      ContactEnquiry.countDocuments(query),
      ContactEnquiry.countDocuments({
        ...query,
        createdAt: { $gte: startOfMonth },
      }),
    ]);

    res.json({
      success: true,
      data: enquiries,
      thisMonthTotal,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const approveQuotation = async (req, res, next) => {
  try {
    const { approvedPrice, adminNotes, replyMessage } = req.body;
    const enquiry = await ContactEnquiry.findById(req.params.id);

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    enquiry.status = ENQUIRY_STATUS.APPROVED;
    if (approvedPrice !== undefined) enquiry.approvedPrice = Number(approvedPrice) || 0;
    if (adminNotes) enquiry.internalNotes = adminNotes;
    if (replyMessage) enquiry.replyMessage = replyMessage;
    enquiry.approvedAt = new Date();
    await enquiry.save();

    // 1. Send customer in-app notification: "Your quotation has been approved!"
    if (enquiry.customer) {
      await createNotification({
        recipient: enquiry.customer,
        title: 'Your quotation has been approved!',
        message: `Your quotation ${enquiry.quotationNumber ? '#' + enquiry.quotationNumber : ''} for ${enquiry.partNumber || 'requested items'} has been approved at ₹${enquiry.approvedPrice || enquiry.targetPrice || 0}.`,
        type: 'enquiry',
        link: '/customer/quotations',
      });
    }

    // 2. Email customer
    await sendEmail({
      to: enquiry.email,
      subject: `Your quotation has been approved! - ${enquiry.quotationNumber || enquiry.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #111827;">
          <h2 style="color: #16A34A;">Your quotation has been approved!</h2>
          <p>Dear <strong>${enquiry.name}</strong>,</p>
          <p>We are pleased to inform you that your quotation request has been officially approved by Balumuni & Associates.</p>
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Quotation #:</strong> ${enquiry.quotationNumber || 'N/A'}</p>
            <p><strong>Part Numbers:</strong> ${enquiry.partNumber || 'N/A'}</p>
            <p><strong>Quantity:</strong> ${enquiry.quantity} Units</p>
            <p><strong>Approved Unit Rate:</strong> ₹${enquiry.approvedPrice || enquiry.targetPrice}</p>
            ${replyMessage ? `<p><strong>Note:</strong> ${replyMessage}</p>` : ''}
          </div>
          <p>உங்கள் நம்பிக்கையில் எங்கள் பயணம்!</p>
          <p>Best regards,<br>Balumuni & Associates Sales Desk</p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: 'Quotation approved successfully and notification sent to customer',
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectQuotation = async (req, res, next) => {
  try {
    const { reason = 'Quotation could not be approved at this time', adminNotes } = req.body;
    const enquiry = await ContactEnquiry.findById(req.params.id);

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    enquiry.status = ENQUIRY_STATUS.REJECTED;
    enquiry.rejectionReason = reason;
    if (adminNotes) enquiry.internalNotes = adminNotes;
    enquiry.rejectedAt = new Date();
    await enquiry.save();

    // 1. Send customer in-app notification
    if (enquiry.customer) {
      await createNotification({
        recipient: enquiry.customer,
        title: 'Quotation Status Update',
        message: `Your quotation ${enquiry.quotationNumber ? '#' + enquiry.quotationNumber : ''} status was updated to Rejected: ${reason}`,
        type: 'enquiry',
        link: '/customer/quotations',
      });
    }

    // 2. Email customer
    await sendEmail({
      to: enquiry.email,
      subject: `Quotation Status Update - ${enquiry.quotationNumber || enquiry.subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #111827;">
          <h2 style="color: #DC2626;">Quotation Status Update</h2>
          <p>Dear <strong>${enquiry.name}</strong>,</p>
          <p>Your quotation request ${enquiry.quotationNumber ? '#' + enquiry.quotationNumber : ''} could not be approved for the following reason:</p>
          <blockquote style="background: #FEE2E2; border-left: 4px solid #DC2626; padding: 12px; margin: 16px 0;">
            ${reason}
          </blockquote>
          <p>Please contact our sales desk for alternative part recommendations.</p>
          <p>Best regards,<br>Balumuni & Associates</p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: 'Quotation status updated to rejected and customer notified',
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyCustomerQuotations = async (req, res, next) => {
  try {
    const userEmail = req.user.email ? req.user.email.toLowerCase() : '';
    const userPhone = req.user.phone || '';
    
    const orConditions = [{ customer: req.user._id }];
    if (userEmail) {
      orConditions.push({ email: userEmail });
    }
    if (userPhone) {
      orConditions.push({ phone: userPhone });
    }

    const quotations = await ContactEnquiry.find({
      $or: orConditions,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: quotations,
    });
  } catch (error) {
    next(error);
  }
};

export const updateEnquiryStatus = async (req, res, next) => {
  try {
    const { status, internalNotes, replyMessage } = req.body;
    const enquiry = await ContactEnquiry.findById(req.params.id);

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    if (status) enquiry.status = status;
    if (internalNotes !== undefined) enquiry.internalNotes = internalNotes;

    if (replyMessage) {
      enquiry.replyMessage = replyMessage;
      enquiry.repliedAt = new Date();

      // Send email to customer
      await sendEmail({
        to: enquiry.email,
        subject: `Response regarding your enquiry: ${enquiry.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <p>Dear <strong>${enquiry.name}</strong>,</p>
            <p>Thank you for contacting BizZolution. Here is our response to your enquiry:</p>
            <blockquote style="background: #F1F5F9; border-left: 4px solid #2563EB; padding: 12px; margin: 16px 0;">
              ${replyMessage}
            </blockquote>
            <p>Best regards,<br>The BizZolution Support Team</p>
          </div>
        `,
      });
    }

    await enquiry.save();

    res.json({
      success: true,
      message: 'Enquiry updated successfully',
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEnquiry = async (req, res, next) => {
  try {
    const enquiry = await ContactEnquiry.findByIdAndDelete(req.params.id);
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    res.json({ success: true, message: 'Enquiry deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin Manually Creates Quotation
 */
export const adminCreateQuotation = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      companyName,
      gstin,
      deliveryLocation,
      items = [],
      deliveryCharge = 0,
      paymentTerms = '7 DAYS CREDIT',
      deliveryTerms = 'SELF TO SRIVIL',
      notes = '',
      status = 'approved',
    } = req.body;

    if (!name || (!email && !phone)) {
      return res.status(400).json({ success: false, message: 'Please provide customer name and phone or email' });
    }

    const now = new Date();
    const month = now.getMonth() + 1;
    const year = String(now.getFullYear()).slice(-2);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const countThisMonth = await ContactEnquiry.countDocuments({
      enquiryType: { $in: ['rfq', 'bulk_order'] },
      createdAt: { $gte: startOfMonth },
    });
    const monthlySequence = countThisMonth + 1;
    const quotationNumber = `${monthlySequence}/${month}/${year}`;

    // Lookup customer user if exists
    let customerId = null;
    if (email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) customerId = existingUser._id;
    }

    const formattedItems = (items || []).map((it) => {
      const qty = Number(it.quantity) || 1;
      const mrp = Number(it.mrp) || 0;
      const disc = it.discountPercentage !== undefined ? Number(it.discountPercentage) : 48;
      const rate = it.rate !== undefined ? Number(it.rate) : Math.round(mrp * (1 - disc / 100));
      const amount = it.amount !== undefined ? Number(it.amount) : Math.round(rate * qty);
      return {
        category: it.category || 'Industrial Bearings',
        partNumber: it.partNumber || 'PART-001',
        name: it.name || it.partNumber || 'Industrial Part',
        description: it.description || `${it.category || ''} ${it.partNumber || ''}`.trim(),
        hsn: it.hsn || '8482',
        quantity: qty,
        mrp,
        discountPercentage: disc,
        rate,
        amount,
      };
    });

    const subtotal = formattedItems.reduce((acc, it) => acc + (it.amount || 0), 0);
    const delCharge = Number(deliveryCharge) || 0;
    const taxRate = 18;
    const taxAmount = Math.round(((subtotal + delCharge) * (taxRate / 100)) * 100) / 100;
    const totalAmount = Math.round((subtotal + delCharge + taxAmount) * 100) / 100;

    const quotation = await ContactEnquiry.create({
      name,
      email: (email || `${(phone || '').replace(/[^0-9]/g, '')}@balumuni-client.com`).toLowerCase(),
      phone: phone || '',
      subject: `Admin Generated Quotation: ${quotationNumber}`,
      message: `Quotation created manually by sales administration.\nNotes: ${notes}`,
      enquiryType: 'rfq',
      quotationNumber,
      monthlySequence,
      customer: customerId,
      companyName: companyName || '',
      gstin: gstin || '',
      deliveryLocation: deliveryLocation || '',
      brand: formattedItems[0]?.category || 'Industrial Supplies',
      partNumber: formattedItems.map((it) => it.partNumber).join(', '),
      quantity: formattedItems.reduce((acc, it) => acc + it.quantity, 0) || 1,
      targetPrice: totalAmount,
      approvedPrice: totalAmount,
      items: formattedItems,
      subtotal,
      deliveryCharge: delCharge,
      taxRate,
      taxAmount,
      totalAmount,
      paymentTerms,
      deliveryTerms,
      internalNotes: notes,
      status: status || 'approved',
      approvedAt: status === 'approved' ? new Date() : null,
    });

    res.status(201).json({
      success: true,
      message: `Quotation ENQ No: ${quotationNumber} created successfully.`,
      data: quotation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin Updates / Edits Quotation Details
 */
export const updateQuotation = async (req, res, next) => {
  try {
    const enquiry = await ContactEnquiry.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    const {
      name,
      companyName,
      email,
      phone,
      gstin,
      deliveryLocation,
      items,
      deliveryCharge,
      taxRate = 18,
      paymentTerms,
      deliveryTerms,
      status,
      approvedPrice,
      internalNotes,
      replyMessage,
    } = req.body;

    if (name) enquiry.name = name;
    if (companyName !== undefined) enquiry.companyName = companyName;
    if (email) enquiry.email = email.toLowerCase();
    if (phone !== undefined) enquiry.phone = phone;
    if (gstin !== undefined) enquiry.gstin = gstin;
    if (deliveryLocation !== undefined) enquiry.deliveryLocation = deliveryLocation;
    if (paymentTerms !== undefined) enquiry.paymentTerms = paymentTerms;
    if (deliveryTerms !== undefined) enquiry.deliveryTerms = deliveryTerms;
    if (internalNotes !== undefined) enquiry.internalNotes = internalNotes;
    if (replyMessage !== undefined) enquiry.replyMessage = replyMessage;

    if (status) {
      enquiry.status = status;
      if (status === 'approved' && !enquiry.approvedAt) {
        enquiry.approvedAt = new Date();
      }
    }

    if (Array.isArray(items)) {
      enquiry.items = items.map((it) => {
        const qty = Number(it.quantity) || 1;
        const mrp = Number(it.mrp) || 0;
        const disc = it.discountPercentage !== undefined ? Number(it.discountPercentage) : 48;
        const rate = it.rate !== undefined ? Number(it.rate) : Math.round(mrp * (1 - disc / 100));
        const amount = it.amount !== undefined ? Number(it.amount) : Math.round(rate * qty);
        return {
          category: it.category || '',
          partNumber: it.partNumber || '',
          name: it.name || it.partNumber || '',
          description: it.description || `${it.category || ''} ${it.partNumber || ''}`.trim(),
          hsn: it.hsn || '8482',
          quantity: qty,
          mrp,
          discountPercentage: disc,
          rate,
          amount,
        };
      });

      const subtotal = enquiry.items.reduce((acc, it) => acc + (it.amount || 0), 0);
      const delCharge = deliveryCharge !== undefined ? Number(deliveryCharge) : (enquiry.deliveryCharge || 0);
      const tRate = Number(taxRate) || 18;
      const taxAmount = Math.round(((subtotal + delCharge) * (tRate / 100)) * 100) / 100;
      const totalAmount = Math.round((subtotal + delCharge + taxAmount) * 100) / 100;

      enquiry.subtotal = subtotal;
      enquiry.deliveryCharge = delCharge;
      enquiry.taxRate = tRate;
      enquiry.taxAmount = taxAmount;
      enquiry.totalAmount = totalAmount;
      enquiry.approvedPrice = totalAmount;
      enquiry.partNumber = enquiry.items.map((i) => i.partNumber).join(', ');
      enquiry.quantity = enquiry.items.reduce((acc, it) => acc + it.quantity, 0) || 1;
    } else if (deliveryCharge !== undefined) {
      enquiry.deliveryCharge = Number(deliveryCharge);
      const subtotal = enquiry.subtotal || 0;
      const tRate = enquiry.taxRate || 18;
      enquiry.taxAmount = Math.round(((subtotal + enquiry.deliveryCharge) * (tRate / 100)) * 100) / 100;
      enquiry.totalAmount = Math.round((subtotal + enquiry.deliveryCharge + enquiry.taxAmount) * 100) / 100;
    }

    if (approvedPrice !== undefined) {
      enquiry.approvedPrice = Number(approvedPrice);
    }

    await enquiry.save();

    res.json({
      success: true,
      message: 'Quotation details updated successfully',
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin Generates Invoice from an Existing Quotation
 */
export const generateInvoiceFromQuotation = async (req, res, next) => {
  try {
    const enquiry = await ContactEnquiry.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    const cleanNum = (enquiry.quotationNumber || '1').replace(/\//g, '-');
    const invoiceNumber = `INV-${cleanNum}`;

    enquiry.invoiceGenerated = true;
    enquiry.invoiceNumber = invoiceNumber;
    enquiry.invoiceDate = new Date();
    await enquiry.save();

    res.json({
      success: true,
      message: `Invoice #${invoiceNumber} successfully generated from Quotation #${enquiry.quotationNumber}.`,
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send Quotation Email to Customer (with optional PDF attachment)
 */
export const sendQuotationEmail = async (req, res, next) => {
  try {
    const enquiry = await ContactEnquiry.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    const { recipientEmail, customSubject, customMessage, pdfBase64, isInvoice = false } = req.body;
    const targetEmail = recipientEmail || enquiry.email;

    if (!targetEmail || !targetEmail.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid recipient email address is required' });
    }

    const docType = isInvoice ? 'Tax Invoice' : 'Quotation';
    const docNumber = isInvoice
      ? (enquiry.invoiceNumber || `INV-${enquiry.quotationNumber?.replace(/\//g, '-')}`)
      : `ENQ No: ${enquiry.quotationNumber || 'N/A'}`;

    const attachments = [];
    if (pdfBase64) {
      // Decode base64 PDF
      const pdfBuffer = Buffer.from(pdfBase64.replace(/^data:application\/pdf;base64,/, ''), 'base64');
      attachments.push({
        filename: `${docType.replace(/\s+/g, '_')}_${(enquiry.quotationNumber || 'Doc').replace(/\//g, '-')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      });
    }

    const subject = customSubject || `Official ${docType} ${docNumber} - Balumuni and Associates`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #0F172A; border: 1px solid #CBD5E1; border-radius: 12px; overflow: hidden;">
        <div style="background: #1E3A8A; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">BALUMUNI AND ASSOCIATES</h1>
          <p style="margin: 4px 0 0; font-size: 12px; color: #93C5FD;">Industrial Power Transmission & Bearings</p>
          <p style="margin: 2px 0 0; font-size: 11px; color: #FCD34D;">GSTIN: 33HONPK5547G2ZK | Srivilliputtur, Tamil Nadu</p>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 14px; margin-top: 0;">Dear <strong>${enquiry.name || 'Valued Client'}</strong>,</p>
          <p style="font-size: 13px; line-height: 1.6; color: #334155;">
            ${customMessage || `Please find attached your official ${docType} <strong>${docNumber}</strong> from Balumuni and Associates.`}
          </p>
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 8px; font-size: 13px;"><strong>${docType} Details:</strong></p>
            <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
              <tr><td style="padding: 4px 0; color: #64748B;">Document Number:</td><td style="font-weight: bold;">${docNumber}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748B;">Total Amount:</td><td style="font-weight: bold; font-size: 14px; color: #1E3A8A;">₹${enquiry.totalAmount || enquiry.approvedPrice || enquiry.targetPrice || 0}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748B;">Delivery Terms:</td><td>${enquiry.deliveryTerms || 'SELF TO SRIVIL'}</td></tr>
              <tr><td style="padding: 4px 0; color: #64748B;">Payment Terms:</td><td>${enquiry.paymentTerms || '7 DAYS CREDIT'}</td></tr>
            </table>
          </div>
          <p style="font-size: 12px; color: #64748B;">Official PDF document is attached for your records and procurement approval.</p>
          <p style="font-size: 13px; font-weight: bold; color: #7D0038; margin: 20px 0 8px;">உங்கள் நம்பிக்கையில் எங்கள் பயணம்!</p>
          <p style="font-size: 12px; color: #0F172A; margin: 0;">Warm regards,<br><strong>Balumuni and Associates</strong><br>Phone: +91 74184 23238<br>Email: balumuniandassociates@gmail.com</p>
        </div>
      </div>
    `;

    const emailResult = await sendEmail({
      to: targetEmail,
      subject,
      html: htmlBody,
      attachments,
    });

    res.json({
      success: true,
      message: `Email with ${docType} PDF successfully sent to ${targetEmail}`,
      emailResult,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Comprehensive Quotation Stats for Dashboard & Overview
 */
export const getQuotationStats = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalQuotations, thisMonthTotal, approvedCount, pendingCount, invoiceGeneratedCount] = await Promise.all([
      ContactEnquiry.countDocuments({ enquiryType: { $in: ['rfq', 'bulk_order'] } }),
      ContactEnquiry.countDocuments({
        enquiryType: { $in: ['rfq', 'bulk_order'] },
        createdAt: { $gte: startOfMonth },
      }),
      ContactEnquiry.countDocuments({
        enquiryType: { $in: ['rfq', 'bulk_order'] },
        status: 'approved',
      }),
      ContactEnquiry.countDocuments({
        enquiryType: { $in: ['rfq', 'bulk_order'] },
        status: 'new',
      }),
      ContactEnquiry.countDocuments({
        enquiryType: { $in: ['rfq', 'bulk_order'] },
        invoiceGenerated: true,
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalQuotations,
        thisMonthTotal,
        approvedCount,
        pendingCount,
        invoiceGeneratedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
