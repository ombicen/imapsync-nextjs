"use client";

import { useState, useEffect, useRef } from "react";
import {
  ImapConnectionConfig,
  NullableImapConnectionConfig,
  ImapSyncOptions,
  ImapSyncResults,
} from "@/app/dashboard/imap/types/imap";
import { ConnectionConfigSection } from "../connection/connection-config-section";
import { SyncOptionsSection } from "../config/sync-options-section";
import { SyncStatusSection } from "../sync/sync-status-section";

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
  const [syncProgress, setSyncProgress] = useState<number | undefined>(
    undefined
  );
  const [syncStats, setSyncStats] = useState<{
    totalMessages: number;
    processedMessages: number;
    errors: number;
    currentMailbox?: string;
  } | null>(null);
  const [syncLogs, setSyncLogs] = useState<
    { message: string; timestamp: string }[]
  >([]);
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

  // Reference to the AbortController for fetch requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reference to the current SSE session ID
  const sessionIdRef = useRef<string | null>(null);

  // Reference to the EventSource instance
  const eventSourceRef = useRef<EventSource | null>(null);

  // Function to generate a unique session ID
  const generateUniqueSessionId = () => {
    return "session-" + Math.random().toString(36).substr(2, 9);
  };

  // Setup EventSource when syncing starts/stops
  useEffect(() => {
    if (!isSyncing || !sessionIdRef.current) {
      // Clean up existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    console.log(`Setting up EventSource for session ${sessionIdRef.current}`);

    // Create URL and append config parameters if needed
    let sseUrl = `/api/imap/sse?sessionId=${sessionIdRef.current}`;

    // If we have source and destination configs, add them as base64 encoded params
    // This allows us to start the sync process from the SSE connection
    if (initialSourceConfig && initialDestinationConfig) {
      const sourceConfigEncoded = btoa(JSON.stringify(initialSourceConfig));
      const destConfigEncoded = btoa(JSON.stringify(initialDestinationConfig));
      const syncOptionsEncoded = syncOptions
        ? btoa(JSON.stringify(syncOptions))
        : "";

      sseUrl += `&startSync=true&sourceConfig=${encodeURIComponent(
        sourceConfigEncoded
      )}&destConfig=${encodeURIComponent(destConfigEncoded)}`;

      if (syncOptionsEncoded) {
        sseUrl += `&syncOptions=${encodeURIComponent(syncOptionsEncoded)}`;
      }
    }

    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    // Handle SSE message events
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("SSE data received:", data);

        // Update progress
        if (data.percentage !== undefined) {
          setSyncProgress(data.percentage);
        }

        // Update stats
        if (data.processedMessages !== undefined) {
          setSyncStats((prev) => ({
            processedMessages: data.processedMessages || 0,
            totalMessages: data.totalMessages || 0,
            processedMailboxes: data.processedMailboxes || 0,
            totalMailboxes: data.totalMailboxes || 0,
            errors: prev?.errors || 0,
            currentMailbox: data.currentMailbox,
          }));
        }

        // Update logs
        if (data.logs && data.logs.length > 0) {
          setSyncLogs((prev) => [...prev, ...data.logs]);
        }

        // Handle completion
        if (data.isComplete) {
          setSyncComplete(true);
          setIsSyncing(false);

          // Create summary
          setSyncSummary({
            mailboxes: data.mailboxes || [],
            startTime: data.startTime || new Date().toISOString(),
            endTime: data.endTime || new Date().toISOString(),
            elapsedTimeSeconds: data.elapsedTimeSeconds || 0,
          });

          if (es) {
            es.close();
            eventSourceRef.current = null;
          }
        }

        if (data.error) {
          setSyncError(data.error);
          setIsSyncing(false);
          if (es) {
            es.close();
            eventSourceRef.current = null;
          }
        }
      } catch (err) {
        console.error("Error parsing SSE message:", err);
      }
    };

    // Handle SSE errors
    es.onerror = (error) => {
      console.error("EventSource error:", error);
      setSyncError("Connection to server lost. Please try again.");
      setIsSyncing(false);
      if (es) {
        es.close();
        eventSourceRef.current = null;
      }
    };

    return () => {
      console.log("Cleaning up EventSource connection");
      es.close();
      eventSourceRef.current = null;
    };
  }, [isSyncing, initialSourceConfig, initialDestinationConfig, syncOptions]);

  // Setup and cleanup for fetch requests
  useEffect(() => {
    return () => {
      // Cleanup function to abort any pending requests when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleStartSync = async () => {
    console.log("Start sync button clicked");

    if (!initialSourceConfig || !initialDestinationConfig) {
      console.error("Source or destination config missing");
      return;
    }

    // Reset UI state for a new sync
    setSyncProgress(0);
    setSyncStats(null);
    setSyncLogs([]);
    setSyncError(null);
    setSyncComplete(false);
    setSyncSummary(null);

    // Abort any existing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      console.log("Calling /api/imap/sse endpoint to create session");
      const response = await fetch("/api/imap/sse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceConfig: initialSourceConfig,
          destinationConfig: initialDestinationConfig,
          syncOptions,
        }),
        signal: abortControllerRef.current.signal,
      });

      const data = await response.json();
      console.log("SSE session creation response:", data);

      if (data.error) {
        setSyncError(data.error);
        return;
      }

      if (data.sessionId) {
        // Store the session ID in the ref
        sessionIdRef.current = data.sessionId;
        setIsSyncing(true); // This will trigger the useEffect to establish the SSE connection
      } else {
        setSyncError("No session ID received from server");
      }
    } catch (error: any) {
      console.error("Error starting sync:", error);
      setSyncError(error.message || "Failed to start sync process");
    }
  };

  const handleStopSync = async () => {
    try {
      if (sessionIdRef.current) {
        const response = await fetch("/api/imap/sync/stop", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sessionIdRef.current }),
        });

        if (!response.ok) {
          throw new Error("Failed to stop sync process");
        }

        setSyncLogs((prev) => [
          ...prev,
          {
            message: "Sync process stopped successfully",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (error: any) {
      console.error("Error stopping sync:", error);
      setSyncLogs((prev) => [
        ...prev,
        {
          message: `Error stopping sync: ${error.message}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSyncing(false);
      sessionIdRef.current = null;
    }
  };

  const handleReset = () => {
    setSyncComplete(false);
    setSyncProgress(undefined);
    setSyncStats(null);
    setSyncSummary(null);
    setSyncLogs([]);
    setSyncError(null);

    // Abort any pending fetch requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // The EventSource will be closed in the useEffect cleanup
    sessionIdRef.current = null;
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
            <SyncOptionsSection
              syncOptions={syncOptions}
              onOptionsChange={setSyncOptions}
            />
          </div>
        </div>
        <div className="space-y-8">
          <div>
            <ConnectionConfigSection
              title="Destination Server"
              config={initialDestinationConfig}
              showForm={showDestinationForm}
              onToggleForm={() => setShowDestinationForm(!showDestinationForm)}
              onSubmit={onDestinationConfigChange}
            />
          </div>
          <div>
            <SyncStatusSection
              isSyncing={isSyncing}
              syncProgress={syncProgress}
              syncStats={syncStats}
              syncLogs={syncLogs}
              syncError={syncError}
              syncComplete={syncComplete}
              syncSummary={syncSummary}
              onSyncStart={handleStartSync}
              onSyncStop={handleStopSync}
              onReset={handleReset}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
