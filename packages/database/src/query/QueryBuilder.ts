/**
 * @repo/database - Query Builder
 * 
 * SQL 쿼리를 체이닝 방식으로 구성하는 빌더 클래스
 * Zero Error Architecture 기반으로 설계됨
 */

import { Logger } from '@repo/core';
import type {
  QueryBuilder as IQueryBuilder,
  QueryResult,
  QueryOperator,
  JoinType,
  OrderDirection
} from '../types';
import { QueryError } from '../types';

export class QueryBuilder implements IQueryBuilder {
  private logger = new Logger('QueryBuilder');
  private knexQuery: any;
  private connection: any;

  constructor(connection: any) {
    this.connection = connection;
    this.knexQuery = connection.queryBuilder();
  }

  /**
   * SELECT 절 설정
   */
  select(columns?: string | string[]): QueryBuilder {
    try {
      if (columns) {
        if (typeof columns === 'string') {
          this.knexQuery = this.knexQuery.select(columns);
        } else {
          this.knexQuery = this.knexQuery.select(...columns);
        }
      } else {
        this.knexQuery = this.knexQuery.select('*');
      }
      return this;
    } catch (error) {
      this.logger.error('SELECT 절 설정 실패', { columns, error });
      throw new QueryError(`SELECT 절 설정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * FROM 절 설정
   */
  from(table: string): QueryBuilder {
    try {
      this.knexQuery = this.knexQuery.from(table);
      return this;
    } catch (error) {
      this.logger.error('FROM 절 설정 실패', { table, error });
      throw new QueryError(`FROM 절 설정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * WHERE 절 추가
   */
  where(column: string, operator: QueryOperator, value?: any): QueryBuilder {
    try {
      if (operator === 'IS NULL') {
        this.knexQuery = this.knexQuery.whereNull(column);
      } else if (operator === 'IS NOT NULL') {
        this.knexQuery = this.knexQuery.whereNotNull(column);
      } else {
        this.knexQuery = this.knexQuery.where(column, operator, value);
      }
      return this;
    } catch (error) {
      this.logger.error('WHERE 절 설정 실패', { column, operator, value, error });
      throw new QueryError(`WHERE 절 설정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * WHERE IN 절 추가
   */
  whereIn(column: string, values: any[]): QueryBuilder {
    try {
      this.knexQuery = this.knexQuery.whereIn(column, values);
      return this;
    } catch (error) {
      this.logger.error('WHERE IN 절 설정 실패', { column, values, error });
      throw new QueryError(`WHERE IN 절 설정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * WHERE BETWEEN 절 추가
   */
  whereBetween(column: string, min: any, max: any): QueryBuilder {
    try {
      this.knexQuery = this.knexQuery.whereBetween(column, [min, max]);
      return this;
    } catch (error) {
      this.logger.error('WHERE BETWEEN 절 설정 실패', { column, min, max, error });
      throw new QueryError(`WHERE BETWEEN 절 설정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * WHERE NULL 절 추가
   */
  whereNull(column: string): QueryBuilder {
    try {
      this.knexQuery = this.knexQuery.whereNull(column);
      return this;
    } catch (error) {
      this.logger.error('WHERE NULL 절 설정 실패', { column, error });
      throw new QueryError(`WHERE NULL 절 설정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * WHERE NOT NULL 절 추가
   */
  whereNotNull(column: string): QueryBuilder {
    try {
      this.knexQuery = this.knexQuery.whereNotNull(column);
      return this;
    } catch (error) {
      this.logger.error('WHERE NOT NULL 절 설정 실패', { column, error });
      throw new QueryError(`WHERE NOT NULL 절 설정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * JOIN 절 추가
   */
  join(table: string, on: string, type: JoinType = 'INNER'): QueryBuilder {
    try {
      switch (type) {
        case 'INNER':
          this.knexQuery = this.knexQuery.innerJoin(table, on);
          break;
        case 'LEFT':
          this.knexQuery = this.knexQuery.leftJoin(table, on);
          break;
        case 'RIGHT':
          this.knexQuery = this.knexQuery.rightJoin(table, on);
          break;
        case 'FULL':
          this.knexQuery = this.knexQuery.fullOuterJoin(table, on);
          break;
        default:
          throw new Error(`지원하지 않는 조인 타입: ${type}`);
      }
      return this;
    } catch (error) {
      this.logger.error('JOIN 절 설정 실패', { table, on, type, error });
      throw new QueryError(`JOIN 절 설정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * LEFT JOIN 절 추가
   */
  leftJoin(table: string, on: string): QueryBuilder {
    return this.join(table, on, 'LEFT');
  }

  /**
   * RIGHT JOIN 절 추가
   */
  rightJoin(table: string, on: string): QueryBuilder {
    return this.join(table, on, 'RIGHT');
  }

  /**
   * INNER JOIN 절 추가
   */
  innerJoin(table: string, on: string): QueryBuilder {
    return this.join(table, on, 'INNER');
  }

  /**
   * ORDER BY 절 추가
   */
  orderBy(column: string, direction: OrderDirection = 'ASC'): QueryBuilder {
    try {
      this.knexQuery = this.knexQuery.orderBy(column, direction);
      return this;
    } catch (error) {
      this.logger.error('ORDER BY 절 설정 실패', { column, direction, error });
      throw new QueryError(`ORDER BY 절 설정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * GROUP BY 절 추가
   */
  groupBy(columns: string | string[]): QueryBuilder {
    try {
      if (typeof columns === 'string') {
        this.knexQuery = this.knexQuery.groupBy(columns);
      } else {
        this.knexQuery = this.knexQuery.groupBy(...columns);
      }
      return this;
    } catch (error) {
      this.logger.error('GROUP BY 절 설정 실패', { columns, error });
      throw new QueryError(`GROUP BY 절 설정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * HAVING 절 추가
   */
  having(condition: string): QueryBuilder {
    try {
      this.knexQuery = this.knexQuery.havingRaw(condition);
      return this;
    } catch (error) {
      this.logger.error('HAVING 절 설정 실패', { condition, error });
      throw new QueryError(`HAVING 절 설정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * LIMIT 절 추가
   */
  limit(count: number): QueryBuilder {
    try {
      this.knexQuery = this.knexQuery.limit(count);
      return this;
    } catch (error) {
      this.logger.error('LIMIT 절 설정 실패', { count, error });
      throw new QueryError(`LIMIT 절 설정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * OFFSET 절 추가
   */
  offset(count: number): QueryBuilder {
    try {
      this.knexQuery = this.knexQuery.offset(count);
      return this;
    } catch (error) {
      this.logger.error('OFFSET 절 설정 실패', { count, error });
      throw new QueryError(`OFFSET 절 설정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * INSERT 쿼리 설정
   */
  insert(data: Record<string, any> | Record<string, any>[]): QueryBuilder {
    try {
      this.knexQuery = this.knexQuery.insert(data);
      return this;
    } catch (error) {
      this.logger.error('INSERT 쿼리 설정 실패', { data, error });
      throw new QueryError(`INSERT 쿼리 설정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * UPDATE 쿼리 설정
   */
  update(data: Record<string, any>): QueryBuilder {
    try {
      this.knexQuery = this.knexQuery.update(data);
      return this;
    } catch (error) {
      this.logger.error('UPDATE 쿼리 설정 실패', { data, error });
      throw new QueryError(`UPDATE 쿼리 설정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * DELETE 쿼리 설정
   */
  delete(): QueryBuilder {
    try {
      this.knexQuery = this.knexQuery.del();
      return this;
    } catch (error) {
      this.logger.error('DELETE 쿼리 설정 실패', { error });
      throw new QueryError(`DELETE 쿼리 설정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * SQL과 바인딩 반환
   */
  toSQL(): { sql: string; bindings: any[] } {
    try {
      const compiled = this.knexQuery.toSQL();
      return {
        sql: compiled.sql,
        bindings: compiled.bindings || []
      };
    } catch (error) {
      this.logger.error('SQL 생성 실패', { error });
      throw new QueryError(`SQL 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 쿼리 실행
   */
  async execute<T = any>(): Promise<QueryResult<T>> {
    const startTime = Date.now();
    
    try {
      const { sql, bindings } = this.toSQL();
      
      this.logger.debug('쿼리 실행 시작', { sql, bindings });
      
      const result = await this.knexQuery;
      const executionTime = Date.now() - startTime;
      
      // 결과 타입에 따른 처리
      let processedResult: QueryResult<T>;
      
      if (Array.isArray(result)) {
        // SELECT 쿼리 결과
        processedResult = {
          success: true,
          data: result as T[],
          rowCount: result.length,
          executionTime
        };
      } else if (typeof result === 'object' && result !== null) {
        // INSERT/UPDATE/DELETE 쿼리 결과
        processedResult = {
          success: true,
          data: [result] as T[],
          rowCount: result.affectedRows || result.changes || 0,
          insertId: result.insertId || result.lastInsertRowid,
          affectedRows: result.affectedRows || result.changes || 0,
          executionTime
        };
      } else {
        // 기타 결과
        processedResult = {
          success: true,
          data: [result] as T[],
          rowCount: 1,
          executionTime
        };
      }
      
      this.logger.debug('쿼리 실행 완료', { 
        sql, 
        rowCount: processedResult.rowCount, 
        executionTime 
      });
      
      return processedResult;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : '쿼리 실행 실패';
      
      this.logger.error('쿼리 실행 실패', { 
        error: errorMessage, 
        executionTime 
      });
      
      return {
        success: false,
        error: errorMessage,
        executionTime
      };
    }
  }

  /**
   * 새로운 QueryBuilder 인스턴스 생성 (체이닝용)
   */
  clone(): QueryBuilder {
    const newBuilder = new QueryBuilder(this.connection);
    newBuilder.knexQuery = this.knexQuery.clone();
    return newBuilder;
  }

  /**
   * 원시 쿼리 실행
   */
  async raw<T = any>(sql: string, bindings?: any[]): Promise<QueryResult<T>> {
    const startTime = Date.now();
    
    try {
      this.logger.debug('원시 쿼리 실행 시작', { sql, bindings });
      
      const result = await this.connection.raw(sql, bindings);
      const executionTime = Date.now() - startTime;
      
      this.logger.debug('원시 쿼리 실행 완료', { sql, executionTime });
      
      return {
        success: true,
        data: result.rows || result,
        rowCount: Array.isArray(result.rows) ? result.rows.length : 1,
        executionTime
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : '원시 쿼리 실행 실패';
      
      this.logger.error('원시 쿼리 실행 실패', { 
        sql, 
        bindings, 
        error: errorMessage, 
        executionTime 
      });
      
      return {
        success: false,
        error: errorMessage,
        executionTime
      };
    }
  }
}