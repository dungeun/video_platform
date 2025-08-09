/**
 * HTML 살균 유틸리티
 * XSS 공격을 방지하기 위한 HTML 콘텐츠 정화
 */

import DOMPurify from 'isomorphic-dompurify';

// DOMPurify 설정
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'code', 'pre', 'span', 'div'
];

const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'id', 'style'
];

const ALLOWED_STYLES = {
  'color': true,
  'background-color': true,
  'font-size': true,
  'font-weight': true,
  'text-align': true,
  'margin': true,
  'padding': true,
};

interface SanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  allowedStyles?: Record<string, boolean>;
  allowImages?: boolean;
  allowLinks?: boolean;
  stripIgnoreTag?: boolean;
  stripIgnoreTagBody?: boolean;
}

/**
 * HTML 콘텐츠를 살균하여 XSS 공격 방지
 * @param dirty 정화되지 않은 HTML 문자열
 * @param options 살균 옵션
 * @returns 정화된 HTML 문자열
 */
export function sanitizeHtml(dirty: string, options: SanitizeOptions = {}): string {
  // null이나 undefined 처리
  if (!dirty) {
    return '';
  }

  // 문자열이 아닌 경우 문자열로 변환
  if (typeof dirty !== 'string') {
    dirty = String(dirty);
  }

  const config: any = {
    ALLOWED_TAGS: options.allowedTags || ALLOWED_TAGS,
    ALLOWED_ATTR: options.allowedAttributes || ALLOWED_ATTR,
    KEEP_CONTENT: !options.stripIgnoreTag,
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
  };

  // 이미지 허용 여부
  if (!options.allowImages) {
    config.ALLOWED_TAGS = config.ALLOWED_TAGS.filter((tag: string) => tag !== 'img');
  }

  // 링크 허용 여부
  if (!options.allowLinks) {
    config.ALLOWED_TAGS = config.ALLOWED_TAGS.filter((tag: string) => tag !== 'a');
  }

  // DOMPurify로 정화
  const cleanHtml = DOMPurify.sanitize(dirty, config);
  
  // TrustedHTML을 string으로 변환
  let clean: string = typeof cleanHtml === 'string' ? cleanHtml : cleanHtml.toString();

  // 추가 보안: JavaScript 프로토콜 제거
  clean = clean.replace(/javascript:/gi, '');
  clean = clean.replace(/on\w+\s*=/gi, '');

  // 스타일 속성 필터링
  if (options.allowedStyles) {
    clean = filterStyles(clean, options.allowedStyles);
  }

  return clean;
}

/**
 * 스타일 속성 필터링
 */
function filterStyles(html: string, allowedStyles: Record<string, boolean>): string {
  // style 속성 찾기
  const styleRegex = /style\s*=\s*"([^"]*)"/gi;
  
  return html.replace(styleRegex, (_match, styles) => {
    const filteredStyles = styles
      .split(';')
      .filter((style: string) => {
        const [property] = style.split(':').map((s: string) => s.trim());
        return property ? allowedStyles[property] : false;
      })
      .join(';');
    
    return filteredStyles ? `style="${filteredStyles}"` : '';
  });
}

/**
 * 마크다운을 안전한 HTML로 변환
 */
export function markdownToSafeHtml(markdown: string): string {
  // 간단한 마크다운 파싱 (실제로는 marked.js 등 사용 권장)
  let html = markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^\* (.+)/gim, '<li>$1</li>')
    .replace(/\*\*(.+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  
  // ul 태그 추가
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // p 태그로 감싸기
  if (!html.startsWith('<')) {
    html = `<p>${html}</p>`;
  }
  
  // 살균 후 반환
  return sanitizeHtml(html);
}

/**
 * URL 파라미터 살균
 */
export function sanitizeUrlParam(param: string): string {
  // URL 인코딩된 악성 스크립트 제거
  let clean = decodeURIComponent(param);
  
  // 스크립트 태그 제거
  clean = clean.replace(/<script[^>]*>.*?<\/script>/gi, '');
  
  // 이벤트 핸들러 제거
  clean = clean.replace(/on\w+\s*=/gi, '');
  
  // JavaScript 프로토콜 제거
  clean = clean.replace(/javascript:/gi, '');
  
  // 다시 인코딩
  return encodeURIComponent(clean);
}

/**
 * JSON 데이터 살균
 */
export function sanitizeJson(data: any): any {
  if (typeof data === 'string') {
    return sanitizeHtml(data, { 
      allowedTags: [], 
      stripIgnoreTag: true 
    });
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeJson(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        // 키도 살균
        const safeKey = sanitizeHtml(key, { 
          allowedTags: [], 
          stripIgnoreTag: true 
        });
        sanitized[safeKey] = sanitizeJson(data[key]);
      }
    }
    return sanitized;
  }
  
  return data;
}

/**
 * SQL 인젝션 방지를 위한 문자열 이스케이프
 * (Prisma 사용 시 자동 처리되지만 추가 보안용)
 */
export function escapeSql(str: string): string {
  if (!str) return '';
  
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x00/g, '\\x00')
    .replace(/\x1a/g, '\\x1a');
}

/**
 * 파일명 살균
 */
export function sanitizeFilename(filename: string): string {
  // 위험한 문자 제거
  let safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // 경로 순회 공격 방지
  safe = safe.replace(/\.\./g, '');
  safe = safe.replace(/\//g, '');
  safe = safe.replace(/\\/g, '');
  
  // 최대 길이 제한
  if (safe.length > 255) {
    const ext = safe.split('.').pop();
    safe = safe.substring(0, 250) + '.' + ext;
  }
  
  return safe;
}

export default {
  sanitizeHtml,
  markdownToSafeHtml,
  sanitizeUrlParam,
  sanitizeJson,
  escapeSql,
  sanitizeFilename,
};