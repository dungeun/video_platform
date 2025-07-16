import { useState, useEffect, useCallback } from 'react';
import type { SessionValidationResult } from '../types';
import { useSession } from './useSession';

export function useSessionValidation(checkInterval = 30000) {
  const { currentSession, validateSession } = useSession();
  const [validationResult, setValidationResult] = useState<SessionValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const performValidation = useCallback(async () => {
    if (!currentSession) {
      setValidationResult({
        isValid: false,
        reason: 'not_found'
      });
      return;
    }

    setIsValidating(true);
    
    try {
      const result = await validateSession();
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        isValid: false,
        reason: 'not_found'
      });
    } finally {
      setIsValidating(false);
    }
  }, [currentSession, validateSession]);

  useEffect(() => {
    performValidation();
  }, [performValidation]);

  useEffect(() => {
    if (!currentSession || checkInterval <= 0) {
      return;
    }

    const interval = setInterval(performValidation, checkInterval);
    
    return () => clearInterval(interval);
  }, [currentSession, checkInterval, performValidation]);

  return {
    validationResult,
    isValidating,
    revalidate: performValidation
  };
}