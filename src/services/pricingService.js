/**
 * Server-side Pricing and Tax Calculation Engine
 * Guarantees zero reliance on customer-submitted price totals.
 * Supports percentage-based pricing for new users while maintaining standard wholesale rates for existing users.
 */
export const calculateBookingPrice = ({
  packagePrice,
  discountPrice = 0,
  selectedAddOns = [],
  coupon = null,
  taxRate = 18,
  isNewUser = false,
  markupPercentage = 0,
}) => {
  // 1. Effective package base price
  const basePackagePrice = discountPrice > 0 && discountPrice < packagePrice ? discountPrice : packagePrice;

  // 2. New User Percentage Surcharge (applied only to newly registered users)
  const effectiveMarkupRate = isNewUser ? Math.max(0, Number(markupPercentage) || 0) : 0;
  const newUserSurcharge = effectiveMarkupRate > 0 ? Math.round(((basePackagePrice * effectiveMarkupRate) / 100) * 100) / 100 : 0;

  // 3. Add-ons sum
  const addOnsTotal = selectedAddOns.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  // 4. Subtotal before coupon
  const subtotalBeforeCoupon = basePackagePrice + newUserSurcharge + addOnsTotal;

  // 5. Coupon discount calculation
  let discountAmount = 0;
  let couponDetails = null;

  if (coupon) {
    if (coupon.discountType === 'percentage') {
      discountAmount = (subtotalBeforeCoupon * coupon.discountValue) / 100;
      if (coupon.maxDiscount > 0 && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, subtotalBeforeCoupon);
    }
    discountAmount = Math.round(discountAmount * 100) / 100;
    couponDetails = {
      code: coupon.code,
      discountAmount,
    };
  }

  // 6. Taxable amount
  const taxableAmount = Math.max(0, subtotalBeforeCoupon - discountAmount);

  // 7. Tax calculation (e.g. 18% GST)
  const taxAmount = Math.round(((taxableAmount * taxRate) / 100) * 100) / 100;

  // 8. Grand total
  const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

  return {
    baseAmount: basePackagePrice,
    newUserMarkupRate: effectiveMarkupRate,
    newUserSurcharge,
    addOnsTotal,
    discountAmount,
    coupon: couponDetails,
    taxRate,
    taxAmount,
    totalAmount,
  };
};
