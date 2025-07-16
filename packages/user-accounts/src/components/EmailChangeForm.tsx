import React, { useState } from 'react';
import { EmailChangeFormProps, EmailChangeInput } from '../types';

export const EmailChangeForm: React.FC<EmailChangeFormProps> = ({
  onSubmit,
  loading = false,
  error
}) => {
  const [formData, setFormData] = useState<EmailChangeInput>({
    newEmail: ''
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Email validation
    if (!formData.newEmail) {
      errors.newEmail = 'New email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.newEmail)) {
      errors.newEmail = 'Invalid email format';
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData({ newEmail: value });
    
    // Clear validation error when user starts typing
    if (validationErrors.newEmail) {
      setValidationErrors({});
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700">
          New Email Address
        </label>
        <input
          type="email"
          id="newEmail"
          value={formData.newEmail}
          onChange={handleChange}
          className={`mt-1 block w-full px-3 py-2 border ${
            validationErrors.newEmail ? 'border-red-500' : 'border-gray-300'
          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          placeholder="Enter new email address"
          disabled={loading}
        />
        {validationErrors.newEmail && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.newEmail}</p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
        <p className="text-sm">
          You will receive a verification email at the new address. Your email will be changed 
          once you click the verification link.
        </p>
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
        {loading ? 'Sending Verification...' : 'Change Email'}
      </button>
    </form>
  );
};