import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users, DollarSign, Briefcase, TrendingUp } from "lucide-react"

interface AdminData {
  totalPlatformJobs: number
  totalPlatformRevenue: number
  totalContractorPayouts: number
  activeContractors: number
}

interface AdminInsightsProps {
  data: AdminData
  loading: boolean
  isAdmin: boolean
}

export default function AdminInsights({ data, loading, isAdmin }: AdminInsightsProps) {
  if (!isAdmin) {
    return null
  }

  if (loading) {
    return (
      <Card className="bg-black border-green-500 shadow-lg shadow-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Admin Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-700 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const platformFeeRate = ((data.totalPlatformRevenue - data.totalContractorPayouts) / data.totalPlatformRevenue * 100) || 0

  return (
    <Card className="bg-black border-green-500 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-green-400 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Admin Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">Total Jobs</span>
            </div>
            <p className="text-2xl font-bold text-white">{data.totalPlatformJobs.toLocaleString()}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">Active Contractors</span>
            </div>
            <p className="text-2xl font-bold text-white">{data.activeContractors}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Platform Revenue:</span>
            <span className="text-green-400 font-semibold">${data.totalPlatformRevenue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Contractor Payouts:</span>
            <span className="text-white font-semibold">${data.totalContractorPayouts.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Platform Fee Rate:</span>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-semibold">{platformFeeRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Platform Profit:</span>
            <span className="text-green-400 font-bold text-lg">
              ${(data.totalPlatformRevenue - data.totalContractorPayouts).toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
