import type { SessionData, SessionConfig } from '../types';

export function createDefaultSessionConfig(): SessionConfig {
  return {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    slidingExpiration: true,
    secureOnly: false,
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    storage: 'memory',
    fingerprintEnabled: true,
    cleanupInterval: 5 * 60 * 1000 // 5 minutes
  };
}

export function isSessionExpired(session: SessionData): boolean {
  const now = new Date();
  return session.expiresAt <= now;
}

export function getSessionRemainingTime(session: SessionData): number {
  const now = new Date();
  return Math.max(0, session.expiresAt.getTime() - now.getTime());
}

export function formatRemainingTime(milliseconds: number): string {
  if (milliseconds <= 0) {
    return 'Expired';
  }

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

export function shouldRefreshSession(
  session: SessionData, 
  refreshThreshold: number = 5 * 60 * 1000
): boolean {
  const remainingTime = getSessionRemainingTime(session);
  return remainingTime <= refreshThreshold && remainingTime > 0;
}

export function getSessionAge(session: SessionData): number {
  const now = new Date();
  return now.getTime() - session.createdAt.getTime();
}

export function getSessionInactiveTime(session: SessionData): number {
  const now = new Date();
  return now.getTime() - session.lastActivity.getTime();
}

export function formatSessionAge(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  return 'Less than a minute';
}

export function sessionToJSON(session: SessionData): string {
  return JSON.stringify(session, null, 2);
}

export function sessionFromJSON(json: string): SessionData {
  const parsed = JSON.parse(json);
  return {
    ...parsed,
    createdAt: new Date(parsed.createdAt),
    updatedAt: new Date(parsed.updatedAt),
    expiresAt: new Date(parsed.expiresAt),
    lastActivity: new Date(parsed.lastActivity),
  };
}

export function compareSessionsByActivity(a: SessionData, b: SessionData): number {
  return b.lastActivity.getTime() - a.lastActivity.getTime();
}

export function compareSessionsByExpiration(a: SessionData, b: SessionData): number {
  return a.expiresAt.getTime() - b.expiresAt.getTime();
}

export function filterActiveSessions(sessions: SessionData[]): SessionData[] {
  const now = new Date();
  return sessions.filter(session => session.expiresAt > now);
}

export function filterExpiredSessions(sessions: SessionData[]): SessionData[] {
  const now = new Date();
  return sessions.filter(session => session.expiresAt <= now);
}

export function filterAuthenticatedSessions(sessions: SessionData[]): SessionData[] {
  return sessions.filter(session => session.isAuthenticated);
}

export function filterAnonymousSessions(sessions: SessionData[]): SessionData[] {
  return sessions.filter(session => !session.isAuthenticated);
}

export function groupSessionsByUser(sessions: SessionData[]): Record<string, SessionData[]> {
  const grouped: Record<string, SessionData[]> = {};
  
  for (const session of sessions) {
    const userId = session.userId || 'anonymous';
    if (!grouped[userId]) {
      grouped[userId] = [];
    }
    grouped[userId].push(session);
  }
  
  return grouped;
}

export function getSessionStats(sessions: SessionData[]): {
  total: number;
  active: number;
  expired: number;
  authenticated: number;
  anonymous: number;
  averageAge: number;
  oldestSession: SessionData | null;
  newestSession: SessionData | null;
} {
  if (sessions.length === 0) {
    return {
      total: 0,
      active: 0,
      expired: 0,
      authenticated: 0,
      anonymous: 0,
      averageAge: 0,
      oldestSession: null,
      newestSession: null
    };
  }

  const now = new Date();
  const active = sessions.filter(s => s.expiresAt > now);
  const expired = sessions.filter(s => s.expiresAt <= now);
  const authenticated = sessions.filter(s => s.isAuthenticated);
  const anonymous = sessions.filter(s => !s.isAuthenticated);

  const totalAge = sessions.reduce((sum, session) => 
    sum + getSessionAge(session), 0
  );
  const averageAge = totalAge / sessions.length;

  const sortedByCreation = [...sessions].sort((a, b) => 
    a.createdAt.getTime() - b.createdAt.getTime()
  );

  return {
    total: sessions.length,
    active: active.length,
    expired: expired.length,
    authenticated: authenticated.length,
    anonymous: anonymous.length,
    averageAge,
    oldestSession: sortedByCreation[0] || null,
    newestSession: sortedByCreation[sortedByCreation.length - 1] || null
  };
}