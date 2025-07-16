import { useState, useEffect, type FC, type FormEvent } from 'react';
import type { UserProfile, CreateUserProfileInput, UpdateUserProfileInput } from '../types';

export interface UserProfileFormProps {
  profile?: UserProfile;
  onSubmit: (data: CreateUserProfileInput | UpdateUserProfileInput) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  className?: string;
}

/**
 * UserProfileForm component for creating and editing user profiles
 */
export const UserProfileForm: FC<UserProfileFormProps> = ({
  profile,
  onSubmit,
  onCancel,
  loading = false,
  className = ''
}) => {
  const [formData, setFormData] = useState({
    id: profile?.id || '',
    name: profile?.name || '',
    picture: profile?.picture || '',
    bio: profile?.bio || ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEditing = !!profile;

  useEffect(() => {
    if (profile) {
      setFormData({
        id: profile.id,
        name: profile.name,
        picture: profile.picture || '',
        bio: profile.bio || ''
      });
    }
  }, [profile]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!isEditing && !formData['id'].trim()) {
      newErrors['id'] = 'User ID is required';
    }

    if (!formData['name'].trim()) {
      newErrors['name'] = 'Name is required';
    } else if (formData['name'].trim().length > 100) {
      newErrors['name'] = 'Name must not exceed 100 characters';
    }

    if (formData['bio'] && formData['bio'].length > 500) {
      newErrors['bio'] = 'Bio must not exceed 500 characters';
    }

    if (formData['picture'] && formData['picture'].trim()) {
      try {
        new URL(formData['picture']);
      } catch {
        newErrors['picture'] = 'Picture must be a valid URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing) {
        // For updates, only send changed fields
        const updateData: UpdateUserProfileInput = {};
        
        if (formData['name'] !== profile.name) {
          updateData.name = formData['name'].trim();
        }
        
        if ((formData['picture'] || '') !== (profile.picture || '')) {
          updateData.picture = formData['picture'].trim() || undefined;
        }
        
        if ((formData['bio'] || '') !== (profile.bio || '')) {
          updateData.bio = formData['bio'].trim() || undefined;
        }

        await onSubmit(updateData);
      } else {
        // For creation, send all required fields
        const createData: CreateUserProfileInput = {
          id: formData['id'].trim(),
          name: formData['name'].trim(),
          ...(formData['picture'].trim() && { picture: formData['picture'].trim() }),
          ...(formData['bio'].trim() && { bio: formData['bio'].trim() })
        };

        await onSubmit(createData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`user-profile-form ${className}`}>
      {!isEditing && (
        <div className="form-field">
          <label htmlFor="id" className="block text-sm font-medium text-gray-700">
            User ID *
          </label>
          <input
            type="text"
            id="id"
            value={formData['id']}
            onChange={(e) => handleInputChange('id', e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm ${
              errors.id ? 'border-red-500' : 'border-gray-300'
            } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            disabled={loading}
            placeholder="Enter unique user ID"
          />
          {errors.id && (
            <p className="mt-1 text-sm text-red-600">{errors.id}</p>
          )}
        </div>
      )}

      <div className="form-field">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name *
        </label>
        <input
          type="text"
          id="name"
          value={formData['name']}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          disabled={loading}
          placeholder="Enter full name"
          maxLength={100}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="picture" className="block text-sm font-medium text-gray-700">
          Profile Picture URL
        </label>
        <input
          type="url"
          id="picture"
          value={formData['picture']}
          onChange={(e) => handleInputChange('picture', e.target.value)}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm ${
            errors.picture ? 'border-red-500' : 'border-gray-300'
          } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          disabled={loading}
          placeholder="https://example.com/profile.jpg"
        />
        {errors.picture && (
          <p className="mt-1 text-sm text-red-600">{errors.picture}</p>
        )}
      </div>

      <div className="form-field">
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          Bio
        </label>
        <textarea
          id="bio"
          value={formData['bio']}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          rows={3}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm ${
            errors.bio ? 'border-red-500' : 'border-gray-300'
          } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          disabled={loading}
          placeholder="Tell us about yourself..."
          maxLength={500}
        />
        <div className="mt-1 text-xs text-gray-500">
          {formData['bio'].length}/500 characters
        </div>
        {errors.bio && (
          <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
        )}
      </div>

      <div className="form-actions flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : isEditing ? 'Update Profile' : 'Create Profile'}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};