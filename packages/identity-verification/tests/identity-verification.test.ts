import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

import {
  VerificationMethod,
  VerificationStatus,
  VerificationErrorCode,
  MobileCarrier
} from '../src/types';
import { useVerification } from '../src/hooks/useVerification';
import { IdentityVerification } from '../src/components/IdentityVerification';
import { ResultValidator } from '../src/services/ResultValidator';
import {
  isValidBirthDate,
  isValidPhoneNumber,
  isAdult,
  formatPhoneNumber,
  maskPhoneNumber,
  maskName
} from '../src/utils';

describe('Identity Verification Module', () => {
  describe('useVerification Hook', () => {
    it('should initialize with idle status', () => {
      const { result } = renderHook(() => useVerification());
      
      expect(result.current.status).toBe(VerificationStatus.IDLE);
      expect(result.current.error).toBeNull();
      expect(result.current.identity).toBeNull();
      expect(result.current.verificationId).toBeNull();
    });

    it('should handle verification start', async () => {
      const { result } = renderHook(() => useVerification({
        passConfig: {
          serviceId: 'test',
          serviceKey: 'test',
          apiEndpoint: 'https://test.com',
          callbackUrl: 'https://test.com/callback'
        }
      }));

      await act(async () => {
        await result.current.startVerification({
          method: VerificationMethod.PASS,
          name: '홍길동',
          birthDate: '19900101',
          phoneNumber: '01012345678',
          gender: 'M'
        });
      });

      expect(result.current.status).not.toBe(VerificationStatus.IDLE);
    });

    it('should reset state', () => {
      const { result } = renderHook(() => useVerification());
      
      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe(VerificationStatus.IDLE);
      expect(result.current.error).toBeNull();
    });
  });

  describe('IdentityVerification Component', () => {
    it('should render method selector initially', () => {
      render(
        <IdentityVerification
          availableMethods={[VerificationMethod.PASS, VerificationMethod.MOBILE_CARRIER]}
        />
      );

      expect(screen.getByText('본인인증')).toBeInTheDocument();
      expect(screen.getByText('PASS 인증')).toBeInTheDocument();
      expect(screen.getByText('휴대폰 인증')).toBeInTheDocument();
    });

    it('should show form after method selection', () => {
      render(
        <IdentityVerification
          availableMethods={[VerificationMethod.PASS]}
        />
      );

      fireEvent.click(screen.getByText('PASS 인증'));

      expect(screen.getByLabelText(/이름/)).toBeInTheDocument();
      expect(screen.getByLabelText(/생년월일/)).toBeInTheDocument();
      expect(screen.getByLabelText(/휴대폰 번호/)).toBeInTheDocument();
    });

    it('should validate form inputs', async () => {
      render(
        <IdentityVerification
          availableMethods={[VerificationMethod.PASS]}
        />
      );

      fireEvent.click(screen.getByText('PASS 인증'));
      
      const submitButton = screen.getByText('인증하기');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/이름을 2자 이상 입력해주세요/)).toBeInTheDocument();
      });
    });
  });

  describe('ResultValidator', () => {
    const validator = new ResultValidator();

    it('should validate valid CI', () => {
      const validCI = 'A'.repeat(88); // 88자리 Base64
      expect(validator['validateCI'](validCI)).toBe(true);
    });

    it('should reject invalid CI', () => {
      expect(validator['validateCI']('short')).toBe(false);
      expect(validator['validateCI']('A'.repeat(87))).toBe(false);
      expect(validator['validateCI']('A'.repeat(89))).toBe(false);
    });

    it('should validate valid DI', () => {
      const validDI = 'B'.repeat(64); // 64자리 Base64
      expect(validator['validateDI'](validDI)).toBe(true);
    });

    it('should calculate adult status correctly', () => {
      const twentyYearsAgo = new Date();
      twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
      const birthDate = twentyYearsAgo.toISOString().slice(0, 10).replace(/-/g, '');
      
      expect(validator['calculateAdult'](birthDate)).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    describe('Validators', () => {
      it('should validate birth dates correctly', () => {
        expect(isValidBirthDate('19900101')).toBe(true);
        expect(isValidBirthDate('20241231')).toBe(true);
        expect(isValidBirthDate('19001231')).toBe(true);
        
        expect(isValidBirthDate('990101')).toBe(false);
        expect(isValidBirthDate('19900001')).toBe(false);
        expect(isValidBirthDate('19901301')).toBe(false);
        expect(isValidBirthDate('20991231')).toBe(false);
      });

      it('should validate phone numbers correctly', () => {
        expect(isValidPhoneNumber('01012345678')).toBe(true);
        expect(isValidPhoneNumber('010-1234-5678')).toBe(true);
        expect(isValidPhoneNumber('0101234567')).toBe(true);
        
        expect(isValidPhoneNumber('02012345678')).toBe(false);
        expect(isValidPhoneNumber('010123456')).toBe(false);
        expect(isValidPhoneNumber('01012345678901')).toBe(false);
      });

      it('should check adult status correctly', () => {
        const twentyYearsAgo = new Date();
        twentyYearsAgo.setFullYear(twentyYearsAgo.getFullYear() - 20);
        const adultBirthDate = twentyYearsAgo.toISOString().slice(0, 10).replace(/-/g, '');
        
        const tenYearsAgo = new Date();
        tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
        const minorBirthDate = tenYearsAgo.toISOString().slice(0, 10).replace(/-/g, '');
        
        expect(isAdult(adultBirthDate)).toBe(true);
        expect(isAdult(minorBirthDate)).toBe(false);
      });
    });

    describe('Formatters', () => {
      it('should format phone numbers correctly', () => {
        expect(formatPhoneNumber('01012345678')).toBe('010-1234-5678');
        expect(formatPhoneNumber('0101234567')).toBe('010-123-4567');
        expect(formatPhoneNumber('010-1234-5678')).toBe('010-1234-5678');
      });

      it('should mask phone numbers correctly', () => {
        expect(maskPhoneNumber('01012345678')).toBe('010-****-5678');
        expect(maskPhoneNumber('0101234567')).toBe('010-****-4567');
      });

      it('should mask names correctly', () => {
        expect(maskName('홍길동')).toBe('홍*동');
        expect(maskName('김철수')).toBe('김*수');
        expect(maskName('남궁민수')).toBe('남**수');
        expect(maskName('독고')).toBe('독*');
      });
    });
  });
});