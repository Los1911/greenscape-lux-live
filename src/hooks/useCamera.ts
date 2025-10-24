import { useState, useRef, useCallback } from 'react'

interface CameraOptions {
  facingMode?: 'user' | 'environment'
  width?: number
  height?: number
}

interface GPSCoordinates {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

export function useCamera() {
  const [isSupported, setIsSupported] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const checkSupport = useCallback(() => {
    const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    setIsSupported(supported)
    return supported
  }, [])

  const startCamera = useCallback(async (options: CameraOptions = {}) => {
    if (!checkSupport()) {
      setError('Camera not supported on this device')
      return false
    }

    try {
      const constraints = {
        video: {
          facingMode: options.facingMode || 'environment',
          width: options.width || 1920,
          height: options.height || 1080
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      
      setIsActive(true)
      setError(null)
      return true
    } catch (err: any) {
      setError(err.message || 'Failed to access camera')
      setIsActive(false)
      return false
    }
  }, [checkSupport])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsActive(false)
  }, [])

  const capturePhoto = useCallback(async (): Promise<File | null> => {
    if (!videoRef.current || !isActive) return null

    try {
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
    } catch (err) {
      setError('Failed to capture photo')
      return null
    }
  }, [isActive])

  return {
    isSupported,
    isActive,
    error,
    videoRef,
    startCamera,
    stopCamera,
    capturePhoto,
    checkSupport
  }
}

export function useGPS() {
  const [isSupported, setIsSupported] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkSupport = useCallback(() => {
    const supported = !!(navigator.geolocation)
    setIsSupported(supported)
    return supported
  }, [])

  const getCurrentPosition = useCallback(async (): Promise<GPSCoordinates | null> => {
    if (!checkSupport()) {
      setError('GPS not supported on this device')
      return null
    }

    setIsLoading(true)
    setError(null)

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: GPSCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          }
          setIsLoading(false)
          resolve(coords)
        },
        (err) => {
          setError(err.message || 'Failed to get location')
          setIsLoading(false)
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    })
  }, [checkSupport])

  return {
    isSupported,
    isLoading,
    error,
    getCurrentPosition,
    checkSupport
  }
}