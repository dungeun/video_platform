import React, { useState } from 'react';
import { PasswordChangeFormProps, PasswordChangeInput } from '../types';

export const PasswordChangeForm: React.FC<PasswordChangeFormProps> = ({
  onSubmit,
  loading = false,
  error
}) => {
  const [formData, setFormData] = useState<PasswordChangeInput>({
    currentPassword: '',
    newPassword: ''
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState(false);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Current password validation
    if (!formData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    // New password validation
    if (!formData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])/.test(formData.newPassword)) {
      errors.newPassword = 'Password must contain lowercase letters';
    } else if (!/(?=.*[A-Z])/.test(formData.newPassword)) {
      errors.newPassword = 'Password must contain uppercase letters';
    } else if (!/(?=.*\d)/.test(formData.newPassword)) {
      errors.newPassword = 'Password must contain numbers';
    } else if (!/(?=.*[^A-Za-z0-9])/.test(formData.newPassword)) {
      errors.newPassword = 'Password must contain special characters';
    }

    // Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (confirmPassword !== formData.newPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Check if passwords are the same
    if (formData.currentPassword && formData.newPassword && 
        formData.currentPassword === formData.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
  };

  const handleChange = (field: keyof PasswordChangeInput) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setConfirmPassword(value);
    
    // Clear validation error when user starts typing
    if (validationErrors.confirmPassword) {
      setValidationErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  const getPasswordStrengthColor = (password: string) => {
    if (password.length === 0) return 'bg-gray-200';
    if (password.length < 8) return 'bg-red-500';
    
    let score = 0;
    if (/(?=.*[a-z])/.test(password)) score++;
    if (/(?=.*[A-Z])/.test(password)) score++;
    if (/(?=.*\d)/.test(password)) score++;
    if (/(?=.*[^A-Za-z0-9])/.test(password)) score++;
    if (password.length >= 12) score++;
    
    if (score < 3) return 'bg-red-500';
    if (score < 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = (password: string) => {
    if (password.length === 0) return '';
    if (password.length < 8) return 'Too short';
    
    let score = 0;
    if (/(?=.*[a-z])/.test(password)) score++;
    if (/(?=.*[A-Z])/.test(password)) score++;
    if (/(?=.*\d)/.test(password)) score++;
    if (/(?=.*[^A-Za-z0-9])/.test(password)) score++;
    if (password.length >= 12) score++;
    
    if (score < 3) return 'Weak';
    if (score < 4) return 'Medium';
    return 'Strong';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
          Current Password
        </label>
        <div className="relative">
          <input
            type={showPasswords ? 'text' : 'password'}
            id="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange('currentPassword')}
            className={`mt-1 block w-full px-3 py-2 border ${
              validationErrors.currentPassword ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            placeholder="Enter current password"
            disabled={loading}
          />
        </div>
        {validationErrors.currentPassword && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.currentPassword}</p>
        )}
      </div>

      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
          New Password
        </label>
        <div className="relative">
          <input
            type={showPasswords ? 'text' : 'password'}
            id="newPassword"
            value={formData.newPassword}
            onChange={handleChange('newPassword')}
            className={`mt-1 block w-full px-3 py-2 border ${
              validationErrors.newPassword ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            placeholder="Enter new password"
            disabled={loading}
          />
        </div>
        {formData.newPassword && (
          <div className="mt-2">
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(formData.newPassword)}`}
                  style={{
                    width: `${Math.min(100, (formData.newPassword.length / 12) * 100)}%`
                  }}
                ></div>
              </div>
              <span className="text-xs text-gray-600">
                {getPasswordStrengthText(formData.newPassword)}
              </span>
            </div>
          </div>
        )}
        {validationErrors.newPassword && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.newPassword}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm New Password
        </label>
        <div className="relative">
          <input
            type={showPasswords ? 'text' : 'password'}
            id="confirmPassword"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            className={`mt-1 block w-full px-3 py-2 border ${
              validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            placeholder="Confirm new password"
            disabled={loading}
          />
        </div>
        {validationErrors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
        )}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="showPasswords"
          checked={showPasswords}
          onChange={(e) => setShowPasswords(e.target.checked)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          disabled={loading}
        />
        <label htmlFor="showPasswords" className="ml-2 text-sm text-gray-700">
          Show passwords
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
        <p className="text-sm">
          Password requirements:
        </p>
        <ul className="text-sm mt-1 list-disc list-inside">
          <li>At least 8 characters long</li>
          <li>Contains uppercase and lowercase letters</li>
          <li>Contains at least one number</li>
          <li>Contains at least one special character</li>
        </ul>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
          loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        }`}
      >
        {loading ? 'Changing Password...' : 'Change Password'}
      </button>
    </form>
  );
};