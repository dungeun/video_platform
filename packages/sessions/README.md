# @repo/sessions

Ultra-fine-grained session management module for React applications with comprehensive session lifecycle, validation, storage, and security features.

## Features

- **Session Management**: Create, update, refresh, and terminate sessions
- **Multiple Storage Providers**: Memory, localStorage, sessionStorage, IndexedDB
- **Session Validation**: Comprehensive validation with security checks
- **Lifecycle Management**: Complete session lifecycle with events
- **Security Features**: Fingerprinting, encryption, tamper detection
- **Automatic Cleanup**: Configurable expired session cleanup
- **React Integration**: Hooks, providers, and components
- **TypeScript Support**: Full type safety and IntelliSense

## Installation

```bash
npm install @repo/sessions
```

## Basic Usage

### React Provider Setup

```tsx
import { SessionProvider } from '@repo/sessions';

function App() {
  return (
    <SessionProvider
      config={{
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        storage: 'localStorage',
        slidingExpiration: true
      }}
      onSessionEvent={{
        onSessionStart: (session) => console.log('Session started:', session.id),
        onSessionExpire: (session) => console.log('Session expired:', session.id)
      }}
    >
      <MyApp />
    </SessionProvider>
  );
}
```

### Using Sessions in Components

```tsx
import { useSession, SessionStatus } from '@repo/sessions';

function MyComponent() {
  const { 
    currentSession, 
    startSession, 
    updateSession, 
    endSession,
    isLoading 
  } = useSession();

  const handleLogin = async () => {
    await startSession('user123', { role: 'admin' });
  };

  const handleLogout = async () => {
    await endSession();
  };

  return (
    <div>
      <SessionStatus showDetails />
      
      {!currentSession ? (
        <button onClick={handleLogin}>Login</button>
      ) : (
        <button onClick={handleLogout}>Logout</button>
      )}
    </div>
  );
}
```

## Advanced Usage

### Direct Service Usage

```tsx
import { 
  SessionService,
  MemorySessionStorageProvider,
  type SessionConfig 
} from '@repo/sessions';

const config: SessionConfig = {
  maxAge: 60 * 60 * 1000, // 1 hour
  slidingExpiration: true,
  storage: 'memory',
  fingerprintEnabled: true,
  cleanupInterval: 5 * 60 * 1000
};

const securityOptions = {
  enableFingerprinting: true,
  enableEncryption: false,
  enableTamperDetection: true,
  maxSessionsPerUser: 3
};

const cleanupConfig = {
  enabled: true,
  interval: 5 * 60 * 1000,
  batchSize: 50,
  expiredSessionRetention: 24 * 60 * 60 * 1000
};

const sessionService = new SessionService(
  config,
  securityOptions,
  cleanupConfig
);

// Start a session
const session = await sessionService.startSession('user123', {
  role: 'admin',
  department: 'IT'
});

// Validate session
const validation = await sessionService.validateSession();
if (!validation.isValid) {
  console.log('Session invalid:', validation.reason);
}

// Update session
await sessionService.updateSession({
  metadata: { ...session.metadata, lastLogin: new Date() }
});

// Refresh session
await sessionService.refreshSession();

// End session
await sessionService.endSession();
```

### Custom Storage Provider

```tsx
import { SessionStorageProvider, SessionData } from '@repo/sessions';

class RedisSessionStorageProvider implements SessionStorageProvider {
  async get(sessionId: string): Promise<SessionData | null> {
    // Implementation for Redis
    return null;
  }

  async set(sessionId: string, session: SessionData): Promise<void> {
    // Implementation for Redis
  }

  async remove(sessionId: string): Promise<void> {
    // Implementation for Redis
  }

  async clear(): Promise<void> {
    // Implementation for Redis
  }

  async getExpiredSessions(): Promise<SessionData[]> {
    // Implementation for Redis
    return [];
  }

  async removeExpiredSessions(): Promise<number> {
    // Implementation for Redis
    return 0;
  }

  async getUserSessions(userId: string): Promise<SessionData[]> {
    // Implementation for Redis
    return [];
  }
}
```

### Session Management

```tsx
import { useSessionManager } from '@repo/sessions';

function SessionManager() {
  const {
    sessions,
    activeSessions,
    expiredSessions,
    cleanupSessions,
    terminateSession,
    terminateUserSessions
  } = useSessionManager(sessionService);

  const handleCleanup = async () => {
    const cleanedCount = await cleanupSessions();
    console.log(`Cleaned up ${cleanedCount} expired sessions`);
  };

  const handleTerminateUser = async (userId: string) => {
    await terminateUserSessions(userId);
  };

  return (
    <div>
      <h3>Session Manager</h3>
      <p>Active: {activeSessions.length}</p>
      <p>Expired: {expiredSessions.length}</p>
      
      <button onClick={handleCleanup}>
        Cleanup Expired Sessions
      </button>
      
      <SessionList
        sessions={sessions}
        onSessionTerminate={terminateSession}
      />
    </div>
  );
}
```

## Components

### SessionInfo

```tsx
import { SessionInfo } from '@repo/sessions';

<SessionInfo 
  session={currentSession}
  showDetails={true}
  className="my-session-info"
/>
```

### SessionList

```tsx
import { SessionList } from '@repo/sessions';

<SessionList
  sessions={sessions}
  onSessionSelect={(session) => console.log('Selected:', session)}
  onSessionTerminate={(sessionId) => terminateSession(sessionId)}
/>
```

### SessionStatus

```tsx
import { SessionStatus } from '@repo/sessions';

<SessionStatus
  showDetails={true}
  autoValidate={true}
  validationInterval={30000}
/>
```

## Configuration

### SessionConfig

```typescript
interface SessionConfig {
  maxAge: number;                    // Session duration in milliseconds
  slidingExpiration: boolean;        // Extend session on activity
  secureOnly: boolean;              // HTTPS only
  httpOnly: boolean;                // HTTP only cookies
  sameSite: 'strict' | 'lax' | 'none'; // SameSite policy
  domain?: string;                  // Cookie domain
  path: string;                     // Cookie path
  storage: SessionStorageType;      // Storage provider type
  fingerprintEnabled: boolean;      // Enable fingerprinting
  cleanupInterval: number;          // Cleanup interval in ms
}
```

### SessionSecurityOptions

```typescript
interface SessionSecurityOptions {
  enableFingerprinting: boolean;    // Browser fingerprinting
  enableEncryption: boolean;        // Session data encryption
  encryptionKey?: string;          // Encryption key
  enableTamperDetection: boolean;   // Integrity checking
  maxSessionsPerUser: number;       // User session limit
}
```

### SessionCleanupConfig

```typescript
interface SessionCleanupConfig {
  enabled: boolean;                 // Enable automatic cleanup
  interval: number;                 // Cleanup interval in ms
  batchSize: number;               // Sessions per cleanup batch
  expiredSessionRetention: number;  // How long to keep expired sessions
}
```

## Validation

Sessions are automatically validated for:

- **Expiration**: Check if session has expired
- **Fingerprint**: Browser fingerprint matching
- **Integrity**: Detect tampering attempts
- **Format**: Validate session data structure
- **Inactivity**: Check for inactive sessions

## Security Features

- **Browser Fingerprinting**: Detect session hijacking
- **Encryption**: Encrypt session data (configurable)
- **Tamper Detection**: Validate session integrity
- **Session Limits**: Limit concurrent sessions per user
- **Secure Defaults**: HTTPS, secure cookies, etc.

## Error Handling

```typescript
import { 
  SessionError,
  SessionValidationError,
  SessionStorageError,
  SessionSecurityError 
} from '@repo/sessions';

try {
  await sessionService.startSession('user123');
} catch (error) {
  if (error instanceof SessionValidationError) {
    console.log('Validation failed:', error.reason);
  } else if (error instanceof SessionStorageError) {
    console.log('Storage error:', error.message);
  } else if (error instanceof SessionSecurityError) {
    console.log('Security error:', error.message);
  }
}
```

## Testing

```bash
npm test
npm run test:coverage
```

## Development

```bash
npm run dev        # Watch mode
npm run build      # Build for production
npm run type-check # TypeScript checking
```

## License

MIT