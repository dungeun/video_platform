import {
  PaymentAnalysisParams,
  PaymentAnalysis,
  Address,
  PaymentHistory,
  Severity
} from '../types';

export class PaymentFraudDetector {
  private readonly HIGH_RISK_COUNTRIES = [
    'NG', 'GH', 'CI', 'PK', 'BD', 'ID', 'MY', 'PH'
  ];

  private readonly SUSPICIOUS_EMAIL_PATTERNS = [
    /^[a-z]+[0-9]{4,}@/i,
    /^temp_/i,
    /^test_/i,
    /@10minutemail\./i,
    /@mailinator\./i,
    /@guerrillamail\./i
  ];

  async analyze(params: PaymentAnalysisParams): Promise<PaymentAnalysis> {
    const reasons: string[] = [];
    let riskScore = 0;
    
    // Geographic risk assessment
    const geoRisk = this.assessGeographicRisk(params);
    riskScore += geoRisk.score;
    if (geoRisk.reason) reasons.push(geoRisk.reason);

    // Amount-based risk assessment
    const amountRisk = this.assessAmountRisk(params);
    riskScore += amountRisk.score;
    if (amountRisk.reason) reasons.push(amountRisk.reason);

    // Payment method risk assessment
    const paymentMethodRisk = this.assessPaymentMethodRisk(params);
    riskScore += paymentMethodRisk.score;
    if (paymentMethodRisk.reason) reasons.push(paymentMethodRisk.reason);

    // Velocity check (multiple payments in short time)
    const velocityRisk = this.assessVelocityRisk(params);
    riskScore += velocityRisk.score;
    if (velocityRisk.reason) reasons.push(velocityRisk.reason);

    // Device and behavioral risk
    const behaviorRisk = this.assessBehavioralRisk(params);
    riskScore += behaviorRisk.score;
    if (behaviorRisk.reason) reasons.push(behaviorRisk.reason);

    // Address verification
    const addressRisk = this.assessAddressRisk(params);
    riskScore += addressRisk.score;
    if (addressRisk.reason) reasons.push(addressRisk.reason);

    // Historical patterns
    const historyRisk = this.assessHistoryRisk(params);
    riskScore += historyRisk.score;
    if (historyRisk.reason) reasons.push(historyRisk.reason);

    // Normalize risk score to 0-1 range
    riskScore = Math.min(riskScore, 1.0);

    const isFraudulent = riskScore > 0.7;
    const requiresVerification = riskScore > 0.4;
    
    return {
      isFraudulent,
      riskScore,
      reasons,
      recommendations: this.generateRecommendations(riskScore, reasons),
      allowPayment: !isFraudulent && riskScore < 0.8,
      requiresVerification
    };
  }

  private assessGeographicRisk(params: PaymentAnalysisParams): { score: number; reason?: string } {
    // Extract country from IP address (simplified)
    const country = this.extractCountryFromIP(params.ipAddress);
    
    if (this.HIGH_RISK_COUNTRIES.includes(country)) {
      return {
        score: 0.4,
        reason: `Payment from high-risk country: ${country}`
      };
    }

    // Check for VPN/proxy usage
    if (this.isVPNOrProxy(params.ipAddress)) {
      return {
        score: 0.3,
        reason: 'Payment appears to be from VPN or proxy'
      };
    }

    // Check for mismatch between billing address and IP location
    if (params.billingAddress && this.hasLocationMismatch(params.billingAddress, country)) {
      return {
        score: 0.2,
        reason: 'Billing address does not match IP location'
      };
    }

    return { score: 0 };
  }

  private assessAmountRisk(params: PaymentAnalysisParams): { score: number; reason?: string } {
    const { amount, previousPayments } = params;

    // Check for unusually high amounts
    if (amount > 10000) {
      return {
        score: 0.3,
        reason: `Unusually high payment amount: ${amount} ${params.currency}`
      };
    }

    // Check for round numbers (often indicates fraud)
    if (amount > 100 && amount % 100 === 0) {
      return {
        score: 0.1,
        reason: 'Payment amount is suspiciously round number'
      };
    }

    // Compare with previous payment patterns
    if (previousPayments && previousPayments.length > 0) {
      const avgAmount = previousPayments.reduce((sum, p) => sum + p.amount, 0) / previousPayments.length;
      
      if (amount > avgAmount * 10) {
        return {
          score: 0.4,
          reason: `Payment amount is ${(amount / avgAmount).toFixed(1)}x higher than historical average`
        };
      }
    }

    return { score: 0 };
  }

  private assessPaymentMethodRisk(params: PaymentAnalysisParams): { score: number; reason?: string } {
    const { paymentMethod } = params;

    // Prepaid cards and certain payment methods are higher risk
    const highRiskMethods = ['prepaid_card', 'gift_card', 'cryptocurrency'];
    if (highRiskMethods.some(method => paymentMethod.toLowerCase().includes(method))) {
      return {
        score: 0.3,
        reason: `High-risk payment method: ${paymentMethod}`
      };
    }

    // Virtual credit cards
    if (paymentMethod.toLowerCase().includes('virtual')) {
      return {
        score: 0.2,
        reason: 'Virtual payment method detected'
      };
    }

    return { score: 0 };
  }

  private assessVelocityRisk(params: PaymentAnalysisParams): { score: number; reason?: string } {
    if (!params.previousPayments) return { score: 0 };

    const now = new Date();
    const last24Hours = params.previousPayments.filter(p => 
      (now.getTime() - p.timestamp.getTime()) < 24 * 60 * 60 * 1000
    );

    const lastHour = params.previousPayments.filter(p => 
      (now.getTime() - p.timestamp.getTime()) < 60 * 60 * 1000
    );

    // Too many payments in last hour
    if (lastHour.length > 3) {
      return {
        score: 0.6,
        reason: `${lastHour.length} payments attempted in the last hour`
      };
    }

    // Too many payments in last 24 hours
    if (last24Hours.length > 10) {
      return {
        score: 0.4,
        reason: `${last24Hours.length} payments in the last 24 hours`
      };
    }

    // Multiple failed payments recently
    const recentFailures = last24Hours.filter(p => p.status === 'failed').length;
    if (recentFailures > 2) {
      return {
        score: 0.3,
        reason: `${recentFailures} failed payment attempts in last 24 hours`
      };
    }

    return { score: 0 };
  }

  private assessBehavioralRisk(params: PaymentAnalysisParams): { score: number; reason?: string } {
    const { userAgent, ipAddress } = params;

    // Check for automation/bot patterns
    if (this.isAutomatedUserAgent(userAgent)) {
      return {
        score: 0.5,
        reason: 'Payment appears to be automated'
      };
    }

    // Check for suspicious user agent patterns
    if (this.isSuspiciousUserAgent(userAgent)) {
      return {
        score: 0.3,
        reason: 'Suspicious browser/device detected'
      };
    }

    // Check for known fraudulent IP patterns
    if (this.isKnownFraudIP(ipAddress)) {
      return {
        score: 0.4,
        reason: 'IP address associated with previous fraud'
      };
    }

    return { score: 0 };
  }

  private assessAddressRisk(params: PaymentAnalysisParams): { score: number; reason?: string } {
    if (!params.billingAddress) return { score: 0.1, reason: 'No billing address provided' };

    const address = params.billingAddress;

    // Check for incomplete address
    if (!address.street || !address.city || !address.zipCode) {
      return {
        score: 0.2,
        reason: 'Incomplete billing address'
      };
    }

    // Check for suspicious address patterns
    if (this.isSuspiciousAddress(address)) {
      return {
        score: 0.3,
        reason: 'Suspicious billing address pattern'
      };
    }

    // Check for high-risk postal codes/areas
    if (this.isHighRiskArea(address.zipCode, address.country)) {
      return {
        score: 0.2,
        reason: 'Billing address in high-risk area'
      };
    }

    return { score: 0 };
  }

  private assessHistoryRisk(params: PaymentAnalysisParams): { score: number; reason?: string } {
    if (!params.previousPayments || params.previousPayments.length === 0) {
      return {
        score: 0.1,
        reason: 'New user with no payment history'
      };
    }

    const totalPayments = params.previousPayments.length;
    const failedPayments = params.previousPayments.filter(p => p.status === 'failed').length;
    const chargebacks = params.previousPayments.filter(p => p.status === 'chargeback').length;

    // High failure rate
    const failureRate = failedPayments / totalPayments;
    if (failureRate > 0.3) {
      return {
        score: 0.4,
        reason: `High payment failure rate: ${(failureRate * 100).toFixed(1)}%`
      };
    }

    // Any chargebacks
    if (chargebacks > 0) {
      return {
        score: 0.5,
        reason: `${chargebacks} previous chargeback(s) detected`
      };
    }

    return { score: 0 };
  }

  private extractCountryFromIP(ipAddress: string): string {
    // Simplified IP geolocation - in reality would use GeoIP service
    // Mock implementation
    const ipSegments = ipAddress.split('.');
    const firstSegment = parseInt(ipSegments[0]);
    
    if (firstSegment >= 1 && firstSegment <= 126) return 'US';
    if (firstSegment >= 128 && firstSegment <= 191) return 'EU';
    if (firstSegment >= 192 && firstSegment <= 223) return 'AS';
    
    return 'UNKNOWN';
  }

  private isVPNOrProxy(ipAddress: string): boolean {
    // Simplified VPN/proxy detection
    // In reality would check against VPN/proxy databases
    const knownVPNRanges = ['10.', '192.168.', '172.'];
    return knownVPNRanges.some(range => ipAddress.startsWith(range));
  }

  private hasLocationMismatch(address: Address, ipCountry: string): boolean {
    // Simplified check for address/IP location mismatch
    const addressCountry = address.country.toUpperCase();
    return addressCountry !== ipCountry && ipCountry !== 'UNKNOWN';
  }

  private isAutomatedUserAgent(userAgent: string): boolean {
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /automated/i, /script/i,
      /headless/i, /phantom/i, /selenium/i, /puppeteer/i
    ];
    return botPatterns.some(pattern => pattern.test(userAgent));
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    // Very old browsers or unusual patterns
    return userAgent.length < 20 || 
           userAgent.includes('Unknown') ||
           !userAgent.includes('Mozilla');
  }

  private isKnownFraudIP(ipAddress: string): boolean {
    // Mock implementation - would check against fraud database
    const knownFraudIPs = ['192.168.1.100', '10.0.0.50'];
    return knownFraudIPs.includes(ipAddress);
  }

  private isSuspiciousAddress(address: Address): boolean {
    // Check for common fraud address patterns
    const suspiciousPatterns = [
      /fake/i, /test/i, /temp/i, /123 main/i, /po box/i
    ];
    
    const fullAddress = `${address.street} ${address.city}`.toLowerCase();
    return suspiciousPatterns.some(pattern => pattern.test(fullAddress));
  }

  private isHighRiskArea(zipCode: string, country: string): boolean {
    // Mock implementation - would use real high-risk area database
    const highRiskZips = ['12345', '00000', '99999'];
    return highRiskZips.includes(zipCode);
  }

  private generateRecommendations(riskScore: number, reasons: string[]): string[] {
    const recommendations: string[] = [];

    if (riskScore > 0.8) {
      recommendations.push('Block payment immediately - high fraud risk detected');
      recommendations.push('Investigate user account for potential compromise');
    } else if (riskScore > 0.6) {
      recommendations.push('Require additional verification before processing payment');
      recommendations.push('Consider manual review by fraud team');
    } else if (riskScore > 0.4) {
      recommendations.push('Monitor transaction closely');
      recommendations.push('Consider step-up authentication');
    } else if (riskScore > 0.2) {
      recommendations.push('Process payment with standard monitoring');
    } else {
      recommendations.push('Low risk - process payment normally');
    }

    // Specific recommendations based on detected issues
    if (reasons.some(r => r.includes('VPN'))) {
      recommendations.push('Request identity verification due to VPN usage');
    }

    if (reasons.some(r => r.includes('high-risk country'))) {
      recommendations.push('Require additional documentation for high-risk location');
    }

    if (reasons.some(r => r.includes('chargeback'))) {
      recommendations.push('Flag for manual review due to chargeback history');
    }

    return recommendations;
  }
}