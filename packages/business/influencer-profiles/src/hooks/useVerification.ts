import { useState, useCallback, useEffect } from 'react';
import { useNotification } from '@revu/ui-kit';
import { VerificationService } from '../services/verificationService';
import type {
  VerificationStatus,
  VerificationLevel,
  DocumentType,
  VerificationDocument
} from '../types';
import type {
  VerificationRequest,
  VerificationResult,
  VerificationRequirements
} from '../services/verificationService';

const verificationService = new VerificationService();

export function useVerification(profileId: string) {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { showNotification } = useNotification();

  const fetchVerificationStatus = useCallback(async () => {
    if (!profileId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await verificationService.getVerificationStatus(profileId);
      setStatus(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  const submitVerification = useCallback(async (
    documents: VerificationDocument[],
    additionalInfo?: Record<string, any>
  ): Promise<VerificationResult> => {
    setLoading(true);
    try {
      const result = await verificationService.submitVerification({
        profileId,
        documents,
        additionalInfo
      });
      
      showNotification({
        type: 'success',
        message: 'Verification submitted successfully'
      });
      
      // Refresh status
      await fetchVerificationStatus();
      
      return result;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to submit verification'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [profileId, fetchVerificationStatus, showNotification]);

  const uploadDocument = useCallback(async (
    documentType: DocumentType,
    file: File
  ): Promise<VerificationDocument> => {
    setLoading(true);
    try {
      const document = await verificationService.uploadDocument(
        profileId,
        documentType,
        file
      );
      
      showNotification({
        type: 'success',
        message: 'Document uploaded successfully'
      });
      
      return document;
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to upload document'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [profileId, showNotification]);

  const requestManualReview = useCallback(async (reason: string) => {
    setLoading(true);
    try {
      await verificationService.requestManualReview(profileId, reason);
      showNotification({
        type: 'success',
        message: 'Manual review requested'
      });
    } catch (err) {
      showNotification({
        type: 'error',
        message: 'Failed to request manual review'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [profileId, showNotification]);

  useEffect(() => {
    fetchVerificationStatus();
  }, [fetchVerificationStatus]);

  return {
    status,
    loading,
    error,
    submitVerification,
    uploadDocument,
    requestManualReview,
    refetch: fetchVerificationStatus
  };
}

export function useVerificationRequirements(targetLevel: VerificationLevel) {
  const [requirements, setRequirements] = useState<VerificationRequirements | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequirements = async () => {
      setLoading(true);
      try {
        const data = await verificationService.getVerificationRequirements(targetLevel);
        setRequirements(data);
      } catch (err) {
        console.error('Failed to fetch verification requirements:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequirements();
  }, [targetLevel]);

  return { requirements, loading };
}

export function useVerificationHistory(profileId: string) {
  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!profileId) return;
      
      setLoading(true);
      try {
        const data = await verificationService.getVerificationHistory(profileId);
        setHistory(data);
      } catch (err) {
        console.error('Failed to fetch verification history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [profileId]);

  return { history, loading };
}