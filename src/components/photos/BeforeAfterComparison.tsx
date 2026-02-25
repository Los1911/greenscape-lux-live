import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  SplitSquareVertical,
  Layers,
  Clock,
  MapPin,
  Camera
} from 'lucide-react';
import { JobPhoto, PhotoGroup, groupPhotosByType, createComparisonPairs } from '@/types/jobPhoto';
import PhotoLightbox from './PhotoLightbox';

interface BeforeAfterComparisonProps {
  photos: JobPhoto[];
  showTimestamps?: boolean;
  showMetadata?: boolean;
  className?: string;
  title?: string;
}

type ViewMode = 'side-by-side' | 'slider' | 'toggle';

export default function BeforeAfterComparison({
  photos,
  showTimestamps = true,
  showMetadata = false,
  className = '',
  title = 'Before & After Photos'
}: BeforeAfterComparisonProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [showBefore, setShowBefore] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const photoGroup = groupPhotosByType(photos);
  const comparisonPairs = createComparisonPairs(photoGroup);
  const currentPair = comparisonPairs[currentPairIndex];

  const allPhotos = [...photoGroup.before, ...photoGroup.after];

  // Handle slider drag
  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current || !isDragging.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleSliderMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleSliderMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDragging.current = false;
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, []);

  const openLightbox = (photo: JobPhoto) => {
    const index = allPhotos.findIndex(p => p.id === photo.id);
    setLightboxIndex(index >= 0 ? index : 0);
    setLightboxOpen(true);
  };

  const formatTimestamp = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (photos.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-700/50 p-8">
        <div className="text-center text-slate-400">
          <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No photos available for this job</p>
        </div>
      </Card>
    );
  }

  const renderPhotoCard = (photo: JobPhoto | null, type: 'before' | 'after') => {
    if (!photo) {
      return (
        <div className="aspect-[4/3] bg-slate-800/50 rounded-lg flex items-center justify-center border border-slate-700/50">
          <div className="text-center text-slate-500">
            <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No {type} photo</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative group">
        <div className="aspect-[4/3] rounded-lg overflow-hidden bg-slate-800">
          <img
            src={photo.file_url}
            alt={`${type} photo`}
            className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
            onClick={() => openLightbox(photo)}
          />
        </div>
        
        {/* Label Badge */}
        <Badge 
          className={`absolute top-2 left-2 ${
            type === 'before' 
              ? 'bg-amber-500/90 text-white' 
              : 'bg-emerald-500/90 text-white'
          }`}
        >
          {type === 'before' ? 'Before' : 'After'}
        </Badge>

        {/* Expand Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => openLightbox(photo)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70 text-white"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>

        {/* Timestamp */}
        {showTimestamps && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 text-xs text-white/80 bg-black/50 rounded px-2 py-1">
            <Clock className="w-3 h-3" />
            <span>{formatTimestamp(photo.uploaded_at)}</span>
          </div>
        )}
      </div>
    );
  };

  const renderSideBySide = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {renderPhotoCard(currentPair?.before || null, 'before')}
      {renderPhotoCard(currentPair?.after || null, 'after')}
    </div>
  );

  const renderSlider = () => {
    const beforePhoto = currentPair?.before;
    const afterPhoto = currentPair?.after;

    if (!beforePhoto || !afterPhoto) {
      return renderSideBySide();
    }

    return (
      <div 
        ref={sliderRef}
        className="relative aspect-[4/3] rounded-lg overflow-hidden cursor-ew-resize select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleMouseDown}
        onTouchMove={handleTouchMove}
      >
        {/* After Image (Full) */}
        <img
          src={afterPhoto.file_url}
          alt="After"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Before Image (Clipped) */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforePhoto.file_url}
            alt="Before"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ width: `${100 / (sliderPosition / 100)}%` }}
          />
        </div>

        {/* Slider Handle */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
            <ChevronLeft className="w-4 h-4 text-slate-600" />
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </div>
        </div>

        {/* Labels */}
        <Badge className="absolute top-3 left-3 bg-amber-500/90 text-white">Before</Badge>
        <Badge className="absolute top-3 right-3 bg-emerald-500/90 text-white">After</Badge>
      </div>
    );
  };

  const renderToggle = () => {
    const photo = showBefore ? currentPair?.before : currentPair?.after;
    
    return (
      <div className="space-y-3">
        <div className="flex justify-center gap-2">
          <Button
            variant={showBefore ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowBefore(true)}
            className={showBefore ? 'bg-amber-500 hover:bg-amber-600' : 'border-slate-600'}
          >
            Before
          </Button>
          <Button
            variant={!showBefore ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowBefore(false)}
            className={!showBefore ? 'bg-emerald-500 hover:bg-emerald-600' : 'border-slate-600'}
          >
            After
          </Button>
        </div>
        
        <div className="relative">
          {renderPhotoCard(photo || null, showBefore ? 'before' : 'after')}
        </div>
      </div>
    );
  };

  return (
    <Card className={`bg-slate-900/50 border-slate-700/50 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-emerald-300 flex items-center gap-2">
            <Camera className="w-5 h-5" />
            {title}
          </h3>
          
          {/* View Mode Selector */}
          <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 ${viewMode === 'side-by-side' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'}`}
            >
              <Layers className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Side by Side</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('slider')}
              className={`px-3 ${viewMode === 'slider' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'}`}
            >
              <SplitSquareVertical className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Slider</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('toggle')}
              className={`px-3 ${viewMode === 'toggle' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'}`}
            >
              <span className="hidden sm:inline">Toggle</span>
              <span className="sm:hidden">Tap</span>
            </Button>
          </div>
        </div>

        {/* Photo Count */}
        <div className="flex gap-4 mt-3 text-sm text-slate-400">
          <span>{photoGroup.before.length} before photo{photoGroup.before.length !== 1 ? 's' : ''}</span>
          <span>{photoGroup.after.length} after photo{photoGroup.after.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {viewMode === 'side-by-side' && renderSideBySide()}
        {viewMode === 'slider' && renderSlider()}
        {viewMode === 'toggle' && renderToggle()}

        {/* Pair Navigation */}
        {comparisonPairs.length > 1 && (
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-slate-700/50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPairIndex(prev => Math.max(0, prev - 1))}
              disabled={currentPairIndex === 0}
              className="border-slate-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              {comparisonPairs.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPairIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentPairIndex 
                      ? 'bg-emerald-400' 
                      : 'bg-slate-600 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPairIndex(prev => Math.min(comparisonPairs.length - 1, prev + 1))}
              disabled={currentPairIndex === comparisonPairs.length - 1}
              className="border-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* All Photos Grid (optional) */}
        {photos.length > 2 && (
          <div className="mt-6 pt-4 border-t border-slate-700/50">
            <h4 className="text-sm font-medium text-slate-400 mb-3">All Photos</h4>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {allPhotos.map((photo, index) => (
                <button
                  key={photo.id}
                  onClick={() => { setLightboxIndex(index); setLightboxOpen(true); }}
                  className="relative aspect-square rounded overflow-hidden group"
                >
                  <img
                    src={photo.file_url}
                    alt={`${photo.type} ${index + 1}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  />
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                    photo.type === 'before' ? 'bg-amber-500/20' : 'bg-emerald-500/20'
                  }`} />
                  <div className={`absolute bottom-0 left-0 right-0 h-1 ${
                    photo.type === 'before' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <PhotoLightbox
        photos={allPhotos}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        showMetadata={showMetadata}
      />
    </Card>
  );
}
