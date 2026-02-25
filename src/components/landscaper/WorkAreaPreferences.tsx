/**
 * Work Area Preferences Component
 * 
 * Allows landscapers to manage:
 * - Requested work areas (ZIP codes where they want to receive jobs)
 * - Excluded areas (ZIP codes they do NOT want to work in)
 */

import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@/lib/ConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MapPin, 
  Plus, 
  X, 
  Clock, 
  Ban, 
  Target,
  AlertCircle,
  RefreshCw,
  Info,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  WorkArea,
  ExcludedArea,
  loadWorkAreaPreferences,
  addRequestedWorkArea,
  removeRequestedWorkArea,
  addExcludedArea,
  removeExcludedArea,
  cleanupExpiredWorkAreas
} from '@/lib/workAreaPreferences';

interface WorkAreaPreferencesProps {
  landscaperId: string;
}

export function WorkAreaPreferences({ landscaperId }: WorkAreaPreferencesProps) {
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requestedAreas, setRequestedAreas] = useState<WorkArea[]>([]);
  const [excludedAreas, setExcludedAreas] = useState<ExcludedArea[]>([]);
  
  // Form states
  const [newZip, setNewZip] = useState('');
  const [newRadius, setNewRadius] = useState(10);
  const [isTemporary, setIsTemporary] = useState(false);
  const [excludeZip, setExcludeZip] = useState('');
  const [excludeReason, setExcludeReason] = useState('');

  // Load preferences
  useEffect(() => {
    if (!landscaperId) return;
    
    const loadPreferences = async () => {
      setLoading(true);
      try {
        // Clean up expired areas first
        await cleanupExpiredWorkAreas(landscaperId);
        
        const prefs = await loadWorkAreaPreferences(landscaperId);
        setRequestedAreas(prefs.requestedAreas);
        setExcludedAreas(prefs.excludedAreas);
      } catch (error) {
        console.error('[WorkAreaPreferences] Error loading:', error);
        toast({
          title: 'Error',
          description: 'Failed to load work area preferences',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [landscaperId, toast]);

  // Add requested work area
  const handleAddWorkArea = async () => {
    if (!newZip.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a ZIP code',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      // Calculate expiration for temporary areas (end of today)
      let expiresAt = null;
      if (isTemporary) {
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        expiresAt = endOfDay.toISOString();
      }

      const result = await addRequestedWorkArea(
        landscaperId,
        newZip.trim(),
        newRadius,
        isTemporary,
        expiresAt
      );

      if (result.success && result.data) {
        setRequestedAreas(prev => [result.data!, ...prev.filter(a => a.zip_code !== newZip.trim())]);
        setNewZip('');
        setNewRadius(10);
        setIsTemporary(false);
        toast({
          title: 'Work Area Added',
          description: `ZIP ${newZip} added to your work areas`
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to add work area',
          variant: 'destructive'
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // Remove requested work area
  const handleRemoveWorkArea = async (area: WorkArea) => {
    setSaving(true);
    try {
      const result = await removeRequestedWorkArea(landscaperId, area.id);
      
      if (result.success) {
        setRequestedAreas(prev => prev.filter(a => a.id !== area.id));
        toast({
          title: 'Work Area Removed',
          description: `ZIP ${area.zip_code} removed from your work areas`
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to remove work area',
          variant: 'destructive'
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // Add excluded area
  const handleAddExcludedArea = async () => {
    if (!excludeZip.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a ZIP code to exclude',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const result = await addExcludedArea(
        landscaperId,
        excludeZip.trim(),
        excludeReason.trim()
      );

      if (result.success && result.data) {
        setExcludedAreas(prev => [result.data!, ...prev.filter(a => a.zip_code !== excludeZip.trim())]);
        setExcludeZip('');
        setExcludeReason('');
        toast({
          title: 'Area Excluded',
          description: `ZIP ${excludeZip} added to your excluded areas`
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to exclude area',
          variant: 'destructive'
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // Remove excluded area
  const handleRemoveExcludedArea = async (area: ExcludedArea) => {
    setSaving(true);
    try {
      const result = await removeExcludedArea(landscaperId, area.id);
      
      if (result.success) {
        setExcludedAreas(prev => prev.filter(a => a.id !== area.id));
        toast({
          title: 'Exclusion Removed',
          description: `ZIP ${area.zip_code} removed from excluded areas`
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to remove exclusion',
          variant: 'destructive'
        });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-500/20 rounded-lg">
          <MapPin className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-emerald-300">Work Area Preferences</h3>
          <p className="text-sm text-emerald-300/60">Control where you receive job notifications</p>
        </div>
      </div>

      {/* Requested Work Areas Section */}
      <div className="bg-black/40 border border-emerald-500/25 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-400" />
          <h4 className="font-medium text-emerald-200">Requested Work Areas</h4>
        </div>
        
        <p className="text-sm text-emerald-300/60">
          Add ZIP codes where you want to receive jobs. Jobs outside these areas won't appear in your available jobs list.
        </p>

        {/* Add Work Area Form */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={newZip}
              onChange={(e) => setNewZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="Enter ZIP code"
              maxLength={5}
              className="w-full px-4 py-2 bg-black/60 border border-emerald-500/30 rounded-lg text-emerald-100 placeholder-emerald-300/40 focus:outline-none focus:border-emerald-500/60"
            />
          </div>
          <div className="w-full sm:w-32">
            <select
              value={newRadius}
              onChange={(e) => setNewRadius(Number(e.target.value))}
              className="w-full px-3 py-2 bg-black/60 border border-emerald-500/30 rounded-lg text-emerald-100 focus:outline-none focus:border-emerald-500/60"
            >
              <option value={5}>5 miles</option>
              <option value={10}>10 miles</option>
              <option value={15}>15 miles</option>
              <option value={25}>25 miles</option>
              <option value={50}>50 miles</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-emerald-300/70 whitespace-nowrap">
            <input
              type="checkbox"
              checked={isTemporary}
              onChange={(e) => setIsTemporary(e.target.checked)}
              className="rounded border-emerald-500/30 bg-black/60 text-emerald-500 focus:ring-emerald-500/50"
            />
            <Clock className="w-4 h-4" />
            Today only
          </label>
          <button
            onClick={handleAddWorkArea}
            disabled={saving || !newZip.trim()}
            className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 rounded-lg text-emerald-200 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Work Areas List */}
        {requestedAreas.length === 0 ? (
          <div className="flex items-center gap-2 py-4 text-emerald-300/50">
            <Info className="w-4 h-4" />
            <span className="text-sm">No work areas set. You'll see all available jobs.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {requestedAreas.map((area) => (
              <div
                key={area.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  area.auto_added 
                    ? 'bg-blue-500/10 border-blue-500/30' 
                    : area.is_temporary 
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-emerald-500/10 border-emerald-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MapPin className={`w-4 h-4 ${
                    area.auto_added ? 'text-blue-400' : area.is_temporary ? 'text-amber-400' : 'text-emerald-400'
                  }`} />
                  <div>
                    <span className="font-medium text-emerald-100">{area.zip_code}</span>
                    <span className="text-emerald-300/60 ml-2">({area.radius_miles} mi radius)</span>
                  </div>
                  {area.auto_added && (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                      Auto-added
                    </span>
                  )}
                  {area.is_temporary && !area.auto_added && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Temporary
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveWorkArea(area)}
                  disabled={saving}
                  className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 transition-all disabled:opacity-50"
                  title="Remove work area"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Excluded Areas Section */}
      <div className="bg-black/40 border border-red-500/25 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Ban className="w-5 h-5 text-red-400" />
          <h4 className="font-medium text-red-200">Excluded Areas</h4>
        </div>
        
        <p className="text-sm text-red-300/60">
          Add ZIP codes you do NOT want to work in. Jobs in these areas will never appear in your available jobs list.
        </p>

        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-300/80">
            Excluding areas helps prevent inefficient travel and ensures you only see jobs in areas you're willing to service.
          </p>
        </div>

        {/* Add Excluded Area Form */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={excludeZip}
              onChange={(e) => setExcludeZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="ZIP code to exclude"
              maxLength={5}
              className="w-full px-4 py-2 bg-black/60 border border-red-500/30 rounded-lg text-red-100 placeholder-red-300/40 focus:outline-none focus:border-red-500/60"
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={excludeReason}
              onChange={(e) => setExcludeReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full px-4 py-2 bg-black/60 border border-red-500/30 rounded-lg text-red-100 placeholder-red-300/40 focus:outline-none focus:border-red-500/60"
            />
          </div>
          <button
            onClick={handleAddExcludedArea}
            disabled={saving || !excludeZip.trim()}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-200 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Ban className="w-4 h-4" />
            Exclude
          </button>
        </div>

        {/* Excluded Areas List */}
        {excludedAreas.length === 0 ? (
          <div className="flex items-center gap-2 py-4 text-red-300/50">
            <Info className="w-4 h-4" />
            <span className="text-sm">No excluded areas. All jobs in your work areas will be visible.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {excludedAreas.map((area) => (
              <div
                key={area.id}
                className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Ban className="w-4 h-4 text-red-400" />
                  <div>
                    <span className="font-medium text-red-100">{area.zip_code}</span>
                    {area.reason && (
                      <span className="text-red-300/60 ml-2 text-sm">- {area.reason}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveExcludedArea(area)}
                  disabled={saving}
                  className="p-1.5 hover:bg-red-500/30 rounded-lg text-red-400 transition-all disabled:opacity-50"
                  title="Remove exclusion"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="flex items-start gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
        <Info className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-emerald-300/70 space-y-2">
          <p>
            <strong className="text-emerald-200">Automatic batching:</strong> When you accept a job, that job's ZIP code is automatically added as a temporary work area for the day. This helps you see nearby jobs for efficient routing.
          </p>
          <p>
            <strong className="text-emerald-200">Multi-day jobs:</strong> For jobs spanning multiple days, consider adding the ZIP as an ongoing work area rather than temporary.
          </p>
        </div>
      </div>
    </div>
  );
}

export default WorkAreaPreferences;
