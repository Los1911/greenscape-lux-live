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
<<<<<<< HEAD
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
        
=======
    const checkVersion = async () => {
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`);
        const data = await response.json();
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
        setVersion(data);
        
        // Store current version
        const storedVersion = localStorage.getItem('app_version');
        if (storedVersion && storedVersion !== data.commitHash) {
          setShowAlert(true);
          setTimeout(() => {
            localStorage.setItem('app_version', data.commitHash);
            window.location.reload();
          }, 3000);
<<<<<<< HEAD
        } else if (!storedVersion) {
=======
        } else {
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
          localStorage.setItem('app_version', data.commitHash);
        }
      } catch (error) {
        console.error('Version check failed:', error);
      }
    };

    checkVersion();
<<<<<<< HEAD
    // Check every 5 minutes instead of 1 minute
    const interval = setInterval(checkVersion, 300000);
=======
    const interval = setInterval(checkVersion, 60000); // Check every minute
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
    return () => clearInterval(interval);
  }, []);

  if (showAlert) {
    return (
<<<<<<< HEAD
      <Alert className="fixed bottom-4 right-4 w-auto z-50 bg-green-600 text-white border-green-700">
=======
      <Alert className="fixed bottom-4 right-4 w-auto z-50">
>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
        <AlertDescription>
          New version available. Reloading...
        </AlertDescription>
      </Alert>
    );
  }

<<<<<<< HEAD
=======
  // Dev mode: show version in bottom corner
  if (import.meta.env.DEV && version) {
    return (
      <div className="fixed bottom-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded z-50">
        v{version.commitHash}
      </div>
    );
  }

>>>>>>> 42066f228f3cc066c557f896ed5be2dbfa77c706
  return null;
}
