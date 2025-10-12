import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, TrendingUp, Settings } from 'lucide-react';
import { aiQuoteService } from '@/services/AIQuoteService';
import { logger } from '@/utils/logger';

interface SeasonalMultiplier {
  season: string;
  multiplier: number;
  description: string;
}

const DEFAULT_MULTIPLIERS: SeasonalMultiplier[] = [
  { season: 'spring', multiplier: 1.2, description: 'High demand season' },
  { season: 'summer', multiplier: 1.0, description: 'Standard pricing' },
  { season: 'fall', multiplier: 1.1, description: 'Cleanup season' },
  { season: 'winter', multiplier: 0.8, description: 'Low demand season' }
];

export const SeasonalPricingEngine: React.FC = () => {
  const [multipliers, setMultipliers] = useState<SeasonalMultiplier[]>(DEFAULT_MULTIPLIERS);
  const [currentSeason, setCurrentSeason] = useState<string>('');
  const [historicalAccuracy, setHistoricalAccuracy] = useState<number>(0);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const month = new Date().getMonth();
    let season = 'summer';
    if (month >= 2 && month <= 4) season = 'spring';
    else if (month >= 8 && month <= 10) season = 'fall';
    else if (month === 11 || month <= 1) season = 'winter';
    
    setCurrentSeason(season);
    loadHistoricalAccuracy();
  }, []);

  const loadHistoricalAccuracy = async () => {
    try {
      const accuracy = await aiQuoteService.getHistoricalAccuracy();
      setHistoricalAccuracy(accuracy);
    } catch (error) {
      logger.error('Failed to load historical accuracy:', error);
    }
  };

  const updateMultiplier = (season: string, newMultiplier: number) => {
    setMultipliers(prev => 
      prev.map(m => 
        m.season === season 
          ? { ...m, multiplier: newMultiplier }
          : m
      )
    );
  };

  const saveMultipliers = () => {
    // In a real implementation, this would save to database
    localStorage.setItem('seasonalMultipliers', JSON.stringify(multipliers));
    setEditMode(false);
    logger.info('Seasonal multipliers updated');
  };

  const getCurrentMultiplier = () => {
    return multipliers.find(m => m.season === currentSeason)?.multiplier || 1.0;
  };

  const getSeasonIcon = (season: string) => {
    const icons = {
      spring: '🌸',
      summer: '☀️',
      fall: '🍂',
      winter: '❄️'
    };
    return icons[season as keyof typeof icons] || '📅';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Seasonal Pricing Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl mb-2">
                {getSeasonIcon(currentSeason)} {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)}
              </div>
              <Badge variant="outline">Current Season</Badge>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {(getCurrentMultiplier() * 100).toFixed(0)}%
              </div>
              <Badge variant="outline">Price Multiplier</Badge>
            </div>
          </div>

          <div className="space-y-3">
            {multipliers.map(({ season, multiplier, description }) => (
              <div key={season} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getSeasonIcon(season)}</span>
                  <div>
                    <div className="font-medium capitalize">{season}</div>
                    <div className="text-sm text-gray-500">{description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {editMode ? (
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="2.0"
                      value={multiplier}
                      onChange={(e) => updateMultiplier(season, parseFloat(e.target.value))}
                      className="w-20"
                    />
                  ) : (
                    <Badge variant={season === currentSeason ? 'default' : 'secondary'}>
                      {multiplier}x
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            {editMode ? (
              <>
                <Button onClick={saveMultipliers} className="flex-1">
                  Save Changes
                </Button>
                <Button onClick={() => setEditMode(false)} variant="outline">
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditMode(true)} variant="outline" className="flex-1">
                <Settings className="h-4 w-4 mr-2" />
                Edit Multipliers
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Model Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {(historicalAccuracy * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Historical Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {getCurrentMultiplier() > 1 ? '+' : ''}{((getCurrentMultiplier() - 1) * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-500">Current Adjustment</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                AI + Seasonal
              </div>
              <div className="text-sm text-gray-500">Pricing Model</div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Current Season Impact:</strong> {currentSeason === 'spring' ? 'Prices increased due to high demand' :
              currentSeason === 'summer' ? 'Standard pricing in effect' :
              currentSeason === 'fall' ? 'Slight increase for cleanup services' :
              'Reduced pricing for winter season'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};