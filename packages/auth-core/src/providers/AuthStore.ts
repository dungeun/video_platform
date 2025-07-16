/**
 * @repo/auth-core - 인증 상태 저장소
 * Zustand를 사용한 전역 인증 상태 관리
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { AuthStatus, UserProfile, AuthSession } from '../types';

interface AuthState {
  // 상태
  user: UserProfile | null;
  session: AuthSession | null;
  status: AuthStatus;
  error: string | null;
  isLoading: boolean;
  lastActivity: Date | null;

  // 액션
  setUser: (user: UserProfile | null) => void;
  setSession: (session: AuthSession | null) => void;
  setStatus: (status: AuthStatus) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  updateLastActivity: () => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector((set, get) => ({
    // 초기 상태
    user: null,
    session: null,
    status: AuthStatus.LOADING,
    error: null,
    isLoading: false,
    lastActivity: null,

    // 사용자 설정
    setUser: (user) => set({ user }),

    // 세션 설정
    setSession: (session) => set({ session }),

    // 상태 설정
    setStatus: (status) => set({ status }),

    // 에러 설정
    setError: (error) => set({ error }),

    // 로딩 상태 설정
    setLoading: (isLoading) => set({ isLoading }),

    // 마지막 활동 시간 업데이트
    updateLastActivity: () => set({ lastActivity: new Date() }),

    // 인증 정보 초기화
    clearAuth: () => set({
      user: null,
      session: null,
      status: AuthStatus.UNAUTHENTICATED,
      error: null,
      isLoading: false,
      lastActivity: null
    })
  }))
);

// 상태 변경 구독
useAuthStore.subscribe(
  (state) => state.status,
  (status) => {
    console.log('Auth status changed:', status);
  }
);