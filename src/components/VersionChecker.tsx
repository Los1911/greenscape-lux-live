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
    // Only run version checking in production
    if (import.meta.env.DEV) {
      return;
    }

    const checkVersion = async () => {
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`);
        if (!response.ok) return;
        
        const data = await response.json();
        
        // Skip if placeholder values
        if (data.commitHash === 'PLACEHOLDER' || !data.commitHash) {
          return;
        }
        
        setVersion(data);
        
        // Store current version
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
        console.error('Version check failed:', error);
      }
    };

    checkVersion();
    // Check every 5 minutes instead of 1 minute
    const interval = setInterval(checkVersion, 300000);
    return () => clearInterval(interval);
  }, []);

  if (showAlert) {
    return (
      <Alert className="fixed bottom-4 right-4 w-auto z-50 bg-green-600 text-white border-green-700">
        <AlertDescription>
          New version available. Reloading...
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
