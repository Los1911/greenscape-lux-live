import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PricingEngine } from '@/components/business/PricingEngine';
import { ReferralProgram } from '@/components/business/ReferralProgram';
import { SubscriptionManager } from '@/components/business/SubscriptionManager';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Settings, Zap, Users, Crown, TrendingUp } from 'lucide-react';

export const BusinessAutomation: React.FC = () => {
  const [assignmentStats, setAssignmentStats] = useState({
    totalAssignments: 0,
    autoAssignments: 0,
    avgResponseTime: '2.3 hours'
  });

  const triggerAutoAssignment = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('auto-job-assignment', {
        body: { jobId: 'test-job-id' }
      });

      if (error) throw error;
      
      alert(`Auto-assignment completed! ${data.assignmentsCreated} landscapers notified.`);
    } catch (error) {
      console.error('Auto-assignment failed:', error);
      alert('Auto-assignment failed. Please try again.');
    }
  };

  const sendMarketingCampaign = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('marketing-automation', {
        body: {
          campaignType: 'email',
          targetAudience: { userType: 'customer' },
          content: {
            name: 'Spring Promotion',
            subject: 'Spring Landscaping Special - 20% Off!',
            html: '<h1>Spring is here!</h1><p>Get 20% off your next landscaping service.</p>'
          }
        }
      });

      if (error) throw error;
      
      alert(`Campaign sent to ${data.sentCount} users!`);
    } catch (error) {
      console.error('Campaign failed:', error);
      alert('Campaign failed. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center space-x-2">
          <Settings className="h-8 w-8" />
          <span>Business Automation</span>
        </h1>
        <p className="text-gray-600 mt-2">
          Manage automated systems, pricing, referrals, and subscriptions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-lg font-bold">{assignmentStats.totalAssignments}</p>
                <p className="text-xs text-gray-600">Auto Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-lg font-bold">94%</p>
                <p className="text-xs text-gray-600">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-purple-600" />
              <div>
                <p className="text-lg font-bold">156</p>
                <p className="text-xs text-gray-600">Referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Crown className="h-6 w-6 text-yellow-600" />
              <div>
                <p className="text-lg font-bold">89</p>
                <p className="text-xs text-gray-600">Subscribers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assignments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="assignments">Auto Assignment</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Engine</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>Automated Job Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800">How it works:</h3>
                <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
                  <li>Jobs are automatically scored based on landscaper ratings, distance, and availability</li>
                  <li>Top 3 best-matched landscapers receive instant notifications</li>
                  <li>First to accept gets the job, others are notified</li>
                  <li>Average response time: {assignmentStats.avgResponseTime}</li>
                </ul>
              </div>
              <Button onClick={triggerAutoAssignment} className="w-full">
                Test Auto Assignment
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <PricingEngine />
        </TabsContent>

        <TabsContent value="referrals">
          <ReferralProgram />
        </TabsContent>

        <TabsContent value="subscriptions">
          <SubscriptionManager />
        </TabsContent>

        <TabsContent value="marketing">
          <Card>
            <CardHeader>
              <CardTitle>Marketing Automation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800">Campaign Features:</h3>
                <ul className="list-disc list-inside text-sm text-green-700 mt-2 space-y-1">
                  <li>Targeted email campaigns to customers and landscapers</li>
                  <li>Automated seasonal promotions</li>
                  <li>Push notifications for mobile users</li>
                  <li>Performance tracking and analytics</li>
                </ul>
              </div>
              <Button onClick={sendMarketingCampaign} className="w-full">
                Send Test Campaign
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessAutomation;