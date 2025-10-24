import React, { useState } from 'react';
import { PortfolioCard } from './PortfolioCard';
import { PortfolioFilter } from './PortfolioFilter';
import { ImageLightbox } from './ImageLightbox';

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

const portfolioProjects: PortfolioProject[] = [
  {
    id: '1',
    title: 'Luxury Backyard Transformation',
    description: 'Complete backyard renovation featuring custom patio design, professional landscaping, and outdoor lighting installation. Transformed an overgrown space into a stunning entertainment area.',
    category: 'Backyard Design',
    location: 'Beverly Hills, CA',
    beforeImage: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1758563792773_f12836b8.webp',
    afterImage: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1758563804114_d4345e60.webp',
    testimonial: {
      text: 'GreenScape Lux exceeded our expectations. Our backyard is now our favorite space in the house!',
      author: 'Sarah Johnson',
      rating: 5
    },
    completionDate: 'March 2024'
  },
  {
    id: '2',
    title: 'Modern Front Yard Makeover',
    description: 'Contemporary front yard design with drought-resistant plants, decorative stone pathways, and strategic lighting to enhance curb appeal and property value.',
    category: 'Front Yard Design',
    location: 'Malibu, CA',
    beforeImage: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1758563814623_cf88cab8.webp',
    afterImage: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1758563823576_3c719bc6.webp',
    testimonial: {
      text: 'The transformation is incredible. Our neighbors stop to compliment our beautiful front yard daily.',
      author: 'Michael Chen',
      rating: 5
    },
    completionDate: 'February 2024'
  },
  {
    id: '3',
    title: 'Estate Garden Paradise',
    description: 'Expansive estate landscaping project featuring multiple garden zones, water features, and seasonal plantings designed for year-round beauty and functionality.',
    category: 'Garden Design',
    location: 'Bel Air, CA',
    beforeImage: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1758563794780_1ed5a03c.webp',
    afterImage: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1758563806067_4559af16.webp',
    testimonial: {
      text: 'A true masterpiece. The attention to detail and plant selection is extraordinary.',
      author: 'Elizabeth Davis',
      rating: 5
    },
    completionDate: 'January 2024'
  },
  {
    id: '4',
    title: 'Commercial Property Enhancement',
    description: 'Professional commercial landscaping for office complex, including sustainable plantings, maintenance-friendly design, and impressive entrance features.',
    category: 'Commercial',
    location: 'Century City, CA',
    beforeImage: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1758563834801_9fb1f9b8.webp',
    afterImage: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1758563841297_136d7d9c.webp',
    testimonial: {
      text: 'Our office building now has the professional appearance that matches our business standards.',
      author: 'David Rodriguez, Property Manager',
      rating: 5
    },
    completionDate: 'April 2024'
  },
  {
    id: '5',
    title: 'Hillside Retreat Landscaping',
    description: 'Challenging hillside property transformed with terraced gardens, retaining walls, and drought-tolerant native plants creating a stunning hillside oasis.',
    category: 'Garden Design',
    location: 'Hollywood Hills, CA',
    beforeImage: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1758563796815_7533e5fc.webp',
    afterImage: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1758563808354_38a85a55.webp',
    testimonial: {
      text: 'They solved our erosion problems while creating the most beautiful garden we could imagine.',
      author: 'Amanda Wilson',
      rating: 5
    },
    completionDate: 'May 2024'
  },
  {
    id: '6',
    title: 'Poolside Paradise Design',
    description: 'Luxury poolside landscaping featuring tropical plants, outdoor kitchen area, and resort-style ambiance perfect for entertaining and relaxation.',
    category: 'Backyard Design',
    location: 'Manhattan Beach, CA',
    beforeImage: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1758563798669_a20331a5.webp',
    afterImage: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1758563810179_8c584aab.webp',
    testimonial: {
      text: 'Our backyard feels like a five-star resort. The design is both beautiful and functional.',
      author: 'Robert Taylor',
      rating: 5
    },
    completionDate: 'June 2024'
  }
];

const categories = ['All Projects', 'Backyard Design', 'Front Yard Design', 'Garden Design', 'Commercial'];

export const PortfolioGallery: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All Projects');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<{ url: string; alt: string; type: 'before' | 'after' }[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const filteredProjects = activeCategory === 'All Projects' 
    ? portfolioProjects 
    : portfolioProjects.filter(project => project.category === activeCategory);

  const handleImageClick = (images: { url: string; alt: string; type: 'before' | 'after' }[], index: number) => {
    setLightboxImages(images);
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const handlePrevious = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : lightboxImages.length - 1));
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) => (prev < lightboxImages.length - 1 ? prev + 1 : 0));
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Our Portfolio
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover our stunning transformations and see how we've helped clients across Los Angeles 
            create their dream outdoor spaces.
          </p>
        </div>

        <PortfolioFilter
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredProjects.map((project) => (
            <PortfolioCard
              key={project.id}
              project={project}
              onImageClick={handleImageClick}
            />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No projects found in this category.</p>
          </div>
        )}
      </div>

      <ImageLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={lightboxImages}
        currentIndex={currentImageIndex}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />
    </section>
  );
};