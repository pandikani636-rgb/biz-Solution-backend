import mongoose from 'mongoose';
import { Service } from '../models/Service.js';
import { ServicePackage } from '../models/ServicePackage.js';
import { Booking } from '../models/Booking.js';

export const getServices = async (req, res, next) => {
  try {
    const {
      search,
      category,
      serviceType,
      brand,
      section,
      origin,
      minPrice,
      maxPrice,
      sort = 'newest',
      page = 1,
      limit = 9,
      isFeatured,
      all = 'false',
    } = req.query;

    const query = {};

    // Only admins viewing all can see inactive services
    if (all !== 'true') {
      query.isActive = true;
    }

    // Category filter
    if (category && category !== 'all') {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = category;
      }
    }

    // Service type filter
    if (serviceType && serviceType !== 'all') {
      query.serviceType = serviceType;
    }

    // Brand filter
    if (brand && brand !== 'all') {
      query.brand = { $regex: new RegExp(`^${brand}$`, 'i') };
    }

    // Section filter
    if (section && section !== 'all') {
      query.section = { $regex: new RegExp(`^${section}$`, 'i') };
    }

    // Origin filter (National / International)
    if (origin && origin !== 'all') {
      query.origin = origin;
    }

    // Featured filter
    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured === 'true';
    }

    // Search query (case insensitive matching on name, partNumber, brand, descriptions)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { partNumber: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { fullDescription: { $regex: search, $options: 'i' } },
      ];
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.basePrice = {};
      if (minPrice) query.basePrice.$gte = Number(minPrice);
      if (maxPrice) query.basePrice.$lte = Number(maxPrice);
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sort === 'price_asc') {
      sortOptions = { basePrice: 1 };
    } else if (sort === 'price_desc') {
      sortOptions = { basePrice: -1 };
    } else if (sort === 'name_asc') {
      sortOptions = { name: 1 };
    } else if (sort === 'popularity') {
      sortOptions = { isFeatured: -1, displayOrder: 1, createdAt: -1 };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 9;
    const skip = (pageNum - 1) * limitNum;

    const [services, total] = await Promise.all([
      Service.find(query)
        .populate('category', 'name slug icon')
        .populate({
          path: 'packages',
          match: { isActive: true },
          options: { sort: { displayOrder: 1, price: 1 } },
        })
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Service.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: services,
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

export const getServiceBySlugOrId = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    const isId = mongoose.Types.ObjectId.isValid(identifier);

    const query = isId ? { _id: identifier } : { slug: identifier };
    const service = await Service.findOne(query)
      .populate('category', 'name slug icon')
      .populate({
        path: 'packages',
        match: { isActive: true },
        options: { sort: { displayOrder: 1, price: 1 } },
      });

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Related services in the same category
    const related = await Service.find({
      category: service.category?._id,
      _id: { $ne: service._id },
      isActive: true,
    })
      .limit(3)
      .select('name slug mainPrice basePrice discountPrice mainImage shortDescription');

    res.json({
      success: true,
      data: service,
      related,
    });
  } catch (error) {
    next(error);
  }
};

export const createService = async (req, res, next) => {
  try {
    const service = await Service.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

export const updateService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({
      success: true,
      message: 'Service updated successfully',
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (req, res, next) => {
  try {
    const serviceId = req.params.id;

    // Check for dependent active bookings
    const activeBookingsCount = await Booking.countDocuments({
      service: serviceId,
      status: { $in: ['pending', 'confirmed', 'in_progress'] },
    });

    if (activeBookingsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete service: ${activeBookingsCount} active booking(s) are in progress. You can deactivate this service instead.`,
      });
    }

    // Delete packages associated with this service
    await ServicePackage.deleteMany({ service: serviceId });

    const service = await Service.findByIdAndDelete(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.json({
      success: true,
      message: 'Service and its packages deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getBrands = async (req, res, next) => {
  try {
    const brands = await Service.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$brand',
          count: { $sum: 1 },
          discountPercentage: { $first: '$discountPercentage' },
          deliveryIncluded: { $first: '$deliveryIncluded' },
          sections: { $addToSet: '$section' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: brands.map((b) => ({
        brand: b._id,
        count: b.count,
        discountPercentage: b.discountPercentage,
        deliveryIncluded: b.deliveryIncluded,
        sections: b.sections,
      })),
    });
  } catch (err) {
    next(err);
  }
};

