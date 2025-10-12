/**
 * Text Truncation and Overflow Handling Utilities
 */

export const textPatterns = {
  // Basic truncation
  truncate: 'truncate',
  clamp1: 'line-clamp-1',
  clamp2: 'line-clamp-2',
  clamp3: 'line-clamp-3',
  
  // Break word patterns
  breakWords: 'break-words',
  overflowHidden: 'overflow-hidden',
  
  // Responsive text sizing
  responsiveText: {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-sm sm:text-base lg:text-lg',
    lg: 'text-base sm:text-lg lg:text-xl',
    xl: 'text-lg sm:text-xl lg:text-2xl'
  }
};

// Component-specific patterns
export const componentPatterns = {
  cardTitle: 'text-sm sm:text-base lg:text-lg font-semibold truncate',
  cardSubtitle: 'text-xs sm:text-sm text-gray-500 truncate',
  cardDescription: 'text-xs sm:text-sm text-gray-600 line-clamp-2 break-words',
  navItem: 'text-sm sm:text-base truncate',
  formLabel: 'text-sm font-medium text-gray-700 truncate',
  modalTitle: 'text-lg sm:text-xl font-semibold truncate',
  userName: 'text-sm sm:text-base font-medium truncate',
  userEmail: 'text-xs sm:text-sm text-gray-500 truncate',
  transactionDesc: 'text-sm text-gray-900 line-clamp-1 break-words',
  notificationMsg: 'text-sm text-gray-600 line-clamp-2 break-words'
};

export const getTruncatedText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength - 3) + '...';
};

export const containerPatterns = {
  flexTruncate: 'flex items-center min-w-0',
  cardContainer: 'p-4 bg-white rounded-lg shadow-sm border overflow-hidden'
};