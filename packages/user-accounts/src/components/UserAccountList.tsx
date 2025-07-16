import React from 'react';
import { UserAccountListProps, UserAccount } from '../types';

export const UserAccountList: React.FC<UserAccountListProps> = ({
  onSelect,
  onEdit,
  onDelete,
  filters
}) => {
  // This component would typically use the useUserAccounts hook
  // For now, we'll create a placeholder structure
  
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  };

  const getStatusBadge = (account: UserAccount) => {
    if (account.deletedAt) {
      return <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded-full">Deleted</span>;
    }
    if (account.isLocked) {
      return <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">Locked</span>;
    }
    if (!account.isActive) {
      return <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">Inactive</span>;
    }
    if (!account.emailVerified) {
      return <span className="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-800 rounded-full">Unverified</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Active</span>;
  };

  // Placeholder data - in real implementation, this would come from the hook
  const accounts: UserAccount[] = [];
  const loading = false;
  const error = null;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        Error loading accounts: {error}
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No user accounts found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {accounts.map((account) => (
          <li key={account.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {account.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-900">
                      {account.email}
                    </p>
                    <div className="ml-2">
                      {getStatusBadge(account)}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    Created: {formatDate(account.createdAt)}
                    {account.lastLoginAt && (
                      <span className="ml-4">
                        Last login: {formatDate(account.lastLoginAt)}
                      </span>
                    )}
                  </p>
                  {account.loginAttempts > 0 && (
                    <p className="text-sm text-orange-600">
                      Failed attempts: {account.loginAttempts}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {onSelect && (
                  <button
                    onClick={() => onSelect(account)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={() => onEdit(account)}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                )}
                {onDelete && !account.deletedAt && (
                  <button
                    onClick={() => onDelete(account)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};