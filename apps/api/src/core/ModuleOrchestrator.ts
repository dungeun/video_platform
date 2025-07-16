/**
 * Backend Module Orchestrator
 * 백엔드에서 모든 모듈을 관리하고 조정
 */

import { EventEmitter } from 'events';
import { DatabaseManager } from './DatabaseManager';
import { RedisManager } from './RedisManager';
import { Server as SocketIOServer } from 'socket.io';

// Module interfaces
interface ModuleConfig {
  [key: string]: any;
}

interface ModuleDependencies {
  db: DatabaseManager;
  redis: RedisManager;
  io: SocketIOServer;
  eventBus: EventEmitter;
  [key: string]: any;
}

interface ModuleDefinition {
  name: string;
  module: any;
  config: ModuleConfig;
  dependencies: string[];
  instance?: any;
  status: 'registered' | 'initializing' | 'ready' | 'error';
}

export class ModuleOrchestrator extends EventEmitter {
  private modules: Map<string, ModuleDefinition> = new Map();
  private dependencies: ModuleDependencies;
  private initialized: boolean = false;

  constructor(deps: {
    db: DatabaseManager;
    redis: RedisManager;
    io: SocketIOServer;
    env?: any;
  }) {
    super();
    this.dependencies = {
      db: deps.db,
      redis: deps.redis,
      io: deps.io,
      eventBus: this,
      env: deps.env || process.env
    };
  }

  // 모듈 등록
  registerModule(
    name: string, 
    moduleClass: any, 
    config: ModuleConfig = {}, 
    dependencies: string[] = []
  ) {
    if (this.modules.has(name)) {
      throw new Error(`Module ${name} is already registered`);
    }

    this.modules.set(name, {
      name,
      module: moduleClass,
      config,
      dependencies,
      status: 'registered'
    });

    console.log(`📦 Module registered: ${name}`);
    this.emit('module:registered', { name });
  }

  // 모든 모듈 등록
  async registerAllModules() {
    // Core modules
    const { AuthModule } = await import('../modules/auth/auth.module');
    const { CampaignModule } = await import('../modules/campaign/campaign.module');
    const { NotificationModule } = await import('../modules/notification/notification.module');

    // Register modules with dependencies
    this.registerModule('auth', AuthModule, {}, []);
    this.registerModule('campaign', CampaignModule, {}, ['auth']);
    this.registerModule('notification', NotificationModule, {}, ['auth']);
    
    // TODO: Add these modules when implemented
    // this.registerModule('user', UserModule, {}, ['auth']);
    // this.registerModule('payment', PaymentModule, {}, ['user']);

    // Additional modules can be registered here...
    console.log(`✅ Total ${this.modules.size} modules registered`);
  }

  // 의존성 순서 계산 (Topological Sort)
  private calculateInitializationOrder(): string[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: string[] = [];

    const visit = (name: string) => {
      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected: ${name}`);
      }
      if (visited.has(name)) {
        return;
      }

      visiting.add(name);
      
      const module = this.modules.get(name);
      if (!module) {
        throw new Error(`Module not found: ${name}`);
      }

      for (const dep of module.dependencies) {
        if (!this.modules.has(dep)) {
          throw new Error(`Missing dependency: ${dep} for module ${name}`);
        }
        visit(dep);
      }

      visiting.delete(name);
      visited.add(name);
      result.push(name);
    };

    for (const name of this.modules.keys()) {
      visit(name);
    }

    return result;
  }

  // 개별 모듈 초기화
  private async initializeModule(name: string): Promise<any> {
    const moduleData = this.modules.get(name);
    if (!moduleData) {
      throw new Error(`Module not found: ${name}`);
    }

    if (moduleData.instance) {
      return moduleData.instance;
    }

    try {
      moduleData.status = 'initializing';
      console.log(`🔧 Initializing module: ${name}`);

      // Resolve dependencies
      const resolvedDeps: any = {};
      for (const depName of moduleData.dependencies) {
        const depModule = this.modules.get(depName);
        if (!depModule || !depModule.instance) {
          await this.initializeModule(depName);
        }
        resolvedDeps[depName] = this.modules.get(depName)!.instance;
      }

      // Create module instance
      const ModuleClass = moduleData.module;
      moduleData.instance = new ModuleClass({
        ...moduleData.config,
        ...this.dependencies,
        modules: resolvedDeps
      });

      // Initialize module
      if (moduleData.instance.initialize) {
        await moduleData.instance.initialize();
      }

      moduleData.status = 'ready';
      console.log(`✅ Module initialized: ${name}`);
      this.emit('module:initialized', { name, instance: moduleData.instance });

      return moduleData.instance;

    } catch (error) {
      moduleData.status = 'error';
      console.error(`❌ Failed to initialize module ${name}:`, error);
      this.emit('module:error', { name, error });
      throw error;
    }
  }

  // 전체 시스템 초기화
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      console.log('🚀 Initializing Module Orchestrator...');

      // Calculate initialization order
      const initOrder = this.calculateInitializationOrder();
      console.log('📋 Initialization order:', initOrder);

      // Initialize modules in order
      for (const moduleName of initOrder) {
        await this.initializeModule(moduleName);
      }

      this.initialized = true;
      console.log('✅ Module Orchestrator initialized');
      this.emit('orchestrator:ready');

    } catch (error) {
      console.error('❌ Orchestrator initialization failed:', error);
      this.emit('orchestrator:error', error);
      throw error;
    }
  }

  // 모듈 가져오기
  getModule(name: string): any {
    const module = this.modules.get(name);
    if (!module || !module.instance) {
      throw new Error(`Module ${name} is not initialized`);
    }
    return module.instance;
  }

  // 모든 모듈 상태
  getModuleStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    for (const [name, module] of this.modules) {
      status[name] = {
        status: module.status,
        dependencies: module.dependencies,
        hasInstance: !!module.instance
      };
    }

    return status;
  }

  // 헬스체크
  async performHealthCheck(): Promise<any> {
    const health: Record<string, any> = {
      orchestrator: 'healthy',
      modules: {},
      timestamp: new Date()
    };

    for (const [name, module] of this.modules) {
      if (module.instance && module.instance.healthCheck) {
        try {
          health.modules[name] = await module.instance.healthCheck();
        } catch (error) {
          health.modules[name] = {
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      } else {
        health.modules[name] = {
          status: module.status === 'ready' ? 'healthy' : 'unhealthy'
        };
      }
    }

    const allHealthy = Object.values(health.modules).every(
      (m: any) => m.status === 'healthy'
    );

    health.orchestrator = allHealthy ? 'healthy' : 'degraded';
    
    return health;
  }

  // 시스템 종료
  async shutdown() {
    console.log('🛑 Shutting down Module Orchestrator...');

    // Shutdown in reverse order
    const shutdownOrder = this.calculateInitializationOrder().reverse();

    for (const moduleName of shutdownOrder) {
      const module = this.modules.get(moduleName);
      if (module?.instance && module.instance.shutdown) {
        try {
          await module.instance.shutdown();
          console.log(`📦 Module shutdown: ${moduleName}`);
        } catch (error) {
          console.error(`Failed to shutdown module ${moduleName}:`, error);
        }
      }
    }

    this.initialized = false;
    console.log('✅ Module Orchestrator shutdown complete');
  }
}