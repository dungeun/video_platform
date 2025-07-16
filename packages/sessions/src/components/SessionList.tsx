import React from 'react';
import type { SessionListProps } from '../types';

export function SessionList({ 
  sessions, 
  onSessionSelect, 
  onSessionTerminate, 
  className = '' 
}: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className={`session-list session-list--empty ${className}`}>
        <p className="session-list__empty-message">No sessions found</p>
      </div>
    );
  }

  const handleTerminate = (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (onSessionTerminate) {
      onSessionTerminate(sessionId);
    }
  };

  return (
    <div className={`session-list ${className}`}>
      <div className="session-list__header">
        <h3 className="session-list__title">Sessions ({sessions.length})</h3>
      </div>

      <div className="session-list__items">
        {sessions.map((session) => {
          const now = new Date();
          const isExpired = session.expiresAt <= now;
          const timeRemaining = session.expiresAt.getTime() - now.getTime();
          const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));

          return (
            <div
              key={session.id}
              className={`session-list__item ${isExpired ? 'session-list__item--expired' : 'session-list__item--active'}`}
              onClick={() => onSessionSelect?.(session)}
            >
              <div className="session-list__item-header">
                <div className="session-list__item-id">
                  {session.id.substring(0, 8)}...
                </div>
                <div className="session-list__item-status">
                  <span className={`session-list__status-badge ${isExpired ? 'session-list__status-badge--expired' : 'session-list__status-badge--active'}`}>
                    {isExpired ? 'Expired' : 'Active'}
                  </span>
                </div>
              </div>

              <div className="session-list__item-content">
                {session.userId && (
                  <div className="session-list__item-field">
                    <span className="session-list__item-label">User:</span>
                    <span className="session-list__item-value">{session.userId}</span>
                  </div>
                )}

                <div className="session-list__item-field">
                  <span className="session-list__item-label">Type:</span>
                  <span className="session-list__item-value">
                    {session.isAuthenticated ? 'Authenticated' : 'Anonymous'}
                  </span>
                </div>

                <div className="session-list__item-field">
                  <span className="session-list__item-label">
                    {isExpired ? 'Expired:' : 'Expires:'}
                  </span>
                  <span className="session-list__item-value">
                    {session.expiresAt.toLocaleString()}
                    {!isExpired && (
                      <span className="session-list__item-remaining">
                        {' '}({minutesRemaining}m)
                      </span>
                    )}
                  </span>
                </div>

                <div className="session-list__item-field">
                  <span className="session-list__item-label">Last Activity:</span>
                  <span className="session-list__item-value">
                    {session.lastActivity.toLocaleString()}
                  </span>
                </div>
              </div>

              {onSessionTerminate && (
                <div className="session-list__item-actions">
                  <button
                    className="session-list__terminate-button"
                    onClick={(e) => handleTerminate(session.id, e)}
                    title="Terminate session"
                  >
                    Terminate
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}