import { Result } from '../types';
import { readFile, watch } from 'fs';
import { promisify } from 'util';
import * as yaml from 'js-yaml';
import * as path from 'path';
import { ConfigLoader, AppConfig } from '../types';

const readFileAsync = promisify(readFile);

/**
 * 파일 기반 설정 로더
 */
export class FileConfigLoader implements ConfigLoader {
  readonly priority = 80;
  private watchers: Map<string, any> = new Map();
  
  constructor(private filePath: string) {}
  
  /**
   * 파일에서 설정 로드
   */
  async load(): Promise<Result<Partial<AppConfig>>> {
    try {
      const fileContent = await readFileAsync(this.filePath, 'utf-8');
      const config = await this.parseFileContent(fileContent);
      
      return Result.success(config);
    } catch (error) {
      // 파일이 없으면 빈 설정 반환
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return Result.success({});
      }
      
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return Result.failure('FILE_LOAD_FAILED', `파일 로드 실패 (${this.filePath}): ${errorMsg}`);
    }
  }
  
  /**
   * 파일 변경 감지
   */
  watch(callback: (config: Partial<AppConfig>) => void): void {
    if (this.watchers.has(this.filePath)) {
      return; // 이미 감지 중
    }
    
    const watcher = watch(this.filePath, { persistent: false }, async (eventType) => {
      if (eventType === 'change') {
        try {
          const result = await this.load();
          if (result.isSuccess) {
            callback(result.data);
          }
        } catch (error) {
          console.warn(`파일 변경 감지 오류 (${this.filePath}):`, error);
        }
      }
    });
    
    this.watchers.set(this.filePath, watcher);
  }
  
  /**
   * 파일 내용 파싱
   */
  private async parseFileContent(content: string): Promise<Partial<AppConfig>> {
    const extension = path.extname(this.filePath).toLowerCase();
    
    switch (extension) {
      case '.json':
        return this.parseJSON(content);
      case '.yaml':
      case '.yml':
        return this.parseYAML(content);
      case '.env':
        return this.parseEnv(content);
      case '.js':
      case '.ts':
        return this.parseModule();
      default:
        throw new Error(`지원되지 않는 파일 형식: ${extension}`);
    }
  }
  
  /**
   * JSON 파싱
   */
  private parseJSON(content: string): Partial<AppConfig> {
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`JSON 파싱 오류: ${error}`);
    }
  }
  
  /**
   * YAML 파싱
   */
  private parseYAML(content: string): Partial<AppConfig> {
    try {
      const parsed = yaml.load(content);
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('YAML 파일은 객체여야 합니다.');
      }
      return parsed as Partial<AppConfig>;
    } catch (error) {
      throw new Error(`YAML 파싱 오류: ${error}`);
    }
  }
  
  /**
   * .env 파일 파싱
   */
  private parseEnv(content: string): Partial<AppConfig> {
    const config: Record<string, string> = {};
    
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 주석이나 빈 줄 무시
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }
      
      // KEY=VALUE 형식 파싱
      const equalIndex = trimmedLine.indexOf('=');
      if (equalIndex === -1) {
        continue;
      }
      
      const key = trimmedLine.substring(0, equalIndex).trim();
      let value = trimmedLine.substring(equalIndex + 1).trim();
      
      // 인용부호 제거
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      config[key] = value;
    }
    
    // 환경변수 스타일을 설정 객체로 변환
    return this.transformEnvToConfig(config);
  }
  
  /**
   * JS/TS 모듈 파싱
   */
  private async parseModule(): Promise<Partial<AppConfig>> {
    try {
      // 동적 import 사용
      delete require.cache[require.resolve(path.resolve(this.filePath))];
      const module = require(path.resolve(this.filePath));
      
      // ES 모듈인 경우 default export 사용
      const config = module.default || module;
      
      if (typeof config === 'function') {
        return await config();
      }
      
      return config;
    } catch (error) {
      throw new Error(`모듈 로드 오류: ${error}`);
    }
  }
  
  /**
   * 환경변수 스타일을 설정 객체로 변환
   */
  private transformEnvToConfig(env: Record<string, string>): Partial<AppConfig> {
    const config: any = {};
    
    for (const [key, value] of Object.entries(env)) {
      // 점 표기법으로 중첩 객체 생성
      const keys = key.toLowerCase().split('_');
      let current = config;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const nestedKey = keys[i];
        if (!current[nestedKey]) {
          current[nestedKey] = {};
        }
        current = current[nestedKey];
      }
      
      const finalKey = keys[keys.length - 1];
      current[finalKey] = this.parseValue(value);
    }
    
    return config;
  }
  
  /**
   * 문자열 값을 적절한 타입으로 변환
   */
  private parseValue(value: string): any {
    // 불리언
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    // 숫자
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10);
    }
    if (/^\d*\.\d+$/.test(value)) {
      return parseFloat(value);
    }
    
    // JSON 배열/객체
    if ((value.startsWith('[') && value.endsWith(']')) ||
        (value.startsWith('{') && value.endsWith('}'))) {
      try {
        return JSON.parse(value);
      } catch {
        // 파싱 실패시 문자열로 반환
      }
    }
    
    // 기본적으로 문자열
    return value;
  }
  
  /**
   * 리소스 정리
   */
  dispose(): void {
    for (const [filePath, watcher] of this.watchers.entries()) {
      try {
        watcher.close();
      } catch (error) {
        console.warn(`파일 워처 종료 오류 (${filePath}):`, error);
      }
    }
    this.watchers.clear();
  }
}