'use client';

import { useState } from 'react';
import { ImapConnectionConfig, NullableImapConnectionConfig, ImapSyncOptions, ImapSyncProgress, ImapSyncStats, ImapSyncResults, ImapSyncState } from '@/app/dashboard/imap/types/imap';
import { ConnectionConfigSection } from '../connection/connection-config-section';
import { SyncOptionsSection } from '../config/sync-options-section';
import { SyncStatusSection } from '../sync/sync-status-section';
import { syncImap } from '@/app/dashboard/imap/actions/sync-imap';

interface ImapSyncContainerProps {
  sourceConfig: NullableImapConnectionConfig;
  destinationConfig: NullableImapConnectionConfig;
  onSourceConfigChange: (config: ImapConnectionConfig) => void;
  onDestinationConfigChange: (config: ImapConnectionConfig) => void;
  onSyncComplete?: (results: ImapSyncResults) => void;
}

export function ImapSyncContainer({
  sourceConfig: initialSourceConfig,
  destinationConfig: initialDestinationConfig,
  onSourceConfigChange,
  onDestinationConfigChange,
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

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<number | undefined>(undefined);
  const [syncStats, setSyncStats] = useState<{
    totalMessages: number;
    processedMessages: number;
    errors: number;
  } | null>(null);
  const [syncWorker, setSyncWorker] = useState<Worker | null>(null);

  const handleStartSync = async () => {
    if (!initialSourceConfig || !initialDestinationConfig) return;
    
    setIsSyncing(true);
    try {
      const worker = new Worker('/imap-sync-worker.js');
      setSyncWorker(worker);
      
      worker.postMessage({
        sourceConfig: initialSourceConfig,
        destinationConfig: initialDestinationConfig,
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
              config={initialSourceConfig}
              showForm={showSourceForm}
              onToggleForm={() => setShowSourceForm(!showSourceForm)}
              onSubmit={onSourceConfigChange}
            />
          </div>
          <div>
            <ConnectionConfigSection
              title="Destination Server"
              config={initialDestinationConfig}
              showForm={showDestinationForm}
              onToggleForm={() => setShowDestinationForm(!showDestinationForm)}
              onSubmit={onDestinationConfigChange}
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