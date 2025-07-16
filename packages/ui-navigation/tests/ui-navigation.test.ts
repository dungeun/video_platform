/**
 * @company/ui-navigation Tests
 * 네비게이션 모듈 테스트
 */

import { describe, test, expect } from 'vitest';
import { 
  UI_NAVIGATION_MODULE_INFO,
  isNavigationItemActive,
  findActiveNavigationItem,
  generateBreadcrumbs,
  validateNavigationItem,
  defaultNavigationTheme,
  getNavigationTheme
} from '../src';

describe('@company/ui-navigation', () => {
  describe('Module Info', () => {
    test('should have correct module information', () => {
      expect(UI_NAVIGATION_MODULE_INFO.name).toBe('@company/ui-navigation');
      expect(UI_NAVIGATION_MODULE_INFO.version).toBe('1.0.0');
      expect(UI_NAVIGATION_MODULE_INFO.features).toContain('Mega Menu with Multi-column Support');
      expect(UI_NAVIGATION_MODULE_INFO.features).toContain('Mobile Navigation with Touch Support');
    });
  });

  describe('Navigation Helpers', () => {
    const navigationItems = [
      {
        id: 'home',
        label: 'Home',
        href: '/'
      },
      {
        id: 'products',
        label: 'Products',
        href: '/products',
        children: [
          {
            id: 'category1',
            label: 'Category 1',
            href: '/products/category1'
          }
        ]
      }
    ];

    test('should correctly identify active navigation items', () => {
      const homeItem = navigationItems[0];
      const productsItem = navigationItems[1];

      expect(isNavigationItemActive(homeItem, '/')).toBe(true);
      expect(isNavigationItemActive(homeItem, '/about')).toBe(false);
      expect(isNavigationItemActive(productsItem, '/products')).toBe(true);
      expect(isNavigationItemActive(productsItem, '/products/category1')).toBe(true);
    });

    test('should find active navigation item', () => {
      const activeItem = findActiveNavigationItem(navigationItems, '/products/category1');
      expect(activeItem?.id).toBe('category1');
    });

    test('should generate breadcrumbs correctly', () => {
      const breadcrumbs = generateBreadcrumbs(navigationItems, '/products/category1');
      expect(breadcrumbs).toHaveLength(2);
      expect(breadcrumbs[0].id).toBe('products');
      expect(breadcrumbs[1].id).toBe('category1');
      expect(breadcrumbs[1].current).toBe(true);
    });

    test('should validate navigation items', () => {
      const validItem = { id: 'test', label: 'Test', href: '/test' };
      const invalidItem = { label: 'Test' } as any; // missing id

      expect(validateNavigationItem(validItem)).toBe(true);
      expect(validateNavigationItem(invalidItem)).toBe(false);
    });
  });

  describe('Theme System', () => {
    test('should have default theme', () => {
      expect(defaultNavigationTheme).toBeDefined();
      expect(defaultNavigationTheme.colors.primary).toBe('#3b82f6');
      expect(defaultNavigationTheme.spacing.md).toBe('1rem');
    });

    test('should get current theme', () => {
      const theme = getNavigationTheme();
      expect(theme).toBeDefined();
      expect(theme.colors).toBeDefined();
      expect(theme.spacing).toBeDefined();
    });
  });

  describe('Exports', () => {
    test('should export all components', async () => {
      const module = await import('../src');
      
      expect(module.MegaMenu).toBeDefined();
      expect(module.SlideMenu).toBeDefined();
      expect(module.MobileNavigation).toBeDefined();
      expect(module.Breadcrumbs).toBeDefined();
      expect(module.SearchBar).toBeDefined();
      expect(module.UserMenu).toBeDefined();
    });

    test('should export all hooks', async () => {
      const module = await import('../src');
      
      expect(module.useNavigation).toBeDefined();
      expect(module.useMegaMenu).toBeDefined();
      expect(module.useSlideMenu).toBeDefined();
      expect(module.useMobileNavigation).toBeDefined();
      expect(module.useBreadcrumbs).toBeDefined();
      expect(module.useSearchBar).toBeDefined();
      expect(module.useUserMenu).toBeDefined();
      expect(module.useKeyboardNavigation).toBeDefined();
      expect(module.useNavigationTheme).toBeDefined();
    });

    test('should export all utilities', async () => {
      const module = await import('../src');
      
      expect(module.isNavigationItemActive).toBeDefined();
      expect(module.NAVIGATION_KEYS).toBeDefined();
      expect(module.createNavigationAria).toBeDefined();
      expect(module.getNavigationTheme).toBeDefined();
    });
  });
});