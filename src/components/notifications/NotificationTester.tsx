import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  MessageSquare, 
  Mail, 
  Smartphone,
  CheckCircle,
  XCircle,
  Clock,
  Play
} from 'lucide-react'

interface TestResult {
  channel: string
  status: 'success' | 'failed' | 'pending'
  timestamp: Date
  responseTime: number
  errorMessage?: string
}

export function NotificationTester() {
  const [selectedChannel, setSelectedChannel] = useState('slack')
  const [recipient, setRecipient] = useState('')
  const [message, setMessage] = useState('')
  const [testType, setTestType] = useState('custom')
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])

  const testTemplates = {
    deployment_success: {
      title: 'Deployment Success',
      message: '✅ Deployment completed successfully!\n\nCommit: abc123\nBranch: main\nDuration: 2m 34s'
    },
    validation_failed: {
      title: 'Validation Failed',
      message: '❌ Environment validation failed!\n\nError: Missing STRIPE_SECRET_KEY\nAction: Update environment variables'
    },
    critical_alert: {
      title: 'Critical Alert',
      message: '🚨 CRITICAL: System experiencing high error rates\n\nError Rate: 15%\nAffected Services: Payment Processing'
    }
  }

  const handleSendTest = async () => {
    setIsLoading(true)
    const startTime = Date.now()
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500))
    
    const responseTime = Date.now() - startTime
    const success = Math.random() > 0.2 // 80% success rate
    
    const result: TestResult = {
      channel: selectedChannel,
      status: success ? 'success' : 'failed',
      timestamp: new Date(),
      responseTime,
      errorMessage: success ? undefined : 'Connection timeout after 30 seconds'
    }
    
    setTestResults(prev => [result, ...prev.slice(0, 9)]) // Keep last 10 results
    setIsLoading(false)
  }

  const handleRunAllTests = async () => {
    const channels = ['slack', 'email', 'sms']
    
    for (const channel of channels) {
      setIsLoading(true)
      const startTime = Date.now()
      
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 500))
      
      const responseTime = Date.now() - startTime
      const success = Math.random() > 0.15
      
      const result: TestResult = {
        channel,
        status: success ? 'success' : 'failed',
        timestamp: new Date(),
        responseTime,
        errorMessage: success ? undefined : `${channel} service unavailable`
      }
      
      setTestResults(prev => [result, ...prev])
    }
    
    setIsLoading(false)
  }

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
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Manual Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Channel</label>
              <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="slack">Slack</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Template</label>
              <Select value={testType} onValueChange={setTestType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Message</SelectItem>
                  <SelectItem value="deployment_success">Deployment Success</SelectItem>
                  <SelectItem value="validation_failed">Validation Failed</SelectItem>
                  <SelectItem value="critical_alert">Critical Alert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Recipient</label>
            <Input
              placeholder={
                selectedChannel === 'slack' ? '#channel or @user' :
                selectedChannel === 'email' ? 'email@example.com' :
                '+1234567890'
              }
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Message</label>
            <Textarea
              placeholder="Enter your test message..."
              rows={4}
              value={testType === 'custom' ? message : testTemplates[testType as keyof typeof testTemplates]?.message || ''}
              onChange={(e) => setMessage(e.target.value)}
              disabled={testType !== 'custom'}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleSendTest} 
              disabled={isLoading || !recipient}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? 'Sending...' : 'Send Test'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRunAllTests}
              disabled={isLoading}
            >
              <Play className="h-4 w-4 mr-2" />
              Test All
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No test results yet. Run a test to see results here.
              </div>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getChannelIcon(result.channel)}
                    <div>
                      <div className="font-medium capitalize">{result.channel}</div>
                      <div className="text-sm text-gray-600">
                        {result.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm">{result.responseTime}ms</div>
                      {result.errorMessage && (
                        <div className="text-xs text-red-600 max-w-32 truncate" title={result.errorMessage}>
                          {result.errorMessage}
                        </div>
                      )}
                    </div>
                    {getStatusIcon(result.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}