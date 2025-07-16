/**
 * Event Entity
 * Domain entity for promotional events with business logic
 */

import { 
  Event as IEvent,
  EventType,
  EventStatus,
  ValidationError
} from '../types';

export class Event implements IEvent {
  public id: string;
  public name: string;
  public description: string;
  public type: EventType;
  public status: EventStatus;
  public startDate: Date;
  public endDate: Date;
  public isRecurring: boolean;
  public recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endAfter?: number;
    endDate?: Date;
  };
  public campaignIds: string[];
  public featured: boolean;
  public showCountdown: boolean;
  public customStyling?: {
    backgroundColor?: string;
    textColor?: string;
    bannerImage?: string;
  };
  public views: number;
  public clicks: number;
  public conversions: number;
  public revenue: number;
  public createdAt: Date;
  public updatedAt: Date;
  public createdBy: string;
  public updatedBy?: string;

  constructor(data: IEvent) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.type = data.type;
    this.status = data.status;
    this.startDate = data.startDate;
    this.endDate = data.endDate;
    this.isRecurring = data.isRecurring;
    this.recurringPattern = data.recurringPattern;
    this.campaignIds = data.campaignIds;
    this.featured = data.featured;
    this.showCountdown = data.showCountdown;
    this.customStyling = data.customStyling;
    this.views = data.views;
    this.clicks = data.clicks;
    this.conversions = data.conversions;
    this.revenue = data.revenue;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.createdBy = data.createdBy;
    this.updatedBy = data.updatedBy;

    this.validate();
  }

  /**
   * Validate the event data
   */
  private validate(): void {
    if (!this.name?.trim()) {
      throw new ValidationError('Event name is required', 'name');
    }

    if (!this.description?.trim()) {
      throw new ValidationError('Event description is required', 'description');
    }

    if (this.startDate >= this.endDate) {
      throw new ValidationError('Start date must be before end date', 'startDate');
    }

    if (!Object.values(EventType).includes(this.type)) {
      throw new ValidationError('Invalid event type', 'type');
    }

    if (!Object.values(EventStatus).includes(this.status)) {
      throw new ValidationError('Invalid event status', 'status');
    }

    this.validateRecurringPattern();
  }

  /**
   * Validate recurring pattern if the event is recurring
   */
  private validateRecurringPattern(): void {
    if (!this.isRecurring) {
      return;
    }

    if (!this.recurringPattern) {
      throw new ValidationError('Recurring pattern is required for recurring events', 'recurringPattern');
    }

    const validFrequencies = ['daily', 'weekly', 'monthly', 'yearly'];
    if (!validFrequencies.includes(this.recurringPattern.frequency)) {
      throw new ValidationError('Invalid recurring frequency', 'recurringPattern.frequency');
    }

    if (this.recurringPattern.interval <= 0) {
      throw new ValidationError('Recurring interval must be positive', 'recurringPattern.interval');
    }

    if (this.recurringPattern.endAfter && this.recurringPattern.endAfter <= 0) {
      throw new ValidationError('End after must be positive', 'recurringPattern.endAfter');
    }

    if (this.recurringPattern.endDate && this.recurringPattern.endDate <= this.endDate) {
      throw new ValidationError('Recurring end date must be after event end date', 'recurringPattern.endDate');
    }
  }

  /**
   * Check if the event is currently live
   */
  public isLive(): boolean {
    const now = new Date();
    return this.status === EventStatus.LIVE && 
           this.startDate <= now && 
           this.endDate >= now;
  }

  /**
   * Check if the event is upcoming
   */
  public isUpcoming(): boolean {
    const now = new Date();
    return this.status === EventStatus.UPCOMING && this.startDate > now;
  }

  /**
   * Check if the event has ended
   */
  public hasEnded(): boolean {
    const now = new Date();
    return this.endDate < now || this.status === EventStatus.ENDED;
  }

  /**
   * Get time remaining until event starts (in milliseconds)
   */
  public getTimeUntilStart(): number {
    const now = new Date();
    return Math.max(0, this.startDate.getTime() - now.getTime());
  }

  /**
   * Get time remaining until event ends (in milliseconds)
   */
  public getTimeUntilEnd(): number {
    const now = new Date();
    return Math.max(0, this.endDate.getTime() - now.getTime());
  }

  /**
   * Get event duration in milliseconds
   */
  public getDuration(): number {
    return this.endDate.getTime() - this.startDate.getTime();
  }

  /**
   * Start the event
   */
  public start(): void {
    if (this.hasEnded()) {
      throw new ValidationError('Cannot start ended event', 'endDate');
    }

    this.status = EventStatus.LIVE;
    this.updatedAt = new Date();
  }

  /**
   * End the event
   */
  public end(): void {
    this.status = EventStatus.ENDED;
    this.updatedAt = new Date();
  }

  /**
   * Cancel the event
   */
  public cancel(): void {
    this.status = EventStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  /**
   * Add a campaign to the event
   */
  public addCampaign(campaignId: string): void {
    if (!this.campaignIds.includes(campaignId)) {
      this.campaignIds.push(campaignId);
      this.updatedAt = new Date();
    }
  }

  /**
   * Remove a campaign from the event
   */
  public removeCampaign(campaignId: string): void {
    const index = this.campaignIds.indexOf(campaignId);
    if (index > -1) {
      this.campaignIds.splice(index, 1);
      this.updatedAt = new Date();
    }
  }

  /**
   * Record a view
   */
  public recordView(): void {
    this.views++;
    this.updatedAt = new Date();
  }

  /**
   * Record a click
   */
  public recordClick(): void {
    this.clicks++;
    this.updatedAt = new Date();
  }

  /**
   * Record a conversion with revenue
   */
  public recordConversion(revenue: number = 0): void {
    this.conversions++;
    this.revenue += revenue;
    this.updatedAt = new Date();
  }

  /**
   * Get click-through rate
   */
  public getClickThroughRate(): number {
    return this.views > 0 ? (this.clicks / this.views) * 100 : 0;
  }

  /**
   * Get conversion rate
   */
  public getConversionRate(): number {
    return this.clicks > 0 ? (this.conversions / this.clicks) * 100 : 0;
  }

  /**
   * Get average revenue per conversion
   */
  public getAverageRevenuePerConversion(): number {
    return this.conversions > 0 ? this.revenue / this.conversions : 0;
  }

  /**
   * Generate next occurrence for recurring events
   */
  public getNextOccurrence(): Event | null {
    if (!this.isRecurring || !this.recurringPattern) {
      return null;
    }

    const nextStartDate = new Date(this.startDate);
    const nextEndDate = new Date(this.endDate);
    const duration = this.getDuration();

    switch (this.recurringPattern.frequency) {
      case 'daily':
        nextStartDate.setDate(nextStartDate.getDate() + this.recurringPattern.interval);
        break;
      case 'weekly':
        nextStartDate.setDate(nextStartDate.getDate() + (7 * this.recurringPattern.interval));
        break;
      case 'monthly':
        nextStartDate.setMonth(nextStartDate.getMonth() + this.recurringPattern.interval);
        break;
      case 'yearly':
        nextStartDate.setFullYear(nextStartDate.getFullYear() + this.recurringPattern.interval);
        break;
    }

    nextEndDate.setTime(nextStartDate.getTime() + duration);

    // Check if we should continue generating occurrences
    if (this.recurringPattern.endDate && nextStartDate > this.recurringPattern.endDate) {
      return null;
    }

    const nextEventData: IEvent = {
      ...this,
      id: '', // Will be set by the service
      startDate: nextStartDate,
      endDate: nextEndDate,
      status: EventStatus.UPCOMING,
      views: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return new Event(nextEventData);
  }

  /**
   * Get event type description
   */
  public getTypeDescription(): string {
    switch (this.type) {
      case EventType.FLASH_SALE:
        return 'Flash Sale';
      case EventType.SEASONAL_SALE:
        return 'Seasonal Sale';
      case EventType.CLEARANCE:
        return 'Clearance';
      case EventType.NEW_PRODUCT_LAUNCH:
        return 'New Product Launch';
      case EventType.SPECIAL_OCCASION:
        return 'Special Occasion';
      case EventType.LIMITED_TIME_OFFER:
        return 'Limited Time Offer';
      default:
        return 'Event';
    }
  }

  /**
   * Get event status description
   */
  public getStatusDescription(): string {
    switch (this.status) {
      case EventStatus.UPCOMING:
        return 'Coming Soon';
      case EventStatus.LIVE:
        return 'Live Now';
      case EventStatus.ENDED:
        return 'Ended';
      case EventStatus.CANCELLED:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get formatted countdown text
   */
  public getCountdownText(): string {
    if (!this.showCountdown) {
      return '';
    }

    const now = new Date();
    let targetTime: number;
    let prefix: string;

    if (this.isUpcoming()) {
      targetTime = this.getTimeUntilStart();
      prefix = 'Starts in';
    } else if (this.isLive()) {
      targetTime = this.getTimeUntilEnd();
      prefix = 'Ends in';
    } else {
      return 'Event has ended';
    }

    const days = Math.floor(targetTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((targetTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((targetTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((targetTime % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${prefix} ${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${prefix} ${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${prefix} ${minutes}m ${seconds}s`;
    } else {
      return `${prefix} ${seconds}s`;
    }
  }

  /**
   * Convert to JSON representation
   */
  public toJSON(): IEvent {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      status: this.status,
      startDate: this.startDate,
      endDate: this.endDate,
      isRecurring: this.isRecurring,
      recurringPattern: this.recurringPattern,
      campaignIds: this.campaignIds,
      featured: this.featured,
      showCountdown: this.showCountdown,
      customStyling: this.customStyling,
      views: this.views,
      clicks: this.clicks,
      conversions: this.conversions,
      revenue: this.revenue,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy
    };
  }
}