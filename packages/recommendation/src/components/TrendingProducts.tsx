import React, { useState, useEffect } from 'react';
import { TrendingProductsProps, TrendingProduct } from '../types';

export const TrendingProducts: React.FC<TrendingProductsProps> = ({
  period = 'weekly',
  limit = 10,
  category,
  className = '',
  onProductClick
}) => {
  const [trendingProducts, setTrendingProducts] = useState<TrendingProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  useEffect(() => {
    loadTrendingProducts();
  }, [selectedPeriod, category, limit]);

  const loadTrendingProducts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Mock data - in real implementation, this would call an API
      const mockTrendingProducts: TrendingProduct[] = [
        {
          productId: 'trend-1',
          product: {
            id: 'trend-1',
            name: 'Wireless Bluetooth Earbuds Pro',
            description: 'Premium wireless earbuds with noise cancellation',
            price: 299000,
            category: 'Electronics',
            brand: 'TechPro',
            tags: ['bluetooth', 'wireless', 'noise-canceling'],
            attributes: { color: 'black', batteryLife: '24h' },
            imageUrl: '/images/products/earbuds-pro.jpg',
            rating: 4.8,
            reviewCount: 1250,
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-06-10')
          },
          trendScore: 0.95,
          growthRate: 85.2,
          period: selectedPeriod,
          metrics: {
            views: 15420,
            purchases: 342,
            addToCarts: 856,
            searches: 2340
          }
        },
        {
          productId: 'trend-2',
          product: {
            id: 'trend-2',
            name: 'Smart Fitness Watch Ultra',
            description: 'Advanced fitness tracking with GPS and health monitoring',
            price: 450000,
            category: 'Electronics',
            brand: 'FitTech',
            tags: ['fitness', 'smartwatch', 'health', 'gps'],
            attributes: { screenSize: '1.4inch', waterproof: 'IP68' },
            imageUrl: '/images/products/smart-watch.jpg',
            rating: 4.6,
            reviewCount: 890,
            createdAt: new Date('2024-02-20'),
            updatedAt: new Date('2024-06-10')
          },
          trendScore: 0.88,
          growthRate: 72.1,
          period: selectedPeriod,
          metrics: {
            views: 12890,
            purchases: 245,
            addToCarts: 634,
            searches: 1890
          }
        },
        {
          productId: 'trend-3',
          product: {
            id: 'trend-3',
            name: 'Eco-Friendly Water Bottle',
            description: 'Sustainable stainless steel water bottle with temperature control',
            price: 65000,
            category: 'Lifestyle',
            brand: 'EcoLife',
            tags: ['eco-friendly', 'sustainable', 'stainless-steel'],
            attributes: { capacity: '500ml', insulation: '24h' },
            imageUrl: '/images/products/water-bottle.jpg',
            rating: 4.9,
            reviewCount: 567,
            createdAt: new Date('2024-03-10'),
            updatedAt: new Date('2024-06-10')
          },
          trendScore: 0.82,
          growthRate: 68.7,
          period: selectedPeriod,
          metrics: {
            views: 9560,
            purchases: 189,
            addToCarts: 456,
            searches: 1234
          }
        }
      ];

      // Filter by category if specified
      const filtered = category 
        ? mockTrendingProducts.filter(item => item.product.category === category)
        : mockTrendingProducts;

      setTrendingProducts(filtered.slice(0, limit));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trending products');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(price);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getTrendColor = (growthRate: number): string => {
    if (growthRate >= 80) return '#27ae60';
    if (growthRate >= 60) return '#f39c12';
    if (growthRate >= 40) return '#e67e22';
    return '#e74c3c';
  };

  const getTrendIcon = (growthRate: number): string => {
    if (growthRate >= 80) return '🔥';
    if (growthRate >= 60) return '📈';
    if (growthRate >= 40) return '⬆️';
    return '📊';
  };

  if (error) {
    return (
      <div className={`trending-products error ${className}`}>
        <div className="error-message">
          <h3>Unable to load trending products</h3>
          <p>{error}</p>
          <button onClick={loadTrendingProducts} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`trending-products ${className}`}>
      <div className="trending-header">
        <h2 className="trending-title">
          <span className="trending-icon">🔥</span>
          Trending Products
        </h2>
        
        <div className="period-selector">
          {(['daily', 'weekly', 'monthly'] as const).map((periodOption) => (
            <button
              key={periodOption}
              onClick={() => setSelectedPeriod(periodOption)}
              className={`period-button ${selectedPeriod === periodOption ? 'active' : ''}`}
            >
              {periodOption.charAt(0).toUpperCase() + periodOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="trending-loading">
          {Array.from({ length: limit }, (_, index) => (
            <div key={index} className="trending-item skeleton">
              <div className="item-rank skeleton-element"></div>
              <div className="item-image skeleton-element"></div>
              <div className="item-content">
                <div className="item-title skeleton-element"></div>
                <div className="item-metrics skeleton-element"></div>
                <div className="item-growth skeleton-element"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="trending-list">
          {trendingProducts.map((item, index) => (
            <div
              key={item.productId}
              className="trending-item"
              onClick={() => onProductClick?.(item.product)}
            >
              <div className="item-rank">
                <span className="rank-number">#{index + 1}</span>
                <span 
                  className="trend-indicator"
                  style={{ color: getTrendColor(item.growthRate) }}
                >
                  {getTrendIcon(item.growthRate)}
                </span>
              </div>

              <div className="item-image-container">
                <img
                  src={item.product.imageUrl || '/placeholder-product.jpg'}
                  alt={item.product.name}
                  className="item-image"
                  loading="lazy"
                />
                <div className="trend-badge">
                  <span className="trend-score">
                    {Math.round(item.trendScore * 100)}
                  </span>
                </div>
              </div>

              <div className="item-content">
                <h3 className="item-title">{item.product.name}</h3>
                <div className="item-meta">
                  <span className="item-brand">{item.product.brand}</span>
                  <span className="item-category">{item.product.category}</span>
                </div>
                <div className="item-price">
                  {formatPrice(item.product.price)}
                </div>
                
                <div className="item-metrics">
                  <div className="metric">
                    <span className="metric-label">Views:</span>
                    <span className="metric-value">{formatNumber(item.metrics.views)}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Sales:</span>
                    <span className="metric-value">{formatNumber(item.metrics.purchases)}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Cart Adds:</span>
                    <span className="metric-value">{formatNumber(item.metrics.addToCarts)}</span>
                  </div>
                </div>

                <div className="item-growth">
                  <span 
                    className="growth-rate"
                    style={{ color: getTrendColor(item.growthRate) }}
                  >
                    +{item.growthRate.toFixed(1)}% growth
                  </span>
                  <div className="growth-bar">
                    <div 
                      className="growth-fill"
                      style={{ 
                        width: `${Math.min(item.growthRate, 100)}%`,
                        backgroundColor: getTrendColor(item.growthRate)
                      }}
                    ></div>
                  </div>
                </div>

                <div className="item-rating">
                  <div className="stars">
                    {Array.from({ length: 5 }, (_, starIndex) => (
                      <span
                        key={starIndex}
                        className={`star ${starIndex < Math.floor(item.product.rating) ? 'filled' : ''}`}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                  <span className="rating-score">
                    {item.product.rating.toFixed(1)}
                  </span>
                  <span className="review-count">
                    ({item.product.reviewCount})
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && trendingProducts.length === 0 && (
        <div className="empty-state">
          <p>No trending products found for the selected period.</p>
          <button onClick={loadTrendingProducts} className="refresh-button">
            Refresh
          </button>
        </div>
      )}
    </div>
  );
};

// CSS styles
const styles = `
.trending-products {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.trending-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.trending-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.trending-icon {
  font-size: 1.25rem;
}

.period-selector {
  display: flex;
  gap: 0.5rem;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 0.25rem;
}

.period-button {
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.period-button:hover {
  background: #e9ecef;
}

.period-button.active {
  background: #007bff;
  color: white;
}

.trending-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.trending-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  align-items: center;
}

.trending-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #ddd;
}

.item-rank {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-width: 3rem;
}

.rank-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: #666;
}

.trend-indicator {
  font-size: 1rem;
}

.item-image-container {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.trend-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ff6b6b;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #1a1a1a;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-meta {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.item-brand {
  color: #666;
  font-weight: 500;
}

.item-category {
  color: #888;
}

.item-price {
  font-size: 1.125rem;
  font-weight: 700;
  color: #e74c3c;
  margin-bottom: 0.75rem;
}

.item-metrics {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
  font-size: 0.75rem;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.metric-label {
  color: #888;
  font-weight: 500;
}

.metric-value {
  color: #333;
  font-weight: 600;
}

.item-growth {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.growth-rate {
  font-size: 0.875rem;
  font-weight: 600;
  min-width: 80px;
}

.growth-bar {
  flex: 1;
  height: 4px;
  background: #eee;
  border-radius: 2px;
  overflow: hidden;
}

.growth-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.item-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
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

/* Loading skeleton */
.trending-loading {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.trending-item.skeleton {
  pointer-events: none;
}

.skeleton-element {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: 4px;
}

.item-rank.skeleton-element {
  width: 3rem;
  height: 2rem;
}

.item-image.skeleton-element {
  width: 80px;
  height: 80px;
  border-radius: 8px;
}

.item-title.skeleton-element {
  height: 1.2rem;
  width: 70%;
  margin-bottom: 0.5rem;
}

.item-metrics.skeleton-element {
  height: 2rem;
  width: 80%;
  margin-bottom: 0.75rem;
}

.item-growth.skeleton-element {
  height: 1rem;
  width: 60%;
}

/* Error and empty states */
.error-message {
  text-align: center;
  padding: 2rem;
}

.error-message h3 {
  color: #e74c3c;
  margin-bottom: 1rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.retry-button, .refresh-button {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s ease;
}

.retry-button:hover, .refresh-button:hover {
  background: #0056b3;
}

/* Responsive design */
@media (max-width: 768px) {
  .trending-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .trending-item {
    flex-direction: column;
    text-align: center;
  }
  
  .item-rank {
    flex-direction: row;
    justify-content: center;
    width: 100%;
  }
  
  .item-image-container {
    width: 120px;
    height: 120px;
    align-self: center;
  }
  
  .item-metrics {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .trending-products {
    padding: 1rem;
  }
  
  .period-selector {
    width: 100%;
    justify-content: center;
  }
  
  .period-button {
    flex: 1;
    text-align: center;
  }
  
  .item-metrics {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .metric {
    flex-direction: row;
    justify-content: space-between;
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
if (typeof document !== 'undefined' && !document.getElementById('trending-products-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'trending-products-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}