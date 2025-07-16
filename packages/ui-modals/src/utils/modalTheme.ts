/**
 * @repo/ui-modals - Modal Theme
 * 
 * 모달 테마 설정 및 관리
 */

import { ModalTheme } from '../types';

// Default theme
const defaultTheme: ModalTheme = {
  colors: {
    overlay: 'rgba(0, 0, 0, 0.5)',
    background: '#ffffff',
    border: '#e5e7eb',
    shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    header: {
      background: '#ffffff',
      text: '#111827',
      border: '#e5e7eb'
    },
    footer: {
      background: '#f9fafb',
      border: '#e5e7eb'
    }
  },
  sizes: {
    sm: {
      width: '384px',
      maxHeight: '90vh',
      padding: '1rem'
    },
    md: {
      width: '448px',
      maxHeight: '90vh',
      padding: '1.5rem'
    },
    lg: {
      width: '512px',
      maxHeight: '90vh',
      padding: '1.5rem'
    },
    xl: {
      width: '576px',
      maxHeight: '90vh',
      padding: '2rem'
    },
    full: {
      width: 'calc(100% - 2rem)',
      maxHeight: 'calc(100% - 2rem)',
      padding: '2rem'
    }
  },
  animations: {
    fade: {
      duration: 200,
      easing: 'ease-out'
    },
    slide: {
      duration: 300,
      easing: 'ease-out'
    },
    scale: {
      duration: 200,
      easing: 'ease-out'
    },
    none: {
      duration: 0
    }
  },
  zIndex: {
    base: 1000,
    increment: 10
  }
};

// Theme storage
let currentTheme: ModalTheme = defaultTheme;

// Get current theme
export const getModalTheme = (): ModalTheme => {
  return currentTheme;
};

// Set theme
export const setModalTheme = (theme: Partial<ModalTheme>): void => {
  currentTheme = {
    ...currentTheme,
    ...theme,
    colors: {
      ...currentTheme.colors,
      ...(theme.colors || {}),
      header: {
        ...currentTheme.colors.header,
        ...(theme.colors?.header || {})
      },
      footer: {
        ...currentTheme.colors.footer,
        ...(theme.colors?.footer || {})
      }
    },
    sizes: {
      ...currentTheme.sizes,
      ...(theme.sizes || {})
    },
    animations: {
      ...currentTheme.animations,
      ...(theme.animations || {})
    },
    zIndex: {
      ...currentTheme.zIndex,
      ...(theme.zIndex || {})
    }
  };
};

// Reset to default theme
export const resetModalTheme = (): void => {
  currentTheme = defaultTheme;
};

// Apply theme to element
export const applyModalTheme = (element: HTMLElement, theme?: Partial<ModalTheme>): void => {
  const activeTheme = theme ? { ...currentTheme, ...theme } : currentTheme;
  
  // Apply CSS variables
  element.style.setProperty('--modal-overlay-color', activeTheme.colors.overlay);
  element.style.setProperty('--modal-bg-color', activeTheme.colors.background);
  element.style.setProperty('--modal-border-color', activeTheme.colors.border);
  element.style.setProperty('--modal-shadow', activeTheme.colors.shadow);
  element.style.setProperty('--modal-header-bg', activeTheme.colors.header.background);
  element.style.setProperty('--modal-header-text', activeTheme.colors.header.text);
  element.style.setProperty('--modal-header-border', activeTheme.colors.header.border);
  element.style.setProperty('--modal-footer-bg', activeTheme.colors.footer.background);
  element.style.setProperty('--modal-footer-border', activeTheme.colors.footer.border);
};

// Create theme CSS
export const createModalThemeStyles = (theme?: Partial<ModalTheme>): string => {
  const activeTheme = theme ? { ...currentTheme, ...theme } : currentTheme;
  
  return `
    .modal-theme {
      --modal-overlay-color: ${activeTheme.colors.overlay};
      --modal-bg-color: ${activeTheme.colors.background};
      --modal-border-color: ${activeTheme.colors.border};
      --modal-shadow: ${activeTheme.colors.shadow};
      --modal-header-bg: ${activeTheme.colors.header.background};
      --modal-header-text: ${activeTheme.colors.header.text};
      --modal-header-border: ${activeTheme.colors.header.border};
      --modal-footer-bg: ${activeTheme.colors.footer.background};
      --modal-footer-border: ${activeTheme.colors.footer.border};
    }
  `;
};