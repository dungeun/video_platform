/**
 * React hook for shipment tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { TrackingService } from '../tracking/tracker/TrackingService';
import { 
  TrackingRequest, 
  TrackingInfo, 
  ApiError,
  CarrierCode 
} from '../types';

export interface UseTrackingOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  onStatusChange?: (trackingInfo: TrackingInfo) => void;
  onError?: (error: ApiError) => void;
}

export interface UseTrackingResult {
  data: TrackingInfo | null;
  loading: boolean;
  error: ApiError | null;
  track: (carrier: CarrierCode, trackingNumber: string) => Promise<void>;
  refresh: () => Promise<void>;
  clear: () => void;
}

export function useTracking(
  trackingService: TrackingService,
  options: UseTrackingOptions = {}
): UseTrackingResult {
  const [data, setData] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [request, setRequest] = useState<TrackingRequest | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const previousStatusRef = useRef<string>();

  /**
   * Track shipment
   */
  const track = useCallback(async (carrier: CarrierCode, trackingNumber: string) => {
    setLoading(true);
    setError(null);
    
    const trackingRequest: TrackingRequest = { carrier, trackingNumber };
    setRequest(trackingRequest);

    try {
      const response = await trackingService.track(trackingRequest);
      
      if (response.success && response.data) {
        setData(response.data);
        
        // Check for status change
        if (previousStatusRef.current && 
            previousStatusRef.current !== response.data.status &&
            options.onStatusChange) {
          options.onStatusChange(response.data);
        }
        
        previousStatusRef.current = response.data.status;
      } else if (response.error) {
        setError(response.error);
        if (options.onError) {
          options.onError(response.error);
        }
      }
    } catch (err: any) {
      const apiError: ApiError = {
        code: 'TRACKING_ERROR',
        message: err.message || 'Failed to track shipment',
        retryable: true
      };
      setError(apiError);
      if (options.onError) {
        options.onError(apiError);
      }
    } finally {
      setLoading(false);
    }
  }, [trackingService, options]);

  /**
   * Refresh tracking
   */
  const refresh = useCallback(async () => {
    if (request) {
      await track(request.carrier, request.trackingNumber);
    }
  }, [request, track]);

  /**
   * Clear tracking data
   */
  const clear = useCallback(() => {
    setData(null);
    setError(null);
    setRequest(null);
    previousStatusRef.current = undefined;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  /**
   * Set up auto-refresh
   */
  useEffect(() => {
    if (options.autoRefresh && request && !loading && !error) {
      const interval = options.refreshInterval || 60000; // Default 1 minute
      
      intervalRef.current = setInterval(() => {
        refresh();
      }, interval);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [options.autoRefresh, options.refreshInterval, request, loading, error, refresh]);

  /**
   * Clean up on unmount
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    track,
    refresh,
    clear
  };
}