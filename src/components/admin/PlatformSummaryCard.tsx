import React from 'react';
import { Activity, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PlatformData {
  totalClients: number;
  totalLandscapers: number;
  totalJobs: number;
  totalRevenue: number;
  totalPayouts: number;
  activeJobs: number;
}

interface Props {
  data: PlatformData;
}

export default function PlatformSummaryCard({ data }: Props) {
  return (
    <Card className="bg-black/60 backdrop-blur border border-green-500/25 rounded-2xl ring-1 ring-green-500/20 shadow-[0_0_25px_-10px_rgba(34,197,94,0.25)] hover:shadow-[0_0_35px_-5px_rgba(34,197,94,0.35)] transition-all duration-300">
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-green-400" />
          <h2 className="text-lg font-semibold text-green-300">Platform Summary</h2>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Total Clients:</span>
            <span className="text-green-300 font-semibold animate-pulse">{data.totalClients}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Landscapers:</span>
            <span className="text-green-300 font-semibold animate-pulse">{data.totalLandscapers}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Jobs:</span>
            <span className="text-green-300 font-semibold animate-pulse">{data.totalJobs}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Active Jobs:</span>
            <span className="text-yellow-300 font-semibold animate-pulse">{data.activeJobs}</span>
          </div>
          <div className="border-t border-gray-700 pt-3">
            <div className="text-2xl font-bold text-green-400 animate-pulse">${data.totalRevenue.toFixed(2)}</div>
            <div className="text-xs text-gray-500">Total Revenue (MTD)</div>
          </div>
          <div className="text-lg font-semibold text-blue-300">${data.totalPayouts.toFixed(2)}</div>
          <div className="text-xs text-gray-500">Total Payouts</div>
          <Button className="w-full rounded-full bg-green-600/20 hover:bg-green-600/30 border border-green-500/40 text-green-300 text-sm hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            <FileText className="w-4 h-4 mr-2" />
            View Platform Report
          </Button>
        </div>
      </div>
    </Card>
  );
}