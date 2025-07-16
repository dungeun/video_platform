# @company/shopping-cart

E-commerce shopping cart module with comprehensive cart management functionality.

## Features

- **Item Management**: Add, update, remove items with quantity controls
- **Price Calculations**: Automatic subtotal, tax, shipping, and discount calculations
- **Cart Persistence**: Local/session storage with sync capabilities
- **Guest Cart Support**: Anonymous shopping with expiration handling
- **Validation**: Comprehensive input validation and business rules
- **React Integration**: Hooks and components for easy UI integration
- **API Support**: Optional backend synchronization

## Installation

```bash
npm install @company/shopping-cart
```

## Basic Usage

### Provider Setup

```tsx
import { CartProvider } from '@company/shopping-cart';

function App() {
  return (
    <CartProvider
      config={{
        maxItems: 100,
        maxQuantityPerItem: 99,
        enableGuestCart: true,
        taxRate: 0.08,
        currency: 'USD'
      }}
      userId={user?.id}
    >
      <YourApp />
    </CartProvider>
  );
}
```

### Using Cart Hook

```tsx
import { useCart } from '@company/shopping-cart';

function ProductPage({ product }) {
  const { addItem, cart, loading } = useCart();

  const handleAddToCart = async () => {
    const result = await addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image
    });

    if (result.success) {
      console.log('Item added successfully');
    }
  };

  return (
    <button onClick={handleAddToCart} disabled={loading}>
      Add to Cart
    </button>
  );
}
```

### Cart Components

```tsx
import { CartList, CartSummary, MiniCart } from '@company/shopping-cart';

// Full cart page
function CartPage() {
  const { cart, cartSummary, updateItem, removeItem } = useCart();

  if (!cart) return null;

  return (
    <div>
      <CartList
        cart={cart}
        onItemQuantityChange={(itemId, quantity) => 
          updateItem({ itemId, quantity })
        }
        onItemRemove={removeItem}
      />
      <CartSummary 
        summary={cartSummary}
        onCheckout={() => navigate('/checkout')}
      />
    </div>
  );
}

// Mini cart dropdown
function Header() {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <button onClick={() => setCartOpen(true)}>
        Cart
      </button>
      <MiniCart
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => navigate('/checkout')}
      />
    </>
  );
}
```

## Advanced Features

### Cart Persistence

```tsx
import { useCartPersistence } from '@company/shopping-cart';

function App() {
  // Enable cart persistence with sync
  useCartPersistence({
    enabled: true,
    type: 'local',
    syncInterval: 30000, // 30 seconds
    onSyncError: (error) => console.error('Sync failed:', error)
  });
}
```

### Custom Calculations

```tsx
import { CartCalculator } from '@company/shopping-cart';

const calculator = new CartCalculator();

// Apply discount rules
const discount = calculator.calculateDiscount(cart, [
  { type: 'percentage', value: 10, minAmount: 100 },
  { type: 'fixed', value: 5, minQuantity: 3 }
]);

// Calculate shipping
const shipping = calculator.calculateShipping(cart, {
  type: 'flat',
  value: 10,
  freeShippingThreshold: 50
});
```

### API Integration

```tsx
import { CartProvider, HttpClient } from '@company/shopping-cart';

const httpClient = new HttpClient({ baseURL: '/api' });

<CartProvider
  httpClient={httpClient}
  enableApi={true}
>
  <App />
</CartProvider>
```

## API Reference

### Types

- `Cart` - Main cart interface
- `CartItem` - Individual item in cart
- `CartSummary` - Summary calculations
- `CartConfig` - Configuration options

### Hooks

- `useCart()` - Main cart operations
- `useCartItem(productId, variantId)` - Individual item management
- `useCartPersistence(options)` - Storage and sync

### Services

- `CartService` - Core cart logic
- `CartCalculator` - Price calculations
- `CartValidator` - Input validation

### Components

- `<AddToCartButton>` - Add to cart button
- `<CartItem>` - Individual cart item display
- `<CartList>` - List of cart items
- `<CartSummary>` - Cart totals display
- `<MiniCart>` - Slide-out cart panel

## Configuration

```typescript
interface CartConfig {
  maxItems?: number;              // Max items in cart (default: 100)
  maxQuantityPerItem?: number;    // Max quantity per item (default: 99)
  enableGuestCart?: boolean;      // Allow guest carts (default: true)
  guestCartExpiry?: number;       // Guest cart expiry in hours (default: 24)
  persistence?: {
    type: 'local' | 'session';
    syncInterval?: number;
    enableOffline?: boolean;
  };
  taxRate?: number;               // Tax rate (0-1)
  currency?: string;              // Currency code (default: 'USD')
}
```

## Testing

```bash
npm test
```

## License

MIT