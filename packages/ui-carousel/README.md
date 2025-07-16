# @repo/ui-carousel

A comprehensive carousel component library with hero slider, product carousel, auto-play, touch/swipe support, navigation dots, and responsive design.

## Features

- 🎨 Multiple carousel variants (Default, Hero, Product)
- 🖱️ Touch and swipe support
- ⏯️ Auto-play functionality
- 📱 Fully responsive
- ♿ Accessible navigation
- 🎯 Navigation dots and arrows
- 🚀 Performance optimized with Embla Carousel
- 💅 Customizable styling with Tailwind CSS
- 📦 Tree-shakeable exports

## Installation

```bash
npm install @repo/ui-carousel
```

## Basic Usage

```tsx
import { Carousel } from '@repo/ui-carousel';

const items = [
  { id: '1', content: 'Slide 1' },
  { id: '2', content: 'Slide 2' },
  { id: '3', content: 'Slide 3' }
];

function App() {
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

## Hero Slider

```tsx
import { HeroSlider } from '@repo/ui-carousel';

const heroItems = [
  {
    id: '1',
    content: '/images/hero1.jpg',
    metadata: {
      title: 'Welcome to Our Store',
      subtitle: 'Discover amazing products'
    }
  },
  {
    id: '2',
    content: '/images/hero2.jpg',
    metadata: {
      title: 'New Collection',
      subtitle: 'Shop the latest trends'
    }
  }
];

function HeroSection() {
  return (
    <HeroSlider
      items={heroItems}
      height="xl"
      autoPlay={{ delay: 5000 }}
      overlay
    />
  );
}
```

## Product Carousel

```tsx
import { ProductCarousel } from '@repo/ui-carousel';

const products = [
  {
    id: '1',
    content: '/images/product1.jpg',
    metadata: {
      name: 'Product Name',
      price: 29.99
    }
  },
  // ... more products
];

function ProductSection() {
  return (
    <ProductCarousel
      items={products}
      itemsPerView={4}
      spacing={20}
      showAddToCart
      showQuickView
      onAddToCart={(item) => console.log('Add to cart:', item)}
      onQuickView={(item) => console.log('Quick view:', item)}
    />
  );
}
```

## Advanced Configuration

### Responsive Design

```tsx
import { Carousel } from '@repo/ui-carousel';

const responsiveOptions = [
  {
    breakpoint: 1200,
    settings: { slidesToScroll: 3 }
  },
  {
    breakpoint: 768,
    settings: { slidesToScroll: 2 }
  },
  {
    breakpoint: 480,
    settings: { slidesToScroll: 1 }
  }
];

function ResponsiveCarousel() {
  return (
    <Carousel
      items={items}
      options={{
        slidesToScroll: 4,
        align: 'start'
      }}
      responsive={responsiveOptions}
    />
  );
}
```

### Custom Hooks

```tsx
import { useCarousel, useAutoPlay } from '@repo/ui-carousel';

function CustomCarousel() {
  const {
    selectedIndex,
    scrollPrev,
    scrollNext,
    scrollTo,
    canScrollPrev,
    canScrollNext
  } = useCarousel({ loop: true });

  const { isPlaying, toggle } = useAutoPlay(
    true,
    { delay: 3000 },
    scrollNext
  );

  return (
    <div>
      {/* Custom carousel implementation */}
    </div>
  );
}
```

## API Reference

### Carousel Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| items | CarouselItem[] | required | Array of carousel items |
| variant | 'default' \| 'hero' \| 'product' | 'default' | Carousel variant |
| options | CarouselOptions | {} | Embla carousel options |
| autoPlay | boolean \| AutoPlayOptions | false | Auto-play configuration |
| showNavigation | boolean | true | Show navigation arrows |
| showDots | boolean | true | Show navigation dots |
| className | string | - | Additional CSS classes |
| onSlideChange | (index: number) => void | - | Slide change callback |

### CarouselItem

```typescript
interface CarouselItem {
  id: string;
  content: ReactNode;
  metadata?: Record<string, any>;
}
```

### CarouselOptions

```typescript
interface CarouselOptions {
  loop?: boolean;
  draggable?: boolean;
  dragFree?: boolean;
  align?: 'start' | 'center' | 'end';
  containScroll?: 'trimSnaps' | 'keepSnaps' | false;
  slidesToScroll?: number;
  duration?: number;
  startIndex?: number;
}
```

## Styling

The carousel components use Tailwind CSS classes that can be customized through the theme configuration or by passing custom classes.

### Custom Theme

```tsx
import { carouselTheme } from '@repo/ui-carousel';

// Extend or override theme
const customTheme = {
  ...carouselTheme,
  container: {
    ...carouselTheme.container,
    base: 'relative overflow-hidden rounded-xl'
  }
};
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- iOS Safari (latest)
- Chrome for Android (latest)

## License

MIT