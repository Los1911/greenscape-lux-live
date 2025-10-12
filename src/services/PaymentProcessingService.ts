import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

export interface Invoice {
  id: string;
  customer_id: string;
  amount_due: number;
  status: string;
  invoice_pdf?: string;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  billing_details: {
    name?: string;
    email?: string;
  };
}

export class PaymentProcessingService {
  private static instance: PaymentProcessingService;

  public static getInstance(): PaymentProcessingService {
    if (!PaymentProcessingService.instance) {
      PaymentProcessingService.instance = new PaymentProcessingService();
    }
    return PaymentProcessingService.instance;
  }

  /**
   * Create a payment intent for processing
   */
  async createPaymentIntent(params: {
    amount: number;
    currency?: string;
    customerId: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<PaymentIntent> {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: params.amount,
          currency: params.currency || 'usd',
          customer_id: params.customerId,
          description: params.description,
          metadata: params.metadata
        }
      });

      if (error) {
        logger.error('Failed to create payment intent', error, 'PaymentService');
        throw new Error('Failed to create payment intent');
      }

      return data.paymentIntent;
    } catch (error) {
      logger.error('Payment intent creation error', error, 'PaymentService');
      throw error;
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPayment(paymentIntentId: string, paymentMethodId: string): Promise<PaymentIntent> {
    try {
      const { data, error } = await supabase.functions.invoke('confirm-payment', {
        body: {
          payment_intent_id: paymentIntentId,
          payment_method_id: paymentMethodId
        }
      });

      if (error) {
        logger.error('Failed to confirm payment', error, 'PaymentService');
        throw new Error('Failed to confirm payment');
      }

      return data.paymentIntent;
    } catch (error) {
      logger.error('Payment confirmation error', error, 'PaymentService');
      throw error;
    }
  }

  /**
   * Create and send an invoice
   */
  async createInvoice(params: {
    customerId: string;
    items: Array<{
      description: string;
      amount: number;
      quantity?: number;
    }>;
    dueDate?: string;
    metadata?: Record<string, string>;
  }): Promise<Invoice> {
    try {
      const { data, error } = await supabase.functions.invoke('create-invoice', {
        body: {
          customer_id: params.customerId,
          items: params.items,
          due_date: params.dueDate,
          metadata: params.metadata
        }
      });

      if (error) {
        logger.error('Failed to create invoice', error, 'PaymentService');
        throw new Error('Failed to create invoice');
      }

      return data.invoice;
    } catch (error) {
      logger.error('Invoice creation error', error, 'PaymentService');
      throw error;
    }
  }

  /**
   * Generate receipt PDF
   */
  async generateReceipt(paymentId: string): Promise<Blob> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-receipt', {
        body: { payment_id: paymentId }
      });

      if (error) {
        logger.error('Failed to generate receipt', error, 'PaymentService');
        throw new Error('Failed to generate receipt');
      }

      // Convert base64 to blob
      const binaryString = atob(data.pdf);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      return new Blob([bytes], { type: 'application/pdf' });
    } catch (error) {
      logger.error('Receipt generation error', error, 'PaymentService');
      throw error;
    }
  }

  /**
   * Get payment methods for a customer
   */
  async getPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabase.functions.invoke('get-payment-methods', {
        body: { customer_id: customerId }
      });

      if (error) {
        logger.error('Failed to fetch payment methods', error, 'PaymentService');
        throw new Error('Failed to fetch payment methods');
      }

      return data.paymentMethods;
    } catch (error) {
      logger.error('Payment methods fetch error', error, 'PaymentService');
      throw error;
    }
  }

  /**
   * Add a payment method
   */
  async addPaymentMethod(params: {
    customerId: string;
    paymentMethodId: string;
    setAsDefault?: boolean;
  }): Promise<PaymentMethod> {
    try {
      const { data, error } = await supabase.functions.invoke('attach-payment-method', {
        body: {
          customer_id: params.customerId,
          payment_method_id: params.paymentMethodId,
          set_as_default: params.setAsDefault
        }
      });

      if (error) {
        logger.error('Failed to add payment method', error, 'PaymentService');
        throw new Error('Failed to add payment method');
      }

      return data.paymentMethod;
    } catch (error) {
      logger.error('Payment method addition error', error, 'PaymentService');
      throw error;
    }
  }

  /**
   * Remove a payment method
   */
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('delete-payment-method', {
        body: { payment_method_id: paymentMethodId }
      });

      if (error) {
        logger.error('Failed to remove payment method', error, 'PaymentService');
        throw new Error('Failed to remove payment method');
      }
    } catch (error) {
      logger.error('Payment method removal error', error, 'PaymentService');
      throw error;
    }
  }

  /**
   * Process refund
   */
  async processRefund(params: {
    paymentIntentId: string;
    amount?: number;
    reason?: string;
  }): Promise<{ id: string; status: string; amount: number }> {
    try {
      const { data, error } = await supabase.functions.invoke('process-refund', {
        body: {
          payment_intent_id: params.paymentIntentId,
          amount: params.amount,
          reason: params.reason
        }
      });

      if (error) {
        logger.error('Failed to process refund', error, 'PaymentService');
        throw new Error('Failed to process refund');
      }

      return data.refund;
    } catch (error) {
      logger.error('Refund processing error', error, 'PaymentService');
      throw error;
    }
  }

  /**
   * Get payment history with filtering and pagination
   */
  async getPaymentHistory(params: {
    customerId?: string;
    landscaperId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      let query = supabase
        .from('payments')
        .select(`
          *,
          client:profiles!payments_client_id_fkey(full_name, email),
          landscaper:profiles!payments_landscaper_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (params.customerId) {
        query = query.eq('client_id', params.customerId);
      }

      if (params.landscaperId) {
        query = query.eq('landscaper_id', params.landscaperId);
      }

      if (params.status) {
        query = query.eq('status', params.status);
      }

      if (params.startDate) {
        query = query.gte('created_at', params.startDate);
      }

      if (params.endDate) {
        query = query.lte('created_at', params.endDate);
      }

      if (params.limit) {
        query = query.limit(params.limit);
      }

      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to fetch payment history', error, 'PaymentService');
        throw new Error('Failed to fetch payment history');
      }

      return data;
    } catch (error) {
      logger.error('Payment history fetch error', error, 'PaymentService');
      throw error;
    }
  }

  /**
   * Generate tax report
   */
  async generateTaxReport(params: {
    userId: string;
    year: number;
    userType: 'client' | 'landscaper';
  }): Promise<Blob> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-tax-report', {
        body: {
          user_id: params.userId,
          year: params.year,
          user_type: params.userType
        }
      });

      if (error) {
        logger.error('Failed to generate tax report', error, 'PaymentService');
        throw new Error('Failed to generate tax report');
      }

      // Convert base64 to blob
      const binaryString = atob(data.pdf);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      return new Blob([bytes], { type: 'application/pdf' });
    } catch (error) {
      logger.error('Tax report generation error', error, 'PaymentService');
      throw error;
    }
  }
}

export const paymentService = PaymentProcessingService.getInstance();