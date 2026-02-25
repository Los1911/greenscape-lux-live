import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  MapPin, Plus, Trash2, RefreshCw, AlertCircle, CheckCircle2, 
  Settings, Search, Filter, Download, Upload, Globe, Building2,
  Info, Loader2, X, Edit2, Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types following Platform Safety Framework - explicit, no assumptions
interface ServiceArea {
  id: string;
  area_type: 'zip' | 'city' | 'region';
  zip_code: string | null;
  city: string | null;
  state: string | null;
  region_name: string | null;
  is_active: boolean;
  priority: number;
  max_landscapers: number | null;
  current_landscaper_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ServiceAreaStats {
  total_areas: number;
  active_areas: number;
  zip_areas: number;
  city_areas: number;
  region_areas: number;
}

interface NewAreaForm {
  area_type: 'zip' | 'city' | 'region';
  zip_code: string;
  city: string;
  state: string;
  region_name: string;
  is_active: boolean;
  priority: number;
  max_landscapers: string;
  notes: string;
}

const INITIAL_FORM: NewAreaForm = {
  area_type: 'zip',
  zip_code: '',
  city: '',
  state: '',
  region_name: '',
  is_active: false,
  priority: 0,
  max_landscapers: '',
  notes: ''
};

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export function AdminServiceAreaManager() {
  // State - all with safe defaults
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [stats, setStats] = useState<ServiceAreaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newArea, setNewArea] = useState<NewAreaForm>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ServiceArea>>({});
  const { toast } = useToast();

  // Load data with defensive error handling
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Load service areas - explicit column selection per framework rules
      const { data: areasData, error: areasError } = await supabase
        .from('admin_service_areas')
        .select('id, area_type, zip_code, city, state, region_name, is_active, priority, max_landscapers, current_landscaper_count, notes, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (areasError) {
        console.error('[SERVICE_AREAS_ADMIN] Areas fetch error:', areasError);
        // Don't throw - handle gracefully
        setAreas([]);
      } else {
        setAreas(areasData || []);
      }

      // Load stats - with fallback
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_service_area_stats');

      if (statsError) {
        console.error('[SERVICE_AREAS_ADMIN] Stats fetch error:', statsError);
        // Set default stats
        setStats({
          total_areas: areasData?.length || 0,
          active_areas: areasData?.filter(a => a.is_active).length || 0,
          zip_areas: areasData?.filter(a => a.area_type === 'zip').length || 0,
          city_areas: areasData?.filter(a => a.area_type === 'city').length || 0,
          region_areas: areasData?.filter(a => a.area_type === 'region').length || 0
        });
      } else if (statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }

    } catch (err) {
      console.error('[SERVICE_AREAS_ADMIN] Load error:', err);
      setError('Failed to load service areas. The feature may not be fully configured yet.');
      setAreas([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Add new service area
  const handleAddArea = async () => {
    // Validation
    if (newArea.area_type === 'zip' && !newArea.zip_code.trim()) {
      toast({ title: 'ZIP code required', variant: 'destructive' });
      return;
    }
    if (newArea.area_type === 'city' && (!newArea.city.trim() || !newArea.state)) {
      toast({ title: 'City and state required', variant: 'destructive' });
      return;
    }
    if (newArea.area_type === 'region' && !newArea.region_name.trim()) {
      toast({ title: 'Region name required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const insertData: any = {
        area_type: newArea.area_type,
        is_active: newArea.is_active,
        priority: newArea.priority,
        notes: newArea.notes.trim() || null
      };

      // Set type-specific fields
      if (newArea.area_type === 'zip') {
        insertData.zip_code = newArea.zip_code.trim();
        insertData.city = newArea.city.trim() || null;
        insertData.state = newArea.state || null;
      } else if (newArea.area_type === 'city') {
        insertData.city = newArea.city.trim();
        insertData.state = newArea.state;
      } else if (newArea.area_type === 'region') {
        insertData.region_name = newArea.region_name.trim();
      }

      if (newArea.max_landscapers) {
        insertData.max_landscapers = parseInt(newArea.max_landscapers, 10);
      }

      const { error: insertError } = await supabase
        .from('admin_service_areas')
        .insert(insertData);

      if (insertError) throw insertError;

      toast({ 
        title: 'Service area added',
        description: `${newArea.area_type === 'zip' ? newArea.zip_code : newArea.city || newArea.region_name} has been added.`
      });

      setNewArea(INITIAL_FORM);
      setShowAddForm(false);
      loadData();

    } catch (err: any) {
      console.error('[SERVICE_AREAS_ADMIN] Add error:', err);
      toast({ 
        title: 'Failed to add service area', 
        description: err.message || 'Please try again.',
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  // Toggle area active status
  const handleToggleActive = async (area: ServiceArea) => {
    try {
      const { error } = await supabase
        .from('admin_service_areas')
        .update({ is_active: !area.is_active })
        .eq('id', area.id);

      if (error) throw error;

      toast({
        title: area.is_active ? 'Area deactivated' : 'Area activated',
        description: `Service area is now ${area.is_active ? 'inactive' : 'active'}.`
      });

      loadData();
    } catch (err: any) {
      console.error('[SERVICE_AREAS_ADMIN] Toggle error:', err);
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  // Delete area
  const handleDelete = async (area: ServiceArea) => {
    if (!confirm(`Delete service area ${area.zip_code || area.city || area.region_name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_service_areas')
        .delete()
        .eq('id', area.id);

      if (error) throw error;

      toast({ title: 'Service area deleted' });
      loadData();
    } catch (err: any) {
      console.error('[SERVICE_AREAS_ADMIN] Delete error:', err);
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  // Start editing
  const startEdit = (area: ServiceArea) => {
    setEditingId(area.id);
    setEditForm({
      is_active: area.is_active,
      priority: area.priority,
      max_landscapers: area.max_landscapers,
      notes: area.notes
    });
  };

  // Save edit
  const saveEdit = async (area: ServiceArea) => {
    try {
      const { error } = await supabase
        .from('admin_service_areas')
        .update({
          is_active: editForm.is_active,
          priority: editForm.priority,
          max_landscapers: editForm.max_landscapers,
          notes: editForm.notes
        })
        .eq('id', area.id);

      if (error) throw error;

      toast({ title: 'Service area updated' });
      setEditingId(null);
      setEditForm({});
      loadData();
    } catch (err: any) {
      console.error('[SERVICE_AREAS_ADMIN] Edit error:', err);
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Type', 'ZIP', 'City', 'State', 'Region', 'Active', 'Priority', 'Created'];
    const rows = areas.map(a => [
      a.area_type,
      a.zip_code || '',
      a.city || '',
      a.state || '',
      a.region_name || '',
      a.is_active ? 'Yes' : 'No',
      a.priority,
      new Date(a.created_at).toLocaleDateString()
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `service-areas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Filter areas
  const filteredAreas = areas.filter(area => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesZip = area.zip_code?.toLowerCase().includes(query);
      const matchesCity = area.city?.toLowerCase().includes(query);
      const matchesState = area.state?.toLowerCase().includes(query);
      const matchesRegion = area.region_name?.toLowerCase().includes(query);
      if (!matchesZip && !matchesCity && !matchesState && !matchesRegion) {
        return false;
      }
    }

    // Type filter
    if (filterType !== 'all' && area.area_type !== filterType) {
      return false;
    }

    // Active filter
    if (filterActive === 'active' && !area.is_active) return false;
    if (filterActive === 'inactive' && area.is_active) return false;

    return true;
  });

  // Get area display name
  const getAreaDisplayName = (area: ServiceArea): string => {
    if (area.area_type === 'zip') {
      return area.zip_code || 'Unknown ZIP';
    }
    if (area.area_type === 'city') {
      return `${area.city || 'Unknown'}, ${area.state || ''}`;
    }
    return area.region_name || 'Unknown Region';
  };

  // Render setup guidance when no areas configured
  const renderSetupGuidance = () => (
    <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
      <CardContent className="py-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto">
            <Settings className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Service Areas Not Configured</h3>
          <p className="text-gray-300 max-w-md mx-auto">
            Define where GreenScape Lux operates by adding service areas. 
            Until areas are configured and activated, clients will see an "expanding soon" message.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Service Area
            </Button>
          </div>
          <div className="mt-6 p-4 bg-black/30 rounded-lg text-left">
            <h4 className="font-semibold text-emerald-400 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Quick Start Guide
            </h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Add ZIP codes for precise coverage areas</li>
              <li>• Add cities for broader regional coverage</li>
              <li>• Areas are <strong>inactive by default</strong> - activate when ready</li>
              <li>• Clients in uncovered areas can join the expansion waitlist</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // Error state with retry
  if (error && areas.length === 0) {
    return (
      <Card className="bg-red-500/10 border-red-500/30">
        <CardContent className="py-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-300 mb-2">Unable to Load Service Areas</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button onClick={loadData} variant="outline" className="border-red-500/30 text-red-300">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-emerald-400" />
            Service Area Management
          </h2>
          <p className="text-gray-400 mt-1">Define and manage where GreenScape Lux operates</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" size="sm" className="border-emerald-500/30">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={exportToCSV} variant="outline" size="sm" className="border-emerald-500/30">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button 
            onClick={() => setShowAddForm(true)} 
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Area
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-black/40 border-emerald-500/20">
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-emerald-400">{stats.total_areas}</div>
              <div className="text-xs text-gray-400">Total Areas</div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-emerald-500/20">
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-green-400">{stats.active_areas}</div>
              <div className="text-xs text-gray-400">Active</div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-emerald-500/20">
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-blue-400">{stats.zip_areas}</div>
              <div className="text-xs text-gray-400">ZIP Codes</div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-emerald-500/20">
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-purple-400">{stats.city_areas}</div>
              <div className="text-xs text-gray-400">Cities</div>
            </CardContent>
          </Card>
          <Card className="bg-black/40 border-emerald-500/20">
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold text-orange-400">{stats.region_areas}</div>
              <div className="text-xs text-gray-400">Regions</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Setup Guidance (when no areas) */}
      {areas.length === 0 && !showAddForm && renderSetupGuidance()}

      {/* Add Area Form */}
      {showAddForm && (
        <Card className="bg-black/60 border-emerald-500/30">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                Add Service Area
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setShowAddForm(false); setNewArea(INITIAL_FORM); }}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Area Type Selection */}
            <div>
              <Label className="text-white mb-2 block">Area Type</Label>
              <div className="flex gap-2">
                {(['zip', 'city', 'region'] as const).map(type => (
                  <Button
                    key={type}
                    type="button"
                    variant={newArea.area_type === type ? 'default' : 'outline'}
                    className={newArea.area_type === type 
                      ? 'bg-emerald-600' 
                      : 'border-emerald-500/30 text-gray-300'}
                    onClick={() => setNewArea(prev => ({ ...prev, area_type: type }))}
                  >
                    {type === 'zip' && <MapPin className="w-4 h-4 mr-2" />}
                    {type === 'city' && <Building2 className="w-4 h-4 mr-2" />}
                    {type === 'region' && <Globe className="w-4 h-4 mr-2" />}
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Type-specific fields */}
            {newArea.area_type === 'zip' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-white">ZIP Code *</Label>
                  <Input
                    value={newArea.zip_code}
                    onChange={e => setNewArea(prev => ({ ...prev, zip_code: e.target.value }))}
                    placeholder="12345"
                    className="bg-black/40 border-emerald-500/30 text-white"
                    maxLength={10}
                  />
                </div>
                <div>
                  <Label className="text-white">City (optional)</Label>
                  <Input
                    value={newArea.city}
                    onChange={e => setNewArea(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City name"
                    className="bg-black/40 border-emerald-500/30 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">State (optional)</Label>
                  <Select 
                    value={newArea.state} 
                    onValueChange={val => setNewArea(prev => ({ ...prev, state: val }))}
                  >
                    <SelectTrigger className="bg-black/40 border-emerald-500/30 text-white">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map(st => (
                        <SelectItem key={st} value={st}>{st}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {newArea.area_type === 'city' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">City *</Label>
                  <Input
                    value={newArea.city}
                    onChange={e => setNewArea(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="City name"
                    className="bg-black/40 border-emerald-500/30 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">State *</Label>
                  <Select 
                    value={newArea.state} 
                    onValueChange={val => setNewArea(prev => ({ ...prev, state: val }))}
                  >
                    <SelectTrigger className="bg-black/40 border-emerald-500/30 text-white">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map(st => (
                        <SelectItem key={st} value={st}>{st}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {newArea.area_type === 'region' && (
              <div>
                <Label className="text-white">Region Name *</Label>
                <Input
                  value={newArea.region_name}
                  onChange={e => setNewArea(prev => ({ ...prev, region_name: e.target.value }))}
                  placeholder="e.g., Greater Boston Area"
                  className="bg-black/40 border-emerald-500/30 text-white"
                />
              </div>
            )}

            {/* Common fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-white">Priority</Label>
                <Input
                  type="number"
                  value={newArea.priority}
                  onChange={e => setNewArea(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                  className="bg-black/40 border-emerald-500/30 text-white"
                  min={0}
                />
              </div>
              <div>
                <Label className="text-white">Max Landscapers</Label>
                <Input
                  type="number"
                  value={newArea.max_landscapers}
                  onChange={e => setNewArea(prev => ({ ...prev, max_landscapers: e.target.value }))}
                  placeholder="Unlimited"
                  className="bg-black/40 border-emerald-500/30 text-white"
                  min={0}
                />
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={newArea.is_active}
                    onCheckedChange={checked => setNewArea(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label className="text-white">Active immediately</Label>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-white">Notes</Label>
              <Textarea
                value={newArea.notes}
                onChange={e => setNewArea(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes about this service area..."
                className="bg-black/40 border-emerald-500/30 text-white"
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleAddArea}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service Area
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowAddForm(false); setNewArea(INITIAL_FORM); }}
                className="border-gray-600"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      {areas.length > 0 && (
        <Card className="bg-black/40 border-emerald-500/20">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search ZIP, city, or region..."
                    className="pl-10 bg-black/40 border-emerald-500/30 text-white"
                  />
                </div>
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px] bg-black/40 border-emerald-500/30 text-white">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="zip">ZIP Codes</SelectItem>
                  <SelectItem value="city">Cities</SelectItem>
                  <SelectItem value="region">Regions</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterActive} onValueChange={setFilterActive}>
                <SelectTrigger className="w-[140px] bg-black/40 border-emerald-500/30 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Areas List */}
      {filteredAreas.length > 0 && (
        <div className="space-y-3">
          {filteredAreas.map(area => (
            <Card 
              key={area.id} 
              className={`bg-black/40 border transition-colors ${
                area.is_active ? 'border-emerald-500/30' : 'border-gray-700/50'
              }`}
            >
              <CardContent className="py-4">
                {editingId === area.id ? (
                  // Edit mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={editForm.is_active ?? area.is_active}
                          onCheckedChange={checked => setEditForm(prev => ({ ...prev, is_active: checked }))}
                        />
                        <Label className="text-white">Active</Label>
                      </div>
                      <div>
                        <Label className="text-white text-xs">Priority</Label>
                        <Input
                          type="number"
                          value={editForm.priority ?? area.priority}
                          onChange={e => setEditForm(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                          className="bg-black/40 border-emerald-500/30 text-white h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-white text-xs">Max Landscapers</Label>
                        <Input
                          type="number"
                          value={editForm.max_landscapers ?? area.max_landscapers ?? ''}
                          onChange={e => setEditForm(prev => ({ ...prev, max_landscapers: e.target.value ? parseInt(e.target.value) : null }))}
                          placeholder="Unlimited"
                          className="bg-black/40 border-emerald-500/30 text-white h-9"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <Button size="sm" onClick={() => saveEdit(area)} className="bg-emerald-600">
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditForm({}); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-white text-xs">Notes</Label>
                      <Textarea
                        value={editForm.notes ?? area.notes ?? ''}
                        onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="bg-black/40 border-emerald-500/30 text-white"
                        rows={2}
                      />
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        area.is_active ? 'bg-emerald-500/20' : 'bg-gray-700/50'
                      }`}>
                        {area.area_type === 'zip' && <MapPin className={`w-5 h-5 ${area.is_active ? 'text-emerald-400' : 'text-gray-500'}`} />}
                        {area.area_type === 'city' && <Building2 className={`w-5 h-5 ${area.is_active ? 'text-emerald-400' : 'text-gray-500'}`} />}
                        {area.area_type === 'region' && <Globe className={`w-5 h-5 ${area.is_active ? 'text-emerald-400' : 'text-gray-500'}`} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{getAreaDisplayName(area)}</span>
                          <Badge variant={area.is_active ? 'default' : 'secondary'} className={
                            area.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-700 text-gray-400'
                          }>
                            {area.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                            {area.area_type}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Priority: {area.priority} • 
                          {area.max_landscapers ? ` Max: ${area.max_landscapers}` : ' Unlimited'} • 
                          Added {new Date(area.created_at).toLocaleDateString()}
                        </div>
                        {area.notes && (
                          <div className="text-xs text-gray-400 mt-1 italic">{area.notes}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={area.is_active}
                        onCheckedChange={() => handleToggleActive(area)}
                      />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => startEdit(area)}
                        className="text-gray-400 hover:text-white"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(area)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty filtered state */}
      {areas.length > 0 && filteredAreas.length === 0 && (
        <Card className="bg-black/40 border-gray-700/50">
          <CardContent className="py-8 text-center">
            <Filter className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No service areas match your filters</p>
            <Button 
              variant="link" 
              onClick={() => { setSearchQuery(''); setFilterType('all'); setFilterActive('all'); }}
              className="text-emerald-400 mt-2"
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AdminServiceAreaManager;
