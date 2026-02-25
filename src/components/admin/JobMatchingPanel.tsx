import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, Clock, AlertTriangle, Calendar, Sparkles } from 'lucide-react';
import { LandscaperMatch, autoAssignJob } from '@/utils/jobMatchingEngine';
import { ScheduleConflictChecker } from './ScheduleConflictChecker';
import { OptimalTimeSlotSuggester } from './OptimalTimeSlotSuggester';

interface JobMatchingPanelProps {
  quoteId: string;
  matches: LandscaperMatch[];
  onAssign: (landscaperId: string) => void;
  jobLat?: number;
  jobLng?: number;
  proposedDate?: Date;
  estimatedDuration?: number;
}

export function JobMatchingPanel({ 
  quoteId, 
  matches, 
  onAssign,
  jobLat,
  jobLng,
  proposedDate,
  estimatedDuration = 2
}: JobMatchingPanelProps) {
  const [selectedLandscaper, setSelectedLandscaper] = useState<string | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const handleAutoAssign = async () => {
    if (matches.length === 0) return;
    setAssigning(true);
    const topMatch = matches[0];
    const success = await autoAssignJob(quoteId, topMatch.id);
    if (success) onAssign(topMatch.id);
    setAssigning(false);
  };

  const handleManualAssign = async (landscaperId: string) => {
    setAssigning(true);
    const success = await autoAssignJob(quoteId, landscaperId);
    if (success) onAssign(landscaperId);
    setAssigning(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Intelligent Job Matching
            </CardTitle>
            {matches.length > 0 && (
              <Button onClick={handleAutoAssign} disabled={assigning}>
                Auto-Assign to Top Match
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No matching landscapers found.
            </p>
          ) : (
            <div className="space-y-3">
              {matches.map((match, index) => (
                <Card key={match.id} className={index === 0 ? 'border-primary border-2' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{match.name}</h3>
                          <Badge variant={match.matchScore >= 80 ? 'default' : 'secondary'}>
                            {match.matchScore}% Match
                          </Badge>
                          {index === 0 && <Badge variant="outline">Top Match</Badge>}
                          {match.hasScheduleConflict && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Conflict
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3 text-sm text-muted-foreground">
                          {match.matchReasons.map((reason, i) => (
                            <span key={i} className="flex items-center gap-1">
                              {reason.includes('miles') && <MapPin className="h-3 w-3" />}
                              {reason.includes('★') && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                              {reason.includes('responder') && <Clock className="h-3 w-3" />}
                              {reason}
                              {i < match.matchReasons.length - 1 && <span>•</span>}
                            </span>
                          ))}
                        </div>

                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Distance</p>
                            <p className="font-medium">{match.distance} mi</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Rating</p>
                            <p className="font-medium">{match.rating}★</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Response</p>
                            <p className="font-medium">{match.avgResponseTimeHours}h</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Status</p>
                            <p className="font-medium">{match.available ? '✓ Available' : 'Busy'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        {proposedDate && (
                          <Button
                            onClick={() => {
                              setSelectedLandscaper(match.id);
                              setShowSchedule(!showSchedule);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          onClick={() => handleManualAssign(match.id)}
                          disabled={assigning}
                          variant={index === 0 ? 'default' : 'outline'}
                        >
                          Assign
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showSchedule && selectedLandscaper && proposedDate && (
        <ScheduleConflictChecker
          landscaperId={selectedLandscaper}
          proposedDate={proposedDate}
          estimatedDuration={estimatedDuration}
          onConflictResolved={() => setShowTimeSlots(true)}
        />
      )}

      {showTimeSlots && selectedLandscaper && jobLat && jobLng && (
        <OptimalTimeSlotSuggester
          landscaperId={selectedLandscaper}
          jobLat={jobLat}
          jobLng={jobLng}
          estimatedDuration={estimatedDuration}
          onSelectSlot={(slot) => {
            console.log('Selected time slot:', slot);
            setShowTimeSlots(false);
          }}
        />
      )}
    </div>
  );
}
