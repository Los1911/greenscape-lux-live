import { useEffect, useRef, useState } from 'react';
import { Loader } from 'lucide-react';
import { CoverageParticles } from './CoverageParticles';
import '@/styles/coverage-animations.css';

interface ServiceCoverageMapProps {
  zipCode: string;
  nearbyZipCodes: Array<{ zip_code: string; city: string; state: string }>;
  hasCoverage: boolean;
}

export function ServiceCoverageMap({ zipCode, nearbyZipCodes, hasCoverage }: ServiceCoverageMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    console.log('[COVERAGE_UI] Initializing premium map with dark theme');
    
    // Premium dark mode map styles
    const luxMapStyles = [
      { elementType: 'geometry', stylers: [{ color: '#0a0a0a' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#10b981' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#000000' }, { weight: 3 }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
      { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#059669' }] },
      { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#0f0f0f' }] }
    ];

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        zoom: 11,
        center: { lat: 34.0522, lng: -118.2437 },
        styles: luxMapStyles,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy'
      });
      
      console.log('[COVERAGE_UI] Map instance created');
      setIsLoading(false);
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    console.log(`[COVERAGE_UI] Rendering ${nearbyZipCodes.length} coverage zones`);

    // Add glowing markers with pulsing animation
    nearbyZipCodes.forEach((area, idx) => {
      const isCurrent = area.zip_code === zipCode;
      const position = { 
        lat: 34.0522 + (Math.random() - 0.5) * 0.4, 
        lng: -118.2437 + (Math.random() - 0.5) * 0.4 
      };

      // Create custom glowing marker
      const marker = new google.maps.Marker({
        position,
        map,
        title: `${area.city}, ${area.state} - ${area.zip_code}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isCurrent ? 14 : 10,
          fillColor: isCurrent ? '#10b981' : '#059669',
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 3
        },
        animation: isCurrent ? google.maps.Animation.BOUNCE : undefined
      });

      // Add emerald mist circle overlay
      new google.maps.Circle({
        center: position,
        radius: isCurrent ? 3000 : 2000,
        map,
        fillColor: '#10b981',
        fillOpacity: isCurrent ? 0.15 : 0.08,
        strokeColor: '#10b981',
        strokeOpacity: 0.4,
        strokeWeight: 2
      });

      markersRef.current.push(marker);
      
      if (isCurrent) {
        console.log('[COVERAGE_UI] Current ZIP marker placed with glow effect');
        // Smooth zoom to current location
        setTimeout(() => {
          map.panTo(position);
          map.setZoom(12);
        }, 300);
      }
    });

    console.log('[COVERAGE_UI] Map rendering complete');
  }, [zipCode, nearbyZipCodes, hasCoverage]);

  return (
    <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-emerald-500/30 emerald-glow">
      <div ref={mapRef} className="w-full h-full marker-shimmer" />
      <CoverageParticles active={hasCoverage && !isLoading} />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center glassmorphic">
          <Loader className="w-8 h-8 animate-spin text-emerald-400" />
        </div>
      )}
      <div className="absolute top-3 left-3 px-3 py-1.5 glassmorphic rounded-lg">
        <span className="text-xs font-semibold text-emerald-400">
          {hasCoverage ? '✓ Coverage Active' : 'Expanding Soon'}
        </span>
      </div>
    </div>
  );
}

