// Comprehensive offline storage service using IndexedDB
interface OfflineJob {
  id: string
  client_name: string
  service_type: string
  address: string
  scheduled_date: string
  status: 'pending' | 'in_progress' | 'completed'
  description?: string
  notes?: string
  priority: 'low' | 'medium' | 'high'
  estimated_duration?: number
  lastModified: number
  syncStatus: 'synced' | 'pending' | 'failed'
}

interface OfflineData {
  jobs: OfflineJob[]
  photos: any[]
  messages: any[]
  metadata: {
    lastSync: number
    version: string
  }
}

class OfflineStorageService {
  private dbName = 'LandscaperOfflineDB'
  private version = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // Jobs store
        if (!db.objectStoreNames.contains('jobs')) {
          const jobStore = db.createObjectStore('jobs', { keyPath: 'id' })
          jobStore.createIndex('status', 'status', { unique: false })
          jobStore.createIndex('syncStatus', 'syncStatus', { unique: false })
        }
        
        // Photos store
        if (!db.objectStoreNames.contains('photos')) {
          const photoStore = db.createObjectStore('photos', { keyPath: 'id' })
          photoStore.createIndex('jobId', 'jobId', { unique: false })
          photoStore.createIndex('status', 'status', { unique: false })
        }
        
        // Messages store
        if (!db.objectStoreNames.contains('messages')) {
          const msgStore = db.createObjectStore('messages', { keyPath: 'id' })
          msgStore.createIndex('jobId', 'jobId', { unique: false })
        }
        
        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' })
        }
      }
    })
  }

  async storeJobs(jobs: OfflineJob[]): Promise<void> {
    if (!this.db) await this.init()
    
    const transaction = this.db!.transaction(['jobs'], 'readwrite')
    const store = transaction.objectStore('jobs')
    
    for (const job of jobs) {
      job.lastModified = Date.now()
      job.syncStatus = 'synced'
      await store.put(job)
    }
  }

  async getJobs(): Promise<OfflineJob[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['jobs'], 'readonly')
      const store = transaction.objectStore('jobs')
      const request = store.getAll()
      
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async updateJob(jobId: string, updates: Partial<OfflineJob>): Promise<void> {
    if (!this.db) await this.init()
    
    const transaction = this.db!.transaction(['jobs'], 'readwrite')
    const store = transaction.objectStore('jobs')
    
    const getRequest = store.get(jobId)
    getRequest.onsuccess = () => {
      const job = getRequest.result
      if (job) {
        Object.assign(job, updates, {
          lastModified: Date.now(),
          syncStatus: 'pending'
        })
        store.put(job)
        this.addToSyncQueue('job', jobId, 'update')
      }
    }
  }

  async getPendingSync(): Promise<any[]> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly')
      const store = transaction.objectStore('syncQueue')
      const request = store.getAll()
      
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  private async addToSyncQueue(type: string, itemId: string, action: string): Promise<void> {
    if (!this.db) return
    
    const transaction = this.db.transaction(['syncQueue'], 'readwrite')
    const store = transaction.objectStore('syncQueue')
    
    const syncItem = {
      id: `${type}-${itemId}-${Date.now()}`,
      type,
      itemId,
      action,
      timestamp: Date.now(),
      retryCount: 0
    }
    
    store.add(syncItem)
  }

  async clearSyncQueue(): Promise<void> {
    if (!this.db) await this.init()
    
    const transaction = this.db!.transaction(['syncQueue'], 'readwrite')
    const store = transaction.objectStore('syncQueue')
    store.clear()
  }

  async getStorageStats(): Promise<{
    jobs: number
    photos: number
    messages: number
    pendingSync: number
  }> {
    if (!this.db) await this.init()
    
    const [jobs, photos, messages, pendingSync] = await Promise.all([
      this.getCount('jobs'),
      this.getCount('photos'),
      this.getCount('messages'),
      this.getCount('syncQueue')
    ])
    
    return { jobs, photos, messages, pendingSync }
  }

  private getCount(storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.count()
      
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
}

export const offlineStorage = new OfflineStorageService()