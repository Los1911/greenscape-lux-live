interface ImageMetadata {
  gps?: {
    latitude: number
    longitude: number
    accuracy: number
    timestamp: number
  }
  device?: {
    userAgent: string
    platform: string
    timestamp: number
  }
  dimensions?: {
    width: number
    height: number
  }
}

export const addMetadataToImage = async (
  file: File, 
  gpsData?: { latitude: number; longitude: number; accuracy: number; timestamp: number }
): Promise<File> => {
  try {
    // Create metadata object
    const metadata: ImageMetadata = {
      device: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        timestamp: Date.now()
      }
    }

    if (gpsData) {
      metadata.gps = gpsData
    }

    // Get image dimensions
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    return new Promise((resolve, reject) => {
      img.onload = () => {
        metadata.dimensions = {
          width: img.width,
          height: img.height
        }

        canvas.width = img.width
        canvas.height = img.height
        
        ctx?.drawImage(img, 0, 0)
        
        // Add metadata as a comment in the image
        const metadataString = JSON.stringify(metadata)
        
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to process image'))
            return
          }
          
          const enhancedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          })
          
          // Store metadata separately for retrieval
          ;(enhancedFile as any).metadata = metadata
          
          resolve(enhancedFile)
        }, file.type, 0.9)
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  } catch (error) {
    console.error('Failed to add metadata:', error)
    return file
  }
}

export const extractMetadata = (file: File): ImageMetadata | null => {
  return (file as any).metadata || null
}

export const formatGPSForDisplay = (gps: { latitude: number; longitude: number; accuracy: number }) => {
  const lat = gps.latitude.toFixed(6)
  const lng = gps.longitude.toFixed(6)
  const acc = Math.round(gps.accuracy)
  
  return {
    coordinates: `${lat}, ${lng}`,
    accuracy: `±${acc}m`,
    mapsUrl: `https://maps.google.com/?q=${lat},${lng}`
  }
}