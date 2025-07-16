/**
 * @repo/permissions - 권한 평가 서비스
 * Advanced permission evaluation with complex condition support
 */

import { Logger } from '@repo/core';
import {
  Permission,
  PermissionCondition,
  PermissionContext,
  PermissionEvaluationResult,
  ConditionEvaluationResult,
  ConditionOperator,
  LogicalOperator,
  PermissionError,
  PermissionErrorCode,
  ScopeType
} from '../types';

export class PermissionEvaluator {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('PermissionEvaluator');
  }

  /**
   * 권한 평가
   */
  public evaluatePermission(
    permission: Permission,
    context: PermissionContext
  ): PermissionEvaluationResult {
    try {
      this.logger.debug('권한 평가 시작', { 
        permission: permission.name, 
        userId: context.userId 
      });

      // 스코프 검증
      const scopeResult = this.evaluateScope(permission, context);
      if (!scopeResult.granted) {
        return scopeResult;
      }

      // 조건 평가
      if (!permission.conditions || permission.conditions.length === 0) {
        return {
          granted: true,
          reason: '조건이 없으므로 권한이 허용됩니다'
        };
      }

      const conditionResults = this.evaluateConditions(permission.conditions, context);
      const granted = this.combineConditionResults(conditionResults, permission.conditions);

      return {
        granted,
        reason: granted ? '모든 조건을 만족합니다' : '일부 조건을 만족하지 않습니다',
        conditions: conditionResults
      };

    } catch (error) {
      this.logger.error('권한 평가 실패', error);
      
      throw new PermissionError(
        PermissionErrorCode.EVALUATION_FAILED,
        `권한 평가 실패: ${permission.name}`,
        { permission: permission.name, userId: context.userId, error }
      );
    }
  }

  /**
   * 여러 권한의 배치 평가
   */
  public evaluatePermissions(
    permissions: Permission[],
    context: PermissionContext
  ): Map<string, PermissionEvaluationResult> {
    const results = new Map<string, PermissionEvaluationResult>();

    permissions.forEach(permission => {
      try {
        const result = this.evaluatePermission(permission, context);
        results.set(permission.name, result);
      } catch (error) {
        results.set(permission.name, {
          granted: false,
          reason: `평가 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    });

    return results;
  }

  /**
   * 조건부 권한 평가
   */
  public evaluateConditionalPermission(
    basePermission: string,
    conditions: PermissionCondition[],
    context: PermissionContext
  ): PermissionEvaluationResult {
    try {
      const conditionResults = this.evaluateConditions(conditions, context);
      const granted = this.combineConditionResults(conditionResults, conditions);

      return {
        granted,
        reason: granted ? '조건을 만족합니다' : '조건을 만족하지 않습니다',
        conditions: conditionResults
      };

    } catch (error) {
      throw new PermissionError(
        PermissionErrorCode.EVALUATION_FAILED,
        `조건부 권한 평가 실패: ${basePermission}`,
        { permission: basePermission, conditions, error }
      );
    }
  }

  // ===== Private Methods =====

  /**
   * 스코프 평가
   */
  private evaluateScope(
    permission: Permission,
    context: PermissionContext
  ): PermissionEvaluationResult {
    if (!permission.scope) {
      return { granted: true, reason: '스코프 제한이 없습니다' };
    }

    const { type, values, excludes } = permission.scope;

    // 컨텍스트에서 스코프 값 추출
    const contextValue = this.extractScopeValue(type, context);
    
    if (!contextValue) {
      return { 
        granted: false, 
        reason: `스코프 정보를 찾을 수 없습니다: ${type}` 
      };
    }

    // 제외 목록 확인
    if (excludes && excludes.includes(contextValue)) {
      return { 
        granted: false, 
        reason: `제외된 스코프입니다: ${contextValue}` 
      };
    }

    // 허용 목록 확인
    if (values.length > 0 && !values.includes(contextValue)) {
      return { 
        granted: false, 
        reason: `허용되지 않은 스코프입니다: ${contextValue}` 
      };
    }

    return { granted: true, reason: '스코프 조건을 만족합니다' };
  }

  /**
   * 스코프 값 추출
   */
  private extractScopeValue(type: ScopeType, context: PermissionContext): string | null {
    switch (type) {
      case ScopeType.USER:
        return context.userId;
      case ScopeType.ORGANIZATION:
        return context.metadata?.organizationId || null;
      case ScopeType.DEPARTMENT:
        return context.metadata?.departmentId || null;
      case ScopeType.PROJECT:
        return context.metadata?.projectId || null;
      case ScopeType.TEAM:
        return context.metadata?.teamId || null;
      case ScopeType.GLOBAL:
        return 'global';
      default:
        return null;
    }
  }

  /**
   * 조건들 평가
   */
  private evaluateConditions(
    conditions: PermissionCondition[],
    context: PermissionContext
  ): ConditionEvaluationResult[] {
    return conditions.map(condition => this.evaluateCondition(condition, context));
  }

  /**
   * 단일 조건 평가
   */
  private evaluateCondition(
    condition: PermissionCondition,
    context: PermissionContext
  ): ConditionEvaluationResult {
    try {
      const actualValue = this.getNestedValue(context, condition.field);
      const result = this.compareValues(actualValue, condition.operator, condition.value);

      return {
        condition,
        result,
        actualValue,
        reason: this.getConditionReason(condition, actualValue, result)
      };

    } catch (error) {
      this.logger.warn('조건 평가 실패', { condition, error });
      
      return {
        condition,
        result: false,
        reason: `조건 평가 오류: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * 조건 결과들을 논리 연산자로 결합
   */
  private combineConditionResults(
    results: ConditionEvaluationResult[],
    conditions: PermissionCondition[]
  ): boolean {
    if (results.length === 0) {
      return true;
    }

    if (results.length === 1) {
      return results[0].result;
    }

    // 기본적으로 AND 연산 (모든 조건이 true여야 함)
    let combinedResult = true;
    
    for (let i = 0; i < results.length; i++) {
      const condition = conditions[i];
      const result = results[i];

      if (condition.logicalOperator === LogicalOperator.OR) {
        // OR 연산: 이전 결과가 false이고 현재 결과가 true면 true
        if (!combinedResult && result.result) {
          combinedResult = true;
        }
      } else if (condition.logicalOperator === LogicalOperator.NOT) {
        // NOT 연산: 결과를 반전
        combinedResult = combinedResult && !result.result;
      } else {
        // AND 연산 (기본값)
        combinedResult = combinedResult && result.result;
      }
    }

    return combinedResult;
  }

  /**
   * 값 비교
   */
  private compareValues(actual: any, operator: ConditionOperator, expected: any): boolean {
    switch (operator) {
      case ConditionOperator.EQ:
        return this.strictEquals(actual, expected);
      
      case ConditionOperator.NE:
        return !this.strictEquals(actual, expected);
      
      case ConditionOperator.IN:
        return Array.isArray(expected) && expected.includes(actual);
      
      case ConditionOperator.NIN:
        return Array.isArray(expected) && !expected.includes(actual);
      
      case ConditionOperator.GT:
        return this.compareNumbers(actual, expected, (a, e) => a > e);
      
      case ConditionOperator.GTE:
        return this.compareNumbers(actual, expected, (a, e) => a >= e);
      
      case ConditionOperator.LT:
        return this.compareNumbers(actual, expected, (a, e) => a < e);
      
      case ConditionOperator.LTE:
        return this.compareNumbers(actual, expected, (a, e) => a <= e);
      
      case ConditionOperator.CONTAINS:
        return this.stringContains(actual, expected);
      
      case ConditionOperator.STARTS_WITH:
        return String(actual).startsWith(String(expected));
      
      case ConditionOperator.ENDS_WITH:
        return String(actual).endsWith(String(expected));
      
      case ConditionOperator.REGEX:
        return this.regexMatch(actual, expected);
      
      default:
        this.logger.warn('알 수 없는 조건 연산자', { operator });
        return false;
    }
  }

  /**
   * 엄격한 동등성 비교
   */
  private strictEquals(actual: any, expected: any): boolean {
    // null/undefined 처리
    if (actual == null || expected == null) {
      return actual === expected;
    }

    // 타입이 다르면 false
    if (typeof actual !== typeof expected) {
      return false;
    }

    // 객체인 경우 깊은 비교
    if (typeof actual === 'object') {
      return JSON.stringify(actual) === JSON.stringify(expected);
    }

    return actual === expected;
  }

  /**
   * 숫자 비교
   */
  private compareNumbers(
    actual: any, 
    expected: any, 
    compareFn: (a: number, e: number) => boolean
  ): boolean {
    const actualNum = Number(actual);
    const expectedNum = Number(expected);

    if (isNaN(actualNum) || isNaN(expectedNum)) {
      return false;
    }

    return compareFn(actualNum, expectedNum);
  }

  /**
   * 문자열 포함 검사
   */
  private stringContains(actual: any, expected: any): boolean {
    if (actual == null || expected == null) {
      return false;
    }

    const actualStr = String(actual).toLowerCase();
    const expectedStr = String(expected).toLowerCase();

    return actualStr.includes(expectedStr);
  }

  /**
   * 정규식 매칭
   */
  private regexMatch(actual: any, pattern: any): boolean {
    try {
      const regex = new RegExp(String(pattern), 'i'); // case-insensitive
      return regex.test(String(actual));
    } catch (error) {
      this.logger.warn('정규식 패턴 오류', { pattern, error });
      return false;
    }
  }

  /**
   * 중첩된 객체에서 값 추출
   */
  private getNestedValue(obj: any, path: string): any {
    if (!path || !obj) {
      return null;
    }

    return path.split('.').reduce((current, key) => {
      if (current == null) {
        return null;
      }

      // 배열 인덱스 처리 (예: "items[0].name")
      const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, arrayKey, index] = arrayMatch;
        const array = current[arrayKey];
        return Array.isArray(array) ? array[parseInt(index, 10)] : null;
      }

      return current[key];
    }, obj);
  }

  /**
   * 조건 결과 설명 생성
   */
  private getConditionReason(
    condition: PermissionCondition,
    actualValue: any,
    result: boolean
  ): string {
    const { field, operator, value } = condition;

    if (result) {
      return `조건 만족: ${field} ${operator} ${JSON.stringify(value)}`;
    }

    return `조건 불만족: ${field}(${JSON.stringify(actualValue)}) ${operator} ${JSON.stringify(value)}`;
  }
}