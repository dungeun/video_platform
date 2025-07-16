import React from 'react';
import { RecommendationWidgetProps } from '../types';
import { useRecommendations } from '../hooks/useRecommendations';
import { ProductRecommendations } from './ProductRecommendations';

export const RecommendationWidget: React.FC<RecommendationWidgetProps> = ({
  userId,
  title = 'Recommended for You',
  productId,
  category,
  limit = 6,
  algorithm,
  className = '',
  onProductClick,
  showReason = false
}) => {
  const {
    recommendations,
    isLoading,
    error,
    refetch
  } = useRecommendations({
    userId,
    productId,
    category,
    limit,
    algorithm,
    enabled: !!userId
  });

  if (!userId) {
    return null;
  }

  if (error) {
    return (
      <div className={`recommendation-widget error ${className}`}>
        <div className="error-message">
          <h3>Unable to load recommendations</h3>
          <button 
            onClick={refetch}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`recommendation-widget loading ${className}`}>
        <h2 className="widget-title">{title}</h2>
        <div className="loading-skeleton">
          {Array.from({ length: limit }, (_, index) => (
            <div key={index} className="skeleton-item">
              <div className="skeleton-image"></div>
              <div className="skeleton-text">
                <div className="skeleton-line short"></div>
                <div className="skeleton-line long"></div>
                <div className="skeleton-line medium"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className={`recommendation-widget empty ${className}`}>
        <h2 className="widget-title">{title}</h2>
        <div className="empty-state">
          <p>No recommendations available at the moment.</p>
          <button onClick={refetch} className="refresh-button">
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`recommendation-widget ${className}`}>
      <div className="widget-header">
        <h2 className="widget-title">{title}</h2>
        <button 
          onClick={refetch}
          className="refresh-button"
          aria-label="Refresh recommendations"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>
      </div>
      
      <ProductRecommendations
        recommendations={recommendations}
        onProductClick={onProductClick}
        showReason={showReason}
        className="widget-recommendations"
      />
    </div>
  );
};

// CSS styles (would typically be in a separate CSS file)
const styles = `
.recommendation-widget {
  padding: 1.5rem;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin: 1rem 0;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.widget-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.refresh-button {
  background: none;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.refresh-button:hover {
  background: #f5f5f5;
  border-color: #d0d0d0;
}

.loading-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.skeleton-item {
  border-radius: 8px;
  overflow: hidden;
}

.skeleton-image {
  width: 100%;
  height: 200px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.skeleton-text {
  padding: 1rem;
}

.skeleton-line {
  height: 12px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  margin-bottom: 0.5rem;
  border-radius: 4px;
}

.skeleton-line.short {
  width: 60%;
}

.skeleton-line.medium {
  width: 80%;
}

.skeleton-line.long {
  width: 100%;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.error-message {
  text-align: center;
  padding: 2rem;
}

.error-message h3 {
  color: #e74c3c;
  margin-bottom: 1rem;
}

.retry-button {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s ease;
}

.retry-button:hover {
  background: #2980b9;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.empty-state p {
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .recommendation-widget {
    padding: 1rem;
  }
  
  .widget-title {
    font-size: 1.25rem;
  }
  
  .loading-skeleton {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.75rem;
  }
}
`;

// Inject styles (in a real app, this would be in a CSS file)
if (typeof document !== 'undefined' && !document.getElementById('recommendation-widget-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'recommendation-widget-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}