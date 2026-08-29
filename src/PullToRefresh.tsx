import { useEffect, useRef, useState, type ReactNode } from 'react'

const REFRESH_THRESHOLD = 68
const MAX_PULL_DISTANCE = 96

type PullToRefreshProps = {
  children: ReactNode
}

function PullToRefresh({ children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const gesture = useRef({ active: false, startX: 0, startY: 0 })

  useEffect(() => {
    const handleTouchStart = (event: TouchEvent) => {
      if (refreshing || window.scrollY > 0 || event.touches.length !== 1) return

      const touch = event.touches[0]
      gesture.current = {
        active: true,
        startX: touch.clientX,
        startY: touch.clientY,
      }
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (!gesture.current.active || event.touches.length !== 1) return

      const touch = event.touches[0]
      const deltaX = Math.abs(touch.clientX - gesture.current.startX)
      const deltaY = touch.clientY - gesture.current.startY

      if (deltaY <= 0 || deltaX > deltaY) {
        gesture.current.active = false
        setPullDistance(0)
        return
      }

      if (window.scrollY > 0) {
        gesture.current.active = false
        setPullDistance(0)
        return
      }

      event.preventDefault()
      setPullDistance(Math.min(MAX_PULL_DISTANCE, deltaY * 0.55))
    }

    const finishGesture = () => {
      if (!gesture.current.active) return

      gesture.current.active = false
      if (pullDistance >= REFRESH_THRESHOLD) {
        setRefreshing(true)
        setPullDistance(REFRESH_THRESHOLD)
        window.setTimeout(() => window.location.reload(), 180)
        return
      }

      setPullDistance(0)
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', finishGesture, { passive: true })
    window.addEventListener('touchcancel', finishGesture, { passive: true })

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', finishGesture)
      window.removeEventListener('touchcancel', finishGesture)
    }
  }, [pullDistance, refreshing])

  const ready = pullDistance >= REFRESH_THRESHOLD

  return (
    <div className={`pull-to-refresh-shell${pullDistance > 0 || refreshing ? ' is-pulling' : ''}`}>
      <div
        className={`pull-to-refresh-indicator${ready ? ' is-ready' : ''}${refreshing ? ' is-refreshing' : ''}`}
        style={{ transform: `translate(-50%, ${Math.max(-52, pullDistance - 52)}px)` }}
        aria-hidden="true"
      >
        <span className="pull-to-refresh-icon">↻</span>
        <span>{refreshing ? 'Aktualisieren …' : ready ? 'Loslassen zum Aktualisieren' : 'Zum Aktualisieren ziehen'}</span>
      </div>
      <div className="pull-to-refresh-content" style={{ transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined }}>
        {children}
      </div>
    </div>
  )
}

export default PullToRefresh
