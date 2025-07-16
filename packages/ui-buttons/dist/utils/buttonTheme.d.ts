/**
 * @repo/ui-buttons - Button Theme
 * 버튼 테마 설정 및 스타일 유틸리티
 */
import { ButtonTheme, ButtonSize, ButtonVariant } from '../types';
/**
 * 현재 테마 조회
 */
export declare function getButtonTheme(): ButtonTheme;
/**
 * 크기별 스타일 조회
 */
export declare function getButtonSizeStyle(size: ButtonSize): string;
/**
 * 변형별 스타일 조회
 */
export declare function getButtonVariantStyle(variant: ButtonVariant): string;
/**
 * 커스텀 테마 적용 (추후 확장용)
 */
export declare function setButtonTheme(customTheme: Partial<ButtonTheme>): void;
//# sourceMappingURL=buttonTheme.d.ts.map