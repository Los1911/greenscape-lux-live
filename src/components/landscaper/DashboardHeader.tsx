import React from 'react'
import { LogoutButton } from '../LogoutButton'
import { NotificationBell } from '../notifications/NotificationBell'
import { LiveNotificationSystem } from '../notifications/LiveNotificationSystem'

export function DashboardHeader() {
  return (
    <>
      <LiveNotificationSystem />
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's your overview.</p>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell />

              <LogoutButton />
            </div>
          </div>
        </div>
      </header>
    </>
  )
}