import { useRef, useEffect, ReactNode } from 'react'

interface TouchGesturesProps {
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onTap?: () => void
  onLongPress?: () => void
  className?: string
}

export function TouchGestures({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  onLongPress,
  className = ''
}: TouchGesturesProps) {
  const touchRef = useRef<HTMLDivElement>(null)
  const touchStart = useRef({ x: 0, y: 0, time: 0 })
  const longPressTimer = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const element = touchRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      }

      if (onLongPress) {
        longPressTimer.current = setTimeout(() => {
          onLongPress()
        }, 500)
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStart.current.x
      const deltaY = touch.clientY - touchStart.current.y
      const deltaTime = Date.now() - touchStart.current.time
      
      const minSwipeDistance = 50
      const maxSwipeTime = 300

      // Check for tap
      if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 200) {
        onTap?.()
        return
      }

      // Check for swipes
      if (deltaTime < maxSwipeTime) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          if (Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
              onSwipeRight?.()
            } else {
              onSwipeLeft?.()
            }
          }
        } else {
          // Vertical swipe
          if (Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0) {
              onSwipeDown?.()
            } else {
              onSwipeUp?.()
            }
          }
        }
      }
    }

    const handleTouchMove = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }

    element.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.addEventListener('touchend', handleTouchEnd, { passive: true })
    element.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      element.removeEventListener('touchstart', handleTouchStart)
      element.removeEventListener('touchend', handleTouchEnd)
      element.removeEventListener('touchmove', handleTouchMove)
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, onLongPress])

  return (
    <div ref={touchRef} className={className}>
      {children}
    </div>
  )
}