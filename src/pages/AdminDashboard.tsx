import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { AdminJobPricingPanel } from '@/components/admin/AdminJobPricingPanel'
import { LogOut } from 'lucide-react'

export default function AdminDashboard() {
  const { user, role, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      navigate('/admin-login', { replace: true })
      return
    }

    if (role !== 'admin') {
      navigate('/', { replace: true })
      return
    }

    setLoading(false)
  }, [authLoading, user, role])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-emerald-300">
        Loading admin dashboard
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-emerald-300">
          Admin Dashboard
        </h1>
        <Button
          onClick={async () => {
            await supabase.auth.signOut()
            navigate('/admin-login')
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      <AdminJobPricingPanel />
    </div>
  )
}
