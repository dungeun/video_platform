import { Result } from '@repo/core';
import { CacheManager } from '../CacheManager';

export interface WarmupConfig {
  source: 'file' | 'api' | 'function' | 'cache';
  url?: string;
  filepath?: string;
  data?: any;
  dataProvider?: () => Promise<any>;
  schedule?: {
    interval: number; // 밀리초
    times?: number; // 반복 횟수 (없으면 무한)
  };
  transform?: (data: any) => any;
  keyExtractor?: (item: any, index: number) => string;
  ttl?: number;
  batchSize?: number;
  onProgress?: (progress: number, total: number) => void;
  onError?: (error: Error, item?: any) => void;
}

export interface WarmupResult {
  total: number;
  success: number;
  failed: number;
  duration: number;
  errors: Array<{ key: string; error: string }>;
}

export class CacheWarmer {
  private cacheManager: CacheManager;
  private activeSchedules: Map<string, NodeJS.Timeout> = new Map();

  constructor(cacheManager: CacheManager) {
    this.cacheManager = cacheManager;
  }

  /**
   * 파일에서 캐시 워밍
   */
  async warmFromFile(filepath: string, config?: Partial<WarmupConfig>): Promise<Result<WarmupResult>> {
    try {
      // 브라우저 환경에서는 파일 읽기 제한
      if (typeof window !== 'undefined') {
        return Result.failure('FILE_WARMUP_NOT_SUPPORTED', '브라우저에서는 파일 워밍을 지원하지 않습니다');
      }

      // Node.js 환경에서 fs 모듈 동적 로드
      const fs = await import('fs').then(m => m.promises);
      const content = await fs.readFile(filepath, 'utf-8');
      const data = JSON.parse(content);

      return this.warmWithData(data, { ...config, source: 'file' });
    } catch (error) {
      return Result.failure('FILE_WARMUP_FAILED', `파일 워밍 실패: ${error}`);
    }
  }

  /**
   * API에서 캐시 워밍
   */
  async warmFromAPI(endpoint: string, config?: Partial<WarmupConfig>): Promise<Result<WarmupResult>> {
    try {
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        return Result.failure('API_WARMUP_FAILED', `API 응답 실패: ${response.statusText}`);
      }

      const data = await response.json();
      
      return this.warmWithData(data, { ...config, source: 'api', url: endpoint });
    } catch (error) {
      return Result.failure('API_WARMUP_ERROR', `API 워밍 오류: ${error}`);
    }
  }

  /**
   * 함수에서 캐시 워밍
   */
  async warmFromFunction(
    dataProvider: () => Promise<any>, 
    config?: Partial<WarmupConfig>
  ): Promise<Result<WarmupResult>> {
    try {
      const data = await dataProvider();
      
      return this.warmWithData(data, { 
        ...config, 
        source: 'function',
        dataProvider 
      });
    } catch (error) {
      return Result.failure('FUNCTION_WARMUP_ERROR', `함수 워밍 오류: ${error}`);
    }
  }

  /**
   * 스케줄된 워밍 설정
   */
  async scheduleWarmup(id: string, config: WarmupConfig): Promise<Result<void>> {
    try {
      // 기존 스케줄 제거
      this.cancelSchedule(id);

      if (!config.schedule) {
        return Result.failure('SCHEDULE_CONFIG_MISSING', '스케줄 설정이 필요합니다');
      }

      let count = 0;
      const maxTimes = config.schedule.times || Infinity;

      const executeWarmup = async () => {
        if (count >= maxTimes) {
          this.cancelSchedule(id);
          return;
        }

        count++;

        try {
          let result: Result<WarmupResult>;

          switch (config.source) {
            case 'api':
              if (!config.url) {
                throw new Error('API URL이 필요합니다');
              }
              result = await this.warmFromAPI(config.url, config);
              break;
            
            case 'file':
              if (!config.filepath) {
                throw new Error('파일 경로가 필요합니다');
              }
              result = await this.warmFromFile(config.filepath, config);
              break;
            
            case 'function':
              if (!config.dataProvider) {
                throw new Error('데이터 제공 함수가 필요합니다');
              }
              result = await this.warmFromFunction(config.dataProvider, config);
              break;
            
            default:
              throw new Error(`지원하지 않는 소스: ${config.source}`);
          }

          if (result.isFailure) {
            console.error(`스케줄 워밍 실패 (${id}):`, result.error);
          }
        } catch (error) {
          console.error(`스케줄 워밍 오류 (${id}):`, error);
        }
      };

      // 초기 실행
      await executeWarmup();

      // 스케줄 설정
      const interval = setInterval(executeWarmup, config.schedule.interval);
      this.activeSchedules.set(id, interval);

      return Result.success(undefined);
    } catch (error) {
      return Result.failure('SCHEDULE_SETUP_FAILED', `스케줄 설정 실패: ${error}`);
    }
  }

  /**
   * 스케줄 취소
   */
  cancelSchedule(id: string): void {
    const interval = this.activeSchedules.get(id);
    if (interval) {
      clearInterval(interval);
      this.activeSchedules.delete(id);
    }
  }

  /**
   * 모든 스케줄 취소
   */
  cancelAllSchedules(): void {
    for (const [id, interval] of this.activeSchedules) {
      clearInterval(interval);
    }
    this.activeSchedules.clear();
  }

  /**
   * 데이터로 캐시 워밍
   */
  private async warmWithData(
    data: any, 
    config: WarmupConfig
  ): Promise<Result<WarmupResult>> {
    const startTime = Date.now();
    const result: WarmupResult = {
      total: 0,
      success: 0,
      failed: 0,
      duration: 0,
      errors: []
    };

    try {
      // 데이터 변환
      const transformedData = config.transform ? config.transform(data) : data;
      
      // 배열이 아니면 배열로 변환
      const items = Array.isArray(transformedData) ? transformedData : [transformedData];
      result.total = items.length;

      // 배치 처리
      const batchSize = config.batchSize || 100;
      
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (item, index) => {
            const globalIndex = i + index;
            
            try {
              // 키 추출
              const key = config.keyExtractor 
                ? config.keyExtractor(item, globalIndex)
                : `warmup_${globalIndex}`;
              
              // 캐시에 저장
              const setResult = await this.cacheManager.set(key, item, config.ttl);
              
              if (setResult.isSuccess) {
                result.success++;
              } else {
                result.failed++;
                result.errors.push({ key, error: setResult.error });
              }
            } catch (error) {
              result.failed++;
              if (config.onError) {
                config.onError(error as Error, item);
              }
            }
          })
        );

        // 진행률 콜백
        if (config.onProgress) {
          config.onProgress(Math.min(i + batchSize, items.length), result.total);
        }
      }

      result.duration = Date.now() - startTime;

      return Result.success(result);
    } catch (error) {
      return Result.failure('WARMUP_FAILED', `캐시 워밍 실패: ${error}`);
    }
  }

  /**
   * 패턴 기반 워밍
   */
  async warmByPattern(pattern: string, generator: (key: string) => any): Promise<Result<WarmupResult>> {
    const keys: string[] = [];
    const data: any[] = [];

    // 패턴에 맞는 키 생성 (예: user:* -> user:1, user:2, ...)
    // 실제로는 더 복잡한 패턴 매칭 로직 필요
    for (let i = 1; i <= 10; i++) {
      const key = pattern.replace('*', i.toString());
      keys.push(key);
      data.push(await generator(key));
    }

    return this.warmWithData(data, {
      source: 'function',
      keyExtractor: (_, index) => keys[index]
    });
  }

  /**
   * 캐시 덤프에서 워밍
   */
  async warmFromDump(dump: Map<string, any>, config?: Partial<WarmupConfig>): Promise<Result<WarmupResult>> {
    const items = Array.from(dump.entries()).map(([key, value]) => ({ key, value }));
    
    return this.warmWithData(items, {
      ...config,
      source: 'cache',
      keyExtractor: (item) => item.key,
      transform: (items) => items.map((item: any) => item.value)
    });
  }

  /**
   * 선택적 워밍 (조건부)
   */
  async warmSelective(
    predicate: (key: string, value: any) => boolean,
    data: Map<string, any>
  ): Promise<Result<WarmupResult>> {
    const filtered = new Map<string, any>();
    
    for (const [key, value] of data) {
      if (predicate(key, value)) {
        filtered.set(key, value);
      }
    }
    
    return this.warmFromDump(filtered);
  }

  /**
   * 워밍 상태 조회
   */
  getWarmupStatus(): {
    activeSchedules: string[];
    schedulesCount: number;
  } {
    return {
      activeSchedules: Array.from(this.activeSchedules.keys()),
      schedulesCount: this.activeSchedules.size
    };
  }
}

export class SmartCacheWarmer extends CacheWarmer {
  /**
   * 지능형 워밍 - 사용 패턴 기반
   */
  async warmByUsagePattern(
    usageStats: Map<string, { hits: number; lastAccess: Date }>,
    threshold: number = 10
  ): Promise<Result<WarmupResult>> {
    // 자주 사용되는 키만 워밍
    const hotKeys = Array.from(usageStats.entries())
      .filter(([_, stats]) => stats.hits >= threshold)
      .sort((a, b) => b[1].hits - a[1].hits)
      .map(([key]) => key);

    // 실제 데이터 로드 및 워밍
    const dataToWarm = new Map<string, any>();
    
    // 여기서는 예시로 빈 데이터 사용
    // 실제로는 데이터 소스에서 로드 필요
    for (const key of hotKeys) {
      dataToWarm.set(key, { warmed: true, key });
    }

    return this.warmFromDump(dataToWarm);
  }

  /**
   * 예측 기반 워밍
   */
  async warmPredictive(
    timeOfDay: number,
    dayOfWeek: number,
    historicalData: any
  ): Promise<Result<WarmupResult>> {
    // 시간대와 요일 기반 예측 워밍
    // ML 모델이나 통계 기반 예측 로직 구현
    
    // 예시: 특정 시간대에 자주 사용되는 데이터 워밍
    const predictedKeys = this.predictKeysForTime(timeOfDay, dayOfWeek, historicalData);
    
    return this.warmByPattern('predicted:*', (key) => ({
      key,
      predicted: true,
      timestamp: new Date()
    }));
  }

  private predictKeysForTime(
    timeOfDay: number, 
    dayOfWeek: number, 
    historicalData: any
  ): string[] {
    // 예측 로직 구현
    // 실제로는 ML 모델이나 통계 분석 사용
    return [`predicted_${timeOfDay}_${dayOfWeek}`];
  }
}