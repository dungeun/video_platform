/**
 * @company/storage - 스토리지 시리얼라이저
 * 데이터 직렬화/역직렬화 유틸리티
 */
import { StorageSerializer as IStorageSerializer } from '../types';
export declare class StorageSerializer implements IStorageSerializer {
    private logger;
    constructor();
    /**
     * 값을 문자열로 직렬화
     */
    serialize<T>(value: T): string;
    /**
     * 문자열을 원래 값으로 역직렬화
     */
    deserialize<T>(value: string): T;
    /**
     * JSON.stringify replacer
     * 특수 타입 처리
     */
    private replacer;
    /**
     * JSON.parse reviver
     * 특수 타입 복원
     */
    private reviver;
    /**
     * 값이 직렬화 가능한지 확인
     */
    isSerializable(value: any): boolean;
    /**
     * 순환 참조 검사
     */
    hasCircularReference(obj: any): boolean;
    /**
     * 객체 깊은 복사
     */
    deepClone<T>(value: T): T;
    /**
     * 크기 계산 (바이트)
     */
    getSize(value: any): number;
}
//# sourceMappingURL=StorageSerializer.d.ts.map