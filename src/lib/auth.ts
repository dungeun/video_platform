export interface User {
  id: string;
  email: string;
  name: string;
  type: 'user' | 'admin' | 'business' | 'ADMIN' | 'BUSINESS' | 'INFLUENCER';
}

class AuthServiceClass {
  private user: User | null = null;

  login(userType: 'user' | 'admin' | 'business' | 'ADMIN' | 'BUSINESS' | 'INFLUENCER' = 'user', userData?: User) {
    console.log('=== AuthService.login 호출 ===');
    console.log('userType:', userType);
    console.log('userData:', userData);
    
    if (userData) {
      this.user = userData;
      console.log('userData 사용 - this.user:', this.user);
    } else {
      // 대문자와 소문자 모두 처리
      const normalizedType = userType.toLowerCase();
      console.log('normalizedType:', normalizedType);
      
      const emails: Record<string, string> = {
        admin: 'admin@linkpick.com',
        business: 'business@company.com',
        user: 'user@example.com',
        influencer: 'user@example.com'
      };
      const names: Record<string, string> = {
        admin: 'Administrator',
        business: 'Business User',
        user: 'User',
        influencer: 'Influencer'
      };
      
      this.user = {
        id: normalizedType === 'admin' ? 'admin-1' : normalizedType === 'business' ? 'business-1' : 'user-1',
        email: emails[normalizedType] || 'user@example.com',
        name: names[normalizedType] || 'User',
        type: userType
      };
      console.log('생성된 user:', this.user);
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(this.user));
      console.log('localStorage에 저장 완료');
    }
  }

  logout() {
    this.user = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('auth-token'); // 통합 토큰 키
      localStorage.removeItem('auth_token'); // 기존 호환성
    }
  }

  getCurrentUser(): User | null {
    if (!this.user && typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        this.user = JSON.parse(stored);
      }
    }
    return this.user;
  }

  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  }
}

export const AuthService = new AuthServiceClass();