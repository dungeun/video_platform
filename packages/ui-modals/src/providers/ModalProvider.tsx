/**
 * @repo/ui-modals - Modal Provider
 * 
 * 전역 모달 상태 관리를 위한 Provider
 */

import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import { ModalManager, ModalManagerState, ModalState, ModalStackItem, ModalStackManager } from '../types';
import { createPortal } from 'react-dom';

// ===== Context =====
interface ModalContextValue {
  state: ModalManagerState;
  manager: ModalManager;
  stack: ModalStackManager;
}

const ModalContext = createContext<ModalContextValue | null>(null);

// ===== Actions =====
type ModalAction = 
  | { type: 'OPEN_MODAL'; payload: { id: string; state: Partial<ModalState> } }
  | { type: 'CLOSE_MODAL'; payload: { id: string } }
  | { type: 'CLOSE_ALL_MODALS' }
  | { type: 'SET_ACTIVE_MODAL'; payload: { id: string | null } }
  | { type: 'UPDATE_MODAL'; payload: { id: string; state: Partial<ModalState> } };

// ===== Reducer =====
function modalReducer(state: ModalManagerState, action: ModalAction): ModalManagerState {
  switch (action.type) {
    case 'OPEN_MODAL': {
      const { id, state: modalState } = action.payload;
      const newModals = new Map(state.modals);
      const zIndex = state.zIndexBase + newModals.size * 10;
      
      newModals.set(id, {
        isOpen: true,
        id,
        zIndex,
        focusTrapActive: true,
        ...modalState
      });
      
      return {
        ...state,
        modals: newModals,
        activeModalId: id
      };
    }
    
    case 'CLOSE_MODAL': {
      const { id } = action.payload;
      const newModals = new Map(state.modals);
      newModals.delete(id);
      
      const remainingModals = Array.from(newModals.keys());
      const newActiveId: string | null = remainingModals.length > 0 
        ? remainingModals[remainingModals.length - 1]! 
        : null;
      
      return {
        ...state,
        modals: newModals,
        activeModalId: newActiveId
      };
    }
    
    case 'CLOSE_ALL_MODALS': {
      return {
        ...state,
        modals: new Map(),
        activeModalId: null
      };
    }
    
    case 'SET_ACTIVE_MODAL': {
      return {
        ...state,
        activeModalId: action.payload.id
      };
    }
    
    case 'UPDATE_MODAL': {
      const { id, state: updates } = action.payload;
      const newModals = new Map(state.modals);
      const current = newModals.get(id);
      
      if (current) {
        newModals.set(id, { ...current, ...updates });
      }
      
      return {
        ...state,
        modals: newModals
      };
    }
    
    default:
      return state;
  }
}

// ===== Provider Props =====
interface ModalProviderProps {
  children: React.ReactNode;
  zIndexBase?: number;
  container?: HTMLElement;
}

// ===== Provider Component =====
export function ModalProvider({ 
  children, 
  zIndexBase = 1000,
  container
}: ModalProviderProps) {
  // State
  const [state, dispatch] = useReducer(modalReducer, {
    modals: new Map(),
    activeModalId: null,
    zIndexBase
  });
  
  // Stack
  const stackRef = useRef<ModalStackItem[]>([]);
  
  // Modal Manager
  const manager: ModalManager = {
    open: useCallback((id: string, options?: Partial<ModalState>) => {
      dispatch({ type: 'OPEN_MODAL', payload: { id, state: options || {} } });
    }, []),
    
    close: useCallback((id: string) => {
      dispatch({ type: 'CLOSE_MODAL', payload: { id } });
    }, []),
    
    closeAll: useCallback(() => {
      dispatch({ type: 'CLOSE_ALL_MODALS' });
    }, []),
    
    isOpen: useCallback((id: string) => {
      return state.modals.has(id);
    }, [state.modals]),
    
    getState: useCallback((id: string) => {
      return state.modals.get(id);
    }, [state.modals]),
    
    getActiveModal: useCallback(() => {
      return state.activeModalId;
    }, [state.activeModalId]),
    
    setActiveModal: useCallback((id: string | null) => {
      dispatch({ type: 'SET_ACTIVE_MODAL', payload: { id } });
    }, [])
  };
  
  // Stack Manager
  const stack: ModalStackManager = {
    push: useCallback((item: ModalStackItem) => {
      stackRef.current.push(item);
    }, []),
    
    pop: useCallback(() => {
      return stackRef.current.pop();
    }, []),
    
    peek: useCallback(() => {
      return stackRef.current[stackRef.current.length - 1];
    }, []),
    
    clear: useCallback(() => {
      stackRef.current = [];
    }, []),
    
    size: useCallback(() => {
      return stackRef.current.length;
    }, []),
    
    getAll: useCallback(() => {
      return [...stackRef.current];
    }, [])
  };
  
  // Context value
  const value: ModalContextValue = {
    state,
    manager,
    stack
  };
  
  // Modal container for portals
  const modalContainer = container || document.getElementById('modal-root') || document.body;
  
  return (
    <ModalContext.Provider value={value}>
      {children}
      <ModalPortalContainer container={modalContainer} />
    </ModalContext.Provider>
  );
}

// ===== Portal Container =====
function ModalPortalContainer({ container }: { container: HTMLElement }) {
  const context = useContext(ModalContext);
  
  if (!context) return null;
  
  const { stack } = context;
  const modals = stack.getAll();
  
  if (modals.length === 0) return null;
  
  return createPortal(
    <>
      {modals.map((modal) => (
        <div key={modal.id} data-modal-id={modal.id}>
          {modal.component}
        </div>
      ))}
    </>,
    container
  );
}

// ===== Hook =====
export function useModalContext() {
  const context = useContext(ModalContext);
  
  if (!context) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  
  return context;
}