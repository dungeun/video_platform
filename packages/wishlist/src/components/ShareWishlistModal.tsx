import React, { useState } from 'react';
import { ShareWishlistRequest } from '../types';

interface ShareWishlistModalProps {
  wishlistId: string;
  wishlistName: string;
  isOpen: boolean;
  onClose: () => void;
  onShare: (data: Omit<ShareWishlistRequest, 'wishlistId'>) => Promise<void>;
}

export const ShareWishlistModal: React.FC<ShareWishlistModalProps> = ({
  wishlistId,
  wishlistName,
  isOpen,
  onClose,
  onShare
}) => {
  const [shareType, setShareType] = useState<'view' | 'edit' | 'collaborate'>('view');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [expiresIn, setExpiresIn] = useState<'never' | '7days' | '30days'>('never');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleShare = async () => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let expiresAt: Date | undefined;
      if (expiresIn === '7days') {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
      } else if (expiresIn === '30days') {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
      }

      await onShare({
        sharedWithEmail: email,
        shareType,
        message: message || undefined,
        expiresAt
      });

      // Reset form
      setEmail('');
      setMessage('');
      setShareType('view');
      setExpiresIn('never');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share wishlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Share "{wishlistName}"</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Share with (email)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="friend@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Permission level
            </label>
            <select
              value={shareType}
              onChange={(e) => setShareType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="view">View only</option>
              <option value="edit">Can add/edit items</option>
              <option value="collaborate">Full collaboration</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {shareType === 'view' && 'They can only view the wishlist'}
              {shareType === 'edit' && 'They can add and edit items'}
              {shareType === 'collaborate' && 'They can add, edit, and remove items'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expires
            </label>
            <select
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="never">Never</option>
              <option value="7days">In 7 days</option>
              <option value="30days">In 30 days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Check out my wishlist!"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={loading || !email}
          >
            {loading ? 'Sharing...' : 'Share Wishlist'}
          </button>
        </div>
      </div>
    </div>
  );
};