import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';

interface PricingRule {
  id: string;
  rule_name: string;
  service_type: string;
  base_price: number;
  seasonal_multiplier: number;
  urgency_multiplier: number;
  distance_rate: number;
  property_size_rate: number;
  is_active: boolean;
}

export const PricingEngine: React.FC = () => {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [newRule, setNewRule] = useState({
    rule_name: '',
    service_type: 'lawn_mowing',
    base_price: 0,
    seasonal_multiplier: 1.0,
    urgency_multiplier: 1.0,
    distance_rate: 0,
    property_size_rate: 0
  });

  useEffect(() => {
    loadPricingRules();
  }, []);

  const loadPricingRules = async () => {
    const { data } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('is_active', true)
      .order('service_type');
    
    if (data) setRules(data);
  };

  const createRule = async () => {
    const { error } = await supabase
      .from('pricing_rules')
      .insert([{
        ...newRule,
        effective_start_date: new Date().toISOString().split('T')[0]
      }]);
    
    if (!error) {
      loadPricingRules();
      setNewRule({
        rule_name: '',
        service_type: 'lawn_mowing',
        base_price: 0,
        seasonal_multiplier: 1.0,
        urgency_multiplier: 1.0,
        distance_rate: 0,
        property_size_rate: 0
      });
    }
  };

  const calculatePrice = (serviceType: string, propertySize: number, distance: number, isUrgent: boolean) => {
    const rule = rules.find(r => r.service_type === serviceType);
    if (!rule) return 0;

    let price = rule.base_price;
    price += propertySize * rule.property_size_rate;
    price += distance * rule.distance_rate;
    price *= rule.seasonal_multiplier;
    if (isUrgent) price *= rule.urgency_multiplier;
    
    return Math.round(price * 100) / 100;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Pricing Engine</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Rule Name</Label>
              <Input
                value={newRule.rule_name}
                onChange={(e) => setNewRule({...newRule, rule_name: e.target.value})}
                placeholder="Summer Lawn Care"
              />
            </div>
            <div>
              <Label>Service Type</Label>
              <Select value={newRule.service_type} onValueChange={(value) => setNewRule({...newRule, service_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lawn_mowing">Lawn Mowing</SelectItem>
                  <SelectItem value="hedge_trimming">Hedge Trimming</SelectItem>
                  <SelectItem value="garden_maintenance">Garden Maintenance</SelectItem>
                  <SelectItem value="tree_pruning">Tree Pruning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Base Price ($)</Label>
              <Input
                type="number"
                value={newRule.base_price}
                onChange={(e) => setNewRule({...newRule, base_price: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <Label>Seasonal Multiplier</Label>
              <Input
                type="number"
                step="0.1"
                value={newRule.seasonal_multiplier}
                onChange={(e) => setNewRule({...newRule, seasonal_multiplier: parseFloat(e.target.value)})}
              />
            </div>
          </div>
          <Button onClick={createRule} className="w-full">Create Pricing Rule</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Pricing Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {rules.map((rule) => (
              <div key={rule.id} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <div className="font-medium">{rule.rule_name}</div>
                  <div className="text-sm text-gray-600">{rule.service_type.replace('_', ' ')}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">${rule.base_price}</div>
                  <div className="text-sm text-gray-600">x{rule.seasonal_multiplier} seasonal</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};