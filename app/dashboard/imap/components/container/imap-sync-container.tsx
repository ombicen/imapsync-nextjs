'use client';

import { useState, useEffect } from 'react';
import { ImapConnectionConfig, NullableImapConnectionConfig, ImapSyncOptions, ImapSyncProgress, ImapSyncStats, ImapSyncResults, ImapSyncState } from '@/app/dashboard/imap/types/imap';
import { ConnectionConfigSection } from '../connection/connection-config-section';
import { SyncOptionsSection } from '../config/sync-options-section';
import { SyncStatusSection } from '../sync/sync-status-section';
import { syncImap } from '@/app/dashboard/imap/actions/sync-imap';

interface ImapSyncContainerProps {
  sourceConfig: NullableImapConnectionConfig;
  destinationConfig: NullableImapConnectionConfig;
  onSyncComplete?: (results: ImapSyncResults) => void;
}

export function ImapSyncContainer({
  sourceConfig: initialSourceConfig,
  destinationConfig: initialDestinationConfig,
  onSyncComplete,
}: ImapSyncContainerProps) {
  const [showSourceForm, setShowSourceForm] = useState(true);
  const [showDestinationForm, setShowDestinationForm] = useState(true);
  const [syncOptions, setSyncOptions] = useState<ImapSyncOptions>({
    batchSize: 100,
    maxRetries: 3,
    retryDelay: 5000,
    dryRun: false,
    skipExistingMessages: false,
    calculateStats: true,
  });

  const [sourceConnectionConfig, setSourceConnectionConfig] = useState<NullableImapConnectionConfig>(initialSourceConfig);
  const [destinationConnectionConfig, setDestinationConnectionConfig] = useState<NullableImapConnectionConfig>(initialDestinationConfig);

  const isConfigComplete = !!sourceConnectionConfig && !!destinationConnectionConfig;
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<number | undefined>(undefined);
  const [syncStats, setSyncStats] = useState<{
    totalMessages: number;
    processedMessages: number;
    errors: number;
  } | null>(null);
  const [syncWorker, setSyncWorker] = useState<Worker | null>(null);
  const [syncLogs, setSyncLogs] = useState<{message: string; timestamp: string}[]>([]);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncComplete, setSyncComplete] = useState(false);
  const [syncSummary, setSyncSummary] = useState<{
    mailboxes: Array<{
      name: string;
      totalMessages: number;
      syncedMessages: number;
      skippedMessages: number;
    }>;
    startTime: string;
    endTime: string;
    elapsedTimeSeconds: number;
  } | null>(null);

  useEffect(() => {
    if (syncWorker) {
      syncWorker.onmessage = (event) => {
        const { type, data } = event.data;
        switch (type) {
          case 'progress':
            setSyncProgress(data.percentage);
            break;
          case 'stats':
            setSyncStats({
              totalMessages: data.total,
              processedMessages: data.processed,
              errors: data.errors,
            });
            break;
          case 'log':
            console.log('Worker log:', data.message, data.data);
            setSyncLogs(prev => [...prev, {message: data.message, timestamp: data.timestamp}]);
            break;
          case 'complete':
            setIsSyncing(false);
            syncWorker.terminate();
            setSyncWorker(null);
            break;
          case 'error':
            console.error('IMAP sync error:', data);
            setSyncError(typeof data === 'string' ? data : JSON.stringify(data));
            setIsSyncing(false);
            syncWorker.terminate();
            setSyncWorker(null);
            break;
        }
      };
    }
  }, [syncWorker]);

  const handleStartSync = async () => {
    if (!sourceConnectionConfig || !destinationConnectionConfig) return;
    
    setIsSyncing(true);
    setSyncError(null);
    setSyncLogs([]);
    setSyncProgress(0);
    
    try {
      // Log the start of the sync process
      const startTime = new Date().toISOString();
      setSyncLogs(prev => [...prev, {message: 'Starting IMAP sync process', timestamp: startTime}]);
      
      // Call the API endpoint to perform the sync
      const response = await fetch('/api/imap/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceConfig: sourceConnectionConfig,
          destinationConfig: destinationConnectionConfig,
          syncOptions,
        }),
      });
      
      const data = await response.json();
      
      if (data.type === 'error') {
        setSyncError(data.message);
        setSyncLogs(prev => [...prev, {message: `Error: ${data.message}`, timestamp: new Date().toISOString()}]);
      } else {
        // Update stats and progress
        setSyncLogs(prev => [...prev, {message: 'Sync completed successfully', timestamp: new Date().toISOString()}]);
        setSyncProgress(100);
        setSyncComplete(true);
        
        if (data.stats) {
          setSyncStats({
            totalMessages: data.stats.totalEmails || 0,
            processedMessages: data.stats.syncedEmails || 0,
            errors: data.stats.errors?.length || 0,
          });
          
          // Set detailed sync summary
          if (data.stats.mailboxes && data.stats.startTime && data.stats.endTime) {
            setSyncSummary({
              mailboxes: data.stats.mailboxes,
              startTime: data.stats.startTime,
              endTime: data.stats.endTime,
              elapsedTimeSeconds: data.stats.elapsedTimeSeconds || 0
            });
          }
          
          // Log detailed stats
          setSyncLogs(prev => [...prev, {
            message: `Synced ${data.stats.syncedEmails} of ${data.stats.totalEmails} messages from ${data.stats.processedMailboxes} mailboxes in ${data.stats.elapsedTimeSeconds || 0} seconds`,
            timestamp: new Date().toISOString()
          }]);
          
          if (data.stats.errors?.length > 0) {
            data.stats.errors.forEach((error: string) => {
              setSyncLogs(prev => [...prev, {message: `Error: ${error}`, timestamp: new Date().toISOString()}]);
            });
          }
        }
      }
    } catch (error) {
      console.error('Error during IMAP sync:', error);
      setSyncError(error instanceof Error ? error.message : 'Failed to connect to sync API');
      setSyncLogs(prev => [...prev, {message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, timestamp: new Date().toISOString()}]);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleStopSync = () => {
    // Since we're using an API endpoint now, we can't actually stop the sync process
    // once it's started. We can only update the UI to reflect that we're no longer syncing.
    setIsSyncing(false);
    setSyncLogs(prev => [...prev, {message: 'Sync process cancelled by user', timestamp: new Date().toISOString()}]);
  };
  
  const handleReset = () => {
    setSyncComplete(false);
    setSyncProgress(undefined);
    setSyncStats(null);
    setSyncSummary(null);
    setSyncLogs([]);
    setSyncError(null);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div>
              <ConnectionConfigSection
              title="Source Server"
              config={sourceConnectionConfig}
              showForm={showSourceForm}
              onToggleForm={() => setShowSourceForm(!showSourceForm)}
              onSubmit={setSourceConnectionConfig}
            />
          </div>
          <div>
             <ConnectionConfigSection
              title="Destination Server"
              config={destinationConnectionConfig}
              showForm={showDestinationForm}
              onToggleForm={() => setShowDestinationForm(!showDestinationForm)}
              onSubmit={setDestinationConnectionConfig}
            />
          </div>
        </div>
        <div className="space-y-8">
          <div>
            <SyncOptionsSection
              syncOptions={syncOptions}
              onOptionsChange={setSyncOptions}
            />
          </div>
          <div>
            <SyncStatusSection
              isSyncing={isSyncing}
              onSyncStart={handleStartSync}
              onSyncStop={handleStopSync}
              syncProgress={syncProgress}
              syncStats={syncStats}
              syncLogs={syncLogs}
              syncError={syncError}
              syncComplete={syncComplete}
              syncSummary={syncSummary}
              onReset={handleReset}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
