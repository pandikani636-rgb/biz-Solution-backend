import crypto from 'crypto';
import { LabourInsurance } from '../models/LabourInsurance.js';
import { notifyAdmins } from '../services/notificationService.js';

const COVERAGE_RATES = {
  '₹1 Lakh': 450,
  '₹3 Lakhs': 850,
  '₹5 Lakhs': 1250,
  '₹10 Lakhs': 2100,
};

const PERIOD_FACTORS = {
  '3 Months': 0.35,
  '6 Months': 0.65,
  '12 Months': 1.0,
};

export const calculateEstimatedPremium = (numLabours, coverage, period) => {
  const baseRate = COVERAGE_RATES[coverage] || 1250;
  const factor = PERIOD_FACTORS[period] || 1.0;
  const labours = Math.max(1, Number(numLabours) || 1);
  return Math.round(labours * baseRate * factor);
};

export const createLabourInsuranceInquiry = async (req, res, next) => {
  try {
    const {
      companyName,
      gstNumber,
      officialEmail,
      contactPersonRole,
      officialContactNumber,
      numberOfLabours,
      workingPeriod,
      insuranceCoverage,
      notes,
    } = req.body;

    if (
      !companyName ||
      !gstNumber ||
      !officialEmail ||
      !contactPersonRole ||
      !officialContactNumber ||
      !numberOfLabours ||
      !workingPeriod ||
      !insuranceCoverage
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: Company Name, GST Number, Email, Role, Contact Number, Number of Labours, Working Period, and Coverage.',
      });
    }

    const estimatedPremium = calculateEstimatedPremium(numberOfLabours, insuranceCoverage, workingPeriod);
    const inquiryNumber = `LI-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    const inquiry = await LabourInsurance.create({
      inquiryNumber,
      companyName: String(companyName).trim(),
      gstNumber: String(gstNumber).trim().toUpperCase(),
      officialEmail: String(officialEmail).trim().toLowerCase(),
      contactPersonRole: String(contactPersonRole).trim(),
      officialContactNumber: String(officialContactNumber).trim(),
      numberOfLabours: Math.max(1, Number(numberOfLabours) || 1),
      workingPeriod,
      insuranceCoverage,
      estimatedPremium,
      adminNotes: String(notes || '').trim(),
      user: req.user ? req.user._id : null,
    });

    try {
      await notifyAdmins({
        title: 'New Labour Insurance Application',
        message: `${companyName} (${gstNumber}) requested Labour Insurance for ${numberOfLabours} labours (${workingPeriod}, ${insuranceCoverage}). Inquiry: ${inquiryNumber}`,
        type: 'service',
        link: '/admin/labour-insurance',
      });
    } catch (notifyErr) {
      console.warn('[Labour Insurance Notification Error]', notifyErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Labour insurance inquiry submitted successfully! Our representative will contact you shortly.',
      data: inquiry,
    });
  } catch (error) {
    next(error);
  }
};

export const getLabourInsuranceInquiries = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { inquiryNumber: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { gstNumber: { $regex: search, $options: 'i' } },
        { officialEmail: { $regex: search, $options: 'i' } },
        { officialContactNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await LabourInsurance.countDocuments(filter);
    const items = await LabourInsurance.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({
      success: true,
      data: items,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getLabourInsuranceById = async (req, res, next) => {
  try {
    const item = await LabourInsurance.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Labour insurance inquiry not found.' });
    }
    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLabourInsuranceStatus = async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body;
    const item = await LabourInsurance.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Labour insurance inquiry not found.' });
    }

    if (status) item.status = status;
    if (adminNotes !== undefined) item.adminNotes = adminNotes;

    await item.save();

    res.json({
      success: true,
      message: 'Labour insurance inquiry status updated successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLabourInsuranceInquiry = async (req, res, next) => {
  try {
    const item = await LabourInsurance.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Labour insurance inquiry not found.' });
    }
    res.json({
      success: true,
      message: 'Labour insurance inquiry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
