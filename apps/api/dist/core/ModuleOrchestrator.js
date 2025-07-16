"use strict";
/**
 * Backend Module Orchestrator
 * 백엔드에서 모든 모듈을 관리하고 조정
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleOrchestrator = void 0;
const events_1 = require("events");
class ModuleOrchestrator extends events_1.EventEmitter {
    modules = new Map();
    dependencies;
    initialized = false;
    constructor(deps) {
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
    registerModule(name, moduleClass, config = {}, dependencies = []) {
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
        const { AuthModule } = await Promise.resolve().then(() => __importStar(require('../modules/auth/auth.module')));
        const { CampaignModule } = await Promise.resolve().then(() => __importStar(require('../modules/campaign/campaign.module')));
        const { NotificationModule } = await Promise.resolve().then(() => __importStar(require('../modules/notification/notification.module')));
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
    calculateInitializationOrder() {
        const visited = new Set();
        const visiting = new Set();
        const result = [];
        const visit = (name) => {
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
    async initializeModule(name) {
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
            const resolvedDeps = {};
            for (const depName of moduleData.dependencies) {
                const depModule = this.modules.get(depName);
                if (!depModule || !depModule.instance) {
                    await this.initializeModule(depName);
                }
                resolvedDeps[depName] = this.modules.get(depName).instance;
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
        }
        catch (error) {
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
        }
        catch (error) {
            console.error('❌ Orchestrator initialization failed:', error);
            this.emit('orchestrator:error', error);
            throw error;
        }
    }
    // 모듈 가져오기
    getModule(name) {
        const module = this.modules.get(name);
        if (!module || !module.instance) {
            throw new Error(`Module ${name} is not initialized`);
        }
        return module.instance;
    }
    // 모든 모듈 상태
    getModuleStatus() {
        const status = {};
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
    async performHealthCheck() {
        const health = {
            orchestrator: 'healthy',
            modules: {},
            timestamp: new Date()
        };
        for (const [name, module] of this.modules) {
            if (module.instance && module.instance.healthCheck) {
                try {
                    health.modules[name] = await module.instance.healthCheck();
                }
                catch (error) {
                    health.modules[name] = {
                        status: 'unhealthy',
                        error: error instanceof Error ? error.message : 'Unknown error'
                    };
                }
            }
            else {
                health.modules[name] = {
                    status: module.status === 'ready' ? 'healthy' : 'unhealthy'
                };
            }
        }
        const allHealthy = Object.values(health.modules).every((m) => m.status === 'healthy');
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
                }
                catch (error) {
                    console.error(`Failed to shutdown module ${moduleName}:`, error);
                }
            }
        }
        this.initialized = false;
        console.log('✅ Module Orchestrator shutdown complete');
    }
}
exports.ModuleOrchestrator = ModuleOrchestrator;
