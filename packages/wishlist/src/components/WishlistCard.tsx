import React from 'react';
import { Wishlist } from '../entities';

interface WishlistCardProps {
  wishlist: Wishlist;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  onClick?: () => void;
}

export const WishlistCard: React.FC<WishlistCardProps> = ({
  wishlist,
  onEdit,
  onDelete,
  onShare,
  onClick
}) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer p-6"
      onClick={onClick}
    >
      {wishlist.coverImage && (
        <div className="relative h-48 -mx-6 -mt-6 mb-4">
          <img
            src={wishlist.coverImage}
            alt={wishlist.name}
            className="w-full h-full object-cover rounded-t-lg"
          />
        </div>
      )}
      
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
          {wishlist.name}
        </h3>
        {wishlist.isDefault && (
          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
            Default
          </span>
        )}
      </div>

      {wishlist.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {wishlist.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>{wishlist.itemCount} items</span>
          {wishlist.isPublic && (
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Public
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
          {onShare && (
            <button
              onClick={onShare}
              className="p-1 hover:bg-gray-100 rounded"
              title="Share wishlist"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-2.684-4.026m0 0a3 3 0 00-2.684 4.026m0-8.052a3 3 0 10-2.684 4.026" />
              </svg>
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1 hover:bg-gray-100 rounded"
              title="Edit wishlist"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1 hover:bg-gray-100 rounded text-red-500"
              title="Delete wishlist"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {wishlist.tags && wishlist.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {wishlist.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
            >
              {tag}
            </span>
          ))}
          {wishlist.tags.length > 3 && (
            <span className="px-2 py-1 text-xs text-gray-500">
              +{wishlist.tags.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
};