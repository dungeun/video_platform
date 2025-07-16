# UI Carousel Examples

## Basic Carousel

```tsx
import { Carousel } from '@repo/ui-carousel';

const items = [
  { id: '1', content: <div>Slide 1</div> },
  { id: '2', content: <div>Slide 2</div> },
  { id: '3', content: <div>Slide 3</div> }
];

function BasicExample() {
  return (
    <Carousel
      items={items}
      autoPlay
      showNavigation
      showDots
    />
  );
}
```

## Hero Slider Example

```tsx
import { HeroSlider } from '@repo/ui-carousel';

const heroItems = [
  {
    id: '1',
    content: '/images/hero-1.jpg',
    metadata: {
      title: 'Summer Collection',
      subtitle: 'Discover the latest trends',
      alt: 'Summer fashion collection'
    }
  },
  {
    id: '2',
    content: '/images/hero-2.jpg',
    metadata: {
      title: 'New Arrivals',
      subtitle: 'Fresh styles for the season',
      alt: 'New fashion arrivals'
    }
  }
];

function HeroExample() {
  return (
    <HeroSlider
      items={heroItems}
      height="xl"
      autoPlay={{ delay: 5000, stopOnInteraction: false }}
      overlay
      fullWidth
    />
  );
}
```

## Product Carousel Example

```tsx
import { ProductCarousel } from '@repo/ui-carousel';

const products = [
  {
    id: '1',
    content: '/images/product-1.jpg',
    metadata: {
      name: 'Classic T-Shirt',
      price: 29.99,
      originalPrice: 39.99
    }
  },
  {
    id: '2',
    content: '/images/product-2.jpg',
    metadata: {
      name: 'Denim Jacket',
      price: 89.99
    }
  },
  {
    id: '3',
    content: '/images/product-3.jpg',
    metadata: {
      name: 'Running Shoes',
      price: 129.99
    }
  }
];

function ProductExample() {
  const handleAddToCart = (item) => {
    console.log('Added to cart:', item.metadata.name);
    // Add to cart logic here
  };

  const handleQuickView = (item) => {
    console.log('Quick view:', item.metadata.name);
    // Quick view modal logic here
  };

  return (
    <ProductCarousel
      items={products}
      itemsPerView={3}
      spacing={20}
      showAddToCart
      showQuickView
      onAddToCart={handleAddToCart}
      onQuickView={handleQuickView}
    />
  );
}
```

## Responsive Carousel Example

```tsx
import { Carousel } from '@repo/ui-carousel';

const responsive = [
  {
    breakpoint: 1200,
    settings: {
      slidesToScroll: 4
    }
  },
  {
    breakpoint: 768,
    settings: {
      slidesToScroll: 2
    }
  },
  {
    breakpoint: 480,
    settings: {
      slidesToScroll: 1
    }
  }
];

function ResponsiveExample() {
  return (
    <Carousel
      items={items}
      options={{
        slidesToScroll: 5,
        align: 'start'
      }}
      responsive={responsive}
    />
  );
}
```

## Custom Hook Usage

```tsx
import { useCarousel, useAutoPlay } from '@repo/ui-carousel';

function CustomCarouselExample() {
  const {
    selectedIndex,
    scrollPrev,
    scrollNext,
    scrollTo,
    canScrollPrev,
    canScrollNext
  } = useCarousel({
    loop: true,
    align: 'center'
  });

  const { isPlaying, toggle, stop, play } = useAutoPlay(
    true,
    { delay: 4000, stopOnInteraction: true },
    scrollNext
  );

  return (
    <div className="relative">
      {/* Custom carousel implementation */}
      <div className="flex gap-4 mb-4">
        <button 
          onClick={scrollPrev}
          disabled={!canScrollPrev}
        >
          Previous
        </button>
        
        <button onClick={toggle}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        
        <button 
          onClick={scrollNext}
          disabled={!canScrollNext}
        >
          Next
        </button>
      </div>
      
      <div className="text-sm text-gray-600">
        Slide {selectedIndex + 1} of {items.length}
      </div>
    </div>
  );
}
```

## Advanced Configuration

```tsx
import { Carousel } from '@repo/ui-carousel';

function AdvancedExample() {
  return (
    <Carousel
      items={items}
      options={{
        loop: true,
        draggable: true,
        dragFree: false,
        align: 'start',
        containScroll: 'trimSnaps',
        slidesToScroll: 2,
        duration: 25,
        startIndex: 0,
        inViewThreshold: 0.7
      }}
      autoPlay={{
        delay: 3000,
        stopOnInteraction: true,
        stopOnMouseEnter: true,
        stopOnFocusIn: true
      }}
      showNavigation
      showDots
      onSlideChange={(index) => {
        console.log('Slide changed to:', index);
      }}
    />
  );
}
```