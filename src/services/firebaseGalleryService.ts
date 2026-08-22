import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  increment,
  Unsubscribe,
  getDoc
} from 'firebase/firestore';
import { db, storage } from '../config/firebase';
import { ImageItem, Category, PrintSpec, MockupBackground, GarmentType } from '../types';

const GALLERY_COLLECTION = 'gallery_images';
const BACKGROUNDS_COLLECTION = 'custom_backgrounds';
const OFFERS_COLLECTION = 'offers';
const SETTINGS_COLLECTION = 'site_settings';
const MAX_FILE_SIZE_MB = 25;
const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp'
];

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'Invalid file format. Allowed formats: PNG, JPG, JPEG, WEBP.'
    };
  }

  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > MAX_FILE_SIZE_MB) {
    return {
      valid: false,
      error: `File size exceeds limit (${fileSizeMB.toFixed(1)} MB). Maximum allowed is ${MAX_FILE_SIZE_MB} MB.`
    };
  }

  return { valid: true };
}

// Client-side fast image optimization & compression
async function compressImage(
  file: File,
  maxDimension = 1000,
  quality = 0.80
): Promise<{
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  aspectRatio: 'square' | 'landscape' | 'portrait';
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      let aspectRatio: 'square' | 'landscape' | 'portrait' = 'square';
      if (width / height > 1.1) aspectRatio = 'landscape';
      else if (height / width > 1.1) aspectRatio = 'portrait';

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        fetch(objectUrl)
          .then((r) => r.blob())
          .then((b) => {
            resolve({
              blob: b,
              dataUrl: objectUrl,
              width: img.width,
              height: img.height,
              aspectRatio
            });
          })
          .catch(reject);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      ctx.drawImage(img, 0, 0, width, height);

      // Automatic Background Transparency Processing (Key out dark/black backgrounds)
      try {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Sample corners to check if image has a dark solid background
        const corners = [
          [0, 0],
          [width - 1, 0],
          [0, height - 1],
          [width - 1, height - 1],
        ];

        let totalR = 0, totalG = 0, totalB = 0;
        corners.forEach(([x, y]) => {
          const idx = (y * width + x) * 4;
          totalR += data[idx];
          totalG += data[idx + 1];
          totalB += data[idx + 2];
        });

        const avgLuma = 0.299 * (totalR / 4) + 0.587 * (totalG / 4) + 0.114 * (totalB / 4);

        // If corners are dark (average luma < 55), automatically make dark background transparent
        if (avgLuma < 55) {
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            const luma = 0.299 * r + 0.587 * g + 0.114 * b;
            if (luma < 45) {
              const alphaFactor = Math.max(0, (luma - 5) / 40);
              data[i + 3] = Math.round(a * alphaFactor);
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }
      } catch (e) {
        console.warn('Auto bg transparency processing notice:', e);
      }

      // Save as PNG to preserve transparent alpha channel
      const dataUrl = canvas.toDataURL('image/png');
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, dataUrl, width, height, aspectRatio });
          } else {
            const byteString = atob(dataUrl.split(',')[1]);
            const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const fallbackBlob = new Blob([ab], { type: mimeString });
            resolve({ blob: fallbackBlob, dataUrl, width, height, aspectRatio });
          }
        },
        'image/png'
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to read image artwork file.'));
    };
    img.src = objectUrl;
  });
}

// Generate crisp vector artwork SVG data URLs for instant offline demo seeding
function createSampleArtworkSvg(theme: 'cyber' | 'japan' | 'retrowave' | 'street' | 'minimal' | 'vintage'): string {
  let innerSvg = '';
  if (theme === 'cyber') {
    innerSvg = `
      <defs>
        <linearGradient id="cyberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00f2fe"/>
          <stop offset="100%" stop-color="#4facfe"/>
        </linearGradient>
      </defs>
      <circle cx="300" cy="300" r="220" fill="none" stroke="url(#cyberGrad)" stroke-width="8" stroke-dasharray="15,10"/>
      <polygon points="300,100 450,220 400,420 200,420 150,220" fill="none" stroke="#ff007f" stroke-width="10"/>
      <text x="300" y="290" text-anchor="middle" fill="#00f2fe" font-family="'Inter', sans-serif" font-weight="900" font-size="38" letter-spacing="6">NEON CORE</text>
      <text x="300" y="340" text-anchor="middle" fill="#ff007f" font-family="'Inter', sans-serif" font-weight="700" font-size="20" letter-spacing="8">CYBERPUNK 2088</text>
    `;
  } else if (theme === 'japan') {
    innerSvg = `
      <circle cx="300" cy="240" r="140" fill="#ef4444"/>
      <path d="M 120 420 L 300 220 L 480 420" fill="none" stroke="#ffffff" stroke-width="14" stroke-linecap="round"/>
      <text x="300" y="480" text-anchor="middle" fill="#ffffff" font-family="'Inter', sans-serif" font-weight="900" font-size="34" letter-spacing="10">SAMURAI CREST</text>
    `;
  } else if (theme === 'retrowave') {
    innerSvg = `
      <defs>
        <linearGradient id="retroSun" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#fde047"/>
          <stop offset="100%" stop-color="#ec4899"/>
        </linearGradient>
      </defs>
      <circle cx="300" cy="250" r="150" fill="url(#retroSun)"/>
      <path d="M 100 320 L 500 320 M 100 340 L 500 340 M 100 365 L 500 365 M 100 395 L 500 395" stroke="#0f172a" stroke-width="6"/>
      <text x="300" y="470" text-anchor="middle" fill="#38bdf8" font-family="'Inter', sans-serif" font-weight="900" font-size="42" font-style="italic">OUTRUN '84</text>
    `;
  } else if (theme === 'street') {
    innerSvg = `
      <rect x="80" y="140" width="440" height="320" rx="24" fill="none" stroke="#facc15" stroke-width="12"/>
      <text x="300" y="270" text-anchor="middle" fill="#ffffff" font-family="'Inter', sans-serif" font-weight="900" font-size="54" letter-spacing="4">NO LIMITS</text>
      <text x="300" y="340" text-anchor="middle" fill="#facc15" font-family="'Inter', sans-serif" font-weight="800" font-size="24" letter-spacing="12">STREETWEAR VAULT</text>
    `;
  } else if (theme === 'minimal') {
    innerSvg = `
      <circle cx="300" cy="250" r="100" fill="none" stroke="#ffffff" stroke-width="6"/>
      <line x1="200" y1="250" x2="400" y2="250" stroke="#38bdf8" stroke-width="8"/>
      <text x="300" y="430" text-anchor="middle" fill="#ffffff" font-family="'Inter', sans-serif" font-weight="700" font-size="32" letter-spacing="8">MINIMAL ESSENTIAL</text>
    `;
  } else {
    innerSvg = `
      <circle cx="300" cy="230" r="130" fill="none" stroke="#a855f7" stroke-width="8"/>
      <path d="M 220 330 Q 300 150 380 330" fill="none" stroke="#ec4899" stroke-width="10"/>
      <text x="300" y="440" text-anchor="middle" fill="#ffffff" font-family="'Inter', sans-serif" font-weight="800" font-size="30" letter-spacing="6">VINTAGE BOTANICAL</text>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
    <rect width="600" height="600" rx="36" fill="#090d16"/>
    ${innerSvg}
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_SAMPLE_ARTWORKS: ImageItem[] = [
  {
    id: 'sample-1',
    title: 'Neon Core Cyberpunk Emblem',
    category: 'T-Shirt',
    description: 'High-energy futuristic cyberpunk neon vector print spec for screen printing on dark apparel.',
    author: 'NextPrinters Studio',
    url: createSampleArtworkSvg('cyber'),
    storagePath: '',
    fileSize: '1.2 MB',
    createdAt: new Date().toISOString(),
    downloadCount: 342,
    favoriteCount: 189,
    tags: ['Cyberpunk', 'Neon', 'Screen Print', 'Apparel'],
    aspectRatio: 'square',
    width: 1200,
    height: 1200,
    views: 890,
    printSpec: {
      method: 'Screen Printing',
      colorWay: 'Fluorescent Plastisol 4-Color',
      material: '100% Ring-Spun Cotton',
      printLocation: 'Front Chest',
      dpi: 300,
    },
  },
  {
    id: 'sample-2',
    title: 'Samurai Crest Minimalist Graphic',
    category: 'T-Shirt',
    description: 'Japanese traditional sun crest print artwork designed for oversized streetwear hoodies and tees.',
    author: 'Tokyo Print Co.',
    url: createSampleArtworkSvg('japan'),
    storagePath: '',
    fileSize: '980 KB',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    downloadCount: 520,
    favoriteCount: 310,
    tags: ['Japanese', 'Samurai', 'Minimal', 'Streetwear'],
    aspectRatio: 'square',
    width: 1200,
    height: 1200,
    views: 1240,
    printSpec: {
      method: 'DTG Direct-to-Garment',
      colorWay: 'CMYK + White Underbase',
      material: 'Heavyweight Fleece / Cotton',
      printLocation: 'Full Back',
      dpi: 300,
    },
  },
  {
    id: 'sample-3',
    title: "Outrun Synthwave Sunset '84",
    category: 'Design',
    description: 'Vibrant 80s retro wave synthwave gradient illustration optimized for sublimation and DTG.',
    author: 'RetroVault Art',
    url: createSampleArtworkSvg('retrowave'),
    storagePath: '',
    fileSize: '1.8 MB',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    downloadCount: 412,
    favoriteCount: 245,
    tags: ['Retro', 'Synthwave', 'Sublimation', '80s'],
    aspectRatio: 'square',
    width: 1200,
    height: 1200,
    views: 950,
    printSpec: {
      method: 'Sublimation',
      colorWay: 'Full Color Spectrum',
      material: 'Polyester Blend',
      printLocation: 'Over-Sized Front',
      dpi: 300,
    },
  },
  {
    id: 'sample-4',
    title: 'No Limits Heavy Metal Emblem',
    category: 'T-Shirt',
    description: 'Bold industrial typography streetwear design for heavy cotton oversized boxy T-shirts.',
    author: 'Urban Edge Studio',
    url: createSampleArtworkSvg('street'),
    storagePath: '',
    fileSize: '850 KB',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    downloadCount: 290,
    favoriteCount: 167,
    tags: ['Urban', 'Typography', 'Heavy Metal', 'Streetwear'],
    aspectRatio: 'square',
    width: 1200,
    height: 1200,
    views: 710,
    printSpec: {
      method: 'Screen Printing',
      colorWay: 'Puff Ink Yellow + White',
      material: '240 GSM Oversized Cotton',
      printLocation: 'Front Chest',
      dpi: 300,
    },
  },
  {
    id: 'sample-5',
    title: 'Minimal Geometric Line Art',
    category: 'Design',
    description: 'Clean vector line artwork ideal for subtle pocket prints, sleeve prints, or embroidered patches.',
    author: 'Minimalist Studio',
    url: createSampleArtworkSvg('minimal'),
    storagePath: '',
    fileSize: '620 KB',
    createdAt: new Date(Date.now() - 345600000).toISOString(),
    downloadCount: 198,
    favoriteCount: 112,
    tags: ['Minimal', 'LineArt', 'Embroidery', 'PocketPrint'],
    aspectRatio: 'square',
    width: 1200,
    height: 1200,
    views: 480,
    printSpec: {
      method: 'Embroidery',
      colorWay: 'Precision Thread Count',
      material: 'Cotton / Poly Twill',
      printLocation: 'Left Sleeve',
      dpi: 300,
    },
  },
  {
    id: 'sample-6',
    title: 'Vintage Botanical Orchid Graphic',
    category: 'T-Shirt',
    description: 'Elegantly detailed vintage botanical illustration for soft pastel screen prints.',
    author: 'Botanica Press',
    url: createSampleArtworkSvg('vintage'),
    storagePath: '',
    fileSize: '1.4 MB',
    createdAt: new Date(Date.now() - 432000000).toISOString(),
    downloadCount: 380,
    favoriteCount: 201,
    tags: ['Vintage', 'Botanical', 'ScreenPrint', 'Pastel'],
    aspectRatio: 'square',
    width: 1200,
    height: 1200,
    views: 830,
    printSpec: {
      method: 'Heat Transfer',
      colorWay: 'Soft Touch Water-based Ink',
      material: 'Organic Cotton',
      printLocation: 'Front Chest',
      dpi: 300,
    },
  },
];

export function subscribeToGallery(
  onData: (images: ImageItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, GALLERY_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: ImageItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          title: data.title || 'Untitled Artwork',
          category: (data.category as Category) || 'T-Shirt',
          description: data.description || '',
          author: data.author || 'NextPrinters Team',
          url: data.url || '',
          storagePath: data.storagePath || '',
          fileSize: data.fileSize || '0 KB',
          createdAt: data.createdAt || new Date().toISOString(),
          downloadCount: data.downloadCount || 0,
          favoriteCount: data.favoriteCount || 0,
          tags: Array.isArray(data.tags) ? data.tags : ['Print', 'Design'],
          aspectRatio: data.aspectRatio || 'square',
          width: data.width || 1200,
          height: data.height || 1200,
          views: data.views || 0,
          printSpec: data.printSpec || {
            method: 'Screen Printing',
            colorWay: 'CMYK / 4-Color Process',
            material: '100% Combed Cotton / Heavyweight',
            printLocation: 'Front Chest',
            dpi: 300,
          },
        });
      });

      // Sort by creation date descending
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (items.length === 0) {
        onData(DEFAULT_SAMPLE_ARTWORKS);
      } else {
        onData(items);
      }
    },
    (err) => {
      console.error('Firestore subscription error, using sample items:', err);
      onData(DEFAULT_SAMPLE_ARTWORKS);
      if (onError) onError(err);
    }
  );
}

export async function uploadImageFile(
  file: File,
  metadata: {
    title: string;
    category: Category;
    description: string;
    author: string;
    tags: string[];
    printSpec: PrintSpec;
  },
  onProgress?: (progress: number) => void
): Promise<ImageItem> {
  const val = validateImageFile(file);
  if (!val.valid) {
    throw new Error(val.error || 'Invalid file');
  }

  if (onProgress) onProgress(15);

  // 1. Client-side ultra-fast image compression
  const { blob, dataUrl, width, height, aspectRatio } = await compressImage(file, 1280, 0.82);

  if (onProgress) onProgress(45);

  const timestamp = Date.now();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `gallery_artwork/${timestamp}_${safeFileName}`;
  const storageRef = ref(storage, storagePath);

  let finalDownloadUrl = '';

  // 2. Upload to Firebase Storage with fast 2.5s timeout & instant fallback
  try {
    const uploadTask = uploadBytesResumable(storageRef, blob, {
      contentType: 'image/jpeg'
    });

    const uploadPromise = new Promise<string>((resolve, reject) => {
      const timeoutTimer = setTimeout(() => {
        try { uploadTask.cancel(); } catch {}
        reject(new Error('Ultra-fast storage fallback triggered'));
      }, 1200);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 40) + 45; // 45% to 85%
            if (onProgress) onProgress(Math.min(pct, 85));
          }
        },
        (error) => {
          clearTimeout(timeoutTimer);
          reject(error);
        },
        async () => {
          clearTimeout(timeoutTimer);
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (e) {
            reject(e);
          }
        }
      );
    });

    finalDownloadUrl = await uploadPromise;
  } catch (storageError) {
    console.log('Using optimized fast Data URL for instant rendering:', storageError);
    finalDownloadUrl = dataUrl;
  }

  if (onProgress) onProgress(90);

  const formattedFileSize = formatBytes(blob.size || file.size);
  const docId = `art_${timestamp}`;

  const newItem: ImageItem = {
    id: docId,
    title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
    category: metadata.category,
    description: metadata.description,
    author: metadata.author || 'NextPrinters Studio',
    url: finalDownloadUrl,
    storagePath: storagePath,
    fileSize: formattedFileSize,
    createdAt: new Date().toISOString(),
    downloadCount: 0,
    favoriteCount: 0,
    tags: metadata.tags.length > 0 ? metadata.tags : [metadata.category, 'PrintDesign'],
    aspectRatio: aspectRatio,
    width: width,
    height: height,
    views: 0,
    printSpec: metadata.printSpec,
  };

  // Save metadata to Firestore document
  const docRef = doc(db, GALLERY_COLLECTION, docId);
  await setDoc(docRef, newItem);

  if (onProgress) onProgress(100);

  return newItem;
}

export async function deleteImage(imageId: string, storagePath: string): Promise<void> {
  // 1. Delete Firestore Document
  const docRef = doc(db, GALLERY_COLLECTION, imageId);
  await deleteDoc(docRef);

  // 2. Delete file from Firebase Storage
  if (storagePath) {
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (err) {
      console.warn('Could not delete storage file or already removed:', err);
    }
  }
}

export async function updateImageMetadata(
  imageId: string,
  updatedFields: Partial<ImageItem>
): Promise<void> {
  const docRef = doc(db, GALLERY_COLLECTION, imageId);
  await updateDoc(docRef, updatedFields);
}

export async function incrementDownloadCount(imageId: string): Promise<void> {
  const docRef = doc(db, GALLERY_COLLECTION, imageId);
  await updateDoc(docRef, {
    downloadCount: increment(1)
  });
}

export async function incrementViewCount(imageId: string): Promise<void> {
  const docRef = doc(db, GALLERY_COLLECTION, imageId);
  await updateDoc(docRef, {
    views: increment(1)
  });
}

export async function toggleFavoriteInFirestore(imageId: string, incrementValue: number): Promise<void> {
  const docRef = doc(db, GALLERY_COLLECTION, imageId);
  await updateDoc(docRef, {
    favoriteCount: increment(incrementValue)
  });
}

// Helper: Get Image Dimensions
function getImageDimensions(file: File): Promise<{ width: number; height: number; aspectRatio: 'square' | 'landscape' | 'portrait' }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.width;
      const h = img.height;
      let ratio: 'square' | 'landscape' | 'portrait' = 'square';
      if (w / h > 1.1) ratio = 'landscape';
      else if (h / w > 1.1) ratio = 'portrait';
      resolve({ width: w, height: h, aspectRatio: ratio });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 1200, height: 1200, aspectRatio: 'square' });
    };
    img.src = url;
  });
}

// Helper: Format file bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Subscribe to Admin Custom Backgrounds
export function subscribeToBackgrounds(
  onData: (backgrounds: MockupBackground[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, BACKGROUNDS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: MockupBackground[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          name: data.name || 'Custom Garment Background',
          category: (data.category as GarmentType) || 'tshirt',
          imageUrl: data.imageUrl || '',
          storagePath: data.storagePath || '',
          createdAt: data.createdAt || new Date().toISOString(),
          uploadedByAdmin: true,
        });
      });

      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      onData(items);
    },
    (err) => {
      console.error('Firestore backgrounds subscription error:', err);
      if (onError) onError(err);
    }
  );
}

// Upload Permanent Garment Background (Admin)
export async function uploadBackgroundFile(
  file: File,
  metadata: { name: string; category: GarmentType },
  onProgress?: (progress: number) => void
): Promise<MockupBackground> {
  const val = validateImageFile(file);
  if (!val.valid) {
    throw new Error(val.error || 'Invalid file');
  }

  if (onProgress) onProgress(15);

  const { blob, dataUrl } = await compressImage(file, 1280, 0.85);

  if (onProgress) onProgress(45);

  const timestamp = Date.now();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `custom_backgrounds/${timestamp}_${safeFileName}`;
  const storageRef = ref(storage, storagePath);

  let finalDownloadUrl = '';

  try {
    const uploadTask = uploadBytesResumable(storageRef, blob, {
      contentType: file.type || 'image/jpeg',
    });

    const uploadPromise = new Promise<string>((resolve, reject) => {
      const timeoutTimer = setTimeout(() => {
        try { uploadTask.cancel(); } catch {}
        reject(new Error('Storage fallback triggered for background upload'));
      }, 1500);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 40) + 45;
            if (onProgress) onProgress(Math.min(pct, 85));
          }
        },
        (error) => {
          clearTimeout(timeoutTimer);
          reject(error);
        },
        async () => {
          clearTimeout(timeoutTimer);
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (e) {
            reject(e);
          }
        }
      );
    });

    finalDownloadUrl = await uploadPromise;
  } catch (storageError) {
    console.log('Using optimized fast Data URL for background image:', storageError);
    finalDownloadUrl = dataUrl;
  }

  if (onProgress) onProgress(90);

  const docId = `bg_${timestamp}`;
  const newBg: MockupBackground = {
    id: docId,
    name: metadata.name || file.name.replace(/\.[^/.]+$/, ''),
    category: metadata.category,
    imageUrl: finalDownloadUrl,
    storagePath: storagePath,
    createdAt: new Date().toISOString(),
    uploadedByAdmin: true,
  };

  const docRef = doc(db, BACKGROUNDS_COLLECTION, docId);
  await setDoc(docRef, newBg);

  if (onProgress) onProgress(100);

  return newBg;
}

// Delete Permanent Garment Background (Admin Only)
export async function deleteBackground(bgId: string, storagePath?: string): Promise<void> {
  const docRef = doc(db, BACKGROUNDS_COLLECTION, bgId);
  await deleteDoc(docRef);

  if (storagePath) {
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (err) {
      console.warn('Could not delete background storage file:', err);
    }
  }
}

// --- OFFERS SYSTEM ---
export function subscribeToOffers(
  onData: (offers: import('../types').Offer[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, OFFERS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: import('../types').Offer[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          title: data.title || '',
          description: data.description || '',
          imageUrl: data.imageUrl || '',
          storagePath: data.storagePath || '',
          couponCode: data.couponCode || '',
          isActive: data.isActive ?? true,
          createdAt: data.createdAt || new Date().toISOString(),
        });
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(items);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

export async function uploadOfferBanner(
  file: File,
  metadata: { title: string; description: string; couponCode: string; isActive: boolean },
  onProgress?: (progress: number) => void
): Promise<import('../types').Offer> {
  const { blob, dataUrl } = await compressImage(file, 1280, 0.85);
  const timestamp = Date.now();
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `offers/${timestamp}_${safeFileName}`;
  const storageRef = ref(storage, storagePath);
  let finalDownloadUrl = dataUrl;

  try {
    const uploadTask = uploadBytesResumable(storageRef, blob, { contentType: file.type || 'image/jpeg' });
    finalDownloadUrl = await new Promise<string>((resolve, reject) => {
      uploadTask.on('state_changed', null, reject, async () => {
        try {
          resolve(await getDownloadURL(uploadTask.snapshot.ref));
        } catch (e) {
          reject(e);
        }
      });
    });
  } catch (err) {
    console.warn('Fallback to data URL for offer:', err);
  }

  const docId = `offer_${timestamp}`;
  const newOffer: import('../types').Offer = {
    id: docId,
    title: metadata.title,
    description: metadata.description,
    imageUrl: finalDownloadUrl,
    storagePath: storagePath,
    couponCode: metadata.couponCode,
    isActive: metadata.isActive,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, OFFERS_COLLECTION, docId), newOffer);
  return newOffer;
}

export async function updateOffer(offerId: string, updates: Partial<import('../types').Offer>) {
  await updateDoc(doc(db, OFFERS_COLLECTION, offerId), updates);
}

export async function deleteOffer(offerId: string, storagePath: string) {
  await deleteDoc(doc(db, OFFERS_COLLECTION, offerId));
  if (storagePath) {
    try {
      await deleteObject(ref(storage, storagePath));
    } catch (e) {}
  }
}

// --- SITE SETTINGS ---
export async function getSiteSettings(): Promise<import('../types').SiteSettings | null> {
  try {
    const docSnap = await getDoc(doc(db, SETTINGS_COLLECTION, 'main_config'));
    if (docSnap.exists()) {
      return docSnap.data() as import('../types').SiteSettings;
    }
  } catch (e) {
    console.warn('Error fetching site settings', e);
  }
  return null;
}

export async function updateSiteSettings(settings: import('../types').SiteSettings) {
  await setDoc(doc(db, SETTINGS_COLLECTION, 'main_config'), settings, { merge: true });
}

export async function uploadSiteLogo(file: File): Promise<{ url: string; storagePath: string }> {
  const { blob, dataUrl } = await compressImage(file, 500, 0.90);
  const storagePath = `brand/logo_${Date.now()}.png`;
  const storageRef = ref(storage, storagePath);
  let finalUrl = dataUrl;
  
  try {
    const uploadTask = uploadBytesResumable(storageRef, blob, { contentType: 'image/png' });
    finalUrl = await new Promise<string>((resolve, reject) => {
      uploadTask.on('state_changed', null, reject, async () => {
        resolve(await getDownloadURL(uploadTask.snapshot.ref));
      });
    });
  } catch (e) {
    console.warn('Logo upload fallback', e);
  }
  return { url: finalUrl, storagePath };
}

export async function uploadPaymentQrCode(file: File): Promise<{ url: string; storagePath: string }> {
  const { blob, dataUrl } = await compressImage(file, 800, 0.92);
  const storagePath = `brand/qr_${Date.now()}.png`;
  const storageRef = ref(storage, storagePath);
  let finalUrl = dataUrl;

  try {
    const uploadTask = uploadBytesResumable(storageRef, blob, { contentType: file.type || 'image/png' });
    finalUrl = await new Promise<string>((resolve, reject) => {
      uploadTask.on('state_changed', null, reject, async () => {
        resolve(await getDownloadURL(uploadTask.snapshot.ref));
      });
    });
  } catch (e) {
    console.warn('QR Code upload fallback', e);
  }
  return { url: finalUrl, storagePath };
}

// --- T-SHIRT CUSTOMER ORDERS ---
const ORDERS_COLLECTION = 'tshirt_orders';

export async function createTShirtOrder(
  orderData: Omit<import('../types').TShirtOrder, 'id' | 'createdAt' | 'status'>,
  paymentProofFile?: File | null
): Promise<import('../types').TShirtOrder> {
  const timestamp = Date.now();
  const orderId = `ord_${timestamp}`;
  let paymentProofUrl = orderData.paymentProofUrl || '';

  if (paymentProofFile) {
    try {
      const { blob, dataUrl } = await compressImage(paymentProofFile, 1200, 0.85);
      const storagePath = `order_proofs/${orderId}_proof.png`;
      const storageRef = ref(storage, storagePath);
      paymentProofUrl = dataUrl;
      const uploadTask = uploadBytesResumable(storageRef, blob, { contentType: paymentProofFile.type || 'image/png' });
      paymentProofUrl = await new Promise<string>((resolve, reject) => {
        uploadTask.on('state_changed', null, reject, async () => {
          resolve(await getDownloadURL(uploadTask.snapshot.ref));
        });
      });
    } catch (e) {
      console.warn('Payment proof upload fallback', e);
    }
  }

  const newOrder: import('../types').TShirtOrder = {
    ...orderData,
    id: orderId,
    createdAt: new Date().toISOString(),
    status: 'Pending',
    paymentProofUrl,
  };

  await setDoc(doc(db, ORDERS_COLLECTION, orderId), newOrder);
  return newOrder;
}

export function subscribeToOrders(
  onData: (orders: import('../types').TShirtOrder[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, ORDERS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: import('../types').TShirtOrder[] = [];
      snapshot.forEach((docSnap) => {
        items.push({
          id: docSnap.id,
          ...docSnap.data(),
        } as import('../types').TShirtOrder);
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(items);
    },
    (err) => {
      console.error('Firestore orders subscription error:', err);
      if (onError) onError(err);
    }
  );
}

export async function updateOrderStatus(orderId: string, status: import('../types').TShirtOrder['status']) {
  await updateDoc(doc(db, ORDERS_COLLECTION, orderId), { status });
}

