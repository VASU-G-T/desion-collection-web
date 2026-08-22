export type Category = 'All' | 'T-Shirt' | 'Design';

export interface PrintSpec {
  method: 'Screen Printing' | 'DTG Direct-to-Garment' | 'Sublimation' | 'Heat Transfer' | 'Embroidery';
  colorWay: string;
  material: string;
  printLocation: 'Front Chest' | 'Full Back' | 'Left Sleeve' | 'Over-Sized Front' | 'All Over';
  dpi: number;
}

export interface ImageItem {
  id: string;
  title: string;
  category: Category;
  description: string;
  author: string;
  url: string;
  storagePath: string;
  fileSize: string;
  createdAt: string;
  downloadCount: number;
  favoriteCount: number;
  tags: string[];
  aspectRatio: 'square' | 'landscape' | 'portrait';
  width: number;
  height: number;
  isFavorite?: boolean;
  views?: number;
  printSpec?: PrintSpec;
}

export interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAdmin: boolean;
}

export type SortOption = 'newest' | 'downloads' | 'favorites' | 'views' | 'title';

export type GarmentType = 'tshirt' | 'oversized' | 'hoodie' | 'totebag';

export interface MockupBackground {
  id: string;
  name: string;
  imageUrl: string;
  category: GarmentType;
  storagePath?: string;
  createdAt?: string;
  uploadedByAdmin?: boolean;
  isTemp?: boolean;
}

export interface FilterState {
  searchQuery: string;
  category: Category;
  sortBy: SortOption;
  onlyFavorites: boolean;
  selectedTag: string | null;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  storagePath: string;
  couponCode: string;
  isActive: boolean;
  createdAt: string;
}

export interface SiteSettings {
  logoUrl?: string;
  logoStoragePath?: string;
  siteName?: string;
  qrCodeUrl?: string;
  qrCodeStoragePath?: string;
}

export interface CustomerAddress {
  fullName: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export type TShirtSize = 'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL';

export interface TShirtOrder {
  id: string;
  createdAt: string;
  customer: CustomerAddress;
  size: TShirtSize;
  quantity: number;
  totalPrice: number;
  paymentMethod: 'qr_code' | 'card';
  paymentProofUrl?: string;
  paymentTxnId?: string;
  cardLast4?: string;
  status: 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  garmentName: string;
  mockupImageUrl?: string;
  placedDesignsCount: number;
}
