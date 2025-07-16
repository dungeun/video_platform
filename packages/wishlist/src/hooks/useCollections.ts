import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@repo/auth-core';
import { CollectionService } from '../services';
import { CreateCollectionRequest } from '../types';
import { Collection } from '../entities';

export function useCollections() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [currentCollection, setCurrentCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize service (in real app, this would be injected)
  const collectionService = new CollectionService(
    {} as any, // Repository implementations
    {} as any
  );

  const createCollection = useCallback(async (data: CreateCollectionRequest) => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const collection = await collectionService.createCollection(user.id, data);
      setCollections(prev => [...prev, collection]);
      return collection;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateCollection = useCallback(async (
    collectionId: string,
    data: Partial<Collection>
  ) => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updated = await collectionService.updateCollection(collectionId, user.id, data);
      
      setCollections(prev => prev.map(c => 
        c.id === collectionId ? updated : c
      ));
      
      if (currentCollection?.id === collectionId) {
        setCurrentCollection(updated);
      }
      
      return updated;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, currentCollection]);

  const deleteCollection = useCallback(async (collectionId: string) => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await collectionService.deleteCollection(collectionId, user.id);
      
      setCollections(prev => prev.filter(c => c.id !== collectionId));
      
      if (currentCollection?.id === collectionId) {
        setCurrentCollection(null);
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, currentCollection]);

  const addWishlistToCollection = useCallback(async (
    collectionId: string,
    wishlistId: string
  ) => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await collectionService.addWishlistToCollection(collectionId, wishlistId, user.id);
      
      // Update local state
      setCollections(prev => prev.map(c => {
        if (c.id === collectionId) {
          return {
            ...c,
            wishlistIds: [...c.wishlistIds, wishlistId]
          };
        }
        return c;
      }));
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const removeWishlistFromCollection = useCallback(async (
    collectionId: string,
    wishlistId: string
  ) => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await collectionService.removeWishlistFromCollection(collectionId, wishlistId, user.id);
      
      // Update local state
      setCollections(prev => prev.map(c => {
        if (c.id === collectionId) {
          return {
            ...c,
            wishlistIds: c.wishlistIds.filter(id => id !== wishlistId)
          };
        }
        return c;
      }));
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getCollections = useCallback(async () => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userCollections = await collectionService.getCollections(user.id);
      setCollections(userCollections);
      return userCollections;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getCollectionWishlists = useCallback(async (collectionId: string) => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const wishlists = await collectionService.getCollectionWishlists(collectionId, user.id);
      return wishlists;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refreshSmartCollections = useCallback(async () => {
    if (!user) {
      setError(new Error('User not authenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await collectionService.refreshSmartCollections(user.id);
      // Reload collections
      await getCollections();
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, getCollections]);

  const reorderCollections = useCallback((reorderedCollections: Collection[]) => {
    // Update sort order locally
    const updated = reorderedCollections.map((collection, index) => ({
      ...collection,
      sortOrder: index
    }));
    
    setCollections(updated);
    
    // In a real app, you'd also update the server
    // For each collection, call updateCollection with new sortOrder
  }, []);

  // Load collections on mount
  useEffect(() => {
    if (user) {
      getCollections();
    }
  }, [user]);

  return {
    collections,
    currentCollection,
    loading,
    error,
    createCollection,
    updateCollection,
    deleteCollection,
    addWishlistToCollection,
    removeWishlistFromCollection,
    getCollections,
    getCollectionWishlists,
    refreshSmartCollections,
    reorderCollections,
    setCurrentCollection
  };
}