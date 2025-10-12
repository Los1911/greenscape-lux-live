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
    const checkVersion = async () => {
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`);
        const data = await response.json();
        setVersion(data);
        
        // Store current version
        const storedVersion = localStorage.getItem('app_version');
        if (storedVersion && storedVersion !== data.commitHash) {
          setShowAlert(true);
          setTimeout(() => {
            localStorage.setItem('app_version', data.commitHash);
            window.location.reload();
          }, 3000);
        } else {
          localStorage.setItem('app_version', data.commitHash);
        }
      } catch (error) {
        console.error('Version check failed:', error);
      }
    };

    checkVersion();
    const interval = setInterval(checkVersion, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  if (showAlert) {
    return (
      <Alert className="fixed bottom-4 right-4 w-auto z-50">
        <AlertDescription>
          New version available. Reloading...
        </AlertDescription>
      </Alert>
    );
  }

  // Dev mode: show version in bottom corner
  if (import.meta.env.DEV && version) {
    return (
      <div className="fixed bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded z-50">
        v{version.commitHash}
      </div>
    );
  }

  return null;
}
