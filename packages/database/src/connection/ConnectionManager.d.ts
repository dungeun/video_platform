/**
 * @repo/database - Connection Manager
 *
 * 데이터베이스 연결을 관리하는 핵심 클래스
 * Zero Error Architecture 기반으로 설계됨
 */
import type { DatabaseConfig, ConnectionInfo, ConnectionOptions, DatabaseResult, PoolStats } from '../types';
export declare class ConnectionManager {
    private connections;
    private configs;
    private logger;
    private idCounter;
    private events;
    /**
     * 새 데이터베이스 연결 생성
     */
    connect(config: DatabaseConfig, _options?: ConnectionOptions): Promise<DatabaseResult>;
    /**
     * 데이터베이스 연결 해제
     */
    disconnect(connectionId?: string): Promise<DatabaseResult>;
    /**
     * 연결 정보 조회
     */
    getConnection(connectionId: string): ConnectionInfo | null;
    /**
     * 모든 연결 정보 조회
     */
    getConnections(): ConnectionInfo[];
    /**
     * 연결 상태 확인
     */
    isConnected(connectionId: string): boolean;
    /**
     * 연결 풀 통계 조회
     */
    getStats(connectionId: string): PoolStats | null;
    /**
     * 원시 연결 객체 반환 (내부 사용)
     */
    getRawConnection(connectionId: string): any;
    /**
     * 기본 연결 ID 반환
     */
    getDefaultConnectionId(): string | null;
    /**
     * 이벤트 리스너 등록
     */
    on(event: string, listener: (...args: any[]) => void): void;
    /**
     * 이벤트 리스너 제거
     */
    off(event: string, listener: (...args: any[]) => void): void;
    private generateConnectionId;
    private createConnection;
    private buildKnexConfig;
    private getKnexClient;
    private buildConnectionConfig;
    private testConnection;
    private setupConnectionEvents;
    private disconnectSingle;
    private disconnectAll;
}
//# sourceMappingURL=ConnectionManager.d.ts.map