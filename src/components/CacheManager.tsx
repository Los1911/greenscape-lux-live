import React, { useEffect, useState } from 'react';
import { checkForUpdates, forceCacheInvalidation, getBuildInfo } from '../utils/cacheInvalidation';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export const CacheManager: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [buildInfo] = useState(getBuildInfo());

  useEffect(() => {
    const checkInterval = setInterval(async () => {
      setIsChecking(true);
      const hasUpdate = await checkForUpdates();
      setUpdateAvailable(hasUpdate);
      setIsChecking(false);
    }, 30000); // Check every 30 seconds

    // Initial check
    checkForUpdates().then(setUpdateAvailable);

    return () => clearInterval(checkInterval);
  }, []);

  const handleUpdate = async () => {
    setIsChecking(true);
    await forceCacheInvalidation();
  };

  if (!updateAvailable) {
    return (
      <div className="fixed bottom-4 right-4 text-xs text-gray-500 bg-white/80 backdrop-blur-sm rounded px-2 py-1 shadow-sm">
        v{buildInfo.version} • {new Date(buildInfo.buildTime).toLocaleTimeString()}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Alert className="max-w-sm bg-white shadow-lg border-l-4 border-l-emerald-500">
        <AlertTriangle className="h-4 w-4 text-emerald-600" />
        <AlertDescription className="text-sm">
          <div className="mb-2">
            A new version is available with the latest updates!
          </div>
          <Button
            onClick={handleUpdate}
            disabled={isChecking}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isChecking ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Now'
            )}
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default CacheManager;