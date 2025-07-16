/**
 * PromotionBanner Component
 * Displays promotional banners with configurable styling and interactions
 */

import React, { useEffect, useState } from 'react';
import { Banner, BannerPosition } from '../types';

export interface PromotionBannerProps {
  banner: Banner;
  onImpression?: (bannerId: string) => void;
  onClick?: (banner: Banner) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const PromotionBanner: React.FC<PromotionBannerProps> = ({
  banner,
  onImpression,
  onClick,
  className = '',
  style = {}
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasRecordedImpression, setHasRecordedImpression] = useState(false);

  useEffect(() => {
    // Record impression when banner becomes visible
    if (isVisible && !hasRecordedImpression && onImpression) {
      onImpression(banner.id);
      setHasRecordedImpression(true);
    }
  }, [isVisible, hasRecordedImpression, onImpression, banner.id]);

  useEffect(() => {
    // Set up intersection observer for impression tracking
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.5 }
    );

    const element = document.getElementById(`banner-${banner.id}`);
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [banner.id]);

  const handleClick = () => {
    if (onClick) {
      onClick(banner);
    } else {
      // Handle default click actions
      switch (banner.clickAction.type) {
        case 'url':
          if (banner.clickAction.value) {
            window.open(banner.clickAction.value, '_blank');
          }
          break;
        case 'promotion':
          // Navigate to promotion page
          console.log('Navigate to promotion:', banner.clickAction.value);
          break;
        case 'product':
          // Navigate to product page
          console.log('Navigate to product:', banner.clickAction.value);
          break;
        case 'category':
          // Navigate to category page
          console.log('Navigate to category:', banner.clickAction.value);
          break;
        default:
          // Do nothing
          break;
      }
    }
  };

  const getPositionClass = (): string => {
    switch (banner.position) {
      case BannerPosition.TOP:
        return 'banner-position-top';
      case BannerPosition.HEADER:
        return 'banner-position-header';
      case BannerPosition.HERO:
        return 'banner-position-hero';
      case BannerPosition.SIDEBAR:
        return 'banner-position-sidebar';
      case BannerPosition.FOOTER:
        return 'banner-position-footer';
      case BannerPosition.POPUP:
        return 'banner-position-popup';
      case BannerPosition.FLOATING:
        return 'banner-position-floating';
      default:
        return '';
    }
  };

  const getAnimationClass = (): string => {
    if (!banner.styling.animation || banner.styling.animation === 'none') {
      return '';
    }
    return `banner-animation-${banner.styling.animation}`;
  };

  const getCombinedStyles = (): React.CSSProperties => {
    return {
      ...style,
      width: banner.styling.width,
      height: banner.styling.height,
      backgroundColor: banner.styling.backgroundColor,
      color: banner.styling.textColor,
      borderRadius: banner.styling.borderRadius,
    };
  };

  const baseClasses = [
    'promotion-banner',
    getPositionClass(),
    getAnimationClass(),
    banner.clickAction.type !== 'none' ? 'banner-clickable' : '',
    className
  ].filter(Boolean).join(' ');

  if (!banner.isActive) {
    return null;
  }

  return (
    <div
      id={`banner-${banner.id}`}
      className={baseClasses}
      style={getCombinedStyles()}
      onClick={banner.clickAction.type !== 'none' ? handleClick : undefined}
      role={banner.clickAction.type !== 'none' ? 'button' : 'banner'}
      tabIndex={banner.clickAction.type !== 'none' ? 0 : undefined}
      onKeyDown={(e) => {
        if (banner.clickAction.type !== 'none' && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {banner.imageUrl && (
        <div className="banner-image">
          <img 
            src={banner.imageUrl} 
            alt={banner.title}
            loading="lazy"
          />
        </div>
      )}
      
      <div className="banner-content">
        <h3 className="banner-title">{banner.title}</h3>
        
        {banner.subtitle && (
          <p className="banner-subtitle">{banner.subtitle}</p>
        )}
        
        <div 
          className="banner-text"
          dangerouslySetInnerHTML={{ __html: banner.content }}
        />
        
        {banner.clickAction.type !== 'none' && (
          <div className="banner-cta">
            <span className="banner-cta-text">
              {getBannerCTAText(banner.clickAction.type)}
            </span>
          </div>
        )}
      </div>

      {banner.position === BannerPosition.POPUP && (
        <button 
          className="banner-close"
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
          }}
          aria-label="Close banner"
        >
          ×
        </button>
      )}
    </div>
  );
};

function getBannerCTAText(actionType: string): string {
  switch (actionType) {
    case 'url':
      return 'Learn More';
    case 'promotion':
      return 'View Offer';
    case 'product':
      return 'Shop Now';
    case 'category':
      return 'Browse Category';
    default:
      return 'Click Here';
  }
}

// Banner List Component
export interface PromotionBannerListProps {
  banners: Banner[];
  position?: BannerPosition;
  maxDisplay?: number;
  onBannerImpression?: (bannerId: string) => void;
  onBannerClick?: (banner: Banner) => void;
  className?: string;
}

export const PromotionBannerList: React.FC<PromotionBannerListProps> = ({
  banners,
  position,
  maxDisplay,
  onBannerImpression,
  onBannerClick,
  className = ''
}) => {
  const filteredBanners = banners
    .filter(banner => {
      if (!banner.isActive) return false;
      if (position && banner.position !== position) return false;
      return true;
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxDisplay);

  if (filteredBanners.length === 0) {
    return null;
  }

  return (
    <div className={`promotion-banner-list ${className}`}>
      {filteredBanners.map(banner => (
        <PromotionBanner
          key={banner.id}
          banner={banner}
          onImpression={onBannerImpression}
          onClick={onBannerClick}
        />
      ))}
    </div>
  );
};

// Banner Carousel Component
export interface BannerCarouselProps {
  banners: Banner[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;
  onBannerImpression?: (bannerId: string) => void;
  onBannerClick?: (banner: Banner) => void;
  className?: string;
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({
  banners,
  autoPlay = true,
  autoPlayInterval = 5000,
  showDots = true,
  showArrows = true,
  onBannerImpression,
  onBannerClick,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const activeBanners = banners.filter(banner => banner.isActive);

  useEffect(() => {
    if (!autoPlay || activeBanners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, activeBanners.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? activeBanners.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  if (activeBanners.length === 0) {
    return null;
  }

  return (
    <div className={`banner-carousel ${className}`}>
      <div className="carousel-container">
        <div 
          className="carousel-track"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: 'transform 0.3s ease-in-out'
          }}
        >
          {activeBanners.map((banner, index) => (
            <div key={banner.id} className="carousel-slide">
              <PromotionBanner
                banner={banner}
                onImpression={onBannerImpression}
                onClick={onBannerClick}
              />
            </div>
          ))}
        </div>

        {showArrows && activeBanners.length > 1 && (
          <>
            <button 
              className="carousel-arrow carousel-arrow-prev"
              onClick={goToPrevious}
              aria-label="Previous banner"
            >
              ‹
            </button>
            <button 
              className="carousel-arrow carousel-arrow-next"
              onClick={goToNext}
              aria-label="Next banner"
            >
              ›
            </button>
          </>
        )}
      </div>

      {showDots && activeBanners.length > 1 && (
        <div className="carousel-dots">
          {activeBanners.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PromotionBanner;