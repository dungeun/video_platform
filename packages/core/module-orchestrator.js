/**
 * Revu Platform Module Orchestrator
 * Coordinates all modules and manages their lifecycle
 */

const RevuEventBus = require('./event-bus');
const RevuAuthModule = require('../auth/revu-auth');
const RevuUserManagement = require('../user/revu-user-management');
const RevuPaymentGateway = require('../payment/revu-payment-gateway');

class ModuleOrchestrator {
  constructor(config) {
    this.config = config;
    this.modules = new Map();
    this.dependencies = new Map();
    this.initialized = false;
    
    // 이벤트 버스 초기화
    this.eventBus = new RevuEventBus(config.eventBus);
  }

  // 모듈 등록
  registerModule(name, moduleClass, config, dependencies = []) {
    this.modules.set(name, {
      class: moduleClass,
      config,
      dependencies,
      instance: null,
      status: 'registered'
    });

    this.dependencies.set(name, dependencies);
    console.log(`Module registered: ${name}`);
  }

  // 모든 기본 모듈 등록
  registerCoreModules() {
    // 인증 모듈 (의존성 없음)
    this.registerModule('auth', RevuAuthModule, this.config.auth, []);
    
    // 사용자 관리 모듈 (인증 모듈 의존)
    this.registerModule('userManagement', RevuUserManagement, this.config.userManagement, ['auth']);
    
    // 결제 모듈 (사용자 관리 모듈 의존)
    this.registerModule('payment', RevuPaymentGateway, this.config.payment, ['userManagement']);
    
    console.log('Core modules registered');
  }

  // 의존성 순서 계산
  calculateInitializationOrder() {
    const visited = new Set();
    const visiting = new Set();
    const order = [];

    const visit = (moduleName) => {
      if (visiting.has(moduleName)) {
        throw new Error(`Circular dependency detected: ${moduleName}`);
      }
      
      if (visited.has(moduleName)) {
        return;
      }

      visiting.add(moduleName);
      
      const dependencies = this.dependencies.get(moduleName) || [];
      for (const dep of dependencies) {
        if (!this.modules.has(dep)) {
          throw new Error(`Dependency not found: ${dep} for module ${moduleName}`);
        }
        visit(dep);
      }
      
      visiting.delete(moduleName);
      visited.add(moduleName);
      order.push(moduleName);
    };

    for (const moduleName of this.modules.keys()) {
      visit(moduleName);
    }

    return order;
  }

  // 전체 시스템 초기화
  async initialize() {
    try {
      console.log('Starting Revu Platform initialization...');
      
      // 기본 모듈 등록
      this.registerCoreModules();
      
      // 초기화 순서 계산
      const initOrder = this.calculateInitializationOrder();
      console.log('Initialization order:', initOrder);

      // 순서대로 모듈 초기화
      for (const moduleName of initOrder) {
        await this.initializeModule(moduleName);
      }

      // 이벤트 버스와 모듈 연결
      this.connectModulesToEventBus();
      
      // 헬스체크 시작
      this.startHealthCheck();

      this.initialized = true;
      console.log('Revu Platform initialization completed');
      
      // 초기화 완료 이벤트 발행
      await this.eventBus.publish('platform.initialized', {
        modules: Array.from(this.modules.keys()),
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Platform initialization failed:', error);
      throw error;
    }
  }

  // 개별 모듈 초기화
  async initializeModule(moduleName) {
    try {
      const moduleInfo = this.modules.get(moduleName);
      if (!moduleInfo) {
        throw new Error(`Module not found: ${moduleName}`);
      }

      if (moduleInfo.instance) {
        console.log(`Module ${moduleName} already initialized`);
        return moduleInfo.instance;
      }

      console.log(`Initializing module: ${moduleName}`);
      moduleInfo.status = 'initializing';

      // 의존성 주입
      const dependencies = await this.resolveDependencies(moduleName);
      const config = {
        ...moduleInfo.config,
        eventBus: this.eventBus,
        dependencies
      };

      // 모듈 인스턴스 생성
      moduleInfo.instance = new moduleInfo.class(config);
      
      // 모듈별 초기화 로직 실행
      if (typeof moduleInfo.instance.initialize === 'function') {
        await moduleInfo.instance.initialize();
      }

      moduleInfo.status = 'initialized';
      console.log(`Module ${moduleName} initialized successfully`);

      return moduleInfo.instance;
    } catch (error) {
      const moduleInfo = this.modules.get(moduleName);
      if (moduleInfo) {
        moduleInfo.status = 'failed';
      }
      console.error(`Failed to initialize module ${moduleName}:`, error);
      throw error;
    }
  }

  // 의존성 해결
  async resolveDependencies(moduleName) {
    const dependencies = {};
    const deps = this.dependencies.get(moduleName) || [];
    
    for (const depName of deps) {
      const depModule = this.modules.get(depName);
      if (!depModule || !depModule.instance) {
        throw new Error(`Dependency ${depName} not initialized for module ${moduleName}`);
      }
      dependencies[depName] = depModule.instance;
    }
    
    return dependencies;
  }

  // 모듈과 이벤트 버스 연결
  connectModulesToEventBus() {
    for (const [moduleName, moduleInfo] of this.modules) {
      if (moduleInfo.instance && typeof moduleInfo.instance.connectEventBus === 'function') {
        moduleInfo.instance.connectEventBus(this.eventBus);
      }
    }
    console.log('Modules connected to event bus');
  }

  // 모듈 인스턴스 가져오기
  getModule(name) {
    const moduleInfo = this.modules.get(name);
    if (!moduleInfo || !moduleInfo.instance) {
      throw new Error(`Module ${name} not found or not initialized`);
    }
    return moduleInfo.instance;
  }

  // 모든 모듈 상태 확인
  getModuleStatus() {
    const status = {};
    for (const [name, moduleInfo] of this.modules) {
      status[name] = {
        status: moduleInfo.status,
        hasInstance: !!moduleInfo.instance,
        dependencies: this.dependencies.get(name) || []
      };
    }
    return status;
  }

  // 헬스체크 시작
  startHealthCheck() {
    setInterval(async () => {
      await this.performHealthCheck();
    }, 30000); // 30초마다 헬스체크
  }

  // 헬스체크 수행
  async performHealthCheck() {
    const healthStatus = {
      platform: 'healthy',
      modules: {},
      timestamp: new Date()
    };

    let allHealthy = true;

    for (const [moduleName, moduleInfo] of this.modules) {
      try {
        if (moduleInfo.instance && typeof moduleInfo.instance.healthCheck === 'function') {
          const moduleHealth = await moduleInfo.instance.healthCheck();
          healthStatus.modules[moduleName] = moduleHealth;
          
          if (moduleHealth.status !== 'healthy') {
            allHealthy = false;
          }
        } else {
          healthStatus.modules[moduleName] = {
            status: moduleInfo.status === 'initialized' ? 'healthy' : 'unhealthy',
            message: 'No health check available'
          };
        }
      } catch (error) {
        healthStatus.modules[moduleName] = {
          status: 'unhealthy',
          error: error.message
        };
        allHealthy = false;
      }
    }

    healthStatus.platform = allHealthy ? 'healthy' : 'degraded';

    // 이벤트 버스 상태 확인
    try {
      const eventBusStats = this.eventBus.getEventStats();
      healthStatus.eventBus = {
        status: 'healthy',
        stats: eventBusStats
      };
    } catch (error) {
      healthStatus.eventBus = {
        status: 'unhealthy',
        error: error.message
      };
      allHealthy = false;
    }

    // 헬스체크 결과 이벤트 발행
    await this.eventBus.publish('platform.healthCheck', healthStatus, { localOnly: true });

    return healthStatus;
  }

  // 특정 모듈 재시작
  async restartModule(moduleName) {
    try {
      console.log(`Restarting module: ${moduleName}`);
      
      const moduleInfo = this.modules.get(moduleName);
      if (!moduleInfo) {
        throw new Error(`Module not found: ${moduleName}`);
      }

      // 모듈 정리
      if (moduleInfo.instance && typeof moduleInfo.instance.shutdown === 'function') {
        await moduleInfo.instance.shutdown();
      }

      // 인스턴스 제거
      moduleInfo.instance = null;
      moduleInfo.status = 'registered';

      // 재초기화
      await this.initializeModule(moduleName);

      console.log(`Module ${moduleName} restarted successfully`);
      
      await this.eventBus.publish('module.restarted', { moduleName });
      
    } catch (error) {
      console.error(`Failed to restart module ${moduleName}:`, error);
      throw error;
    }
  }

  // 비즈니스 로직 헬퍼 메서드들
  async createBusinessWorkflow() {
    return {
      auth: this.getModule('auth'),
      userManagement: this.getModule('userManagement'),
      payment: this.getModule('payment'),
      eventBus: this.eventBus
    };
  }

  async createInfluencerWorkflow() {
    return {
      auth: this.getModule('auth'),
      userManagement: this.getModule('userManagement'),
      eventBus: this.eventBus
    };
  }

  // 통합 API 제공
  async registerUser(userData) {
    const auth = this.getModule('auth');
    const userMgmt = this.getModule('userManagement');
    
    // 사용자 등록
    const authResult = await auth.register(userData);
    
    // 프로필 생성
    let profile;
    if (userData.type === 'business') {
      profile = await userMgmt.createBusinessProfile(userData.profile);
    } else {
      profile = await userMgmt.createInfluencerProfile(userData.profile);
    }
    
    return {
      auth: authResult,
      profile
    };
  }

  async processCampaign(campaignData) {
    // 캠페인 생성부터 완료까지의 전체 워크플로우
    await this.eventBus.publish('campaign.workflow.start', campaignData);
  }

  // 플랫폼 종료
  async shutdown() {
    try {
      console.log('Shutting down Revu Platform...');
      
      // 모든 모듈 종료 (의존성 역순)
      const shutdownOrder = this.calculateInitializationOrder().reverse();
      
      for (const moduleName of shutdownOrder) {
        const moduleInfo = this.modules.get(moduleName);
        if (moduleInfo.instance && typeof moduleInfo.instance.shutdown === 'function') {
          await moduleInfo.instance.shutdown();
          console.log(`Module ${moduleName} shut down`);
        }
      }

      // 이벤트 버스 종료
      await this.eventBus.shutdown();
      
      console.log('Revu Platform shutdown completed');
    } catch (error) {
      console.error('Platform shutdown error:', error);
      throw error;
    }
  }

  // 개발 모드 헬퍼
  async getSystemOverview() {
    return {
      initialized: this.initialized,
      modules: this.getModuleStatus(),
      eventBusStats: this.eventBus.getEventStats(),
      health: await this.performHealthCheck()
    };
  }
}

module.exports = ModuleOrchestrator;