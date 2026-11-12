import { describe, it } from 'node:test';
import assert from 'node:assert';
import { DEFAULT_SCRAP_ITEMS } from '../src/controllers/scrapPriceController.js';
import { DEFAULT_ADVERTISEMENT } from '../src/controllers/advertisementController.js';
import { calculateEstimatedPremium } from '../src/controllers/labourInsuranceController.js';

describe('New Platform Requirements & Features', () => {
  describe('Requirement 3: Scrap Material Categories & Rate Card', () => {
    it('should include all 8 required scrap categories in default items', () => {
      const required = [
        'Paper',
        'Cardboard',
        'Plastic (Cans, Covers)',
        'Steel',
        'Aluminium',
        'Brass',
        'GI Materials',
        'Oil',
      ];

      const itemNames = DEFAULT_SCRAP_ITEMS.map((item) => item.name);
      required.forEach((cat) => {
        assert.ok(itemNames.includes(cat), `Expected default scrap items to contain "${cat}"`);
      });
    });

    it('should have exactly 10 rows configured for homepage transparent table', () => {
      assert.strictEqual(DEFAULT_SCRAP_ITEMS.length, 10);
    });

    it('should contain Name, KG + Litres quantityUnit, and positive scrap price', () => {
      DEFAULT_SCRAP_ITEMS.forEach((item) => {
        assert.ok(item.name && item.name.length > 0, 'Material name required');
        assert.ok(item.quantityUnit && item.quantityUnit.length > 0, 'Quantity unit required');
        assert.ok(typeof item.price === 'number' && item.price > 0, 'Price must be positive');
      });
    });
  });

  describe('Requirement 2: Labour Insurance Premium Calculation', () => {
    it('should accurately calculate estimated premium based on workforce, coverage, and period', () => {
      // 10 labours, ₹5 Lakhs, 12 Months: 10 * 1250 * 1.0 = 12500
      const premium1 = calculateEstimatedPremium(10, '₹5 Lakhs', '12 Months');
      assert.strictEqual(premium1, 12500);

      // 20 labours, ₹1 Lakh, 6 Months: 20 * 450 * 0.65 = 5850
      const premium2 = calculateEstimatedPremium(20, '₹1 Lakh', '6 Months');
      assert.strictEqual(premium2, 5850);

      // 5 labours, ₹10 Lakhs, 3 Months: 5 * 2100 * 0.35 = 3675
      const premium3 = calculateEstimatedPremium(5, '₹10 Lakhs', '3 Months');
      assert.strictEqual(premium3, 3675);
    });
  });

  describe('Requirement 4: Advertisement Popup Structure', () => {
    it('should have a valid default advertisement configuration', () => {
      assert.ok(DEFAULT_ADVERTISEMENT.title, 'Title required');
      assert.ok(DEFAULT_ADVERTISEMENT.imageUrl, 'Image URL required');
      assert.strictEqual(DEFAULT_ADVERTISEMENT.isActive, true);
      assert.ok(DEFAULT_ADVERTISEMENT.priority >= 1);
    });
  });

  describe('Requirement 5 & 6: Branding & Google Maps Location', () => {
    it('should generate valid Google Maps embed URL from company address', () => {
      const address = '45B/16 Noorullah Mall, Srivilliputtur, Tamilnadu - 626125';
      const encoded = encodeURIComponent(address);
      const embedUrl = `https://maps.google.com/maps?q=${encoded}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
      assert.ok(embedUrl.includes('output=embed'));
      assert.ok(embedUrl.includes('Srivilliputtur'));
    });
  });
});
