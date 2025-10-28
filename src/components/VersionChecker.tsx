import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VersionInfo {
  commitHash: string;
  buildId: string;
  timestamp: number;
  environment: string;
  deployedAt: string;
}

export function VersionChecker() {
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    // ✅ Only run version checking in production
    if (import.meta.env.DEV) return;

    const checkVersion = async () => {
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`);
        if (!response.ok) return;

        const data = await response.json();

        // ✅ Skip placeholder values (e.g. during first build)
        if (data.commitHash === 'PLACEHOLDER' || !data.commitHash) return;

        setVersion(data);

        // ✅ Compare stored version with current
        const storedVersion = localStorage.getItem('app_version');
        if (storedVersion && storedVersion !== data.commitHash) {
          setShowAlert(true);
          setTimeout(() => {
            localStorage.setItem('app_version', data.commitHash);
            window.location.reload();
          }, 3000);
        } else if (!storedVersion) {
          localStorage.setItem('app_version', data.commitHash);
        }
      } catch (error) {
        console.error('❌ Version check failed:', error);
      }
    };

    checkVersion();

    // ✅ Check every 5 minutes
    const interval = setInterval(checkVersion, 300000);
    return () => clearInterval(interval);
  }, []);

  if (showAlert) {
    return (
      <Alert className="fixed bottom-4 right-4 w-auto z-50 bg-green-600 text-white border-green-700 shadow-lg">
        <AlertDescription>New version available. Reloading...</AlertDescription>
      </Alert>
    );
  }

  // ✅ (Optional) In dev mode, display commit hash for debugging
  if (import.meta.env.DEV && version) {
    return (
      <div className="fixed bottom-2 left-2 text-xs bg-black/60 text-white px-2 py-1 rounded z-50">
        v{version.commitHash}
      </div>
    );
  }

  return null;
}

export default VersionChecker;