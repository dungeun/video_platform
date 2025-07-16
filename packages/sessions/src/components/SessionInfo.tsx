import React from 'react';
import type { SessionInfoProps } from '../types';

export function SessionInfo({ 
  session, 
  showDetails = false, 
  className = '' 
}: SessionInfoProps) {
  if (!session) {
    return (
      <div className={`session-info session-info--empty ${className}`}>
        <p>No active session</p>
      </div>
    );
  }

  const now = new Date();
  const isExpired = session.expiresAt <= now;
  const timeRemaining = session.expiresAt.getTime() - now.getTime();
  const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));

  return (
    <div className={`session-info ${isExpired ? 'session-info--expired' : 'session-info--active'} ${className}`}>
      <div className="session-info__header">
        <h3 className="session-info__title">Session Information</h3>
        <span className={`session-info__status ${isExpired ? 'session-info__status--expired' : 'session-info__status--active'}`}>
          {isExpired ? 'Expired' : 'Active'}
        </span>
      </div>

      <div className="session-info__content">
        <div className="session-info__field">
          <label className="session-info__label">Session ID:</label>
          <span className="session-info__value">{session.id}</span>
        </div>

        {session.userId && (
          <div className="session-info__field">
            <label className="session-info__label">User ID:</label>
            <span className="session-info__value">{session.userId}</span>
          </div>
        )}

        <div className="session-info__field">
          <label className="session-info__label">Status:</label>
          <span className="session-info__value">
            {session.isAuthenticated ? 'Authenticated' : 'Anonymous'}
          </span>
        </div>

        <div className="session-info__field">
          <label className="session-info__label">
            {isExpired ? 'Expired:' : 'Expires:'}
          </label>
          <span className="session-info__value">
            {session.expiresAt.toLocaleString()}
            {!isExpired && (
              <span className="session-info__remaining">
                {' '}({minutesRemaining} minutes remaining)
              </span>
            )}
          </span>
        </div>

        <div className="session-info__field">
          <label className="session-info__label">Last Activity:</label>
          <span className="session-info__value">
            {session.lastActivity.toLocaleString()}
          </span>
        </div>

        {showDetails && (
          <>
            <div className="session-info__field">
              <label className="session-info__label">Created:</label>
              <span className="session-info__value">
                {session.createdAt.toLocaleString()}
              </span>
            </div>

            <div className="session-info__field">
              <label className="session-info__label">Updated:</label>
              <span className="session-info__value">
                {session.updatedAt.toLocaleString()}
              </span>
            </div>

            {session.fingerprint && (
              <div className="session-info__field">
                <label className="session-info__label">Fingerprint:</label>
                <span className="session-info__value session-info__value--truncated">
                  {session.fingerprint.substring(0, 16)}...
                </span>
              </div>
            )}

            {Object.keys(session.metadata).length > 0 && (
              <div className="session-info__field">
                <label className="session-info__label">Metadata:</label>
                <div className="session-info__metadata">
                  {Object.entries(session.metadata).map(([key, value]) => (
                    <div key={key} className="session-info__metadata-item">
                      <span className="session-info__metadata-key">{key}:</span>
                      <span className="session-info__metadata-value">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}