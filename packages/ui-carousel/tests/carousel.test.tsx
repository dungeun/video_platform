import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Carousel, HeroSlider, ProductCarousel } from '../src';

const mockItems = [
  { id: '1', content: 'Slide 1' },
  { id: '2', content: 'Slide 2' },
  { id: '3', content: 'Slide 3' }
];

describe('Carousel', () => {
  it('renders carousel with items', () => {
    render(<Carousel items={mockItems} />);
    
    expect(screen.getByText('Slide 1')).toBeInTheDocument();
    expect(screen.getByText('Slide 2')).toBeInTheDocument();
    expect(screen.getByText('Slide 3')).toBeInTheDocument();
  });

  it('shows navigation arrows when enabled', () => {
    render(<Carousel items={mockItems} showNavigation />);
    
    expect(screen.getByLabelText('Previous slide')).toBeInTheDocument();
    expect(screen.getByLabelText('Next slide')).toBeInTheDocument();
  });

  it('shows navigation dots when enabled', () => {
    render(<Carousel items={mockItems} showDots />);
    
    expect(screen.getByLabelText('Go to slide 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to slide 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to slide 3')).toBeInTheDocument();
  });

  it('handles slide change callback', async () => {
    const onSlideChange = vi.fn();
    render(
      <Carousel 
        items={mockItems} 
        showNavigation 
        onSlideChange={onSlideChange}
      />
    );
    
    const nextButton = screen.getByLabelText('Next slide');
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(onSlideChange).toHaveBeenCalledWith(1);
    });
  });

  it('renders custom item content', () => {
    const customItems = [
      {
        id: '1',
        content: <div data-testid="custom-content">Custom Content</div>
      }
    ];
    
    render(<Carousel items={customItems} />);
    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
  });
});

describe('HeroSlider', () => {
  const heroItems = [
    {
      id: '1',
      content: '/image1.jpg',
      metadata: {
        title: 'Hero Title',
        subtitle: 'Hero Subtitle'
      }
    }
  ];

  it('renders hero slider with metadata', () => {
    render(<HeroSlider items={heroItems} />);
    
    expect(screen.getByText('Hero Title')).toBeInTheDocument();
    expect(screen.getByText('Hero Subtitle')).toBeInTheDocument();
  });

  it('applies height classes', () => {
    const { container } = render(<HeroSlider items={heroItems} height="xl" />);
    const slider = container.firstChild;
    
    expect(slider).toHaveClass('h-[40rem]');
  });

  it('renders overlay when enabled', () => {
    const { container } = render(<HeroSlider items={heroItems} overlay />);
    const overlay = container.querySelector('.bg-gradient-to-t');
    
    expect(overlay).toBeInTheDocument();
  });
});

describe('ProductCarousel', () => {
  const productItems = [
    {
      id: '1',
      content: '/product1.jpg',
      metadata: {
        name: 'Product 1',
        price: 29.99
      }
    },
    {
      id: '2',
      content: '/product2.jpg',
      metadata: {
        name: 'Product 2',
        price: 39.99
      }
    }
  ];

  it('renders product carousel with metadata', () => {
    render(<ProductCarousel items={productItems} />);
    
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('$39.99')).toBeInTheDocument();
  });

  it('shows action buttons when enabled', () => {
    render(
      <ProductCarousel 
        items={productItems} 
        showAddToCart 
        showQuickView 
      />
    );
    
    const addToCartButtons = screen.getAllByText('Add to Cart');
    const quickViewButtons = screen.getAllByText('Quick View');
    
    expect(addToCartButtons).toHaveLength(2);
    expect(quickViewButtons).toHaveLength(2);
  });

  it('handles action callbacks', () => {
    const onAddToCart = vi.fn();
    const onQuickView = vi.fn();
    
    render(
      <ProductCarousel 
        items={productItems} 
        showAddToCart 
        showQuickView
        onAddToCart={onAddToCart}
        onQuickView={onQuickView}
      />
    );
    
    const addToCartButton = screen.getAllByText('Add to Cart')[0];
    const quickViewButton = screen.getAllByText('Quick View')[0];
    
    fireEvent.click(addToCartButton);
    fireEvent.click(quickViewButton);
    
    expect(onAddToCart).toHaveBeenCalledWith(productItems[0]);
    expect(onQuickView).toHaveBeenCalledWith(productItems[0]);
  });
});