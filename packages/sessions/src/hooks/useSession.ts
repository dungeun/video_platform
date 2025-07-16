import { useState, useEffect, useCallback, useContext } from 'react';
import type { UseSessionReturn, SessionData, SessionValidationResult } from '../types';
import { SessionContext } from '../providers/SessionProvider';

export function useSession(): UseSessionReturn {
  const context = useContext(SessionContext);
  
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }

  return context;
}