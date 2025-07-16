import { DiscountType } from '../types';
export class DiscountCalculationService {
    calculateDiscount(coupon, context) {
        const appliedRules = [];
        let discountAmount = 0;
        switch (coupon.discountType) {
            case DiscountType.PERCENTAGE:
                discountAmount = this.calculatePercentageDiscount(coupon, context, appliedRules);
                break;
            case DiscountType.FIXED:
                discountAmount = this.calculateFixedDiscount(coupon, context, appliedRules);
                break;
            case DiscountType.FREE_SHIPPING:
                discountAmount = this.calculateFreeShippingDiscount(context, appliedRules);
                break;
            case DiscountType.BUY_X_GET_Y:
                discountAmount = this.calculateBuyXGetYDiscount(coupon, context, appliedRules);
                break;
        }
        // Apply max discount limit if specified
        if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
            discountAmount = coupon.maxDiscountAmount;
            appliedRules.push({
                ruleType: 'MAX_DISCOUNT_LIMIT',
                description: `Discount limited to maximum amount of ${coupon.maxDiscountAmount}`,
                discountAmount: coupon.maxDiscountAmount
            });
        }
        const finalAmount = Math.max(0, context.orderTotal - discountAmount);
        return {
            couponCode: coupon.code,
            originalAmount: context.orderTotal,
            discountAmount,
            finalAmount,
            appliedRules
        };
    }
    calculatePercentageDiscount(coupon, context, appliedRules) {
        let eligibleAmount = context.orderTotal;
        // Filter products if specific products/categories are targeted
        if (coupon.productIds || coupon.categoryIds) {
            eligibleAmount = this.getEligibleAmount(coupon, context);
        }
        const discountAmount = (eligibleAmount * coupon.discountValue) / 100;
        appliedRules.push({
            ruleType: 'PERCENTAGE_DISCOUNT',
            description: `${coupon.discountValue}% discount applied`,
            discountAmount
        });
        return discountAmount;
    }
    calculateFixedDiscount(coupon, context, appliedRules) {
        const discountAmount = Math.min(coupon.discountValue, context.orderTotal);
        appliedRules.push({
            ruleType: 'FIXED_DISCOUNT',
            description: `Fixed discount of ${coupon.discountValue} applied`,
            discountAmount
        });
        return discountAmount;
    }
    calculateFreeShippingDiscount(context, appliedRules) {
        // This would typically integrate with shipping service
        const estimatedShippingCost = 10; // Placeholder
        appliedRules.push({
            ruleType: 'FREE_SHIPPING',
            description: 'Free shipping applied',
            discountAmount: estimatedShippingCost
        });
        return estimatedShippingCost;
    }
    calculateBuyXGetYDiscount(coupon, context, appliedRules) {
        if (!context.products)
            return 0;
        // Simple implementation: discount value represents the free items value
        const discountAmount = coupon.discountValue;
        appliedRules.push({
            ruleType: 'BUY_X_GET_Y',
            description: 'Buy X Get Y promotion applied',
            discountAmount
        });
        return discountAmount;
    }
    getEligibleAmount(coupon, context) {
        if (!context.products)
            return context.orderTotal;
        let eligibleAmount = 0;
        for (const product of context.products) {
            const isEligible = this.isProductEligible(product, coupon);
            if (isEligible) {
                eligibleAmount += product.price * product.quantity;
            }
        }
        return eligibleAmount;
    }
    isProductEligible(product, coupon) {
        // Check exclusions first
        if (coupon.excludeProductIds?.includes(product.id))
            return false;
        if (coupon.excludeCategoryIds?.includes(product.categoryId))
            return false;
        // Check inclusions
        if (coupon.productIds && !coupon.productIds.includes(product.id))
            return false;
        if (coupon.categoryIds && !coupon.categoryIds.includes(product.categoryId))
            return false;
        return true;
    }
    calculateStackedDiscounts(coupons, context) {
        const calculations = [];
        let remainingAmount = context.orderTotal;
        // Sort coupons by priority (percentage discounts first, then fixed)
        const sortedCoupons = [...coupons].sort((a, b) => {
            if (a.discountType === DiscountType.PERCENTAGE && b.discountType !== DiscountType.PERCENTAGE)
                return -1;
            if (a.discountType !== DiscountType.PERCENTAGE && b.discountType === DiscountType.PERCENTAGE)
                return 1;
            return 0;
        });
        for (const coupon of sortedCoupons) {
            const adjustedContext = { ...context, orderTotal: remainingAmount };
            const calculation = this.calculateDiscount(coupon, adjustedContext);
            calculations.push(calculation);
            remainingAmount = calculation.finalAmount;
        }
        return calculations;
    }
}
//# sourceMappingURL=DiscountCalculationService.js.map