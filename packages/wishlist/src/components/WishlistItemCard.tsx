import React from 'react';
import { WishlistItem } from '../entities';

interface WishlistItemCardProps {
  item: WishlistItem;
  onEdit?: () => void;
  onRemove?: () => void;
  onPurchase?: () => void;
  showActions?: boolean;
}

export const WishlistItemCard: React.FC<WishlistItemCardProps> = ({
  item,
  onEdit,
  onRemove,
  onPurchase,
  showActions = true
}) => {
  const priceDropPercentage = ((item.originalPrice - item.currentPrice) / item.originalPrice) * 100;
  const hasTargetPrice = item.targetPrice && item.currentPrice <= item.targetPrice;

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${item.isPurchased ? 'opacity-75' : ''}`}>
      <div className="flex gap-4">
        {item.productImage && (
          <div className="w-24 h-24 flex-shrink-0">
            <img
              src={item.productImage}
              alt={item.productName}
              className="w-full h-full object-cover rounded"
            />
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-semibold text-gray-900">
                {item.productUrl ? (
                  <a 
                    href={item.productUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {item.productName}
                  </a>
                ) : (
                  item.productName
                )}
              </h4>
              
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-1 rounded ${
                  item.priority === 'high' ? 'bg-red-100 text-red-800' :
                  item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.priority} priority
                </span>
                
                {item.isPurchased && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                    Purchased
                  </span>
                )}
                
                {hasTargetPrice && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    Target price reached!
                  </span>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-bold text-lg">${item.currentPrice.toFixed(2)}</div>
              {priceDropPercentage > 0 && (
                <div className="text-sm">
                  <span className="text-gray-500 line-through">${item.originalPrice.toFixed(2)}</span>
                  <span className="text-green-600 ml-1">-{priceDropPercentage.toFixed(0)}%</span>
                </div>
              )}
            </div>
          </div>

          {item.notes && (
            <p className="text-gray-600 text-sm mb-2">{item.notes}</p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Qty: {item.quantity}</span>
              {item.targetPrice && (
                <span>Target: ${item.targetPrice.toFixed(2)}</span>
              )}
            </div>
            
            {showActions && (
              <div className="flex items-center gap-2">
                {!item.isPurchased && onPurchase && (
                  <button
                    onClick={onPurchase}
                    className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Mark Purchased
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Edit
                  </button>
                )}
                {onRemove && (
                  <button
                    onClick={onRemove}
                    className="text-sm px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>
          
          {item.tags && item.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};