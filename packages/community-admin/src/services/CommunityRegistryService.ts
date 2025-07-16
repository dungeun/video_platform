import { StorageManager } from '@kcommerce/storage';
import { Logger } from '@kcommerce/utils';
import type { 
  CommunityAdminConfig, 
  ServiceResponse,
  UserRole,
  Permission,
  EscalationRule
} from '../types';

export class CommunityRegistryService {
  private storage: StorageManager;
  private logger: Logger;
  private config: CommunityAdminConfig | null = null;

  constructor() {
    this.storage = new StorageManager('community-admin');
    this.logger = new Logger('CommunityRegistry');
  }

  async initialize(config: CommunityAdminConfig): Promise<ServiceResponse> {
    try {
      await this.validateConfig(config);
      this.config = config;
      await this.storage.set('config', config);
      
      // Initialize default roles and permissions
      await this.initializeDefaultRoles();
      await this.initializeDefaultPermissions();
      
      this.logger.info('Community registry initialized successfully');
      return { success: true, message: 'Community registry initialized' };
    } catch (error) {
      this.logger.error('Failed to initialize community registry:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getConfig(): Promise<CommunityAdminConfig | null> {
    if (this.config) return this.config;
    
    try {
      this.config = await this.storage.get('config');
      return this.config;
    } catch (error) {
      this.logger.error('Failed to get config:', error);
      return null;
    }
  }

  async updateConfig(updates: Partial<CommunityAdminConfig>): Promise<ServiceResponse> {
    try {
      const currentConfig = await this.getConfig();
      if (!currentConfig) {
        return { success: false, error: 'No configuration found' };
      }

      const newConfig = { ...currentConfig, ...updates };
      await this.validateConfig(newConfig);
      
      this.config = newConfig;
      await this.storage.set('config', newConfig);
      
      this.logger.info('Configuration updated successfully');
      return { success: true, message: 'Configuration updated' };
    } catch (error) {
      this.logger.error('Failed to update config:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async registerModule(moduleId: string, moduleConfig: any): Promise<ServiceResponse> {
    try {
      const modules = await this.storage.get('modules') || {};
      modules[moduleId] = {
        ...moduleConfig,
        registeredAt: new Date(),
        isActive: true
      };
      
      await this.storage.set('modules', modules);
      this.logger.info(`Module ${moduleId} registered successfully`);
      
      return { success: true, message: `Module ${moduleId} registered` };
    } catch (error) {
      this.logger.error(`Failed to register module ${moduleId}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async unregisterModule(moduleId: string): Promise<ServiceResponse> {
    try {
      const modules = await this.storage.get('modules') || {};
      if (modules[moduleId]) {
        modules[moduleId].isActive = false;
        modules[moduleId].unregisteredAt = new Date();
        await this.storage.set('modules', modules);
        
        this.logger.info(`Module ${moduleId} unregistered successfully`);
        return { success: true, message: `Module ${moduleId} unregistered` };
      }
      
      return { success: false, error: `Module ${moduleId} not found` };
    } catch (error) {
      this.logger.error(`Failed to unregister module ${moduleId}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getActiveModules(): Promise<ServiceResponse<Record<string, any>>> {
    try {
      const modules = await this.storage.get('modules') || {};
      const activeModules = Object.entries(modules)
        .filter(([_, module]: [string, any]) => module.isActive)
        .reduce((acc, [id, module]) => ({ ...acc, [id]: module }), {});
      
      return { success: true, data: activeModules };
    } catch (error) {
      this.logger.error('Failed to get active modules:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async createRole(role: Omit<UserRole, 'id'>): Promise<ServiceResponse<UserRole>> {
    try {
      const roles = await this.storage.get('roles') || {};
      const newRole: UserRole = {
        ...role,
        id: this.generateId()
      };
      
      roles[newRole.id] = newRole;
      await this.storage.set('roles', roles);
      
      this.logger.info(`Role ${newRole.name} created successfully`);
      return { success: true, data: newRole };
    } catch (error) {
      this.logger.error('Failed to create role:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateRole(roleId: string, updates: Partial<UserRole>): Promise<ServiceResponse<UserRole>> {
    try {
      const roles = await this.storage.get('roles') || {};
      const role = roles[roleId];
      
      if (!role) {
        return { success: false, error: 'Role not found' };
      }
      
      const updatedRole = { ...role, ...updates };
      roles[roleId] = updatedRole;
      await this.storage.set('roles', roles);
      
      this.logger.info(`Role ${roleId} updated successfully`);
      return { success: true, data: updatedRole };
    } catch (error) {
      this.logger.error('Failed to update role:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async deleteRole(roleId: string): Promise<ServiceResponse> {
    try {
      const roles = await this.storage.get('roles') || {};
      
      if (!roles[roleId]) {
        return { success: false, error: 'Role not found' };
      }
      
      delete roles[roleId];
      await this.storage.set('roles', roles);
      
      this.logger.info(`Role ${roleId} deleted successfully`);
      return { success: true, message: 'Role deleted' };
    } catch (error) {
      this.logger.error('Failed to delete role:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getRoles(): Promise<ServiceResponse<UserRole[]>> {
    try {
      const roles = await this.storage.get('roles') || {};
      const rolesList = Object.values(roles) as UserRole[];
      
      return { success: true, data: rolesList };
    } catch (error) {
      this.logger.error('Failed to get roles:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async createPermission(permission: Omit<Permission, 'id'>): Promise<ServiceResponse<Permission>> {
    try {
      const permissions = await this.storage.get('permissions') || {};
      const newPermission: Permission = {
        ...permission,
        id: this.generateId()
      };
      
      permissions[newPermission.id] = newPermission;
      await this.storage.set('permissions', permissions);
      
      this.logger.info(`Permission ${newPermission.name} created successfully`);
      return { success: true, data: newPermission };
    } catch (error) {
      this.logger.error('Failed to create permission:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getPermissions(): Promise<ServiceResponse<Permission[]>> {
    try {
      const permissions = await this.storage.get('permissions') || {};
      const permissionsList = Object.values(permissions) as Permission[];
      
      return { success: true, data: permissionsList };
    } catch (error) {
      this.logger.error('Failed to get permissions:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async createEscalationRule(rule: Omit<EscalationRule, 'id'>): Promise<ServiceResponse<EscalationRule>> {
    try {
      const rules = await this.storage.get('escalation_rules') || {};
      const newRule: EscalationRule = {
        ...rule,
        id: this.generateId()
      };
      
      rules[newRule.id] = newRule;
      await this.storage.set('escalation_rules', rules);
      
      this.logger.info(`Escalation rule ${newRule.name} created successfully`);
      return { success: true, data: newRule };
    } catch (error) {
      this.logger.error('Failed to create escalation rule:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getEscalationRules(): Promise<ServiceResponse<EscalationRule[]>> {
    try {
      const rules = await this.storage.get('escalation_rules') || {};
      const rulesList = Object.values(rules) as EscalationRule[];
      
      return { success: true, data: rulesList };
    } catch (error) {
      this.logger.error('Failed to get escalation rules:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async validateConfig(config: CommunityAdminConfig): Promise<void> {
    if (!config.features) {
      throw new Error('Features configuration is required');
    }
    
    if (!config.limits) {
      throw new Error('Limits configuration is required');
    }
    
    if (config.limits.maxFileSize <= 0) {
      throw new Error('Max file size must be greater than 0');
    }
    
    if (config.limits.maxPostLength <= 0) {
      throw new Error('Max post length must be greater than 0');
    }
  }

  private async initializeDefaultRoles(): Promise<void> {
    const defaultRoles: Omit<UserRole, 'id'>[] = [
      {
        name: 'Community Admin',
        permissions: [],
        level: 100,
        color: '#dc2626',
        badge: 'admin'
      },
      {
        name: 'Moderator',
        permissions: [],
        level: 80,
        color: '#059669',
        badge: 'moderator'
      },
      {
        name: 'Trusted Member',
        permissions: [],
        level: 60,
        color: '#7c3aed',
        badge: 'trusted'
      },
      {
        name: 'Member',
        permissions: [],
        level: 20,
        color: '#0ea5e9',
        badge: 'member'
      },
      {
        name: 'New Member',
        permissions: [],
        level: 10,
        color: '#6b7280',
        badge: 'new'
      }
    ];

    for (const role of defaultRoles) {
      await this.createRole(role);
    }
  }

  private async initializeDefaultPermissions(): Promise<void> {
    const defaultPermissions: Omit<Permission, 'id'>[] = [
      // Content permissions
      { name: 'Create Posts', resource: 'posts', action: 'create', description: 'Create new posts' },
      { name: 'Edit Posts', resource: 'posts', action: 'edit', description: 'Edit own posts' },
      { name: 'Delete Posts', resource: 'posts', action: 'delete', description: 'Delete own posts' },
      { name: 'Moderate Posts', resource: 'posts', action: 'moderate', description: 'Moderate all posts' },
      
      // Comment permissions
      { name: 'Create Comments', resource: 'comments', action: 'create', description: 'Create comments' },
      { name: 'Edit Comments', resource: 'comments', action: 'edit', description: 'Edit own comments' },
      { name: 'Delete Comments', resource: 'comments', action: 'delete', description: 'Delete own comments' },
      { name: 'Moderate Comments', resource: 'comments', action: 'moderate', description: 'Moderate all comments' },
      
      // User permissions
      { name: 'View Users', resource: 'users', action: 'view', description: 'View user profiles' },
      { name: 'Edit Users', resource: 'users', action: 'edit', description: 'Edit user accounts' },
      { name: 'Ban Users', resource: 'users', action: 'ban', description: 'Ban users' },
      { name: 'Assign Roles', resource: 'users', action: 'assign_roles', description: 'Assign roles to users' },
      
      // Reporting permissions
      { name: 'Create Reports', resource: 'reports', action: 'create', description: 'Create reports' },
      { name: 'Handle Reports', resource: 'reports', action: 'handle', description: 'Handle user reports' },
      
      // Admin permissions
      { name: 'Access Analytics', resource: 'analytics', action: 'view', description: 'View community analytics' },
      { name: 'Manage Settings', resource: 'settings', action: 'manage', description: 'Manage community settings' }
    ];

    for (const permission of defaultPermissions) {
      await this.createPermission(permission);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}