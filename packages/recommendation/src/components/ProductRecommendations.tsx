import React from 'react';
import { ProductRecommendationsProps, Recommendation } from '../types';

export const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({
  recommendations,
  isLoading = false,
  error = null,
  onProductClick,
  showReason = false,
  className = ''
}) => {
  const handleProductClick = (recommendation: Recommendation) => {
    if (onProductClick) {
      onProductClick(recommendation.product);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(price);
  };

  const getReasonIcon = (reasonType: string): string => {
    switch (reasonType) {
      case 'collaborative':
        return '👥';
      case 'content':
        return '🎯';
      case 'popular':
        return '🔥';
      case 'trending':
        return '📈';
      case 'recently_viewed':
        return '👀';
      case 'cross_sell':
        return '🛒';
      case 'up_sell':
        return '⬆️';
      default:
        return '💡';
    }
  };

  const getReasonColor = (reasonType: string): string => {
    switch (reasonType) {
      case 'collaborative':
        return '#3498db';
      case 'content':
        return '#e74c3c';
      case 'popular':
        return '#f39c12';
      case 'trending':
        return '#2ecc71';
      case 'recently_viewed':
        return '#9b59b6';
      case 'cross_sell':
        return '#1abc9c';
      case 'up_sell':
        return '#34495e';
      default:
        return '#95a5a6';
    }
  };

  if (error) {
    return (
      <div className={`product-recommendations error ${className}`}>
        <div className="error-message">
          <p>Failed to load recommendations: {error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`product-recommendations loading ${className}`}>
        <div className="recommendations-grid">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="recommendation-card skeleton">
              <div className="product-image skeleton-element"></div>
              <div className="product-info">
                <div className="product-name skeleton-element"></div>
                <div className="product-price skeleton-element"></div>
                <div className="product-rating skeleton-element"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className={`product-recommendations empty ${className}`}>
        <div className="empty-message">
          <p>No recommendations available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`product-recommendations ${className}`}>
      <div className="recommendations-grid">
        {recommendations.map((recommendation) => (
          <div
            key={recommendation.productId}
            className="recommendation-card"
            onClick={() => handleProductClick(recommendation)}
          >
            <div className="product-image-container">
              <img
                src={recommendation.product.imageUrl || '/placeholder-product.jpg'}
                alt={recommendation.product.name}
                className="product-image"
                loading="lazy"
              />
              <div className="confidence-score">
                {Math.round(recommendation.score * 100)}%
              </div>
              {showReason && (
                <div 
                  className="reason-badge"
                  style={{ backgroundColor: getReasonColor(recommendation.reason.type) }}
                  title={recommendation.reason.explanation}
                >
                  <span className="reason-icon">
                    {getReasonIcon(recommendation.reason.type)}
                  </span>
                  <span className="reason-text">
                    {recommendation.reason.type.replace('_', ' ')}
                  </span>
                </div>
              )}
            </div>
            
            <div className="product-info">
              <h3 className="product-name" title={recommendation.product.name}>
                {recommendation.product.name}
              </h3>
              
              <div className="product-meta">
                <span className="product-brand">{recommendation.product.brand}</span>
                <span className="product-category">{recommendation.product.category}</span>
              </div>
              
              <div className="product-price">
                {formatPrice(recommendation.product.price)}
              </div>
              
              <div className="product-rating">
                <div className="stars">
                  {Array.from({ length: 5 }, (_, index) => (
                    <span
                      key={index}
                      className={`star ${index < Math.floor(recommendation.product.rating) ? 'filled' : ''}`}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
                <span className="rating-score">
                  {recommendation.product.rating.toFixed(1)}
                </span>
                <span className="review-count">
                  ({recommendation.product.reviewCount})
                </span>
              </div>

              {showReason && (
                <div className="recommendation-reason">
                  <p className="reason-explanation">
                    {recommendation.reason.explanation}
                  </p>
                  <div className="reason-confidence">
                    Confidence: {Math.round(recommendation.reason.confidence * 100)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// CSS styles
const styles = `
.product-recommendations {
  width: 100%;
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  padding: 0;
}

.recommendation-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.recommendation-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.product-image-container {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f8f9fa;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.recommendation-card:hover .product-image {
  transform: scale(1.05);
}

.confidence-score {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.reason-badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 4px;
  max-width: calc(100% - 16px);
}

.reason-icon {
  font-size: 0.875rem;
}

.reason-text {
  text-transform: capitalize;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-info {
  padding: 1rem;
}

.product-name {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #1a1a1a;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-meta {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #666;
}

.product-brand {
  font-weight: 500;
}

.product-category {
  color: #888;
}

.product-price {
  font-size: 1.125rem;
  font-weight: 700;
  color: #e74c3c;
  margin-bottom: 0.5rem;
}

.product-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

.stars {
  display: flex;
  gap: 1px;
}

.star {
  font-size: 0.75rem;
  opacity: 0.3;
}

.star.filled {
  opacity: 1;
}

.rating-score {
  font-weight: 600;
  color: #333;
}

.review-count {
  color: #666;
}

.recommendation-reason {
  border-top: 1px solid #eee;
  padding-top: 0.75rem;
  margin-top: 0.75rem;
}

.reason-explanation {
  font-size: 0.875rem;
  color: #555;
  line-height: 1.4;
  margin: 0 0 0.5rem 0;
}

.reason-confidence {
  font-size: 0.75rem;
  color: #888;
  font-weight: 500;
}

/* Skeleton styles */
.recommendation-card.skeleton {
  pointer-events: none;
}

.skeleton-element {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
}

.product-image.skeleton-element {
  width: 100%;
  height: 100%;
  border-radius: 0;
}

.product-name.skeleton-element {
  height: 1.2rem;
  margin-bottom: 0.5rem;
}

.product-price.skeleton-element {
  height: 1.5rem;
  width: 60%;
  margin-bottom: 0.5rem;
}

.product-rating.skeleton-element {
  height: 1rem;
  width: 80%;
}

/* Error and empty states */
.error-message {
  text-align: center;
  padding: 2rem;
  color: #e74c3c;
}

.empty-message {
  text-align: center;
  padding: 2rem;
  color: #666;
}

/* Responsive design */
@media (max-width: 768px) {
  .recommendations-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .recommendation-card {
    font-size: 0.875rem;
  }
  
  .product-image-container {
    height: 150px;
  }
  
  .product-info {
    padding: 0.75rem;
  }
  
  .product-name {
    font-size: 0.875rem;
  }
  
  .product-price {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .recommendations-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.75rem;
  }
  
  .product-image-container {
    height: 120px;
  }
  
  .confidence-score {
    font-size: 0.625rem;
    padding: 2px 6px;
  }
  
  .reason-badge {
    font-size: 0.625rem;
    padding: 2px 6px;
  }
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('product-recommendations-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'product-recommendations-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}