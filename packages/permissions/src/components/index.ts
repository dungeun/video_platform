/**
 * @repo/permissions - 컴포넌트 모듈 내보내기
 */

export { ProtectedComponent, type ProtectedComponentProps } from './ProtectedComponent';
export { 
  PermissionGate, 
  withPermissions, 
  usePermissionGate,
  type PermissionGateProps,
  type WithPermissionProps 
} from './PermissionGate';
export { PermissionDebugger, type PermissionDebuggerProps } from './PermissionDebugger';