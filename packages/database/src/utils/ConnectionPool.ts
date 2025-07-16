/**
 * @company/database - Connection Pool Utility
 * 
 * 데이터베이스 연결 풀을 관리하는 유틸리티 클래스
 */

import { Logger } from '@company/core';
import type { PoolConfig, PoolStats } from '../types';

export class ConnectionPool {
  private logger = new Logger('ConnectionPool');
  private config: PoolConfig;
  private stats: PoolStats;

  constructor(config: Partial<PoolConfig> = {}) {
    this.config = {
      min: config.min ?? 2,
      max: config.max ?? 10,
      idleTimeoutMillis: config.idleTimeoutMillis ?? 30000,
      acquireTimeoutMillis: config.acquireTimeoutMillis ?? 60000,
      createTimeoutMillis: config.createTimeoutMillis ?? 30000,
      destroyTimeoutMillis: config.destroyTimeoutMillis ?? 5000,
      reapIntervalMillis: config.reapIntervalMillis ?? 1000,
      createRetryIntervalMillis: config.createRetryIntervalMillis ?? 200
    };

    this.stats = {
      size: 0,
      available: 0,
      borrowed: 0,
      invalid: 0,
      pending: 0,
      max: this.config.max,
      min: this.config.min
    };
  }

  /**
   * 연결 풀 통계 반환
   */
  getStats(): PoolStats {
    return { ...this.stats };
  }

  /**
   * 연결 풀 설정 반환
   */
  getConfig(): PoolConfig {
    return { ...this.config };
  }

  /**
   * 연결 풀 상태 확인
   */
  isHealthy(): boolean {
    return this.stats.size >= this.config.min && 
           this.stats.size <= this.config.max &&
           this.stats.invalid === 0;
  }

  /**
   * 연결 풀 리소스 사용률 계산
   */
  getUtilization(): {
    usage: number;
    availability: number;
    pressure: number;
  } {
    const usage = this.stats.size > 0 ? this.stats.borrowed / this.stats.size : 0;
    const availability = this.stats.size > 0 ? this.stats.available / this.stats.size : 0;
    const pressure = this.stats.max > 0 ? this.stats.size / this.stats.max : 0;

    return {
      usage: Math.round(usage * 100) / 100,
      availability: Math.round(availability * 100) / 100,
      pressure: Math.round(pressure * 100) / 100
    };
  }

  /**
   * 연결 풀 경고 상태 확인
   */
  getWarnings(): string[] {
    const warnings: string[] = [];
    const utilization = this.getUtilization();

    if (utilization.usage > 0.8) {
      warnings.push('연결 사용률이 높습니다 (80% 초과)');
    }

    if (utilization.pressure > 0.9) {
      warnings.push('연결 풀 압력이 높습니다 (90% 초과)');
    }

    if (this.stats.pending > 5) {
      warnings.push('대기 중인 연결 요청이 많습니다');
    }

    if (this.stats.invalid > 0) {
      warnings.push('유효하지 않은 연결이 있습니다');
    }

    if (this.stats.size < this.config.min) {
      warnings.push('최소 연결 수보다 적습니다');
    }

    return warnings;
  }

  /**
   * 연결 풀 성능 메트릭스
   */
  getPerformanceMetrics(): {
    efficiency: number;
    turnover: number;
    waste: number;
    health: number;
  } {
    const utilization = this.getUtilization();
    
    // 효율성: 사용 중인 연결 비율
    const efficiency = utilization.usage;
    
    // 회전율: 전체 대비 사용 중인 연결
    const turnover = this.stats.size > 0 ? this.stats.borrowed / this.stats.max : 0;
    
    // 낭비율: 유휴 연결 비율
    const waste = utilization.availability;
    
    // 건강도: 전체적인 풀 상태
    const health = this.isHealthy() ? 1 : 0.5;

    return {
      efficiency: Math.round(efficiency * 100) / 100,
      turnover: Math.round(turnover * 100) / 100,
      waste: Math.round(waste * 100) / 100,
      health
    };
  }

  /**
   * 연결 풀 권장 설정 계산
   */
  getRecommendations(): {
    recommendedMin: number;
    recommendedMax: number;
    reason: string;
  } {
    const utilization = this.getUtilization();
    const currentMin = this.config.min;
    const currentMax = this.config.max;

    let recommendedMin = currentMin;
    let recommendedMax = currentMax;
    let reason = '현재 설정이 적절합니다';

    // 높은 사용률이면 풀 크기 증가 권장
    if (utilization.usage > 0.8 && utilization.pressure > 0.9) {
      recommendedMax = Math.min(currentMax * 1.5, 50);
      recommendedMin = Math.max(currentMin, Math.floor(recommendedMax * 0.2));
      reason = '높은 사용률로 인해 풀 크기 증가를 권장합니다';
    }
    
    // 낮은 사용률이면 풀 크기 감소 권장
    else if (utilization.usage < 0.3 && currentMax > 10) {
      recommendedMax = Math.max(Math.floor(currentMax * 0.7), 10);
      recommendedMin = Math.max(Math.floor(recommendedMax * 0.2), 2);
      reason = '낮은 사용률로 인해 풀 크기 감소를 권장합니다';
    }
    
    // 대기가 많으면 최대값 증가 권장
    else if (this.stats.pending > 5) {
      recommendedMax = Math.min(currentMax * 1.2, 30);
      reason = '대기 요청이 많아 최대 연결 수 증가를 권장합니다';
    }

    return {
      recommendedMin: Math.round(recommendedMin),
      recommendedMax: Math.round(recommendedMax),
      reason
    };
  }

  /**
   * 연결 풀 상태 요약
   */
  getSummary(): {
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    stats: PoolStats;
    utilization: ReturnType<ConnectionPool['getUtilization']>;
    warnings: string[];
    recommendations: ReturnType<ConnectionPool['getRecommendations']>;
  } {
    const warnings = this.getWarnings();
    const utilization = this.getUtilization();
    const recommendations = this.getRecommendations();

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    let message = '연결 풀이 정상 상태입니다';

    if (warnings.length > 0) {
      status = 'warning';
      message = `연결 풀에 ${warnings.length}개의 경고가 있습니다`;
    }

    if (warnings.length > 2 || utilization.pressure > 0.95 || this.stats.invalid > 0) {
      status = 'critical';
      message = '연결 풀에 심각한 문제가 있습니다';
    }

    return {
      status,
      message,
      stats: this.getStats(),
      utilization,
      warnings,
      recommendations
    };
  }

  /**
   * 연결 풀 모니터링 시작
   */
  startMonitoring(intervalMs: number = 10000): () => void {
    const interval = setInterval(() => {
      const summary = this.getSummary();
      
      if (summary.status === 'warning') {
        this.logger.warn('연결 풀 경고', {
          warnings: summary.warnings,
          stats: summary.stats,
          utilization: summary.utilization
        });
      } else if (summary.status === 'critical') {
        this.logger.error('연결 풀 심각한 문제', {
          warnings: summary.warnings,
          stats: summary.stats,
          utilization: summary.utilization
        });
      } else {
        this.logger.debug('연결 풀 정상', {
          stats: summary.stats,
          utilization: summary.utilization
        });
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }
}