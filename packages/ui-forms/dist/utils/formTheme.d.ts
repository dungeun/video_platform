/**
 * @repo/ui-forms - Form Theme Utilities
 *
 * 폼 컴포넌트의 테마와 스타일을 관리하는 유틸리티
 */
import { FormTheme, FormSize, FormVariant, ValidationState } from '../types';
export declare const defaultFormTheme: FormTheme;
/**
 * 현재 테마 가져오기
 */
export declare const getFormTheme: () => FormTheme;
/**
 * 테마 설정
 */
export declare const setFormTheme: (theme: Partial<FormTheme>) => void;
/**
 * 테마 초기화
 */
export declare const resetFormTheme: () => void;
/**
 * 크기별 스타일 가져오기
 */
export declare const getFormSizeStyle: (size?: FormSize) => React.CSSProperties;
/**
 * 변형별 스타일 가져오기
 */
export declare const getFormVariantStyle: (variant?: FormVariant) => React.CSSProperties;
/**
 * 검증 상태별 스타일 가져오기
 */
export declare const getValidationStateStyle: (state?: ValidationState) => React.CSSProperties;
/**
 * 포커스 스타일 가져오기
 */
export declare const getFocusStyle: () => React.CSSProperties;
/**
 * 비활성화 스타일 가져오기
 */
export declare const getDisabledStyle: () => React.CSSProperties;
/**
 * 읽기 전용 스타일 가져오기
 */
export declare const getReadOnlyStyle: () => React.CSSProperties;
/**
 * 라벨 스타일 가져오기
 */
export declare const getLabelStyle: (required?: boolean) => React.CSSProperties;
/**
 * 힌트 스타일 가져오기
 */
export declare const getHintStyle: () => React.CSSProperties;
/**
 * 에러 스타일 가져오기
 */
export declare const getErrorStyle: () => React.CSSProperties;
/**
 * 전체 입력 스타일 가져오기
 */
export declare const getInputStyle: (size?: FormSize, variant?: FormVariant, validationState?: ValidationState, disabled?: boolean, readOnly?: boolean, focused?: boolean) => React.CSSProperties;
/**
 * CSS 클래스명 생성
 */
export declare const getFormClasses: (baseClass: string, size?: FormSize, variant?: FormVariant, validationState?: ValidationState, disabled?: boolean, readOnly?: boolean, focused?: boolean, className?: string) => string;
//# sourceMappingURL=formTheme.d.ts.map