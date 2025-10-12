import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertTriangle, Settings, Webhook } from 'lucide-react'

interface WebhookEndpoint {
  id: string
  url: string
  secret: string
  events: string[]
  status: 'active' | 'disabled'
}

export default function StripeProductionDashboard() {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([])
  const [domain, setDomain] = useState('greenscape-lux.vercel.app')
  const [isConfiguring, setIsConfiguring] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const configureProductionWebhooks = async () => {
    setIsConfiguring(true)
    setStatus('idle')
    
    try {
      const response = await fetch('/api/supabase/functions/stripe-production-webhook-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      })

      const result = await response.json()
      
      if (result.success) {
        setWebhooks(result.webhooks)
        setStatus('success')
        setMessage('Production webhooks configured successfully!')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Configuration failed')
    } finally {
      setIsConfiguring(false)
    }
  }

  const requiredEvents = [
    'payment_intent.succeeded',
    'customer.subscription.updated', 
    'invoice.payment_succeeded'
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Stripe Production Configuration
          </CardTitle>
          <CardDescription>
            Configure live Stripe webhooks for production payment processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="domain">Production Domain</Label>
            <Input
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="your-domain.vercel.app"
            />
          </div>

          <Button 
            onClick={configureProductionWebhooks}
            disabled={isConfiguring}
            className="w-full"
          >
            {isConfiguring ? 'Configuring...' : 'Configure Production Webhooks'}
          </Button>

          {status !== 'idle' && (
            <Alert className={status === 'success' ? 'border-green-200' : 'border-red-200'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Endpoints
          </CardTitle>
          <CardDescription>
            Production webhook endpoints for payment processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {webhooks.length > 0 ? (
              webhooks.map((webhook) => (
                <div key={webhook.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {webhook.url}
                    </code>
                    <Badge variant={webhook.status === 'active' ? 'default' : 'secondary'}>
                      {webhook.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {webhook.events.map((event) => (
                      <Badge key={event} variant="outline" className="text-xs">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                No webhooks configured yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Required Events</CardTitle>
          <CardDescription>
            Essential webhook events for payment processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {requiredEvents.map((event) => (
              <div key={event} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <code className="text-sm">{event}</code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}