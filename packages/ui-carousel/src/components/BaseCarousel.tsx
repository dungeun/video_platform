import React, { forwardRef, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { BaseCarouselProps } from '../types';
import { useCarouselClasses } from '../hooks';
import { NavigationArrows } from './NavigationArrows';
import { NavigationDots } from './NavigationDots';

export const BaseCarousel = forwardRef<HTMLDivElement, BaseCarouselProps>(
  (
    {
      items,
      options,
      autoPlay = false,
      showNavigation = true,
      showDots = true,
      className,
      style,
      onSlideChange,
      renderItem
    },
    ref
  ) => {
    const autoplayRef = useRef(
      autoPlay
        ? Autoplay(
            typeof autoPlay === 'object'
              ? autoPlay
              : { delay: 4000, stopOnInteraction: true }
          )
        : null
    );

    const [emblaRef, emblaApi] = useEmblaCarousel(
      options,
      autoplayRef.current ? [autoplayRef.current] : []
    );

    const classes = useCarouselClasses({
      showNavigation,
      isDraggable: options?.draggable !== false,
      className
    });

    React.useEffect(() => {
      if (!emblaApi) return;

      const handleSelect = () => {
        if (onSlideChange) {
          onSlideChange(emblaApi.selectedScrollSnap());
        }
      };

      emblaApi.on('select', handleSelect);

      return () => {
        emblaApi.off('select', handleSelect);
      };
    }, [emblaApi, onSlideChange]);

    const scrollPrev = React.useCallback(() => {
      if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    const scrollNext = React.useCallback(() => {
      if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    const scrollTo = React.useCallback((index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    }, [emblaApi]);

    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [canScrollPrev, setCanScrollPrev] = React.useState(false);
    const [canScrollNext, setCanScrollNext] = React.useState(false);

    React.useEffect(() => {
      if (!emblaApi) return;

      const handleSelect = () => {
        setSelectedIndex(emblaApi.selectedScrollSnap());
        setCanScrollPrev(emblaApi.canScrollPrev());
        setCanScrollNext(emblaApi.canScrollNext());
      };

      handleSelect();
      emblaApi.on('select', handleSelect);
      emblaApi.on('reInit', handleSelect);

      return () => {
        emblaApi.off('select', handleSelect);
        emblaApi.off('reInit', handleSelect);
      };
    }, [emblaApi]);

    return (
      <div ref={ref} className={classes.container} style={style}>
        <div className={classes.viewport} ref={emblaRef}>
          <div className={classes.slideContainer}>
            {items.map((item, index) => (
              <div
                key={item.id}
                className={classes.slide(index, items.length, 'md')}
              >
                {renderItem ? renderItem(item, index) : item.content}
              </div>
            ))}
          </div>
        </div>

        {showNavigation && (
          <NavigationArrows
            onPrevClick={scrollPrev}
            onNextClick={scrollNext}
            canScrollPrev={canScrollPrev}
            canScrollNext={canScrollNext}
          />
        )}

        {showDots && (
          <NavigationDots
            totalSlides={items.length}
            currentSlide={selectedIndex}
            onDotClick={scrollTo}
          />
        )}
      </div>
    );
  }
);

BaseCarousel.displayName = 'BaseCarousel';