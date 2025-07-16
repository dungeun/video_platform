/**
 * 환경변수 파싱 유틸리티
 */
export const parseEnvValue = {
  /**
   * 문자열을 불리언으로 파싱
   */
  boolean(value?: string): boolean | undefined {
    if (value === undefined || value === '') return undefined;
    
    const lowerValue = value.toLowerCase();
    if (lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes' || lowerValue === 'on') {
      return true;
    }
    if (lowerValue === 'false' || lowerValue === '0' || lowerValue === 'no' || lowerValue === 'off') {
      return false;
    }
    
    return undefined;
  },
  
  /**
   * 문자열을 숫자로 파싱
   */
  number(value?: string): number | undefined {
    if (value === undefined || value === '') return undefined;
    
    const parsed = Number(value);
    return isNaN(parsed) ? undefined : parsed;
  },
  
  /**
   * 문자열을 정수로 파싱
   */
  integer(value?: string): number | undefined {
    if (value === undefined || value === '') return undefined;
    
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  },
  
  /**
   * 문자열을 부동소수점으로 파싱
   */
  float(value?: string): number | undefined {
    if (value === undefined || value === '') return undefined;
    
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  },
  
  /**
   * 문자열을 배열로 파싱 (쉼표나 세미콜론으로 구분)
   */
  array(value?: string, separator: string = ','): string[] | undefined {
    if (value === undefined || value === '') return undefined;
    
    return value
      .split(separator)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  },
  
  /**
   * 문자열을 JSON으로 파싱
   */
  json<T = any>(value?: string): T | undefined {
    if (value === undefined || value === '') return undefined;
    
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  },
  
  /**
   * 문자열을 URL로 파싱 (유효성 검사 포함)
   */
  url(value?: string): string | undefined {
    if (value === undefined || value === '') return undefined;
    
    try {
      new URL(value);
      return value;
    } catch {
      return undefined;
    }
  },
  
  /**
   * 문자열을 이메일로 파싱 (기본 유효성 검사)
   */
  email(value?: string): string | undefined {
    if (value === undefined || value === '') return undefined;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? value : undefined;
  },
  
  /**
   * 문자열을 날짜로 파싱
   */
  date(value?: string): Date | undefined {
    if (value === undefined || value === '') return undefined;
    
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  },
  
  /**
   * 문자열을 열거형으로 파싱
   */
  enum<T extends string>(value?: string, allowedValues: T[]): T | undefined {
    if (value === undefined || value === '') return undefined;
    
    return allowedValues.includes(value as T) ? (value as T) : undefined;
  },
  
  /**
   * 문자열을 기간으로 파싱 (밀리초 단위)
   */
  duration(value?: string): number | undefined {
    if (value === undefined || value === '') return undefined;
    
    // 숫자만 있으면 밀리초로 간주
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    
    // 단위가 있는 경우 파싱
    const match = value.match(/^(\d+)\s*(ms|s|m|h|d)$/);
    if (!match) return undefined;
    
    const [, numStr, unit] = match;
    const num = parseInt(numStr, 10);
    
    switch (unit) {
      case 'ms': return num;
      case 's': return num * 1000;
      case 'm': return num * 60 * 1000;
      case 'h': return num * 60 * 60 * 1000;
      case 'd': return num * 24 * 60 * 60 * 1000;
      default: return undefined;
    }
  },
  
  /**
   * 문자열을 바이트 크기로 파싱
   */
  bytes(value?: string): number | undefined {
    if (value === undefined || value === '') return undefined;
    
    // 숫자만 있으면 바이트로 간주
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    
    // 단위가 있는 경우 파싱
    const match = value.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)$/i);
    if (!match) return undefined;
    
    const [, numStr, unit] = match;
    const num = parseFloat(numStr);
    
    switch (unit.toUpperCase()) {
      case 'B': return Math.floor(num);
      case 'KB': return Math.floor(num * 1024);
      case 'MB': return Math.floor(num * 1024 * 1024);
      case 'GB': return Math.floor(num * 1024 * 1024 * 1024);
      case 'TB': return Math.floor(num * 1024 * 1024 * 1024 * 1024);
      default: return undefined;
    }
  }
};

/**
 * 환경변수 이름 정규화
 */
export function normalizeEnvKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1_$2') // camelCase -> snake_case
    .toUpperCase();
}

/**
 * 환경변수 접두사 추가
 */
export function prefixEnvKey(key: string, prefix: string = 'APP'): string {
  const normalizedKey = normalizeEnvKey(key);
  return prefix ? `${prefix.toUpperCase()}_${normalizedKey}` : normalizedKey;
}

/**
 * 환경변수 값 마스킹 (보안 목적)
 */
export function maskEnvValue(key: string, value: string): string {
  const sensitiveKeys = [
    'password', 'secret', 'key', 'token', 'api_key', 'private_key',
    'jwt_secret', 'webhook_secret', 'client_secret'
  ];
  
  const isSensitive = sensitiveKeys.some(sensitiveKey => 
    key.toLowerCase().includes(sensitiveKey)
  );
  
  if (!isSensitive) {
    return value;
  }
  
  if (value.length <= 8) {
    return '*'.repeat(value.length);
  }
  
  const start = value.substring(0, 2);
  const end = value.substring(value.length - 2);
  const middle = '*'.repeat(value.length - 4);
  
  return `${start}${middle}${end}`;
}

/**
 * 환경변수 설정 덤프
 */
export function dumpEnvConfig(prefix?: string): Record<string, string> {
  const env = process.env;
  const config: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(env)) {
    if (value && (!prefix || key.startsWith(prefix.toUpperCase()))) {
      config[key] = maskEnvValue(key, value);
    }
  }
  
  return config;
}