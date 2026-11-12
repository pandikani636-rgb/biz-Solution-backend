import { ScrapPrice } from '../models/ScrapPrice.js';

export const DEFAULT_SCRAP_ITEMS = [
  { name: 'Paper', quantityUnit: '1 KG', price: 15, displayOrder: 1 },
  { name: 'Cardboard', quantityUnit: '1 KG', price: 12, displayOrder: 2 },
  { name: 'Plastic (Cans, Covers)', quantityUnit: '1 KG', price: 20, displayOrder: 3 },
  { name: 'Steel', quantityUnit: '1 KG', price: 42, displayOrder: 4 },
  { name: 'Aluminium', quantityUnit: '1 KG', price: 145, displayOrder: 5 },
  { name: 'Brass', quantityUnit: '1 KG', price: 340, displayOrder: 6 },
  { name: 'GI Materials', quantityUnit: '1 KG', price: 48, displayOrder: 7 },
  { name: 'Oil', quantityUnit: '1 Litre', price: 65, displayOrder: 8 },
  { name: 'Copper Wire & Cables', quantityUnit: '1 KG', price: 620, displayOrder: 9 },
  { name: 'Cast Iron Heavy Scrap', quantityUnit: '1 KG', price: 32, displayOrder: 10 },
];

export const getScrapPrices = async (req, res, next) => {
  try {
    let items = await ScrapPrice.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    
    // Auto-seed default 10 items if database has none
    if (!items || items.length === 0) {
      await ScrapPrice.insertMany(DEFAULT_SCRAP_ITEMS);
      items = await ScrapPrice.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    }

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllScrapPricesAdmin = async (req, res, next) => {
  try {
    let items = await ScrapPrice.find().sort({ displayOrder: 1, createdAt: 1 });
    if (!items || items.length === 0) {
      await ScrapPrice.insertMany(DEFAULT_SCRAP_ITEMS);
      items = await ScrapPrice.find().sort({ displayOrder: 1, createdAt: 1 });
    }
    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

export const createScrapPrice = async (req, res, next) => {
  try {
    const { name, quantityUnit, price, displayOrder, isActive } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Name and price are required.' });
    }
    const item = await ScrapPrice.create({
      name: String(name).trim(),
      quantityUnit: String(quantityUnit || '1 KG').trim(),
      price: Number(price) || 0,
      displayOrder: Number(displayOrder) || 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });
    res.status(201).json({
      success: true,
      message: 'Scrap material price created successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const updateScrapPrice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await ScrapPrice.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Scrap material not found.' });
    }
    const { name, quantityUnit, price, displayOrder, isActive } = req.body;
    if (name !== undefined) item.name = String(name).trim();
    if (quantityUnit !== undefined) item.quantityUnit = String(quantityUnit).trim();
    if (price !== undefined) item.price = Number(price);
    if (displayOrder !== undefined) item.displayOrder = Number(displayOrder);
    if (isActive !== undefined) item.isActive = Boolean(isActive);

    await item.save();

    res.json({
      success: true,
      message: 'Scrap material updated successfully',
      data: item,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteScrapPrice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await ScrapPrice.findByIdAndDelete(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Scrap material not found.' });
    }
    res.json({
      success: true,
      message: 'Scrap material deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const resetDefaultScrapPrices = async (req, res, next) => {
  try {
    await ScrapPrice.deleteMany({});
    const items = await ScrapPrice.insertMany(DEFAULT_SCRAP_ITEMS);
    res.json({
      success: true,
      message: 'Default scrap material prices restored successfully',
      data: items,
    });
  } catch (error) {
    next(error);
  }
};
