import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Calendar, DollarSign, Save } from 'lucide-react';

interface PayoutSchedule {
  id?: string;
  schedule_type: string;
  minimum_payout: number;
  payout_day?: number;
  auto_payout_enabled: boolean;
}

export default function PayoutScheduleManager() {
  const [schedule, setSchedule] = useState<PayoutSchedule>({
    schedule_type: 'weekly',
    minimum_payout: 50,
    payout_day: 5,
    auto_payout_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: landscaper } = await supabase
        .from('landscapers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!landscaper) return;

      const { data } = await supabase
        .from('payout_schedules')
        .select('*')
        .eq('landscaper_id', landscaper.id)
        .single();

      if (data) {
        setSchedule(data);
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    console.log('💾 Saving payout schedule...', schedule);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: landscaper } = await supabase
        .from('landscapers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!landscaper) {
        throw new Error('Landscaper profile not found');
      }

      const nextPayoutDate = calculateNextPayoutDate(
        schedule.schedule_type,
        schedule.payout_day
      );

      const { error } = await supabase
        .from('payout_schedules')
        .upsert({
          ...schedule,
          landscaper_id: landscaper.id,
          next_payout_date: nextPayoutDate,
        });

      if (error) throw error;

      console.log('✅ Payout schedule saved successfully');
      
      toast({
        title: 'Schedule saved',
        description: 'Your payout schedule has been updated successfully.',
      });
    } catch (error: any) {
      console.error('❌ Error saving schedule:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save payout schedule.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };


  const calculateNextPayoutDate = (scheduleType: string, payoutDay?: number): string => {
    const now = new Date();
    let next = new Date(now);

    switch (scheduleType) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        const daysUntilPayoutDay = ((payoutDay || 5) - now.getDay() + 7) % 7 || 7;
        next.setDate(next.getDate() + daysUntilPayoutDay);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        next.setDate(payoutDay || 1);
        break;
    }

    return next.toISOString();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payout Schedule</CardTitle>
        <CardDescription>
          Configure when and how you receive payouts for completed jobs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="schedule-type">Payout Frequency</Label>
            <Select
              value={schedule.schedule_type}
              onValueChange={(value) => setSchedule({ ...schedule, schedule_type: value })}
            >
              <SelectTrigger id="schedule-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              How often you want to receive payouts
            </p>
          </div>

          {schedule.schedule_type === 'weekly' && (
            <div className="space-y-2">
              <Label htmlFor="payout-day">Payout Day</Label>
              <Select
                value={schedule.payout_day?.toString()}
                onValueChange={(value) => setSchedule({ ...schedule, payout_day: parseInt(value) })}
              >
                <SelectTrigger id="payout-day">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {schedule.schedule_type === 'monthly' && (
            <div className="space-y-2">
              <Label htmlFor="payout-day-monthly">Day of Month</Label>
              <Input
                id="payout-day-monthly"
                type="number"
                min="1"
                max="31"
                value={schedule.payout_day || 1}
                onChange={(e) => setSchedule({ ...schedule, payout_day: parseInt(e.target.value) })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="minimum-payout">Minimum Payout Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="minimum-payout"
                type="number"
                min="0"
                step="0.01"
                value={schedule.minimum_payout}
                onChange={(e) => setSchedule({ ...schedule, minimum_payout: parseFloat(e.target.value) })}
                className="pl-9"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Minimum amount required before initiating a payout
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-payout">Automatic Payouts</Label>
              <p className="text-sm text-muted-foreground">
                Automatically process payouts based on your schedule
              </p>
            </div>
            <Switch
              id="auto-payout"
              checked={schedule.auto_payout_enabled}
              onCheckedChange={(checked) => setSchedule({ ...schedule, auto_payout_enabled: checked })}
            />
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Schedule'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
