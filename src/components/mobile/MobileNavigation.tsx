import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Home, User, Briefcase, Settings, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { useMobile } from '@/hooks/use-mobile'

interface MobileNavigationProps {
  userRole?: string
  notificationCount?: number
}

export function MobileNavigation({ userRole, notificationCount = 0 }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const { isMobile } = useMobile()

  if (!isMobile) return null

  const getNavItems = () => {
    const baseItems = [
      { href: '/', label: 'Home', icon: Home },
      { href: '/get-quote', label: 'Request Estimate', icon: Briefcase },

    ]

    if (userRole === 'admin') {
      return [
        ...baseItems,
        { href: '/admin', label: 'Dashboard', icon: Settings },
        { href: '/admin/notifications', label: 'Notifications', icon: Bell, badge: notificationCount },
      ]
    }

    if (userRole === 'landscaper') {
      return [
        ...baseItems,
        { href: '/landscaper-dashboard', label: 'Dashboard', icon: User },
        { href: '/landscaper-jobs', label: 'Jobs', icon: Briefcase },
      ]
    }

    if (userRole === 'client') {
      return [
        ...baseItems,
        { href: '/client/dashboard', label: 'Dashboard', icon: User },
        { href: '/client/requests', label: 'Requests', icon: Briefcase },
      ]
    }

    return [
      ...baseItems,
      { href: '/login', label: 'Login', icon: User },
    ]
  }

  const navItems = getNavItems()

  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Menu className="h-6 w-6" />
            {notificationCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                {notificationCount > 99 ? '99+' : notificationCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-emerald-100 text-emerald-700 font-medium' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <Badge className="ml-auto">
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}