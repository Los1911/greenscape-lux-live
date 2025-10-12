import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TrendingUp, Calendar } from "lucide-react"
import { DayPoint } from "@/professionals/types-and-actions"

interface EarningsGraphProps {
  data: DayPoint[]
  loading: boolean
}

export default function EarningsGraph({ data, loading }: EarningsGraphProps) {
  const [filter, setFilter] = useState<'day' | 'week' | 'month' | 'year'>('week')

  const formatData = (data: DayPoint[]) => {
    return data.map(point => ({
      ...point,
      formattedDate: new Date(point.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }))
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black border border-green-500 rounded-lg p-3 shadow-lg">
          <p className="text-green-400 font-semibold">{label}</p>
          <p className="text-white">
            Earnings: <span className="text-green-400 font-bold">${payload[0].value}</span>
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <Card className="bg-black border-green-500 shadow-lg shadow-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-400 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Earnings Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-64 bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = formatData(data)
  const totalEarnings = data.reduce((sum, point) => sum + point.amount, 0)
  const avgDaily = data.length > 0 ? totalEarnings / data.length : 0

  return (
    <Card className="bg-black border-green-500 shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-green-400 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Earnings Trend
        </CardTitle>
        <div className="flex gap-1">
          {(['day', 'week', 'month', 'year'] as const).map((period) => (
            <Button
              key={period}
              onClick={() => setFilter(period)}
              size="sm"
              variant={filter === period ? "default" : "outline"}
              className={`text-xs ${
                filter === period
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "border-gray-600 text-gray-300 hover:bg-gray-800"
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Total Period</p>
            <p className="text-xl font-bold text-green-400">${totalEarnings.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-400">Daily Average</p>
            <p className="text-xl font-bold text-white">${avgDaily.toFixed(0)}</p>
          </div>
        </div>

        <div className="h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="formattedDate"
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#10B981", strokeWidth: 2, fill: "#000" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No earnings data available</p>
                <p className="text-sm text-gray-500 mt-1">Complete jobs to see your earnings trend</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}