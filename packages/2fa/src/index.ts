/**
 * @company/2fa - Ultra-fine-grained Two-Factor Authentication Module
 * 
 * 완전히 세분화된 2FA 모듈로 다음 기능들을 제공합니다:
 * - TOTP (Time-based One-Time Password) 생성 및 검증
 * - QR 코드 생성
 * - 백업 코드 생성 및 관리
 * - 계정 복구 시스템
 * - 통합 검증 관리
 * - React 컴포넌트 및 훅
 */

// Core Types
export * from './types';

// TOTP Module
export * from './totp';

// Backup Codes Module  
export * from './backup';

// Recovery Module
export * from './recovery';

// Verification Module
export * from './verification';

// React Components
export * from './components';

// React Hooks
export * from './hooks';

// React Providers
export * from './providers';

// Services
export * from './services';

// Utilities
export * from './utils';

// 기본 내보내기 - 가장 자주 사용되는 클래스들
export { TotpGenerator } from './totp/TotpGenerator';
export { QrCodeGenerator } from './totp/QrCodeGenerator';
export { BackupCodeGenerator } from './backup/BackupCodeGenerator';
export { BackupCodeManager } from './backup/BackupCodeManager';
export { RecoveryManager } from './recovery/RecoveryManager';
export { VerificationManager } from './verification/VerificationManager';
export { TwoFactorService } from './services/TwoFactorService';

// React 관련 기본 내보내기
export { TwoFactorProvider, useTwoFactorContext } from './providers/TwoFactorProvider';
export { useTwoFactor } from './hooks/useTwoFactor';
export { TwoFactorSetup } from './components/TwoFactorSetup';
export { TwoFactorVerify } from './components/TwoFactorVerify';
export { BackupCodeDisplay } from './components/BackupCodeDisplay';