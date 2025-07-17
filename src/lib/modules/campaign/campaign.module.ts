/**
 * Campaign Module
 * 모듈 초기화 및 생명주기 관리
 */

import { EventEmitter } from 'events';
import { DatabaseManager } from '../../core/DatabaseManager';
import { RedisManager } from '../../core/RedisManager';
import { CampaignModuleAdapter } from './campaign.adapter';
import { CampaignService } from './campaign.service';
import { createCampaignRouter } from './campaign.router';
import { Router } from 'express';

export interface CampaignModuleDeps {
  db: DatabaseManager;
  redis: RedisManager;
  eventBus: EventEmitter;
}

export class CampaignModule {
  private adapter: CampaignModuleAdapter;
  private service: CampaignService;
  private router: Router;
  private initialized = false;

  constructor(private deps: CampaignModuleDeps) {
    this.adapter = new CampaignModuleAdapter(deps);
    this.service = new CampaignService(this.adapter, deps.eventBus);
    this.router = createCampaignRouter(this.service);
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // 이벤트 리스너 등록
    this.setupEventListeners();

    this.initialized = true;
    console.log('Campaign module initialized');
  }

  private setupEventListeners(): void {
    const { eventBus } = this.deps;

    // 캠페인 생성 시 알림 전송
    eventBus.on('campaign.created', async (data) => {
      console.log('Campaign created:', data);
      // 알림 모듈과 연동
      eventBus.emit('notification.send', {
        type: 'campaign.new',
        title: 'New Campaign Available',
        message: `Check out the new campaign: ${data.title}`,
        targetType: 'broadcast',
        metadata: { campaignId: data.campaignId }
      });
    });

    // 지원 승인 시 알림
    eventBus.on('application.status.changed', async (data) => {
      console.log('Application status changed:', data);
      
      const notificationType = data.status === 'APPROVED' ? 
        'application.approved' : 'application.rejected';
      
      eventBus.emit('notification.send', {
        type: notificationType,
        userId: data.influencerId,
        title: `Application ${data.status.toLowerCase()}`,
        message: data.reason || `Your application has been ${data.status.toLowerCase()}`,
        metadata: { 
          campaignId: data.campaignId,
          applicationId: data.applicationId 
        }
      });
    });

    // 콘텐츠 제출 시 알림
    eventBus.on('content.submitted', async (data) => {
      console.log('Content submitted:', data);
      // 비즈니스에게 알림
      eventBus.emit('notification.send', {
        type: 'content.submitted',
        campaignId: data.campaignId,
        title: 'New Content Submitted',
        message: 'An influencer has submitted content for review',
        metadata: { 
          contentId: data.contentId,
          influencerId: data.influencerId 
        }
      });
    });

    // 콘텐츠 리뷰 시 알림
    eventBus.on('content.reviewed', async (data) => {
      console.log('Content reviewed:', data);
      
      const notificationType = data.status === 'APPROVED' ? 
        'content.approved' : 'content.rejected';
      
      eventBus.emit('notification.send', {
        type: notificationType,
        userId: data.influencerId,
        title: `Content ${data.status.toLowerCase()}`,
        message: `Your content has been ${data.status.toLowerCase()}`,
        metadata: { 
          contentId: data.contentId,
          campaignId: data.campaignId 
        }
      });

      // 승인된 경우 결제 프로세스 시작
      if (data.status === 'APPROVED') {
        eventBus.emit('payment.initiate', {
          contentId: data.contentId,
          campaignId: data.campaignId,
          influencerId: data.influencerId
        });
      }
    });
  }

  getRouter(): Router {
    return this.router;
  }

  getService(): CampaignService {
    return this.service;
  }

  async destroy(): Promise<void> {
    // 이벤트 리스너 정리
    this.deps.eventBus.removeAllListeners('campaign.created');
    this.deps.eventBus.removeAllListeners('application.status.changed');
    this.deps.eventBus.removeAllListeners('content.submitted');
    this.deps.eventBus.removeAllListeners('content.reviewed');
    
    this.initialized = false;
    console.log('Campaign module destroyed');
  }
}