import { useState, useEffect } from 'react'

export function usePWA() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isStandalone, setIsStandalone] = useState(false)
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    // Check if running in standalone mode (PWA)
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration)
          setSwRegistration(registration)
        })
        .catch((error) => {
          console.log('SW registration failed:', error)
        })
    }

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }

  const subscribeToPush = async () => {
    if (!swRegistration) return null

    try {
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'your-vapid-public-key' // Replace with actual VAPID key
      })
      return subscription
    } catch (error) {
      console.error('Push subscription failed:', error)
      return null
    }
  }

  return {
    isOnline,
    isStandalone,
    swRegistration,
    requestNotificationPermission,
    subscribeToPush
  }
}