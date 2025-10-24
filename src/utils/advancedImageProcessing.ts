interface ProcessingOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'webp' | 'png'
  watermark?: {
    text: string
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
    opacity?: number
    fontSize?: number
  }
  resize?: {
    width: number
    height: number
    mode: 'contain' | 'cover' | 'stretch'
  }
}

interface ImageAnalysis {
  brightness: number
  contrast: number
  sharpness: number
  fileSize: number
  dimensions: { width: number; height: number }
  colorProfile: {
    dominant: string
    palette: string[]
  }
}

export class AdvancedImageProcessor {
  static async processImage(file: File, options: ProcessingOptions = {}): Promise<File> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'jpeg',
      watermark,
      resize
    } = options

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        let { width, height } = img

        // Apply resize logic
        if (resize) {
          ({ width, height } = this.calculateResize(width, height, resize))
        } else {
          // Standard max dimension logic
          const ratio = Math.min(maxWidth / width, maxHeight / height, 1)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        canvas.width = width
        canvas.height = height

        // Clear canvas and draw image
        ctx?.clearRect(0, 0, width, height)
        ctx?.drawImage(img, 0, 0, width, height)

        // Apply watermark if specified
        if (watermark && ctx) {
          this.applyWatermark(ctx, watermark, width, height)
        }

        // Convert to blob
        const mimeType = format === 'jpeg' ? 'image/jpeg' : 
                        format === 'webp' ? 'image/webp' : 'image/png'
        
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to process image'))
            return
          }
          
          const processedFile = new File([blob], 
            this.generateFileName(file.name, format), {
            type: mimeType,
            lastModified: Date.now()
          })
          
          resolve(processedFile)
        }, mimeType, quality)
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  static async analyzeImage(file: File): Promise<ImageAnalysis> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)

        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const analysis = this.performImageAnalysis(imageData, file.size)
        
        resolve({
          ...analysis,
          dimensions: { width: img.width, height: img.height },
          fileSize: file.size
        })
      }

      img.onerror = () => reject(new Error('Failed to analyze image'))
      img.src = URL.createObjectURL(file)
    })
  }

  private static calculateResize(
    originalWidth: number, 
    originalHeight: number, 
    resize: ProcessingOptions['resize']
  ): { width: number; height: number } {
    if (!resize) return { width: originalWidth, height: originalHeight }

    const { width: targetWidth, height: targetHeight, mode } = resize

    switch (mode) {
      case 'stretch':
        return { width: targetWidth, height: targetHeight }
      
      case 'contain': {
        const ratio = Math.min(targetWidth / originalWidth, targetHeight / originalHeight)
        return {
          width: Math.round(originalWidth * ratio),
          height: Math.round(originalHeight * ratio)
        }
      }
      
      case 'cover': {
        const ratio = Math.max(targetWidth / originalWidth, targetHeight / originalHeight)
        return {
          width: Math.round(originalWidth * ratio),
          height: Math.round(originalHeight * ratio)
        }
      }
      
      default:
        return { width: originalWidth, height: originalHeight }
    }
  }

  private static applyWatermark(
    ctx: CanvasRenderingContext2D,
    watermark: NonNullable<ProcessingOptions['watermark']>,
    width: number,
    height: number
  ) {
    const { text, position, opacity = 0.5, fontSize = 16 } = watermark

    ctx.save()
    ctx.globalAlpha = opacity
    ctx.font = `${fontSize}px Arial, sans-serif`
    ctx.fillStyle = 'white'
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 1

    const textMetrics = ctx.measureText(text)
    const textWidth = textMetrics.width
    const textHeight = fontSize

    let x: number, y: number

    switch (position) {
      case 'top-left':
        x = 10
        y = textHeight + 10
        break
      case 'top-right':
        x = width - textWidth - 10
        y = textHeight + 10
        break
      case 'bottom-left':
        x = 10
        y = height - 10
        break
      case 'bottom-right':
        x = width - textWidth - 10
        y = height - 10
        break
      case 'center':
        x = (width - textWidth) / 2
        y = (height + textHeight) / 2
        break
      default:
        x = 10
        y = height - 10
    }

    ctx.strokeText(text, x, y)
    ctx.fillText(text, x, y)
    ctx.restore()
  }

  private static performImageAnalysis(imageData: ImageData, fileSize: number): Omit<ImageAnalysis, 'dimensions' | 'fileSize'> {
    const data = imageData.data
    let totalBrightness = 0
    let totalContrast = 0
    const colorCounts: { [key: string]: number } = {}

    // Analyze pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      // Calculate brightness (luminance)
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b
      totalBrightness += brightness

      // Track colors for palette
      const color = `rgb(${Math.round(r/32)*32},${Math.round(g/32)*32},${Math.round(b/32)*32})`
      colorCounts[color] = (colorCounts[color] || 0) + 1
    }

    const pixelCount = data.length / 4
    const avgBrightness = totalBrightness / pixelCount

    // Get dominant colors
    const sortedColors = Object.entries(colorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([color]) => color)

    return {
      brightness: Math.round((avgBrightness / 255) * 100),
      contrast: this.calculateContrast(data),
      sharpness: this.calculateSharpness(imageData),
      colorProfile: {
        dominant: sortedColors[0] || 'rgb(128,128,128)',
        palette: sortedColors
      }
    }
  }

  private static calculateContrast(data: Uint8ClampedArray): number {
    // Simplified contrast calculation
    let min = 255, max = 0
    
    for (let i = 0; i < data.length; i += 4) {
      const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      min = Math.min(min, brightness)
      max = Math.max(max, brightness)
    }
    
    return Math.round(((max - min) / 255) * 100)
  }

  private static calculateSharpness(imageData: ImageData): number {
    // Simplified sharpness detection using edge detection
    const { data, width, height } = imageData
    let sharpness = 0
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4
        const current = data[idx]
        const right = data[idx + 4]
        const bottom = data[idx + width * 4]
        
        sharpness += Math.abs(current - right) + Math.abs(current - bottom)
      }
    }
    
    return Math.round((sharpness / (width * height)) / 2.55)
  }

  private static generateFileName(originalName: string, format: string): string {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '')
    const timestamp = Date.now()
    return `${nameWithoutExt}_processed_${timestamp}.${format}`
  }
}