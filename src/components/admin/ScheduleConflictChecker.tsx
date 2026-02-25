import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { checkScheduleConflicts, ScheduleConflict } from '@/utils/intelligentScheduling';

interface ScheduleConflictCheckerProps {
  landscaperId: string;
  proposedDate: Date;
  estimatedDuration: number;
  onConflictResolved?: () => void;
}

export function ScheduleConflictChecker({
  landscaperId,
  proposedDate,
  estimatedDuration,
  onConflictResolved
}: ScheduleConflictCheckerProps) {
  const [conflict, setConflict] = useState<ScheduleConflict | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConflicts();
  }, [landscaperId, proposedDate, estimatedDuration]);

  const checkConflicts = async () => {
    setLoading(true);
    const result = await checkScheduleConflicts(landscaperId, proposedDate, estimatedDuration);
    setConflict(result);
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Checking schedule...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {conflict?.hasConflict ? (
            <>
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Schedule Conflict Detected
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              No Schedule Conflicts
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {conflict?.hasConflict ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This landscaper has {conflict.conflictingJobs.length} conflicting job(s):
            </p>
            {conflict.conflictingJobs.map((job, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <Calendar className="h-4 w-4 text-red-500" />
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {job.scheduledDate.toLocaleDateString()} at {job.scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Duration: {job.estimatedDuration}h
                  </div>
                </div>
                <Badge variant="destructive">Conflict</Badge>
              </div>
            ))}
            <Button onClick={onConflictResolved} variant="outline" className="w-full">
              <Clock className="h-4 w-4 mr-2" />
              Suggest Alternative Times
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              This time slot is available for scheduling
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
