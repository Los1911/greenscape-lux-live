import { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MobileOptimizedCardProps {
  title?: string
  children: ReactNode
  onTap?: () => void
  className?: string
}

export function MobileOptimizedCard({
  title,
  children,
  onTap,
  className = ''
}: MobileOptimizedCardProps) {
  return (
    <Card 
      className={`${className} ${onTap ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
      onClick={onTap}
    >
      {title && (
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  )
}

export function MobileGrid({ children, className = '' }: { children: ReactNode, className?: string }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {children}
    </div>
  )
}

export function MobileList({ children, className = '' }: { children: ReactNode, className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {children}
    </div>
  )
}
