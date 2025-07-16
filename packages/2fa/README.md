# @company/2fa

Ultra-fine-grained Two-Factor Authentication module providing comprehensive 2FA functionality with TOTP generation, verification, backup codes, and recovery methods.

## Features

### 🔐 TOTP (Time-based One-Time Password)
- TOTP secret generation and management
- QR code generation for easy setup
- Token generation and verification
- Configurable algorithms (SHA1, SHA256, SHA512)
- Multiple digest lengths (6, 8 digits)

### 🛡️ Backup Codes
- Secure backup code generation
- Multiple format support (alphanumeric, numeric, hex)
- Usage tracking and management
- Expiration handling
- Configurable code count and length

### 🔄 Recovery System
- Multiple recovery methods (email, phone, recovery keys)
- Recovery request management
- Verification code generation and validation
- Configurable expiration and attempt limits

### ✅ Verification Management
- Unified verification for all 2FA methods
- Failed attempt tracking
- Account lockout protection
- Session management
- Configurable security policies

### ⚛️ React Integration
- Ready-to-use React components
- Hooks for state management
- Context providers for global state
- TypeScript support

## Installation

```bash
npm install @company/2fa
# or
yarn add @company/2fa
# or
pnpm add @company/2fa
```

## Quick Start

### Basic Usage

```typescript
import { TwoFactorService } from '@company/2fa';

const twoFactorService = new TwoFactorService();

// Initialize 2FA setup
const setupData = await twoFactorService.initializeSetup('user123');
console.log('QR Code:', setupData.qrCodeDataUrl);
console.log('Manual key:', setupData.manualEntryKey);

// Complete setup
const success = await twoFactorService.setup('user123', {
  secret: {
    secret: setupData.secret,
    qrCodeUrl: '',
    manualEntryKey: setupData.manualEntryKey,
    backupCodes: []
  },
  backupCodes: [],
  recoveryMethods: [],
  qrCodeDataUrl: setupData.qrCodeDataUrl
});

// Verify TOTP token
const result = await twoFactorService.verifyTotp('user123', '123456');
if (result.isValid) {
  console.log('Verification successful!');
}
```

### React Integration

```tsx
import React from 'react';
import { 
  TwoFactorProvider, 
  TwoFactorSetup, 
  TwoFactorVerify,
  useTwoFactorContext 
} from '@company/2fa';

function App() {
  return (
    <TwoFactorProvider>
      <TwoFactorApp />
    </TwoFactorProvider>
  );
}

function TwoFactorApp() {
  const { isEnabled, setupTwoFactor } = useTwoFactorContext();

  if (!isEnabled) {
    return (
      <TwoFactorSetup
        userId="user123"
        onSetupComplete={async (data) => {
          const success = await setupTwoFactor('user123', data);
          if (success) {
            alert('2FA setup completed!');
          }
        }}
        onCancel={() => console.log('Setup cancelled')}
      />
    );
  }

  return (
    <TwoFactorVerify
      onVerify={async (method, value) => {
        // Handle verification
        return { isValid: true, method };
      }}
    />
  );
}
```

## API Reference

### Core Classes

#### TotpGenerator
```typescript
import { TotpGenerator } from '@company/2fa';

const totp = new TotpGenerator({
  algorithm: 'SHA1',
  digits: 6,
  period: 30,
  window: 1,
  issuer: 'Your App',
  serviceName: 'Your Service'
});

// Generate secret
const secret = totp.generateSecret('user@example.com');

// Generate token
const token = totp.generateToken(secret.secret);

// Verify token
const isValid = totp.verifyToken(secret.secret, '123456');
```

#### BackupCodeGenerator
```typescript
import { BackupCodeGenerator } from '@company/2fa';

const generator = new BackupCodeGenerator({
  count: 10,
  length: 8,
  pattern: 'alphanumeric',
  groupSize: 4,
  expirationDays: 365
});

// Generate backup codes
const codeSet = generator.generateCodeSet('user123');

// Verify backup code
const result = generator.verifyCode(codeSet, 'ABCD-1234');
```

#### VerificationManager
```typescript
import { VerificationManager } from '@company/2fa';

const verifier = new VerificationManager({
  maxFailedAttempts: 5,
  lockoutDuration: 30,
  allowedMethods: ['totp', 'backup-codes', 'recovery']
});

// Verify TOTP
const result = await verifier.verifyTotpToken('user123', secret, '123456');

// Check verification status
const status = await verifier.getVerificationStatus('user123');
```

### React Components

#### TwoFactorSetup
```tsx
<TwoFactorSetup
  userId="user123"
  onSetupComplete={(data) => console.log('Setup complete', data)}
  onCancel={() => console.log('Cancelled')}
  className="custom-class"
/>
```

#### TwoFactorVerify
```tsx
<TwoFactorVerify
  onVerify={async (method, value) => ({ isValid: true, method })}
  onCancel={() => console.log('Cancelled')}
  allowBackupCodes={true}
  title="Enter verification code"
  subtitle="Check your authenticator app"
/>
```

#### BackupCodeDisplay
```tsx
<BackupCodeDisplay
  codes={backupCodes}
  onDownload={() => console.log('Downloaded')}
  onPrint={() => console.log('Printed')}
  onSaved={() => console.log('Saved')}
  showUsedCodes={true}
/>
```

### Hooks

#### useTwoFactor
```tsx
const {
  session,
  isEnabled,
  isVerified,
  isLocked,
  isLoading,
  error,
  setupTwoFactor,
  verifyTotp,
  verifyBackupCode,
  regenerateBackupCodes,
  refresh
} = useTwoFactor({
  userId: 'user123',
  autoRefresh: true,
  refreshInterval: 30000
});
```

#### useTwoFactorContext
```tsx
const {
  state,
  isEnabled,
  isVerified,
  initializeSetup,
  setupTwoFactor,
  verifyTotp,
  loadSession
} = useTwoFactorContext();
```

## Configuration

### TOTP Configuration
```typescript
const totpConfig = {
  algorithm: 'SHA1' | 'SHA256' | 'SHA512',
  digits: 6 | 8,
  period: 30,      // seconds
  window: 1,       // tolerance window
  issuer: 'Your App',
  serviceName: 'Your Service'
};
```

### Backup Code Configuration
```typescript
const backupConfig = {
  count: 10,
  length: 8,
  pattern: 'alphanumeric' | 'numeric' | 'hex',
  groupSize: 4,
  expirationDays: 365
};
```

### Verification Configuration
```typescript
const verificationConfig = {
  maxFailedAttempts: 5,
  lockoutDuration: 30,      // minutes
  allowedMethods: ['totp', 'backup-codes', 'recovery'],
  requireMethodForSensitiveActions: true
};
```

## Security Considerations

1. **Secret Storage**: TOTP secrets should be encrypted at rest
2. **Backup Codes**: Should be hashed/encrypted when stored
3. **Rate Limiting**: Implement proper rate limiting for verification attempts
4. **Secure Transport**: Always use HTTPS for 2FA operations
5. **Recovery Methods**: Verify recovery methods (email/phone) before enabling
6. **Audit Logging**: Log all 2FA events for security monitoring

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## License

MIT License

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For questions and support, please open an issue in the repository.