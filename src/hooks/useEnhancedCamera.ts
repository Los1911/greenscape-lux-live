import { useState, useRef, useCallback, useEffect } from 'react'

interface CameraConstraints {
  facingMode?: 'user' | 'environment'
  width?: number
  height?: number
  frameRate?: number
  focusMode?: 'continuous' | 'single-shot' | 'manual'
}

interface CameraCapabilities {
  zoom?: { min: number; max: number; step: number }
  torch?: boolean
  focusDistance?: { min: number; max: number; step: number }
  exposureCompensation?: { min: number; max: number; step: number }
  whiteBalance?: string[]
}

interface CameraSettings {
  zoom?: number
  torch?: boolean
  focusDistance?: number
  exposureCompensation?: number
  whiteBalance?: string
}

export function useEnhancedCamera() {
  const [isSupported, setIsSupported] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [capabilities, setCapabilities] = useState<CameraCapabilities>({})
  const [settings, setSettings] = useState<CameraSettings>({})
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const trackRef = useRef<MediaStreamTrack | null>(null)

  const checkSupport = useCallback(() => {
    const supported = !!(
      navigator.mediaDevices && 
      navigator.mediaDevices.getUserMedia &&
      'ImageCapture' in window
    )
    setIsSupported(supported)
    return supported
  }, [])

  const getCapabilities = useCallback(() => {
    if (!trackRef.current) return {}
    
    try {
      const caps = trackRef.current.getCapabilities()
      const cameraCapabilities: CameraCapabilities = {}
      
      if (caps.zoom) {
        cameraCapabilities.zoom = caps.zoom
      }
      if (caps.torch) {
        cameraCapabilities.torch = true
      }
      if (caps.focusDistance) {
        cameraCapabilities.focusDistance = caps.focusDistance
      }
      if (caps.exposureCompensation) {
        cameraCapabilities.exposureCompensation = caps.exposureCompensation
      }
      if (caps.whiteBalanceMode) {
        cameraCapabilities.whiteBalance = caps.whiteBalanceMode
      }
      
      return cameraCapabilities
    } catch (err) {
      console.warn('Failed to get camera capabilities:', err)
      return {}
    }
  }, [])

  const applySettings = useCallback(async (newSettings: Partial<CameraSettings>) => {
    if (!trackRef.current) return false

    try {
      const constraints: any = {}
      
      if (newSettings.zoom !== undefined) {
        constraints.zoom = newSettings.zoom
      }
      if (newSettings.torch !== undefined) {
        constraints.torch = newSettings.torch
      }
      if (newSettings.focusDistance !== undefined) {
        constraints.focusDistance = newSettings.focusDistance
      }
      if (newSettings.exposureCompensation !== undefined) {
        constraints.exposureCompensation = newSettings.exposureCompensation
      }
      if (newSettings.whiteBalance !== undefined) {
        constraints.whiteBalanceMode = newSettings.whiteBalance
      }

      await trackRef.current.applyConstraints({ advanced: [constraints] })
      setSettings(prev => ({ ...prev, ...newSettings }))
      return true
    } catch (err: any) {
      setError(`Failed to apply camera settings: ${err.message}`)
      return false
    }
  }, [])

  const startCamera = useCallback(async (constraints: CameraConstraints = {}) => {
    if (!checkSupport()) {
      setError('Enhanced camera features not supported on this device')
      return false
    }

    try {
      const mediaConstraints = {
        video: {
          facingMode: constraints.facingMode || 'environment',
          width: { ideal: constraints.width || 1920 },
          height: { ideal: constraints.height || 1080 },
          frameRate: { ideal: constraints.frameRate || 30 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
      streamRef.current = stream
      
      const videoTrack = stream.getVideoTracks()[0]
      trackRef.current = videoTrack
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      
      // Get and set capabilities
      const caps = getCapabilities()
      setCapabilities(caps)
      
      setIsActive(true)
      setError(null)
      return true
    } catch (err: any) {
      setError(err.message || 'Failed to access camera')
      setIsActive(false)
      return false
    }
  }, [checkSupport, getCapabilities])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    trackRef.current = null
    setIsActive(false)
    setCapabilities({})
    setSettings({})
  }, [])

  const capturePhoto = useCallback(async (): Promise<File | null> => {
    if (!videoRef.current || !isActive || !trackRef.current) return null

    try {
      // Use ImageCapture API for better quality if available
      if ('ImageCapture' in window) {
        const imageCapture = new (window as any).ImageCapture(trackRef.current)
        const blob = await imageCapture.takePhoto()
        
        return new File([blob], `photo_${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now()
        })
      } else {
        // Fallback to canvas capture
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        
        ctx?.drawImage(videoRef.current, 0, 0)
        
        return new Promise((resolve) => {
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], `photo_${Date.now()}.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              resolve(file)
            } else {
              resolve(null)
            }
          }, 'image/jpeg', 0.9)
        })
      }
    } catch (err: any) {
      setError(`Failed to capture photo: ${err.message}`)
      return null
    }
  }, [isActive])

  const toggleTorch = useCallback(async () => {
    if (!capabilities.torch) return false
    
    const newTorchState = !settings.torch
    const success = await applySettings({ torch: newTorchState })
    return success
  }, [capabilities.torch, settings.torch, applySettings])

  const setZoom = useCallback(async (zoomLevel: number) => {
    if (!capabilities.zoom) return false
    
    const clampedZoom = Math.max(
      capabilities.zoom.min,
      Math.min(capabilities.zoom.max, zoomLevel)
    )
    
    const success = await applySettings({ zoom: clampedZoom })
    return success
  }, [capabilities.zoom, applySettings])

  const setFocus = useCallback(async (focusDistance: number) => {
    if (!capabilities.focusDistance) return false
    
    const clampedFocus = Math.max(
      capabilities.focusDistance.min,
      Math.min(capabilities.focusDistance.max, focusDistance)
    )
    
    const success = await applySettings({ focusDistance: clampedFocus })
    return success
  }, [capabilities.focusDistance, applySettings])

  // Auto-focus when camera starts
  useEffect(() => {
    if (isActive && trackRef.current) {
      // Try to enable continuous autofocus
      applySettings({ focusDistance: 0 }).catch(() => {
        // Ignore errors for unsupported devices
      })
    }
  }, [isActive, applySettings])

  return {
    // Basic camera functionality
    isSupported,
    isActive,
    error,
    videoRef,
    startCamera,
    stopCamera,
    capturePhoto,
    checkSupport,
    
    // Enhanced features
    capabilities,
    settings,
    applySettings,
    toggleTorch,
    setZoom,
    setFocus,
    
    // Convenience methods
    hasTorch: !!capabilities.torch,
    hasZoom: !!capabilities.zoom,
    hasFocus: !!capabilities.focusDistance,
    hasExposure: !!capabilities.exposureCompensation,
    hasWhiteBalance: !!capabilities.whiteBalance
  }
}