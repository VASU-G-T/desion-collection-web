import { ImageItem, Category, StorageStats } from '../types';
import { INITIAL_IMAGES } from '../data/initialImages';

const DB_NAME = 'PhotoGalleryCloudDB';
const DB_VERSION = 1;
const STORE_NAME = 'gallery_images';

const MAX_CAPACITY = 10000;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('category', 'category', { unique: false });
        store.createIndex('isFavorite', 'isFavorite', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const storageService = {
  async getAllImages(): Promise<ImageItem[]> {
    try {
      const db = await openDB();

      // One-time purge of previously cached images upon user request
      if (!localStorage.getItem('v2_all_cleared_user_req')) {
        localStorage.setItem('v2_all_cleared_user_req', 'true');
        const clearTx = db.transaction(STORE_NAME, 'readwrite');
        clearTx.objectStore(STORE_NAME).clear();
        await new Promise((res) => { clearTx.oncomplete = res; });
        return [];
      }

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const results = (request.result as ImageItem[]) || [];
          results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          resolve(results);
        };

        request.onerror = () => reject(request.error);
      });
    } catch (err) {
      console.warn('IndexedDB read failed', err);
      return [];
    }
  },

  async seedInitialImages(): Promise<void> {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    for (const img of INITIAL_IMAGES) {
      store.put(img);
    }
  },

  async addImage(img: ImageItem): Promise<ImageItem> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put(img);

      transaction.oncomplete = () => resolve(img);
      transaction.onerror = () => reject(transaction.error);
    });
  },

  async updateImage(img: ImageItem): Promise<ImageItem> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.put(img);

      transaction.oncomplete = () => resolve(img);
      transaction.onerror = () => reject(transaction.error);
    });
  },

  async deleteImage(id: string): Promise<void> {
    console.log(`Starting deletion...`);
    console.log(`Received image ID: ${id}`);
    
    if (!id || typeof id !== 'string') {
      console.error('[STORAGE ERROR] Invalid or empty image ID provided for deletion.');
      throw new Error('Invalid storage path or missing image ID.');
    }

    const db = await openDB();

    console.log(`Deleting storage file & database record...`);

    // Step 1: Execute deletion inside readwrite transaction
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.delete(id);

      request.onsuccess = () => {
        console.log(`[STORAGE] Record removal request queued for key: ${id}`);
      };

      request.onerror = (e) => {
        console.error(`[STORAGE ERROR] Delete request failed for key ${id}:`, request.error || e);
      };

      transaction.oncomplete = () => {
        console.log(`Storage deleted successfully`);
        console.log(`Database record deleted`);
        resolve();
      };

      transaction.onerror = (e) => {
        console.error(`❌ Database deletion failed for ID ${id}:`, transaction.error || e);
        reject(transaction.error || new Error('Database deletion failed'));
      };

      transaction.onabort = (e) => {
        console.error(`❌ Transaction aborted during storage deletion for ID ${id}:`, e);
        reject(new Error('Transaction aborted during storage deletion'));
      };
    });

    // Step 2: Verification Read - Confirm the record no longer exists in storage
    const remaining = await new Promise<ImageItem | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result as ImageItem | undefined);
      req.onerror = () => reject(req.error);
    });

    if (remaining) {
      console.error(`❌ Failed to delete image from storage: Item ${id} still exists after deletion.`);
      throw new Error('Failed to delete image from storage');
    }

    console.log(`Refreshing collections...`);
    console.log(`Deletion completed successfully for file ID: ${id}`);
  },

  async deleteMultipleImages(ids: string[]): Promise<void> {
    console.log(`Starting bulk deletion...`);
    console.log(`Received ${ids.length} image IDs`);

    if (!ids || ids.length === 0) {
      return;
    }

    const db = await openDB();

    console.log(`Deleting storage files & database records...`);

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      ids.forEach((id) => {
        store.delete(id);
      });

      transaction.oncomplete = () => {
        console.log(`Storage deleted successfully for bulk items`);
        console.log(`Database records deleted`);
        resolve();
      };

      transaction.onerror = (e) => {
        console.error(`❌ Database deletion failed during bulk operation:`, transaction.error || e);
        reject(transaction.error || new Error('Database deletion failed during bulk delete'));
      };

      transaction.onabort = (e) => {
        console.error(`❌ Transaction aborted during bulk deletion:`, e);
        reject(new Error('Transaction aborted during bulk deletion'));
      };
    });

    // Verification step
    const verifyFailures: string[] = [];
    for (const id of ids) {
      const check = await new Promise<ImageItem | undefined>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(undefined);
      });
      if (check) verifyFailures.push(id);
    }

    if (verifyFailures.length > 0) {
      console.error(`❌ Failed to delete ${verifyFailures.length} image(s) from storage.`);
      throw new Error(`Failed to delete ${verifyFailures.length} image(s) from storage.`);
    }

    console.log(`Refreshing collections...`);
    console.log(`Deletion completed successfully for ${ids.length} files.`);
  },

  async toggleFavorite(id: string): Promise<boolean> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const item = getReq.result as ImageItem | undefined;
        if (item) {
          item.isFavorite = !item.isFavorite;
          const putReq = store.put(item);
          putReq.onsuccess = () => resolve(!!item.isFavorite);
          putReq.onerror = () => reject(putReq.error);
        } else {
          resolve(false);
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  },

  async seedBulkImages(countToAdd: number): Promise<number> {
    const db = await openDB();
    const categories: Category[] = [
      'Typography & Quotes', 'Vintage & Retro', 'Streetwear & Urban', 'Anime & Manga',
      'Cyberpunk & Sci-Fi', 'Minimalist Graphics', 'Gym & Fitness', 'Nature & Wildlife',
      'Gaming & Pop Culture', 'Abstract & Pattern'
    ];

    const sampleUnsplashUrls = [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1600&q=90',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1600&q=90',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1600&q=90',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1600&q=90',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1600&q=90',
      'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?auto=format&fit=crop&w=1600&q=90',
      'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1600&q=90',
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=90'
    ];

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const now = new Date();

      for (let i = 0; i < countToAdd; i++) {
        const cat = categories[i % categories.length];
        const sampleUrl = sampleUnsplashUrls[i % sampleUnsplashUrls.length];
        const randomId = `bulk-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`;
        
        const newImg: ImageItem = {
          id: randomId,
          title: `${cat} T-Shirt Design #${i + 1}`,
          url: sampleUrl,
          thumbnailUrl: sampleUrl.replace('w=1600', 'w=600'),
          category: cat,
          tags: [cat.toLowerCase().replace(/[^a-z0-9]/g, ''), 'tshirt-print', 'graphic', 'apparel'],
          author: `Designer ${100 + (i % 50)}`,
          description: `High-resolution printable vector/raster artwork in ${cat} category. Ready for 300 DPI apparel printing.`,
          aspectRatio: i % 3 === 0 ? 'portrait' : i % 3 === 1 ? 'square' : 'landscape',
          width: 3000,
          height: 3000,
          fileSize: `${(2.5 + (i % 4) * 0.8).toFixed(1)} MB`,
          createdAt: new Date(now.getTime() - i * 600000).toISOString(),
          isFavorite: false,
          views: Math.floor(Math.random() * 500) + 10,
          printSpec: {
            method: i % 2 === 0 ? 'Screen Print' : 'DTG (Direct to Garment)',
            placement: 'Front Chest Graphic',
            dpi: 300,
            colorCount: 'Full Color CMYK',
            suggestedTshirtColor: 'Black / White / Charcoal'
          }
        };

        store.put(newImg);
      }

      transaction.oncomplete = () => resolve(countToAdd);
      transaction.onerror = () => reject(transaction.error);
    });
  },

  async clearAllImages(): Promise<void> {
    localStorage.setItem('gallery_db_initialized', 'true');
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  async restoreDefaultImages(): Promise<void> {
    await this.clearAllImages();
    await this.seedInitialImages();
  },

  async getStorageStats(imagesList: ImageItem[]): Promise<StorageStats> {
    const totalCount = imagesList.length;
    const categoryCounts: Record<string, number> = {};

    let totalMB = 0;
    imagesList.forEach((img) => {
      categoryCounts[img.category] = (categoryCounts[img.category] || 0) + 1;
      const sizeNum = parseFloat(img.fileSize) || 3.5;
      totalMB += sizeNum;
    });

    return {
      totalCount,
      maxCapacity: MAX_CAPACITY,
      usedBytes: totalMB * 1024 * 1024,
      categoryCounts
    };
  }
};
