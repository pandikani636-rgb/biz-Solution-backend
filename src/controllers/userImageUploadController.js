import { UserImageUpload } from '../models/UserImageUpload.js';
import { processUploadedFile } from '../middleware/upload.js';
import { notifyAdmins, createNotification } from '../services/notificationService.js';

export const uploadUserImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file.' });
    }

    const {
      customerName,
      customerEmail,
      customerPhone,
      city = 'Not specified',
      partNotes = '',
      width,
      height,
    } = req.body;

    // Validate 20 Megapixels maximum limit
    const imgWidth = Number(width) || 0;
    const imgHeight = Number(height) || 0;
    const totalPixels = imgWidth * imgHeight;
    const megapixels = totalPixels > 0 ? Math.round((totalPixels / 1000000) * 10) / 10 : 0;

    if (totalPixels > 20000000) {
      return res.status(400).json({
        success: false,
        message: `Image resolution exceeds maximum allowed limit of 20 Megapixels. Uploaded: ${megapixels} MP (${imgWidth}x${imgHeight}px).`,
      });
    }

    const fileUrl = await processUploadedFile(req.file, req);

    const name = customerName || (req.user ? req.user.name : 'Guest Customer');
    const email = customerEmail || (req.user ? req.user.email : '');
    const phone = customerPhone || (req.user ? req.user.phone : '');

    const record = await UserImageUpload.create({
      user: req.user ? req.user._id : null,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      city: city || 'Not specified',
      imageUrl: fileUrl,
      originalFileName: req.file.originalname,
      fileSize: req.file.size,
      dimensions: {
        width: imgWidth,
        height: imgHeight,
        megapixels,
      },
      status: 'pending',
      partNotes: partNotes || '',
    });

    // Notify administrators
    await notifyAdmins({
      title: 'New User Part Image Upload',
      message: `${name} uploaded a part specification photo (${megapixels > 0 ? megapixels + ' MP' : req.file.originalname}) from ${city}.`,
      type: 'system',
      link: '/admin/user-uploads',
    });

    res.status(201).json({
      success: true,
      message: 'Part image uploaded and verified successfully.',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminUserUploads = async (req, res, next) => {
  try {
    const { status, city, search, page = 1, limit = 12 } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (city && city !== 'all') {
      query.city = { $regex: city, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { partNotes: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const [uploads, total] = await Promise.all([
      UserImageUpload.find(query).populate('user', 'name email phone avatar').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      UserImageUpload.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: uploads,
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

export const updateUserUploadStatus = async (req, res, next) => {
  try {
    const { status, adminNotes, quotedAmount } = req.body;
    const record = await UserImageUpload.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Upload record not found' });
    }

    if (status) record.status = status;
    if (adminNotes !== undefined) record.adminNotes = adminNotes;
    if (quotedAmount !== undefined) record.quotedAmount = Number(quotedAmount) || 0;

    await record.save();

    // If user is registered, notify them
    if (record.user) {
      await createNotification({
        recipient: record.user,
        title: `Part Specification Review: ${status.toUpperCase()}`,
        message: `Your uploaded image specification has been reviewed. Status: ${status}${quotedAmount ? ` | Quoted Rate: ₹${quotedAmount}` : ''}.`,
        type: 'system',
        link: '/customer/profile',
      });
    }

    res.json({
      success: true,
      message: 'Upload status updated successfully',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUserUpload = async (req, res, next) => {
  try {
    const record = await UserImageUpload.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Upload record not found' });
    res.json({ success: true, message: 'Upload record deleted successfully' });
  } catch (error) {
    next(error);
  }
};
