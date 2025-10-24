import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, BarChart3, PieChart, TrendingUp, Users } from 'lucide-react';

interface Widget {
  id: string;
  name: string;
  type: 'line' | 'bar' | 'pie' | 'metric';
  dataSource: string;
  filters: { [key: string]: any };
  position: { x: number; y: number; w: number; h: number };
  config: { [key: string]: any };
}

export function CustomWidgetBuilder() {
  const [widgets, setWidgets] = useState<Widget[]>([
    {
      id: '1',
      name: 'Revenue Trend',
      type: 'line',
      dataSource: 'payments',
      filters: { period: '30d' },
      position: { x: 0, y: 0, w: 6, h: 4 },
      config: { color: '#3b82f6' }
    },
    {
      id: '2',
      name: 'Top Customers',
      type: 'bar',
      dataSource: 'customers',
      filters: { limit: 10 },
      position: { x: 6, y: 0, w: 6, h: 4 },
      config: { color: '#10b981' }
    }
  ]);

  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newWidget, setNewWidget] = useState<Partial<Widget>>({
    name: '',
    type: 'metric',
    dataSource: 'payments',
    filters: {},
    config: {}
  });

  const dataSources = [
    { value: 'payments', label: 'Payments' },
    { value: 'customers', label: 'Customers' },
    { value: 'subscriptions', label: 'Subscriptions' },
    { value: 'jobs', label: 'Jobs' },
    { value: 'landscapers', label: 'Landscapers' }
  ];

  const widgetTypes = [
    { value: 'metric', label: 'Metric Card', icon: BarChart3 },
    { value: 'line', label: 'Line Chart', icon: TrendingUp },
    { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { value: 'pie', label: 'Pie Chart', icon: PieChart }
  ];

  const createWidget = () => {
    if (!newWidget.name || !newWidget.type || !newWidget.dataSource) return;

    const widget: Widget = {
      id: Date.now().toString(),
      name: newWidget.name,
      type: newWidget.type as Widget['type'],
      dataSource: newWidget.dataSource,
      filters: newWidget.filters || {},
      position: { x: 0, y: 0, w: 6, h: 4 },
      config: newWidget.config || {}
    };

    setWidgets([...widgets, widget]);
    setNewWidget({ name: '', type: 'metric', dataSource: 'payments', filters: {}, config: {} });
    setIsCreating(false);
  };

  const deleteWidget = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
    if (selectedWidget === id) setSelectedWidget(null);
  };

  const WidgetPreview = ({ widget }: { widget: Widget }) => {
    const IconComponent = widgetTypes.find(t => t.value === widget.type)?.icon || BarChart3;
    
    return (
      <Card className="h-32">
        <CardContent className="p-4 h-full flex items-center justify-center">
          <div className="text-center">
            <IconComponent className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium">{widget.name}</p>
            <p className="text-xs text-gray-500">{widget.type} chart</p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Custom Dashboard Widgets</CardTitle>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Widget
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="builder">
        <TabsList>
          <TabsTrigger value="builder">Widget Builder</TabsTrigger>
          <TabsTrigger value="preview">Dashboard Preview</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          {/* Create Widget Form */}
          {isCreating && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Widget</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Widget Name</label>
                    <Input
                      value={newWidget.name || ''}
                      onChange={(e) => setNewWidget({ ...newWidget, name: e.target.value })}
                      placeholder="Enter widget name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Widget Type</label>
                    <Select
                      value={newWidget.type}
                      onValueChange={(value) => setNewWidget({ ...newWidget, type: value as Widget['type'] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {widgetTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Data Source</label>
                    <Select
                      value={newWidget.dataSource}
                      onValueChange={(value) => setNewWidget({ ...newWidget, dataSource: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dataSources.map((source) => (
                          <SelectItem key={source.value} value={source.value}>
                            {source.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Time Period</label>
                    <Select
                      value={newWidget.filters?.period || '30d'}
                      onValueChange={(value) => setNewWidget({ 
                        ...newWidget, 
                        filters: { ...newWidget.filters, period: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                        <SelectItem value="1y">Last year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button onClick={createWidget}>Create Widget</Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Existing Widgets */}
          <Card>
            <CardHeader>
              <CardTitle>Your Widgets ({widgets.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {widgets.map((widget) => (
                  <div key={widget.id} className="relative group">
                    <WidgetPreview widget={widget} />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedWidget(widget.id)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteWidget(widget.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="font-medium">{widget.name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{widget.type}</Badge>
                        <Badge variant="outline">{widget.dataSource}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Preview</CardTitle>
              <p className="text-sm text-gray-600">
                Preview how your widgets will appear on the dashboard
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {widgets.map((widget) => (
                  <WidgetPreview key={widget.id} widget={widget} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Widget Templates</CardTitle>
              <p className="text-sm text-gray-600">
                Pre-built widget templates for common use cases
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">Revenue Dashboard</h3>
                      <p className="text-sm text-gray-600">Complete revenue analytics setup</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <Users className="w-8 h-8 text-green-600" />
                    <div>
                      <h3 className="font-semibold">Customer Insights</h3>
                      <p className="text-sm text-gray-600">Customer behavior and metrics</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-8 h-8 text-purple-600" />
                    <div>
                      <h3 className="font-semibold">Operations Overview</h3>
                      <p className="text-sm text-gray-600">Job and service tracking</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <PieChart className="w-8 h-8 text-orange-600" />
                    <div>
                      <h3 className="font-semibold">Performance Metrics</h3>
                      <p className="text-sm text-gray-600">KPI and performance tracking</p>
                    </div>
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}