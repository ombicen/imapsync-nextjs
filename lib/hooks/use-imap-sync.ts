import { useState, useEffect } from 'react';
import { 
  ImapSyncState, 
  ImapConnectionConfig, 
  ImapSyncOptions,
  SyncProgress, 
  SyncResults 
} from "@/lib/types/imap";
import {
  connectToImap,
  getMailboxList,
  syncMailbox,
} from "@/lib/imap/imap-utils";

const getEstimatedTimeRemaining = (current: number, total: number): string | null => {
  if (total === 0 || current === 0) return null;
  
  const remaining = total - current;
  const estimatedSeconds = remaining * 0.4; // Adjust this multiplier based on actual performance
  
  if (estimatedSeconds > 60) {
    return `about ${Math.ceil(estimatedSeconds / 60)} minutes`;
  } else {
    return `${Math.ceil(estimatedSeconds)} seconds`;
  }
};

interface ImapSyncState {
  syncState: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  progress: {
    total: number;
    current: number;
    percentage: number;
    estimatedTimeRemaining: string | null;
    status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  };
  stats: {
    totalEmails: number;
    syncedEmails: number;
    skippedEmails: number;
    errors: string[];
  };
}

export interface UseImapSyncProps {
  syncOptions: {
    batchSize: number;
    maxRetries: number;
    retryDelay: number;
    dryRun: boolean;
  };
  onSyncComplete?: (results: {
    stats: {
      totalEmails: number;
      syncedEmails: number;
      skippedEmails: number;
      errors: string[];
    };
    success: boolean;
    message?: string;
  }) => void;
}

export function useImapSync({ syncOptions, onSyncComplete }: UseImapSyncProps) {
  const [state, setState] = useState<ImapSyncState>({
    syncState: 'idle',
    progress: {
      total: 0,
      current: 0,
      percentage: 0,
      estimatedTimeRemaining: null,
      status: "idle",
    },
    stats: {
      totalEmails: 0,
      syncedEmails: 0,
      skippedEmails: 0,
      errors: [],
    },
  });

  const handleStartSync = async (sourceConfig: ImapConnectionConfig, destinationConfig: ImapConnectionConfig) => {
    if (!sourceConfig || !destinationConfig) {
      console.error('Missing configuration');
      return;
    }

    try {
      setState(prev => ({ ...prev, syncState: 'running' }));
      // The actual sync is now handled by the API route
    } catch (error) {
      console.error('IMAP sync error:', error);
      setState(prev => ({ ...prev, syncState: 'failed' }));
    }
  };

  const handlePauseSync = () => {
    setState(prev => ({ ...prev, syncState: 'paused' }));
  };

  const handleResumeSync = () => {
    setState(prev => ({ ...prev, syncState: 'running' }));
  };

  const handleStopSync = () => {
    setState(prev => ({ ...prev, syncState: 'idle' }));
  };

  const handleReset = () => {
    setState({
      syncState: 'idle',
      progress: {
        total: 0,
        current: 0,
        percentage: 0,
        estimatedTimeRemaining: null,
        status: "idle",
      },
      stats: {
        totalEmails: 0,
        syncedEmails: 0,
        skippedEmails: 0,
        errors: [],
      },
    });
  };

  return {
    syncState: state.syncState,
    progress: state.progress,
    stats: state.stats,
    handleStartSync,
    handlePauseSync,
    handleResumeSync,
    handleStopSync,
    handleReset,
  };
}
