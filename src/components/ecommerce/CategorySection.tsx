import React from 'react';
import { ArrowRight } from 'lucide-react';

const categories = [
  {
    id: 1,
    name: 'Oral Care',
    description: 'Sustainable dental hygiene',
    image: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1756431016410_a0396de9.webp',
    productCount: 24
  },
  {
    id: 2,
    name: 'Drinkware',
    description: 'Eco-friendly bottles & cups',
    image: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1756431027266_18f038fc.webp',
    productCount: 18
  },
  {
    id: 3,
    name: 'Bags & Totes',
    description: 'Reusable shopping solutions',
    image: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1756431036639_b7d1769c.webp',
    productCount: 32
  }
];

export default function CategorySection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
          <p className="text-lg text-gray-600">Find the perfect sustainable products for your lifestyle</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {categories.map((category) => (
            <div 
              key={category.id}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
            >
              <div className="relative overflow-hidden">
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
                  <span className="text-sm text-gray-500">{category.productCount} items</span>
                </div>
                
                <p className="text-gray-600 mb-4">{category.description}</p>
                
                <button className="flex items-center space-x-2 text-green-600 font-medium hover:text-green-700 transition-colors duration-200">
                  <span>Shop Now</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}