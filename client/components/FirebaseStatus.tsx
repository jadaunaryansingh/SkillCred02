import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, RefreshCw, Database, CloudOff } from 'lucide-react';
import { SentimentService } from '@/lib/firebase-db';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

export default function FirebaseStatus() {
  const [status, setStatus] = useState<'checking' | 'accessible' | 'inaccessible'>('checking');
  const [error, setError] = useState<string>('');
  const [syncing, setSyncing] = useState(false);
  const [localRecordCount, setLocalRecordCount] = useState(0);
  const [user] = useAuthState(auth);

  useEffect(() => {
    checkFirebaseStatus();
  }, []);

  const checkFirebaseStatus = async () => {
    setStatus('checking');
    try {
      const accessCheck = await SentimentService.checkFirebaseAccess();
      if (accessCheck.accessible) {
        setStatus('accessible');
        setError('');
      } else {
        setStatus('inaccessible');
        setError(accessCheck.error || 'Unknown error');
      }
    } catch (err) {
      setStatus('inaccessible');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const attemptRestore = async () => {
    if (!user) return;
    
    setSyncing(true);
    try {
      const result = await SentimentService.attemptFirebaseRestore(user.uid);
      if (result.success) {
        setStatus('accessible');
        setError('');
        // Refresh the status
        await checkFirebaseStatus();
      } else {
        setError('Firebase is still not accessible. Please check your permissions.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error during restore');
    } finally {
      setSyncing(false);
    }
  };

  const getLocalRecordCount = async () => {
    if (!user) return;
    
    try {
      const localRecords = await SentimentService.getLocalSentimentRecords(user.uid);
      setLocalRecordCount(localRecords.length);
    } catch (err) {
      console.error('Error getting local record count:', err);
    }
  };

  useEffect(() => {
    if (user && status === 'inaccessible') {
      getLocalRecordCount();
    }
  }, [user, status]);

  if (!user) return null;

  return (
    <Card className="border-rcb-red/30 bg-rcb-black-light/50 backdrop-blur-xl shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Database className="h-5 w-5" />
          Firebase Connection Status
        </CardTitle>
        <CardDescription className="text-gray-400">
          Monitor your Firebase connection and sync local data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status === 'checking' && (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-yellow-400" />
                <span className="text-yellow-400">Checking connection...</span>
              </>
            )}
            {status === 'accessible' && (
              <>
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-green-400">Connected to Firebase</span>
              </>
            )}
            {status === 'inaccessible' && (
              <>
                <CloudOff className="h-4 w-4 text-red-400" />
                <span className="text-red-400">Firebase not accessible</span>
              </>
            )}
          </div>
          
          <Badge 
            variant={status === 'accessible' ? 'default' : 'destructive'}
            className={status === 'accessible' ? 'bg-green-600' : 'bg-red-600'}
          >
            {status === 'checking' ? 'Checking' : status === 'accessible' ? 'Online' : 'Offline'}
          </Badge>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-900/20 border border-red-500/30">
            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-300">
              <p className="font-medium">Connection Error:</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Local Data Info */}
        {status === 'inaccessible' && localRecordCount > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-900/20 border border-blue-500/30">
            <Database className="h-4 w-4 text-blue-400" />
            <div className="text-sm text-blue-300">
              <p>You have <span className="font-medium">{localRecordCount}</span> local sentiment records</p>
              <p className="text-xs text-blue-400">These will be synced when Firebase access is restored</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={checkFirebaseStatus}
            variant="outline"
            size="sm"
            className="border-rcb-red/30 text-white hover:bg-rcb-red/10 hover:border-rcb-red"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Status
          </Button>
          
          {status === 'inaccessible' && (
            <Button
              onClick={attemptRestore}
              disabled={syncing}
              size="sm"
              className="bg-gradient-to-r from-rcb-red to-rcb-red-bright hover:from-rcb-red-bright hover:to-rcb-red-glow text-white"
            >
              {syncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Attempt Restore
                </>
              )}
            </Button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500">
          {status === 'inaccessible' && (
            <p>
              Your sentiment analysis results are being saved locally. 
              When Firebase access is restored, they will be automatically synced.
            </p>
          )}
          {status === 'accessible' && (
            <p>
              Firebase is working correctly. All data is being saved to the cloud.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
