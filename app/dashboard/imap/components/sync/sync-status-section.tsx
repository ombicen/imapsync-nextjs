"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SyncStatusSectionProps {
  isSyncing: boolean;
  onSyncStart: () => void;
  onSyncStop: () => void;
  syncProgress?: number;
  syncStats?: {
    totalMessages: number;
    processedMessages: number;
    errors: number;
    currentMailbox?: string; // Add current mailbox property
  } | null;
  syncLogs?: { message: string; timestamp: string }[];
  syncError?: string | null;
  syncComplete?: boolean;
  syncSummary?: {
    mailboxes: Array<{
      name: string;
      totalMessages: number;
      syncedMessages: number;
      skippedMessages: number;
    }>;
    startTime: string;
    endTime: string;
    elapsedTimeSeconds: number;
  } | null;
  onReset?: () => void;
}

// Helper function to calculate estimated time remaining
function calculateTimeRemaining(
  processed: number,
  total: number,
  logs: { message: string; timestamp: string }[]
): string {
  if (logs.length < 2 || processed === 0) return "Calculating...";

  // Get the start time from the first log
  const startTime = new Date(logs[0].timestamp).getTime();
  // Get the current time from the latest log
  const currentTime = new Date(logs[logs.length - 1].timestamp).getTime();

  // Calculate elapsed time in seconds
  const elapsedSeconds = (currentTime - startTime) / 1000;

  // Calculate rate of messages per second
  const rate = processed / elapsedSeconds;

  // If rate is too low, return calculating
  if (rate < 0.01) return "Calculating...";

  // Calculate remaining time
  const remaining = (total - processed) / rate;

  // Format the time
  if (remaining < 60) {
    return `${Math.ceil(remaining)} seconds`;
  } else if (remaining < 3600) {
    return `${Math.ceil(remaining / 60)} minutes`;
  } else {
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.ceil((remaining % 3600) / 60);
    return `${hours} hours ${minutes} minutes`;
  }
}

export function SyncStatusSection({
  isSyncing,
  onSyncStart,
  onSyncStop,
  syncProgress = 0,
  syncStats,
  syncLogs = [],
  syncError,
  syncComplete,
  syncSummary,
  onReset,
}: SyncStatusSectionProps) {
  // Create references for the event log containers
  const syncingLogRef = useRef<HTMLDivElement>(null);
  const completedLogRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom when new entries are added
  useEffect(() => {
    if (syncingLogRef.current) {
      syncingLogRef.current.scrollTo({
        top: syncingLogRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
    if (completedLogRef.current) {
      completedLogRef.current.scrollTo({
        top: completedLogRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [syncLogs]);
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Sync Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-4">
            {!isSyncing && !syncComplete && (
              <div className="space-y-4">
                <Alert>
                  <AlertDescription className="text-center">
                    Configure both IMAP servers and start the sync process
                  </AlertDescription>
                </Alert>
                <Button onClick={onSyncStart} className="w-full">
                  Start Sync
                </Button>
              </div>
            )}

            {!isSyncing && syncComplete && syncSummary && (
              <div className="space-y-6">
                <Alert
                  variant="default"
                  className="bg-green-50 border-green-200"
                >
                  <AlertDescription className="text-center text-green-700">
                    Sync completed successfully!
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-sm font-medium">Start Time</div>
                      <div className="text-sm">
                        {new Date(syncSummary.startTime).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-sm font-medium">End Time</div>
                      <div className="text-sm">
                        {new Date(syncSummary.endTime).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-sm font-medium">Total Duration</div>
                    <div className="text-lg font-bold">
                      {syncSummary.elapsedTimeSeconds} seconds
                    </div>
                  </div>

                  <div className="border rounded-md overflow-hidden">
                    <div className="bg-gray-100 p-2 font-medium">
                      Mailbox Summary
                    </div>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="p-2 text-left">Mailbox</th>
                          <th className="p-2 text-right">Total</th>
                          <th className="p-2 text-right">Synced</th>
                          <th className="p-2 text-right">Skipped</th>
                        </tr>
                      </thead>
                      <tbody>
                        {syncSummary.mailboxes.map((mailbox, index) => (
                          <tr
                            key={index}
                            className={
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            <td className="p-2 border-t">{mailbox.name}</td>
                            <td className="p-2 border-t text-right">
                              {mailbox.totalMessages}
                            </td>
                            <td className="p-2 border-t text-right">
                              {mailbox.syncedMessages}
                            </td>
                            <td className="p-2 border-t text-right">
                              {mailbox.skippedMessages}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {syncStats && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-sm font-medium">
                          Total Messages
                        </div>
                        <div className="text-lg font-bold">
                          {syncStats.totalMessages}
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-sm font-medium">Synced</div>
                        <div className="text-lg font-bold">
                          {syncStats.processedMessages}
                        </div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-sm font-medium">Errors</div>
                        <div className="text-lg font-bold">
                          {syncStats.errors}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Event log in completion view */}
                  {syncLogs && syncLogs.length > 0 && (
                    <div
                      ref={completedLogRef}
                      className="w-full max-h-60 overflow-y-auto border rounded p-2 text-xs bg-gray-50"
                    >
                      <div className="font-medium text-gray-700 mb-2 pb-1 border-b">
                        Event Log
                      </div>
                      {syncLogs.map((log, index) => (
                        <div key={index} className="mb-1 break-words">
                          <span className="text-gray-500 font-mono">
                            [{new Date(log.timestamp).toLocaleTimeString()}]
                          </span>{" "}
                          {log.message}
                        </div>
                      ))}
                    </div>
                  )}

                  <Button onClick={onReset} className="w-full">
                    Start New Sync
                  </Button>
                </div>
              </div>
            )}
            {isSyncing && (
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Syncing in progress...</span>
                </div>
                {syncProgress !== undefined && (
                  <div className="w-full">
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${syncProgress}%` }}
                      />
                    </div>
                    <div className="text-xs text-center mt-1">
                      {syncProgress}% complete
                    </div>
                  </div>
                )}
                {syncStats && (
                  <div className="space-y-4">
                    {/* Current mailbox indicator */}
                    {syncStats.currentMailbox && (
                      <div className="text-center p-2 bg-blue-50 border border-blue-200 rounded">
                        <div className="text-sm font-medium text-blue-700">
                          Current Mailbox
                        </div>
                        <div className="text-md font-bold text-blue-800">
                          {syncStats.currentMailbox}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm font-medium">
                          Total Messages
                        </div>
                        <div className="text-lg font-bold">
                          {syncStats.totalMessages}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">Processed</div>
                        <div className="text-lg font-bold">
                          {syncStats.processedMessages}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium">Errors</div>
                        <div className="text-lg font-bold">
                          {syncStats.errors}
                        </div>
                      </div>
                    </div>

                    {/* Estimated time remaining */}
                    {syncStats.processedMessages > 0 &&
                      syncStats.totalMessages > 0 && (
                        <div className="text-center p-2 bg-gray-50 rounded">
                          <div className="text-sm font-medium">
                            Estimated Time Remaining
                          </div>
                          <div className="text-md">
                            {calculateTimeRemaining(
                              syncStats.processedMessages,
                              syncStats.totalMessages,
                              syncLogs
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}
                {syncError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>Error: {syncError}</AlertDescription>
                  </Alert>
                )}

                {syncLogs.length > 0 && (
                  <div
                    ref={syncingLogRef}
                    className="mt-4 w-full max-h-60 overflow-y-auto border rounded p-2 text-xs bg-gray-50"
                  >
                    <div className="font-medium text-gray-700 mb-2 pb-1 border-b">
                      Event Log
                    </div>
                    {syncLogs.map((log, index) => (
                      <div key={index} className="mb-1 break-words">
                        <span className="text-gray-500 font-mono">
                          [{new Date(log.timestamp).toLocaleTimeString()}]
                        </span>{" "}
                        {log.message}
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  variant="destructive"
                  onClick={onSyncStop}
                  className="w-full mt-4"
                >
                  Stop Sync
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
