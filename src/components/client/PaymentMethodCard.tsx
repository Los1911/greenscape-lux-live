import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, AlertTriangle, Clock, AlertCircle, CheckCircle2, Star, Trash2 } from 'lucide-react';

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
  created: number;
  status?: 'active' | 'expired' | 'expiring_soon' | 'failed';
  failure_reason?: string;
}

interface PaymentMethodCardProps {
  method: PaymentMethod;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  isSettingDefault?: boolean;
  isDeleting?: boolean;
}

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  method,
  onSetDefault,
  onDelete,
  isSettingDefault = false,
  isDeleting = false
}) => {
  const formatCardBrand = (brand: string) => {
    const brandMap: Record<string, string> = {
      'visa': 'Visa',
      'mastercard': 'Mastercard',
      'amex': 'American Express',
      'discover': 'Discover',
      'diners': 'Diners Club',
      'jcb': 'JCB',
      'unionpay': 'UnionPay'
    };
    return brandMap[brand.toLowerCase()] || brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  const getStatusIcon = (status: PaymentMethod['status']) => {
    switch (status) {
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'expiring_soon':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusBadge = (status: PaymentMethod['status']) => {
    switch (status) {
      case 'expired':
        return <Badge variant="destructive" className="text-xs">Expired</Badge>;
      case 'expiring_soon':
        return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">Expires Soon</Badge>;
      case 'failed':
        return <Badge variant="destructive" className="text-xs">Failed</Badge>;
      default:
        return null;
    }
  };

  const getCardClassName = (status: PaymentMethod['status']) => {
    switch (status) {
      case 'expired':
      case 'failed':
        return 'border-red-200 bg-red-50/50';
      case 'expiring_soon':
        return 'border-yellow-200 bg-yellow-50/50';
      default:
        return 'border-border bg-card hover:bg-accent/50';
    }
  };

  const getBrandColor = (brand: string) => {
    const colorMap: Record<string, string> = {
      'visa': 'text-blue-600',
      'mastercard': 'text-red-600',
      'amex': 'text-green-600',
      'discover': 'text-orange-600'
    };
    return colorMap[brand.toLowerCase()] || 'text-gray-600';
  };

  const isExpiringSoon = method.status === 'expiring_soon';
  const isProblematic = method.status === 'expired' || method.status === 'failed';

  return (
    <Card className={`relative transition-all duration-200 ${getCardClassName(method.status)}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CreditCard className={`h-6 w-6 ${getBrandColor(method.brand)}`} />
              {getStatusIcon(method.status)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-foreground">
                  {formatCardBrand(method.brand)} •••• {method.last4}
                </span>
                {method.is_default && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Default
                  </Badge>
                )}
                {getStatusBadge(method.status)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                <span className={isExpiringSoon || isProblematic ? 'font-medium' : ''}>
                  Expires {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                </span>
                {method.failure_reason && (
                  <div className="text-red-600 text-xs mt-1 font-medium">
                    {method.failure_reason}
                  </div>
                )}
                {isExpiringSoon && (
                  <div className="text-yellow-700 text-xs mt-1 font-medium">
                    Please update your payment method
                  </div>
                )}
                {method.status === 'expired' && (
                  <div className="text-red-600 text-xs mt-1 font-medium">
                    This card has expired
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {!method.is_default && method.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSetDefault(method.id)}
                disabled={isSettingDefault}
                className="text-xs"
              >
                {isSettingDefault ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                ) : (
                  <>
                    <Star className="h-3 w-3 mr-1" />
                    Set Default
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(method.id)}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              {isDeleting ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Action suggestions for problematic cards */}
        {isProblematic && (
          <div className="mt-3 p-2 rounded-md bg-white/80 border border-red-200">
            <p className="text-xs text-red-700 font-medium">
              {method.status === 'expired' 
                ? 'This card has expired. Please add a new payment method.'
                : 'This payment method has failed. Please update or add a new payment method.'
              }
            </p>
          </div>
        )}
        
        {isExpiringSoon && (
          <div className="mt-3 p-2 rounded-md bg-white/80 border border-yellow-200">
            <p className="text-xs text-yellow-700 font-medium">
              This card expires soon. Consider updating your payment information.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};