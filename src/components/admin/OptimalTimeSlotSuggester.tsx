import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, TrendingUp } from 'lucide-react';
import { suggestOptimalTimeSlots, OptimalTimeSlot } from '@/utils/intelligentScheduling';

interface OptimalTimeSlotSuggesterProps {
  landscaperId: string;
  jobLat: number;
  jobLng: number;
  estimatedDuration: number;
  onSelectSlot: (slot: OptimalTimeSlot) => void;
}

export function OptimalTimeSlotSuggester({
  landscaperId,
  jobLat,
  jobLng,
  estimatedDuration,
  onSelectSlot
}: OptimalTimeSlotSuggesterProps) {
  const [slots, setSlots] = useState<OptimalTimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSlots();
  }, [landscaperId, jobLat, jobLng, estimatedDuration]);

  const loadSlots = async () => {
    setLoading(true);
    const suggestions = await suggestOptimalTimeSlots(
      landscaperId,
      jobLat,
      jobLng,
      estimatedDuration
    );
    setSlots(suggestions);
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Finding optimal time slots...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Optimal Time Slots
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {slots.map((slot, idx) => (
            <div
              key={idx}
              className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
              onClick={() => onSelectSlot(slot)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div>
                    <div className="font-medium">
                      {slot.start.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {slot.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                      {slot.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <Badge variant={slot.score > 70 ? 'default' : 'secondary'}>
                  {Math.round(slot.score)}% optimal
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {slot.reason}
              </div>
              {slot.nearbyJobs > 0 && (
                <div className="mt-2 text-xs text-green-600 font-medium">
                  ✓ Route optimization: {slot.nearbyJobs} nearby job{slot.nearbyJobs > 1 ? 's' : ''}
                </div>
              )}
            </div>
          ))}
          {slots.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No available time slots found in the next 7 days
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
