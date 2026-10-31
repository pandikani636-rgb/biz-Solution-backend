import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Coupon } from '../src/models/Coupon.js';

describe('Coupon Model & Validation Logic', () => {
  it('should invalidate coupon when minBookingAmount is not met', () => {
    const coupon = new Coupon({
      code: 'MIN1000',
      discountType: 'fixed',
      discountValue: 100,
      minBookingAmount: 1000,
      validFrom: new Date(Date.now() - 3600000),
      validUntil: new Date(Date.now() + 3600000),
      isActive: true,
    });

    const check = coupon.isValidFor(500);
    assert.strictEqual(check.valid, false);
    assert.match(check.message, /Minimum booking amount/);
  });

  it('should invalidate coupon when expired', () => {
    const expiredCoupon = new Coupon({
      code: 'EXPIRED10',
      discountType: 'percentage',
      discountValue: 10,
      validFrom: new Date(Date.now() - 7200000),
      validUntil: new Date(Date.now() - 3600000), // Expired 1 hour ago
      isActive: true,
    });

    const check = expiredCoupon.isValidFor(5000);
    assert.strictEqual(check.valid, false);
    assert.strictEqual(check.message, 'Coupon has expired');
  });

  it('should validate when criteria are satisfied', () => {
    const validCoupon = new Coupon({
      code: 'VALID20',
      discountType: 'percentage',
      discountValue: 20,
      minBookingAmount: 1000,
      validFrom: new Date(Date.now() - 3600000),
      validUntil: new Date(Date.now() + 3600000),
      isActive: true,
    });

    const check = validCoupon.isValidFor(2000);
    assert.strictEqual(check.valid, true);

    const discount = validCoupon.calculateDiscount(2000);
    assert.strictEqual(discount, 400);
  });
});
