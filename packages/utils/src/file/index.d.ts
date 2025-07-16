/**
 * @company/utils - 파일 처리 유틸리티
 */
import { Result as CoreResult } from '@company/core';
export type Result<T> = CoreResult<T, string>;
export interface FileInfo {
    name: string;
    path: string;
    size: number;
    extension: string;
    mimeType: string;
    isDirectory: boolean;
    createdAt: Date;
    modifiedAt: Date;
}
export interface DirectoryInfo {
    name: string;
    path: string;
    files: FileInfo[];
    directories: DirectoryInfo[];
    totalSize: number;
    fileCount: number;
    directoryCount: number;
}
/**
 * 파일 또는 디렉토리 존재 확인
 */
export declare function exists(filePath: string): Promise<Result<boolean>>;
/**
 * 파일 존재 확인 (디렉토리 제외)
 */
export declare function isFile(filePath: string): Promise<Result<boolean>>;
/**
 * 디렉토리 존재 확인
 */
export declare function isDirectory(dirPath: string): Promise<Result<boolean>>;
/**
 * 텍스트 파일 읽기
 */
export declare function readTextFile(filePath: string, encoding?: BufferEncoding): Promise<Result<string>>;
/**
 * 바이너리 파일 읽기
 */
export declare function readBinaryFile(filePath: string): Promise<Result<Buffer>>;
/**
 * JSON 파일 읽기
 */
export declare function readJsonFile<T = any>(filePath: string): Promise<Result<T>>;
/**
 * 텍스트 파일 쓰기
 */
export declare function writeTextFile(filePath: string, content: string, encoding?: BufferEncoding): Promise<Result<void>>;
/**
 * 바이너리 파일 쓰기
 */
export declare function writeBinaryFile(filePath: string, buffer: Buffer): Promise<Result<void>>;
/**
 * JSON 파일 쓰기
 */
export declare function writeJsonFile(filePath: string, data: any, indent?: number): Promise<Result<void>>;
/**
 * 파일 복사
 */
export declare function copyFile(sourcePath: string, destPath: string): Promise<Result<void>>;
/**
 * 파일 이동/이름변경
 */
export declare function moveFile(sourcePath: string, destPath: string): Promise<Result<void>>;
/**
 * 파일 삭제
 */
export declare function deleteFile(filePath: string): Promise<Result<void>>;
/**
 * 디렉토리 생성 (재귀적)
 */
export declare function createDirectory(dirPath: string): Promise<Result<void>>;
/**
 * 디렉토리 내용 읽기
 */
export declare function readDirectory(dirPath: string): Promise<Result<string[]>>;
/**
 * 디렉토리 삭제 (재귀적)
 */
export declare function deleteDirectory(dirPath: string): Promise<Result<void>>;
/**
 * 파일 정보 가져오기
 */
export declare function getFileInfo(filePath: string): Promise<Result<FileInfo>>;
/**
 * 파일 크기 가져오기
 */
export declare function getFileSize(filePath: string): Promise<Result<number>>;
/**
 * 절대 경로로 변환
 */
export declare function getAbsolutePath(filePath: string): Result<string>;
/**
 * 상대 경로 계산
 */
export declare function getRelativePath(from: string, to: string): Result<string>;
/**
 * 경로 정규화
 */
export declare function normalizePath(filePath: string): Result<string>;
/**
 * 경로 조인
 */
export declare function joinPath(...segments: string[]): Result<string>;
/**
 * 파일 확장자로 MIME 타입 추정
 */
export declare function getMimeType(extension: string): string;
/**
 * 안전한 파일명 생성
 */
export declare function sanitizeFileName(fileName: string): Result<string>;
/**
 * 고유한 파일명 생성
 */
export declare function generateUniqueFileName(dirPath: string, baseName: string): Promise<Result<string>>;
//# sourceMappingURL=index.d.ts.map