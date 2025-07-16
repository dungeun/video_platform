/**
 * @repo/permissions - 권한 디버거
 * Development component for debugging permissions
 */

import React, { useState, useEffect } from 'react';
import { usePermission } from '../hooks/usePermission';
import { usePermissionCache } from '../hooks/usePermissionCache';
import { PermissionAction, PermissionContext } from '../types';

export interface PermissionDebuggerProps {
  visible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  permissions?: string[];
  showCacheStats?: boolean;
  showPermissionSummary?: boolean;
}

export function PermissionDebugger({
  visible = process.env.NODE_ENV === 'development',
  position = 'bottom-right',
  permissions = [],
  showCacheStats = true,
  showPermissionSummary = true
}: PermissionDebuggerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [testPermission, setTestPermission] = useState('');
  const [testResource, setTestResource] = useState('');
  const [testAction, setTestAction] = useState<PermissionAction>(PermissionAction.READ);
  
  const { 
    hasPermission, 
    evaluatePermission, 
    getPermissionSummary,
    isLoading,
    error 
  } = usePermission();
  
  const { getCacheStats, clearCache } = usePermissionCache();

  if (!visible) {
    return null;
  }

  const positionStyles = {
    'top-left': { top: 20, left: 20 },
    'top-right': { top: 20, right: 20 },
    'bottom-left': { bottom: 20, left: 20 },
    'bottom-right': { bottom: 20, right: 20 }
  };

  const debuggerStyle: React.CSSProperties = {
    position: 'fixed',
    ...positionStyles[position],
    width: isExpanded ? '400px' : '200px',
    maxHeight: isExpanded ? '600px' : '60px',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '12px',
    fontFamily: 'monospace',
    zIndex: 9999,
    overflow: 'auto',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease'
  };

  const permissionSummary = getPermissionSummary();
  const cacheStats = getCacheStats();

  const testPermissionCheck = () => {
    if (!testPermission) return null;

    const result = evaluatePermission(testPermission);
    return result;
  };

  const testResourceCheck = () => {
    if (!testResource || !testAction) return null;

    const permissionName = `${testResource}.${testAction}`;
    const result = evaluatePermission(permissionName);
    return result;
  };

  return (
    <div style={debuggerStyle}>
      <div 
        style={{ 
          cursor: 'pointer', 
          fontWeight: 'bold',
          marginBottom: isExpanded ? '12px' : '0'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        🔐 권한 디버거 {isExpanded ? '▼' : '▶'}
      </div>

      {isExpanded && (
        <div>
          {/* 상태 정보 */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#888', marginBottom: '4px' }}>상태</div>
            <div>로딩: {isLoading ? '예' : '아니오'}</div>
            {error && <div style={{ color: '#ff6b6b' }}>오류: {error}</div>}
          </div>

          {/* 권한 요약 */}
          {showPermissionSummary && permissionSummary && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ color: '#888', marginBottom: '4px' }}>권한 요약</div>
              <div>역할: {permissionSummary.roles.map(r => r.name).join(', ') || '없음'}</div>
              <div>권한 수: {permissionSummary.effectivePermissions.length}</div>
            </div>
          )}

          {/* 캐시 통계 */}
          {showCacheStats && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ color: '#888', marginBottom: '4px' }}>캐시 통계</div>
              <div>크기: {cacheStats.size}</div>
              <div>적중률: {(cacheStats.hitRate * 100).toFixed(1)}%</div>
              <button
                onClick={clearCache}
                style={{
                  marginTop: '4px',
                  padding: '2px 6px',
                  fontSize: '10px',
                  backgroundColor: '#333',
                  color: '#fff',
                  border: '1px solid #555',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                캐시 초기화
              </button>
            </div>
          )}

          {/* 권한 테스트 */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#888', marginBottom: '4px' }}>권한 테스트</div>
            <input
              type="text"
              placeholder="권한명 (예: user.read)"
              value={testPermission}
              onChange={(e) => setTestPermission(e.target.value)}
              style={{
                width: '100%',
                padding: '2px 4px',
                marginBottom: '4px',
                backgroundColor: '#333',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: '3px',
                fontSize: '11px'
              }}
            />
            {testPermission && (
              <div style={{ fontSize: '10px' }}>
                결과: {hasPermission(testPermission) ? 
                  <span style={{ color: '#51cf66' }}>허용</span> : 
                  <span style={{ color: '#ff6b6b' }}>거부</span>
                }
              </div>
            )}
          </div>

          {/* 리소스 테스트 */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#888', marginBottom: '4px' }}>리소스 테스트</div>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
              <input
                type="text"
                placeholder="리소스"
                value={testResource}
                onChange={(e) => setTestResource(e.target.value)}
                style={{
                  flex: 1,
                  padding: '2px 4px',
                  backgroundColor: '#333',
                  color: '#fff',
                  border: '1px solid #555',
                  borderRadius: '3px',
                  fontSize: '11px'
                }}
              />
              <select
                value={testAction}
                onChange={(e) => setTestAction(e.target.value as PermissionAction)}
                style={{
                  padding: '2px',
                  backgroundColor: '#333',
                  color: '#fff',
                  border: '1px solid #555',
                  borderRadius: '3px',
                  fontSize: '11px'
                }}
              >
                {Object.values(PermissionAction).map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
            {testResource && testAction && (
              <div style={{ fontSize: '10px' }}>
                결과: {hasPermission(`${testResource}.${testAction}`) ? 
                  <span style={{ color: '#51cf66' }}>허용</span> : 
                  <span style={{ color: '#ff6b6b' }}>거부</span>
                }
              </div>
            )}
          </div>

          {/* 미리 정의된 권한 목록 */}
          {permissions.length > 0 && (
            <div>
              <div style={{ color: '#888', marginBottom: '4px' }}>권한 목록</div>
              {permissions.map(permission => (
                <div key={permission} style={{ fontSize: '10px', marginBottom: '2px' }}>
                  {permission}: {hasPermission(permission) ? 
                    <span style={{ color: '#51cf66' }}>✓</span> : 
                    <span style={{ color: '#ff6b6b' }}>✗</span>
                  }
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}