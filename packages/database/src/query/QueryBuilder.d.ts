/**
 * @company/database - Query Builder
 *
 * SQL 쿼리를 체이닝 방식으로 구성하는 빌더 클래스
 * Zero Error Architecture 기반으로 설계됨
 */
import type { QueryBuilder as IQueryBuilder, QueryResult, QueryOperator, JoinType, OrderDirection } from '../types';
export declare class QueryBuilder implements IQueryBuilder {
    private logger;
    private knexQuery;
    private connection;
    constructor(connection: any);
    /**
     * SELECT 절 설정
     */
    select(columns?: string | string[]): QueryBuilder;
    /**
     * FROM 절 설정
     */
    from(table: string): QueryBuilder;
    /**
     * WHERE 절 추가
     */
    where(column: string, operator: QueryOperator, value?: any): QueryBuilder;
    /**
     * WHERE IN 절 추가
     */
    whereIn(column: string, values: any[]): QueryBuilder;
    /**
     * WHERE BETWEEN 절 추가
     */
    whereBetween(column: string, min: any, max: any): QueryBuilder;
    /**
     * WHERE NULL 절 추가
     */
    whereNull(column: string): QueryBuilder;
    /**
     * WHERE NOT NULL 절 추가
     */
    whereNotNull(column: string): QueryBuilder;
    /**
     * JOIN 절 추가
     */
    join(table: string, on: string, type?: JoinType): QueryBuilder;
    /**
     * LEFT JOIN 절 추가
     */
    leftJoin(table: string, on: string): QueryBuilder;
    /**
     * RIGHT JOIN 절 추가
     */
    rightJoin(table: string, on: string): QueryBuilder;
    /**
     * INNER JOIN 절 추가
     */
    innerJoin(table: string, on: string): QueryBuilder;
    /**
     * ORDER BY 절 추가
     */
    orderBy(column: string, direction?: OrderDirection): QueryBuilder;
    /**
     * GROUP BY 절 추가
     */
    groupBy(columns: string | string[]): QueryBuilder;
    /**
     * HAVING 절 추가
     */
    having(condition: string): QueryBuilder;
    /**
     * LIMIT 절 추가
     */
    limit(count: number): QueryBuilder;
    /**
     * OFFSET 절 추가
     */
    offset(count: number): QueryBuilder;
    /**
     * INSERT 쿼리 설정
     */
    insert(data: Record<string, any> | Record<string, any>[]): QueryBuilder;
    /**
     * UPDATE 쿼리 설정
     */
    update(data: Record<string, any>): QueryBuilder;
    /**
     * DELETE 쿼리 설정
     */
    delete(): QueryBuilder;
    /**
     * SQL과 바인딩 반환
     */
    toSQL(): {
        sql: string;
        bindings: any[];
    };
    /**
     * 쿼리 실행
     */
    execute<T = any>(): Promise<QueryResult<T>>;
    /**
     * 새로운 QueryBuilder 인스턴스 생성 (체이닝용)
     */
    clone(): QueryBuilder;
    /**
     * 원시 쿼리 실행
     */
    raw<T = any>(sql: string, bindings?: any[]): Promise<QueryResult<T>>;
}
//# sourceMappingURL=QueryBuilder.d.ts.map