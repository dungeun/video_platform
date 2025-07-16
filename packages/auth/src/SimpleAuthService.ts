/**
 * Simple AuthService for testing
 */

import { EventEmitter } from 'events';

export class SimpleAuthService extends EventEmitter {
  constructor(config: any) {
    super();
    console.log('🔧 SimpleAuthService constructor called with config:', config);
  }

  // 필수 메서드들
  public getCurrentUser(): any {
    return null;
  }

  public getCurrentTokens(): any {
    return null;
  }

  public isAuthenticated(): boolean {
    return false;
  }

  public async login(credentials: any): Promise<any> {
    console.log('🔐 Login called with:', credentials);
    this.emit('user.loggedIn', { user: { id: 1, email: credentials.email } });
    return { success: true, data: { user: { id: 1, email: credentials.email } } };
  }

  public async logout(): Promise<any> {
    console.log('🚪 Logout called');
    this.emit('user.loggedOut', { user: null });
    return { success: true };
  }

  public async register(data: any): Promise<any> {
    console.log('📝 Register called with:', data);
    this.emit('user.registered', { user: { id: 1, email: data.email } });
    return { success: true, data: { user: { id: 1, email: data.email } } };
  }

  public async socialLogin(data: any): Promise<any> {
    console.log('🔗 Social login called with:', data);
    this.emit('social.connected', { user: { id: 1, email: 'social@example.com' } });
    return { success: true, data: { user: { id: 1, email: 'social@example.com' } } };
  }

  public hasPermission(permission: string): boolean {
    return false;
  }

  public hasRole(role: string): boolean {
    return false;
  }

  public async refreshToken(token: string): Promise<any> {
    return null;
  }
}