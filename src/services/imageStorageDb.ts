// IndexedDB storage service for unlimited local image blob persistence
const DB_NAME = 'NextPrintersImageDB';
const STORE_NAME = 'image_blobs';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported in this browser environment.'));
    }

    // Request persistent storage for large high-res artwork persistence
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then((persisted) => {
        if (persisted) console.log('Storage persistence granted for high-capacity artwork vault.');
      }).catch(() => {});
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function storeImageInIndexedDb(key: string, data: Blob | string): Promise<string> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(data, key);
      req.onsuccess = () => resolve(`idb://${key}`);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('IndexedDB store image failed:', e);
    return '';
  }
}

export async function getImageFromIndexedDb(key: string): Promise<string | null> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        const val = req.result;
        if (!val) {
          resolve(null);
        } else if (val instanceof Blob) {
          resolve(URL.createObjectURL(val));
        } else if (typeof val === 'string') {
          resolve(val);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (e) {
    return null;
  }
}
