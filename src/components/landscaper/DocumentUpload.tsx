import React, { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/SharedUI/Toast"

interface DocumentUploadProps {
  onUpload?: (file: File, type: string) => Promise<void>
  uploadedDocs?: Record<string, any>
}

interface UploadedDocument {
  id: string
  file_url: string
  file_type: string
  uploaded_at: string
  landscaper_id: string
}

function DocumentUploadInner({ onUpload, uploadedDocs, onError }: DocumentUploadProps & { onError: (error: string) => void }) {
  const { showToast } = useToast()
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [landscaperId, setLandscaperId] = useState<string | null>(null)

  useEffect(() => {
    fetchDocuments().catch(err => onError(err.message))
  }, [])

  const fetchDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('DocumentUpload: No user found')
        return
      }

      console.log('DocumentUpload: User authenticated:', user.id)

      // Query documents directly by user_id - this is the correct approach
      const { data, error } = await supabase
        .from('landscaper_documents')
        .select('id, user_id, file_url, document_type, uploaded_at')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false })

      console.log('DocumentUpload: Document query result:', { data, error })

      if (error) {
        console.error('DocumentUpload: Database error:', error)
        throw new Error(`Failed to load documents: ${error.message}`)
      }

      // Transform data to match expected interface
      const transformedData = (data || []).map(doc => ({
        id: doc.id,
        file_url: doc.file_url,
        file_type: doc.document_type, // Map document_type to file_type
        uploaded_at: doc.uploaded_at,
        landscaper_id: doc.user_id // Use user_id as landscaper_id
      }))

      console.log('DocumentUpload: Transformed documents:', transformedData)
      setDocuments(transformedData)
      
    } catch (error: any) {
      console.error('[DocumentFetch] fail', error)
      showToast('Failed to load documents', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (type: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      showToast('Only PDF/JPG/PNG up to 5MB', 'error')
      return
    }
    
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      showToast('Only PDF/JPG/PNG up to 5MB', 'error')
      return
    }

    setUploading(type)
    setUploadProgress({ ...uploadProgress, [type]: 0 })
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          [type]: Math.min((prev[type] || 0) + 20, 90)
        }))
      }, 200)

      // Use user.id for folder structure instead of landscaperId
      const path = `${user.id}/${Date.now()}_${file.name}`
      
      console.log('Uploading to path:', path)
      console.log('File details:', { name: file.name, type: file.type, size: file.size })
      
      const { data: uploadData, error: upErr } = await supabase.storage
        .from('landscaper-documents')
        .upload(path, file, { 
          upsert: false, 
          contentType: file.type,
          duplex: 'half' 
        })

      console.log('Upload result:', { uploadData, upErr })
      
      clearInterval(progressInterval)
      setUploadProgress(prev => ({ ...prev, [type]: 100 }))

      if (upErr) {
        console.error('Storage upload error:', upErr)
        throw new Error(`Upload failed: ${upErr.message}`)
      }

      const { data: pub } = supabase.storage
        .from('landscaper-documents')
        .getPublicUrl(path)

      console.log('Public URL:', pub.publicUrl)

      const insertData = {
        user_id: user.id,
        document_type: type,
        file_name: file.name,
        file_url: pub.publicUrl,
        file_size: file.size,
        mime_type: file.type
      }
      
      console.log('Inserting to database:', insertData)

      const { error: insErr } = await supabase
        .from('landscaper_documents')
        .insert(insertData)

      console.log('Database insert result:', { error: insErr })

      if (insErr) {
        console.error('Database insert error:', insErr)
        throw new Error(`Database error: ${insErr.message}`)
      }

      showToast('Document uploaded successfully', 'success')
      await fetchDocuments()

      
      if (onUpload) {
        await onUpload(file, type)
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      showToast(`Upload failed: ${error.message}`, 'error')
    } finally {
      setUploading(null)
      setUploadProgress(prev => ({ ...prev, [type]: 0 }))
    }
  }

  const documentTypes = [
    { key: 'license', label: 'Business License', required: true },
    { key: 'insurance', label: 'Insurance Certificate', required: true },
    { key: 'certification', label: 'Certifications', required: false },
    { key: 'portfolio', label: 'Portfolio/References', required: false }
  ]

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-black/40 shadow-[0_0_0_1px_rgba(16,185,129,0.06)] hover:border-emerald-500/30 transition-colors">
      <div className="px-5 py-4 border-b border-emerald-900/20">
        <h3 className="text-emerald-300 font-semibold tracking-wide">Document Upload</h3>
      </div>
      <div className="p-5 space-y-4">
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-emerald-900/10 rounded"></div>
            ))}
          </div>
        ) : (
          documentTypes.map((docType) => {
            const existingDocs = documents.filter(d => d.file_type === docType.key).slice(0, 3)
            const isUploading = uploading === docType.key
            const progress = uploadProgress[docType.key] || 0
            const hasUploaded = existingDocs.length > 0

            return (
              <div key={docType.key}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-100 font-medium text-sm">{docType.label}</span>
                    {docType.required && (
                      <span className="text-rose-400 text-xs">*Required</span>
                    )}
                  </div>
                  {hasUploaded && (
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300">
                      Uploaded
                    </span>
                  )}
                </div>
                <label className="cursor-pointer block mt-3">
                  <div className="rounded-lg border border-emerald-500/25 bg-zinc-900/40 px-4 py-6 text-center hover:border-emerald-400/40 transition-colors">
                    <svg className="w-6 h-6 text-emerald-300/80 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-emerald-200/90 text-sm mb-1">
                      {isUploading ? 'Uploading...' : `Upload ${docType.label}`}
                    </p>
                    <p className="text-xs text-emerald-300/60">
                      PDF / JPG / PNG • max 5MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(docType.key, file)
                    }}
                  />
                </label>
                {isUploading && (
                  <div className="mt-2 h-1 rounded bg-emerald-500/20 overflow-hidden">
                    <div 
                      style={{ width: `${progress}%` }} 
                      className="h-full bg-emerald-400 transition-all duration-300" 
                    />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function DocumentUpload(props: DocumentUploadProps) {
  const [error, setError] = useState<string | null>(null)

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-900/10 p-6 text-center">
        <h3 className="text-red-400 font-semibold mb-2">Upload Error</h3>
        <p className="text-red-300 text-sm mb-4">{error}</p>
        <button 
          onClick={() => setError(null)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return <DocumentUploadInner {...props} onError={setError} />
}