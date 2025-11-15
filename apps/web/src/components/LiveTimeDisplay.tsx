'use client'

import { useEffect, useState } from 'react'

export default function LiveTimeDisplay() {
  const [currentTime, setCurrentTime] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }))
    }
    
    // Set initial time
    updateTime()
    
    // Update time every second
    const interval = setInterval(updateTime, 1000)
    
    return () => clearInterval(interval)
  }, [])

  // Prevent hydration mismatch by not rendering time until mounted
  if (!mounted) {
    return (
      <div className="text-right bg-gray-50 rounded-lg px-4 py-2 border">
        <div className="text-xs text-gray-500 font-medium">Last Updated</div>
        <div className="font-mono font-semibold text-gray-700">--:--:--</div>
      </div>
    )
  }

  return (
    <div className="text-right bg-green-50 rounded-lg px-4 py-2 border border-green-200">
      <div className="text-xs text-green-600 font-medium">Last Updated</div>
      <div className="font-mono font-semibold text-green-800">{currentTime}</div>
    </div>
  )
}