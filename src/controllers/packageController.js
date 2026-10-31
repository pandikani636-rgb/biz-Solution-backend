import { ServicePackage } from '../models/ServicePackage.js';
import { Booking } from '../models/Booking.js';

export const getPackagesByService = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const filter = { service: serviceId };
    if (req.query.all !== 'true') {
      filter.isActive = true;
    }
    const packages = await ServicePackage.find(filter).sort({ displayOrder: 1, price: 1 });
    res.json({
      success: true,
      data: packages,
    });
  } catch (error) {
    next(error);
  }
};

export const createPackage = async (req, res, next) => {
  try {
    const pkg = await ServicePackage.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Package created successfully',
      data: pkg,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePackage = async (req, res, next) => {
  try {
    const pkg = await ServicePackage.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }
    res.json({
      success: true,
      message: 'Package updated successfully',
      data: pkg,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePackage = async (req, res, next) => {
  try {
    const packageId = req.params.id;

    // Check if package has active bookings
    const activeBookingsCount = await Booking.countDocuments({
      package: packageId,
      status: { $in: ['pending', 'confirmed', 'in_progress'] },
    });

    if (activeBookingsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete package: ${activeBookingsCount} active booking(s) exist. You can deactivate this package instead.`,
      });
    }

    const pkg = await ServicePackage.findByIdAndDelete(packageId);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    res.json({
      success: true,
      message: 'Package deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
