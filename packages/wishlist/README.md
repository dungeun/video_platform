# @company/wishlist

Comprehensive wishlist management module with favorites tracking, sharing capabilities, stock notifications, price tracking, and collections support.

## Features

### Core Features
- **Wishlist Management**: Create, update, delete, and organize multiple wishlists
- **Item Management**: Add, edit, remove, and organize items within wishlists
- **Favorites Tracking**: Mark and track favorite items across wishlists
- **Price Tracking**: Monitor price changes and get notifications for price drops
- **Stock Notifications**: Get alerts when out-of-stock items become available
- **Collections**: Organize wishlists into manual or smart collections

### Sharing Features
- **Public/Private Wishlists**: Control visibility of your wishlists
- **Share Links**: Generate secure share links with customizable permissions
- **Collaboration**: Allow others to add/edit items in shared wishlists
- **Expiring Shares**: Set expiration dates for shared links

### Notification Features
- **Price Drop Alerts**: Get notified when prices drop by a specified percentage
- **Target Price Alerts**: Set target prices and get notified when reached
- **Stock Availability**: Get notified when items come back in stock
- **Wishlist Activity**: Track when others interact with shared wishlists

## Installation

```bash
npm install @company/wishlist
```

## Usage

### Basic Wishlist Operations

```typescript
import { useWishlist } from '@company/wishlist';

function MyWishlists() {
  const {
    wishlists,
    currentWishlist,
    loading,
    error,
    createWishlist,
    updateWishlist,
    deleteWishlist,
    getWishlist
  } = useWishlist();

  // Create a new wishlist
  const handleCreate = async () => {
    await createWishlist({
      name: 'Birthday Wishlist',
      description: 'Things I want for my birthday',
      isPublic: false,
      tags: ['birthday', 'gifts']
    });
  };

  // Update wishlist settings
  const handleUpdate = async (wishlistId: string) => {
    await updateWishlist(wishlistId, {
      settings: {
        notifyOnPriceChange: true,
        priceDropThreshold: 10, // 10% drop
        notifyOnStock: true
      }
    });
  };

  return (
    <div>
      {wishlists?.wishlists.map(wishlist => (
        <WishlistCard
          key={wishlist.id}
          wishlist={wishlist}
          onEdit={() => handleUpdate(wishlist.id)}
          onDelete={() => deleteWishlist(wishlist.id)}
        />
      ))}
    </div>
  );
}
```

### Managing Wishlist Items

```typescript
import { useWishlistItems } from '@company/wishlist';

function WishlistItems({ wishlistId }: { wishlistId: string }) {
  const {
    items,
    loading,
    addItem,
    updateItem,
    removeItem,
    markAsPurchased,
    sortItems,
    filterItems
  } = useWishlistItems(wishlistId);

  // Add item to wishlist
  const handleAddItem = async () => {
    await addItem(wishlistId, {
      productId: 'prod123',
      productName: 'Amazing Product',
      productImage: 'https://example.com/image.jpg',
      productUrl: 'https://example.com/product',
      currentPrice: 99.99,
      targetPrice: 79.99,
      priority: 'high',
      notes: 'Really want this!',
      tags: ['electronics', 'gadgets']
    });
  };

  // Update item details
  const handleUpdateItem = async (itemId: string) => {
    await updateItem(itemId, {
      priority: 'medium',
      targetPrice: 89.99,
      notes: 'Can wait for a sale'
    });
  };

  // Sort and filter items
  const handleSort = () => {
    sortItems('price', 'asc');
  };

  const handleFilter = () => {
    const filtered = filterItems({
      priority: 'high',
      priceRange: { min: 50, max: 200 }
    });
  };

  return (
    <div>
      {items.map(item => (
        <WishlistItemCard
          key={item.id}
          item={item}
          onEdit={() => handleUpdateItem(item.id)}
          onRemove={() => removeItem(item.id)}
          onPurchase={() => markAsPurchased(item.id)}
        />
      ))}
    </div>
  );
}
```

### Sharing Wishlists

```typescript
import { useWishlistShare } from '@company/wishlist';

function ShareWishlist({ wishlistId }: { wishlistId: string }) {
  const {
    shares,
    shareWishlist,
    revokeShare,
    copyShareLink
  } = useWishlistShare();

  // Share wishlist via email
  const handleShare = async () => {
    const response = await shareWishlist({
      wishlistId,
      sharedWithEmail: 'friend@example.com',
      shareType: 'view',
      message: 'Check out my wishlist!',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    // Copy share link to clipboard
    await copyShareLink(response.share.shareToken);
  };

  return (
    <div>
      <button onClick={handleShare}>Share Wishlist</button>
      {shares.map(share => (
        <div key={share.id}>
          <span>{share.sharedWithEmail}</span>
          <button onClick={() => revokeShare(share.id)}>Revoke</button>
        </div>
      ))}
    </div>
  );
}
```

### Managing Notifications

```typescript
import { useWishlistNotifications } from '@company/wishlist';

function Notifications() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useWishlistNotifications();

  return (
    <div>
      <h3>Notifications ({unreadCount} unread)</h3>
      <button onClick={markAllAsRead}>Mark all as read</button>
      
      {notifications.map(notification => (
        <div key={notification.id} className={notification.isRead ? 'read' : 'unread'}>
          <h4>{notification.title}</h4>
          <p>{notification.message}</p>
          <button onClick={() => markAsRead(notification.id)}>Mark as read</button>
          <button onClick={() => deleteNotification(notification.id)}>Delete</button>
        </div>
      ))}
    </div>
  );
}
```

### Working with Collections

```typescript
import { useCollections } from '@company/wishlist';

function Collections() {
  const {
    collections,
    createCollection,
    addWishlistToCollection,
    removeWishlistFromCollection
  } = useCollections();

  // Create a smart collection
  const handleCreateSmartCollection = async () => {
    await createCollection({
      name: 'High Priority Items',
      type: 'smart',
      rules: [
        {
          field: 'priority',
          operator: 'equals',
          value: 'high'
        },
        {
          field: 'price',
          operator: 'less_than',
          value: 100,
          combineWith: 'AND'
        }
      ]
    });
  };

  // Create a manual collection
  const handleCreateManualCollection = async () => {
    await createCollection({
      name: 'Gift Ideas',
      type: 'manual',
      wishlistIds: ['wishlist1', 'wishlist2']
    });
  };

  return (
    <div>
      {collections.map(collection => (
        <div key={collection.id}>
          <h3>{collection.name}</h3>
          <p>Type: {collection.type}</p>
          <p>Wishlists: {collection.wishlistIds.length}</p>
        </div>
      ))}
    </div>
  );
}
```

## Components

### WishlistCard
Displays a wishlist with its metadata and actions.

```typescript
<WishlistCard
  wishlist={wishlist}
  onEdit={() => handleEdit(wishlist.id)}
  onDelete={() => handleDelete(wishlist.id)}
  onShare={() => handleShare(wishlist.id)}
  onClick={() => navigateToWishlist(wishlist.id)}
/>
```

### WishlistItemCard
Displays a wishlist item with price tracking and actions.

```typescript
<WishlistItemCard
  item={item}
  onEdit={() => handleEdit(item.id)}
  onRemove={() => handleRemove(item.id)}
  onPurchase={() => handlePurchase(item.id)}
  showActions={true}
/>
```

### ShareWishlistModal
Modal for sharing a wishlist with customizable permissions.

```typescript
<ShareWishlistModal
  wishlistId={wishlistId}
  wishlistName={wishlistName}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onShare={handleShare}
/>
```

## Types

### Wishlist
```typescript
interface Wishlist {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  isDefault: boolean;
  shareToken?: string;
  itemCount: number;
  sharedCount: number;
  viewCount: number;
  coverImage?: string;
  tags: string[];
  settings: WishlistSettings;
}
```

### WishlistItem
```typescript
interface WishlistItem {
  id: string;
  wishlistId: string;
  productId: string;
  productName: string;
  productImage?: string;
  productUrl?: string;
  quantity: number;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  targetPrice?: number;
  originalPrice: number;
  currentPrice: number;
  lowestPrice: number;
  highestPrice: number;
  priceHistory: PricePoint[];
  addedAt: Date;
  lastChecked: Date;
  isPurchased: boolean;
  purchasedAt?: Date;
  tags: string[];
  customFields?: Record<string, any>;
}
```

### Collection
```typescript
interface Collection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: 'manual' | 'smart';
  rules?: CollectionRule[];
  wishlistIds: string[];
  coverImage?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  isPublic: boolean;
  shareToken?: string;
}
```

## API Reference

### Hooks

#### useWishlist
- `createWishlist(data: CreateWishlistRequest): Promise<WishlistResponse>`
- `updateWishlist(id: string, data: UpdateWishlistRequest): Promise<WishlistResponse>`
- `deleteWishlist(id: string): Promise<void>`
- `getWishlist(id: string): Promise<WishlistResponse>`
- `getUserWishlists(filters?: WishlistFilters, sort?: WishlistSort): Promise<WishlistListResponse>`
- `getDefaultWishlist(): Promise<WishlistResponse>`
- `generateShareLink(wishlistId: string): Promise<{ token: string; shareUrl: string }>`

#### useWishlistItems
- `addItem(wishlistId: string, data: AddItemRequest): Promise<WishlistItemResponse>`
- `updateItem(itemId: string, data: UpdateItemRequest): Promise<WishlistItemResponse>`
- `removeItem(itemId: string): Promise<void>`
- `moveItems(itemIds: string[], targetWishlistId: string): Promise<void>`
- `markAsPurchased(itemId: string): Promise<void>`
- `refreshPrices(): Promise<void>`
- `sortItems(field: ItemSort['field'], order: ItemSort['order']): void`
- `filterItems(filters: ItemFilters): WishlistItem[]`

#### useWishlistShare
- `shareWishlist(data: ShareWishlistRequest): Promise<ShareResponse>`
- `accessSharedWishlist(shareToken: string): Promise<WishlistShare>`
- `revokeShare(shareId: string): Promise<void>`
- `getWishlistShares(wishlistId: string): Promise<WishlistShare[]>`
- `copyShareLink(shareToken: string): Promise<boolean>`
- `generateQRCode(shareToken: string): string`

#### useWishlistNotifications
- `getNotifications(unreadOnly?: boolean): Promise<NotificationListResponse>`
- `getNotificationsByType(type: NotificationType): Promise<WishlistNotification[]>`
- `markAsRead(notificationId: string): Promise<void>`
- `markAllAsRead(): Promise<void>`
- `deleteNotification(notificationId: string): Promise<void>`

#### useCollections
- `createCollection(data: CreateCollectionRequest): Promise<Collection>`
- `updateCollection(id: string, data: Partial<Collection>): Promise<Collection>`
- `deleteCollection(id: string): Promise<void>`
- `addWishlistToCollection(collectionId: string, wishlistId: string): Promise<void>`
- `removeWishlistFromCollection(collectionId: string, wishlistId: string): Promise<void>`
- `getCollections(): Promise<Collection[]>`
- `getCollectionWishlists(collectionId: string): Promise<Wishlist[]>`
- `refreshSmartCollections(): Promise<void>`

## Configuration

### Wishlist Settings
```typescript
interface WishlistSettings {
  notifyOnPriceChange: boolean;      // Enable price change notifications
  notifyOnStock: boolean;             // Enable stock notifications
  priceDropThreshold?: number;        // Percentage threshold for price drop alerts
  autoRemoveOutOfStock: boolean;      // Auto-remove out of stock items
  allowComments: boolean;             // Allow comments on shared wishlists
  requireApprovalForSharing: boolean; // Require approval for sharing
}
```

### Environment Variables
```bash
# Share URL base (for generating share links)
NEXT_PUBLIC_APP_URL=https://yourapp.com

# Maximum limits
WISHLIST_MAX_PER_USER=50
WISHLIST_MAX_ITEMS=500
WISHLIST_MAX_COLLECTIONS=20

# Cache TTL (seconds)
WISHLIST_CACHE_TTL=300
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## License

MIT