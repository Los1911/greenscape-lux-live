import React from 'react';

interface PortfolioFilterProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export const PortfolioFilter: React.FC<PortfolioFilterProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
}) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mb-12">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
            activeCategory === category
              ? 'bg-emerald-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 shadow-md'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
};