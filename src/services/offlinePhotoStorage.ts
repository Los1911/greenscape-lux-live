// Simple offline photo storage using localStorage for compatibility
interface StoredPhoto {
  id: string
  jobId: string
  type: 'before' | 'after'
  fileData: string // base64 encoded
  fileName: string
  fileType: string
  metadata: {
    timestamp: number
    gps?: { latitude: number; longitude: number }
    deviceInfo?: any
  }
  status: 'pending' | 'uploading' | 'failed' | 'completed'
  retryCount: number
  lastAttempt?: number
  error?: string
}

class OfflinePhotoStorage {
  private storageKey = 'landscaper-photos'
  private queueKey = 'photo-sync-queue'

  async init(): Promise<void> {
    // No initialization needed for localStorage
  }

  private getPhotos(): StoredPhoto[] {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  private savePhotos(photos: StoredPhoto[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(photos))
    } catch (error) {
      console.error('Failed to save photos to localStorage:', error)
    }
  }

  async storePhoto(
    jobId: string,
    type: 'before' | 'after',
    file: File,
    metadata: any
  ): Promise<string> {
    const id = `${jobId}-${type}-${Date.now()}`
    
    // Convert file to base64
    const fileData = await this.fileToBase64(file)
    
    const photo: StoredPhoto = {
      id,
      jobId,
      type,
      fileData,
      fileName: file.name,
      fileType: file.type,
      metadata: {
        timestamp: Date.now(),
        ...metadata
      },
      status: 'pending',
      retryCount: 0
    }

    const photos = this.getPhotos()
    photos.push(photo)
    this.savePhotos(photos)
    
    return id
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async getPendingPhotos(): Promise<StoredPhoto[]> {
    const photos = this.getPhotos()
    return photos.filter(p => p.status === 'pending' || p.status === 'failed')
  }

  async updatePhotoStatus(
    id: string, 
    status: 'uploading' | 'completed' | 'failed',
    error?: string
  ): Promise<void> {
    const photos = this.getPhotos()
    const photoIndex = photos.findIndex(p => p.id === id)
    
    if (photoIndex !== -1) {
      photos[photoIndex].status = status
      photos[photoIndex].lastAttempt = Date.now()
      if (status === 'failed') {
        photos[photoIndex].retryCount++
        photos[photoIndex].error = error
      }
      this.savePhotos(photos)
    }
  }

  async getStorageStats(): Promise<{ total: number; pending: number; failed: number }> {
    const photos = this.getPhotos()
    return {
      total: photos.length,
      pending: photos.filter(p => p.status === 'pending').length,
      failed: photos.filter(p => p.status === 'failed').length
    }
  }

  async clearCompleted(): Promise<void> {
    const photos = this.getPhotos()
    const remaining = photos.filter(p => p.status !== 'completed')
    this.savePhotos(remaining)
  }

  // Convert stored photo back to File object
  getFileFromStored(photo: StoredPhoto): File {
    const byteCharacters = atob(photo.fileData.split(',')[1])
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    return new File([byteArray], photo.fileName, { type: photo.fileType })
  }
}

export const offlinePhotoStorage = new OfflinePhotoStorage()