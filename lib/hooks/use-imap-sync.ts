import { useState, useEffect } from "react";
import {
  ImapConnectionConfig,
  ImapSyncProgress,
  ImapSyncStats,
} from "@/lib/types/imap";
import { connectToImap, getMailboxList } from "@/lib/imap/imap-utils";

const getEstimatedTimeRemaining = (
  current: number,
  total: number
): string | null => {
  if (total === 0 || current === 0) return null;

  const remaining = total - current;
  const estimatedSeconds = remaining * 0.4; // Adjust this multiplier based on actual performance

  if (estimatedSeconds > 60) {
    return `about ${Math.ceil(estimatedSeconds / 60)} minutes`;
  } else {
    return `${Math.ceil(estimatedSeconds)} seconds`;
  }
};

interface ImapSyncStatus {
  syncState:
    | "idle"
    | "running"
    | "paused"
    | "completed"
    | "failed"
    | "waiting"
    | "connecting"
    | "copying"
    | "finalizing";
  progress: ImapSyncProgress;
  stats: ImapSyncStats;
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
      total: number;
      copied: number;
      skipped: number;
      errors: string[];
    };
    success: boolean;
    message?: string;
  }) => void;
}

export default function useImapSync({
  syncOptions,
  onSyncComplete,
}: UseImapSyncProps) {
  const [status, setStatus] = useState<ImapSyncStatus | null>(null);
  const [state, setState] = useState<ImapSyncStatus>({
    syncState: "idle",
    progress: {
      total: 0,
      current: 0,
      percentage: 0,
      estimatedTimeRemaining: null,
      status: "idle",
    },
    stats: {
      total: 0,
      copied: 0,
      skipped: 0,
      errors: [],
    },
  });

  const handleStartSync = async (
    sourceConfig: ImapConnectionConfig,
    destinationConfig: ImapConnectionConfig
  ) => {
    if (!sourceConfig || !destinationConfig) {
      console.error("Missing configuration");
      return;
    }

    try {
      setState((prev) => ({ ...prev, syncState: "running" }));
      // The actual sync is now handled by the API route
    } catch (error) {
      console.error("IMAP sync error:", error);
      setState((prev) => ({ ...prev, syncState: "failed" }));
    }
  };

  const handlePauseSync = () => {
    setState((prev) => ({ ...prev, syncState: "paused" }));
  };

  const handleResumeSync = () => {
    setState((prev) => ({ ...prev, syncState: "running" }));
  };

  const handleStopSync = () => {
    setState((prev) => ({ ...prev, syncState: "idle" }));
  };

  const handleReset = () => {
    setState({
      syncState: "idle",
      progress: {
        total: 0,
        current: 0,
        percentage: 0,
        estimatedTimeRemaining: null,
        status: "idle",
      },
      stats: {
        total: 0,
        copied: 0,
        skipped: 0,
        errors: [],
      },
    });
  };

  const handleProgressUpdate = (progress: ImapSyncProgress) => {
    setState((prev) => ({
      ...prev,
      progress: {
        ...progress,
        percentage: Math.round((progress.current / progress.total) * 100),
        estimatedTimeRemaining: getEstimatedTimeRemaining(
          progress.current,
          progress.total
        ),
      },
      stats: {
        ...prev.stats,
        total: progress.total,
        copied: progress.current,
        skipped: 0,
        errors: [],
      },
    }));
  };

  return {
    status,
    progress: state.progress,
    stats: state.stats,
    startSync: handleStartSync,
    pauseSync: handlePauseSync,
    resumeSync: handleResumeSync,
    stopSync: handleStopSync,
    resetSync: handleReset,
  };
}
