/**
 * @repo/utils - 파일 처리 유틸리티
 */
import * as fs from 'fs/promises';
import * as path from 'path';
// ===== 파일 존재 확인 =====
/**
 * 파일 또는 디렉토리 존재 확인
 */
export async function exists(filePath) {
    try {
        if (typeof filePath !== 'string') {
            return { success: false, error: '파일 경로가 문자열이 아닙니다' };
        }
        await fs.access(filePath);
        return { success: true, data: true };
    }
    catch {
        return { success: true, data: false };
    }
}
/**
 * 파일 존재 확인 (디렉토리 제외)
 */
export async function isFile(filePath) {
    try {
        const existsResult = await exists(filePath);
        if (!existsResult.success || !existsResult.data) {
            return { success: true, data: false };
        }
        const stats = await fs.stat(filePath);
        return { success: true, data: stats.isFile() };
    }
    catch (error) {
        return { success: false, error: `파일 상태 확인 실패: ${error}` };
    }
}
/**
 * 디렉토리 존재 확인
 */
export async function isDirectory(dirPath) {
    try {
        const existsResult = await exists(dirPath);
        if (!existsResult.success || !existsResult.data) {
            return { success: true, data: false };
        }
        const stats = await fs.stat(dirPath);
        return { success: true, data: stats.isDirectory() };
    }
    catch (error) {
        return { success: false, error: `디렉토리 상태 확인 실패: ${error}` };
    }
}
// ===== 파일 읽기/쓰기 =====
/**
 * 텍스트 파일 읽기
 */
export async function readTextFile(filePath, encoding = 'utf8') {
    try {
        if (typeof filePath !== 'string') {
            return { success: false, error: '파일 경로가 문자열이 아닙니다' };
        }
        const isFileResult = await isFile(filePath);
        if (!isFileResult.success) {
            return { success: false, error: isFileResult.error };
        }
        if (!isFileResult.data) {
            return { success: false, error: '파일이 존재하지 않습니다' };
        }
        const content = await fs.readFile(filePath, encoding);
        return { success: true, data: content };
    }
    catch (error) {
        return { success: false, error: `파일 읽기 실패: ${error}` };
    }
}
/**
 * 바이너리 파일 읽기
 */
export async function readBinaryFile(filePath) {
    try {
        if (typeof filePath !== 'string') {
            return { success: false, error: '파일 경로가 문자열이 아닙니다' };
        }
        const isFileResult = await isFile(filePath);
        if (!isFileResult.success) {
            return { success: false, error: isFileResult.error };
        }
        if (!isFileResult.data) {
            return { success: false, error: '파일이 존재하지 않습니다' };
        }
        const buffer = await fs.readFile(filePath);
        return { success: true, data: buffer };
    }
    catch (error) {
        return { success: false, error: `바이너리 파일 읽기 실패: ${error}` };
    }
}
/**
 * JSON 파일 읽기
 */
export async function readJsonFile(filePath) {
    try {
        const textResult = await readTextFile(filePath);
        if (!textResult.success) {
            return { success: false, error: textResult.error };
        }
        const data = JSON.parse(textResult.data);
        return { success: true, data: data };
    }
    catch (error) {
        return { success: false, error: `JSON 파싱 실패: ${error}` };
    }
}
/**
 * 텍스트 파일 쓰기
 */
export async function writeTextFile(filePath, content, encoding = 'utf8') {
    try {
        if (typeof filePath !== 'string') {
            return { success: false, error: '파일 경로가 문자열이 아닙니다' };
        }
        if (typeof content !== 'string') {
            return { success: false, error: '내용이 문자열이 아닙니다' };
        }
        // 디렉토리 생성
        const dir = path.dirname(filePath);
        const createDirResult = await createDirectory(dir);
        if (!createDirResult.success) {
            return { success: false, error: createDirResult.error };
        }
        await fs.writeFile(filePath, content, encoding);
        return { success: true, data: undefined };
    }
    catch (error) {
        return { success: false, error: `파일 쓰기 실패: ${error}` };
    }
}
/**
 * 바이너리 파일 쓰기
 */
export async function writeBinaryFile(filePath, buffer) {
    try {
        if (typeof filePath !== 'string') {
            return { success: false, error: '파일 경로가 문자열이 아닙니다' };
        }
        if (!Buffer.isBuffer(buffer)) {
            return { success: false, error: '버퍼가 유효하지 않습니다' };
        }
        // 디렉토리 생성
        const dir = path.dirname(filePath);
        const createDirResult = await createDirectory(dir);
        if (!createDirResult.success) {
            return { success: false, error: createDirResult.error };
        }
        await fs.writeFile(filePath, buffer);
        return { success: true, data: undefined };
    }
    catch (error) {
        return { success: false, error: `바이너리 파일 쓰기 실패: ${error}` };
    }
}
/**
 * JSON 파일 쓰기
 */
export async function writeJsonFile(filePath, data, indent = 2) {
    try {
        const jsonString = JSON.stringify(data, null, indent);
        return await writeTextFile(filePath, jsonString);
    }
    catch (error) {
        return { success: false, error: `JSON 직렬화 실패: ${error}` };
    }
}
// ===== 파일 복사/이동/삭제 =====
/**
 * 파일 복사
 */
export async function copyFile(sourcePath, destPath) {
    try {
        if (typeof sourcePath !== 'string' || typeof destPath !== 'string') {
            return { success: false, error: '경로가 문자열이 아닙니다' };
        }
        const sourceExistsResult = await isFile(sourcePath);
        if (!sourceExistsResult.success) {
            return { success: false, error: sourceExistsResult.error };
        }
        if (!sourceExistsResult.data) {
            return { success: false, error: '원본 파일이 존재하지 않습니다' };
        }
        // 대상 디렉토리 생성
        const destDir = path.dirname(destPath);
        const createDirResult = await createDirectory(destDir);
        if (!createDirResult.success) {
            return { success: false, error: createDirResult.error };
        }
        await fs.copyFile(sourcePath, destPath);
        return { success: true, data: undefined };
    }
    catch (error) {
        return { success: false, error: `파일 복사 실패: ${error}` };
    }
}
/**
 * 파일 이동/이름변경
 */
export async function moveFile(sourcePath, destPath) {
    try {
        if (typeof sourcePath !== 'string' || typeof destPath !== 'string') {
            return { success: false, error: '경로가 문자열이 아닙니다' };
        }
        const sourceExistsResult = await isFile(sourcePath);
        if (!sourceExistsResult.success) {
            return { success: false, error: sourceExistsResult.error };
        }
        if (!sourceExistsResult.data) {
            return { success: false, error: '원본 파일이 존재하지 않습니다' };
        }
        // 대상 디렉토리 생성
        const destDir = path.dirname(destPath);
        const createDirResult = await createDirectory(destDir);
        if (!createDirResult.success) {
            return { success: false, error: createDirResult.error };
        }
        await fs.rename(sourcePath, destPath);
        return { success: true, data: undefined };
    }
    catch (error) {
        return { success: false, error: `파일 이동 실패: ${error}` };
    }
}
/**
 * 파일 삭제
 */
export async function deleteFile(filePath) {
    try {
        if (typeof filePath !== 'string') {
            return { success: false, error: '파일 경로가 문자열이 아닙니다' };
        }
        const existsResult = await exists(filePath);
        if (!existsResult.success) {
            return { success: false, error: existsResult.error };
        }
        if (!existsResult.data) {
            return { success: true, data: undefined }; // 이미 없으면 성공으로 처리
        }
        await fs.unlink(filePath);
        return { success: true, data: undefined };
    }
    catch (error) {
        return { success: false, error: `파일 삭제 실패: ${error}` };
    }
}
// ===== 디렉토리 관리 =====
/**
 * 디렉토리 생성 (재귀적)
 */
export async function createDirectory(dirPath) {
    try {
        if (typeof dirPath !== 'string') {
            return { success: false, error: '디렉토리 경로가 문자열이 아닙니다' };
        }
        const existsResult = await exists(dirPath);
        if (!existsResult.success) {
            return { success: false, error: existsResult.error };
        }
        if (existsResult.data) {
            const isDirResult = await isDirectory(dirPath);
            if (!isDirResult.success) {
                return { success: false, error: isDirResult.error };
            }
            if (isDirResult.data) {
                return { success: true, data: undefined }; // 이미 존재하는 디렉토리
            }
            else {
                return { success: false, error: '같은 이름의 파일이 존재합니다' };
            }
        }
        await fs.mkdir(dirPath, { recursive: true });
        return { success: true, data: undefined };
    }
    catch (error) {
        return { success: false, error: `디렉토리 생성 실패: ${error}` };
    }
}
/**
 * 디렉토리 내용 읽기
 */
export async function readDirectory(dirPath) {
    try {
        if (typeof dirPath !== 'string') {
            return { success: false, error: '디렉토리 경로가 문자열이 아닙니다' };
        }
        const isDirResult = await isDirectory(dirPath);
        if (!isDirResult.success) {
            return { success: false, error: isDirResult.error };
        }
        if (!isDirResult.data) {
            return { success: false, error: '디렉토리가 아닙니다' };
        }
        const entries = await fs.readdir(dirPath);
        return { success: true, data: entries };
    }
    catch (error) {
        return { success: false, error: `디렉토리 읽기 실패: ${error}` };
    }
}
/**
 * 디렉토리 삭제 (재귀적)
 */
export async function deleteDirectory(dirPath) {
    try {
        if (typeof dirPath !== 'string') {
            return { success: false, error: '디렉토리 경로가 문자열이 아닙니다' };
        }
        const existsResult = await exists(dirPath);
        if (!existsResult.success) {
            return { success: false, error: existsResult.error };
        }
        if (!existsResult.data) {
            return { success: true, data: undefined }; // 이미 없으면 성공으로 처리
        }
        await fs.rm(dirPath, { recursive: true, force: true });
        return { success: true, data: undefined };
    }
    catch (error) {
        return { success: false, error: `디렉토리 삭제 실패: ${error}` };
    }
}
// ===== 파일 정보 =====
/**
 * 파일 정보 가져오기
 */
export async function getFileInfo(filePath) {
    try {
        if (typeof filePath !== 'string') {
            return { success: false, error: '파일 경로가 문자열이 아닙니다' };
        }
        const existsResult = await exists(filePath);
        if (!existsResult.success) {
            return { success: false, error: existsResult.error };
        }
        if (!existsResult.data) {
            return { success: false, error: '파일이 존재하지 않습니다' };
        }
        const stats = await fs.stat(filePath);
        const name = path.basename(filePath);
        const extension = path.extname(filePath);
        const mimeType = getMimeType(extension);
        const fileInfo = {
            name,
            path: filePath,
            size: stats.size,
            extension,
            mimeType,
            isDirectory: stats.isDirectory(),
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime
        };
        return { success: true, data: fileInfo };
    }
    catch (error) {
        return { success: false, error: `파일 정보 가져오기 실패: ${error}` };
    }
}
/**
 * 파일 크기 가져오기
 */
export async function getFileSize(filePath) {
    try {
        const fileInfoResult = await getFileInfo(filePath);
        if (!fileInfoResult.success) {
            return { success: false, error: fileInfoResult.error };
        }
        return { success: true, data: fileInfoResult.data.size };
    }
    catch (error) {
        return { success: false, error: `파일 크기 가져오기 실패: ${error}` };
    }
}
// ===== 경로 유틸리티 =====
/**
 * 절대 경로로 변환
 */
export function getAbsolutePath(filePath) {
    try {
        if (typeof filePath !== 'string') {
            return { success: false, error: '파일 경로가 문자열이 아닙니다' };
        }
        const absolutePath = path.resolve(filePath);
        return { success: true, data: absolutePath };
    }
    catch (error) {
        return { success: false, error: `절대 경로 변환 실패: ${error}` };
    }
}
/**
 * 상대 경로 계산
 */
export function getRelativePath(from, to) {
    try {
        if (typeof from !== 'string' || typeof to !== 'string') {
            return { success: false, error: '경로가 문자열이 아닙니다' };
        }
        const relativePath = path.relative(from, to);
        return { success: true, data: relativePath };
    }
    catch (error) {
        return { success: false, error: `상대 경로 계산 실패: ${error}` };
    }
}
/**
 * 경로 정규화
 */
export function normalizePath(filePath) {
    try {
        if (typeof filePath !== 'string') {
            return { success: false, error: '파일 경로가 문자열이 아닙니다' };
        }
        const normalizedPath = path.normalize(filePath);
        return { success: true, data: normalizedPath };
    }
    catch (error) {
        return { success: false, error: `경로 정규화 실패: ${error}` };
    }
}
/**
 * 경로 조인
 */
export function joinPath(...segments) {
    try {
        if (!segments.every(segment => typeof segment === 'string')) {
            return { success: false, error: '모든 세그먼트가 문자열이어야 합니다' };
        }
        const joinedPath = path.join(...segments);
        return { success: true, data: joinedPath };
    }
    catch (error) {
        return { success: false, error: `경로 조인 실패: ${error}` };
    }
}
// ===== MIME 타입 =====
/**
 * 파일 확장자로 MIME 타입 추정
 */
export function getMimeType(extension) {
    const mimeTypes = {
        '.txt': 'text/plain',
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.xml': 'application/xml',
        '.pdf': 'application/pdf',
        '.zip': 'application/zip',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.mp3': 'audio/mpeg',
        '.mp4': 'video/mp4',
        '.avi': 'video/x-msvideo',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    const ext = extension.toLowerCase();
    return mimeTypes[ext] || 'application/octet-stream';
}
/**
 * 안전한 파일명 생성
 */
export function sanitizeFileName(fileName) {
    try {
        if (typeof fileName !== 'string') {
            return { success: false, error: '파일명이 문자열이 아닙니다' };
        }
        // 위험한 문자 제거/치환
        const sanitized = fileName
            .replace(/[<>:"/\\|?*]/g, '_') // Windows 금지 문자
            .replace(/[\x00-\x1f\x80-\x9f]/g, '') // 제어 문자
            .replace(/^\.+/, '') // 시작 점 제거
            .replace(/\.+$/, '') // 끝 점 제거
            .replace(/\s+/g, '_') // 공백을 언더스코어로
            .slice(0, 255); // 길이 제한
        if (sanitized.length === 0) {
            return { success: false, error: '유효한 파일명이 생성되지 않았습니다' };
        }
        return { success: true, data: sanitized };
    }
    catch (error) {
        return { success: false, error: `파일명 정리 실패: ${error}` };
    }
}
/**
 * 고유한 파일명 생성
 */
export async function generateUniqueFileName(dirPath, baseName) {
    try {
        if (typeof dirPath !== 'string' || typeof baseName !== 'string') {
            return { success: false, error: '경로와 파일명이 문자열이어야 합니다' };
        }
        const ext = path.extname(baseName);
        const nameWithoutExt = path.basename(baseName, ext);
        let counter = 0;
        let fileName = baseName;
        while (true) {
            const fullPath = path.join(dirPath, fileName);
            const existsResult = await exists(fullPath);
            if (!existsResult.success) {
                return { success: false, error: existsResult.error };
            }
            if (!existsResult.data) {
                return { success: true, data: fileName };
            }
            counter++;
            fileName = `${nameWithoutExt}_${counter}${ext}`;
        }
    }
    catch (error) {
        return { success: false, error: `고유 파일명 생성 실패: ${error}` };
    }
}
//# sourceMappingURL=index.js.map