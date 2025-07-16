import React, { createContext, useContext, ReactNode } from 'react';
import { DatabaseAdapter } from '../adapters';
import { UserAccountService } from '../services';

interface UserAccountContextValue {
  service: UserAccountService;
}

const UserAccountContext = createContext<UserAccountContextValue | null>(null);

interface UserAccountProviderProps {
  children: ReactNode;
  databaseAdapter: DatabaseAdapter;
}

export const UserAccountProvider: React.FC<UserAccountProviderProps> = ({
  children,
  databaseAdapter
}) => {
  const service = new UserAccountService(databaseAdapter);

  const contextValue: UserAccountContextValue = {
    service
  };

  return (
    <UserAccountContext.Provider value={contextValue}>
      {children}
    </UserAccountContext.Provider>
  );
};

export const useUserAccountService = (): UserAccountService => {
  const context = useContext(UserAccountContext);
  
  if (!context) {
    throw new Error('useUserAccountService must be used within a UserAccountProvider');
  }
  
  return context.service;
};