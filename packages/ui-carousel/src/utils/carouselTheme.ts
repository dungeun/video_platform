import clsx from 'clsx';

export const carouselTheme = {
  // Base carousel container
  container: {
    base: 'relative overflow-hidden',
    fullWidth: 'w-full',
    withNavigation: 'group'
  },
  
  // Viewport (scrollable area)
  viewport: {
    base: 'overflow-hidden',
    draggable: 'cursor-grab active:cursor-grabbing'
  },
  
  // Container for slides
  slideContainer: {
    base: 'flex',
    transition: 'transition-transform duration-300 ease-out'
  },
  
  // Individual slide
  slide: {
    base: 'relative flex-[0_0_100%] min-w-0',
    spacing: {
      none: '',
      sm: 'mr-2',
      md: 'mr-4',
      lg: 'mr-6',
      xl: 'mr-8'
    }
  },
  
  // Navigation arrows
  navigation: {
    arrow: {
      base: 'absolute top-1/2 -translate-y-1/2 z-10 flex items-center justify-center transition-all',
      disabled: 'opacity-50 cursor-not-allowed',
      enabled: 'opacity-100 cursor-pointer hover:scale-110',
      variants: {
        circle: 'w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-md',
        square: 'w-10 h-10 rounded bg-white/80 hover:bg-white shadow-md',
        minimal: 'w-8 h-8 text-white hover:text-gray-200'
      },
      position: {
        inside: {
          prev: 'left-4',
          next: 'right-4'
        },
        outside: {
          prev: '-left-12',
          next: '-right-12'
        }
      }
    },
    icon: {
      base: 'w-5 h-5'
    }
  },
  
  // Navigation dots
  dots: {
    container: {
      base: 'flex items-center justify-center gap-2 z-10',
      position: {
        bottom: 'absolute bottom-4 left-1/2 -translate-x-1/2',
        top: 'absolute top-4 left-1/2 -translate-x-1/2',
        left: 'absolute left-4 top-1/2 -translate-y-1/2 flex-col',
        right: 'absolute right-4 top-1/2 -translate-y-1/2 flex-col'
      }
    },
    dot: {
      base: 'transition-all cursor-pointer',
      variants: {
        dots: {
          base: 'w-2 h-2 rounded-full',
          active: 'bg-white w-8',
          inactive: 'bg-white/50 hover:bg-white/70'
        },
        lines: {
          base: 'h-1 rounded-full',
          active: 'bg-white w-8',
          inactive: 'bg-white/50 w-4 hover:bg-white/70'
        },
        numbers: {
          base: 'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
          active: 'bg-white text-black',
          inactive: 'bg-white/20 text-white hover:bg-white/30'
        }
      }
    }
  },
  
  // Hero slider specific
  heroSlider: {
    container: 'relative w-full',
    slide: 'relative w-full h-full',
    image: 'w-full h-full object-cover',
    overlay: 'absolute inset-0 bg-gradient-to-t from-black/50 to-transparent',
    content: 'absolute inset-0 flex items-center justify-center p-8',
    height: {
      sm: 'h-64',
      md: 'h-96',
      lg: 'h-[32rem]',
      xl: 'h-[40rem]',
      full: 'h-screen'
    }
  },
  
  // Product carousel specific
  productCarousel: {
    container: 'relative',
    item: 'relative group',
    image: 'w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300',
    content: 'p-4',
    overlay: 'absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300',
    actions: 'absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300'
  },
  
  // Auto-play indicator
  autoPlay: {
    indicator: 'absolute top-4 right-4 z-10',
    button: 'w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white shadow-md transition-all',
    icon: 'w-4 h-4'
  },
  
  // Progress bar
  progressBar: {
    container: 'absolute bottom-0 left-0 right-0 h-1 bg-black/20',
    fill: 'h-full bg-white transition-all duration-300 ease-linear'
  }
};

// Helper function to get carousel classes
export function getCarouselClasses(
  variant: 'default' | 'hero' | 'product' = 'default',
  className?: string,
  options?: {
    fullWidth?: boolean;
    showNavigation?: boolean;
  }
) {
  return clsx(
    carouselTheme.container.base,
    options?.fullWidth && carouselTheme.container.fullWidth,
    options?.showNavigation && carouselTheme.container.withNavigation,
    className
  );
}

// Helper function to get navigation arrow classes
export function getNavigationArrowClasses(
  variant: 'circle' | 'square' | 'minimal' = 'circle',
  position: 'inside' | 'outside' = 'inside',
  direction: 'prev' | 'next',
  disabled: boolean = false
) {
  return clsx(
    carouselTheme.navigation.arrow.base,
    carouselTheme.navigation.arrow.variants[variant],
    carouselTheme.navigation.arrow.position[position][direction],
    disabled ? carouselTheme.navigation.arrow.disabled : carouselTheme.navigation.arrow.enabled
  );
}

// Helper function to get dot classes
export function getDotClasses(
  variant: 'dots' | 'lines' | 'numbers' = 'dots',
  active: boolean = false
) {
  return clsx(
    carouselTheme.dots.dot.base,
    carouselTheme.dots.dot.variants[variant].base,
    active
      ? carouselTheme.dots.dot.variants[variant].active
      : carouselTheme.dots.dot.variants[variant].inactive
  );
}

// Helper function to get slide classes
export function getSlideClasses(
  spacing: 'none' | 'sm' | 'md' | 'lg' | 'xl' = 'md',
  isLast: boolean = false
) {
  return clsx(
    carouselTheme.slide.base,
    !isLast && carouselTheme.slide.spacing[spacing]
  );
}