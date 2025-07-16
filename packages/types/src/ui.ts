/**
 * @repo/types - UI/UX 관련 타입
 */

import { ID } from './common';

// ===== 테마 시스템 =====
export interface Theme {
  id: ID;
  name: string;
  displayName: string;
  description?: string;
  type: ThemeType;
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  shadows: Shadows;
  borders: Borders;
  animations: Animations;
  components: ComponentStyles;
  isDefault: boolean;
  isCustom: boolean;
}

export type ThemeType = 'light' | 'dark' | 'auto' | 'high_contrast';

export interface ColorPalette {
  // 기본 색상
  primary: ColorScale;
  secondary: ColorScale;
  accent: ColorScale;
  
  // 상태 색상
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  info: ColorScale;
  
  // 중성 색상
  gray: ColorScale;
  
  // 배경 색상
  background: {
    default: string;
    paper: string;
    elevated: string;
    overlay: string;
  };
  
  // 텍스트 색상
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    inverse: string;
  };
  
  // 경계선 색상
  border: {
    default: string;
    light: string;
    strong: string;
    interactive: string;
  };
}

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string; // base
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface Typography {
  fontFamily: {
    sans: string[];
    serif: string[];
    mono: string[];
  };
  
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
  };
  
  fontWeight: {
    thin: number;
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
  };
  
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
  
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
}

export interface Spacing {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  8: string;
  10: string;
  12: string;
  16: string;
  20: string;
  24: string;
  32: string;
  40: string;
  48: string;
  56: string;
  64: string;
}

export interface Shadows {
  none: string;
  sm: string;
  default: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
}

export interface Borders {
  width: {
    0: string;
    1: string;
    2: string;
    4: string;
    8: string;
  };
  
  radius: {
    none: string;
    sm: string;
    default: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
}

export interface Animations {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  
  easing: {
    linear: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
  
  keyframes: Record<string, string>;
}

export interface ComponentStyles {
  button: ButtonStyles;
  input: InputStyles;
  card: CardStyles;
  modal: ModalStyles;
  // ... 다른 컴포넌트들
}

// ===== 컴포넌트 스타일 =====
export interface ButtonStyles {
  base: string;
  variants: {
    primary: string;
    secondary: string;
    outline: string;
    ghost: string;
    link: string;
  };
  sizes: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  states: {
    hover: string;
    active: string;
    disabled: string;
    loading: string;
  };
}

export interface InputStyles {
  base: string;
  variants: {
    default: string;
    filled: string;
    outline: string;
    underline: string;
  };
  sizes: {
    sm: string;
    md: string;
    lg: string;
  };
  states: {
    focus: string;
    error: string;
    disabled: string;
    readonly: string;
  };
}

export interface CardStyles {
  base: string;
  variants: {
    default: string;
    outlined: string;
    elevated: string;
    filled: string;
  };
  sizes: {
    sm: string;
    md: string;
    lg: string;
  };
}

export interface ModalStyles {
  overlay: string;
  content: string;
  header: string;
  body: string;
  footer: string;
  closeButton: string;
}

// ===== 레이아웃 =====
export interface Layout {
  id: ID;
  name: string;
  description?: string;
  type: LayoutType;
  structure: LayoutStructure;
  breakpoints: Breakpoints;
  grid: GridSystem;
  regions: LayoutRegion[];
  settings: Record<string, any>;
}

export type LayoutType = 'fixed' | 'fluid' | 'responsive' | 'adaptive';

export interface LayoutStructure {
  header?: LayoutSection;
  sidebar?: LayoutSection;
  main: LayoutSection;
  footer?: LayoutSection;
  aside?: LayoutSection;
}

export interface LayoutSection {
  component: string;
  props?: Record<string, any>;
  width?: string | number;
  height?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  minHeight?: string | number;
  maxHeight?: string | number;
  sticky?: boolean;
  collapsible?: boolean;
  hidden?: boolean | Record<string, boolean>;
}

export interface Breakpoints {
  xs: number; // 0px
  sm: number; // 640px
  md: number; // 768px
  lg: number; // 1024px
  xl: number; // 1280px
  '2xl': number; // 1536px
}

export interface GridSystem {
  columns: number;
  gap: string;
  gutters: string;
  container: {
    maxWidth: string;
    padding: string;
    center: boolean;
  };
}

export interface LayoutRegion {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  components: ComponentInstance[];
}

// ===== 컴포넌트 =====
export interface ComponentInstance {
  id: ID;
  type: string;
  name: string;
  props: Record<string, any>;
  style?: ComponentStyle;
  children?: ComponentInstance[];
  position: ComponentPosition;
  responsive?: ResponsiveSettings;
  conditions?: DisplayCondition[];
}

export interface ComponentStyle {
  className?: string;
  css?: Record<string, string>;
  variant?: string;
  size?: string;
  color?: string;
}

export interface ComponentPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
}

export interface ResponsiveSettings {
  xs?: Partial<ComponentInstance>;
  sm?: Partial<ComponentInstance>;
  md?: Partial<ComponentInstance>;
  lg?: Partial<ComponentInstance>;
  xl?: Partial<ComponentInstance>;
  '2xl'?: Partial<ComponentInstance>;
}

export interface DisplayCondition {
  type: 'device' | 'user' | 'time' | 'location' | 'custom';
  condition: string;
  value: any;
}

// ===== 폼 시스템 =====
export interface FormDefinition {
  id: ID;
  name: string;
  description?: string;
  schema: FormSchema;
  layout: FormLayout;
  validation: FormValidation;
  submission: FormSubmission;
  styling: FormStyling;
  settings: FormSettings;
}

export interface FormSchema {
  fields: FormField[];
  sections?: FormSection[];
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
  description?: string;
  defaultValue?: any;
  options?: FormFieldOption[];
  validation?: FieldValidation[];
  conditions?: FieldCondition[];
  styling?: FieldStyling;
}

export type FormFieldType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'tel' 
  | 'url'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'datetime'
  | 'time'
  | 'file'
  | 'image'
  | 'color'
  | 'range'
  | 'hidden';

export interface FormFieldOption {
  label: string;
  value: any;
  disabled?: boolean;
  group?: string;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: string[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export interface FormLayout {
  type: 'single' | 'multi' | 'wizard' | 'accordion';
  columns?: number;
  gap?: string;
  alignment?: 'left' | 'center' | 'right';
}

export interface FormValidation {
  mode: 'onChange' | 'onBlur' | 'onSubmit' | 'all';
  revalidateMode: 'onChange' | 'onBlur' | 'onSubmit';
  resolver?: string;
  schema?: any;
}

export interface FieldValidation {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface FieldCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'in' | 'nin' | 'empty' | 'exists';
  value: any;
  action: 'show' | 'hide' | 'enable' | 'disable' | 'require';
}

export interface FieldStyling {
  width?: string;
  className?: string;
  labelPosition?: 'top' | 'left' | 'right' | 'bottom';
  hideLabel?: boolean;
}

export interface FormSubmission {
  method: 'POST' | 'PUT' | 'PATCH';
  action: string;
  redirect?: string;
  successMessage?: string;
  errorMessage?: string;
  resetOnSuccess?: boolean;
}

export interface FormStyling {
  theme: string;
  className?: string;
  customCSS?: string;
}

export interface FormSettings {
  saveProgress?: boolean;
  progressIndicator?: boolean;
  confirmBeforeLeave?: boolean;
  autoSave?: {
    enabled: boolean;
    interval: number;
  };
}

// ===== 대시보드 =====
export interface Dashboard {
  id: ID;
  name: string;
  description?: string;
  layout: DashboardLayout;
  widgets: DashboardWidget[];
  filters: DashboardFilter[];
  settings: DashboardSettings;
  permissions: DashboardPermission[];
}

export interface DashboardLayout {
  type: 'grid' | 'masonry' | 'freeform';
  columns: number;
  gap: string;
  responsive: boolean;
}

export interface DashboardWidget {
  id: ID;
  type: WidgetType;
  title: string;
  description?: string;
  position: WidgetPosition;
  config: WidgetConfig;
  dataSource: DataSource;
  refreshInterval?: number;
  filters?: WidgetFilter[];
  style?: WidgetStyle;
}

export type WidgetType = 
  | 'chart'
  | 'table'
  | 'metric'
  | 'progress'
  | 'list'
  | 'calendar'
  | 'map'
  | 'iframe'
  | 'text'
  | 'image';

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WidgetConfig {
  chartType?: ChartType;
  showLegend?: boolean;
  showAxis?: boolean;
  showGrid?: boolean;
  orientation?: 'horizontal' | 'vertical';
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  groupBy?: string[];
  limit?: number;
}

export type ChartType = 
  | 'line'
  | 'bar'
  | 'column'
  | 'area'
  | 'pie'
  | 'donut'
  | 'scatter'
  | 'bubble'
  | 'gauge'
  | 'funnel'
  | 'heatmap';

export interface DataSource {
  type: 'api' | 'database' | 'file' | 'realtime';
  endpoint?: string;
  query?: string;
  params?: Record<string, any>;
  transform?: string;
}

export interface WidgetFilter {
  field: string;
  operator: string;
  value: any;
  label?: string;
}

export interface WidgetStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: string;
  margin?: string;
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'text' | 'number';
  field: string;
  options?: FilterOption[];
  defaultValue?: any;
  global: boolean;
}

export interface FilterOption {
  label: string;
  value: any;
}

export interface DashboardSettings {
  autoRefresh: boolean;
  refreshInterval: number;
  allowExport: boolean;
  allowFilter: boolean;
  allowResize: boolean;
  allowMove: boolean;
}

export interface DashboardPermission {
  userId?: ID;
  roleId?: ID;
  permission: 'view' | 'edit' | 'delete' | 'share';
}

// ===== 페이지 빌더 =====
export interface Page {
  id: ID;
  slug: string;
  title: string;
  description?: string;
  layout: Layout;
  sections: PageSection[];
  seo: PageSEO;
  settings: PageSettings;
  status: PageStatus;
}

export interface PageSection {
  id: string;
  type: string;
  name: string;
  components: ComponentInstance[];
  style?: SectionStyle;
  settings?: SectionSettings;
}

export interface SectionStyle {
  backgroundColor?: string;
  backgroundImage?: string;
  padding?: string;
  margin?: string;
  minHeight?: string;
}

export interface SectionSettings {
  containerWidth?: 'full' | 'container' | 'narrow';
  verticalAlign?: 'top' | 'center' | 'bottom';
  fullHeight?: boolean;
  parallax?: boolean;
}

export interface PageSEO {
  title?: string;
  description?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

export interface PageSettings {
  template?: string;
  requireAuth?: boolean;
  roles?: string[];
  cache?: {
    enabled: boolean;
    duration: number;
  };
  analytics?: {
    enabled: boolean;
    trackingId?: string;
  };
}

export type PageStatus = 'draft' | 'published' | 'archived' | 'scheduled';