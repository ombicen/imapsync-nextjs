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
          case 'complete':
            setIsSyncing(false);
            syncWorker.terminate();
            setSyncWorker(null);
            break;
          case 'error':
            console.error('IMAP sync error:', data);
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
    try {
      const worker = new Worker('/imap-sync-worker.js');
      setSyncWorker(worker);
      
      // Send the sync configuration to the worker
      worker.postMessage({
        sourceConfig: sourceConnectionConfig,
        destinationConfig: destinationConnectionConfig,
        syncOptions,
      });
    } catch (error) {
      console.error('Error during IMAP sync:', error);
      setIsSyncing(false);
    }
  };

  const handleStopSync = () => {
    if (syncWorker) {
      syncWorker.terminate();
      setSyncWorker(null);
      setIsSyncing(false);
    }
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
