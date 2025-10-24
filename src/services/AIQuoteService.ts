import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export interface QuoteRequest {
  images: string[];
  address: string;
  squareFootage: number;
  services: string[];
  propertyType: string;
}

export interface QuoteEstimate {
  estimatedPrice: number;
  confidence: number;
  breakdown: Record<string, number>;
  recommendations: string[];
  propertyInsights: {
    climate: string;
    accessibility: string;
  };
}

export interface HistoricalData {
  jobId: string;
  actualPrice: number;
  estimatedPrice: number;
  accuracy: number;
  completedAt: string;
}

class AIQuoteService {
  private cache = new Map<string, QuoteEstimate>();
  private historicalData: HistoricalData[] = [];

  async generateQuote(request: QuoteRequest): Promise<QuoteEstimate> {
    try {
      const cacheKey = this.getCacheKey(request);
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        logger.info('Returning cached quote estimate');
        return this.cache.get(cacheKey)!;
      }

      logger.info('Generating new AI quote estimate');
      
      const { data, error } = await supabase.functions.invoke('ai-quote-analyzer', {
        body: request
      });

      if (error) {
        logger.error('AI quote generation failed:', error);
        throw new Error('Failed to generate quote estimate');
      }

      const estimate: QuoteEstimate = data;
      
      // Cache the result
      this.cache.set(cacheKey, estimate);
      
      // Store for ML training
      await this.storeQuoteData(request, estimate);
      
      logger.info('AI quote generated successfully', { confidence: estimate.confidence });
      return estimate;
      
    } catch (error) {
      logger.error('Quote generation error:', error);
      throw error;
    }
  }

  async getHistoricalAccuracy(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('estimated_price, final_price, created_at')
        .not('final_price', 'is', null)
        .limit(100);

      if (error) throw error;

      if (!data || data.length === 0) return 0.85; // Default accuracy

      const accuracyScores = data.map(quote => {
        const accuracy = 1 - Math.abs(quote.final_price - quote.estimated_price) / quote.final_price;
        return Math.max(0, Math.min(1, accuracy));
      });

      return accuracyScores.reduce((sum, acc) => sum + acc, 0) / accuracyScores.length;
    } catch (error) {
      logger.error('Failed to calculate historical accuracy:', error);
      return 0.85;
    }
  }

  async updateModelWithActual(quoteId: string, actualPrice: number): Promise<void> {
    try {
      await supabase
        .from('quotes')
        .update({ final_price: actualPrice, updated_at: new Date().toISOString() })
        .eq('id', quoteId);
        
      logger.info('Updated quote with actual price for ML training', { quoteId, actualPrice });
    } catch (error) {
      logger.error('Failed to update quote with actual price:', error);
    }
  }

  private getCacheKey(request: QuoteRequest): string {
    return `${request.address}_${request.squareFootage}_${request.services.sort().join('_')}`;
  }

  private async storeQuoteData(request: QuoteRequest, estimate: QuoteEstimate): Promise<void> {
    try {
      await supabase
        .from('quotes')
        .insert({
          address: request.address,
          square_footage: request.squareFootage,
          services: request.services,
          property_type: request.propertyType,
          estimated_price: estimate.estimatedPrice,
          confidence_score: estimate.confidence,
          breakdown: estimate.breakdown,
          recommendations: estimate.recommendations,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      logger.warn('Failed to store quote data:', error);
    }
  }
}

export const aiQuoteService = new AIQuoteService();