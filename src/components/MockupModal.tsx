import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ImageItem, AdminUser, MockupBackground, GarmentType, SiteSettings } from '../types';
export type { GarmentType, MockupBackground };
import { uploadBackgroundFile, deleteBackground } from '../services/firebaseGalleryService';
import { OrderTShirtModal } from './OrderTShirtModal';
import {
  X,
  Sparkles,
  RotateCcw,
  Move,
  Maximize2,
  Minimize2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  FolderPlus,
  Shirt,
  Download,
  Lock,
  Loader2,
  Check,
  ShieldCheck,
  Layers,
  ShoppingBag
} from 'lucide-react';

export interface PlacedArtwork {
  id: string;
  url: string;
  title: string;
  scale: number;
  positionX: number;
  positionY: number;
  rotation: number;
  blendMode: 'normal' | 'multiply' | 'screen';
  imageBrightness: number;
  imageContrast: number;
}

interface MockupModalProps {
  isOpen: boolean;
  image: ImageItem | null;
  allImages?: ImageItem[];
  customBackgrounds?: MockupBackground[];
  adminUser?: AdminUser | null;
  siteSettings?: SiteSettings | null;
  onClose: () => void;
}

// Generate crisp, instant-loading vector SVG garment blank data URLs
function createGarmentSvgDataUrl(colorHex: string, label: string): string {
  const isDark = colorHex === '#121316' || colorHex === '#18181b' || colorHex === '#1e3a8a' || colorHex === '#991b1b';
  const strokeColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)';

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 600" width="500" height="600">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.15"/>
        <stop offset="50%" stop-color="#000000" stop-opacity="0.0"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.3"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000000" flood-opacity="0.4"/>
      </filter>
    </defs>
    <g filter="url(#shadow)">
      <path d="M 150 60 Q 200 80 250 80 Q 300 80 350 60 L 460 140 Q 480 155 450 195 L 390 170 L 390 530 Q 390 550 370 550 L 130 550 Q 110 550 110 530 L 110 170 L 50 195 Q 20 155 40 140 Z" fill="${colorHex}"/>
      <path d="M 150 60 Q 200 80 250 80 Q 300 80 350 60 L 460 140 Q 480 155 450 195 L 390 170 L 390 530 Q 390 550 370 550 L 130 550 Q 110 550 110 530 L 110 170 L 50 195 Q 20 155 40 140 Z" fill="url(#grad)"/>
      <path d="M 150 60 Q 250 110 350 60 Q 250 85 150 60 Z" fill="#000000" opacity="0.2"/>
      <path d="M 150 60 Q 250 110 350 60" fill="none" stroke="${strokeColor}" stroke-width="3"/>
      <path d="M 110 170 L 150 60" fill="none" stroke="${strokeColor}" stroke-width="2"/>
      <path d="M 390 170 L 350 60" fill="none" stroke="${strokeColor}" stroke-width="2"/>
    </g>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
}

// Realistic Default T-Shirt Apparel Blanks
const DEFAULT_GARMENT_BACKGROUNDS: MockupBackground[] = [
  {
    id: 'blank-black-tee',
    name: 'Jet Black Heavyweight Tee',
    category: 'tshirt',
    imageUrl: createGarmentSvgDataUrl('#121316', 'Jet Black'),
  },
  {
    id: 'blank-white-tee',
    name: 'Off-White Soft Cotton Tee',
    category: 'tshirt',
    imageUrl: createGarmentSvgDataUrl('#f3f4f6', 'Off-White'),
  },
  {
    id: 'blank-navy-tee',
    name: 'Royal Navy Crew Tee',
    category: 'tshirt',
    imageUrl: createGarmentSvgDataUrl('#1e3a8a', 'Royal Navy'),
  },
  {
    id: 'blank-red-tee',
    name: 'Crimson Red Streetwear Tee',
    category: 'tshirt',
    imageUrl: createGarmentSvgDataUrl('#991b1b', 'Crimson Red'),
  },
];

export const MockupModal: React.FC<MockupModalProps> = ({
  isOpen,
  image,
  allImages = [],
  customBackgrounds = [],
  adminUser = null,
  onClose,
}) => {
  if (!isOpen) return null;

  // PRIVATE INSTANT SESSION UPLOADS (Customer temporary session uploads)
  const [sessionTempBgs, setSessionTempBgs] = useState<MockupBackground[]>([]);
  const [sessionTempArtworks, setSessionTempArtworks] = useState<{ id: string; title: string; url: string; isTemp?: boolean }[]>([]);

  // Raw file selection for background upload
  const [newBgFile, setNewBgFile] = useState<File | null>(null);
  const [isUploadingBg, setIsUploadingBg] = useState(false);

  // T-Shirt Backgrounds List:
  // 1. Customer Session Temporary Uploads
  // 2. Permanent Admin Firestore Custom Backgrounds (shared across all users)
  // 3. Default Vector Apparel Blanks
  const allBackgrounds = useMemo(() => {
    return [...sessionTempBgs, ...customBackgrounds, ...DEFAULT_GARMENT_BACKGROUNDS];
  }, [sessionTempBgs, customBackgrounds]);

  // Print Design Artworks List
  const allArtworks = useMemo(() => {
    return [...sessionTempArtworks, ...allImages];
  }, [sessionTempArtworks, allImages]);

  // Active Selected T-Shirt Background
  const [selectedBackground, setSelectedBackground] = useState<MockupBackground | null>(() => {
    if (customBackgrounds.length > 0) return customBackgrounds[0];
    if (DEFAULT_GARMENT_BACKGROUNDS.length > 0) return DEFAULT_GARMENT_BACKGROUNDS[0];
    return null;
  });

  // Active Print Artwork URL
  const [activeArtworkUrl, setActiveArtworkUrl] = useState<string>(image?.url || '');

  // T-Shirt Canvas Size (Zoom)
  const [tshirtZoom, setTshirtZoom] = useState<number>(100);

  // Add Background Form State
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [newBgTitle, setNewBgTitle] = useState('');
  const [newBgImageUrl, setNewBgImageUrl] = useState('');
  const [newBgCategory, setNewBgCategory] = useState<GarmentType>('tshirt');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Multi-Design Placed Artworks State
  const [placedArtworks, setPlacedArtworks] = useState<PlacedArtwork[]>(() => {
    if (image?.url) {
      return [
        {
          id: `art-initial-${Date.now()}`,
          url: image.url,
          title: image.title || 'Print Design',
          scale: 50,
          positionX: 0,
          positionY: 35,
          rotation: 0,
          blendMode: 'normal',
          imageBrightness: 120,
          imageContrast: 120,
        },
      ];
    }
    return [];
  });

  const [selectedArtId, setSelectedArtId] = useState<string | null>(placedArtworks[0]?.id || null);

  // Canvas element ref
  const canvasRef = useRef<HTMLDivElement>(null);

  // Dragging state and ref
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; startX: number; startY: number }>({
    x: 0,
    y: 0,
    startX: 0,
    startY: 35,
  });

  // Download state
  const [isDownloading, setIsDownloading] = useState(false);

  // Selected Artwork helper
  const selectedArt = useMemo(() => {
    return placedArtworks.find((a) => a.id === selectedArtId) || placedArtworks[0] || null;
  }, [placedArtworks, selectedArtId]);

  // Convenient getters for transform controls
  const scale = selectedArt?.scale ?? 50;
  const positionX = selectedArt?.positionX ?? 0;
  const positionY = selectedArt?.positionY ?? 35;
  const rotation = selectedArt?.rotation ?? 0;
  const blendMode = selectedArt?.blendMode ?? 'normal';
  const imageBrightness = selectedArt?.imageBrightness ?? 120;
  const imageContrast = selectedArt?.imageContrast ?? 120;

  // Update selected artwork property
  const updateSelectedArt = (key: keyof PlacedArtwork, val: any) => {
    if (!selectedArtId) return;
    setPlacedArtworks((prev) =>
      prev.map((art) => (art.id === selectedArtId ? { ...art, [key]: val } : art))
    );
  };

  // Add new design to T-shirt
  const handleAddArtworkToTshirt = (url: string, title: string) => {
    const newArt: PlacedArtwork = {
      id: `art-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      url,
      title,
      scale: 40,
      positionX: ((placedArtworks.length * 8) % 30) - 15,
      positionY: 30 + ((placedArtworks.length * 8) % 25),
      rotation: 0,
      blendMode: 'normal',
      imageBrightness: 120,
      imageContrast: 120,
    };
    setPlacedArtworks((prev) => [...prev, newArt]);
    setSelectedArtId(newArt.id);
  };

  // Remove design layer from T-shirt
  const handleRemovePlacedArtwork = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPlacedArtworks((prev) => {
      const updated = prev.filter((art) => art.id !== id);
      if (updated.length > 0 && selectedArtId === id) {
        setSelectedArtId(updated[updated.length - 1].id);
      } else if (updated.length === 0) {
        setSelectedArtId(null);
      }
      return updated;
    });
  };

  // Sync initial image if image prop changes
  useEffect(() => {
    if (image?.url) {
      const initial: PlacedArtwork = {
        id: `art-${Date.now()}`,
        url: image.url,
        title: image.title || 'Print Design',
        scale: 50,
        positionX: 0,
        positionY: 35,
        rotation: 0,
        blendMode: 'normal',
        imageBrightness: 120,
        imageContrast: 120,
      };
      setPlacedArtworks([initial]);
      setSelectedArtId(initial.id);
    } else {
      setPlacedArtworks([]);
      setSelectedArtId(null);
    }
  }, [image]);

  // Handle uploading T-Shirt background photo file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    setNewBgFile(file);
    if (!newBgTitle) {
      const nameNoExt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setNewBgTitle(nameNoExt.charAt(0).toUpperCase() + nameNoExt.slice(1));
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewBgImageUrl(reader.result);
        setUploadError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle uploading instant temporary artwork file
  const handleArtworkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const tempArt = {
          id: `temp-art-${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          url: reader.result,
          isTemp: true,
        };
        setSessionTempArtworks((prev) => [tempArt, ...prev]);
        setActiveArtworkUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Delete Temporary Artwork
  const handleDeleteTempArtwork = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessionTempArtworks((prev) => {
      const updated = prev.filter((art) => art.id !== id);
      if (updated.length > 0) {
        setActiveArtworkUrl(updated[0].url);
      } else if (allImages.length > 0) {
        setActiveArtworkUrl(allImages[0].url);
      }
      return updated;
    });
  };

  // Save New Background (Admin saves to Firestore permanently; Customer saves as session temp)
  const handleSaveNewBackground = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBgTitle.trim()) {
      setUploadError('Please enter a title for the garment photo.');
      return;
    }
    if (!newBgImageUrl.trim() && !newBgFile) {
      setUploadError('Please upload an image file or enter an image URL.');
      return;
    }

    setUploadError(null);

    // ADMIN MODE: Save permanently to Firestore & Firebase Storage for ALL users!
    if (adminUser) {
      setIsUploadingBg(true);
      try {
        let uploadedBg: MockupBackground;
        if (newBgFile) {
          uploadedBg = await uploadBackgroundFile(newBgFile, {
            name: newBgTitle.trim(),
            category: newBgCategory,
          });
        } else {
          const res = await fetch(newBgImageUrl);
          const blob = await res.blob();
          const fileFromBlob = new File([blob], `${newBgTitle.trim()}.jpg`, { type: blob.type || 'image/jpeg' });
          uploadedBg = await uploadBackgroundFile(fileFromBlob, {
            name: newBgTitle.trim(),
            category: newBgCategory,
          });
        }
        setSelectedBackground(uploadedBg);
        setNewBgTitle('');
        setNewBgImageUrl('');
        setNewBgFile(null);
        setIsAddFormOpen(false);
      } catch (err: any) {
        console.error('Admin background upload failed:', err);
        setUploadError(err.message || 'Failed to save background to Firebase.');
      } finally {
        setIsUploadingBg(false);
      }
    } else {
      // CUSTOMER MODE: Private session temporary upload ONLY (cleared automatically on modal close)
      const newBg: MockupBackground = {
        id: `temp-bg-${Date.now()}`,
        name: newBgTitle.trim(),
        imageUrl: newBgImageUrl.trim(),
        category: newBgCategory,
        isTemp: true,
      };

      setSessionTempBgs((prev) => [newBg, ...prev]);
      setSelectedBackground(newBg);

      // Reset Form
      setNewBgTitle('');
      setNewBgImageUrl('');
      setNewBgFile(null);
      setUploadError(null);
      setIsAddFormOpen(false);
    }
  };

  // Delete Background (Customer temp or Admin permanent)
  const handleDeleteBackground = async (bg: MockupBackground, e: React.MouseEvent) => {
    e.stopPropagation();

    // 1. Customer Session Temp Upload
    if (bg.isTemp) {
      setSessionTempBgs((prev) => prev.filter((item) => item.id !== bg.id));
      if (selectedBackground.id === bg.id) {
        setSelectedBackground(DEFAULT_GARMENT_BACKGROUNDS[0]);
      }
      return;
    }

    // 2. Permanent Admin Background (Admin only)
    if (bg.uploadedByAdmin && adminUser) {
      if (confirm(`Permanently delete background "${bg.name}" from Firebase for all users?`)) {
        try {
          await deleteBackground(bg.id, bg.storagePath);
          if (selectedBackground.id === bg.id) {
            setSelectedBackground(DEFAULT_GARMENT_BACKGROUNDS[0]);
          }
        } catch (err: any) {
          alert(`Failed to delete background: ${err.message}`);
        }
      }
    }
  };

  // Mouse / Touch Drag Handlers
  const handleMouseDown = (artId: string, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setSelectedArtId(artId);
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const target = placedArtworks.find((a) => a.id === artId);
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      startX: target ? target.positionX : 0,
      startY: target ? target.positionY : 35,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !canvasRef.current || !selectedArtId) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - dragStartRef.current.x;
      const deltaY = clientY - dragStartRef.current.y;

      const rect = canvasRef.current.getBoundingClientRect();
      const percentX = (deltaX / rect.width) * 100;
      const percentY = (deltaY / rect.height) * 100;

      const newX = Math.max(-45, Math.min(45, dragStartRef.current.startX + percentX));
      const newY = Math.max(10, Math.min(85, dragStartRef.current.startY + percentY));

      setPlacedArtworks((prev) =>
        prev.map((art) => (art.id === selectedArtId ? { ...art, positionX: newX, positionY: newY } : art))
      );
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, selectedArtId]);

  const handleMinimize = () => updateSelectedArt('scale', 25);
  const handleStandard = () => updateSelectedArt('scale', 50);
  const handleMaximize = () => updateSelectedArt('scale', 80);

  const handleResetTransform = () => {
    if (!selectedArtId) return;
    setPlacedArtworks((prev) =>
      prev.map((art) =>
        art.id === selectedArtId
          ? {
              ...art,
              scale: 50,
              positionX: 0,
              positionY: 35,
              rotation: 0,
              blendMode: 'normal',
              imageBrightness: 120,
              imageContrast: 120,
            }
          : art
      )
    );
  };

  const handleAlign = (align: 'left' | 'center' | 'right') => {
    if (align === 'left') updateSelectedArt('positionX', -20);
    if (align === 'center') updateSelectedArt('positionX', 0);
    if (align === 'right') updateSelectedArt('positionX', 20);
  };

  // High Resolution Canvas Download Logic
  const handleDownloadMockup = async () => {
    setIsDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      const width = 1200;
      const height = 1500;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fill studio background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // 1. Draw T-Shirt Background
      if (selectedBackground?.imageUrl) {
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve) => {
          bgImg.onload = () => resolve();
          bgImg.onerror = () => resolve();
          bgImg.src = selectedBackground.imageUrl;
        });

        if (bgImg.complete && bgImg.naturalWidth > 0) {
          ctx.drawImage(bgImg, 0, 0, width, height);
        }
      }

      // 2. Draw All Placed Artwork Layers
      for (const art of placedArtworks) {
        if (!art.url) continue;
        const artImg = new Image();
        artImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve) => {
          artImg.onload = () => resolve();
          artImg.onerror = () => resolve();
          artImg.src = art.url;
        });

        if (artImg.complete && artImg.naturalWidth > 0) {
          ctx.save();

          const centerX = width * (0.5 + art.positionX / 100);
          const centerY = height * (art.positionY / 100);

          const artWidth = width * (art.scale / 100);
          const artHeight = artWidth * (artImg.naturalHeight / artImg.naturalWidth);

          ctx.translate(centerX, centerY);
          ctx.rotate((art.rotation * Math.PI) / 180);

          if (art.blendMode === 'multiply') {
            ctx.globalCompositeOperation = 'multiply';
          } else if (art.blendMode === 'screen') {
            ctx.globalCompositeOperation = 'screen';
          }

          ctx.filter = `brightness(${art.imageBrightness}%) contrast(${art.imageContrast}%)`;

          ctx.drawImage(artImg, -artWidth / 2, -artHeight / 2, artWidth, artHeight);

          ctx.restore();
        }
      }

      // Trigger Browser Download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      const cleanName = (selectedBackground?.name || 'custom-mockup').toLowerCase().replace(/[^a-z0-9]/g, '-');
      a.download = `${cleanName}-custom-design.png`;
      a.href = dataUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50/92 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div
        className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 p-2 text-slate-400 hover:text-white bg-slate-50/80 hover:bg-slate-50 rounded-full transition-colors border border-slate-300/60"
          title="Close Customizer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Mockup Display Canvas (Real Photographic T-Shirt Studio) */}
        <div className="lg:w-3/5 bg-slate-50 p-6 flex flex-col items-center justify-center relative min-h-[480px] select-none border-b lg:border-b-0 lg:border-r border-slate-200 overflow-hidden">
          {/* Interactive Garment Viewport */}
          <div
            ref={canvasRef}
            className="relative flex items-center justify-center transition-all duration-200 select-none max-w-full max-h-[480px]"
            style={{
              width: `${Math.round(360 * (tshirtZoom / 100))}px`,
              height: `${Math.round(450 * (tshirtZoom / 100))}px`,
            }}
          >
            {/* 1. REAL PHOTOGRAPHIC / VECTOR T-SHIRT TEMPLATE */}
            {selectedBackground?.imageUrl ? (
              <div className="relative w-full h-full flex items-center justify-center p-2">
                <img
                  src={selectedBackground.imageUrl}
                  alt={selectedBackground.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain select-none filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.85)]"
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-300/80 rounded-2xl p-6 text-center space-y-3 bg-slate-50/60">
                <Shirt className="w-12 h-12 text-sky-400/80 mx-auto" />
                <p className="text-xs text-slate-700 font-semibold">No T-Shirt Background Selected</p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Upload an instant private T-shirt photo below to preview your custom design!
                </p>
                <button
                  onClick={() => setIsAddFormOpen(true)}
                  className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Upload Instant T-Shirt Blank</span>
                </button>
              </div>
            )}

            {/* PRINTED ARTWORK PLACEMENTS (MULTIPLE DRAGGABLE & RESIZABLE DESIGNS ON T-SHIRT) */}
            {placedArtworks.map((art) => {
              const isSelected = art.id === selectedArtId;

              return (
                <div
                  key={art.id}
                  onMouseDown={(e) => handleMouseDown(art.id, e)}
                  onTouchStart={(e) => handleMouseDown(art.id, e)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedArtId(art.id);
                  }}
                  className={`absolute cursor-grab active:cursor-grabbing flex items-center justify-center transition-transform group/art ${
                    isSelected
                      ? 'ring-2 ring-sky-400 ring-offset-1 ring-offset-transparent rounded shadow-lg'
                      : 'hover:ring-1 hover:ring-sky-400/50'
                  }`}
                  style={{
                    width: `${art.scale}%`,
                    height: `${art.scale}%`,
                    left: `${50 + art.positionX}%`,
                    top: `${art.positionY}%`,
                    transform: `translate(-50%, -50%) rotate(${art.rotation}deg)`,
                    mixBlendMode: art.blendMode,
                  }}
                  title={`Click to select ${art.title}`}
                >
                  <img
                    src={art.url}
                    alt={art.title}
                    referrerPolicy="no-referrer"
                    className="max-w-full max-h-full object-contain pointer-events-none select-none transition-all duration-150"
                    style={{
                      filter: `brightness(${art.imageBrightness}%) contrast(${art.imageContrast}%) drop-shadow(0 2px 8px rgba(0, 0, 0, 0.45))`,
                    }}
                  />

                  {/* Remove Design Button on the Placed Artwork Box */}
                  <button
                    onClick={(e) => handleRemovePlacedArtwork(art.id, e)}
                    className="absolute -top-2.5 -right-2.5 bg-red-600 hover:bg-red-500 text-white p-1 rounded-full shadow-lg transition-transform hover:scale-110 z-30"
                    title="Remove this design from T-Shirt"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-sky-500 text-white px-1.5 py-0.5 rounded text-[9px] font-bold pointer-events-none flex items-center gap-1 shadow-sm">
                      <Move className="w-2.5 h-2.5" /> Selected
                    </div>
                  )}
                </div>
              );
            })}

            {/* Active T-Shirt Background Name Badge Overlay */}
            {selectedBackground?.imageUrl && (
              <div className="absolute bottom-2.5 left-2.5 bg-slate-50/85 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] text-slate-700 border border-slate-300/70 flex items-center gap-1.5 font-medium shadow-md pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{selectedBackground.name}</span>
                {selectedBackground.isTemp && <span className="text-sky-400 font-bold">(Temp Upload)</span>}
              </div>
            )}
          </div>
        </div>

        {/* CONTROLS SIDEBAR */}
        <div className="lg:w-2/5 p-5 sm:p-6 flex flex-col justify-between space-y-4 bg-white overflow-y-auto max-h-[85vh]">
          <div className="space-y-4">
            {/* Header */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">
                  T-Shirt Customizer
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-800 truncate">{image?.title || 'Interactive Canvas'}</h3>
            </div>

            {/* 1. T-SHIRT BACKGROUND PHOTO / BLANK LIBRARY */}
            <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Shirt className="w-3.5 h-3.5 text-sky-400" />
                  Select T-Shirt Background
                </label>
                <button
                  onClick={() => setIsAddFormOpen(!isAddFormOpen)}
                  className="px-2.5 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors shadow-sm"
                  title="Upload a private temporary T-Shirt photo"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Upload T-Shirt</span>
                </button>
              </div>

              {/* ADD NEW INSTANT T-SHIRT BACKGROUND FORM */}
              {isAddFormOpen && (
                <form
                  onSubmit={handleSaveNewBackground}
                  className="bg-white p-3 rounded-lg border border-sky-500/40 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between text-sky-600 font-bold text-[11px]">
                    <span className="flex items-center gap-1">
                      {adminUser ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                          <span>Admin Permanent Background Upload</span>
                        </>
                      ) : (
                        <>
                          <FolderPlus className="w-3.5 h-3.5 text-sky-400" />
                          <span>Customer Temporary T-Shirt Upload</span>
                        </>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddFormOpen(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    {adminUser ? (
                      <span className="text-sky-400 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Saved permanently to Firebase Vault so ALL users can preview designs on this background!
                      </span>
                    ) : (
                      <span>
                        🔒 Private customer upload: Cleared automatically when you close the mockup modal.
                      </span>
                    )}
                  </p>

                  {uploadError && (
                    <div className="text-[10px] text-red-400 bg-red-950/50 border border-red-800/80 rounded p-1.5">
                      {uploadError}
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                      Garment / T-Shirt Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Heavyweight Oversized Acid Wash Tee"
                      value={newBgTitle}
                      onChange={(e) => setNewBgTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs focus:outline-none focus:border-sky-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                      Select Local Photo File
                    </label>
                    <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 rounded px-2 py-1.5 text-[11px] flex items-center justify-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-sky-400" />
                      <span>{newBgFile ? newBgFile.name : 'Choose T-Shirt Photo File'}</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-700 mb-1">
                      ...OR Image URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/tshirt-blank.png"
                      value={newBgImageUrl}
                      onChange={(e) => setNewBgImageUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  {newBgImageUrl && (
                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded border border-slate-200">
                      <img src={newBgImageUrl} alt="Preview" className="w-8 h-8 object-contain rounded bg-white" />
                      <span className="text-[10px] text-emerald-400 font-medium">Image Ready</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddFormOpen(false)}
                      className="flex-1 py-1 bg-slate-100 text-slate-700 rounded text-[11px]"
                      disabled={isUploadingBg}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUploadingBg}
                      className="flex-1 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded text-[11px] flex items-center justify-center gap-1 transition-colors"
                    >
                      {isUploadingBg ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Saving to Firebase...</span>
                        </>
                      ) : adminUser ? (
                        <span>Save Permanent (All Users)</span>
                      ) : (
                        <span>Use T-Shirt Photo</span>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* T-SHIRT BACKGROUND REAL PHOTO THUMBNAIL CARDS GRID */}
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {allBackgrounds.map((bg) => {
                  const isSelected = selectedBackground?.id === bg.id;
                  const canDelete = bg.isTemp || (bg.uploadedByAdmin && adminUser);

                  return (
                    <div
                      key={bg.id}
                      onClick={() => setSelectedBackground(bg)}
                      className={`relative group cursor-pointer p-1.5 rounded-lg border transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-sky-500/20 border-sky-400 ring-1 ring-sky-400/50'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-10 h-10 rounded shrink-0 overflow-hidden bg-slate-50 border border-slate-200 flex items-center justify-center p-0.5">
                        {bg.imageUrl ? (
                          <img src={bg.imageUrl} alt={bg.name} className="w-full h-full object-contain rounded" />
                        ) : (
                          <Shirt className="w-5 h-5 text-slate-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 leading-tight">
                        <p className={`text-[10px] font-semibold truncate ${isSelected ? 'text-sky-600' : 'text-slate-700'}`}>
                          {bg.name}
                        </p>
                        <p className="text-[9px] text-slate-400 capitalize flex items-center gap-1">
                          {bg.uploadedByAdmin ? (
                            <span className="text-sky-400 font-medium">Admin Vault</span>
                          ) : bg.isTemp ? (
                            <span className="text-slate-400">Temp Session</span>
                          ) : (
                            bg.category
                          )}
                        </p>
                      </div>

                      {/* Delete Icon (Customer temp or Admin permanent) */}
                      {canDelete && (
                        <button
                          onClick={(e) => handleDeleteBackground(bg, e)}
                          className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                          title={bg.uploadedByAdmin ? "Delete permanent admin background" : "Remove temporary session upload"}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ACTIVE DESIGNS ON T-SHIRT MANAGER */}
            <div className="space-y-2 bg-sky-50/60 p-3.5 rounded-xl border border-sky-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-500" />
                  Designs Placed on T-Shirt ({placedArtworks.length})
                </span>
                <span className="text-[10px] text-slate-500">Click to edit or trash to remove</span>
              </div>

              {placedArtworks.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {placedArtworks.map((art, idx) => {
                    const isSelected = art.id === selectedArtId;
                    return (
                      <div
                        key={art.id}
                        onClick={() => setSelectedArtId(art.id)}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-white border-sky-500 ring-2 ring-sky-400/40 shadow-sm'
                            : 'bg-white/80 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                          <img src={art.url} alt={art.title} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-[11px] font-medium text-slate-700 max-w-[90px] truncate">
                          #{idx + 1} {art.title}
                        </span>
                        <button
                          onClick={(e) => handleRemovePlacedArtwork(art.id, e)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          title="Remove design from T-shirt"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 py-1">
                  No designs placed on T-shirt. Click any artwork below to add it!
                </p>
              )}
            </div>

            {/* PRINT ARTWORK SELECTION / ADD MORE DESIGNS */}
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-sky-400" /> Add More Designs to T-Shirt
                </span>
                <label className="cursor-pointer text-[10px] bg-sky-500 hover:bg-sky-400 text-slate-950 px-2 py-1 rounded font-bold transition-colors flex items-center gap-1 shadow-sm">
                  <Upload className="w-3 h-3" /> + Upload Design
                  <input type="file" accept="image/*" onChange={handleArtworkFileUpload} className="hidden" />
                </label>
              </div>

              {/* Gallery Artworks Carousel */}
              {allArtworks.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 pt-1 scrollbar-thin">
                  {allArtworks.map((art) => {
                    const isPlaced = placedArtworks.some((p) => p.url === art.url);
                    const isTemp = 'isTemp' in art && art.isTemp;
                    return (
                      <div key={art.id} className="relative group shrink-0">
                        <button
                          onClick={() => handleAddArtworkToTshirt(art.url, art.title)}
                          className={`w-11 h-11 rounded-lg shrink-0 border p-0.5 overflow-hidden transition-all bg-white flex items-center justify-center relative ${
                            isPlaced ? 'border-sky-500 ring-1 ring-sky-400' : 'border-slate-200 opacity-80 hover:opacity-100'
                          }`}
                          title={`Click to add ${art.title} to T-shirt`}
                        >
                          <img src={art.url} alt={art.title} className="w-full h-full object-contain rounded" />
                          {isPlaced && (
                            <div className="absolute top-0.5 right-0.5 bg-sky-500 text-white rounded-full p-0.5">
                              <Plus className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </button>
                        {isTemp && (
                          <button
                            onClick={(e) => handleDeleteTempArtwork(art.id, e)}
                            className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-500 text-white p-0.5 rounded-full shadow transition-opacity"
                            title="Remove temporary upload"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. T-SHIRT CANVAS ZOOM SLIDER */}
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-sky-400" /> T-Shirt Zoom Size
                </span>
                <span className="font-mono text-sky-400 font-bold">{tshirtZoom}%</span>
              </div>

              <div className="grid grid-cols-4 gap-1 pt-1">
                {[
                  { label: '80%', value: 80 },
                  { label: '100%', value: 100 },
                  { label: '125%', value: 125 },
                  { label: '150%', value: 150 },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setTshirtZoom(preset.value)}
                    className={`py-1 px-1.5 rounded border text-[10px] font-semibold transition-colors ${
                      tshirtZoom === preset.value
                        ? 'bg-sky-500/20 border-sky-400 text-sky-600'
                        : 'bg-white border-slate-200 text-slate-400 hover:text-slate-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <input
                type="range"
                min="70"
                max="160"
                value={tshirtZoom}
                onChange={(e) => setTshirtZoom(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer mt-1"
              />
            </div>

            {/* 4. DESIGN ARTWORK SCALE & CONTROLS */}
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Print Scale
                </span>
                <span className="font-mono text-sky-400 font-bold">{scale}%</span>
              </div>

              <div className="grid grid-cols-3 gap-1 pt-0.5">
                <button
                  onClick={handleMinimize}
                  className="py-1 px-2 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 flex items-center justify-center gap-1 text-[10px] font-medium"
                >
                  <Minimize2 className="w-3 h-3 text-sky-400" />
                  <span>Small</span>
                </button>

                <button
                  onClick={handleStandard}
                  className="py-1 px-2 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 flex items-center justify-center gap-1 text-[10px] font-medium"
                >
                  <span>Medium</span>
                </button>

                <button
                  onClick={handleMaximize}
                  className="py-1 px-2 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 flex items-center justify-center gap-1 text-[10px] font-medium"
                >
                  <Maximize2 className="w-3 h-3 text-sky-400" />
                  <span>Large</span>
                </button>
              </div>

              <input
                type="range"
                min="15"
                max="90"
                value={scale}
                onChange={(e) => updateSelectedArt('scale', Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer mt-1"
              />
            </div>

            {/* 5. POSITION & ROTATION CONTROLS */}
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-sky-400" /> Position & Rotation
                </span>
                <button
                  onClick={handleResetTransform}
                  className="text-[10px] text-sky-400 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              <div className="flex items-center justify-between gap-1 pt-0.5">
                <span className="text-slate-400 text-[11px]">Chest Placement:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleAlign('left')}
                    className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200"
                    title="Left Pocket Print"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleAlign('center')}
                    className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200"
                    title="Center Chest Print"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleAlign('right')}
                    className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200"
                    title="Right Pocket Print"
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                  <span>Rotate Angle</span>
                  <span className="font-mono text-sky-400">{rotation}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={rotation}
                  onChange={(e) => updateSelectedArt('rotation', Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              {/* Ink Blend Mode & Image Filters */}
              <div className="pt-2 border-t border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-700 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-sky-400" /> Print Ink Blend
                  </span>
                  <div className="flex gap-1">
                    {(['normal', 'screen', 'multiply'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => updateSelectedArt('blendMode', mode)}
                        className={`px-2 py-0.5 rounded text-[10px] capitalize font-semibold transition-colors ${
                          blendMode === mode
                            ? 'bg-sky-500/20 text-sky-600 border border-sky-500/50 shadow-sm'
                            : 'text-slate-400 hover:text-slate-800 bg-white border border-slate-200'
                        }`}
                      >
                        {mode === 'normal' ? 'Normal' : mode === 'screen' ? 'Auto No-BG' : 'Multiply'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Brightness</span>
                    <span className="font-mono text-sky-400 font-bold">{imageBrightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="220"
                    value={imageBrightness}
                    onChange={(e) => updateSelectedArt('imageBrightness', Number(e.target.value))}
                    className="w-full accent-sky-500 cursor-pointer h-1 bg-slate-100 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>Contrast</span>
                    <span className="font-mono text-sky-400 font-bold">{imageContrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="220"
                    value={imageContrast}
                    onChange={(e) => updateSelectedArt('imageContrast', Number(e.target.value))}
                    className="w-full accent-sky-500 cursor-pointer h-1 bg-slate-100 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* DOWNLOAD & DONE & ORDER BUTTONS */}
          <div className="space-y-2 mt-3">
            <button
              onClick={() => setIsOrderModalOpen(true)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.99]"
            >
              <ShoppingBag className="w-4 h-4 text-slate-950" />
              <span>Order Custom Printed T-Shirt</span>
            </button>

            <button
              onClick={handleDownloadMockup}
              disabled={isDownloading}
              className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/20 active:scale-[0.99]"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating High-Res Mockup...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Customized Mockup (PNG)</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full bg-slate-100 hover:bg-slate-700 text-slate-700 font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors border border-slate-300"
            >
              <span>Close Customizer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Order T-Shirt Checkout Modal */}
      <OrderTShirtModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        siteSettings={siteSettings || null}
        garmentName={selectedBackground?.name || 'Custom T-Shirt'}
        mockupImageUrl={selectedBackground?.imageUrl}
        placedDesignsCount={placedArtworks.length}
      />
    </div>
  );
};
