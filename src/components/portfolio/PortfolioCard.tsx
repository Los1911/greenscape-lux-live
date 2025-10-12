import React from 'react';
import { Star, MapPin } from 'lucide-react';

interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  beforeImage: string;
  afterImage: string;
  testimonial: {
    text: string;
    author: string;
    rating: number;
  };
  completionDate: string;
}

interface PortfolioCardProps {
  project: PortfolioProject;
  onImageClick: (images: { url: string; alt: string; type: 'before' | 'after' }[], index: number) => void;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({
  project,
  onImageClick,
}) => {
  const handleImageClick = (type: 'before' | 'after') => {
    const images = [
      { url: project.beforeImage, alt: `${project.title} - Before`, type: 'before' as const },
      { url: project.afterImage, alt: `${project.title} - After`, type: 'after' as const }
    ];
    const index = type === 'before' ? 0 : 1;
    onImageClick(images, index);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="grid grid-cols-2 gap-0">
        <div className="relative group cursor-pointer" onClick={() => handleImageClick('before')}>
          <img
            src={project.beforeImage}
            alt={`${project.title} - Before`}
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center">
            <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              View Before
            </span>
          </div>
          <div className="absolute top-2 left-2">
            <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
              Before
            </span>
          </div>
        </div>
        
        <div className="relative group cursor-pointer" onClick={() => handleImageClick('after')}>
          <img
            src={project.afterImage}
            alt={`${project.title} - After`}
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center">
            <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              View After
            </span>
          </div>
          <div className="absolute top-2 left-2">
            <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
              After
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900">{project.title}</h3>
          <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
            {project.category}
          </span>
        </div>
        
        <div className="flex items-center text-gray-600 mb-3">
          <MapPin size={16} className="mr-1" />
          <span className="text-sm">{project.location}</span>
          <span className="mx-2">•</span>
          <span className="text-sm">{project.completionDate}</span>
        </div>
        
        <p className="text-gray-700 mb-4 line-clamp-3">{project.description}</p>
        
        <div className="border-t pt-4">
          <div className="flex items-start space-x-3">
            <div className="flex-1">
              <p className="text-gray-700 italic text-sm mb-2">"{project.testimonial.text}"</p>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 text-sm">
                  - {project.testimonial.author}
                </span>
                <div className="flex items-center">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < project.testimonial.rating 
                        ? 'text-yellow-400 fill-current' 
                        : 'text-gray-300'
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};