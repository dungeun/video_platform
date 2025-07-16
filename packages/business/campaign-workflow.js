/**
 * Revu Platform Campaign Workflow Module
 * 캠페인 상태 관리 및 워크플로우 엔진
 */

const EventEmitter = require('events');

// 캠페인 상태 정의
const CampaignState = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  REVIEW: 'review',
  COMPLETED: 'completed',
  SETTLED: 'settled',
  CANCELLED: 'cancelled',
  PAUSED: 'paused',
  REJECTED: 'rejected'
};

// 워크플로우 전이 규칙
const StateTransitions = {
  [CampaignState.DRAFT]: [CampaignState.ACTIVE, CampaignState.CANCELLED],
  [CampaignState.ACTIVE]: [CampaignState.REVIEW, CampaignState.PAUSED, CampaignState.CANCELLED],
  [CampaignState.PAUSED]: [CampaignState.ACTIVE, CampaignState.CANCELLED],
  [CampaignState.REVIEW]: [CampaignState.COMPLETED, CampaignState.REJECTED, CampaignState.ACTIVE],
  [CampaignState.REJECTED]: [CampaignState.ACTIVE, CampaignState.CANCELLED],
  [CampaignState.COMPLETED]: [CampaignState.SETTLED],
  [CampaignState.SETTLED]: [], // 최종 상태
  [CampaignState.CANCELLED]: [] // 최종 상태
};

// 승인 단계 정의
const ApprovalType = {
  BUSINESS_APPROVAL: 'business_approval',
  INFLUENCER_APPROVAL: 'influencer_approval',
  ADMIN_APPROVAL: 'admin_approval',
  CONTENT_APPROVAL: 'content_approval',
  PAYMENT_APPROVAL: 'payment_approval'
};

class CampaignWorkflowModule extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.workflows = new Map(); // campaignId -> workflow
    this.automationRules = new Map(); // ruleId -> rule
    this.approvalQueue = new Map(); // approvalId -> approval
    this.eventBus = null; // 의존성 주입됨
    
    // 기본 자동화 규칙 설정
    this.setupDefaultAutomationRules();
    
    // 스케줄러 시작
    this.startAutomationScheduler();
  }

  // 의존성 주입
  connectEventBus(eventBus) {
    this.eventBus = eventBus;
    this.setupEventHandlers();
  }

  // 캠페인 워크플로우 초기화
  async initializeCampaignWorkflow(campaignData) {
    try {
      const { campaignId, businessId, influencerId, type, requirements } = campaignData;

      const workflow = {
        campaignId,
        businessId,
        influencerId,
        type,
        currentState: CampaignState.DRAFT,
        previousStates: [],
        nextPossibleStates: StateTransitions[CampaignState.DRAFT],
        transitions: [],
        approvals: [],
        automationRules: [],
        metadata: {
          requirements,
          createdAt: new Date(),
          lastUpdated: new Date(),
          version: '1.0'
        },
        stateHistory: [{
          state: CampaignState.DRAFT,
          timestamp: new Date(),
          triggeredBy: 'system',
          reason: 'workflow_initialized'
        }]
      };

      this.workflows.set(campaignId, workflow);

      // 기본 승인 프로세스 설정
      await this.setupApprovalProcess(campaignId, type);

      // 이벤트 발행
      this.emit('workflow.initialized', { campaignId, workflow });
      await this.publishEvent('campaign.workflow.initialized', { campaignId, currentState: workflow.currentState });

      console.log(`Campaign workflow initialized: ${campaignId}`);
      return workflow;

    } catch (error) {
      console.error('Failed to initialize campaign workflow:', error);
      throw error;
    }
  }

  // 상태 전이 실행
  async transitionState(campaignId, targetState, options = {}) {
    try {
      const workflow = this.workflows.get(campaignId);
      if (!workflow) {
        throw new Error(`Workflow not found for campaign: ${campaignId}`);
      }

      const { triggeredBy = 'system', reason, skipValidation = false, metadata = {} } = options;

      // 전이 가능성 검증
      if (!skipValidation && !this.canTransitionTo(workflow.currentState, targetState)) {
        throw new Error(`Invalid state transition: ${workflow.currentState} -> ${targetState}`);
      }

      // 승인 요구사항 확인
      if (!skipValidation) {
        const pendingApprovals = await this.checkPendingApprovals(campaignId, targetState);
        if (pendingApprovals.length > 0) {
          throw new Error(`Pending approvals required: ${pendingApprovals.map(a => a.type).join(', ')}`);
        }
      }

      // 상태 전이 실행
      const previousState = workflow.currentState;
      workflow.previousStates.push(previousState);
      workflow.currentState = targetState;
      workflow.nextPossibleStates = StateTransitions[targetState] || [];
      workflow.metadata.lastUpdated = new Date();

      // 전이 히스토리 추가
      const transition = {
        id: this.generateTransitionId(),
        from: previousState,
        to: targetState,
        timestamp: new Date(),
        triggeredBy,
        reason: reason || 'manual_transition',
        metadata
      };

      workflow.transitions.push(transition);
      workflow.stateHistory.push({
        state: targetState,
        timestamp: new Date(),
        triggeredBy,
        reason: reason || 'state_transition'
      });

      // 워크플로우 저장
      await this.saveWorkflow(workflow);

      // 상태별 후처리
      await this.handleStateTransition(workflow, transition);

      // 이벤트 발행
      this.emit('state.transitioned', { campaignId, from: previousState, to: targetState, transition });
      await this.publishEvent('campaign.state.changed', {
        campaignId,
        previousState,
        currentState: targetState,
        transition
      });

      console.log(`State transition completed: ${campaignId} ${previousState} -> ${targetState}`);
      return workflow;

    } catch (error) {
      console.error(`Failed to transition state for campaign ${campaignId}:`, error);
      throw error;
    }
  }

  // 승인 프로세스 생성
  async createApproval(campaignId, approvalData) {
    try {
      const { type, approver, requiredBy, description, metadata = {} } = approvalData;

      const approval = {
        id: this.generateApprovalId(),
        campaignId,
        type,
        approver,
        status: 'pending',
        requiredBy,
        description,
        metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
        approvedAt: null,
        rejectedAt: null,
        comments: []
      };

      this.approvalQueue.set(approval.id, approval);

      // 워크플로우에 승인 추가
      const workflow = this.workflows.get(campaignId);
      if (workflow) {
        workflow.approvals.push(approval.id);
        await this.saveWorkflow(workflow);
      }

      // 승인자에게 알림
      await this.publishEvent('approval.required', {
        approvalId: approval.id,
        campaignId,
        approver,
        type,
        deadline: requiredBy
      });

      console.log(`Approval created: ${approval.id} for campaign ${campaignId}`);
      return approval;

    } catch (error) {
      console.error('Failed to create approval:', error);
      throw error;
    }
  }

  // 승인 처리
  async processApproval(approvalId, decision, approverData) {
    try {
      const approval = this.approvalQueue.get(approvalId);
      if (!approval) {
        throw new Error(`Approval not found: ${approvalId}`);
      }

      const { decision: approvalDecision, comments, metadata = {} } = decision;
      const { approverId, approverName } = approverData;

      // 승인 상태 업데이트
      approval.status = approvalDecision; // 'approved' | 'rejected'
      approval.updatedAt = new Date();
      approval.comments.push({
        timestamp: new Date(),
        approverId,
        approverName,
        comment: comments,
        decision: approvalDecision
      });

      if (approvalDecision === 'approved') {
        approval.approvedAt = new Date();
      } else if (approvalDecision === 'rejected') {
        approval.rejectedAt = new Date();
      }

      approval.metadata = { ...approval.metadata, ...metadata };

      // 승인 완료 후 자동 상태 전이 확인
      const workflow = this.workflows.get(approval.campaignId);
      if (workflow) {
        await this.checkAutomaticStateTransition(approval.campaignId);
      }

      // 이벤트 발행
      this.emit('approval.processed', { approvalId, campaignId: approval.campaignId, decision: approvalDecision });
      await this.publishEvent('approval.completed', {
        approvalId,
        campaignId: approval.campaignId,
        decision: approvalDecision,
        approver: approverId
      });

      console.log(`Approval processed: ${approvalId} - ${approvalDecision}`);
      return approval;

    } catch (error) {
      console.error(`Failed to process approval ${approvalId}:`, error);
      throw error;
    }
  }

  // 자동화 규칙 설정
  setupAutomationRule(ruleData) {
    try {
      const { name, description, trigger, conditions, actions, priority = 0 } = ruleData;

      const rule = {
        id: this.generateRuleId(),
        name,
        description,
        trigger, // 트리거 조건
        conditions, // 실행 조건
        actions, // 실행할 액션
        priority,
        enabled: true,
        createdAt: new Date(),
        lastExecuted: null,
        executionCount: 0
      };

      this.automationRules.set(rule.id, rule);

      console.log(`Automation rule created: ${rule.id} - ${name}`);
      return rule;

    } catch (error) {
      console.error('Failed to setup automation rule:', error);
      throw error;
    }
  }

  // 기본 자동화 규칙 설정
  setupDefaultAutomationRules() {
    // 1. 캠페인 기한 도래 시 자동 상태 전이
    this.setupAutomationRule({
      name: 'Auto Complete Campaign',
      description: '캠페인 종료일 도래 시 자동으로 리뷰 상태로 전환',
      trigger: 'schedule',
      conditions: [
        { field: 'currentState', operator: 'equals', value: CampaignState.ACTIVE },
        { field: 'endDate', operator: 'lte', value: 'now' }
      ],
      actions: [
        { type: 'transition_state', targetState: CampaignState.REVIEW },
        { type: 'send_notification', template: 'campaign_auto_completed' }
      ]
    });

    // 2. 모든 승인 완료 시 자동 진행
    this.setupAutomationRule({
      name: 'Auto Progress After Approvals',
      description: '필요한 모든 승인 완료 시 다음 단계로 자동 진행',
      trigger: 'approval_completed',
      conditions: [
        { field: 'pendingApprovals', operator: 'count', value: 0 }
      ],
      actions: [
        { type: 'transition_state', targetState: 'auto_determine' }
      ]
    });

    // 3. 결제 완료 시 캠페인 활성화
    this.setupAutomationRule({
      name: 'Activate After Payment',
      description: '결제 완료 시 캠페인 자동 활성화',
      trigger: 'payment_completed',
      conditions: [
        { field: 'currentState', operator: 'equals', value: CampaignState.DRAFT }
      ],
      actions: [
        { type: 'transition_state', targetState: CampaignState.ACTIVE },
        { type: 'send_notification', template: 'campaign_activated' }
      ]
    });
  }

  // 자동화 스케줄러 시작
  startAutomationScheduler() {
    // 매분 자동화 규칙 확인
    setInterval(() => {
      this.executeScheduledRules();
    }, 60000); // 1분마다 실행
  }

  // 스케줄된 규칙 실행
  async executeScheduledRules() {
    try {
      const now = new Date();
      
      for (const [campaignId, workflow] of this.workflows) {
        // 시간 기반 자동화 규칙 확인
        for (const [ruleId, rule] of this.automationRules) {
          if (rule.trigger === 'schedule' && rule.enabled) {
            const shouldExecute = await this.evaluateRuleConditions(rule, workflow, now);
            if (shouldExecute) {
              await this.executeAutomationRule(rule, workflow);
            }
          }
        }
      }

    } catch (error) {
      console.error('Error in automation scheduler:', error);
    }
  }

  // 규칙 조건 평가
  async evaluateRuleConditions(rule, workflow, context = {}) {
    try {
      for (const condition of rule.conditions) {
        const { field, operator, value } = condition;
        const fieldValue = this.getFieldValue(workflow, field, context);
        
        const result = this.evaluateCondition(fieldValue, operator, value, context);
        if (!result) {
          return false; // 하나라도 false면 전체 false
        }
      }
      return true;

    } catch (error) {
      console.error('Error evaluating rule conditions:', error);
      return false;
    }
  }

  // 조건 평가
  evaluateCondition(fieldValue, operator, expectedValue, context) {
    switch (operator) {
      case 'equals':
        return fieldValue === expectedValue;
      case 'not_equals':
        return fieldValue !== expectedValue;
      case 'gt':
        return fieldValue > expectedValue;
      case 'gte':
        return fieldValue >= expectedValue;
      case 'lt':
        return fieldValue < expectedValue;
      case 'lte':
        if (expectedValue === 'now') {
          return new Date(fieldValue) <= new Date();
        }
        return fieldValue <= expectedValue;
      case 'contains':
        return Array.isArray(fieldValue) && fieldValue.includes(expectedValue);
      case 'count':
        return Array.isArray(fieldValue) && fieldValue.length === expectedValue;
      default:
        return false;
    }
  }

  // 자동화 규칙 실행
  async executeAutomationRule(rule, workflow) {
    try {
      console.log(`Executing automation rule: ${rule.name} for campaign ${workflow.campaignId}`);

      for (const action of rule.actions) {
        await this.executeAction(action, workflow, rule);
      }

      // 실행 통계 업데이트
      rule.lastExecuted = new Date();
      rule.executionCount++;

      // 이벤트 발행
      await this.publishEvent('automation.rule.executed', {
        ruleId: rule.id,
        ruleName: rule.name,
        campaignId: workflow.campaignId
      });

    } catch (error) {
      console.error(`Failed to execute automation rule ${rule.id}:`, error);
    }
  }

  // 액션 실행
  async executeAction(action, workflow, rule) {
    try {
      switch (action.type) {
        case 'transition_state':
          let targetState = action.targetState;
          if (targetState === 'auto_determine') {
            targetState = this.determineNextState(workflow);
          }
          await this.transitionState(workflow.campaignId, targetState, {
            triggeredBy: 'automation',
            reason: `auto_rule_${rule.id}`,
            skipValidation: action.skipValidation || false
          });
          break;

        case 'send_notification':
          await this.publishEvent('notification.send', {
            campaignId: workflow.campaignId,
            template: action.template,
            recipients: action.recipients || 'auto_determine',
            data: action.data || {}
          });
          break;

        case 'create_approval':
          await this.createApproval(workflow.campaignId, action.approvalData);
          break;

        case 'execute_webhook':
          await this.executeWebhook(action.webhookUrl, action.data, workflow);
          break;

        default:
          console.warn(`Unknown action type: ${action.type}`);
      }

    } catch (error) {
      console.error(`Failed to execute action ${action.type}:`, error);
    }
  }

  // 다음 상태 자동 결정
  determineNextState(workflow) {
    const current = workflow.currentState;
    const possible = workflow.nextPossibleStates;

    // 비즈니스 로직에 따른 자동 결정
    switch (current) {
      case CampaignState.DRAFT:
        return CampaignState.ACTIVE;
      case CampaignState.ACTIVE:
        return CampaignState.REVIEW;
      case CampaignState.REVIEW:
        return CampaignState.COMPLETED;
      case CampaignState.COMPLETED:
        return CampaignState.SETTLED;
      default:
        return possible[0] || current; // 첫 번째 가능한 상태 또는 현재 상태 유지
    }
  }

  // 승인 프로세스 설정
  async setupApprovalProcess(campaignId, campaignType) {
    try {
      const approvals = [];

      // 캠페인 유형별 기본 승인 프로세스
      switch (campaignType) {
        case 'sponsored_post':
          approvals.push(
            { type: ApprovalType.BUSINESS_APPROVAL, description: '비즈니스 캠페인 승인' },
            { type: ApprovalType.INFLUENCER_APPROVAL, description: '인플루언서 참여 승인' },
            { type: ApprovalType.CONTENT_APPROVAL, description: '콘텐츠 검토 승인' }
          );
          break;

        case 'product_review':
          approvals.push(
            { type: ApprovalType.BUSINESS_APPROVAL, description: '제품 리뷰 캠페인 승인' },
            { type: ApprovalType.INFLUENCER_APPROVAL, description: '인플루언서 참여 승인' },
            { type: ApprovalType.CONTENT_APPROVAL, description: '리뷰 콘텐츠 승인' },
            { type: ApprovalType.ADMIN_APPROVAL, description: '관리자 최종 승인' }
          );
          break;

        case 'brand_partnership':
          approvals.push(
            { type: ApprovalType.BUSINESS_APPROVAL, description: '브랜드 파트너십 승인' },
            { type: ApprovalType.INFLUENCER_APPROVAL, description: '인플루언서 파트너십 승인' },
            { type: ApprovalType.PAYMENT_APPROVAL, description: '결제 조건 승인' },
            { type: ApprovalType.ADMIN_APPROVAL, description: '관리자 검토 승인' }
          );
          break;

        default:
          // 기본 승인 프로세스
          approvals.push(
            { type: ApprovalType.BUSINESS_APPROVAL, description: '비즈니스 승인' },
            { type: ApprovalType.INFLUENCER_APPROVAL, description: '인플루언서 승인' }
          );
      }

      // 승인 프로세스 생성
      for (const approvalData of approvals) {
        await this.createApproval(campaignId, {
          ...approvalData,
          approver: 'auto_assign', // 자동 할당
          requiredBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7일 후
        });
      }

      console.log(`Approval process setup completed for campaign ${campaignId}`);

    } catch (error) {
      console.error(`Failed to setup approval process for campaign ${campaignId}:`, error);
      throw error;
    }
  }

  // 유틸리티 메서드들
  canTransitionTo(currentState, targetState) {
    const possibleStates = StateTransitions[currentState] || [];
    return possibleStates.includes(targetState);
  }

  async checkPendingApprovals(campaignId, targetState) {
    const workflow = this.workflows.get(campaignId);
    if (!workflow) return [];

    const pendingApprovals = [];
    for (const approvalId of workflow.approvals) {
      const approval = this.approvalQueue.get(approvalId);
      if (approval && approval.status === 'pending') {
        pendingApprovals.push(approval);
      }
    }

    return pendingApprovals;
  }

  async checkAutomaticStateTransition(campaignId) {
    try {
      const workflow = this.workflows.get(campaignId);
      if (!workflow) return;

      // 보류 중인 승인 확인
      const pendingApprovals = await this.checkPendingApprovals(campaignId);
      
      if (pendingApprovals.length === 0) {
        // 자동화 규칙 트리거
        for (const [ruleId, rule] of this.automationRules) {
          if (rule.trigger === 'approval_completed' && rule.enabled) {
            const shouldExecute = await this.evaluateRuleConditions(rule, workflow);
            if (shouldExecute) {
              await this.executeAutomationRule(rule, workflow);
              break;
            }
          }
        }
      }

    } catch (error) {
      console.error('Error in automatic state transition check:', error);
    }
  }

  getFieldValue(workflow, field, context = {}) {
    switch (field) {
      case 'currentState':
        return workflow.currentState;
      case 'pendingApprovals':
        return workflow.approvals.filter(id => {
          const approval = this.approvalQueue.get(id);
          return approval && approval.status === 'pending';
        });
      case 'endDate':
        return workflow.metadata.endDate;
      default:
        return workflow.metadata[field] || workflow[field];
    }
  }

  async handleStateTransition(workflow, transition) {
    // 상태별 특별 처리
    switch (transition.to) {
      case CampaignState.ACTIVE:
        await this.handleCampaignActivation(workflow);
        break;
      case CampaignState.COMPLETED:
        await this.handleCampaignCompletion(workflow);
        break;
      case CampaignState.SETTLED:
        await this.handleCampaignSettlement(workflow);
        break;
    }
  }

  async handleCampaignActivation(workflow) {
    // 캠페인 활성화 시 처리
    await this.publishEvent('campaign.activated', {
      campaignId: workflow.campaignId,
      businessId: workflow.businessId,
      influencerId: workflow.influencerId
    });
  }

  async handleCampaignCompletion(workflow) {
    // 캠페인 완료 시 처리
    await this.publishEvent('campaign.completed', {
      campaignId: workflow.campaignId,
      businessId: workflow.businessId,
      influencerId: workflow.influencerId
    });
  }

  async handleCampaignSettlement(workflow) {
    // 캠페인 정산 시 처리
    await this.publishEvent('settlement.trigger', {
      campaignId: workflow.campaignId,
      businessId: workflow.businessId,
      influencerId: workflow.influencerId
    });
  }

  // 이벤트 핸들러 설정
  setupEventHandlers() {
    if (!this.eventBus) return;

    // 외부 이벤트 구독
    this.eventBus.subscribe('payment.completed', this.handlePaymentCompleted.bind(this));
    this.eventBus.subscribe('content.submitted', this.handleContentSubmitted.bind(this));
    this.eventBus.subscribe('content.approved', this.handleContentApproved.bind(this));
  }

  async handlePaymentCompleted(event) {
    const { campaignId } = event.data;
    
    // 결제 완료 시 자동화 규칙 트리거
    for (const [ruleId, rule] of this.automationRules) {
      if (rule.trigger === 'payment_completed' && rule.enabled) {
        const workflow = this.workflows.get(campaignId);
        if (workflow) {
          const shouldExecute = await this.evaluateRuleConditions(rule, workflow);
          if (shouldExecute) {
            await this.executeAutomationRule(rule, workflow);
          }
        }
      }
    }
  }

  async handleContentSubmitted(event) {
    const { campaignId } = event.data;
    
    // 콘텐츠 제출 시 리뷰 상태로 전환
    try {
      await this.transitionState(campaignId, CampaignState.REVIEW, {
        triggeredBy: 'content_submission',
        reason: 'content_submitted_for_review'
      });
    } catch (error) {
      console.error('Failed to transition to review state:', error);
    }
  }

  async handleContentApproved(event) {
    const { campaignId } = event.data;
    
    // 콘텐츠 승인 시 완료 상태로 전환
    try {
      await this.transitionState(campaignId, CampaignState.COMPLETED, {
        triggeredBy: 'content_approval',
        reason: 'content_approved_campaign_completed'
      });
    } catch (error) {
      console.error('Failed to transition to completed state:', error);
    }
  }

  // API 메서드들
  async getWorkflow(campaignId) {
    return this.workflows.get(campaignId);
  }

  async getWorkflowHistory(campaignId) {
    const workflow = this.workflows.get(campaignId);
    return workflow ? workflow.stateHistory : [];
  }

  async getApprovalStatus(campaignId) {
    const workflow = this.workflows.get(campaignId);
    if (!workflow) return [];

    const approvals = [];
    for (const approvalId of workflow.approvals) {
      const approval = this.approvalQueue.get(approvalId);
      if (approval) {
        approvals.push(approval);
      }
    }

    return approvals;
  }

  async pauseCampaign(campaignId, reason) {
    return this.transitionState(campaignId, CampaignState.PAUSED, {
      triggeredBy: 'manual',
      reason: `campaign_paused: ${reason}`
    });
  }

  async resumeCampaign(campaignId) {
    return this.transitionState(campaignId, CampaignState.ACTIVE, {
      triggeredBy: 'manual',
      reason: 'campaign_resumed'
    });
  }

  async cancelCampaign(campaignId, reason) {
    return this.transitionState(campaignId, CampaignState.CANCELLED, {
      triggeredBy: 'manual',
      reason: `campaign_cancelled: ${reason}`,
      skipValidation: true // 취소는 언제든 가능
    });
  }

  // 저장 및 로드 메서드
  async saveWorkflow(workflow) {
    // 실제 구현에서는 데이터베이스에 저장
    console.log(`Workflow saved: ${workflow.campaignId}`);
  }

  async loadWorkflow(campaignId) {
    // 실제 구현에서는 데이터베이스에서 로드
    return this.workflows.get(campaignId);
  }

  // 이벤트 발행 헬퍼
  async publishEvent(eventName, data) {
    if (this.eventBus) {
      await this.eventBus.publish(eventName, data);
    }
  }

  // ID 생성기
  generateTransitionId() {
    return `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateApprovalId() {
    return `appr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateRuleId() {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 헬스체크
  async healthCheck() {
    return {
      status: 'healthy',
      activeWorkflows: this.workflows.size,
      pendingApprovals: this.approvalQueue.size,
      automationRules: this.automationRules.size,
      timestamp: new Date()
    };
  }

  // 정리
  async shutdown() {
    console.log('Campaign Workflow Module shutting down...');
    this.removeAllListeners();
  }
}

// 상수 내보내기
CampaignWorkflowModule.CampaignState = CampaignState;
CampaignWorkflowModule.ApprovalType = ApprovalType;
CampaignWorkflowModule.StateTransitions = StateTransitions;

module.exports = CampaignWorkflowModule;