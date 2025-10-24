import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

interface QuoteFormRedirectProps {
  to?: string;
}

const QuoteFormRedirect: React.FC<QuoteFormRedirectProps> = ({ to = '/get-quote' }) => {
  useEffect(() => {
    // Track redirect for analytics
    console.log(`Redirecting legacy quote form to: ${to}`);
  }, [to]);

  return <Navigate to={to} replace />;
};

export default QuoteFormRedirect;