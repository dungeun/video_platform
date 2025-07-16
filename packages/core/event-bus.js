/**
 * Revu Platform Event Bus
 * Central event management system for inter-module communication
 */

const EventEmitter = require('events');
const Redis = require('redis');

class RevuEventBus extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.redis = Redis.createClient(config.redis);
    this.subscribers = new Map();
    this.eventHistory = [];
    this.maxHistorySize = config.maxHistorySize || 1000;
    
    // 이벤트 핸들러 등록
    this.setupEventHandlers();
    
    // Redis 연결
    this.connectRedis();
  }

  async connectRedis() {
    try {
      await this.redis.connect();
      console.log('Event Bus connected to Redis');
      
      // Redis pub/sub 설정
      this.subscriber = this.redis.duplicate();
      await this.subscriber.connect();
      
      this.setupRedisSubscriptions();
    } catch (error) {
      console.error('Redis connection failed:', error);
    }
  }

  setupRedisSubscriptions() {
    // 분산 이벤트 처리를 위한 Redis 구독
    this.subscriber.subscribe('revu:events', (message) => {
      try {
        const event = JSON.parse(message);
        this.handleDistributedEvent(event);
      } catch (error) {
        console.error('Failed to parse distributed event:', error);
      }
    });
  }

  // 이벤트 발행
  async publish(eventName, data, options = {}) {
    try {
      const event = {
        id: this.generateEventId(),
        name: eventName,
        data,
        timestamp: new Date(),
        source: options.source || 'unknown',
        version: options.version || '1.0',
        correlationId: options.correlationId,
        metadata: options.metadata || {}
      };

      // 로컬 이벤트 처리
      this.emit(eventName, event);
      
      // 이벤트 히스토리 저장
      this.addToHistory(event);
      
      // 분산 환경에서 다른 인스턴스로 전파
      if (!options.localOnly) {
        await this.publishToRedis(event);
      }

      console.log(`Event published: ${eventName}`, { id: event.id, source: event.source });
      
      return event.id;
    } catch (error) {
      console.error(`Failed to publish event ${eventName}:`, error);
      throw error;
    }
  }

  async publishToRedis(event) {
    try {
      await this.redis.publish('revu:events', JSON.stringify(event));
    } catch (error) {
      console.error('Failed to publish to Redis:', error);
    }
  }

  handleDistributedEvent(event) {
    // 중복 처리 방지
    if (this.isEventProcessed(event.id)) {
      return;
    }

    // 로컬 핸들러에 이벤트 전달
    this.emit(event.name, event);
    this.addToHistory(event);
  }

  // 이벤트 구독
  subscribe(eventName, handler, options = {}) {
    if (!this.subscribers.has(eventName)) {
      this.subscribers.set(eventName, []);
    }

    const subscription = {
      id: this.generateSubscriptionId(),
      handler,
      priority: options.priority || 0,
      filter: options.filter,
      retry: options.retry || 0,
      timeout: options.timeout || 30000
    };

    this.subscribers.get(eventName).push(subscription);
    
    // EventEmitter에 핸들러 등록
    this.on(eventName, async (event) => {
      await this.executeHandler(subscription, event);
    });

    return subscription.id;
  }

  async executeHandler(subscription, event) {
    try {
      // 필터 조건 확인
      if (subscription.filter && !subscription.filter(event)) {
        return;
      }

      // 타임아웃 설정
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Handler timeout')), subscription.timeout);
      });

      // 핸들러 실행
      await Promise.race([
        subscription.handler(event),
        timeoutPromise
      ]);

    } catch (error) {
      console.error(`Event handler failed for ${event.name}:`, error);
      
      // 재시도 로직
      if (subscription.retry > 0) {
        subscription.retry--;
        setTimeout(() => {
          this.executeHandler(subscription, event);
        }, 1000); // 1초 후 재시도
      }
    }
  }

  // 구독 취소
  unsubscribe(subscriptionId) {
    for (const [eventName, subscriptions] of this.subscribers) {
      const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
      if (index !== -1) {
        subscriptions.splice(index, 1);
        return true;
      }
    }
    return false;
  }

  // 이벤트 핸들러 설정
  setupEventHandlers() {
    // 사용자 관련 이벤트
    this.subscribe('user.registered', this.handleUserRegistered.bind(this));
    this.subscribe('user.verified', this.handleUserVerified.bind(this));
    this.subscribe('platform.connected', this.handlePlatformConnected.bind(this));

    // 캠페인 관련 이벤트
    this.subscribe('campaign.created', this.handleCampaignCreated.bind(this));
    this.subscribe('campaign.published', this.handleCampaignPublished.bind(this));
    this.subscribe('application.submitted', this.handleApplicationSubmitted.bind(this));
    this.subscribe('influencer.selected', this.handleInfluencerSelected.bind(this));

    // 콘텐츠 관련 이벤트
    this.subscribe('content.submitted', this.handleContentSubmitted.bind(this));
    this.subscribe('content.approved', this.handleContentApproved.bind(this));
    this.subscribe('content.published', this.handleContentPublished.bind(this));

    // 결제 관련 이벤트
    this.subscribe('payment.completed', this.handlePaymentCompleted.bind(this));
    this.subscribe('escrow.funded', this.handleEscrowFunded.bind(this));
    this.subscribe('payout.processed', this.handlePayoutProcessed.bind(this));

    // 분석 관련 이벤트
    this.subscribe('analytics.updated', this.handleAnalyticsUpdated.bind(this));
    this.subscribe('engagement.tracked', this.handleEngagementTracked.bind(this));
  }

  // 이벤트 핸들러 구현
  async handleUserRegistered(event) {
    const { user, type } = event.data;
    
    // 환영 알림 발송
    await this.publish('notification.send', {
      userId: user.id,
      type: 'welcome',
      template: type === 'business' ? 'business_welcome' : 'influencer_welcome',
      data: { userName: user.name || user.email }
    });

    // 분석 데이터 초기화
    await this.publish('analytics.initialize', {
      userId: user.id,
      userType: type
    });
  }

  async handleUserVerified(event) {
    const { userId, userType } = event.data;
    
    // 검증 완료 알림
    await this.publish('notification.send', {
      userId,
      type: 'verification_complete',
      template: 'verification_success'
    });

    // 추천 시스템 업데이트
    if (userType === 'influencer') {
      await this.publish('matching.updateIndex', {
        influencerId: userId
      });
    }
  }

  async handlePlatformConnected(event) {
    const { userId, platform, stats } = event.data;
    
    // 플랫폼 연결 알림
    await this.publish('notification.send', {
      userId,
      type: 'platform_connected',
      data: { platform, followerCount: stats.followers }
    });

    // 매칭 스코어 재계산
    await this.publish('matching.recalculateScore', {
      influencerId: userId,
      trigger: 'platform_connected'
    });
  }

  async handleCampaignCreated(event) {
    const { campaign, businessId } = event.data;
    
    // AI 매칭 시작
    await this.publish('matching.findInfluencers', {
      campaignId: campaign.id,
      requirements: campaign.requirements
    });

    // 캠페인 생성 알림
    await this.publish('notification.send', {
      userId: businessId,
      type: 'campaign_created',
      data: { campaignTitle: campaign.title }
    });
  }

  async handleCampaignPublished(event) {
    const { campaignId, matchedInfluencers } = event.data;
    
    // 매칭된 인플루언서들에게 알림
    for (const influencerId of matchedInfluencers) {
      await this.publish('notification.send', {
        userId: influencerId,
        type: 'campaign_opportunity',
        data: { campaignId }
      });
    }

    // 분석 추적 시작
    await this.publish('analytics.startTracking', {
      campaignId,
      trackingType: 'campaign_performance'
    });
  }

  async handleApplicationSubmitted(event) {
    const { campaignId, influencerId, businessId } = event.data;
    
    // 비즈니스에게 지원 알림
    await this.publish('notification.send', {
      userId: businessId,
      type: 'application_received',
      data: { campaignId, influencerId }
    });

    // 지원자에게 확인 알림
    await this.publish('notification.send', {
      userId: influencerId,
      type: 'application_confirmed',
      data: { campaignId }
    });
  }

  async handleInfluencerSelected(event) {
    const { campaignId, influencerId, businessId, terms } = event.data;
    
    // 선정된 인플루언서에게 알림
    await this.publish('notification.send', {
      userId: influencerId,
      type: 'campaign_selected',
      data: { campaignId, terms }
    });

    // 계약 생성
    await this.publish('contract.generate', {
      campaignId,
      influencerId,
      businessId,
      terms
    });

    // 결제 프로세스 시작
    await this.publish('payment.initiate', {
      campaignId,
      businessId,
      amount: terms.amount
    });
  }

  async handleContentSubmitted(event) {
    const { contentId, campaignId, influencerId, businessId } = event.data;
    
    // 비즈니스에게 검수 요청 알림
    await this.publish('notification.send', {
      userId: businessId,
      type: 'content_review_required',
      data: { campaignId, contentId }
    });

    // 콘텐츠 분석 시작
    await this.publish('analytics.analyzeContent', {
      contentId,
      campaignId
    });
  }

  async handleContentApproved(event) {
    const { contentId, campaignId, influencerId } = event.data;
    
    // 인플루언서에게 승인 알림
    await this.publish('notification.send', {
      userId: influencerId,
      type: 'content_approved',
      data: { campaignId, contentId }
    });

    // 에스크로 릴리즈 조건 확인
    await this.publish('escrow.checkReleaseConditions', {
      campaignId,
      trigger: 'content_approved'
    });
  }

  async handleContentPublished(event) {
    const { contentId, campaignId, influencerId, platform } = event.data;
    
    // 성과 추적 시작
    await this.publish('analytics.trackPerformance', {
      contentId,
      campaignId,
      platform
    });

    // 실시간 모니터링 시작
    await this.publish('monitoring.startRealtime', {
      contentId,
      campaignId
    });
  }

  async handlePaymentCompleted(event) {
    const { paymentId, campaignId, amount } = event.data;
    
    // 에스크로 펀딩
    await this.publish('escrow.fund', {
      campaignId,
      paymentId,
      amount
    });

    // 결제 완료 알림
    await this.publish('notification.send', {
      type: 'payment_completed',
      data: { campaignId, amount }
    });
  }

  async handleEscrowFunded(event) {
    const { escrowId, campaignId, amount } = event.data;
    
    // 캠페인 활성화
    await this.publish('campaign.activate', {
      campaignId,
      escrowId
    });
  }

  async handlePayoutProcessed(event) {
    const { payoutId, influencerId, amount } = event.data;
    
    // 정산 완료 알림
    await this.publish('notification.send', {
      userId: influencerId,
      type: 'payout_completed',
      data: { amount }
    });

    // 수익 분석 업데이트
    await this.publish('analytics.updateEarnings', {
      influencerId,
      amount
    });
  }

  async handleAnalyticsUpdated(event) {
    const { campaignId, metrics } = event.data;
    
    // 실시간 대시보드 업데이트
    await this.publish('dashboard.update', {
      campaignId,
      metrics
    });

    // 성과 임계값 확인
    if (metrics.conversionRate > 5) { // 5% 초과시
      await this.publish('campaign.performanceAlert', {
        campaignId,
        alertType: 'high_performance',
        metrics
      });
    }
  }

  async handleEngagementTracked(event) {
    const { contentId, engagement } = event.data;
    
    // 참여율 분석 업데이트
    await this.publish('analytics.updateEngagement', {
      contentId,
      engagement
    });
  }

  // 이벤트 스케줄링
  async scheduleEvent(eventName, data, delay) {
    setTimeout(() => {
      this.publish(eventName, data);
    }, delay);
  }

  // 이벤트 체인 실행
  async executeEventChain(events) {
    for (const event of events) {
      await this.publish(event.name, event.data);
      if (event.delay) {
        await this.sleep(event.delay);
      }
    }
  }

  // 이벤트 히스토리 관리
  addToHistory(event) {
    this.eventHistory.unshift(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(0, this.maxHistorySize);
    }
  }

  getEventHistory(filter = {}) {
    let history = this.eventHistory;
    
    if (filter.eventName) {
      history = history.filter(event => event.name === filter.eventName);
    }
    
    if (filter.source) {
      history = history.filter(event => event.source === filter.source);
    }
    
    if (filter.since) {
      history = history.filter(event => event.timestamp >= filter.since);
    }
    
    return history;
  }

  isEventProcessed(eventId) {
    return this.eventHistory.some(event => event.id === eventId);
  }

  // 이벤트 상태 모니터링
  getEventStats() {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentEvents = this.eventHistory.filter(
      event => event.timestamp >= lastHour
    );

    const eventCounts = {};
    recentEvents.forEach(event => {
      eventCounts[event.name] = (eventCounts[event.name] || 0) + 1;
    });

    return {
      totalEvents: this.eventHistory.length,
      recentEvents: recentEvents.length,
      eventCounts,
      subscribers: Array.from(this.subscribers.keys()).length
    };
  }

  // 유틸리티 메서드
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateSubscriptionId() {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 정리
  async shutdown() {
    try {
      await this.redis.quit();
      await this.subscriber.quit();
      this.removeAllListeners();
      console.log('Event Bus shutdown completed');
    } catch (error) {
      console.error('Event Bus shutdown error:', error);
    }
  }
}

module.exports = RevuEventBus;