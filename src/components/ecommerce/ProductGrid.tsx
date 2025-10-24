import React from 'react';
import ProductCard from './ProductCard';

const products = [
  {
    id: '1',
    name: 'Bamboo Toothbrush Set',
    price: 12.99,
    originalPrice: 16.99,
    image: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1756431016410_a0396de9.webp',
    rating: 4.8,
    reviews: 234,
    category: 'Oral Care'
  },
  {
    id: '2',
    name: 'Eco Bamboo Brush',
    price: 9.99,
    image: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1756431018525_6aacbf27.webp',
    rating: 4.6,
    reviews: 156,
    category: 'Oral Care'
  },
  {
    id: '3',
    name: 'Natural Bamboo Toothbrush',
    price: 8.99,
    originalPrice: 12.99,
    image: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1756431020775_292d9047.webp',
    rating: 4.9,
    reviews: 312,
    category: 'Oral Care'
  },
  {
    id: '4',
    name: 'Sustainable Brush Pack',
    price: 15.99,
    image: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1756431022847_3d4b5c26.webp',
    rating: 4.7,
    reviews: 89,
    category: 'Oral Care'
  },
  {
    id: '5',
    name: 'Stainless Steel Water Bottle',
    price: 24.99,
    originalPrice: 29.99,
    image: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1756431027266_18f038fc.webp',
    rating: 4.9,
    reviews: 445,
    category: 'Drinkware'
  },
  {
    id: '6',
    name: 'Insulated Water Bottle',
    price: 32.99,
    image: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1756431029274_0af5cf31.webp',
    rating: 4.8,
    reviews: 267,
    category: 'Drinkware'
  },
  {
    id: '7',
    name: 'Eco-Friendly Bottle',
    price: 19.99,
    image: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1756431031169_e12e9c2a.webp',
    rating: 4.6,
    reviews: 178,
    category: 'Drinkware'
  },
  {
    id: '8',
    name: 'Premium Steel Bottle',
    price: 39.99,
    originalPrice: 49.99,
    image: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1756431033043_66999412.webp',
    rating: 4.9,
    reviews: 523,
    category: 'Drinkware'
  },
  {
    id: '9',
    name: 'Organic Cotton Tote Bag',
    price: 16.99,
    image: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1756431036639_b7d1769c.webp',
    rating: 4.7,
    reviews: 198,
    category: 'Bags'
  },
  {
    id: '10',
    name: 'Sustainable Shopping Bag',
    price: 14.99,
    originalPrice: 19.99,
    image: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1756431038538_88376536.webp',
    rating: 4.8,
    reviews: 134,
    category: 'Bags'
  },
  {
    id: '11',
    name: 'Eco Canvas Tote',
    price: 18.99,
    image: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1756431040811_48d8d5bf.webp',
    rating: 4.6,
    reviews: 87,
    category: 'Bags'
  },
  {
    id: '12',
    name: 'Natural Fiber Bag',
    price: 22.99,
    image: 'https://d64gsuwffb70l.cloudfront.net/68875f8ee1bf860dd7a01934_1756431042832_7c298e59.webp',
    rating: 4.9,
    reviews: 256,
    category: 'Bags'
  }
];

export default function ProductGrid() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover our carefully curated collection of sustainable products that help you live more consciously
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </div>
    </section>
  );
}