# @repo/user-accounts

A comprehensive user accounts management module focused on account management, email and password management, account validation, and security features following the CRUD pattern and ultra-fine-grained architecture principle.

## Features

### Core CRUD Operations
- **Create**: Create new user accounts with validation
- **Read**: Retrieve user accounts with filtering and pagination
- **Update**: Update account information, status, and settings
- **Delete**: Soft delete with restore capability and permanent deletion

### Email Management
- Email change requests with verification
- Email verification system
- Email uniqueness validation
- Bulk email validation

### Password Management
- Password changes with current password verification
- Password reset requests and confirmation
- Password strength validation
- Password history tracking to prevent reuse
- Secure password hashing with bcrypt

### Account Validation
- Email format and uniqueness validation
- Account status validation
- Login eligibility checks
- Bulk validation operations

### Security Features
- Account locking/unlocking with configurable duration
- Login attempt tracking and automatic locking
- Security event logging
- Suspicious activity detection
- Security policy enforcement
- Risk scoring system

## Installation

```bash
npm install @repo/user-accounts
```

## Dependencies

This module has minimal external dependencies:
- `nanoid` - For generating unique IDs
- `bcryptjs` - For password hashing
- `zod` - For schema validation
- `react` (peer dependency) - For React components and hooks

The module includes a database adapter pattern that can work with various database systems.

## Usage

### Basic Setup

```typescript
import { 
  UserAccountService, 
  SimpleDatabaseAdapter, 
  createDatabaseAdapter 
} from '@repo/user-accounts';

// Using the simple adapter for demonstration
const adapter = new SimpleDatabaseAdapter();

// Or create an adapter for your existing database manager
// const adapter = createDatabaseAdapter(yourDatabaseManager);

const userAccountService = new UserAccountService(adapter);
```

### React Integration

```tsx
import { UserAccountProvider, useUserAccountService } from '@repo/user-accounts';

function App() {
  const adapter = new SimpleDatabaseAdapter();
  
  return (
    <UserAccountProvider databaseAdapter={adapter}>
      <UserAccountManager />
    </UserAccountProvider>
  );
}

function UserAccountManager() {
  const service = useUserAccountService();
  
  // Use the service for account operations
}
```

**Note**: React components and hooks are included in the build but may require additional setup for React types and dependencies in your project.

### Creating User Accounts

```typescript
const result = await userAccountService.createAccount({
  email: 'user@example.com',
  password: 'StrongPassword123!',
  emailVerified: false,
  isActive: true
});

if (result.success) {
  console.log('Account created:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Account Validation

```typescript
// Validate email uniqueness
const emailResult = await userAccountService.validateEmailUniqueness('user@example.com');

// Validate account status
const statusResult = await userAccountService.validateAccountStatus(userId);

// Check if account can login
const loginResult = await userAccountService.validateAccountForLogin('user@example.com');
```

### Email Management

```typescript
// Request email change
const changeResult = await userAccountService.requestEmailChange(userId, {
  newEmail: 'newemail@example.com'
});

// Send email verification
const verificationResult = await userAccountService.sendEmailVerification(userId);

// Verify email with token
const verifyResult = await userAccountService.verifyEmail(token);
```

### Password Management

```typescript
// Change password
const changeResult = await userAccountService.changePassword(userId, {
  currentPassword: 'CurrentPass123!',
  newPassword: 'NewPass123!'
});

// Request password reset
const resetResult = await userAccountService.requestPasswordReset({
  email: 'user@example.com'
});

// Reset password with token
const confirmResult = await userAccountService.resetPassword({
  token: 'reset-token',
  newPassword: 'NewPass123!'
});
```

### Security Operations

```typescript
// Lock account
const lockResult = await userAccountService.lockAccount(userId, 'Suspicious activity', 30);

// Check suspicious activity
const suspiciousResult = await userAccountService.checkSuspiciousActivity(userId);

// Get security events
const eventsResult = await userAccountService.getSecurityEvents(userId, {
  limit: 50,
  eventTypes: [SecurityEventType.LOGIN_FAILED]
});
```

### React Hooks

```tsx
import { useUserAccount, useUserAccounts, usePasswordManagement } from '@repo/user-accounts';

function UserAccountComponent({ accountId }: { accountId: string }) {
  const service = useUserAccountService();
  const { account, loading, error, refetch } = useUserAccount(accountId, service);
  const { changePassword } = usePasswordManagement(service);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!account) return <div>Account not found</div>;

  return (
    <div>
      <h1>{account.email}</h1>
      <p>Status: {account.isActive ? 'Active' : 'Inactive'}</p>
      {/* Account management UI */}
    </div>
  );
}
```

### React Components

```tsx
import { UserAccountForm, UserAccountList, PasswordChangeForm } from '@repo/user-accounts';

function CreateAccountPage() {
  const service = useUserAccountService();

  const handleCreateAccount = async (data) => {
    const result = await service.createAccount(data);
    if (result.success) {
      // Handle success
    }
  };

  return (
    <UserAccountForm
      onSubmit={handleCreateAccount}
      loading={false}
      error={null}
    />
  );
}
```

## Database Schema

The module expects the following database tables:

### user_accounts
```sql
CREATE TABLE user_accounts (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255) NOT NULL,
  password_updated_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_locked BOOLEAN DEFAULT FALSE,
  lock_reason TEXT,
  locked_at TIMESTAMP,
  lock_expires_at TIMESTAMP,
  login_attempts INT DEFAULT 0,
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
```

### email_change_requests
```sql
CREATE TABLE email_change_requests (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  current_email VARCHAR(255) NOT NULL,
  new_email VARCHAR(255) NOT NULL,
  verification_token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_accounts(id)
);
```

### email_verifications
```sql
CREATE TABLE email_verifications (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP
);
```

### password_history
```sql
CREATE TABLE password_history (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_accounts(id)
);
```

### password_reset_requests
```sql
CREATE TABLE password_reset_requests (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_accounts(id)
);
```

### security_events
```sql
CREATE TABLE security_events (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_accounts(id)
);
```

### account_security_settings
```sql
CREATE TABLE account_security_settings (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  require_email_verification BOOLEAN DEFAULT TRUE,
  password_expiry_days INT,
  max_login_attempts INT DEFAULT 5,
  lockout_duration INT DEFAULT 30,
  require_strong_password BOOLEAN DEFAULT TRUE,
  prevent_password_reuse INT DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_accounts(id)
);
```

## Architecture

This module follows the ultra-fine-grained architecture principle with clear separation of concerns:

- **CRUD Operations**: Separated into individual classes for Create, Read, Update, Delete
- **Feature Managers**: Dedicated managers for Email, Password, Validation, Security
- **Service Layer**: Orchestrates all operations through UserAccountService
- **React Integration**: Hooks and components for easy frontend integration
- **Type Safety**: Comprehensive TypeScript types and validation with Zod

## Testing

```bash
npm test
npm run test:coverage
npm run test:ui
```

## Building

```bash
npm run build
npm run dev  # Watch mode
```

## Error Handling

The module uses a consistent error handling approach with typed error codes:

```typescript
enum UserAccountErrorCode {
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_INACTIVE = 'ACCOUNT_INACTIVE',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  PASSWORD_REUSED = 'PASSWORD_REUSED',
  INVALID_RESET_TOKEN = 'INVALID_RESET_TOKEN',
  RESET_TOKEN_EXPIRED = 'RESET_TOKEN_EXPIRED',
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}
```

## Security Considerations

- Passwords are hashed using bcrypt with 12 salt rounds
- Password history is maintained to prevent reuse
- Account locking after failed login attempts
- Security event logging for audit trails
- Email verification tokens expire after 24 hours
- Password reset tokens expire after 2 hours
- Suspicious activity detection and automatic responses

## License

MIT