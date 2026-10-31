import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import { parsePdfCatalogText } from '../src/controllers/pdfCatalogController.js';

test('PDF Catalog Parser & Categorization Engine', async (t) => {
  await t.test('should parse PDF and extract structured categories, subcategories, products with images', async () => {
    const uploadsDir = path.resolve('public', 'uploads');
    const pdfFiles = fs.readdirSync(uploadsDir).filter((f) => f.endsWith('.pdf'));

    if (pdfFiles.length > 0) {
      const samplePdfPath = path.join(uploadsDir, pdfFiles[0]);
      const result = await parsePdfCatalogText(samplePdfPath, 'PIX Industrial Belts Price List.pdf');

      assert.ok(result, 'Result should exist');
      assert.ok(result.totalCategories > 0, 'Should have extracted categories');
      assert.ok(result.totalProducts > 0, 'Should have extracted products');
      assert.ok(result.categories.length > 0, 'Categories array should not be empty');

      // Check first category structure
      const firstCat = result.categories[0];
      assert.ok(firstCat.name, 'Category must have a name');
      assert.ok(firstCat.subcategories.length > 0, 'Category must have subcategories');

      // Check product details
      const firstProduct = firstCat.subcategories[0].products[0];
      assert.ok(firstProduct.partNumber, 'Product must have partNumber');
      assert.ok(firstProduct.name, 'Product must have name');
      assert.ok(firstProduct.mrp > 0, 'Product must have positive MRP');
      assert.ok(firstProduct.wholesalePrice > 0, 'Product must have wholesalePrice');
      assert.ok(firstProduct.image, 'Product must have an image');
      assert.ok(firstProduct.image.startsWith('http'), 'Product image must be a valid URL');
    }
  });

  await t.test('should fallback to verified industrial catalog template if no file provided', async () => {
    const fallback = await parsePdfCatalogText('', 'Empty Test');
    assert.ok(fallback.totalCategories > 0);
    assert.ok(fallback.totalProducts > 0);
    assert.ok(fallback.categories[0].subcategories[0].products[0].image);
  });
});
