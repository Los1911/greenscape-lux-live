import { useState } from 'react'
import { X, Download, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useInstallPrompt, useMobile } from '@/hooks/use-mobile'

export function PWAInstallBanner() {
  const [dismissed, setDismissed] = useState(false)
  const { isInstallable, promptInstall } = useInstallPrompt()
  const { isMobile } = useMobile()

  if (!isInstallable || dismissed || !isMobile) return null

  const handleInstall = async () => {
    const installed = await promptInstall()
    if (installed) {
      setDismissed(true)
    }
  }

  return (
    <Card className="fixed bottom-20 left-4 right-4 z-40 p-4 bg-black border border-emerald-500/40 text-white shadow-lg shadow-emerald-500/20">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <Smartphone className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">Install GreenScape Lux</h3>
          <p className="text-xs opacity-90">Get the full app experience</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleInstall}
            className="bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/30 transition-all duration-200"
          >
            <Download className="h-4 w-4 mr-1" />
            Install
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="text-gray-300 hover:text-emerald-400 hover:bg-emerald-500/20 p-1 transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}