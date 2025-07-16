/**
 * Navigation Helper Utilities
 * 네비게이션 관련 헬퍼 함수들
 */
/**
 * 네비게이션 아이템 활성 상태 확인
 */
export const isNavigationItemActive = (item, currentPath) => {
    if (!item.href)
        return false;
    // 정확한 경로 매칭
    if (item.href === currentPath)
        return true;
    // 하위 경로 매칭 (부모 메뉴의 경우)
    if (item.children && item.children.length > 0) {
        return item.children.some(child => child.href && currentPath.startsWith(child.href));
    }
    return currentPath.startsWith(item.href);
};
/**
 * 네비게이션 아이템에서 활성 아이템 찾기
 */
export const findActiveNavigationItem = (items, currentPath) => {
    for (const item of items) {
        if (isNavigationItemActive(item, currentPath)) {
            return item;
        }
        if (item.children) {
            const activeChild = findActiveNavigationItem(item.children, currentPath);
            if (activeChild)
                return activeChild;
        }
    }
    return null;
};
/**
 * 네비게이션 아이템 플래튼 (중첩 구조를 평면으로)
 */
export const flattenNavigationItems = (items) => {
    const flatten = (items, depth = 0) => {
        const result = [];
        items.forEach(item => {
            result.push({ ...item, depth });
            if (item.children) {
                result.push(...flatten(item.children, depth + 1));
            }
        });
        return result;
    };
    return flatten(items);
};
/**
 * 브레드크럼 경로 생성
 */
export const generateBreadcrumbs = (items, currentPath) => {
    const breadcrumbs = [];
    const findPath = (items, path) => {
        for (const item of items) {
            const currentPathItems = [...path, item];
            if (item.href === currentPath) {
                breadcrumbs.push(...currentPathItems.map((pathItem, index) => ({
                    id: pathItem.id,
                    label: pathItem.label,
                    href: pathItem.href,
                    current: index === currentPathItems.length - 1
                })));
                return true;
            }
            if (item.children && findPath(item.children, currentPathItems)) {
                return true;
            }
        }
        return false;
    };
    findPath(items, []);
    return breadcrumbs;
};
/**
 * 검색 결과 필터링
 */
export const filterNavigationItems = (items, query) => {
    if (!query.trim())
        return items;
    const searchQuery = query.toLowerCase();
    const result = [];
    const searchItems = (items) => {
        return items.reduce((acc, item) => {
            const matchesLabel = item.label.toLowerCase().includes(searchQuery);
            const matchesChildren = item.children ? searchItems(item.children) : [];
            if (matchesLabel || matchesChildren.length > 0) {
                acc.push({
                    ...item,
                    children: matchesChildren.length > 0 ? matchesChildren : item.children
                });
            }
            return acc;
        }, []);
    };
    return searchItems(items);
};
/**
 * 네비게이션 아이템 깊이 계산
 */
export const getNavigationDepth = (items) => {
    let maxDepth = 0;
    const calculateDepth = (items, currentDepth = 1) => {
        maxDepth = Math.max(maxDepth, currentDepth);
        items.forEach(item => {
            if (item.children && item.children.length > 0) {
                calculateDepth(item.children, currentDepth + 1);
            }
        });
    };
    calculateDepth(items);
    return maxDepth;
};
/**
 * URL 정규화
 */
export const normalizeUrl = (url) => {
    if (!url)
        return '/';
    // 앞에 슬래시 추가
    if (!url.startsWith('/')) {
        url = '/' + url;
    }
    // 뒤에 슬래시 제거 (루트 경로 제외)
    if (url.length > 1 && url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    return url;
};
/**
 * 네비게이션 아이템 유효성 검사
 */
export const validateNavigationItem = (item) => {
    // 필수 필드 검사
    if (!item.id || !item.label) {
        return false;
    }
    // href가 있는 경우 형식 검사
    if (item.href && typeof item.href !== 'string') {
        return false;
    }
    // children이 있는 경우 재귀 검사
    if (item.children) {
        return item.children.every(validateNavigationItem);
    }
    return true;
};
/**
 * 네비게이션 아이템 그룹핑
 */
export const groupNavigationItems = (items, groupBy) => {
    return items.reduce((groups, item) => {
        const key = groupBy(item);
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});
};
/**
 * 네비게이션 경로 계산
 */
export const calculateNavigationPath = (items, targetId) => {
    const path = [];
    const findPath = (items, currentPath) => {
        for (const item of items) {
            const newPath = [...currentPath, item];
            if (item.id === targetId) {
                path.push(...newPath);
                return true;
            }
            if (item.children && findPath(item.children, newPath)) {
                return true;
            }
        }
        return false;
    };
    findPath(items, []);
    return path;
};
/**
 * 모바일 여부 확인
 */
export const isMobileDevice = () => {
    if (typeof window === 'undefined')
        return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
};
/**
 * 터치 디바이스 여부 확인
 */
export const isTouchDevice = () => {
    if (typeof window === 'undefined')
        return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};
//# sourceMappingURL=navigationHelpers.js.map