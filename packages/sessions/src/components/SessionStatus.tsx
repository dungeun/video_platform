import React from 'react';
import { useSession } from '../hooks/useSession';
import { useSessionValidation } from '../hooks/useSessionValidation';

interface SessionStatusProps {
  className?: string;
  showDetails?: boolean;
  autoValidate?: boolean;
  validationInterval?: number;
}

export function SessionStatus({ 
  className = '',
  showDetails = false,
  autoValidate = true,
  validationInterval = 30000
}: SessionStatusProps) {
  const { currentSession, isLoading, error } = useSession();
  const { validationResult, isValidating } = useSessionValidation(
    autoValidate ? validationInterval : 0
  );

  if (isLoading) {
    return (
      <div className={`session-status session-status--loading ${className}`}>
        <span className="session-status__indicator session-status__indicator--loading">⏳</span>
        <span className="session-status__text">Loading session...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`session-status session-status--error ${className}`}>
        <span className="session-status__indicator session-status__indicator--error">❌</span>
        <span className="session-status__text">Session error: {error.message}</span>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className={`session-status session-status--none ${className}`}>
        <span className="session-status__indicator session-status__indicator--none">⚪</span>
        <span className="session-status__text">No active session</span>
      </div>
    );
  }

  const now = new Date();
  const isExpired = currentSession.expiresAt <= now;
  const isValid = validationResult?.isValid ?? true;
  const timeRemaining = currentSession.expiresAt.getTime() - now.getTime();
  const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));

  let statusClass = 'session-status--active';
  let indicator = '🟢';
  let statusText = 'Active';

  if (isExpired || !isValid) {
    statusClass = 'session-status--invalid';
    indicator = '🔴';
    statusText = isExpired ? 'Expired' : `Invalid (${validationResult?.reason})`;
  } else if (minutesRemaining < 5) {
    statusClass = 'session-status--warning';
    indicator = '🟡';
    statusText = 'Expiring soon';
  }

  return (
    <div className={`session-status ${statusClass} ${className}`}>
      <div className="session-status__main">
        <span className="session-status__indicator">{indicator}</span>
        <span className="session-status__text">{statusText}</span>
        {isValidating && (
          <span className="session-status__validating">Validating...</span>
        )}
      </div>

      {showDetails && (
        <div className="session-status__details">
          <div className="session-status__detail">
            <span className="session-status__detail-label">Session ID:</span>
            <span className="session-status__detail-value">
              {currentSession.id.substring(0, 8)}...
            </span>
          </div>

          {currentSession.userId && (
            <div className="session-status__detail">
              <span className="session-status__detail-label">User:</span>
              <span className="session-status__detail-value">{currentSession.userId}</span>
            </div>
          )}

          <div className="session-status__detail">
            <span className="session-status__detail-label">Type:</span>
            <span className="session-status__detail-value">
              {currentSession.isAuthenticated ? 'Authenticated' : 'Anonymous'}
            </span>
          </div>

          <div className="session-status__detail">
            <span className="session-status__detail-label">Expires:</span>
            <span className="session-status__detail-value">
              {currentSession.expiresAt.toLocaleString()}
              {!isExpired && (
                <span className="session-status__detail-remaining">
                  {' '}({minutesRemaining}m remaining)
                </span>
              )}
            </span>
          </div>

          {validationResult && !validationResult.isValid && (
            <div className="session-status__detail session-status__detail--error">
              <span className="session-status__detail-label">Issue:</span>
              <span className="session-status__detail-value">{validationResult.reason}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}