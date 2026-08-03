export type Category = string;

export interface PrintSpec {
  method?: string; // DTG, Screen Print, Sublimation, Vinyl, Embroidery
  placement?: string; // Front Chest, Full Back, Pocket Logo, Sleeve
  dpi?: number; // e.g. 300 DPI
  colorCount?: string; // e.g. Full Color CMYK, 3-Color Spot
  suggestedTshirtColor?: string; // Black, White, Charcoal, Heather Gray, Navy
}

export interface ImageItem {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  category: Category;
  tags: string[];
  author: string; // Designer name
  description: string;
  aspectRatio: 'square' | 'landscape' | 'portrait';
  width: number;
  height: number;
  fileSize: string;
  createdAt: string;
  isFavorite?: boolean;
  views?: number;
  printSpec?: PrintSpec;
}

export interface FilterState {
  searchQuery: string;
  category: Category;
  onlyFavorites: boolean;
  sortBy: 'newest' | 'oldest' | 'title' | 'popular';
  aspectRatioFilter: 'all' | 'square' | 'landscape' | 'portrait';
}

export interface StorageStats {
  totalCount: number;
  maxCapacity: number;
  usedBytes: number;
  categoryCounts: Record<string, number>;
}

export interface AuditLogEntry {
  id: string;
  adminName: string;
  action: 'Delete Permanently' | 'Bulk Delete' | 'Edit Details' | 'File Upload' | 'Clear Storage';
  fileName: string;
  fileId: string;
  timestamp: string;
}

