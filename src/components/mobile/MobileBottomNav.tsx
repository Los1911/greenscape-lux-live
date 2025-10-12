import { Link, useLocation } from 'react-router-dom'
import { Home, Briefcase, User, Bell, Settings } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useMobile } from '@/hooks/use-mobile'

interface MobileBottomNavProps {
  userRole?: string
  notificationCount?: number
}

export function MobileBottomNav({ userRole, notificationCount = 0 }: MobileBottomNavProps) {
  const location = useLocation()
  const { isMobile } = useMobile()

  if (!isMobile) return null

  const getNavItems = () => {
    if (userRole === 'admin') {
      return [
        { href: '/', icon: Home, label: 'Home' },
        { href: '/admin', icon: Settings, label: 'Dashboard' },
        { href: '/admin/notifications', icon: Bell, label: 'Alerts', badge: notificationCount },
        { href: '/admin/profile', icon: User, label: 'Profile' },
      ]
    }

    if (userRole === 'landscaper') {
      return [
        { href: '/', icon: Home, label: 'Home' },
        { href: '/landscaper-jobs', icon: Briefcase, label: 'Jobs' },
        { href: '/landscaper-dashboard', icon: Settings, label: 'Dashboard' },
        { href: '/landscaper-profile', icon: User, label: 'Profile' },
      ]
    }

    if (userRole === 'client') {
      return [
        { href: '/', icon: Home, label: 'Home' },
        { href: '/get-quote', icon: Briefcase, label: 'Quote' },
        { href: '/client-dashboard/overview', icon: Settings, label: 'Dashboard' },
        { href: '/client-dashboard/profile', icon: User, label: 'Profile' },
      ]
    }

    return [
      { href: '/', icon: Home, label: 'Home' },
      { href: '/get-quote', icon: Briefcase, label: 'Quote' },
      { href: '/professionals', icon: Settings, label: 'Pros' },
      { href: '/login', icon: User, label: 'Login' },
    ]
  }

  const navItems = getNavItems()


  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-emerald-500/30 z-50 md:hidden shadow-[0_-4px_20px_rgba(16,185,129,0.15)]">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.href
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-300 min-w-0 ${
                isActive 
                  ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.8)] scale-105' 
                  : 'text-gray-400 hover:text-emerald-400 hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] hover:scale-105'
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 transition-all duration-300 ${isActive ? 'animate-pulse' : ''}`} />
                {item.badge && item.badge > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-4 w-4 rounded-full p-0 text-xs bg-emerald-500 text-black">
                    {item.badge > 9 ? '9+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className={`text-xs font-medium truncate transition-all duration-300 ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}