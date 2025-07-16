/**
 * 2FA 모듈 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  TotpGenerator,
  QrCodeGenerator,
  BackupCodeGenerator,
  BackupCodeManager,
  RecoveryManager,
  VerificationManager,
  TwoFactorService
} from '../src';

describe('TotpGenerator', () => {
  let totpGenerator: TotpGenerator;

  beforeEach(() => {
    totpGenerator = new TotpGenerator();
  });

  it('should generate a valid secret', () => {
    const secret = totpGenerator.generateSecret('test@example.com');
    
    expect(secret.secret).toBeDefined();
    expect(secret.qrCodeUrl).toContain('otpauth://totp/');
    expect(secret.manualEntryKey).toBeDefined();
  });

  it('should generate valid TOTP tokens', () => {
    const secret = totpGenerator.generateSecret('test@example.com');
    const token = totpGenerator.generateToken(secret.secret);
    
    expect(token.token).toMatch(/^\d{6}$/);
    expect(token.isValid).toBe(true);
    expect(token.remainingTime).toBeGreaterThan(0);
  });

  it('should verify valid tokens', () => {
    const secret = totpGenerator.generateSecret('test@example.com');
    const token = totpGenerator.generateToken(secret.secret);
    
    const isValid = totpGenerator.verifyToken(secret.secret, token.token);
    expect(isValid).toBe(true);
  });

  it('should reject invalid tokens', () => {
    const secret = totpGenerator.generateSecret('test@example.com');
    
    const isValid = totpGenerator.verifyToken(secret.secret, '000000');
    expect(isValid).toBe(false);
  });

  it('should validate secrets correctly', () => {
    const secret = totpGenerator.generateSecret('test@example.com');
    
    expect(totpGenerator.isValidSecret(secret.secret)).toBe(true);
    expect(totpGenerator.isValidSecret('invalid')).toBe(false);
  });
});

describe('QrCodeGenerator', () => {
  let qrCodeGenerator: QrCodeGenerator;

  beforeEach(() => {
    qrCodeGenerator = new QrCodeGenerator();
  });

  it('should generate QR code data URL', async () => {
    const totpUri = 'otpauth://totp/Test:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Test';
    
    const dataUrl = await qrCodeGenerator.generateDataUrl(totpUri);
    
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('should generate SVG QR code', async () => {
    const totpUri = 'otpauth://totp/Test:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Test';
    
    const svg = await qrCodeGenerator.generateSvg(totpUri);
    
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });
});

describe('BackupCodeGenerator', () => {
  let backupCodeGenerator: BackupCodeGenerator;

  beforeEach(() => {
    backupCodeGenerator = new BackupCodeGenerator();
  });

  it('should generate backup code set', () => {
    const codeSet = backupCodeGenerator.generateCodeSet('user123');
    
    expect(codeSet.codes).toHaveLength(10);
    expect(codeSet.isActive).toBe(true);
    expect(codeSet.createdAt).toBeInstanceOf(Date);
    
    codeSet.codes.forEach(code => {
      expect(code.code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      expect(code.isUsed).toBe(false);
    });
  });

  it('should verify backup codes correctly', () => {
    const codeSet = backupCodeGenerator.generateCodeSet('user123');
    const testCode = codeSet.codes[0].code;
    
    const result = backupCodeGenerator.verifyCode(codeSet, testCode);
    
    expect(result.isValid).toBe(true);
    expect(result.code).toBeDefined();
  });

  it('should reject used backup codes', () => {
    const codeSet = backupCodeGenerator.generateCodeSet('user123');
    const testCode = codeSet.codes[0];
    testCode.isUsed = true;
    
    const result = backupCodeGenerator.verifyCode(codeSet, testCode.code);
    
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('already been used');
  });

  it('should count available codes correctly', () => {
    const codeSet = backupCodeGenerator.generateCodeSet('user123');
    
    expect(backupCodeGenerator.getAvailableCodeCount(codeSet)).toBe(10);
    
    codeSet.codes[0].isUsed = true;
    expect(backupCodeGenerator.getAvailableCodeCount(codeSet)).toBe(9);
  });
});

describe('BackupCodeManager', () => {
  let backupCodeManager: BackupCodeManager;

  beforeEach(() => {
    backupCodeManager = new BackupCodeManager();
  });

  it('should save and load code sets', async () => {
    const generator = new BackupCodeGenerator();
    const codeSet = generator.generateCodeSet('user123');
    
    await backupCodeManager.saveCodeSet('user123', codeSet);
    const loadedCodeSet = await backupCodeManager.getCodeSet('user123');
    
    expect(loadedCodeSet).toEqual(codeSet);
  });

  it('should verify and use codes', async () => {
    const generator = new BackupCodeGenerator();
    const codeSet = generator.generateCodeSet('user123');
    const testCode = codeSet.codes[0].code;
    
    await backupCodeManager.saveCodeSet('user123', codeSet);
    
    const result = await backupCodeManager.verifyAndUseCode('user123', testCode);
    
    expect(result.isValid).toBe(true);
    expect(result.remainingCodes).toBe(9);
  });
});

describe('RecoveryManager', () => {
  let recoveryManager: RecoveryManager;

  beforeEach(() => {
    recoveryManager = new RecoveryManager();
  });

  it('should add recovery methods', async () => {
    const method = await recoveryManager.addRecoveryMethod(
      'user123',
      'email',
      'test@example.com',
      true
    );
    
    expect(method.type).toBe('email');
    expect(method.value).toBe('test@example.com');
    expect(method.isPrimary).toBe(true);
    expect(method.isVerified).toBe(false);
  });

  it('should initiate recovery requests', async () => {
    await recoveryManager.addRecoveryMethod(
      'user123',
      'email',
      'test@example.com',
      true
    );

    // 이메일 방법을 먼저 검증된 상태로 설정
    const methods = await recoveryManager.getRecoveryMethods('user123');
    methods[0].isVerified = true;
    await recoveryManager['storage'].updateMethod('user123', methods[0]);
    
    const request = await recoveryManager.initiateRecovery('user123', 'email');
    
    expect(request.userId).toBe('user123');
    expect(request.method.type).toBe('email');
    expect(request.code).toMatch(/^\d{8}$/);
    expect(request.isUsed).toBe(false);
  });
});

describe('VerificationManager', () => {
  let verificationManager: VerificationManager;
  let totpGenerator: TotpGenerator;

  beforeEach(() => {
    verificationManager = new VerificationManager();
    totpGenerator = new TotpGenerator();
  });

  it('should verify TOTP tokens', async () => {
    const secret = totpGenerator.generateSecret('test@example.com');
    const token = totpGenerator.generateToken(secret.secret);
    
    const result = await verificationManager.verifyTotpToken(
      'user123',
      secret.secret,
      token.token
    );
    
    expect(result.isValid).toBe(true);
    expect(result.method).toBe('2fa');
  });

  it('should handle failed verification attempts', async () => {
    const secret = totpGenerator.generateSecret('test@example.com');
    
    const result = await verificationManager.verifyTotpToken(
      'user123',
      secret.secret,
      '000000'
    );
    
    expect(result.isValid).toBe(false);
    expect(result.remainingAttempts).toBeDefined();
  });

  it('should lock accounts after too many failures', async () => {
    const secret = totpGenerator.generateSecret('test@example.com');
    
    // 실패 시도를 최대치까지 반복
    for (let i = 0; i < 5; i++) {
      await verificationManager.verifyTotpToken('user123', secret.secret, '000000');
    }
    
    const status = await verificationManager.getVerificationStatus('user123');
    expect(status.isLocked).toBe(true);
  });
});

describe('TwoFactorService', () => {
  let twoFactorService: TwoFactorService;

  beforeEach(() => {
    twoFactorService = new TwoFactorService();
  });

  it('should initialize setup correctly', async () => {
    const setupData = await twoFactorService.initializeSetup('user123');
    
    expect(setupData.secret).toBeDefined();
    expect(setupData.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(setupData.manualEntryKey).toBeDefined();
  });

  it('should complete 2FA setup', async () => {
    const setupData = await twoFactorService.initializeSetup('user123');
    
    const twoFactorSetupData = {
      secret: {
        secret: setupData.secret,
        qrCodeUrl: '',
        manualEntryKey: setupData.manualEntryKey,
        backupCodes: []
      },
      backupCodes: [],
      recoveryMethods: [],
      qrCodeDataUrl: setupData.qrCodeDataUrl
    };
    
    const success = await twoFactorService.setup('user123', twoFactorSetupData);
    expect(success).toBe(true);
    
    const session = await twoFactorService.getSession('user123');
    expect(session?.isEnabled).toBe(true);
    expect(session?.setupCompleted).toBe(true);
  });

  it('should disable 2FA correctly', async () => {
    // 먼저 설정
    const setupData = await twoFactorService.initializeSetup('user123');
    const twoFactorSetupData = {
      secret: {
        secret: setupData.secret,
        qrCodeUrl: '',
        manualEntryKey: setupData.manualEntryKey,
        backupCodes: []
      },
      backupCodes: [],
      recoveryMethods: [],
      qrCodeDataUrl: setupData.qrCodeDataUrl
    };
    
    await twoFactorService.setup('user123', twoFactorSetupData);
    
    // 비활성화
    const success = await twoFactorService.disable('user123');
    expect(success).toBe(true);
    
    const session = await twoFactorService.getSession('user123');
    expect(session?.isEnabled).toBe(false);
  });
});