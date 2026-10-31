import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateBookingPrice } from '../src/services/pricingService.js';

describe('Pricing Calculation Engine', () => {
  it('should calculate base price and standard 18% tax accurately', () => {
    const result = calculateBookingPrice({
      packagePrice: 10000,
      discountPrice: 0,
      selectedAddOns: [],
      coupon: null,
      taxRate: 18,
    });

    assert.strictEqual(result.baseAmount, 10000);
    assert.strictEqual(result.addOnsTotal, 0);
    assert.strictEqual(result.discountAmount, 0);
    assert.strictEqual(result.taxRate, 18);
    assert.strictEqual(result.taxAmount, 1800);
    assert.strictEqual(result.totalAmount, 11800);
  });

  it('should use discount price when valid and lower than package base price', () => {
    const result = calculateBookingPrice({
      packagePrice: 10000,
      discountPrice: 8000,
      selectedAddOns: [],
      coupon: null,
      taxRate: 18,
    });

    assert.strictEqual(result.baseAmount, 8000);
    assert.strictEqual(result.taxAmount, 1440);
    assert.strictEqual(result.totalAmount, 9440);
  });

  it('should correctly sum selected add-ons before computing tax', () => {
    const result = calculateBookingPrice({
      packagePrice: 5000,
      selectedAddOns: [
        { name: 'Rider 1', price: 1000 },
        { name: 'Rider 2', price: 500 },
      ],
      taxRate: 18,
    });

    assert.strictEqual(result.baseAmount, 5000);
    assert.strictEqual(result.addOnsTotal, 1500);
    // Subtotal: 6500, Tax (18%): 1170, Total: 7670
    assert.strictEqual(result.taxAmount, 1170);
    assert.strictEqual(result.totalAmount, 7670);
  });

  it('should apply percentage coupon with max discount limit', () => {
    const mockCoupon = {
      code: 'FESTIVE50',
      discountType: 'percentage',
      discountValue: 50,
      maxDiscount: 1000, // Capped at 1000
    };

    const result = calculateBookingPrice({
      packagePrice: 10000,
      coupon: mockCoupon,
      taxRate: 18,
    });

    // 50% of 10000 is 5000, but capped at 1000
    assert.strictEqual(result.discountAmount, 1000);
    // Taxable: 9000, Tax (18%): 1620, Total: 10620
    assert.strictEqual(result.taxAmount, 1620);
    assert.strictEqual(result.totalAmount, 10620);
    assert.strictEqual(result.coupon.code, 'FESTIVE50');
  });

  it('should apply fixed amount coupon properly without exceeding subtotal', () => {
    const mockCoupon = {
      code: 'FLAT500',
      discountType: 'fixed',
      discountValue: 500,
      maxDiscount: 0,
    };

    const result = calculateBookingPrice({
      packagePrice: 2000,
      coupon: mockCoupon,
      taxRate: 18,
    });

    assert.strictEqual(result.discountAmount, 500);
    // Taxable: 1500, Tax (18%): 270, Total: 1770
    assert.strictEqual(result.taxAmount, 270);
    assert.strictEqual(result.totalAmount, 1770);
  });
});
