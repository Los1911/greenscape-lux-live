import React from 'react';
import { Camera, MapPin, Clock } from 'lucide-react';

interface PhotoMarkerProps {
  photo: {
    id: string;
    url: string;
    jobId: string;
    jobTitle: string;
    latitude: number;
    longitude: number;
    capturedAt: string;
    type: string;
  };
  onClick: (photo: any) => void;
  isSelected?: boolean;
}

export const PhotoMarker: React.FC<PhotoMarkerProps> = ({ 
  photo, 
  onClick, 
  isSelected = false 
}) => {
  const handleClick = () => {
    onClick(photo);
  };

  return (
    <div 
      className={`relative cursor-pointer transition-all duration-200 ${
        isSelected ? 'scale-110 z-20' : 'hover:scale-105 z-10'
      }`}
      onClick={handleClick}
    >
      {/* Main marker */}
      <div className={`w-10 h-10 rounded-full border-3 shadow-lg ${
        isSelected 
          ? 'bg-blue-500 border-white' 
          : 'bg-green-500 border-white hover:bg-green-600'
      }`}>
        <Camera className="w-5 h-5 text-white m-auto mt-2" />
      </div>
      
      {/* Photo preview tooltip */}
      <div className={`absolute bottom-12 left-1/2 transform -translate-x-1/2 
        bg-white rounded-lg shadow-xl border p-2 min-w-48 transition-opacity duration-200 ${
        isSelected ? 'opacity-100' : 'opacity-0 hover:opacity-100'
      }`}>
        <img 
          src={photo.url} 
          alt="Job photo"
          className="w-full h-24 object-cover rounded mb-2"
        />
        <div className="text-xs space-y-1">
          <div className="font-semibold text-gray-800 truncate">
            {photo.jobTitle}
          </div>
          <div className="flex items-center text-gray-600">
            <MapPin className="w-3 h-3 mr-1" />
            {photo.latitude.toFixed(4)}, {photo.longitude.toFixed(4)}
          </div>
          <div className="flex items-center text-gray-600">
            <Clock className="w-3 h-3 mr-1" />
            {new Date(photo.capturedAt).toLocaleDateString()}
          </div>
        </div>
        {/* Arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 
          w-0 h-0 border-l-4 border-r-4 border-t-4 
          border-transparent border-t-white">
        </div>
      </div>
    </div>
  );
};