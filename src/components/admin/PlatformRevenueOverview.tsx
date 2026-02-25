import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, DollarSign, Percent, Target } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface PlatformMetrics {
  grossRevenue: number
  platformCommission: number
  platformNet: number
  stripeFees: number
  landscaperPayout: number
  jobCount: number
  avgJobValue: number
}

export function PlatformRevenueOverview() {
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    grossRevenue: 0,
    platformCommission: 0,
    platformNet: 0,
    stripeFees: 0,
    landscaperPayout: 0,
    jobCount: 0,
    avgJobValue: 0
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      const { data: jobs, error } = await supabase
        .from('jobs')
        .select(`
          price,
          payout_amount,
          status,
          payment_status
        `)
        .eq('status', 'completed')
        .eq('payment_status', 'paid')

      if (error) throw error
      if (!jobs || jobs.length === 0) {
        setLoading(false)
        return
      }

      const calculated = jobs.reduce(
        (acc, job) => {
          const price = job.price || 0
          const payout = job.payout_amount || 0
          const commission = price - payout
          const stripeFee = price * 0.029 + 0.30
          const net = commission - stripeFee

          return {
            grossRevenue: acc.grossRevenue + price,
            platformCommission: acc.platformCommission + commission,
            platformNet: acc.platformNet + Math.max(0, net),
            stripeFees: acc.stripeFees + stripeFee,
            landscaperPayout: acc.landscaperPayout + payout,
            jobCount: acc.jobCount + 1
          }
        },
        {
          grossRevenue: 0,
          platformCommission: 0,
          platformNet: 0,
          stripeFees: 0,
          landscaperPayout: 0,
          jobCount: 0
        }
      )

      setMetrics({
        ...calculated,
        avgJobValue:
          calculated.jobCount > 0
            ? calculated.grossRevenue / calculated.jobCount
            : 0
      })
    } catch (err) {
      console.error('Revenue error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">Loading revenue metrics...</CardContent>
      </Card>
    )
  }

  const commissionRate =
    metrics.grossRevenue > 0
      ? (metrics.platformCommission / metrics.grossRevenue) * 100
      : 0

  return (
    <div className="space-y-6">

      {/* Row 1 – Core Money Flow */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-emerald-800">
              Gross Revenue
            </p>
            <p className="text-2xl font-bold text-emerald-900">
              ${metrics.grossRevenue.toFixed(2)}
            </p>
            <p className="text-xs mt-1">Completed + Paid Only</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-green-800">
              Platform Net
            </p>
            <p className="text-2xl font-bold text-green-900">
              ${metrics.platformNet.toFixed(2)}
            </p>
            <p className="text-xs mt-1">After Stripe</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-blue-800">
              Landscaper Payout
            </p>
            <p className="text-2xl font-bold text-blue-900">
              ${metrics.landscaperPayout.toFixed(2)}
            </p>
            <p className="text-xs mt-1">Contractor Earnings</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-red-800">
              Stripe Fees
            </p>
            <p className="text-2xl font-bold text-red-900">
              ${metrics.stripeFees.toFixed(2)}
            </p>
            <p className="text-xs mt-1">Processing Cost</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2 – Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium">Commission Rate</p>
            <p className="text-2xl font-bold">
              {commissionRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium">Total Paid Jobs</p>
            <p className="text-2xl font-bold">
              {metrics.jobCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium">Average Job Value</p>
            <p className="text-2xl font-bold">
              ${metrics.avgJobValue.toFixed(2)}
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}