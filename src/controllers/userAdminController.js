import { User } from '../models/User.js';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { ROLES } from '../config/constants.js';

export const getAllCustomers = async (req, res, next) => {
  try {
    const { search, isActive, page = 1, limit = 10 } = req.query;
    const query = { role: ROLES.CUSTOMER };

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: users,
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

export const getCustomerDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const [bookings, payments] = await Promise.all([
      Booking.find({ customer: user._id }).sort({ createdAt: -1 }).limit(20),
      Payment.find({ customer: user._id }).sort({ createdAt: -1 }).limit(20),
    ]);

    res.json({
      success: true,
      data: {
        user,
        bookings,
        payments,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const toggleCustomerStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.role === ROLES.ADMIN) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate an administrator account' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `Customer account ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomerRate = async (req, res, next) => {
  try {
    const { isNewUser, pricingTier, markupPercentage } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (isNewUser !== undefined) user.isNewUser = Boolean(isNewUser);
    if (pricingTier !== undefined) user.pricingTier = pricingTier;
    if (markupPercentage !== undefined) user.markupPercentage = Number(markupPercentage) || 0;

    await user.save();

    res.json({
      success: true,
      message: 'Customer pricing rate updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
