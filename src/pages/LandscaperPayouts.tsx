import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PayoutDashboard from '@/components/landscaper/PayoutDashboard';
import PayoutScheduleManager from '@/components/landscaper/PayoutScheduleManager';
import { DollarSign, Settings } from 'lucide-react';

export default function LandscaperPayouts() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Payouts</h1>
        <p className="text-muted-foreground">
          Manage your earnings and payout schedule
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">
            <DollarSign className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <PayoutDashboard />
        </TabsContent>

        <TabsContent value="settings">
          <PayoutScheduleManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}