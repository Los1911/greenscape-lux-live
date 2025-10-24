import { useState, useEffect } from 'react';

interface ScoringRule {
  id: string;
  name: string;
  category: 'email' | 'website' | 'quote' | 'profile';
  action: string;
  points: number;
  isActive: boolean;
}

interface LeadScore {
  leadId: string;
  email: string;
  score: number;
  status: 'cold' | 'warm' | 'hot' | 'qualified';
  lastUpdated: string;
}

interface EngagementEvent {
  leadId: string;
  action: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export const useLeadScoring = () => {
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([
    { id: '1', name: 'Email Open', category: 'email', action: 'email_open', points: 5, isActive: true },
    { id: '2', name: 'Email Click', category: 'email', action: 'email_click', points: 10, isActive: true },
    { id: '3', name: 'Quote Request', category: 'quote', action: 'quote_request', points: 50, isActive: true },
    { id: '4', name: 'Website Visit', category: 'website', action: 'page_visit', points: 2, isActive: true },
    { id: '5', name: 'Profile Complete', category: 'profile', action: 'profile_complete', points: 25, isActive: true },
  ]);

  const [leadScores, setLeadScores] = useState<Map<string, LeadScore>>(new Map());

  const calculateScore = (events: EngagementEvent[]): number => {
    return events.reduce((total, event) => {
      const rule = scoringRules.find(r => r.action === event.action && r.isActive);
      return total + (rule ? rule.points : 0);
    }, 0);
  };

  const getLeadStatus = (score: number): 'cold' | 'warm' | 'hot' | 'qualified' => {
    if (score >= 80) return 'qualified';
    if (score >= 60) return 'hot';
    if (score >= 30) return 'warm';
    return 'cold';
  };

  const trackEngagement = (event: EngagementEvent) => {
    const currentScore = leadScores.get(event.leadId);
    const rule = scoringRules.find(r => r.action === event.action && r.isActive);
    
    if (rule) {
      const newScore = (currentScore?.score || 0) + rule.points;
      const updatedLeadScore: LeadScore = {
        leadId: event.leadId,
        email: event.metadata?.email || '',
        score: newScore,
        status: getLeadStatus(newScore),
        lastUpdated: new Date().toISOString()
      };

      setLeadScores(prev => new Map(prev.set(event.leadId, updatedLeadScore)));
    }
  };

  const addScoringRule = (rule: Omit<ScoringRule, 'id'>) => {
    const newRule: ScoringRule = {
      ...rule,
      id: Date.now().toString()
    };
    setScoringRules(prev => [...prev, newRule]);
  };

  const updateScoringRule = (id: string, updates: Partial<ScoringRule>) => {
    setScoringRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, ...updates } : rule
    ));
  };

  const deleteScoringRule = (id: string) => {
    setScoringRules(prev => prev.filter(rule => rule.id !== id));
  };

  const getLeadScore = (leadId: string): LeadScore | undefined => {
    return leadScores.get(leadId);
  };

  const getQualifiedLeads = (): LeadScore[] => {
    return Array.from(leadScores.values()).filter(lead => lead.status === 'qualified');
  };

  const getHotLeads = (): LeadScore[] => {
    return Array.from(leadScores.values()).filter(lead => lead.status === 'hot');
  };

  const getAllLeads = (): LeadScore[] => {
    return Array.from(leadScores.values()).sort((a, b) => b.score - a.score);
  };

  return {
    scoringRules,
    leadScores: Array.from(leadScores.values()),
    trackEngagement,
    addScoringRule,
    updateScoringRule,
    deleteScoringRule,
    getLeadScore,
    getQualifiedLeads,
    getHotLeads,
    getAllLeads,
    calculateScore,
    getLeadStatus
  };
};