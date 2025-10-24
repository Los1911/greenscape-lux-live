import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  MessageSquare,
  Mail,
  Smartphone,
  Download
} from 'lucide-react'

interface NotificationRecord {
  id: string
  channel: 'slack' | 'email' | 'sms'
  type: string
  recipient: string
  status: 'delivered' | 'failed' | 'pending'
  timestamp: Date
  deliveryTime: number
  errorMessage?: string
}

export function NotificationHistory() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterChannel, setFilterChannel] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const mockNotifications: NotificationRecord[] = [
    {
      id: '1',
      channel: 'slack',
      type: 'deployment_success',
      recipient: '#deployments',
      status: 'delivered',
      timestamp: new Date(Date.now() - 300000),
      deliveryTime: 1.2
    },
    {
      id: '2',
      channel: 'email',
      type: 'validation_failed',
      recipient: 'dev-team@company.com',
      status: 'delivered',
      timestamp: new Date(Date.now() - 900000),
      deliveryTime: 2.8
    },
    {
      id: '3',
      channel: 'sms',
      type: 'critical_alert',
      recipient: '+1234567890',
      status: 'failed',
      timestamp: new Date(Date.now() - 1800000),
      deliveryTime: 0,
      errorMessage: 'Network timeout after 30s'
    }
  ]

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'slack':
        return <MessageSquare className="h-4 w-4" />
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <Smartphone className="h-4 w-4" />
      default:
        return null
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredNotifications = mockNotifications.filter(notification => {
    const matchesSearch = notification.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.recipient.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesChannel = filterChannel === 'all' || notification.channel === filterChannel
    const matchesStatus = filterStatus === 'all' || notification.status === filterStatus
    
    return matchesSearch && matchesChannel && matchesStatus
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification History</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterChannel} onValueChange={setFilterChannel}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="slack">Slack</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {getChannelIcon(notification.channel)}
                  <span className="font-medium capitalize">{notification.channel}</span>
                </div>
                <div>
                  <div className="font-medium">{notification.type.replace('_', ' ')}</div>
                  <div className="text-sm text-gray-600">{notification.recipient}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm">{notification.timestamp.toLocaleTimeString()}</div>
                  {notification.status === 'delivered' && (
                    <div className="text-xs text-gray-500">{notification.deliveryTime}s</div>
                  )}
                  {notification.errorMessage && (
                    <div className="text-xs text-red-600 max-w-40 truncate" title={notification.errorMessage}>
                      {notification.errorMessage}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(notification.status)}
                  <Badge className={getStatusColor(notification.status)}>
                    {notification.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}