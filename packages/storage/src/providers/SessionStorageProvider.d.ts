/**
 * @company/storage - SessionStorage 프로바이더
 * 브라우저 SessionStorage 기반 스토리지
 */
import { LocalStorageProvider } from './LocalStorageProvider';
import { StorageType, SessionStorageConfig } from '../types';
export declare class SessionStorageProvider extends LocalStorageProvider {
    readonly name = "SessionStorage";
    readonly type = StorageType.SESSION;
    constructor(config?: SessionStorageConfig);
    /**
     * SessionStorage 사용 가능 여부
     */
    get isAvailable(): boolean;
    /**
     * 값 조회 - sessionStorage 사용
     */
    get<T>(key: string): Promise<import('@company/core').Result<T | null>>;
    /**
     * 값 저장 - sessionStorage 사용
     */
    set<T>(key: string, value: T, options?: import('../types').StorageOptions): Promise<import('@company/core').Result<void>>;
    /**
     * 값 삭제 - sessionStorage 사용
     */
    delete(key: string): Promise<import('@company/core').Result<void>>;
    /**
     * 키 존재 여부 확인 - sessionStorage 사용
     */
    exists(key: string): Promise<import('@company/core').Result<boolean>>;
    /**
     * 키 목록 조회 - sessionStorage 사용
     */
    keys(query?: import('../types').StorageQuery): Promise<import('@company/core').Result<string[]>>;
    /**
     * 스토리지 초기화 - sessionStorage 사용
     */
    clear(namespace?: string): Promise<import('@company/core').Result<void>>;
    /**
     * 스토리지 크기 조회 - sessionStorage 사용
     */
    size(namespace?: string): Promise<import('@company/core').Result<number>>;
    /**
     * 만료된 항목 정리 - sessionStorage 사용
     */
    cleanup(): Promise<number>;
}
//# sourceMappingURL=SessionStorageProvider.d.ts.map