/**
 * Job Photo types for before/after comparison support
 */

export interface JobPhoto {
  id: string;
  job_id: string;
  file_url: string;
  type: 'before' | 'after';
  uploaded_at: string;
  uploaded_by?: string;
  metadata?: PhotoMetadata;
  caption?: string;
  sort_order?: number;
}

export interface PhotoMetadata {
  gps?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  deviceInfo?: {
    userAgent: string;
    timestamp: number;
    timezone?: string;
  };
  dimensions?: {
    width: number;
    height: number;
  };
  fileSize?: number;
  originalFilename?: string;
}

export interface PhotoGroup {
  before: JobPhoto[];
  after: JobPhoto[];
}

export interface PhotoComparisonPair {
  before: JobPhoto | null;
  after: JobPhoto | null;
  index: number;
}

/**
 * Configuration for photo uploads
 */
export const PHOTO_CONFIG = {
  MAX_BEFORE_PHOTOS: 5,
  MAX_AFTER_PHOTOS: 5,
  MAX_FILE_SIZE_MB: 5,
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  THUMBNAIL_SIZE: 200,
  PREVIEW_SIZE: 800,
} as const;

/**
 * Helper to group photos by type
 */
export function groupPhotosByType(photos: JobPhoto[]): PhotoGroup {
  return {
    before: photos.filter(p => p.type === 'before').sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    after: photos.filter(p => p.type === 'after').sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
  };
}

/**
 * Create comparison pairs from grouped photos
 */
export function createComparisonPairs(photoGroup: PhotoGroup): PhotoComparisonPair[] {
  const maxLength = Math.max(photoGroup.before.length, photoGroup.after.length);
  const pairs: PhotoComparisonPair[] = [];
  
  for (let i = 0; i < maxLength; i++) {
    pairs.push({
      before: photoGroup.before[i] || null,
      after: photoGroup.after[i] || null,
      index: i,
    });
  }
  
  return pairs;
}
