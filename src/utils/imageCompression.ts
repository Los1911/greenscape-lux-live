// Client-side image compression utility
export const compressImage = (file: File, maxLongEdge: number = 1920, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    // Skip compression for PDFs
    if (file.type === 'application/pdf') {
      resolve(file)
      return
    }

    // Skip if not an image
    if (!file.type.startsWith('image/')) {
      resolve(file)
      return
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      const longEdge = Math.max(width, height)
      
      if (longEdge > maxLongEdge) {
        const ratio = maxLongEdge / longEdge
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Compression failed'))
          return
        }
        
        const compressedFile = new File([blob], file.name, {
          type: file.type,
          lastModified: Date.now()
        })
        
        resolve(compressedFile)
      }, file.type, quality)
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}