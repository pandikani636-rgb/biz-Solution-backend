import mongoose from 'mongoose';
import { Service } from '../models/Service.js';
import { ServiceCategory } from '../models/ServiceCategory.js';
import { ServicePackage } from '../models/ServicePackage.js';
import { Booking } from '../models/Booking.js';
import { PdfCatalog } from '../models/PdfCatalog.js';
import { parsePdfCatalogText } from './pdfCatalogController.js';

// Helper to convert a PDF product to a Service-compatible shape
const formatPdfProductToService = (prod, catName = '', subName = '', pdfUrl = '') => {
  const partNumber = prod.partNumber || '';
  const name = prod.name || `${partNumber} Industrial Component`;
  const brand = prod.brand || 'PIX';
  const categoryName = prod.categoryName || catName || 'Power Transmission';
  const subcategoryName = prod.subcategoryName || subName || 'Standard Profile';
  const wholesalePrice = prod.wholesalePrice || prod.mrp || 0;
  const mrp = prod.mrp || Math.round(wholesalePrice / 0.54);
  const discountPercentage = prod.discountPercentage || 46;

  return {
    _id: prod._id || new mongoose.Types.ObjectId(),
    name,
    slug: partNumber.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    partNumber,
    brand,
    section: prod.section || 'Industrial Belt',
    category: {
      _id: new mongoose.Types.ObjectId(),
      name: categoryName,
      slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    },
    categoryName,
    subcategoryName,
    mainPrice: wholesalePrice,
    basePrice: wholesalePrice,
    officialMrp: mrp,
    mrp,
    discountPercentage,
    discountPrice: wholesalePrice,
    mainImage: prod.image || 'https://cobrel.co.za/wp-content/uploads/2019/10/Classical-V-Belts-copy3.png',
    images: [prod.image || 'https://cobrel.co.za/wp-content/uploads/2019/10/Classical-V-Belts-copy3.png'],
    shortDescription: prod.description || `${brand} ${name} (${partNumber})`,
    fullDescription: prod.description || `Original ${brand} ${name} - Part #${partNumber}. ${prod.specifications || ''}. Supplied directly with manufacturer test certificate and tracked logistics.`,
    specifications: prod.specifications ? [{ name: 'Engineering Specs', value: prod.specifications }] : [],
    inStock: prod.inStock !== false,
    isActive: true,
    isFromPdfCatalog: true,
    pdfUrl: pdfUrl || '/sample-catalog.pdf',
    packages: [
      {
        _id: 'standard-wholesale-pack',
        name: 'Standard Wholesale Pack',
        price: wholesalePrice,
        discountPrice: wholesalePrice,
        description: 'OEM factory unit with GST invoice, MTC test certificate and tracked dispatch',
        features: ['100% Genuine MTC Certified', 'Factory Sealed', 'Pan-India Express Dispatch'],
        isActive: true,
      },
    ],
  };
};

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

    // Brand filter (supports aliases like TMB Ken/Timken, JK Fenner/Fenner, ABB/ABB Motors, Vignesh/Vignessh)
    if (brand && brand !== 'all') {
      let brandPattern = `^${brand}$`;
      const cleanBrand = brand.trim().toLowerCase();
      if (cleanBrand.includes('timken') || cleanBrand.includes('tmb ken')) {
        brandPattern = 'timken|tmb ken';
      } else if (cleanBrand.includes('fenner')) {
        brandPattern = 'fenner|jk fenner';
      } else if (cleanBrand.includes('abb')) {
        brandPattern = 'abb|abb motors';
      } else if (cleanBrand.includes('vignesh') || cleanBrand.includes('vignessh')) {
        brandPattern = 'vignesh|vignessh';
      } else if (cleanBrand.includes('shanthi')) {
        brandPattern = 'shanthi';
      }
      query.brand = { $regex: new RegExp(brandPattern, 'i') };
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

    // Search query (case insensitive matching on name, partNumber, brand, category, descriptions)
    if (search && search.trim()) {
      const q = search.trim();
      const qClean = q.replace(/s\b/gi, ''); // singular variant

      // Search for any categories matching query
      let matchingCatIds = [];
      try {
        const matchingCats = await ServiceCategory.find({
          $or: [
            { name: { $regex: q, $options: 'i' } },
            { name: { $regex: qClean, $options: 'i' } },
            { slug: { $regex: q.toLowerCase().replace(/\s+/g, '-'), $options: 'i' } },
          ],
        }).select('_id');
        matchingCatIds = matchingCats.map((c) => c._id);
      } catch (catErr) {
        // ignore
      }

      const orConditions = [
        { name: { $regex: q, $options: 'i' } },
        { name: { $regex: qClean, $options: 'i' } },
        { partNumber: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { shortDescription: { $regex: q, $options: 'i' } },
        { fullDescription: { $regex: q, $options: 'i' } },
      ];

      if (matchingCatIds.length > 0) {
        orConditions.push({ category: { $in: matchingCatIds } });
      }

      query.$or = orConditions;
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

    let finalServices = services;
    let finalTotal = total;

    // If search was provided or results are few, enrich with matching products from active PDF Catalog
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      try {
        const activeCatalogs = await PdfCatalog.find({ isActive: true }).sort({ createdAt: -1 });
        const catalogsToScan = activeCatalogs.length > 0 ? activeCatalogs : await PdfCatalog.find().sort({ createdAt: -1 }).limit(5);

        const pdfMatches = [];
        for (const catalog of catalogsToScan) {
          let categories = catalog ? catalog.categories : [];
          if (!categories || categories.length === 0) {
            const dummy = await parsePdfCatalogText('', 'Default Industrial Catalog');
            categories = dummy.categories;
          }

          const qClean = q.replace(/s\b/gi, '');
          for (const cat of categories) {
            const catNameLower = (cat.name || '').toLowerCase();
            const catMatch =
              catNameLower.includes(q) ||
              catNameLower.includes(qClean) ||
              q.includes(catNameLower);
            for (const sub of cat.subcategories || []) {
              const subNameLower = (sub.name || '').toLowerCase();
              const subMatch =
                subNameLower.includes(q) ||
                subNameLower.includes(qClean) ||
                q.includes(subNameLower);
              for (const prod of sub.products || []) {
                const partMatch = prod.partNumber && prod.partNumber.toLowerCase().includes(q);
                const nameMatch = prod.name && prod.name.toLowerCase().includes(q);
                const brandMatch = prod.brand && prod.brand.toLowerCase().includes(q);
                const specMatch = prod.specifications && prod.specifications.toLowerCase().includes(q);

                if (catMatch || subMatch || partMatch || nameMatch || brandMatch || specMatch) {
                  pdfMatches.push(formatPdfProductToService(prod, cat.name, sub.name, catalog?.fileUrl));
                }
              }
            }
          }
        }

        if (pdfMatches.length > 0) {
          // Merge PDF matches (avoid duplicate partNumbers)
          const existingParts = new Set(services.map((s) => (s.partNumber || '').toLowerCase()));
          const uniquePdfMatches = pdfMatches.filter((p) => !existingParts.has((p.partNumber || '').toLowerCase()));
          finalServices = [...services, ...uniquePdfMatches];
          finalTotal = total + uniquePdfMatches.length;
        }
      } catch (pdfErr) {
        console.warn('[getServices PDF Search Notice]', pdfErr.message);
      }
    }

    res.json({
      success: true,
      data: finalServices,
      pagination: {
        total: finalTotal,
        page: pageNum,
        pages: Math.ceil(finalTotal / limitNum),
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
    let service = await Service.findOne(query)
      .populate('category', 'name slug icon')
      .populate({
        path: 'packages',
        match: { isActive: true },
        options: { sort: { displayOrder: 1, price: 1 } },
      });

    // Fallback: If not found, try matching by partNumber (e.g. 6204, SPC 2360)
    if (!service && !isId) {
      const escapedId = identifier.replace(/[-_]/g, ' ').trim();
      service = await Service.findOne({
        $or: [
          { partNumber: new RegExp(`^${identifier.trim()}$`, 'i') },
          { partNumber: new RegExp(`^${escapedId}$`, 'i') },
          { name: new RegExp(escapedId, 'i') },
        ],
      })
        .populate('category', 'name slug icon')
        .populate({
          path: 'packages',
          match: { isActive: true },
          options: { sort: { displayOrder: 1, price: 1 } },
        });
    }

    // Fallback 2: Check in PdfCatalog if product was imported from PDF
    if (!service) {
      const clean = decodeURIComponent(identifier).trim().toLowerCase();
      const cleanNoSpace = clean.replace(/[\s\-_]+/g, '');

      try {
        const activeCatalogs = await PdfCatalog.find({ isActive: true }).sort({ createdAt: -1 });
        const catalogsToScan = activeCatalogs.length > 0 ? activeCatalogs : await PdfCatalog.find().sort({ createdAt: -1 }).limit(5);

        let foundPdfProd = null;
        let foundCat = null;
        let foundSub = null;
        let foundCatalog = null;

        for (const catalog of catalogsToScan) {
          let categories = catalog ? catalog.categories : [];
          if (!categories || categories.length === 0) {
            const dummy = await parsePdfCatalogText('', 'Default Industrial Catalog');
            categories = dummy.categories;
          }

          for (const cat of categories) {
            for (const sub of cat.subcategories || []) {
              for (const prod of sub.products || []) {
                const pPart = (prod.partNumber || '').trim().toLowerCase();
                const pPartNoSpace = pPart.replace(/[\s\-_]+/g, '');
                const pName = (prod.name || '').trim().toLowerCase();
                const pId = prod._id ? prod._id.toString() : '';

                if (
                  pPart === clean ||
                  pPartNoSpace === cleanNoSpace ||
                  pName === clean ||
                  pName.includes(clean) ||
                  pId === clean
                ) {
                  foundPdfProd = prod;
                  foundCat = cat;
                  foundSub = sub;
                  foundCatalog = catalog;
                  break;
                }
              }
              if (foundPdfProd) break;
            }
            if (foundPdfProd) break;
          }
          if (foundPdfProd) break;
        }

        if (foundPdfProd) {
          const formatted = formatPdfProductToService(
            foundPdfProd,
            foundCat?.name,
            foundSub?.name,
            foundCatalog?.fileUrl
          );

          const related = (foundSub?.products || [])
            .filter((p) => p.partNumber !== foundPdfProd.partNumber)
            .slice(0, 4)
            .map((p) => ({
              _id: p._id || new mongoose.Types.ObjectId(),
              name: p.name,
              partNumber: p.partNumber,
              slug: (p.partNumber || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              mainPrice: p.wholesalePrice,
              basePrice: p.wholesalePrice,
              discountPrice: p.wholesalePrice,
              mainImage: p.image || formatted.mainImage,
              shortDescription: p.description,
            }));

          return res.json({
            success: true,
            data: formatted,
            related,
          });
        }
      } catch (pdfErr) {
        console.warn('[getServiceBySlugOrId PDF Lookup Notice]', pdfErr.message);
      }
    }

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

