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
    if (isRfq) {
      const year = new Date().getFullYear();
      const rand = Math.floor(1000 + Math.random() * 9000);
      quotationNumber = `QTN-${year}-${rand}`;
    }

    // Try finding customer account by token or email
    let customerId = req.user ? req.user._id : null;
    if (!customerId) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) customerId = existingUser._id;
    }

    const enquiry = await ContactEnquiry.create({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      subject,
      message,
      enquiryType,
      quotationNumber,
      customer: customerId,
      companyName: companyName || '',
      gstin: gstin || '',
      deliveryLocation: deliveryLocation || '',
      brand: brand || '',
      partNumber: partNumber || '',
      quantity: quantity ? Number(quantity) : 1,
      targetPrice: targetPrice ? Number(targetPrice) : 0,
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

    const [enquiries, total] = await Promise.all([
      ContactEnquiry.find(query).populate('customer', 'name email phone avatar').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      ContactEnquiry.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: enquiries,
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
    const query = {
      $or: [{ customer: req.user._id }, { email: req.user.email.toLowerCase() }],
      enquiryType: { $in: ['rfq', 'bulk_order'] },
    };

    const quotations = await ContactEnquiry.find(query).sort({ createdAt: -1 });

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
