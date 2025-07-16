/**
 * Banner Entity
 * Domain entity for promotional banners with business logic
 */

import { 
  Banner as IBanner,
  BannerPosition,
  TargetAudience,
  AudienceType,
  ValidationError
} from '../types';

export class Banner implements IBanner {
  public id: string;
  public title: string;
  public subtitle?: string;
  public content: string;
  public imageUrl?: string;
  public position: BannerPosition;
  public priority: number;
  public isActive: boolean;
  public startDate?: Date;
  public endDate?: Date;
  public targetAudience: TargetAudience;
  public displayRules: {
    showOnPages?: string[];
    showOnCategories?: string[];
    maxImpressionsPerUser?: number;
    frequencyCap?: {
      impressions: number;
      period: 'hour' | 'day' | 'week' | 'month';
    };
  };
  public clickAction: {
    type: 'url' | 'promotion' | 'product' | 'category' | 'none';
    value?: string;
  };
  public styling: {
    width?: string;
    height?: string;
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: string;
    animation?: 'none' | 'fade' | 'slide' | 'bounce';
  };
  public impressions: number;
  public clicks: number;
  public clickThroughRate: number;
  public createdAt: Date;
  public updatedAt: Date;
  public createdBy: string;
  public updatedBy?: string;

  constructor(data: IBanner) {
    this.id = data.id;
    this.title = data.title;
    this.subtitle = data.subtitle;
    this.content = data.content;
    this.imageUrl = data.imageUrl;
    this.position = data.position;
    this.priority = data.priority;
    this.isActive = data.isActive;
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.targetAudience = data.targetAudience;
    this.displayRules = data.displayRules;
    this.clickAction = data.clickAction;
    this.styling = data.styling;
    this.impressions = data.impressions;
    this.clicks = data.clicks;
    this.clickThroughRate = data.clickThroughRate;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.createdBy = data.createdBy;
    this.updatedBy = data.updatedBy;

    this.validate();
  }

  /**
   * Validate the banner data
   */
  private validate(): void {
    if (!this.title?.trim()) {
      throw new ValidationError('Banner title is required', 'title');
    }

    if (!this.content?.trim()) {
      throw new ValidationError('Banner content is required', 'content');
    }

    if (!Object.values(BannerPosition).includes(this.position)) {
      throw new ValidationError('Invalid banner position', 'position');
    }

    if (this.startDate && this.endDate && this.startDate >= this.endDate) {
      throw new ValidationError('Start date must be before end date', 'startDate');
    }

    this.validateTargetAudience();
    this.validateDisplayRules();
    this.validateClickAction();
    this.validateStyling();
  }

  /**
   * Validate target audience
   */
  private validateTargetAudience(): void {
    if (!Object.values(AudienceType).includes(this.targetAudience.type)) {
      throw new ValidationError('Invalid audience type', 'targetAudience.type');
    }

    if (this.targetAudience.type === AudienceType.SPECIFIC_USERS) {
      if (!this.targetAudience.userIds || this.targetAudience.userIds.length === 0) {
        throw new ValidationError('User IDs required for specific users audience', 'targetAudience.userIds');
      }
    }

    if (this.targetAudience.type === AudienceType.USER_GROUPS) {
      if (!this.targetAudience.userGroupIds || this.targetAudience.userGroupIds.length === 0) {
        throw new ValidationError('User group IDs required for user groups audience', 'targetAudience.userGroupIds');
      }
    }
  }

  /**
   * Validate display rules
   */
  private validateDisplayRules(): void {
    if (this.displayRules.maxImpressionsPerUser && this.displayRules.maxImpressionsPerUser <= 0) {
      throw new ValidationError('Max impressions per user must be positive', 'displayRules.maxImpressionsPerUser');
    }

    if (this.displayRules.frequencyCap) {
      if (this.displayRules.frequencyCap.impressions <= 0) {
        throw new ValidationError('Frequency cap impressions must be positive', 'displayRules.frequencyCap.impressions');
      }

      const validPeriods = ['hour', 'day', 'week', 'month'];
      if (!validPeriods.includes(this.displayRules.frequencyCap.period)) {
        throw new ValidationError('Invalid frequency cap period', 'displayRules.frequencyCap.period');
      }
    }
  }

  /**
   * Validate click action
   */
  private validateClickAction(): void {
    const validTypes = ['url', 'promotion', 'product', 'category', 'none'];
    if (!validTypes.includes(this.clickAction.type)) {
      throw new ValidationError('Invalid click action type', 'clickAction.type');
    }

    if (this.clickAction.type !== 'none' && !this.clickAction.value?.trim()) {
      throw new ValidationError('Click action value is required', 'clickAction.value');
    }

    if (this.clickAction.type === 'url' && this.clickAction.value) {
      try {
        new URL(this.clickAction.value);
      } catch {
        throw new ValidationError('Invalid URL format', 'clickAction.value');
      }
    }
  }

  /**
   * Validate styling
   */
  private validateStyling(): void {
    if (this.styling.animation) {
      const validAnimations = ['none', 'fade', 'slide', 'bounce'];
      if (!validAnimations.includes(this.styling.animation)) {
        throw new ValidationError('Invalid animation type', 'styling.animation');
      }
    }

    // Validate color formats (basic validation)
    if (this.styling.backgroundColor && !this.isValidColor(this.styling.backgroundColor)) {
      throw new ValidationError('Invalid background color format', 'styling.backgroundColor');
    }

    if (this.styling.textColor && !this.isValidColor(this.styling.textColor)) {
      throw new ValidationError('Invalid text color format', 'styling.textColor');
    }
  }

  /**
   * Basic color validation (hex, rgb, rgba, named colors)
   */
  private isValidColor(color: string): boolean {
    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const rgbPattern = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
    const rgbaPattern = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(0|1|0?\.\d+)\s*\)$/;
    const namedColors = ['transparent', 'inherit', 'currentColor'];

    return hexPattern.test(color) || 
           rgbPattern.test(color) || 
           rgbaPattern.test(color) || 
           namedColors.includes(color);
  }

  /**
   * Check if the banner should be displayed based on date range
   */
  public isDisplayable(): boolean {
    if (!this.isActive) return false;

    const now = new Date();
    
    if (this.startDate && this.startDate > now) return false;
    if (this.endDate && this.endDate < now) return false;

    return true;
  }

  /**
   * Check if the banner should be shown on a specific page
   */
  public shouldShowOnPage(pagePath: string): boolean {
    if (!this.displayRules.showOnPages) return true;
    return this.displayRules.showOnPages.includes(pagePath);
  }

  /**
   * Check if the banner should be shown for a specific category
   */
  public shouldShowForCategory(categoryId: string): boolean {
    if (!this.displayRules.showOnCategories) return true;
    return this.displayRules.showOnCategories.includes(categoryId);
  }

  /**
   * Check if user has reached impression limit
   */
  public hasUserReachedImpressionLimit(userImpressions: number): boolean {
    if (!this.displayRules.maxImpressionsPerUser) return false;
    return userImpressions >= this.displayRules.maxImpressionsPerUser;
  }

  /**
   * Check if frequency cap has been reached
   */
  public hasReachedFrequencyCap(impressionsInPeriod: number): boolean {
    if (!this.displayRules.frequencyCap) return false;
    return impressionsInPeriod >= this.displayRules.frequencyCap.impressions;
  }

  /**
   * Activate the banner
   */
  public activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  /**
   * Deactivate the banner
   */
  public deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  /**
   * Record an impression
   */
  public recordImpression(): void {
    this.impressions++;
    this.updateClickThroughRate();
    this.updatedAt = new Date();
  }

  /**
   * Record a click
   */
  public recordClick(): void {
    this.clicks++;
    this.updateClickThroughRate();
    this.updatedAt = new Date();
  }

  /**
   * Update click-through rate
   */
  private updateClickThroughRate(): void {
    this.clickThroughRate = this.impressions > 0 ? 
      (this.clicks / this.impressions) * 100 : 0;
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): {
    impressions: number;
    clicks: number;
    clickThroughRate: number;
    engagement: 'low' | 'medium' | 'high';
  } {
    let engagement: 'low' | 'medium' | 'high' = 'low';
    
    if (this.clickThroughRate > 5) {
      engagement = 'high';
    } else if (this.clickThroughRate > 2) {
      engagement = 'medium';
    }

    return {
      impressions: this.impressions,
      clicks: this.clicks,
      clickThroughRate: this.clickThroughRate,
      engagement
    };
  }

  /**
   * Get position description
   */
  public getPositionDescription(): string {
    switch (this.position) {
      case BannerPosition.TOP:
        return 'Top of page';
      case BannerPosition.HEADER:
        return 'Header area';
      case BannerPosition.HERO:
        return 'Hero section';
      case BannerPosition.SIDEBAR:
        return 'Sidebar';
      case BannerPosition.FOOTER:
        return 'Footer area';
      case BannerPosition.POPUP:
        return 'Popup modal';
      case BannerPosition.FLOATING:
        return 'Floating overlay';
      default:
        return 'Unknown position';
    }
  }

  /**
   * Get CSS classes for styling
   */
  public getCSSClasses(): string[] {
    const classes: string[] = [
      'promotion-banner',
      `banner-position-${this.position}`,
      `banner-priority-${this.priority}`
    ];

    if (this.styling.animation && this.styling.animation !== 'none') {
      classes.push(`banner-animation-${this.styling.animation}`);
    }

    if (!this.isActive) {
      classes.push('banner-inactive');
    }

    return classes;
  }

  /**
   * Get inline styles object
   */
  public getInlineStyles(): Record<string, string> {
    const styles: Record<string, string> = {};

    if (this.styling.width) styles.width = this.styling.width;
    if (this.styling.height) styles.height = this.styling.height;
    if (this.styling.backgroundColor) styles.backgroundColor = this.styling.backgroundColor;
    if (this.styling.textColor) styles.color = this.styling.textColor;
    if (this.styling.borderRadius) styles.borderRadius = this.styling.borderRadius;

    return styles;
  }

  /**
   * Generate HTML content for the banner
   */
  public toHTML(): string {
    const styles = this.getInlineStyles();
    const styleString = Object.entries(styles)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');

    const classes = this.getCSSClasses().join(' ');

    let clickHandler = '';
    if (this.clickAction.type !== 'none' && this.clickAction.value) {
      switch (this.clickAction.type) {
        case 'url':
          clickHandler = `onclick="window.open('${this.clickAction.value}', '_blank')"`;
          break;
        case 'promotion':
        case 'product':
        case 'category':
          clickHandler = `onclick="handleBannerClick('${this.clickAction.type}', '${this.clickAction.value}')"`;
          break;
      }
    }

    return `
      <div class="${classes}" style="${styleString}" ${clickHandler}>
        ${this.imageUrl ? `<img src="${this.imageUrl}" alt="${this.title}" />` : ''}
        <div class="banner-content">
          <h3 class="banner-title">${this.title}</h3>
          ${this.subtitle ? `<p class="banner-subtitle">${this.subtitle}</p>` : ''}
          <div class="banner-text">${this.content}</div>
        </div>
      </div>
    `;
  }

  /**
   * Clone the banner with a new ID
   */
  public clone(newTitle?: string): Banner {
    const clonedData: IBanner = {
      ...this,
      id: '', // Will be set by the service
      title: newTitle || `${this.title} (Copy)`,
      impressions: 0,
      clicks: 0,
      clickThroughRate: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return new Banner(clonedData);
  }

  /**
   * Convert to JSON representation
   */
  public toJSON(): IBanner {
    return {
      id: this.id,
      title: this.title,
      subtitle: this.subtitle,
      content: this.content,
      imageUrl: this.imageUrl,
      position: this.position,
      priority: this.priority,
      isActive: this.isActive,
      startDate: this.startDate,
      endDate: this.endDate,
      targetAudience: this.targetAudience,
      displayRules: this.displayRules,
      clickAction: this.clickAction,
      styling: this.styling,
      impressions: this.impressions,
      clicks: this.clicks,
      clickThroughRate: this.clickThroughRate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy
    };
  }
}