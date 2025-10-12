interface EngagementEvent {
  leadId: string;
  email: string;
  action: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface ScoringRule {
  action: string;
  points: number;
  isActive: boolean;
}

interface LeadScore {
  leadId: string;
  email: string;
  score: number;
  status: 'cold' | 'warm' | 'hot' | 'qualified';
  lastActivity: string;
  engagementHistory: Array<{
    action: string;
    points: number;
    timestamp: string;
  }>;
}

class LeadScoringService {
  private scoringRules: Map<string, ScoringRule> = new Map([
    ['email_open', { action: 'email_open', points: 5, isActive: true }],
    ['email_click', { action: 'email_click', points: 10, isActive: true }],
    ['page_visit', { action: 'page_visit', points: 2, isActive: true }],
    ['quote_request', { action: 'quote_request', points: 50, isActive: true }],
    ['profile_complete', { action: 'profile_complete', points: 25, isActive: true }],
    ['call_scheduled', { action: 'call_scheduled', points: 30, isActive: true }],
    ['form_submit', { action: 'form_submit', points: 15, isActive: true }],
  ]);

  private leadScores: Map<string, LeadScore> = new Map();

  trackEngagement(event: EngagementEvent): LeadScore | null {
    const rule = this.scoringRules.get(event.action);
    if (!rule || !rule.isActive) return null;

    const existingLead = this.leadScores.get(event.leadId) || {
      leadId: event.leadId,
      email: event.email,
      score: 0,
      status: 'cold' as const,
      lastActivity: event.timestamp,
      engagementHistory: []
    };

    const newScore = existingLead.score + rule.points;
    const updatedLead: LeadScore = {
      ...existingLead,
      score: newScore,
      status: this.calculateStatus(newScore),
      lastActivity: event.timestamp,
      engagementHistory: [
        ...existingLead.engagementHistory,
        {
          action: event.action,
          points: rule.points,
          timestamp: event.timestamp
        }
      ].slice(-20) // Keep last 20 activities
    };

    this.leadScores.set(event.leadId, updatedLead);
    return updatedLead;
  }

  private calculateStatus(score: number): 'cold' | 'warm' | 'hot' | 'qualified' {
    if (score >= 80) return 'qualified';
    if (score >= 60) return 'hot';
    if (score >= 30) return 'warm';
    return 'cold';
  }

  getLeadScore(leadId: string): LeadScore | undefined {
    return this.leadScores.get(leadId);
  }

  getAllLeads(): LeadScore[] {
    return Array.from(this.leadScores.values()).sort((a, b) => b.score - a.score);
  }

  getQualifiedLeads(): LeadScore[] {
    return this.getAllLeads().filter(lead => lead.status === 'qualified');
  }

  getHotLeads(): LeadScore[] {
    return this.getAllLeads().filter(lead => lead.status === 'hot');
  }

  updateScoringRule(action: string, points: number, isActive: boolean): void {
    const rule = this.scoringRules.get(action);
    if (rule) {
      this.scoringRules.set(action, { ...rule, points, isActive });
    }
  }

  addScoringRule(action: string, points: number): void {
    this.scoringRules.set(action, { action, points, isActive: true });
  }

  getScoringRules(): ScoringRule[] {
    return Array.from(this.scoringRules.values());
  }

  // Simulate tracking common website events
  trackEmailOpen(leadId: string, email: string, emailSubject?: string): void {
    this.trackEngagement({
      leadId,
      email,
      action: 'email_open',
      timestamp: new Date().toISOString(),
      metadata: { emailSubject }
    });
  }

  trackEmailClick(leadId: string, email: string, clickedLink?: string): void {
    this.trackEngagement({
      leadId,
      email,
      action: 'email_click',
      timestamp: new Date().toISOString(),
      metadata: { clickedLink }
    });
  }

  trackPageVisit(leadId: string, email: string, pageUrl?: string): void {
    this.trackEngagement({
      leadId,
      email,
      action: 'page_visit',
      timestamp: new Date().toISOString(),
      metadata: { pageUrl }
    });
  }

  trackQuoteRequest(leadId: string, email: string, serviceType?: string): void {
    this.trackEngagement({
      leadId,
      email,
      action: 'quote_request',
      timestamp: new Date().toISOString(),
      metadata: { serviceType }
    });
  }

  // Get analytics data
  getAnalytics() {
    const allLeads = this.getAllLeads();
    const totalLeads = allLeads.length;
    const qualifiedLeads = allLeads.filter(l => l.status === 'qualified').length;
    const hotLeads = allLeads.filter(l => l.status === 'hot').length;
    const warmLeads = allLeads.filter(l => l.status === 'warm').length;
    const coldLeads = allLeads.filter(l => l.status === 'cold').length;

    const avgScore = totalLeads > 0 
      ? Math.round(allLeads.reduce((sum, lead) => sum + lead.score, 0) / totalLeads)
      : 0;

    return {
      totalLeads,
      qualifiedLeads,
      hotLeads,
      warmLeads,
      coldLeads,
      avgScore,
      conversionRate: totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0
    };
  }
}

export const leadScoringService = new LeadScoringService();
export type { EngagementEvent, ScoringRule, LeadScore };