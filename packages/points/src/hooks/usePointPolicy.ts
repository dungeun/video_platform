import { useState, useEffect, useCallback } from 'react';
import { PointPolicy, PointEarnRequest, PointSpendRequest } from '../types';
import { PointPolicyEngine } from '../services';
import { StorageManager } from '@modules/storage';

interface UsePointPolicyReturn {
  activePolicy: PointPolicy | null;
  policies: PointPolicy[];
  loading: boolean;
  error: Error | null;
  
  // 정책 관리
  createPolicy: (policy: Omit<PointPolicy, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PointPolicy>;
  updatePolicy: (id: string, updates: Partial<PointPolicy>) => Promise<PointPolicy>;
  deletePolicy: (id: string) => Promise<void>;
  activatePolicy: (id: string) => Promise<void>;
  
  // 정책 계산
  calculateEarnRate: (request: PointEarnRequest) => number;
  calculateExpiryDate: (earnDate?: Date) => Date;
  getGradeBenefits: (grade: string) => any;
  
  // 검증
  validateEarnRequest: (request: PointEarnRequest) => Promise<any>;
  validateSpendRequest: (request: PointSpendRequest) => Promise<any>;
}

export const usePointPolicy = (): UsePointPolicyReturn => {
  const [storage] = useState(() => new StorageManager());
  const [policyEngine] = useState(() => new PointPolicyEngine(storage));
  
  const [activePolicy, setActivePolicy] = useState<PointPolicy | null>(null);
  const [policies, setPolicies] = useState<PointPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 정책 목록 로드
  const loadPolicies = useCallback(async () => {
    try {
      setLoading(true);
      const allPolicies = await policyEngine.getAllPolicies();
      setPolicies(allPolicies);
      setActivePolicy(policyEngine.getActivePolicy());
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [policyEngine]);

  // 정책 생성
  const createPolicy = useCallback(async (
    policy: Omit<PointPolicy, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PointPolicy> => {
    try {
      const newPolicy = await policyEngine.createPolicy(policy);
      await loadPolicies();
      return newPolicy;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [policyEngine, loadPolicies]);

  // 정책 업데이트
  const updatePolicy = useCallback(async (
    id: string,
    updates: Partial<PointPolicy>
  ): Promise<PointPolicy> => {
    try {
      const updatedPolicy = await policyEngine.updatePolicy(id, updates);
      await loadPolicies();
      return updatedPolicy;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [policyEngine, loadPolicies]);

  // 정책 삭제
  const deletePolicy = useCallback(async (id: string): Promise<void> => {
    try {
      await policyEngine.deletePolicy(id);
      await loadPolicies();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [policyEngine, loadPolicies]);

  // 정책 활성화
  const activatePolicy = useCallback(async (id: string): Promise<void> => {
    try {
      await policyEngine.updatePolicy(id, { isActive: true });
      await loadPolicies();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [policyEngine, loadPolicies]);

  // 적립률 계산
  const calculateEarnRate = useCallback((request: PointEarnRequest): number => {
    return policyEngine.calculateEarnRate(request);
  }, [policyEngine]);

  // 만료일 계산
  const calculateExpiryDate = useCallback((earnDate?: Date): Date => {
    return policyEngine.calculateExpiryDate(earnDate);
  }, [policyEngine]);

  // 등급 혜택 조회
  const getGradeBenefits = useCallback((grade: string): any => {
    return policyEngine.getGradeBenefits(grade);
  }, [policyEngine]);

  // 적립 요청 검증
  const validateEarnRequest = useCallback(async (request: PointEarnRequest): Promise<any> => {
    return await policyEngine.validateEarnRequest(request);
  }, [policyEngine]);

  // 사용 요청 검증
  const validateSpendRequest = useCallback(async (request: PointSpendRequest): Promise<any> => {
    return await policyEngine.validateSpendRequest(request);
  }, [policyEngine]);

  // 초기 로드
  useEffect(() => {
    loadPolicies();
  }, []);

  // 이벤트 리스너
  useEffect(() => {
    const handlePolicyActivated = () => {
      setActivePolicy(policyEngine.getActivePolicy());
    };

    const handlePolicyDeactivated = () => {
      setActivePolicy(null);
    };

    policyEngine.on('policy:activated', handlePolicyActivated);
    policyEngine.on('policy:deactivated', handlePolicyDeactivated);

    return () => {
      policyEngine.off('policy:activated', handlePolicyActivated);
      policyEngine.off('policy:deactivated', handlePolicyDeactivated);
    };
  }, [policyEngine]);

  return {
    activePolicy,
    policies,
    loading,
    error,
    createPolicy,
    updatePolicy,
    deletePolicy,
    activatePolicy,
    calculateEarnRate,
    calculateExpiryDate,
    getGradeBenefits,
    validateEarnRequest,
    validateSpendRequest
  };
};